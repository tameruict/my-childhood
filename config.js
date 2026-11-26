// language: JavaScript, file: config.js, target: HTML5 Browser Deploy Configuration (PA1: Vercel + Cloudflare R2 + Render)
// Leave ASSET_BASE_URL and NETPLAY_WS_URL empty ('') for local development via `node server.js`.
// Supports temporary smoke-test overrides via URL query params: ?assets=https://...&ws=wss://... (or https://...)

(function () {
  'use strict';

  // Production defaults — fill these after provisioning Cloudflare R2 & Render, then deploy to Vercel.
  // Example:
  //   ASSET_BASE_URL: 'https://pub-xxxxxxxxxxxxxxxx.r2.dev'
  //   NETPLAY_WS_URL: 'wss://anime-crossover-bvn-ws.onrender.com/ws'
  const DEFAULT_CONFIG = {
    ASSET_BASE_URL: 'https://pub-1cf9b14082ec4e4ba6a565b6dcd88e23.r2.dev',
    NETPLAY_WS_URL: ''
  };

  function isLocalHostname(hostname) {
    if (!hostname || typeof hostname !== 'string') return false;
    const h = hostname.trim().toLowerCase();
    if (
      h === 'localhost' ||
      h === '127.0.0.1' ||
      h === '0.0.0.0' ||
      h === '::1' ||
      h === '[::1]' ||
      h.endsWith('.localhost') ||
      h.endsWith('.local')
    ) {
      return true;
    }
    // RFC1918 & link-local IPv4 ranges for LAN dev
    const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(h);
    if (m) {
      const a = Number(m[1]);
      const b = Number(m[2]);
      if (a === 10) return true;
      if (a === 127) return true;
      if (a === 192 && b === 168) return true;
      if (a === 172 && b >= 16 && b <= 31) return true;
      if (a === 169 && b === 254) return true;
    }
    return false;
  }

  function validateHttpUrl(raw) {
    if (!raw || typeof raw !== 'string') return '';
    const trimmed = raw.trim();
    if (!trimmed) return '';
    try {
      const u = new URL(trimmed);
      if (u.protocol !== 'http:' && u.protocol !== 'https:') return '';
      return u.toString().replace(/\/+$/, '');
    } catch (_) {
      return '';
    }
  }

  function normalizeWsUrl(raw) {
    if (!raw || typeof raw !== 'string') return '';
    const trimmed = raw.trim();
    if (!trimmed) return '';
    try {
      const withScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmed)
        ? trimmed
        : `https://${trimmed}`;
      const u = new URL(withScheme);
      if (u.protocol === 'https:') {
        u.protocol = 'wss:';
      } else if (u.protocol === 'http:') {
        u.protocol = 'ws:';
      }
      if (u.protocol !== 'ws:' && u.protocol !== 'wss:') {
        return '';
      }
      if (!u.pathname || u.pathname === '/') {
        u.pathname = '/ws';
      } else if (u.pathname.length > 1) {
        u.pathname = u.pathname.replace(/\/+$/, '');
      }
      return u.toString();
    } catch (_) {
      return '';
    }
  }

  function deriveHttpBaseUrl(wsUrl, fallbackOrigin) {
    if (wsUrl) {
      try {
        const u = new URL(wsUrl);
        const httpProto = u.protocol === 'wss:' ? 'https:' : 'http:';
        return `${httpProto}//${u.host}`;
      } catch (_) {
        // Fall through to fallbackOrigin
      }
    }
    if (fallbackOrigin && /^https?:\/\//i.test(fallbackOrigin)) {
      return fallbackOrigin.replace(/\/+$/, '');
    }
    return '';
  }

  const hasWindowLoc = typeof window !== 'undefined' && Boolean(window.location);
  const locProto = hasWindowLoc ? window.location.protocol : '';
  const locHost = hasWindowLoc ? window.location.hostname : '';
  const locOrigin = hasWindowLoc && (locProto === 'http:' || locProto === 'https:')
    ? window.location.origin
    : '';

  const isLocalHost = (locProto === 'http:' || locProto === 'https:') && isLocalHostname(locHost);

  // Use local chars/ on localhost for instant dev/QA, and Cloudflare R2 automatically on remote deploys (Vercel).
  let assetBaseUrl = isLocalHost ? '' : validateHttpUrl(DEFAULT_CONFIG.ASSET_BASE_URL);
  let netplayWsUrl = normalizeWsUrl(DEFAULT_CONFIG.NETPLAY_WS_URL);

  if (typeof window !== 'undefined' && window.location && window.location.search) {
    try {
      const params = new URLSearchParams(window.location.search);
      const qAssets = params.get('assets');
      const qWs = params.get('ws');

      if (qAssets !== null) {
        const validAssets = validateHttpUrl(qAssets);
        if (validAssets) assetBaseUrl = validAssets;
      }
      if (qWs !== null) {
        const validWs = normalizeWsUrl(qWs);
        if (validWs) netplayWsUrl = validWs;
      }
    } catch (_) {
      // Ignore malformed search strings
    }
  }

  const hasRemoteWs = Boolean(netplayWsUrl);

  let wsOriginMode = 'local';
  if (hasRemoteWs) {
    wsOriginMode = 'remote';
  } else if (isLocalHost) {
    wsOriginMode = 'local';
  } else {
    wsOriginMode = 'unconfigured_remote';
  }

  const httpApiBaseUrl = hasRemoteWs
    ? deriveHttpBaseUrl(netplayWsUrl, '')
    : (isLocalHost ? deriveHttpBaseUrl('', locOrigin) : '');

  const resolved = {
    ASSET_BASE_URL: assetBaseUrl,
    NETPLAY_WS_URL: netplayWsUrl,
    HTTP_API_BASE_URL: httpApiBaseUrl,
    IS_LOCAL_HOST: isLocalHost,
    HAS_REMOTE_WS: hasRemoteWs,
    WS_ORIGIN_MODE: wsOriginMode
  };

  if (typeof window !== 'undefined') {
    window.GAME_DEPLOY_CONFIG = resolved;
  }
})();
