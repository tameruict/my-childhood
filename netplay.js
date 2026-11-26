// language: JavaScript, file: netplay.js, target: HTML5 Browser Real-Time WebSocket Netplay Client (BVN SocketInputBitCodec)
// Connects to server.js /ws for Web Room Creation, Pre-Match Lobby, Quick Match, Live Room Browser, Synced Pick, and 60FPS PvP!

(function () {
  'use strict';

  // Exact 11-bit BVN input bitmask (mirrors SocketInputBitCodec.as)
  function encodeInputBits(ctrl) {
    let m = 0;
    if (ctrl.up) m |= 1 << 0;
    if (ctrl.down) m |= 1 << 1;
    if (ctrl.left) m |= 1 << 2;
    if (ctrl.right) m |= 1 << 3;
    if (ctrl.attack) m |= 1 << 4;
    if (ctrl.jump) m |= 1 << 5;
    if (ctrl.dash) m |= 1 << 6;
    if (ctrl.skill) m |= 1 << 7;
    if (ctrl.bisha) m |= 1 << 8;
    if (ctrl.assist) m |= 1 << 9;
    if (ctrl.awaken) m |= 1 << 10;
    return m;
  }

  function decodeInputBits(m) {
    return {
      up: Boolean(m & (1 << 0)),
      down: Boolean(m & (1 << 1)),
      left: Boolean(m & (1 << 2)),
      right: Boolean(m & (1 << 3)),
      attack: Boolean(m & (1 << 4)),
      jump: Boolean(m & (1 << 5)),
      dash: Boolean(m & (1 << 6)),
      skill: Boolean(m & (1 << 7)),
      bisha: Boolean(m & (1 << 8)),
      assist: Boolean(m & (1 << 9)),
      awaken: Boolean(m & (1 << 10))
    };
  }

  const ROOM_CODE_RE = /^[A-Z0-9]{4,8}$/;
  const STATIC_HOST_SUFFIXES = ['.vercel.app', '.netlify.app', '.pages.dev', '.github.io'];
  const BACKOFF_SCHEDULE_MS = [1000, 1500, 2200, 3200, 4500, 6000, 8000];
  const MAX_LONG_BACKOFF_MS = 12000;
  const CONNECT_TIMEOUT_MS = 10000;
  const WAKE_THRESHOLD_MS = 3200;
  const HEARTBEAT_INTERVAL_MS = 4000;
  const DEAD_SOCKET_TIMEOUT_MS = 14000;
  const VISIBILITY_PROBE_TIMEOUT_MS = 5000;
  const PENDING_ACTION_TIMEOUT_MS = 6500;

  function normalizeFormat(fmt) {
    return String(fmt || '').trim().toLowerCase() === '3v3' ? '3v3' : '1v1';
  }

  function normalizeVisibility(vis) {
    return String(vis || '').trim().toLowerCase() === 'private' ? 'private' : 'public';
  }

  function normalizeRoomCode(raw) {
    return String(raw || '')
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '');
  }

  function sanitizeRoomName(raw) {
    if (typeof raw !== 'string') return '';
    return raw.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 32);
  }

  function sanitizePassword(raw) {
    if (typeof raw !== 'string') return '';
    return raw.replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 24);
  }

  function sanitizeProfile(profile) {
    const src = profile && typeof profile === 'object' ? profile : {};
    const nickname = String(src.nickname || 'Fighter')
      .replace(/[\u0000-\u001f\u007f]/g, '')
      .trim()
      .slice(0, 18) || 'Fighter';
    const tag = String(src.tag || '#1000')
      .replace(/[\u0000-\u001f\u007f]/g, '')
      .trim()
      .slice(0, 8) || '#1000';
    const rawElo = Number(src.elo);
    const elo = Number.isFinite(rawElo) ? Math.max(0, Math.min(9999, Math.round(rawElo))) : 1200;
    return { nickname, tag, elo };
  }

  function normalizeWsUrlLocal(raw) {
    if (!raw || typeof raw !== 'string') return '';
    const trimmed = raw.trim();
    if (!trimmed) return '';
    try {
      const withScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmed)
        ? trimmed
        : `https://${trimmed}`;
      const u = new URL(withScheme);
      if (u.protocol === 'https:') u.protocol = 'wss:';
      else if (u.protocol === 'http:') u.protocol = 'ws:';
      if (u.protocol !== 'ws:' && u.protocol !== 'wss:') return '';
      if (!u.pathname || u.pathname === '/') u.pathname = '/ws';
      else if (u.pathname.length > 1) u.pathname = u.pathname.replace(/\/+$/, '');
      return u.toString();
    } catch (_) {
      return '';
    }
  }

  function isKnownStaticHost(hostname) {
    const h = String(hostname || '').toLowerCase();
    return STATIC_HOST_SUFFIXES.some((suffix) => h.endsWith(suffix));
  }

  function computePingQuality(ms) {
    if (!Number.isFinite(ms) || ms <= 0) return 'unknown';
    if (ms <= 65) return 'good';
    if (ms <= 145) return 'fair';
    return 'poor';
  }

  class BvnNetplayClient {
    constructor() {
      this.ws = null;
      this.wsUrl = '';
      this.httpBaseUrl = '';
      this.connected = false;
      this.connectionState = 'idle'; // idle | connecting | waking | connected | reconnecting | offline
      this.wsOriginMode = 'local'; // local | remote | unconfigured_remote
      this.deploymentMode = 'local';

      this.clientId = null;
      this.roomState = 'idle'; // idle | creating | joining | quick_queue | waiting | lobby | selecting | playing
      this.roomCode = null;
      this.slot = 0; // 1 = Host (P1), 2 = Guest (P2)
      this.role = null; // null | 'host' | 'guest'
      this.matchFormat = '1v1';
      this.roomInfo = null;
      this.inQuickQueue = false;

      this.onlineCount = 0;
      this.pingMs = 0;
      this.pingQuality = 'unknown';
      this.lanUrls = [];
      this.rooms = [];
      this.listeners = new Map();

      // Connection & cold-start timers
      this.manualDisconnect = false;
      this.reconnectAttempt = 0;
      this.nextRetryMs = 0;
      this.connectStartedAt = 0;
      this.lastStatusReason = '';
      this.reconnectTimer = null;
      this.connectTimeoutTimer = null;
      this.wakeThresholdTimer = null;
      this.wakeTickTimer = null;
      this.wakeProbePromise = null;
      this.wakeProbeAbort = null;

      // Heartbeat & dead-socket tracking
      this.pingTimer = null;
      this.visibilityProbeTimer = null;
      this.lastInboundAt = 0;

      // In-flight action & invite state
      this.pendingAction = null;
      this.pendingActionTimer = null;
      this.lastJoinAttemptCode = null;
      this.pendingInviteCode = null;
      this.joiningFromInvite = false;

      // Battle input state (60FPS host/guest sync)
      this.profile = { nickname: 'Fighter', tag: '#1000', elo: 1200 };
      this.remoteInputState = decodeInputBits(0);
      this.remoteEdgeQueue = 0;
      this.lastSentHeld = -1;

      this.isFileProtocol = typeof window !== 'undefined' &&
        Boolean(window.location) &&
        window.location.protocol === 'file:';

      this._bindBrowserLifecycle();
    }

    get isHost() {
      return this.slot === 1 && Boolean(this.roomCode);
    }

    get isGuest() {
      return this.slot === 2 && Boolean(this.roomCode);
    }

    get isInRoom() {
      return Boolean(this.roomCode);
    }

    get isWaking() {
      return this.connectionState === 'waking';
    }

    getState() {
      return {
        connectionState: this.connectionState,
        connected: this.connected,
        waking: this.isWaking,
        wsUrl: this.wsUrl,
        httpBaseUrl: this.httpBaseUrl,
        mode: this.wsOriginMode,
        deploymentMode: this.deploymentMode,
        clientId: this.clientId,
        onlineCount: this.onlineCount,
        pingMs: this.pingMs,
        pingQuality: this.pingQuality,
        roomState: this.roomState,
        roomCode: this.roomCode,
        slot: this.slot,
        role: this.role,
        matchFormat: this.matchFormat,
        roomInfo: this.roomInfo,
        inQuickQueue: this.inQuickQueue,
        rooms: this.rooms,
        lanUrls: this.lanUrls,
        pendingInviteCode: this.pendingInviteCode
      };
    }

    on(event, fn) {
      if (!this.listeners.has(event)) this.listeners.set(event, new Set());
      this.listeners.get(event).add(fn);
      return () => {
        const set = this.listeners.get(event);
        if (set) set.delete(fn);
      };
    }

    emit(event, data) {
      const set = this.listeners.get(event);
      if (!set || set.size === 0) return;
      for (const fn of Array.from(set)) {
        try {
          fn(data);
        } catch (err) {
          console.error('[Netplay] Listener error:', event, err);
        }
      }
    }

    // ==================== CONFIG & URL RESOLUTION ====================

    _getDeployConfig() {
      const cfg = (typeof window !== 'undefined' && window.GAME_DEPLOY_CONFIG) || {};
      const rawOverride = (typeof window !== 'undefined' && typeof window.NETPLAY_WS_URL === 'string')
        ? window.NETPLAY_WS_URL
        : '';
      const configuredWs = normalizeWsUrlLocal(cfg.NETPLAY_WS_URL || rawOverride || '');
      const hasRemoteWs = Boolean(configuredWs);
      const isLocalHost = Boolean(cfg.IS_LOCAL_HOST);

      let mode = cfg.WS_ORIGIN_MODE;
      if (hasRemoteWs) {
        mode = 'remote';
      } else if (!mode) {
        mode = isLocalHost ? 'local' : 'unconfigured_remote';
      }

      return {
        configuredWs,
        hasRemoteWs,
        isLocalHost,
        mode
      };
    }

    resolveWsUrl() {
      const { configuredWs, hasRemoteWs, mode } = this._getDeployConfig();
      this.wsOriginMode = mode;

      if (hasRemoteWs) {
        return configuredWs;
      }

      if (this.isFileProtocol || typeof window === 'undefined' || !window.location) {
        return '';
      }

      if (mode === 'unconfigured_remote' && isKnownStaticHost(window.location.hostname)) {
        return '';
      }

      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${proto}//${window.location.host}/ws`;
    }

    resolveHttpBaseUrl() {
      const cfg = (typeof window !== 'undefined' && window.GAME_DEPLOY_CONFIG) || {};
      const wsUrl = this.resolveWsUrl();
      if (wsUrl) {
        try {
          const u = new URL(wsUrl);
          const httpProto = u.protocol === 'wss:' ? 'https:' : 'http:';
          return `${httpProto}//${u.host}`;
        } catch (_) {
          // Fall through
        }
      }
      if (cfg.HTTP_API_BASE_URL) return cfg.HTTP_API_BASE_URL;
      if (typeof window !== 'undefined' && window.location && /^https?:$/i.test(window.location.protocol)) {
        return window.location.origin;
      }
      return '';
    }

    // ==================== INVITE URL HELPERS ====================

    getInviteCodeFromUrl() {
      if (typeof window === 'undefined' || !window.location || !window.location.search) return '';
      try {
        const params = new URLSearchParams(window.location.search);
        const raw = params.get('room');
        if (!raw) return '';
        const code = normalizeRoomCode(raw);
        return ROOM_CODE_RE.test(code) ? code : '';
      } catch (_) {
        return '';
      }
    }

    buildInviteUrl(code, opts) {
      const clean = normalizeRoomCode(code || this.roomCode || '');
      if (!clean || typeof window === 'undefined' || !window.location) return '';
      const options = opts && typeof opts === 'object' ? opts : {};
      const preserveWs = options.preserveWs !== false;

      try {
        const url = new URL(`${window.location.origin}${window.location.pathname}`);
        url.searchParams.set('room', clean);

        if (preserveWs && window.location.search) {
          const current = new URLSearchParams(window.location.search);
          const qWs = current.get('ws');
          const qAssets = current.get('assets');
          if (qWs) url.searchParams.set('ws', qWs);
          if (qAssets) url.searchParams.set('assets', qAssets);
        }
        return url.toString();
      } catch (_) {
        return `${window.location.origin}${window.location.pathname}?room=${clean}`;
      }
    }

    clearInviteFromUrl() {
      if (
        typeof window === 'undefined' ||
        !window.location ||
        !window.history ||
        typeof window.history.replaceState !== 'function'
      ) {
        return;
      }
      try {
        const url = new URL(window.location.href);
        if (!url.searchParams.has('room')) return;
        url.searchParams.delete('room');
        const next = `${url.pathname}${url.search}${url.hash}`;
        window.history.replaceState(window.history.state, '', next);
      } catch (_) {
        // Ignore history restrictions on file://
      }
    }

    setPendingInvite(code) {
      const clean = normalizeRoomCode(code);
      if (!ROOM_CODE_RE.test(clean)) {
        this.pendingInviteCode = null;
        this.joiningFromInvite = false;
        return false;
      }
      this.pendingInviteCode = clean;
      if (this.connected && this.clientId && !this.roomCode) {
        this._consumePendingInvite();
      }
      return true;
    }

    _consumePendingInvite() {
      if (!this.pendingInviteCode || !this.connected || this.roomCode) return false;
      const code = this.pendingInviteCode;
      this.joiningFromInvite = true;
      return this.joinRoom(code);
    }

    // ==================== CONNECTION, COLD-START & HEARTBEAT ====================

    _emitStatus(nextState, extra) {
      const info = extra && typeof extra === 'object' ? extra : {};
      this.connectionState = nextState;
      this.connected = nextState === 'connected';
      if (info.reason !== undefined) {
        this.lastStatusReason = info.reason;
      }
      const elapsedMs = this.connectStartedAt > 0 && !this.connected
        ? Math.max(0, Date.now() - this.connectStartedAt)
        : 0;
      const nextRetryMs = typeof info.nextRetryMs === 'number' ? info.nextRetryMs : this.nextRetryMs;

      this.emit('status', {
        state: this.connectionState,
        connected: this.connected,
        waking: this.connectionState === 'waking',
        attempt: this.reconnectAttempt,
        nextRetryMs: this.connected ? 0 : nextRetryMs,
        elapsedMs,
        wakeElapsedMs: elapsedMs,
        wsUrl: this.wsUrl,
        mode: this.wsOriginMode,
        reason: info.reason !== undefined ? info.reason : this.lastStatusReason
      });
    }

    _clearTimers() {
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
      if (this.connectTimeoutTimer) {
        clearTimeout(this.connectTimeoutTimer);
        this.connectTimeoutTimer = null;
      }
      if (this.wakeThresholdTimer) {
        clearTimeout(this.wakeThresholdTimer);
        this.wakeThresholdTimer = null;
      }
      if (this.wakeTickTimer) {
        clearInterval(this.wakeTickTimer);
        this.wakeTickTimer = null;
      }
      if (this.pingTimer) {
        clearInterval(this.pingTimer);
        this.pingTimer = null;
      }
      if (this.visibilityProbeTimer) {
        clearTimeout(this.visibilityProbeTimer);
        this.visibilityProbeTimer = null;
      }
    }

    _clearPendingAction() {
      this.pendingAction = null;
      if (this.pendingActionTimer) {
        clearTimeout(this.pendingActionTimer);
        this.pendingActionTimer = null;
      }
    }

    _setPendingAction(name) {
      this._clearPendingAction();
      this.pendingAction = name;
      this.pendingActionTimer = setTimeout(() => {
        if (this.pendingAction === name) {
          this.pendingAction = null;
          this.pendingActionTimer = null;
          if (this.roomState === 'creating' || this.roomState === 'joining') {
            this._transitionRoomState(this.roomCode ? (this.roomInfo?.status || 'waiting') : 'idle', 'action_timeout');
          }
        }
      }, PENDING_ACTION_TIMEOUT_MS);
    }

    _resetInputState() {
      this.remoteInputState = decodeInputBits(0);
      this.remoteEdgeQueue = 0;
      this.lastSentHeld = -1;
    }

    _resetRoomState(eventName) {
      const prevState = this.roomState;
      const hadRoomOrQueue = Boolean(this.roomCode || this.inQuickQueue || prevState !== 'idle');
      this.roomCode = null;
      this.slot = 0;
      this.role = null;
      this.roomInfo = null;
      this.inQuickQueue = false;
      this._clearPendingAction();
      this._resetInputState();
      this.roomState = 'idle';
      if (hadRoomOrQueue && eventName) {
        this.emit('room_state', {
          state: 'idle',
          prevState,
          room: null,
          slot: 0,
          role: null,
          lanUrls: this.lanUrls,
          event: eventName
        });
      }
    }

    _transitionRoomState(nextState, eventName, extra) {
      const prevState = this.roomState;
      this.roomState = nextState;
      this.emit('room_state', {
        state: nextState,
        prevState,
        room: this.roomInfo,
        slot: this.slot,
        role: this.role,
        lanUrls: this.lanUrls,
        event: eventName || 'room_updated',
        ...(extra || {})
      });
    }

    _startWakeTick() {
      if (this.wakeTickTimer) return;
      this.wakeTickTimer = setInterval(() => {
        if (this.connectionState === 'waking' || this.connectionState === 'reconnecting') {
          this._emitStatus(this.connectionState);
        } else {
          clearInterval(this.wakeTickTimer);
          this.wakeTickTimer = null;
        }
      }, 1000);
    }

    _stopWakeTick() {
      if (this.wakeTickTimer) {
        clearInterval(this.wakeTickTimer);
        this.wakeTickTimer = null;
      }
    }

    async checkHealth(timeoutMs = 8000) {
      const base = this.resolveHttpBaseUrl();
      if (!base) {
        return { ok: false, status: 0, error: 'no_http_base' };
      }
      const started = performance.now();
      const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timer = ctrl ? setTimeout(() => ctrl.abort(), timeoutMs) : null;
      try {
        const res = await fetch(`${base}/healthz`, {
          method: 'GET',
          mode: 'cors',
          cache: 'no-store',
          signal: ctrl ? ctrl.signal : undefined
        });
        const rttMs = Math.max(1, Math.round(performance.now() - started));
        if (!res.ok) {
          return { ok: false, status: res.status, rttMs };
        }
        let data = null;
        try {
          data = await res.json();
        } catch (_) {
          data = { ok: true };
        }
        return { ok: Boolean(data && data.ok !== false), status: res.status, data, rttMs };
      } catch (err) {
        return { ok: false, status: 0, error: err && err.name === 'AbortError' ? 'timeout' : (err && err.message) || 'fetch_failed' };
      } finally {
        if (timer) clearTimeout(timer);
      }
    }

    wakeServer() {
      if (this.wakeProbePromise) return this.wakeProbePromise;
      const base = this.resolveHttpBaseUrl();
      if (!base) return Promise.resolve({ ok: false, error: 'no_http_base' });

      const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
      this.wakeProbeAbort = ctrl;
      const timer = ctrl ? setTimeout(() => ctrl.abort(), 25000) : null;

      this.wakeProbePromise = fetch(`${base}/healthz`, {
        method: 'GET',
        mode: 'cors',
        cache: 'no-store',
        signal: ctrl ? ctrl.signal : undefined
      })
        .then(async (res) => {
          if (!res.ok) return { ok: false, status: res.status };
          let data = null;
          try {
            data = await res.json();
          } catch (_) {
            data = { ok: true };
          }
          const ok = Boolean(data && data.ok !== false);
          if (ok && !this.connected && !this.manualDisconnect) {
            if (this.reconnectTimer) {
              clearTimeout(this.reconnectTimer);
              this.reconnectTimer = null;
            }
            this.nextRetryMs = 0;
            this.connect();
          }
          return { ok, status: res.status, data };
        })
        .catch((err) => ({
          ok: false,
          status: 0,
          error: err && err.name === 'AbortError' ? 'timeout' : (err && err.message) || 'wake_failed'
        }))
        .finally(() => {
          if (timer) clearTimeout(timer);
          this.wakeProbePromise = null;
          this.wakeProbeAbort = null;
        });

      return this.wakeProbePromise;
    }

    _startHeartbeat() {
      if (this.pingTimer) clearInterval(this.pingTimer);
      this.lastInboundAt = Date.now();
      this.pingTimer = setInterval(() => {
        if (!this.connected || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;
        const hidden = typeof document !== 'undefined' && document.visibilityState === 'hidden';
        const now = Date.now();
        if (!hidden && now - this.lastInboundAt > DEAD_SOCKET_TIMEOUT_MS) {
          this._forceCloseSocket('heartbeat_timeout');
          return;
        }
        if (!hidden) {
          this.sendRaw({ type: 'PING', t: performance.now() });
        }
      }, HEARTBEAT_INTERVAL_MS);
    }

    _forceCloseSocket(reason) {
      this.lastStatusReason = reason || 'socket_closed';
      const sock = this.ws;
      if (!sock) return;
      try {
        sock.close(4000, reason || 'reconnect');
      } catch (_) {
        // Ignore
      }
    }

    _computeBackoffMs() {
      const idx = Math.min(this.reconnectAttempt, BACKOFF_SCHEDULE_MS.length - 1);
      const base = this.reconnectAttempt >= BACKOFF_SCHEDULE_MS.length
        ? MAX_LONG_BACKOFF_MS
        : BACKOFF_SCHEDULE_MS[idx];
      const jitter = Math.round(base * (Math.random() * 0.3 - 0.15));
      return Math.max(600, base + jitter);
    }

    _scheduleReconnect(reason) {
      if (this.manualDisconnect) return;
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        this._stopWakeTick();
        this._emitStatus('offline', { reason: 'browser_offline', nextRetryMs: 0 });
        return;
      }
      if (this.reconnectTimer) return;

      const delay = this._computeBackoffMs();
      this.reconnectAttempt += 1;
      this.nextRetryMs = delay;

      const isRemote = this.wsOriginMode === 'remote';
      const elapsed = this.connectStartedAt > 0 ? Date.now() - this.connectStartedAt : 0;
      const shouldWake = isRemote && (elapsed >= WAKE_THRESHOLD_MS || this.reconnectAttempt >= 1);

      if (shouldWake) {
        this._emitStatus('waking', { reason: reason || 'cold_start', nextRetryMs: delay });
        this._startWakeTick();
        this.wakeServer();
      } else {
        this._emitStatus('reconnecting', { reason: reason || 'closed', nextRetryMs: delay });
      }

      this.reconnectTimer = setTimeout(() => {
        this.reconnectTimer = null;
        this.nextRetryMs = 0;
        this.connect();
      }, delay);
    }

    connect() {
      this.manualDisconnect = false;
      const { configuredWs, mode } = this._getDeployConfig();
      this.wsOriginMode = mode;

      if (this.isFileProtocol && !configuredWs) {
        this.wsUrl = '';
        this.httpBaseUrl = '';
        this._emitStatus('offline', { reason: 'file_protocol', nextRetryMs: 0 });
        return false;
      }

      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        this._emitStatus('offline', { reason: 'browser_offline', nextRetryMs: 0 });
        return false;
      }

      const url = this.resolveWsUrl();
      this.wsUrl = url;
      this.httpBaseUrl = this.resolveHttpBaseUrl();

      if (!url) {
        this._emitStatus('offline', { reason: 'unconfigured_remote', nextRetryMs: 0 });
        return false;
      }

      if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
        return true;
      }

      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }

      if (!this.connectStartedAt) {
        this.connectStartedAt = Date.now();
      }

      const initialState = this.connectionState === 'waking'
        ? 'waking'
        : (this.reconnectAttempt > 0 ? 'reconnecting' : 'connecting');
      this._emitStatus(initialState, { reason: initialState === 'waking' ? 'cold_start' : 'connecting', nextRetryMs: 0 });

      let ws;
      try {
        ws = new WebSocket(url);
      } catch (err) {
        this._scheduleReconnect((err && err.message) || 'ws_construct_failed');
        return false;
      }

      this.ws = ws;

      // Connect-attempt timeout so hanging cold-start TLS/TCP sockets don't stall silently
      if (this.connectTimeoutTimer) clearTimeout(this.connectTimeoutTimer);
      this.connectTimeoutTimer = setTimeout(() => {
        if (this.ws === ws && ws.readyState === WebSocket.CONNECTING) {
          this.lastStatusReason = 'connect_timeout';
          try {
            ws.close();
          } catch (_) {
            // Ignore
          }
        }
      }, CONNECT_TIMEOUT_MS);

      // On remote hosts (Render Free), switch to waking state + fire /healthz if open takes >3.2s
      if (this.wakeThresholdTimer) clearTimeout(this.wakeThresholdTimer);
      if (this.wsOriginMode === 'remote') {
        this.wakeThresholdTimer = setTimeout(() => {
          if (this.ws === ws && ws.readyState === WebSocket.CONNECTING) {
            this._emitStatus('waking', { reason: 'cold_start', nextRetryMs: 0 });
            this._startWakeTick();
            this.wakeServer();
          }
        }, WAKE_THRESHOLD_MS);
      }

      ws.onopen = () => {
        if (this.ws !== ws) return;
        if (this.connectTimeoutTimer) {
          clearTimeout(this.connectTimeoutTimer);
          this.connectTimeoutTimer = null;
        }
        if (this.wakeThresholdTimer) {
          clearTimeout(this.wakeThresholdTimer);
          this.wakeThresholdTimer = null;
        }
        this._stopWakeTick();

        this.reconnectAttempt = 0;
        this.nextRetryMs = 0;
        this.connectStartedAt = 0;
        this.lastInboundAt = Date.now();

        this._emitStatus('connected', { reason: 'open', nextRetryMs: 0 });
        this.sendRaw({ type: 'HELLO', profile: this.profile });
        this._startHeartbeat();
      };

      ws.onmessage = (ev) => {
        if (this.ws !== ws) return;
        this.lastInboundAt = Date.now();
        if (this.visibilityProbeTimer) {
          clearTimeout(this.visibilityProbeTimer);
          this.visibilityProbeTimer = null;
        }
        let msg;
        try {
          msg = JSON.parse(ev.data);
        } catch (_) {
          return;
        }
        this.handleMessage(msg);
      };

      ws.onerror = () => {
        if (this.ws !== ws) return;
        if (!this.lastStatusReason) {
          this.lastStatusReason = 'ws_error';
        }
      };

      ws.onclose = (ev) => {
        if (this.ws !== ws) return;
        this.ws = null;

        if (this.connectTimeoutTimer) {
          clearTimeout(this.connectTimeoutTimer);
          this.connectTimeoutTimer = null;
        }
        if (this.wakeThresholdTimer) {
          clearTimeout(this.wakeThresholdTimer);
          this.wakeThresholdTimer = null;
        }
        if (this.pingTimer) {
          clearInterval(this.pingTimer);
          this.pingTimer = null;
        }
        if (this.visibilityProbeTimer) {
          clearTimeout(this.visibilityProbeTimer);
          this.visibilityProbeTimer = null;
        }

        const wasConnected = this.connected;
        const hadRoom = Boolean(this.roomCode);
        const prevRoomCode = this.roomCode;
        const wasInQueue = this.inQuickQueue;
        this.connected = false;
        this.clientId = null;

        if (hadRoom || wasInQueue || this.roomState !== 'idle') {
          this._resetRoomState('disconnected');
          if (hadRoom) {
            this.emit('left_room', {
              code: prevRoomCode,
              reason: 'Mất kết nối máy chủ.',
              disconnected: true
            });
          } else if (wasInQueue) {
            this.emit('quick_cancelled', { reason: 'disconnected' });
          }
        } else {
          this._clearPendingAction();
          this._resetInputState();
        }

        const closeReason = this.lastStatusReason ||
          (ev && ev.reason) ||
          (wasConnected ? 'closed' : 'connect_failed');
        this.lastStatusReason = '';

        if (this.manualDisconnect) {
          this._stopWakeTick();
          this._emitStatus('offline', { reason: closeReason || 'manual', nextRetryMs: 0 });
          return;
        }

        this._scheduleReconnect(closeReason);
      };

      return true;
    }

    disconnect(reason) {
      this.manualDisconnect = true;
      this._clearTimers();
      this._clearPendingAction();
      if (this.wakeProbeAbort) {
        try {
          this.wakeProbeAbort.abort();
        } catch (_) {}
        this.wakeProbeAbort = null;
      }

      const sock = this.ws;
      this.ws = null;
      if (sock) {
        try {
          if (sock.readyState === WebSocket.OPEN && (this.roomCode || this.inQuickQueue)) {
            sock.send(JSON.stringify({ type: 'LEAVE_ROOM' }));
          }
        } catch (_) {}
        try {
          sock.close(1000, reason || 'manual_disconnect');
        } catch (_) {}
      }

      const hadRoom = Boolean(this.roomCode);
      const prevRoomCode = this.roomCode;
      this.connected = false;
      this.clientId = null;
      this.connectStartedAt = 0;
      this.reconnectAttempt = 0;
      this.nextRetryMs = 0;

      if (hadRoom || this.inQuickQueue || this.roomState !== 'idle') {
        this._resetRoomState('manual_disconnect');
        if (hadRoom) {
          this.emit('left_room', { code: prevRoomCode, reason: reason || 'Đã ngắt kết nối.' });
        }
      } else {
        this._resetInputState();
      }

      this._emitStatus('offline', { reason: reason || 'manual', nextRetryMs: 0 });
    }

    reconnectNow() {
      this.manualDisconnect = false;
      this._clearTimers();
      this.reconnectAttempt = 0;
      this.nextRetryMs = 0;
      this.connectStartedAt = Date.now();
      this.lastStatusReason = 'manual_retry';

      if (this.ws) {
        const old = this.ws;
        this.ws = null;
        try {
          old.onopen = null;
          old.onmessage = null;
          old.onerror = null;
          old.onclose = null;
          old.close(1000, 'reconnect');
        } catch (_) {}
      }

      this.connected = false;
      this.clientId = null;
      return this.connect();
    }

    reconnect() {
      return this.reconnectNow();
    }

    _bindBrowserLifecycle() {
      if (typeof window === 'undefined') return;

      window.addEventListener('offline', () => {
        this._clearTimers();
        if (this.ws) {
          this._forceCloseSocket('browser_offline');
        } else {
          this._emitStatus('offline', { reason: 'browser_offline', nextRetryMs: 0 });
        }
      });

      window.addEventListener('online', () => {
        if (!this.manualDisconnect && !this.connected) {
          this.reconnectNow();
        }
      });

      if (typeof document !== 'undefined') {
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState !== 'visible') return;
          if (this.connected && this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.sendRaw({ type: 'PING', t: performance.now() });
            if (this.visibilityProbeTimer) clearTimeout(this.visibilityProbeTimer);
            this.visibilityProbeTimer = setTimeout(() => {
              this.visibilityProbeTimer = null;
              if (this.connected && Date.now() - this.lastInboundAt >= VISIBILITY_PROBE_TIMEOUT_MS) {
                this._forceCloseSocket('visibility_probe_timeout');
              }
            }, VISIBILITY_PROBE_TIMEOUT_MS);
          } else if (
            !this.manualDisconnect &&
            this.connectionState !== 'connecting' &&
            this.connectionState !== 'waking' &&
            this.wsOriginMode !== 'unconfigured_remote' &&
            !this.isFileProtocol
          ) {
            this.reconnectNow();
          }
        });
      }

      const handleUnload = () => {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          if (this.roomCode || this.inQuickQueue) {
            this.sendRaw({ type: 'LEAVE_ROOM' });
          }
          try {
            this.ws.close(1000, 'page_unload');
          } catch (_) {}
        }
      };

      window.addEventListener('pagehide', handleUnload);
    }

    // ==================== HTTP HELPERS ====================

    async fetchRoomsHttp() {
      const base = this.resolveHttpBaseUrl();
      if (!base) return { rooms: [], onlinePlayers: 0 };
      const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timer = ctrl ? setTimeout(() => ctrl.abort(), 8000) : null;
      try {
        const res = await fetch(`${base}/api/rooms`, {
          mode: 'cors',
          cache: 'no-store',
          signal: ctrl ? ctrl.signal : undefined
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
      } finally {
        if (timer) clearTimeout(timer);
      }
    }

    async fetchRoomMetaHttp(code) {
      const clean = normalizeRoomCode(code);
      if (!ROOM_CODE_RE.test(clean)) return null;
      const base = this.resolveHttpBaseUrl();
      if (!base) return null;
      const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timer = ctrl ? setTimeout(() => ctrl.abort(), 6000) : null;
      try {
        const res = await fetch(`${base}/api/rooms/${encodeURIComponent(clean)}`, {
          mode: 'cors',
          cache: 'no-store',
          signal: ctrl ? ctrl.signal : undefined
        });
        if (!res.ok) return null;
        return await res.json();
      } catch (_) {
        return null;
      } finally {
        if (timer) clearTimeout(timer);
      }
    }

    // ==================== WIRE SEND & MESSAGE DISPATCH ====================

    setProfile(profile) {
      if (!profile) return;
      this.profile = sanitizeProfile(profile);
      if (this.connected) {
        this.sendRaw({ type: 'HELLO', profile: this.profile });
      }
    }

    sendRaw(obj) {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return false;
      try {
        this.ws.send(JSON.stringify(obj));
        return true;
      } catch (_) {
        return false;
      }
    }

    _syncRoomFromPayload(room, slotOverride) {
      if (!room || typeof room !== 'object') return;
      this.roomInfo = room;
      this.roomCode = room.code || this.roomCode;
      this.matchFormat = normalizeFormat(room.matchFormat || this.matchFormat);
      if (typeof slotOverride === 'number' && (slotOverride === 1 || slotOverride === 2)) {
        this.slot = slotOverride;
      }
      this.role = this.slot === 1 ? 'host' : (this.slot === 2 ? 'guest' : null);
    }

    handleMessage(msg) {
      if (!msg || typeof msg !== 'object') return;

      switch (msg.type) {
        case 'WELCOME':
          this.clientId = msg.id || null;
          this.onlineCount = Number.isFinite(Number(msg.onlineCount)) ? Number(msg.onlineCount) : 1;
          this.rooms = Array.isArray(msg.rooms) ? msg.rooms : [];
          this.lanUrls = Array.isArray(msg.lanUrls) ? msg.lanUrls : [];
          if (msg.deploymentMode) this.deploymentMode = msg.deploymentMode;
          this.emit('welcome', msg);
          this.emit('rooms', { rooms: this.rooms, onlineCount: this.onlineCount });
          // Immediate RTT probe instead of waiting 4s
          this.sendRaw({ type: 'PING', t: performance.now() });
          // Auto-join pending ?room=CODE invite if queued before WELCOME
          if (this.pendingInviteCode && !this.roomCode) {
            this._consumePendingInvite();
          }
          break;

        case 'PONG':
          if (typeof msg.t === 'number') {
            this.pingMs = Math.max(1, Math.round(performance.now() - msg.t));
            this.pingQuality = computePingQuality(this.pingMs);
          }
          if (Number.isFinite(Number(msg.onlineCount))) {
            this.onlineCount = Number(msg.onlineCount);
          }
          this.emit('ping', {
            pingMs: this.pingMs,
            quality: this.pingQuality,
            onlineCount: this.onlineCount
          });
          break;

        case 'ROOMS_LIST':
          this.rooms = Array.isArray(msg.rooms) ? msg.rooms : [];
          if (Number.isFinite(Number(msg.onlineCount))) {
            this.onlineCount = Number(msg.onlineCount);
          }
          this.emit('rooms', { rooms: this.rooms, onlineCount: this.onlineCount });
          break;

        case 'ROOM_CREATED': {
          this._clearPendingAction();
          this.inQuickQueue = false;
          this.pendingInviteCode = null;
          this.joiningFromInvite = false;
          if (Array.isArray(msg.lanUrls)) this.lanUrls = msg.lanUrls;

          const room = msg.room || {
            code: msg.code,
            name: sanitizeRoomName(msg.name || msg.title || `Phòng của ${this.profile.nickname}`),
            matchFormat: normalizeFormat(msg.matchFormat),
            visibility: normalizeVisibility(msg.visibility),
            hasPassword: Boolean(msg.hasPassword),
            status: 'waiting',
            hostSlot: 1,
            p1: { id: this.clientId, ...this.profile, ready: true },
            p2: null
          };
          this._syncRoomFromPayload(room, msg.slot || 1);
          const nextState = room.status || 'waiting';
          const out = {
            ...msg,
            code: this.roomCode,
            matchFormat: this.matchFormat,
            slot: this.slot,
            role: this.role,
            room: this.roomInfo,
            lanUrls: this.lanUrls
          };
          this.emit('room_created', out);
          this._transitionRoomState(nextState, 'room_created');
          break;
        }

        case 'ROOM_JOINED': {
          this._clearPendingAction();
          this.inQuickQueue = false;
          this.pendingInviteCode = null;
          this.joiningFromInvite = false;
          this.lastJoinAttemptCode = null;

          const room = msg.room || null;
          this._syncRoomFromPayload(room, msg.slot || 2);
          const nextState = (room && room.status) || 'lobby';
          const out = {
            ...msg,
            slot: this.slot,
            role: this.role,
            room: this.roomInfo
          };
          this.emit('room_joined', out);
          this._transitionRoomState(nextState, 'room_joined');
          break;
        }

        case 'ROOM_UPDATED': {
          this._clearPendingAction();
          const room = msg.room || null;
          this._syncRoomFromPayload(room, msg.slot || this.slot);
          const nextState = (room && room.status) || (room && room.p2 ? 'lobby' : 'waiting');
          const out = {
            ...msg,
            slot: this.slot,
            role: this.role,
            room: this.roomInfo,
            event: msg.event || 'room_updated'
          };
          this.emit('room_updated', out);
          this._transitionRoomState(nextState, msg.event || 'room_updated');
          break;
        }

        case 'HOST_TRANSFERRED': {
          this._clearPendingAction();
          const room = msg.room || null;
          this._syncRoomFromPayload(room, 1);
          const nextState = (room && room.status) || 'waiting';
          const out = {
            ...msg,
            slot: 1,
            role: 'host',
            room: this.roomInfo
          };
          this.emit('host_transferred', out);
          this._transitionRoomState(nextState, 'host_transferred');
          break;
        }

        case 'QUICK_QUEUED':
          this._clearPendingAction();
          this.roomCode = null;
          this.slot = 0;
          this.role = null;
          this.roomInfo = null;
          this.inQuickQueue = true;
          this.matchFormat = normalizeFormat(msg.matchFormat || this.matchFormat);
          this.emit('quick_queued', msg);
          this._transitionRoomState('quick_queue', 'quick_queued');
          break;

        case 'QUICK_CANCELLED':
          this._clearPendingAction();
          this.inQuickQueue = false;
          this.emit('quick_cancelled', msg || {});
          if (!this.roomCode) {
            this._transitionRoomState('idle', 'quick_cancelled');
          }
          break;

        case 'ROOM_READY': {
          this._clearPendingAction();
          this.inQuickQueue = false;
          this.pendingInviteCode = null;
          this.joiningFromInvite = false;
          this.lastJoinAttemptCode = null;
          this._resetInputState();

          const room = msg.room || this.roomInfo;
          this._syncRoomFromPayload(room, msg.slot || this.slot);
          const out = {
            ...msg,
            slot: this.slot,
            role: this.role,
            room: this.roomInfo
          };
          this.emit('room_ready', out);
          this._transitionRoomState('selecting', 'room_ready');
          break;
        }

        case 'KICKED': {
          const payload = {
            code: msg.code || this.roomCode || null,
            reason: msg.reason || 'Bạn đã bị chủ phòng mời ra khỏi phòng.'
          };
          this._resetRoomState('kicked');
          this.emit('kicked', payload);
          break;
        }

        case 'PEER_LEFT': {
          const payload = {
            code: msg.code || this.roomCode || null,
            reason: msg.reason || 'Đối thủ đã rời phòng.'
          };
          this._resetRoomState('peer_left');
          this.emit('peer_left', payload);
          break;
        }

        case 'LEFT_ROOM': {
          const payload = {
            reason: msg.reason || ''
          };
          this._resetRoomState('left_room');
          this.emit('left_room', payload);
          break;
        }

        case 'ERROR': {
          this._clearPendingAction();
          const errCode = msg.code || 'ERROR';
          const errRoomCode = msg.roomCode || this.lastJoinAttemptCode || null;
          const payload = {
            code: errCode,
            message: msg.message || 'Lỗi kết nối phòng.',
            roomCode: errRoomCode
          };

          if (this.roomState === 'creating' || this.roomState === 'joining') {
            this._transitionRoomState(
              this.roomCode ? ((this.roomInfo && this.roomInfo.status) || 'waiting') : 'idle',
              'error'
            );
          }

          if (this.joiningFromInvite) {
            this.joiningFromInvite = false;
            this.pendingInviteCode = null;
            if (errCode === 'PASSWORD_REQUIRED') {
              this.emit('invite_password_required', { code: errRoomCode });
            }
          }

          this.emit('error', payload);
          break;
        }

        case 'SELECT_STATE':
          this.emit('select_state', msg);
          break;

        case 'START_BATTLE':
          this._resetInputState();
          if (this.roomCode) {
            this._transitionRoomState('playing', 'start_battle');
          }
          this.emit('start_battle', msg);
          break;

        case 'INPUT': {
          // Guest P2 sent held + edge bitmasks -> Host consumes on next 60fps tick
          const held = msg.h | 0;
          const edges = msg.e | 0;
          this.remoteInputState = decodeInputBits(held);
          this.remoteEdgeQueue |= edges;
          break;
        }

        case 'SNAPSHOT':
          this.emit('snapshot', msg.s);
          break;

        case 'REMATCH_ACTION':
          if (this.roomCode && (msg.action === 'reselect' || msg.action === 'remap')) {
            this._transitionRoomState('selecting', 'rematch_action');
          }
          this.emit('rematch_action', msg);
          break;

        case 'CHAT':
          this.emit('chat', msg);
          break;
      }
    }

    // ==================== CLIENT ROOM ACTIONS ====================

    createRoom(optionsOrFormat, legacyCode) {
      if (!this.connected) {
        this.emit('error', {
          code: 'NOT_CONNECTED',
          message: 'Chưa kết nối được máy chủ Online. Vui lòng chờ kết nối rồi thử lại.'
        });
        return false;
      }
      if (this.pendingAction === 'CREATE_ROOM') return false;

      let opts;
      if (optionsOrFormat && typeof optionsOrFormat === 'object') {
        opts = optionsOrFormat;
      } else {
        opts = {
          matchFormat: optionsOrFormat,
          code: legacyCode
        };
      }

      const matchFormat = normalizeFormat(opts.matchFormat);
      const visibility = normalizeVisibility(opts.visibility);
      const name = sanitizeRoomName(opts.name !== undefined ? opts.name : (opts.title || ''));
      const password = sanitizePassword(opts.password || '');
      const rawCode = opts.code ? normalizeRoomCode(opts.code) : '';

      if (rawCode && !ROOM_CODE_RE.test(rawCode)) {
        this.emit('error', {
          code: 'INVALID_CODE',
          message: 'Mã phòng tùy chỉnh phải gồm 4–8 ký tự chữ hoặc số.'
        });
        return false;
      }

      this._setPendingAction('CREATE_ROOM');
      this._transitionRoomState('creating', 'creating');

      const sent = this.sendRaw({
        type: 'CREATE_ROOM',
        name,
        title: name,
        matchFormat,
        visibility,
        password,
        code: rawCode,
        profile: this.profile
      });

      if (!sent) {
        this._clearPendingAction();
        this._transitionRoomState(this.roomCode ? ((this.roomInfo && this.roomInfo.status) || 'waiting') : 'idle', 'send_failed');
      }
      return sent;
    }

    updateRoom(patch) {
      if (!this.connected || this.slot !== 1 || !this.roomCode) return false;
      if (!patch || typeof patch !== 'object') return false;

      const msg = { type: 'UPDATE_ROOM' };
      if (patch.name !== undefined || patch.title !== undefined) {
        const cleanName = sanitizeRoomName(patch.name !== undefined ? patch.name : patch.title);
        msg.name = cleanName;
        msg.title = cleanName;
      }
      if (patch.matchFormat !== undefined) {
        msg.matchFormat = normalizeFormat(patch.matchFormat);
      }
      if (patch.visibility !== undefined) {
        msg.visibility = normalizeVisibility(patch.visibility);
      }
      if (patch.password !== undefined) {
        msg.password = sanitizePassword(patch.password);
      }
      return this.sendRaw(msg);
    }

    joinRoom(code, password) {
      if (!this.connected) {
        this.emit('error', {
          code: 'NOT_CONNECTED',
          message: 'Chưa kết nối được máy chủ Online. Vui lòng chờ kết nối rồi thử lại.'
        });
        return false;
      }

      const cleanCode = normalizeRoomCode(code);
      if (!ROOM_CODE_RE.test(cleanCode)) {
        this.joiningFromInvite = false;
        this.pendingInviteCode = null;
        this.emit('error', {
          code: 'INVALID_CODE',
          message: 'Mã phòng không hợp lệ (cần 4–8 ký tự chữ hoặc số).',
          roomCode: cleanCode || null
        });
        return false;
      }

      if (this.pendingAction === 'JOIN_ROOM' && this.lastJoinAttemptCode === cleanCode) {
        return false;
      }

      this.lastJoinAttemptCode = cleanCode;
      this._setPendingAction('JOIN_ROOM');
      this._transitionRoomState('joining', 'joining');

      const sent = this.sendRaw({
        type: 'JOIN_ROOM',
        code: cleanCode,
        password: sanitizePassword(password || ''),
        profile: this.profile
      });

      if (!sent) {
        this._clearPendingAction();
        this._transitionRoomState(this.roomCode ? ((this.roomInfo && this.roomInfo.status) || 'waiting') : 'idle', 'send_failed');
      }
      return sent;
    }

    quickMatch(matchFormat) {
      if (!this.connected) {
        this.emit('error', {
          code: 'NOT_CONNECTED',
          message: 'Chưa kết nối được máy chủ Online. Vui lòng chờ kết nối rồi thử lại.'
        });
        return false;
      }
      if (this.pendingAction === 'QUICK_MATCH') return false;

      const fmt = normalizeFormat(matchFormat);
      this._setPendingAction('QUICK_MATCH');
      return this.sendRaw({
        type: 'QUICK_MATCH',
        matchFormat: fmt,
        profile: this.profile
      });
    }

    cancelQuickMatch() {
      const wasQueued = this.inQuickQueue;
      this.inQuickQueue = false;
      this._clearPendingAction();
      if (!this.roomCode && this.roomState === 'quick_queue') {
        this._transitionRoomState('idle', 'quick_cancelled');
      }
      if (!this.connected) return wasQueued;
      return this.sendRaw({ type: 'CANCEL_QUICK_MATCH' });
    }

    setReady(ready) {
      if (!this.connected || !this.roomCode) return false;
      return this.sendRaw({ type: 'SET_READY', ready: Boolean(ready) });
    }

    setRoomReady(ready) {
      return this.setReady(ready);
    }

    startMatch() {
      if (!this.connected || this.slot !== 1 || !this.roomCode) return false;
      if (this.pendingAction === 'START_MATCH') return false;
      this._setPendingAction('START_MATCH');
      return this.sendRaw({ type: 'START_MATCH' });
    }

    startRoomMatch() {
      return this.startMatch();
    }

    kickGuest(reason) {
      if (!this.connected || this.slot !== 1 || !this.roomCode) return false;
      return this.sendRaw({
        type: 'KICK_GUEST',
        reason: typeof reason === 'string' ? reason.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 100) : ''
      });
    }

    leaveRoom() {
      const wasInQuickQueueOnly = this.inQuickQueue && !this.roomCode;
      this.pendingInviteCode = null;
      this.joiningFromInvite = false;
      this.lastJoinAttemptCode = null;
      this._resetRoomState('leave_requested');
      if (!this.connected) return false;
      if (wasInQuickQueueOnly) {
        return this.sendRaw({ type: 'CANCEL_QUICK_MATCH' });
      }
      return this.sendRaw({ type: 'LEAVE_ROOM' });
    }

    requestRooms(matchFormat) {
      if (!this.connected) return false;
      const payload = { type: 'LIST_ROOMS' };
      if (matchFormat === '1v1' || matchFormat === '3v3') {
        payload.matchFormat = matchFormat;
      }
      return this.sendRaw(payload);
    }

    // ==================== BATTLE / SELECT RELAYS (UNCHANGED COMPAT) ====================

    consumeRemoteP2Input() {
      const held = this.remoteInputState;
      const edges = decodeInputBits(this.remoteEdgeQueue);
      this.remoteEdgeQueue = 0;
      return {
        up: held.up,
        down: held.down,
        left: held.left,
        right: held.right,
        attack: edges.attack,
        jump: edges.jump,
        dash: edges.dash,
        skill: edges.skill,
        bisha: edges.bisha,
        assist: edges.assist,
        awaken: edges.awaken
      };
    }

    sendSelectState(payload) {
      return this.sendRaw({ type: 'SELECT_STATE', payload });
    }

    sendStartBattle(payload) {
      return this.sendRaw({ type: 'START_BATTLE', payload });
    }

    sendGuestInput(heldCtrl, edgeCtrl) {
      const h = encodeInputBits(heldCtrl);
      const e = encodeInputBits(edgeCtrl);
      if (h !== this.lastSentHeld || e !== 0) {
        this.lastSentHeld = h;
        this.sendRaw({ type: 'INPUT', h, e });
      }
    }

    sendSnapshot(snap) {
      return this.sendRaw({ type: 'SNAPSHOT', s: snap });
    }

    sendRematchAction(action, payload) {
      return this.sendRaw({ type: 'REMATCH_ACTION', action, payload });
    }

    sendChat(text) {
      const clean = String(text || '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 200);
      if (!clean) return false;
      return this.sendRaw({ type: 'CHAT', text: clean, sender: this.profile.nickname });
    }
  }

  window.BvnInputCodec = { encodeInputBits, decodeInputBits };
  window.netplay = new BvnNetplayClient();
})();
