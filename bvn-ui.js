// language: JavaScript, file: bvn-ui.js, target: Authentic Bleach vs Naruto (BVN) Screen Flow, Avatar Select, Map Select & Online Lobby Controller
// Direct UX port of net.play5d.game.bvn (MenuStage, SelectFighterStage, SelectMapUI, WinnerStage) + Real WebSocket Multiplayer

(function () {
  'use strict';

  class BvnUiController {
    constructor() {
      this.currentScreen = 'screenMenu';
      this.mode = 'TEAM_CPU'; // TEAM_CPU | SINGLE_CPU | LOCAL_2P | ONLINE_PVP | TRAINING
      this.format = '3v3';    // '1v1' | '3v3'
      this.aiDifficulty = this.loadSavedAiDifficulty();
      // BVN Selection state
      this.selectedUniverse = 'all';
      this.searchQuery = '';
      this.activeClickTarget = 1; // 1 = P1, 2 = P2 (for mouse clicks in offline modes)
      this.p1CursorIdx = 0;
      this.p2CursorIdx = 1;
      this.p1Team = [];
      this.p2Team = [];
      this.p1Assist = null;
      this.p2Assist = null;
      this.p1Ready = false;
      this.p2Ready = false;

      // Online lobby & room state
      this.lobbyFormat = '1v1';
      this.lobbyVisibility = 'public';
      this.roomListFilter = 'all';
      this.lobbyRoomsCache = [];
      this.lobbyOnlineCount = 0;
      this.lobbyViewMode = 'hub'; // 'hub' | 'queue' | 'room'
      this.pendingLobbyAction = null;
      this.pendingActionTimer = null;
      this.queueStartedAt = 0;
      this.queueTimerId = null;
      this.pendingPasswordRoomCode = null;
      this.lobbyNoticeTimer = null;
      this.lastRoomEventKey = '';
      this.netStatus = {
        state: 'connecting',
        connected: false,
        waking: false,
        attempt: 0,
        elapsedMs: 0,
        mode: 'local',
        reason: ''
      };
      this.onlineRole = null; // null | 'host' | 'guest'
      this.onlineRoom = null;
      this.onlineLanUrls = [];

      // Stage select state
      this.selectedMapCat = 'all';
      this.selectedMapId = (Array.isArray(window.GAME_MAPS) && window.GAME_MAPS[0]) ? window.GAME_MAPS[0].id : 'konoha_village';
      this.mapThumbCache = new Map();
      this._mapThumbScratchCanvas = null;
      this._mapThumbRenderGen = 0;
      this._mapThumbBatchHandle = null;
      this._mapThumbBatchIsTimeout = false;
      this.mapPreviewFrame = 0;
      this.mapPreviewAnimId = null;

      // Avatar grid cache (build once, filter via .hidden)
      this._avatarGridBuiltCount = -1;
      this._avatarTileEntries = [];
      this._avatarRandTile = null;
      this._avatarEmptyEl = null;

      // Menu keyboard focus & UI state
      this.menuFocusIdx = 0;
      this.chatToastTimer = null;
      this.skillBarCollapsed = false;

      this.init();
    }

    escapeHtml(str) {
      return String(str == null ? '' : str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    cleanFighterName(name) {
      return String(name || '')
        .replace(/\s*\[M\.U\.G\.E\.N\]\s*/gi, ' ')
        .replace(/\s*\(M\.U\.G\.E\.N(?:\s+SFF)?\)\s*/gi, ' ')
        .replace(/\s{2,}/g, ' ')
        .trim();
    }

    cleanFighterTitle(title) {
      return String(title || '')
        .replace(/\s*\[M\.U\.G\.E\.N\]\s*/gi, ' ')
        .replace(/\s*\((?:Từ BVN Gốc|Đề xuất|BVN Core|M\.U\.G\.E\.N(?:\s+SFF)?|Khuyên dùng)\)\s*/gi, ' ')
        .replace(/\s{2,}/g, ' ')
        .trim();
    }

    cleanUniverseLabel(label) {
      return String(label || '')
        .replace(/\s*\[M\.U\.G\.E\.N\]\s*/gi, ' ')
        .replace(/\s*\((?:Đề xuất|BVN Core|M\.U\.G\.E\.N(?:\s+SFF)?|Khuyên dùng)\)\s*/gi, ' ')
        .replace(/\s{2,}/g, ' ')
        .trim();
    }

    getHeroShortName(meta) {
      const explicit = {
        naruto: 'Naruto',
        ichigo: 'Ichigo',
        luffy: 'Luffy',
        goku: 'Goku',
        gon: 'Gon',
        killua: 'Killua',
        gojo: 'Gojo',
        tanjiro: 'Tanjiro'
      };
      if (meta && explicit[meta.id]) return explicit[meta.id];
      const cleaned = this.cleanFighterName(meta ? meta.name : '').replace(/\s*\([^)]*\)\s*/g, ' ').trim();
      return cleaned.split(' ')[0] || cleaned;
    }

    setButtonLabel(btn, text) {
      if (!btn) return;
      const labelEl = btn.querySelector('.btn-label, [data-btn-label]');
      if (labelEl) {
        labelEl.textContent = text;
        return;
      }
      if (btn.querySelector('svg')) {
        let span = btn.querySelector(':scope > span:not(.m-tag):not(.m-arrow)');
        if (!span) {
          Array.from(btn.childNodes).forEach((n) => {
            if (n.nodeType === Node.TEXT_NODE) n.remove();
          });
          span = document.createElement('span');
          btn.appendChild(span);
        }
        span.textContent = text;
        return;
      }
      btn.textContent = text;
    }

    setStatusLabel(el, text) {
      if (!el) return;
      const hasGraphic = Boolean(el.querySelector('svg, .net-dot, .status-dot'));
      if (hasGraphic) {
        let span = el.querySelector('.status-text, [data-status-text], :scope > span:not(.net-dot):not(.status-dot)');
        if (!span) {
          Array.from(el.childNodes).forEach((n) => {
            if (n.nodeType === Node.TEXT_NODE) n.remove();
          });
          span = document.createElement('span');
          span.className = 'status-text';
          el.appendChild(span);
        }
        span.textContent = text;
        return;
      }
      el.textContent = text;
    }

    get roster() {
      return Array.isArray(window.FIGHTER_ROSTER) ? window.FIGHTER_ROSTER : [];
    }

    get maps() {
      return Array.isArray(window.GAME_MAPS) ? window.GAME_MAPS : [];
    }

    get requiredTeamSize() {
      return this.format === '3v3' ? 3 : 1;
    }

    getFilteredRoster() {
      const q = (this.searchQuery || '').trim().toLowerCase();
      return this.roster.filter((f) => {
        if (this.selectedUniverse !== 'all' && f.universe !== this.selectedUniverse) return false;
        if (q) {
          const hay = `${this.cleanFighterName(f.name)} ${this.cleanFighterTitle(f.title)} ${this.cleanUniverseLabel(f.universeLabel)} ${f.id}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      });
    }

    getFighterMeta(id) {
      return this.roster.find((f) => f.id === id) || this.roster[0];
    }

    playSfx(name) {
      if (window.gameApp && window.gameApp.sfx) window.gameApp.sfx.play(name);
    }

    hydrateDynamicCounts() {
      const rosterEl = document.getElementById('menuRosterCount');
      if (rosterEl && this.roster.length > 0) {
        rosterEl.textContent = String(this.roster.length);
      }
      const mapEl = document.getElementById('menuMapCount');
      if (mapEl && this.maps.length > 0) {
        mapEl.textContent = String(this.maps.length);
      }
    }

    init() {
      this.hydrateDynamicCounts();
      this.populateMenuHeroStrip();
      this.bindTopbarAndModals();
      this.bindMenuEvents();
      this.bindLobbyEvents();
      this.bindSelectEvents();
      this.bindMapSelectEvents();
      this.bindBattleAndVictoryEvents();
      this.bindKeyboardNavigation();
      this.bindNetplayEvents();

      // Check URL ?room=CODE invite link BEFORE connect() to avoid localhost welcome race
      const rawInvite = (window.netplay && typeof window.netplay.getInviteCodeFromUrl === 'function')
        ? window.netplay.getInviteCodeFromUrl()
        : (new URLSearchParams(window.location.search).get('room') || '').trim().toUpperCase();
      const inviteCode = String(rawInvite || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
      const hasValidInvite = Boolean(inviteCode && inviteCode.length >= 4 && inviteCode.length <= 8);
      if (hasValidInvite) {
        this.mode = 'ONLINE_PVP';
        this.showScreen('screenLobby');
        const input = document.getElementById('inputLobbyRoomCode');
        if (input) input.value = inviteCode;
        this.showLobbyNotice(`Đang kết nối để tự động vào phòng ${inviteCode}...`, 6000);
        if (window.netplay) {
          if (window.netplay.connected) {
            this.joinRoomWithCheck(inviteCode);
          } else if (typeof window.netplay.setPendingInvite === 'function') {
            window.netplay.setPendingInvite(inviteCode);
          } else {
            const unsub = window.netplay.on('welcome', () => {
              unsub();
              this.joinRoomWithCheck(inviteCode);
            });
          }
        }
      }

      // Connect WebSocket immediately
      if (window.netplay) {
        if (window.gameApp && window.gameApp.accounts) {
          window.netplay.setProfile(window.gameApp.accounts.state.p1);
        }
        window.netplay.connect();
      }
      this.renderNetStatus(this.netStatus);
      this.setLobbyView('hub');
    }

    showScreen(screenId) {
      this.currentScreen = screenId;
      document.body.classList.toggle('in-battle', screenId === 'screenBattle');
      document.body.dataset.screen = screenId;

      document.querySelectorAll('.bvn-screen').forEach((s) => {
        s.classList.toggle('active', s.id === screenId);
      });

      if (screenId !== 'screenBattle' && window.gameApp) {
        window.gameApp.stopBattle();
      }

      if (screenId === 'screenMapSelect') {
        this.startMapPreviewLoop();
      } else {
        this.stopMapPreviewLoop();
      }
    }

    openModal(id) {
      const m = document.getElementById(id);
      if (m) m.classList.remove('hidden');
    }

    closeModal(id) {
      const m = document.getElementById(id);
      if (m) m.classList.add('hidden');
    }

    closeAllModals() {
      document.querySelectorAll('.bvn-modal').forEach((m) => m.classList.add('hidden'));
    }

    hasOpenModal() {
      return Boolean(document.querySelector('.bvn-modal:not(.hidden)'));
    }

    // ==================== 1. MENU & TOPBAR ====================
    populateMenuHeroStrip() {
      const strip = document.getElementById('menuHeroStrip');
      if (!strip) return;
      const featured = ['naruto', 'ichigo', 'luffy', 'goku', 'gon', 'killua', 'gojo', 'tanjiro'];
      strip.innerHTML = '';
      featured.forEach((id) => {
        const meta = this.getFighterMeta(id);
        if (!meta) return;
        const cleanName = this.cleanFighterName(meta.name);
        const cleanUni = this.cleanUniverseLabel(meta.universeLabel || meta.universe || '');
        const shortName = this.getHeroShortName(meta);
        const uniObj = (window.ANIME_UNIVERSES || []).find((u) => u.id === meta.universe);
        const uniColor = (uniObj && uniObj.color) || (meta.colors && meta.colors.primary) || '#00D2FF';

        const card = document.createElement('div');
        card.className = 'hero-mini-card';
        card.dataset.fighterId = meta.id;
        card.style.setProperty('--uni-color', uniColor);
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.title = `${cleanName} · ${cleanUni}`;
        card.innerHTML = `<img src="avatars/${meta.id}.png" alt="${this.escapeHtml(cleanName)}" /><span>${this.escapeHtml(shortName)}</span>`;

        const selectHero = () => {
          this.playSfx('ui_confirm');
          const idx = this.roster.findIndex((r) => r.id === meta.id);
          this.enterCharacterSelect('SINGLE_CPU', '1v1');
          if (idx >= 0) {
            this.p1CursorIdx = idx;
            this.refreshSelectUI();
          }
        };
        card.addEventListener('click', selectHero);
        card.addEventListener('keydown', (e) => {
          if (e.code === 'Enter' || e.code === 'Space') {
            e.preventDefault();
            selectHero();
          }
        });
        strip.appendChild(card);
      });
    }

    bindTopbarAndModals() {
      document.getElementById('btnTopHome')?.addEventListener('click', () => {
        this.leaveOnlineRoomIfAny();
        this.closeAllModals();
        this.showScreen('screenMenu');
      });
      document.getElementById('btnOpenProfile')?.addEventListener('click', () => this.openModal('modalProfile'));
      document.getElementById('btnP1Login')?.addEventListener('click', () => {
        setTimeout(() => {
          if (window.netplay && window.gameApp && window.gameApp.accounts) {
            window.netplay.setProfile(window.gameApp.accounts.state.p1);
          }
        }, 0);
      });
      const topRoomPill = document.getElementById('activeRoomPill');
      const handleTopRoomClick = () => {
        const code = (this.onlineRoom && this.onlineRoom.code) || (window.netplay && window.netplay.roomCode);
        if (!code) return;
        this.copyTextToClipboard(code).then((ok) => {
          if (ok && this.currentScreen === 'screenLobby') {
            this.showLobbyNotice(`Đã sao chép mã phòng ${code}.`, 2400);
          }
        });
      };
      topRoomPill?.addEventListener('click', handleTopRoomClick);
      topRoomPill?.addEventListener('keydown', (e) => {
        if (e.code === 'Enter' || e.code === 'Space') {
          e.preventDefault();
          handleTopRoomClick();
        }
      });
      document.getElementById('btnTopControls')?.addEventListener('click', () => this.openModal('modalControls'));
      document.getElementById('btnTopMugen')?.addEventListener('click', () => this.openModal('modalMugen'));

      const btnSound = document.getElementById('btnTopSound');
      btnSound?.addEventListener('click', () => {
        if (!window.gameApp || !window.gameApp.sfx) return;
        const muted = window.gameApp.sfx.toggleMute();
        btnSound.classList.toggle('is-muted', muted);
        btnSound.setAttribute('aria-pressed', String(!muted));
        this.setButtonLabel(btnSound, muted ? 'Âm: TẮT' : 'Âm: BẬT');
      });

      document.querySelectorAll('[data-close-modal]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.closeModal;
          this.closeModal(id);
          if (id === 'modalPause' && window.gameApp) window.gameApp.setPaused(false);
        });
      });

      // Click outside modal card closes utility/pause modals (not Victory)
      document.querySelectorAll('.bvn-modal').forEach((modal) => {
        modal.addEventListener('click', (e) => {
          if (e.target !== modal || modal.id === 'modalVictory') return;
          this.closeModal(modal.id);
          if (modal.id === 'modalPause' && window.gameApp) window.gameApp.setPaused(false);
        });
      });
    }

    bindMenuEvents() {
      const btns = Array.from(document.querySelectorAll('.bvn-menu-btn'));
      btns.forEach((btn, idx) => {
        btn.addEventListener('mouseenter', () => {
          this.menuFocusIdx = idx;
          btns.forEach((b, i) => b.classList.toggle('focused', i === idx));
        });
        btn.addEventListener('click', () => {
          this.playSfx('ui_confirm');
          const action = btn.dataset.menuAction;
          if (action === 'ONLINE_PVP') {
            this.mode = 'ONLINE_PVP';
            this.showScreen('screenLobby');
            this.renderNetStatus(this.netStatus);
            if (window.netplay) {
              if (!window.netplay.connected && typeof window.netplay.connect === 'function') {
                window.netplay.connect();
              } else {
                window.netplay.requestRooms();
              }
            }
          } else if (action === 'TEAM_CPU') {
            this.enterCharacterSelect('TEAM_CPU', '3v3');
          } else if (action === 'SINGLE_CPU') {
            this.enterCharacterSelect('SINGLE_CPU', '1v1');
          } else if (action === 'LOCAL_2P') {
            this.enterCharacterSelect('LOCAL_2P', '1v1');
          } else if (action === 'TRAINING') {
            this.enterCharacterSelect('TRAINING', '1v1');
          }
        });
      });
    }

    // ==================== 2. ONLINE MULTIPLAYER LOBBY ====================
    bindLobbyEvents() {
      document.getElementById('btnLobbyBack')?.addEventListener('click', () => {
        this.leaveOnlineRoomIfAny();
        this.clearInviteParamFromUrl();
        this.clearLobbyError();
        this.clearLobbyNotice();
        this.showScreen('screenMenu');
      });

      document.getElementById('btnLobbyReconnect')?.addEventListener('click', () => {
        this.clearLobbyError();
        if (!window.netplay) return;
        if (typeof window.netplay.reconnectNow === 'function') {
          window.netplay.reconnectNow();
        } else if (typeof window.netplay.reconnect === 'function') {
          window.netplay.reconnect();
        } else {
          window.netplay.connect();
        }
      });

      document.querySelectorAll('[data-lobby-format]').forEach((btn) => {
        btn.addEventListener('click', () => {
          this.lobbyFormat = btn.dataset.lobbyFormat === '3v3' ? '3v3' : '1v1';
          document.querySelectorAll('[data-lobby-format]').forEach((b) => b.classList.toggle('active', b === btn));
        });
      });

      document.querySelectorAll('[data-lobby-visibility]').forEach((btn) => {
        btn.addEventListener('click', () => {
          this.lobbyVisibility = btn.dataset.lobbyVisibility === 'private' ? 'private' : 'public';
          document.querySelectorAll('[data-lobby-visibility]').forEach((b) => b.classList.toggle('active', b === btn));
        });
      });

      document.getElementById('btnToggleCreatePwd')?.addEventListener('click', () => {
        const pwdInput = document.getElementById('inputLobbyRoomPassword');
        const toggleBtn = document.getElementById('btnToggleCreatePwd');
        if (!pwdInput || !toggleBtn) return;
        const showing = pwdInput.type === 'text';
        pwdInput.type = showing ? 'password' : 'text';
        toggleBtn.textContent = showing ? 'Hiện' : 'Ẩn';
      });

      document.getElementById('btnCreateRoom')?.addEventListener('click', () => {
        if (!this.ensureWsConnected() || this.pendingLobbyAction) return;
        const name = (document.getElementById('inputLobbyRoomName')?.value || '').trim().slice(0, 32);
        const password = (document.getElementById('inputLobbyRoomPassword')?.value || '').trim().slice(0, 24);
        this.clearLobbyError();
        this.clearLobbyNotice();
        this.setPendingLobbyAction('create');
        this.playSfx('ui_confirm');
        window.netplay.createRoom({
          name,
          matchFormat: this.lobbyFormat,
          visibility: this.lobbyVisibility,
          password
        });
      });

      document.getElementById('btnQuickMatch')?.addEventListener('click', () => {
        if (!this.ensureWsConnected() || this.pendingLobbyAction) return;
        this.clearLobbyError();
        this.clearLobbyNotice();
        this.setPendingLobbyAction('quick');
        this.playSfx('ui_confirm');
        window.netplay.quickMatch(this.lobbyFormat);
      });

      document.getElementById('btnCancelQuickMatch')?.addEventListener('click', () => {
        this.stopQueueTimer();
        if (window.netplay) {
          if (typeof window.netplay.cancelQuickMatch === 'function') {
            window.netplay.cancelQuickMatch();
          } else {
            window.netplay.leaveRoom();
          }
        }
        this.clearPendingLobbyAction();
        this.setLobbyView('hub');
      });

      document.getElementById('btnJoinRoomByCode')?.addEventListener('click', () => {
        const raw = (document.getElementById('inputLobbyRoomCode')?.value || '').trim().toUpperCase();
        const code = raw.replace(/[^A-Z0-9]/g, '');
        if (!code || code.length < 4 || code.length > 8) {
          this.showLobbyError('Mã phòng không hợp lệ. Vui lòng nhập 4–8 ký tự chữ hoặc số.');
          return;
        }
        this.joinRoomWithCheck(code);
      });

      document.getElementById('inputLobbyRoomCode')?.addEventListener('input', (e) => {
        const el = e.target;
        const cleaned = el.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
        if (el.value !== cleaned) el.value = cleaned;
      });

      document.getElementById('inputLobbyRoomCode')?.addEventListener('keydown', (e) => {
        if (e.code === 'Enter') {
          e.preventDefault();
          document.getElementById('btnJoinRoomByCode')?.click();
        }
      });

      document.querySelectorAll('[data-room-filter]').forEach((btn) => {
        btn.addEventListener('click', () => {
          this.roomListFilter = btn.dataset.roomFilter || 'all';
          document.querySelectorAll('[data-room-filter]').forEach((b) => b.classList.toggle('active', b === btn));
          this.renderOpenRooms(this.lobbyRoomsCache, this.lobbyOnlineCount);
        });
      });

      document.getElementById('btnRefreshRooms')?.addEventListener('click', () => {
        if (!this.ensureWsConnected()) return;
        window.netplay.requestRooms();
      });

      // Staging Room Controls
      document.getElementById('btnCopyRoomCode')?.addEventListener('click', () => {
        const code = (this.onlineRoom && this.onlineRoom.code) || (window.netplay && window.netplay.roomCode);
        if (!code) return;
        const btn = document.getElementById('btnCopyRoomCode');
        this.copyTextToClipboard(code).then((ok) => {
          if (ok) {
            this.flashButtonFeedback(btn, 'Đã Sao Chép Mã', 'Sao Chép Mã');
            this.showLobbyNotice(`Đã sao chép mã phòng ${code}.`, 2400);
          } else {
            this.showLobbyError('Không thể tự động sao chép. Vui lòng bôi đen mã phòng để sao chép.');
          }
        });
      });

      const handleCopyInvite = (triggerBtn, defaultLabel) => {
        const code = (this.onlineRoom && this.onlineRoom.code) || (window.netplay && window.netplay.roomCode);
        if (!code) return;
        const inviteUrl = this.getShareInviteUrl(code);
        this.copyTextToClipboard(inviteUrl).then((ok) => {
          if (ok) {
            this.flashButtonFeedback(triggerBtn, 'Đã Sao Chép Link', defaultLabel);
            this.showLobbyNotice('Đã sao chép link mời! Gửi cho bạn bè để vào thẳng phòng.', 2600);
          } else {
            const urlInput = document.getElementById('roomInviteUrlInput');
            if (urlInput) {
              urlInput.focus();
              urlInput.select();
            }
            this.showLobbyError('Trình duyệt chặn sao chép tự động — hãy nhấn Ctrl+C từ ô link mời.');
          }
        });
      };

      document.getElementById('btnCopyInviteLink')?.addEventListener('click', (e) => {
        handleCopyInvite(e.currentTarget, 'Sao Chép Link Mời');
      });

      document.getElementById('btnCopyInviteInline')?.addEventListener('click', (e) => {
        handleCopyInvite(e.currentTarget, 'Sao Chép');
      });

      document.getElementById('roomInviteUrlInput')?.addEventListener('click', (e) => {
        e.target.select();
      });

      document.getElementById('btnLeaveRoomStage')?.addEventListener('click', () => {
        this.leaveOnlineRoomIfAny();
        this.clearInviteParamFromUrl();
        this.clearLobbyError();
        this.clearLobbyNotice();
      });

      document.querySelectorAll('[data-room-edit-format]').forEach((btn) => {
        btn.addEventListener('click', () => {
          if (this.onlineRole !== 'host' || !this.onlineRoom || !window.netplay) return;
          const nextFmt = btn.dataset.roomEditFormat === '3v3' ? '3v3' : '1v1';
          if (this.onlineRoom.matchFormat === nextFmt) return;
          if (typeof window.netplay.updateRoom === 'function') {
            window.netplay.updateRoom({ matchFormat: nextFmt });
          }
        });
      });

      document.querySelectorAll('[data-room-edit-vis]').forEach((btn) => {
        btn.addEventListener('click', () => {
          if (this.onlineRole !== 'host' || !this.onlineRoom || !window.netplay) return;
          const nextVis = btn.dataset.roomEditVis === 'private' ? 'private' : 'public';
          if (this.onlineRoom.visibility === nextVis) return;
          if (typeof window.netplay.updateRoom === 'function') {
            window.netplay.updateRoom({ visibility: nextVis });
          }
        });
      });

      document.getElementById('btnKickGuest')?.addEventListener('click', () => {
        if (this.onlineRole !== 'host' || !this.onlineRoom || !this.onlineRoom.p2 || !window.netplay) return;
        if (typeof window.netplay.kickGuest === 'function') {
          window.netplay.kickGuest('Chủ phòng đã mời bạn ra khỏi phòng.');
        }
      });

      document.getElementById('btnToggleReady')?.addEventListener('click', () => {
        if (this.onlineRole !== 'guest' || !this.onlineRoom || !window.netplay) return;
        const currentReady = Boolean(this.onlineRoom.p2 && this.onlineRoom.p2.ready);
        this.playSfx('ui_confirm');
        if (typeof window.netplay.setReady === 'function') {
          window.netplay.setReady(!currentReady);
        } else if (typeof window.netplay.setRoomReady === 'function') {
          window.netplay.setRoomReady(!currentReady);
        }
      });

      document.getElementById('btnStartRoomMatch')?.addEventListener('click', () => {
        if (this.onlineRole !== 'host' || !this.onlineRoom || !window.netplay) return;
        if (!this.onlineRoom.p2 || !this.onlineRoom.p2.ready) {
          this.showLobbyError('Đối thủ chưa sẵn sàng để bắt đầu trận đấu.');
          return;
        }
        this.clearLobbyError();
        this.setPendingLobbyAction('start');
        this.playSfx('ui_confirm');
        if (typeof window.netplay.startMatch === 'function') {
          window.netplay.startMatch();
        } else if (typeof window.netplay.startRoomMatch === 'function') {
          window.netplay.startRoomMatch();
        }
      });

      // Password Modal Events
      document.getElementById('btnConfirmRoomPassword')?.addEventListener('click', () => {
        if (!this.ensureWsConnected()) return;
        const code = this.pendingPasswordRoomCode;
        const pwd = (document.getElementById('inputRoomModalPassword')?.value || '').trim();
        const errEl = document.getElementById('pwdModalError');
        if (!pwd) {
          if (errEl) {
            errEl.textContent = 'Vui lòng nhập mật khẩu phòng.';
            errEl.classList.remove('hidden');
          }
          return;
        }
        if (errEl) errEl.classList.add('hidden');
        this.setPendingLobbyAction('join');
        this.playSfx('ui_confirm');
        window.netplay.joinRoom(code, pwd);
      });

      document.getElementById('inputRoomModalPassword')?.addEventListener('keydown', (e) => {
        if (e.code === 'Enter') {
          e.preventDefault();
          document.getElementById('btnConfirmRoomPassword')?.click();
        }
      });

      document.querySelectorAll('[data-close-modal="modalRoomPassword"]').forEach((btn) => {
        btn.addEventListener('click', () => {
          this.pendingPasswordRoomCode = null;
          document.getElementById('pwdModalError')?.classList.add('hidden');
          const inp = document.getElementById('inputRoomModalPassword');
          if (inp) inp.value = '';
        });
      });
    }

    getShareInviteUrl(code) {
      if (window.netplay && typeof window.netplay.buildInviteUrl === 'function') {
        return window.netplay.buildInviteUrl(code);
      }
      return `${window.location.origin}${window.location.pathname}?room=${encodeURIComponent(code)}`;
    }

    clearInviteParamFromUrl() {
      if (window.netplay && typeof window.netplay.clearInviteFromUrl === 'function') {
        window.netplay.clearInviteFromUrl();
        return;
      }
      try {
        const u = new URL(window.location.href);
        if (u.searchParams.has('room')) {
          u.searchParams.delete('room');
          window.history.replaceState({}, '', u.pathname + u.search + u.hash);
        }
      } catch (_) {}
    }

    copyTextToClipboard(text) {
      const val = String(text || '');
      if (!val) return Promise.resolve(false);
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function' && window.isSecureContext) {
        return navigator.clipboard.writeText(val).then(() => true).catch(() => this.fallbackCopyText(val));
      }
      return Promise.resolve(this.fallbackCopyText(val));
    }

    fallbackCopyText(text) {
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(ta);
        return Boolean(ok);
      } catch (_) {
        return false;
      }
    }

    flashButtonFeedback(btn, tempText, restoreText) {
      if (!btn) return;
      this.setButtonLabel(btn, tempText);
      if (btn._flashTimer) clearTimeout(btn._flashTimer);
      btn._flashTimer = setTimeout(() => {
        this.setButtonLabel(btn, restoreText);
        btn._flashTimer = null;
      }, 1800);
    }

    isLocalDevHost() {
      if (window.GAME_DEPLOY_CONFIG && typeof window.GAME_DEPLOY_CONFIG.IS_LOCAL_HOST === 'boolean') {
        return window.GAME_DEPLOY_CONFIG.IS_LOCAL_HOST;
      }
      const h = (window.location.hostname || '').toLowerCase();
      return (
        h === 'localhost' ||
        h === '127.0.0.1' ||
        h === '::1' ||
        /^192\.168\./.test(h) ||
        /^10\./.test(h) ||
        /^172\.(1[6-9]|2\d|3[0-1])\./.test(h)
      );
    }

    setPendingLobbyAction(action) {
      this.pendingLobbyAction = action;
      if (this.pendingActionTimer) clearTimeout(this.pendingActionTimer);
      this.pendingActionTimer = setTimeout(() => {
        this.pendingLobbyAction = null;
        this.updateLobbyActionButtons();
      }, 8000);
      this.updateLobbyActionButtons();
    }

    clearPendingLobbyAction() {
      this.pendingLobbyAction = null;
      if (this.pendingActionTimer) {
        clearTimeout(this.pendingActionTimer);
        this.pendingActionTimer = null;
      }
      this.updateLobbyActionButtons();
    }

    updateLobbyActionButtons() {
      const connected = Boolean(window.netplay && window.netplay.connected);
      const busy = Boolean(this.pendingLobbyAction);
      const disabled = !connected || busy;

      const btnCreate = document.getElementById('btnCreateRoom');
      const btnQuick = document.getElementById('btnQuickMatch');
      const btnJoin = document.getElementById('btnJoinRoomByCode');
      const btnRefresh = document.getElementById('btnRefreshRooms');

      if (btnCreate) {
        btnCreate.disabled = disabled;
        this.setButtonLabel(btnCreate, this.pendingLobbyAction === 'create' ? 'ĐANG TẠO...' : 'TẠO PHÒNG MỚI');
      }
      if (btnQuick) {
        btnQuick.disabled = disabled;
        this.setButtonLabel(btnQuick, this.pendingLobbyAction === 'quick' ? 'ĐANG GHÉP...' : 'GHÉP NGẪU NHIÊN');
      }
      if (btnJoin) {
        btnJoin.disabled = disabled;
        this.setButtonLabel(btnJoin, this.pendingLobbyAction === 'join' ? 'Đang Vào...' : 'Vào Phòng');
      }
      if (btnRefresh) {
        btnRefresh.disabled = !connected;
      }

      const btnStart = document.getElementById('btnStartRoomMatch');
      if (btnStart && this.onlineRoom && this.onlineRole === 'host') {
        const canStart = connected && Boolean(this.onlineRoom.p2 && this.onlineRoom.p2.ready) && this.pendingLobbyAction !== 'start';
        btnStart.disabled = !canStart;
        this.setButtonLabel(btnStart, this.pendingLobbyAction === 'start' ? 'ĐANG BẮT ĐẦU...' : 'BẮT ĐẦU CHỌN TƯỚNG');
      }
    }

    setLobbyView(viewMode) {
      this.lobbyViewMode = viewMode;
      const hubEl = document.getElementById('lobbyHubView');
      const createFormEl = document.getElementById('lobbyCreateForm');
      const queueBoxEl = document.getElementById('lobbyQueueBox');
      const roomViewEl = document.getElementById('lobbyRoomView');

      if (viewMode === 'room') {
        hubEl?.classList.add('hidden');
        roomViewEl?.classList.remove('hidden');
      } else {
        roomViewEl?.classList.add('hidden');
        hubEl?.classList.remove('hidden');
        if (viewMode === 'queue') {
          createFormEl?.classList.add('hidden');
          queueBoxEl?.classList.remove('hidden');
        } else {
          queueBoxEl?.classList.add('hidden');
          createFormEl?.classList.remove('hidden');
        }
      }
      this.updateLobbyActionButtons();
    }

    startQueueTimer(matchFormat) {
      this.stopQueueTimer();
      this.queueStartedAt = Date.now();
      const fmt = (matchFormat || this.lobbyFormat || '1v1').toUpperCase();
      const titleEl = document.getElementById('lobbyQueueTitle');
      const metaEl = document.getElementById('lobbyQueueMeta');
      if (titleEl) titleEl.textContent = `ĐANG TÌM ĐỐI THỦ NGẪU NHIÊN (${fmt})...`;
      const tick = () => {
        const sec = Math.max(0, Math.floor((Date.now() - this.queueStartedAt) / 1000));
        const mm = String(Math.floor(sec / 60)).padStart(2, '0');
        const ss = String(sec % 60).padStart(2, '0');
        if (metaEl) metaEl.textContent = `Thể thức ${fmt} · Thời gian chờ: ${mm}:${ss}`;
      };
      tick();
      this.queueTimerId = setInterval(tick, 1000);
    }

    stopQueueTimer() {
      if (this.queueTimerId) {
        clearInterval(this.queueTimerId);
        this.queueTimerId = null;
      }
    }

    openRoomPasswordModal(code, errorText) {
      this.pendingPasswordRoomCode = String(code || '').trim().toUpperCase();
      const codeEl = document.getElementById('pwdModalRoomCode');
      const inp = document.getElementById('inputRoomModalPassword');
      const errEl = document.getElementById('pwdModalError');
      if (codeEl) codeEl.textContent = this.pendingPasswordRoomCode || '------';
      if (inp) inp.value = '';
      if (errEl) {
        if (errorText) {
          errEl.textContent = errorText;
          errEl.classList.remove('hidden');
        } else {
          errEl.classList.add('hidden');
        }
      }
      this.openModal('modalRoomPassword');
      setTimeout(() => inp?.focus(), 40);
    }

    joinRoomWithCheck(code, hasPassword) {
      if (!this.ensureWsConnected() || this.pendingLobbyAction) return;
      const cleanCode = String(code || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (!cleanCode) return;
      if (this.onlineRoom && this.onlineRoom.code === cleanCode) return;
      this.clearLobbyError();
      if (hasPassword) {
        this.openRoomPasswordModal(cleanCode);
        return;
      }
      this.pendingPasswordRoomCode = cleanCode;
      this.setPendingLobbyAction('join');
      this.playSfx('ui_confirm');
      window.netplay.joinRoom(cleanCode, '');
    }

    ensureWsConnected() {
      if (!window.netplay || !window.netplay.connected) {
        if (this.netStatus && (this.netStatus.state === 'waking' || this.netStatus.waking)) {
          this.showLobbyError('Máy chủ Online đang khởi động (Render Free mất 20–45 giây). Vui lòng đợi kết nối hoàn tất.');
        } else if (this.netStatus && this.netStatus.mode === 'unconfigured_remote') {
          this.showLobbyError('Chưa cấu hình địa chỉ máy chủ Online cho bản triển khai này.');
        } else {
          this.showLobbyError('Chưa kết nối được máy chủ Online. Bấm "Thử Kết Nối Lại" hoặc chờ giây lát.');
        }
        return false;
      }
      return true;
    }

    showLobbyError(msg) {
      const el = document.getElementById('lobbyErrorMsg');
      if (el) {
        el.textContent = msg;
        el.classList.remove('hidden');
      }
    }

    clearLobbyError() {
      document.getElementById('lobbyErrorMsg')?.classList.add('hidden');
    }

    showLobbyNotice(msg, durationMs) {
      const el = document.getElementById('lobbyNoticeMsg');
      if (!el) return;
      el.textContent = msg;
      el.classList.remove('hidden');
      if (this.lobbyNoticeTimer) clearTimeout(this.lobbyNoticeTimer);
      if (durationMs && durationMs > 0) {
        this.lobbyNoticeTimer = setTimeout(() => {
          el.classList.add('hidden');
          this.lobbyNoticeTimer = null;
        }, durationMs);
      }
    }

    clearLobbyNotice() {
      if (this.lobbyNoticeTimer) {
        clearTimeout(this.lobbyNoticeTimer);
        this.lobbyNoticeTimer = null;
      }
      document.getElementById('lobbyNoticeMsg')?.classList.add('hidden');
    }

    leaveOnlineRoomIfAny() {
      this.stopQueueTimer();
      this.clearPendingLobbyAction();
      if (this.lobbyViewMode === 'queue' && window.netplay) {
        if (typeof window.netplay.cancelQuickMatch === 'function') {
          window.netplay.cancelQuickMatch();
        } else {
          window.netplay.leaveRoom();
        }
      } else if (window.netplay && (window.netplay.roomCode || this.onlineRole || this.onlineRoom)) {
        window.netplay.leaveRoom();
      }
      this.onlineRole = null;
      this.onlineRoom = null;
      this.onlineLanUrls = [];
      this.lastRoomEventKey = '';
      document.getElementById('activeRoomPill')?.classList.add('hidden');
      this.setLobbyView('hub');
    }

    renderNetStatus(st) {
      const status = st || this.netStatus || {};
      const connected = Boolean(status.connected);
      const state = status.state || (connected ? 'connected' : (status.waking ? 'waking' : 'offline'));
      this.netStatus = { ...this.netStatus, ...status, state, connected };

      const pill = document.getElementById('netStatusPill');
      const txt = document.getElementById('netStatusText');
      const lobbyBadge = document.getElementById('lobbyOnlineBadge');
      const menuOnline = document.getElementById('menuOnlineCount');
      const pingBadge = document.getElementById('lobbyServerPingBadge');
      const banner = document.getElementById('lobbyConnBanner');
      const bannerTitle = document.getElementById('lobbyConnTitle');
      const bannerSub = document.getElementById('lobbyConnSub');
      const bannerElapsed = document.getElementById('lobbyConnElapsed');

      const onlineCount = connected ? Math.max(1, Number(this.lobbyOnlineCount || (window.netplay && window.netplay.onlineCount) || 1)) : 0;

      if (pill && txt) {
        pill.classList.remove('online', 'connecting', 'waking', 'offline');
        if (connected) {
          pill.classList.add('online');
          const pingMs = window.netplay && window.netplay.pingMs;
          txt.textContent = pingMs ? `Online · ${onlineCount} · ${pingMs}ms` : `Online · ${onlineCount}`;
        } else if (state === 'waking' || status.waking) {
          pill.classList.add('waking');
          const sec = Math.max(1, Math.round((status.elapsedMs || 0) / 1000));
          txt.textContent = `Đang đánh thức... ${sec}s`;
        } else if (state === 'connecting' || state === 'reconnecting') {
          pill.classList.add('connecting');
          txt.textContent = state === 'reconnecting' && status.attempt > 1
            ? `Kết nối lại (#${status.attempt})...`
            : 'Đang kết nối...';
        } else {
          pill.classList.add('offline');
          if (status.reason === 'file_protocol') txt.textContent = 'Chế độ Offline';
          else if (status.mode === 'unconfigured_remote') txt.textContent = 'Chưa cấu hình server';
          else txt.textContent = 'Mất kết nối';
        }
      }

      if (menuOnline) {
        menuOnline.textContent = connected ? String(onlineCount) : '0';
      }

      if (lobbyBadge) {
        lobbyBadge.classList.remove('is-waking', 'is-offline');
        if (connected) {
          this.setStatusLabel(lobbyBadge, `${onlineCount} Người Online`);
        } else if (state === 'waking' || state === 'connecting' || state === 'reconnecting') {
          lobbyBadge.classList.add('is-waking');
          this.setStatusLabel(lobbyBadge, state === 'waking' ? 'Đang khởi động server...' : 'Đang kết nối...');
        } else {
          lobbyBadge.classList.add('is-offline');
          this.setStatusLabel(lobbyBadge, 'Ngoại tuyến');
        }
      }

      if (pingBadge && !connected) {
        pingBadge.classList.add('hidden');
      }

      if (banner && bannerTitle && bannerSub) {
        banner.classList.remove('is-offline', 'is-waking');
        if (connected) {
          banner.classList.add('hidden');
        } else {
          banner.classList.remove('hidden');
          const sec = Math.max(0, Math.round((status.elapsedMs || 0) / 1000));
          if (state === 'waking' || status.waking) {
            banner.classList.add('is-waking');
            bannerTitle.textContent = 'Đang đánh thức máy chủ Online...';
            bannerSub.textContent = 'Máy chủ miễn phí đang khởi động lại (thường mất 20–45 giây). Hệ thống sẽ tự kết nối ngay khi sẵn sàng.';
            if (bannerElapsed) {
              bannerElapsed.textContent = `${sec}s`;
              bannerElapsed.classList.remove('hidden');
            }
          } else if (state === 'connecting' || state === 'reconnecting') {
            bannerTitle.textContent = state === 'reconnecting'
              ? `Đang kết nối lại máy chủ Online (lần ${status.attempt || 1})...`
              : 'Đang kết nối máy chủ Online...';
            bannerSub.textContent = 'Nếu máy chủ vừa tạm nghỉ, quá trình đánh thức có thể mất khoảng 20–45 giây.';
            if (bannerElapsed) {
              if (sec > 0) {
                bannerElapsed.textContent = `${sec}s`;
                bannerElapsed.classList.remove('hidden');
              } else {
                bannerElapsed.classList.add('hidden');
              }
            }
          } else {
            banner.classList.add('is-offline');
            if (status.reason === 'file_protocol') {
              bannerTitle.textContent = 'Đang mở trực tiếp tệp cục bộ (Chế độ Offline)';
              bannerSub.textContent = 'Chế độ Online PvP cần kết nối tới máy chủ trò chơi.';
            } else if (status.mode === 'unconfigured_remote') {
              bannerTitle.textContent = 'Chưa cấu hình máy chủ Online';
              bannerSub.textContent = 'Thiếu địa chỉ kết nối máy chủ Online trong cấu hình triển khai (config.js).';
            } else {
              bannerTitle.textContent = 'Không thể kết nối máy chủ Online';
              bannerSub.textContent = 'Kiểm tra mạng của bạn hoặc bấm "Thử Kết Nối Lại" để đánh thức máy chủ.';
            }
            bannerElapsed?.classList.add('hidden');
          }
        }
      }

      this.updateLobbyActionButtons();
      this.renderOpenRooms(this.lobbyRoomsCache, onlineCount);
    }

    renderOpenRooms(rooms, onlineCount) {
      const list = Array.isArray(rooms) ? rooms : [];
      this.lobbyRoomsCache = list;
      const connected = Boolean(window.netplay && window.netplay.connected);
      if (typeof onlineCount === 'number' && connected) {
        this.lobbyOnlineCount = Math.max(1, onlineCount);
        const menuOnline = document.getElementById('menuOnlineCount');
        const lobbyBadge = document.getElementById('lobbyOnlineBadge');
        if (menuOnline) menuOnline.textContent = String(this.lobbyOnlineCount);
        if (lobbyBadge) {
          lobbyBadge.classList.remove('is-waking', 'is-offline');
          this.setStatusLabel(lobbyBadge, `${this.lobbyOnlineCount} Người Online`);
        }
      }

      const filtered = list.filter((r) => {
        if (this.roomListFilter === 'all') return true;
        return String(r.matchFormat || '1v1').toLowerCase() === this.roomListFilter;
      });

      const countEl = document.getElementById('lobbyOpenRoomsCount');
      if (countEl) countEl.textContent = String(filtered.length);

      const listEl = document.getElementById('openRoomsList');
      if (!listEl) return;

      if (!connected) {
        const isWaking = this.netStatus && (this.netStatus.state === 'waking' || this.netStatus.state === 'connecting' || this.netStatus.state === 'reconnecting');
        listEl.innerHTML = `<div class="rooms-empty">${
          isWaking
            ? 'Đang kết nối tới máy chủ để tải danh sách phòng công khai...'
            : 'Chưa kết nối máy chủ Online. Bấm <strong>Thử Kết Nối Lại</strong> ở thanh trên để tải danh sách phòng.'
        }</div>`;
        return;
      }

      if (filtered.length === 0) {
        const filterText = this.roomListFilter === 'all' ? '' : ` thể thức <strong>${this.escapeHtml(this.roomListFilter.toUpperCase())}</strong>`;
        listEl.innerHTML = `<div class="rooms-empty">Chưa có phòng công khai${filterText} nào đang chờ. Bấm <strong>Tạo Phòng Mới</strong> hoặc <strong>Ghép Ngẫu Nhiên</strong> để bắt đầu.</div>`;
        return;
      }

      listEl.innerHTML = '';
      filtered.forEach((r) => {
        const row = document.createElement('div');
        const hasPwd = Boolean(r.hasPassword);
        row.className = `room-row${hasPwd ? ' locked' : ''}`;
        const fmt = this.escapeHtml((r.matchFormat || '1v1').toUpperCase());
        const code = this.escapeHtml(r.code || '------');
        const roomName = this.escapeHtml(r.name || `Phòng ${r.code || ''}`);
        const hostName = this.escapeHtml(r.hostName || 'Player');
        const hostTag = this.escapeHtml(r.hostTag || '');
        const hostElo = Number(r.hostElo) || 1200;
        const players = Number(r.players) || 1;
        const maxPlayers = Number(r.maxPlayers) || 2;
        const lockHtml = hasPwd ? '<span class="room-lock-tag" title="Phòng có mật khẩu">KHÓA</span>' : '';

        row.innerHTML = `
          <div class="room-row-info">
            <div class="room-row-title-line">
              <strong title="${roomName}">${roomName}</strong>
              <span class="room-code-chip">#${code}</span>
              <span class="room-fmt-tag">${fmt}</span>
              ${lockHtml}
            </div>
            <small>${hostName} ${hostTag} · Elo ${hostElo} · ${players}/${maxPlayers} người</small>
          </div>
          <button type="button" class="bvn-btn primary sm nowrap">${hasPwd ? 'Mở Khóa' : 'Vào Phòng'}</button>
        `;
        row.querySelector('button').addEventListener('click', () => {
          this.joinRoomWithCheck(r.code, hasPwd);
        });
        listEl.appendChild(row);
      });
    }

    renderRoomStage() {
      const room = this.onlineRoom;
      if (!room) {
        this.setLobbyView('hub');
        return;
      }
      const isHost = this.onlineRole === 'host';
      const fmt = (room.matchFormat || '1v1').toUpperCase();
      const isPrivate = room.visibility === 'private';
      const hasPwd = Boolean(room.hasPassword);
      const p1 = room.p1 || { nickname: 'Chủ Phòng', tag: '#1000', elo: 1200, ready: true };
      const p2 = room.p2 || null;

      const nameEl = document.getElementById('roomStageName');
      const fmtBadge = document.getElementById('roomStageFormatBadge');
      const visBadge = document.getElementById('roomStageVisBadge');
      const lockBadge = document.getElementById('roomStageLockBadge');
      const subEl = document.getElementById('roomStageSub');
      const codeEl = document.getElementById('roomStageCode');
      const leaveBtn = document.getElementById('btnLeaveRoomStage');

      if (nameEl) nameEl.textContent = room.name || `Phòng ${room.code}`;
      if (fmtBadge) fmtBadge.textContent = fmt;
      if (visBadge) {
        visBadge.textContent = isPrivate ? 'RIÊNG TƯ' : 'CÔNG KHAI';
        visBadge.classList.toggle('private', isPrivate);
      }
      if (lockBadge) lockBadge.classList.toggle('hidden', !hasPwd);
      if (codeEl) codeEl.textContent = room.code || '------';
      if (leaveBtn) this.setButtonLabel(leaveBtn, isHost && !p2 ? 'Đóng Phòng' : 'Rời Phòng');

      if (subEl) {
        if (!p2) {
          subEl.textContent = isPrivate
            ? 'Phòng riêng tư · Chỉ bạn bè có mã hoặc link mời mới có thể tham gia.'
            : 'Phòng công khai đang hiển thị trong danh sách · Đang chờ đối thủ vào phòng.';
        } else if (p2.ready) {
          subEl.textContent = isHost
            ? 'Đối thủ đã sẵn sàng! Bấm "Bắt Đầu Chọn Tướng" để vào màn chọn đội hình.'
            : 'Bạn đã sẵn sàng! Chờ chủ phòng bấm Bắt Đầu.';
        } else {
          subEl.textContent = isHost
            ? `${p2.nickname} đã vào phòng · Đang chờ đối thủ bấm Sẵn Sàng.`
            : 'Kiểm tra thể thức trận đấu rồi bấm "Sẵn Sàng" để bắt đầu.';
        }
      }

      // Host quick settings bar
      const hostSettings = document.getElementById('roomHostSettingsBar');
      if (hostSettings) {
        hostSettings.classList.toggle('hidden', !isHost);
        if (isHost) {
          hostSettings.querySelectorAll('[data-room-edit-format]').forEach((b) => {
            b.classList.toggle('active', b.dataset.roomEditFormat === (room.matchFormat || '1v1'));
          });
          hostSettings.querySelectorAll('[data-room-edit-vis]').forEach((b) => {
            b.classList.toggle('active', b.dataset.roomEditVis === (isPrivate ? 'private' : 'public'));
          });
        }
      }

      // P1 Host slot
      const p1NameEl = document.getElementById('roomP1Name');
      const p1TagEl = document.getElementById('roomP1TagElo');
      const p1ReadyEl = document.getElementById('roomP1ReadyBadge');
      if (p1NameEl) p1NameEl.textContent = `${p1.nickname || 'Chủ Phòng'}${isHost ? ' (Bạn)' : ''}`;
      if (p1TagEl) p1TagEl.textContent = `${p1.tag || '#1000'} · Elo ${Number(p1.elo) || 1200}`;
      if (p1ReadyEl) {
        p1ReadyEl.textContent = 'SẴN SÀNG';
        p1ReadyEl.className = 'ready-pill ready';
      }

      // P2 Guest slot
      const p2Card = document.getElementById('roomSlotP2');
      const p2Filled = document.getElementById('roomP2Filled');
      const p2Empty = document.getElementById('roomP2Empty');
      const kickBtn = document.getElementById('btnKickGuest');

      if (p2) {
        p2Filled?.classList.remove('hidden');
        p2Empty?.classList.add('hidden');
        p2Card?.classList.toggle('is-ready', Boolean(p2.ready));
        const p2NameEl = document.getElementById('roomP2Name');
        const p2TagEl = document.getElementById('roomP2TagElo');
        const p2ReadyEl = document.getElementById('roomP2ReadyBadge');
        if (p2NameEl) p2NameEl.textContent = `${p2.nickname || 'Đối Thủ'}${!isHost ? ' (Bạn)' : ''}`;
        if (p2TagEl) p2TagEl.textContent = `${p2.tag || '#2000'} · Elo ${Number(p2.elo) || 1200}`;
        if (p2ReadyEl) {
          p2ReadyEl.textContent = p2.ready ? 'SẴN SÀNG' : 'CHƯA SẴN SÀNG';
          p2ReadyEl.className = `ready-pill ${p2.ready ? 'ready' : 'waiting'}`;
        }
        kickBtn?.classList.toggle('hidden', !isHost);
      } else {
        p2Filled?.classList.add('hidden');
        p2Empty?.classList.remove('hidden');
        p2Card?.classList.remove('is-ready');
        kickBtn?.classList.add('hidden');
        const inviteUrlInput = document.getElementById('roomInviteUrlInput');
        if (inviteUrlInput) inviteUrlInput.value = this.getShareInviteUrl(room.code);
        const lanEl = document.getElementById('lobbyLanHint');
        if (lanEl) {
          if (this.isLocalDevHost() && Array.isArray(this.onlineLanUrls) && this.onlineLanUrls.length > 0) {
            lanEl.textContent = `Cùng mạng Wi-Fi / LAN: ${this.onlineLanUrls[0]}/?room=${room.code}`;
            lanEl.classList.remove('hidden');
          } else {
            lanEl.textContent = '';
            lanEl.classList.add('hidden');
          }
        }
      }

      // Footer controls & hint
      const hintEl = document.getElementById('roomStageStatusHint');
      const btnReady = document.getElementById('btnToggleReady');
      const btnStart = document.getElementById('btnStartRoomMatch');

      if (isHost) {
        btnReady?.classList.add('hidden');
        btnStart?.classList.remove('hidden');
        if (hintEl) {
          if (!p2) hintEl.textContent = 'Chia sẻ mã phòng hoặc link mời cho bạn bè để bắt đầu.';
          else if (!p2.ready) hintEl.textContent = `Đang chờ ${p2.nickname} bấm Sẵn Sàng...`;
          else hintEl.textContent = 'Cả hai đã sẵn sàng! Bấm "Bắt Đầu Chọn Tướng" ngay.';
        }
      } else {
        btnStart?.classList.add('hidden');
        btnReady?.classList.remove('hidden');
        const myReady = Boolean(p2 && p2.ready);
        if (btnReady) {
          btnReady.classList.toggle('primary', !myReady);
          btnReady.classList.toggle('ghost', myReady);
          this.setButtonLabel(btnReady, myReady ? 'HỦY SẴN SÀNG' : 'SẴN SÀNG');
        }
        if (hintEl) {
          hintEl.textContent = myReady
            ? 'Bạn đã sẵn sàng! Đang chờ chủ phòng bấm Bắt Đầu.'
            : 'Bấm "Sẵn Sàng" khi bạn đã sẵn sàng bước vào màn chọn tướng.';
        }
      }

      this.updateLobbyActionButtons();
    }

    applyRoomStatePayload(msg) {
      if (!msg || !msg.room) return;
      const room = msg.room;
      const slot = msg.slot || (this.onlineRole === 'guest' ? 2 : 1);
      const eventName = msg.event || '';
      const dedupKey = `${room.code}:${room.status}:${room.updatedAt || ''}:${slot}:${eventName}:${Boolean(room.p2)}:${Boolean(room.p2 && room.p2.ready)}`;
      const isNewEvent = dedupKey !== this.lastRoomEventKey;
      this.lastRoomEventKey = dedupKey;

      this.clearPendingLobbyAction();
      this.stopQueueTimer();
      this.clearLobbyError();
      this.closeModal('modalRoomPassword');
      this.pendingPasswordRoomCode = null;

      this.mode = 'ONLINE_PVP';
      this.onlineRole = slot === 1 ? 'host' : 'guest';
      this.onlineRoom = room;
      if (Array.isArray(msg.lanUrls)) {
        this.onlineLanUrls = msg.lanUrls;
      }

      this.updateTopRoomPill(room.code, slot);
      this.clearInviteParamFromUrl();

      if (room.status === 'waiting' || room.status === 'lobby') {
        if (this.currentScreen !== 'screenLobby') {
          this.showScreen('screenLobby');
        }
        this.setLobbyView('room');
        this.renderRoomStage();

        if (isNewEvent) {
          if (eventName === 'guest_joined' && room.p2) {
            this.playSfx('ui_confirm');
            this.showLobbyNotice(`${room.p2.nickname} đã vào phòng!`, 3200);
          } else if (eventName === 'guest_left') {
            this.showLobbyNotice('Đối thủ đã rời phòng. Phòng vẫn đang mở chờ người chơi mới.', 4000);
          } else if (eventName === 'guest_kicked') {
            this.showLobbyNotice('Đã mời đối thủ ra khỏi phòng.', 3000);
          } else if (eventName === 'host_transferred') {
            this.showLobbyNotice('Chủ phòng cũ đã rời đi — bạn đã trở thành Chủ Phòng (P1)!', 4500);
          } else if (eventName === 'settings_updated') {
            this.showLobbyNotice(`Đã cập nhật cài đặt phòng (${(room.matchFormat || '1v1').toUpperCase()} · ${room.visibility === 'private' ? 'Riêng Tư' : 'Công Khai'}).`, 2600);
          }
        }
      }
    }

    formatServerError(code, fallbackMessage) {
      const map = {
        INVALID_INPUT: 'Dữ liệu phòng không hợp lệ. Vui lòng kiểm tra lại.',
        INVALID_CODE: 'Mã phòng không hợp lệ (cần 4–8 ký tự chữ hoặc số).',
        ROOM_NOT_FOUND: 'Không tìm thấy phòng với mã này hoặc phòng đã đóng.',
        ROOM_FULL: 'Phòng đã đủ 2 người chơi.',
        ROOM_IN_MATCH: 'Phòng này đang trong trận đấu, không thể tham gia lúc này.',
        PASSWORD_REQUIRED: 'Phòng này yêu cầu mật khẩu để vào.',
        WRONG_PASSWORD: 'Mật khẩu không đúng. Vui lòng thử lại.',
        NOT_HOST: 'Chỉ chủ phòng mới có quyền thực hiện thao tác này.',
        NOT_READY: 'Đối thủ cần bấm Sẵn Sàng trước khi bắt đầu.',
        ALREADY_IN_ROOM: 'Bạn đang ở trong một phòng khác.',
        RATE_LIMITED: 'Bạn thao tác quá nhanh. Vui lòng chờ vài giây rồi thử lại.',
        SERVER_FULL: 'Máy chủ đang quá tải. Vui lòng thử lại sau ít phút.'
      };
      return map[code] || fallbackMessage || 'Lỗi kết nối phòng.';
    }

    bindNetplayEvents() {
      if (!window.netplay) return;

      window.netplay.on('status', (st) => {
        const wasConnected = Boolean(this.netStatus && this.netStatus.connected);
        this.renderNetStatus(st);
        if (wasConnected && !st.connected) {
          this.clearPendingLobbyAction();
          this.stopQueueTimer();
          if (this.onlineRoom || this.lobbyViewMode !== 'hub') {
            this.onlineRole = null;
            this.onlineRoom = null;
            this.onlineLanUrls = [];
            document.getElementById('activeRoomPill')?.classList.add('hidden');
            this.setLobbyView('hub');
            if (this.currentScreen === 'screenSelect' || this.currentScreen === 'screenMapSelect' || this.currentScreen === 'screenBattle') {
              this.closeAllModals();
              this.showScreen('screenLobby');
              this.showLobbyError('Mất kết nối tới máy chủ Online. Trận đấu đã bị gián đoạn.');
            }
          }
        }
      });

      window.netplay.on('welcome', (msg) => {
        this.lobbyOnlineCount = Math.max(1, Number(msg.onlineCount) || 1);
        if (Array.isArray(msg.lanUrls)) this.onlineLanUrls = msg.lanUrls;
        this.renderNetStatus({
          state: 'connected',
          connected: true,
          waking: false,
          attempt: 0,
          elapsedMs: 0
        });
        this.renderOpenRooms(msg.rooms, this.lobbyOnlineCount);
      });

      window.netplay.on('ping', ({ pingMs, quality, onlineCount }) => {
        if (typeof onlineCount === 'number') this.lobbyOnlineCount = Math.max(1, onlineCount);
        if (this.netStatus.connected) {
          const txt = document.getElementById('netStatusText');
          if (txt) txt.textContent = `Online · ${this.lobbyOnlineCount} · ${pingMs}ms`;
          const menuOnline = document.getElementById('menuOnlineCount');
          if (menuOnline) menuOnline.textContent = String(this.lobbyOnlineCount);
          const lobbyBadge = document.getElementById('lobbyOnlineBadge');
          if (lobbyBadge) {
            lobbyBadge.classList.remove('is-waking', 'is-offline');
            this.setStatusLabel(lobbyBadge, `${this.lobbyOnlineCount} Người Online`);
          }
          const lobbyPing = document.getElementById('lobbyServerPingBadge');
          if (lobbyPing) {
            lobbyPing.textContent = `${pingMs}ms`;
            lobbyPing.classList.remove('hidden', 'good', 'fair', 'poor');
            const q = quality || (pingMs <= 80 ? 'good' : (pingMs <= 160 ? 'fair' : 'poor'));
            lobbyPing.classList.add(q);
          }
        }
        const bPing = document.getElementById('battlePingTag');
        if (bPing && !bPing.classList.contains('hidden')) {
          bPing.textContent = `${pingMs}ms`;
        }
      });

      window.netplay.on('rooms', ({ rooms, onlineCount }) => {
        this.renderOpenRooms(rooms, onlineCount);
      });

      window.netplay.on('room_state', (msg) => {
        if (msg && msg.room) {
          this.applyRoomStatePayload(msg);
        }
      });

      window.netplay.on('room_created', (msg) => {
        const room = msg.room || {
          code: msg.code,
          name: msg.name || `Phòng ${msg.code}`,
          matchFormat: msg.matchFormat || this.lobbyFormat || '1v1',
          visibility: msg.visibility || this.lobbyVisibility || 'public',
          hasPassword: Boolean(msg.hasPassword),
          status: 'waiting',
          p1: (window.netplay && window.netplay.profile) || { nickname: 'Chủ Phòng', tag: '#1000', elo: 1200, ready: true },
          p2: null
        };
        this.applyRoomStatePayload({ room, slot: 1, lanUrls: msg.lanUrls, event: 'created' });
      });

      window.netplay.on('room_joined', (msg) => {
        if (msg && msg.room) {
          this.applyRoomStatePayload({ room: msg.room, slot: msg.slot || 2, event: 'joined' });
        }
      });

      window.netplay.on('room_updated', (msg) => {
        if (msg && msg.room) {
          this.applyRoomStatePayload(msg);
        }
      });

      window.netplay.on('host_transferred', (msg) => {
        if (msg && msg.room) {
          this.applyRoomStatePayload({ room: msg.room, slot: 1, event: 'host_transferred' });
        }
      });

      window.netplay.on('quick_queued', (msg) => {
        this.clearPendingLobbyAction();
        this.clearLobbyError();
        this.setLobbyView('queue');
        this.startQueueTimer((msg && msg.matchFormat) || this.lobbyFormat);
      });

      window.netplay.on('quick_cancelled', () => {
        this.clearPendingLobbyAction();
        this.stopQueueTimer();
        if (!this.onlineRoom) {
          this.setLobbyView('hub');
        }
      });

      window.netplay.on('room_ready', (msg) => {
        this.clearPendingLobbyAction();
        this.stopQueueTimer();
        this.clearLobbyError();
        this.clearLobbyNotice();
        this.closeModal('modalRoomPassword');
        this.clearInviteParamFromUrl();
        this.onlineRole = msg.slot === 1 ? 'host' : 'guest';
        this.onlineRoom = msg.room;
        this.updateTopRoomPill(msg.room.code, msg.slot);
        this.playSfx('ui_confirm');
        this.enterCharacterSelect('ONLINE_PVP', msg.room.matchFormat || '1v1');
      });

      window.netplay.on('kicked', (msg) => {
        this.clearPendingLobbyAction();
        this.stopQueueTimer();
        this.onlineRole = null;
        this.onlineRoom = null;
        this.onlineLanUrls = [];
        document.getElementById('activeRoomPill')?.classList.add('hidden');
        this.closeAllModals();
        this.showScreen('screenLobby');
        this.setLobbyView('hub');
        this.showLobbyError((msg && msg.reason) || 'Bạn đã bị chủ phòng mời ra khỏi phòng.');
      });

      window.netplay.on('left_room', () => {
        this.clearPendingLobbyAction();
        this.stopQueueTimer();
        this.onlineRole = null;
        this.onlineRoom = null;
        this.onlineLanUrls = [];
        document.getElementById('activeRoomPill')?.classList.add('hidden');
        if (this.currentScreen === 'screenLobby') {
          this.setLobbyView('hub');
        }
      });

      window.netplay.on('peer_left', (msg) => {
        this.clearPendingLobbyAction();
        this.stopQueueTimer();
        this.onlineRole = null;
        this.onlineRoom = null;
        this.onlineLanUrls = [];
        document.getElementById('activeRoomPill')?.classList.add('hidden');
        this.closeAllModals();
        this.showScreen('screenLobby');
        this.setLobbyView('hub');
        this.showLobbyError((msg && msg.reason) || 'Đối thủ đã thoát khỏi phòng.');
      });

      window.netplay.on('invite_password_required', (msg) => {
        this.clearPendingLobbyAction();
        const code = (msg && msg.code) || this.pendingPasswordRoomCode;
        if (code) {
          this.showScreen('screenLobby');
          this.openRoomPasswordModal(code, '');
        }
      });

      window.netplay.on('error', (msg) => {
        this.clearPendingLobbyAction();
        const code = msg && msg.code;
        const localized = this.formatServerError(code, msg && msg.message);
        if (code === 'PASSWORD_REQUIRED' || code === 'WRONG_PASSWORD') {
          const targetCode = (msg && msg.roomCode) || this.pendingPasswordRoomCode || (document.getElementById('inputLobbyRoomCode')?.value || '').trim().toUpperCase();
          if (targetCode) {
            this.openRoomPasswordModal(targetCode, code === 'WRONG_PASSWORD' ? localized : '');
            return;
          }
        }
        this.showLobbyError(localized);
      });

      // Synced Character Select over WebSocket
      window.netplay.on('select_state', (msg) => {
        const p = msg.payload || {};
        if (msg.fromSlot === 1) {
          if (typeof p.cursorIdx === 'number') this.p1CursorIdx = p.cursorIdx;
          if (Array.isArray(p.team)) this.p1Team = p.team;
          if (p.assist !== undefined) this.p1Assist = p.assist;
          if (typeof p.ready === 'boolean') this.p1Ready = p.ready;
          if (p.mapId) {
            this.selectedMapId = p.mapId;
            if (this.currentScreen === 'screenMapSelect') this.updateMapPreviewMeta();
          }
          if (p.goMap && this.currentScreen === 'screenSelect') {
            this.enterMapSelect();
          }
        } else if (msg.fromSlot === 2) {
          if (typeof p.cursorIdx === 'number') this.p2CursorIdx = p.cursorIdx;
          if (Array.isArray(p.team)) this.p2Team = p.team;
          if (p.assist !== undefined) this.p2Assist = p.assist;
          if (typeof p.ready === 'boolean') this.p2Ready = p.ready;
        }
        if (this.currentScreen === 'screenSelect') {
          this.refreshSelectUI();
        }
      });

      window.netplay.on('start_battle', (msg) => {
        const p = msg.payload || {};
        this.p1Team = p.p1Team || this.p1Team;
        this.p2Team = p.p2Team || this.p2Team;
        this.p1Assist = p.p1Assist || this.p1Assist;
        this.p2Assist = p.p2Assist || this.p2Assist;
        this.selectedMapId = p.mapId || this.selectedMapId;
        this.format = p.format || this.format;
        this.closeAllModals();
        this.startVsSplashAndBattle();
      });

      window.netplay.on('rematch_action', (msg) => {
        if (msg.action === 'rematch') {
          this.closeAllModals();
          this.startVsSplashAndBattle();
        } else if (msg.action === 'reselect') {
          this.closeAllModals();
          this.enterCharacterSelect('ONLINE_PVP', this.format);
        } else if (msg.action === 'remap') {
          this.closeAllModals();
          this.enterMapSelect();
        }
      });

      window.netplay.on('chat', (msg) => {
        this.showOnlineChatToast(`${msg.sender || 'Đối thủ'}: ${msg.text}`);
      });
    }

    updateTopRoomPill(code, slot) {
      const pill = document.getElementById('activeRoomPill');
      const cEl = document.getElementById('topRoomCode');
      const sEl = document.getElementById('topRoomSlot');
      if (pill) pill.classList.remove('hidden');
      if (cEl) cEl.textContent = code;
      if (sEl) {
        sEl.textContent = `P${slot}`;
        sEl.classList.toggle('p2', slot === 2);
      }
    }

    showOnlineChatToast(text) {
      const toast = document.getElementById('onlineChatToast');
      if (!toast) return;
      toast.textContent = text;
      toast.classList.remove('hidden');
      if (this.chatToastTimer) clearTimeout(this.chatToastTimer);
      this.chatToastTimer = setTimeout(() => toast.classList.add('hidden'), 2600);
    }

    // ==================== 3. BVN CHARACTER & ASSIST SELECT ====================
    normalizeAiDifficulty(level) {
      const valid = ['easy', 'normal', 'hard', 'nightmare'];
      const key = typeof level === 'string' ? level.trim().toLowerCase() : '';
      return valid.includes(key) ? key : 'normal';
    }

    loadSavedAiDifficulty() {
      try {
        const saved = window.localStorage && window.localStorage.getItem('bvn_ai_difficulty');
        return this.normalizeAiDifficulty(saved);
      } catch (_) {
        return 'normal';
      }
    }

    isCpuMode(mode) {
      const m = mode || this.mode;
      return m === 'SINGLE_CPU' || m === 'TEAM_CPU';
    }

    getAiDifficultyList() {
      const fallback = [
        { id: 'easy', label: 'Dễ', shortDesc: 'CPU phản xạ chậm, ít đỡ đòn — thoải mái tập combo.' },
        { id: 'normal', label: 'Trung Bình', shortDesc: 'CPU cân bằng, có khoảng hở tự nhiên — chơi vui, dễ thở.' },
        { id: 'hard', label: 'Khó', shortDesc: 'CPU áp lực cao, đỡ đòn tốt và nối combo chắc tay.' },
        { id: 'nightmare', label: 'Ác Mộng', shortDesc: 'CPU phản xạ cực nhanh, dùng tuyệt kỹ & thế thân liên tục.' }
      ];
      const src = window.BVN_AI_DIFFICULTIES;
      if (Array.isArray(src) && src.length > 0) {
        return fallback.map((fb) => {
          const found = src.find((item) => item && item.id === fb.id);
          return found
            ? {
              id: fb.id,
              label: found.label || fb.label,
              shortDesc: found.shortDesc || fb.shortDesc
            }
            : fb;
        });
      }
      if (src && typeof src === 'object') {
        return fallback.map((fb) => {
          const found = src[fb.id];
          return found
            ? {
              id: fb.id,
              label: found.label || fb.label,
              shortDesc: found.shortDesc || fb.shortDesc
            }
            : fb;
        });
      }
      return fallback;
    }

    getAiDifficultyMeta(level) {
      const id = this.normalizeAiDifficulty(level || this.aiDifficulty);
      const list = this.getAiDifficultyList();
      return list.find((d) => d.id === id) || list[1];
    }

    setAiDifficulty(level) {
      const next = this.normalizeAiDifficulty(level);
      this.aiDifficulty = next;
      try {
        if (window.localStorage) window.localStorage.setItem('bvn_ai_difficulty', next);
      } catch (_) {}
      if (window.gameApp && typeof window.gameApp.setAiDifficulty === 'function') {
        window.gameApp.setAiDifficulty(next);
      }
      this.syncAiDifficultyUI();
      if (this.currentScreen === 'screenSelect') {
        this.refreshSelectUI();
      }
    }

    syncAiDifficultyUI() {
      const picker = document.getElementById('selectAiDifficulty');
      if (!picker) return;
      const show = this.isCpuMode(this.mode);
      picker.classList.toggle('hidden', !show);

      const list = this.getAiDifficultyList();
      const activeMeta = this.getAiDifficultyMeta(this.aiDifficulty);
      picker.querySelectorAll('[data-ai-diff]').forEach((btn) => {
        const id = btn.dataset.aiDiff;
        const meta = list.find((d) => d.id === id);
        if (meta) {
          btn.textContent = meta.label;
          btn.title = meta.shortDesc;
        }
        const isActive = id === activeMeta.id;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-pressed', String(isActive));
      });

      const hintEl = document.getElementById('selectAiDiffHint');
      if (hintEl) {
        hintEl.textContent = activeMeta.shortDesc;
        hintEl.title = `${activeMeta.label}: ${activeMeta.shortDesc}`;
      }
    }

    enterCharacterSelect(mode, format) {
      this.mode = mode;
      this.format = format === '3v3' ? '3v3' : '1v1';
      this.selectedUniverse = 'all';
      this.searchQuery = '';
      const searchEl = document.getElementById('selSearchInput');
      if (searchEl) searchEl.value = '';

      this.p1Team = [];
      this.p2Team = [];
      this.p1Assist = null;
      this.p2Assist = null;
      this.p1Ready = false;
      this.p2Ready = false;
      this.p1CursorIdx = 0;
      this.p2CursorIdx = Math.min(1, Math.max(0, this.roster.length - 1));
      this.activeClickTarget = (this.mode === 'ONLINE_PVP' && this.onlineRole === 'guest') ? 2 : 1;

      const fmtToggle = document.getElementById('selectFormatToggle');
      if (fmtToggle) {
        fmtToggle.classList.toggle('hidden', this.mode === 'ONLINE_PVP' || this.mode === 'TRAINING');
        fmtToggle.querySelectorAll('.fmt-mini').forEach((b) => {
          b.classList.toggle('active', b.dataset.selFormat === this.format);
        });
      }

      this.syncAiDifficultyUI();
      if (this.isCpuMode(this.mode) && window.gameApp && typeof window.gameApp.setAiDifficulty === 'function') {
        window.gameApp.setAiDifficulty(this.aiDifficulty);
      }

      const targetSwitch = document.getElementById('pickTargetSwitch');
      if (targetSwitch) {
        targetSwitch.classList.toggle('hidden', this.mode === 'ONLINE_PVP');
      }

      this.showScreen('screenSelect');
      this.renderUniverseTabs();
      this.renderAvatarGrid();
      this.refreshSelectUI();
    }

    bindSelectEvents() {
      document.getElementById('btnSelectBack')?.addEventListener('click', () => {
        this.playSfx('ui_cancel');
        if (this.mode === 'ONLINE_PVP') {
          this.leaveOnlineRoomIfAny();
          this.showScreen('screenLobby');
        } else {
          this.showScreen('screenMenu');
        }
      });

      document.querySelectorAll('[data-sel-format]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const nextFmt = btn.dataset.selFormat;
          if (nextFmt === this.format) return;
          this.format = nextFmt;
          this.p1Team = this.p1Team.slice(0, this.requiredTeamSize);
          this.p2Team = this.p2Team.slice(0, this.requiredTeamSize);
          this.p1Ready = this.p1Team.length >= this.requiredTeamSize && Boolean(this.p1Assist);
          this.p2Ready = this.p2Team.length >= this.requiredTeamSize && Boolean(this.p2Assist);
          document.querySelectorAll('[data-sel-format]').forEach((b) => b.classList.toggle('active', b === btn));
          this.refreshSelectUI();
        });
      });

      document.querySelectorAll('[data-ai-diff]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const nextDiff = btn.dataset.aiDiff;
          if (!nextDiff) return;
          this.playSfx('ui_move');
          this.setAiDifficulty(nextDiff);
        });
      });

      document.getElementById('selSearchInput')?.addEventListener('input', (e) => {
        this.searchQuery = e.target.value || '';
        this.renderAvatarGrid();
      });

      document.getElementById('btnTargetP1')?.addEventListener('click', () => {
        this.activeClickTarget = 1;
        this.refreshSelectUI();
      });
      document.getElementById('btnTargetP2')?.addEventListener('click', () => {
        this.activeClickTarget = 2;
        this.refreshSelectUI();
      });

      document.getElementById('btnSelectUndo')?.addEventListener('click', () => {
        const slot = this.mode === 'ONLINE_PVP' ? (this.onlineRole === 'guest' ? 2 : 1) : this.activeClickTarget;
        this.undoPick(slot);
      });

      document.getElementById('btnSelectRandomAll')?.addEventListener('click', () => {
        this.playSfx('ui_confirm');
        if (this.mode === 'ONLINE_PVP') {
          const mySlot = this.onlineRole === 'guest' ? 2 : 1;
          this.fillRandomForSlot(mySlot);
        } else {
          this.fillRandomForSlot(1);
          this.fillRandomForSlot(2);
        }
      });

      document.getElementById('btnProceedMap')?.addEventListener('click', () => {
        if (!this.canProceedToMap()) return;
        this.playSfx('ui_confirm');
        if (this.mode === 'ONLINE_PVP' && this.onlineRole === 'host' && window.netplay) {
          window.netplay.sendSelectState({ goMap: true, mapId: this.selectedMapId });
        }
        this.enterMapSelect();
      });
    }

    renderUniverseTabs() {
      const bar = document.getElementById('selUniverseBar');
      if (!bar) return;
      bar.innerHTML = '';

      const addTab = (id, label, color) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        const isActive = this.selectedUniverse === id;
        btn.className = 'u-tab' + (isActive ? ' active' : '');
        btn.setAttribute('aria-pressed', String(isActive));
        btn.innerHTML = `<span class="u-dot" style="background:${color};"></span><span>${this.escapeHtml(label)}</span>`;
        btn.addEventListener('click', () => {
          this.selectedUniverse = id;
          this.renderUniverseTabs();
          this.renderAvatarGrid();
        });
        bar.appendChild(btn);
      };

      addTab('all', `Tất Cả (${this.roster.length})`, '#00D2FF');
      (window.ANIME_UNIVERSES || []).forEach((u) => {
        const count = this.roster.filter((f) => f.universe === u.id).length;
        if (count > 0) {
          const cleanLabel = this.cleanUniverseLabel(u.badge || u.name);
          addTab(u.id, `${cleanLabel} (${count})`, u.color || '#00D2FF');
        }
      });
    }

    buildAvatarGridTiles(grid) {
      grid.innerHTML = '';
      this._avatarTileEntries = [];

      // First tile: Iconic BVN Random (?) tile
      const randTile = document.createElement('button');
      randTile.type = 'button';
      randTile.className = 'avatar-tile random-tile';
      randTile.title = 'Chọn ngẫu nhiên 1 chiến binh';
      randTile.innerHTML = `<div class="random-q" aria-hidden="true">?</div><div class="avatar-tile-name">NGẪU NHIÊN</div>`;
      randTile.addEventListener('click', () => {
        const filtered = this.getFilteredRoster();
        const pool = filtered.length ? filtered : this.roster;
        const pick = pool[Math.floor(Math.random() * pool.length)];
        if (!pick) return;
        const slot = this.mode === 'ONLINE_PVP' ? (this.onlineRole === 'guest' ? 2 : 1) : this.activeClickTarget;
        this.confirmPickForSlot(slot, pick.id);
      });
      this._avatarRandTile = randTile;

      const frag = document.createDocumentFragment();
      frag.appendChild(randTile);

      const universes = window.ANIME_UNIVERSES || [];
      this.roster.forEach((f, globalIdx) => {
        const uni = universes.find((u) => u.id === f.universe);
        const uniColor = (uni && uni.color) || (f.colors && f.colors.primary) || '#00D2FF';
        const displayName = this.cleanFighterName(f.name);
        const displaySub = this.cleanFighterTitle(f.title || this.cleanUniverseLabel(f.universeLabel || ''));
        const cleanUniLabel = this.cleanUniverseLabel(f.universeLabel);
        const hasAwaken = Boolean(f.awakenedForm && f.awakenedForm.name);

        const tile = document.createElement('button');
        tile.type = 'button';
        tile.className = 'avatar-tile' + (hasAwaken ? ' has-awaken' : '');
        tile.dataset.fighterId = f.id;
        tile.dataset.globalIdx = String(globalIdx);
        tile.style.setProperty('--uni-color', uniColor);
        tile.title = displaySub ? `${displayName} — ${displaySub}` : displayName;
        tile.innerHTML = `
          <div class="avatar-tile-uni" style="background:${uniColor};"></div>
          ${hasAwaken ? '<span class="avatar-awaken-dot" aria-hidden="true"></span>' : ''}
          <img src="avatars/${f.id}.png" alt="${this.escapeHtml(displayName)}" loading="lazy" />
          <div class="avatar-tile-name">${this.escapeHtml(displayName)}</div>
        `;

        tile.addEventListener('mouseenter', () => {
          const slot = this.mode === 'ONLINE_PVP' ? (this.onlineRole === 'guest' ? 2 : 1) : this.activeClickTarget;
          if (slot === 1) this.p1CursorIdx = globalIdx;
          else this.p2CursorIdx = globalIdx;
          this.updateShowcasePanels();
          this.updateGridCursorClasses();
          this.syncSelectStateToPeer();
        });

        tile.addEventListener('click', () => {
          const slot = this.mode === 'ONLINE_PVP' ? (this.onlineRole === 'guest' ? 2 : 1) : this.activeClickTarget;
          if (slot === 1) this.p1CursorIdx = globalIdx;
          else this.p2CursorIdx = globalIdx;
          this.confirmPickForSlot(slot, f.id);
        });

        const hay = `${displayName} ${this.cleanFighterTitle(f.title)} ${cleanUniLabel} ${f.id}`.toLowerCase();
        this._avatarTileEntries.push({
          tile,
          universe: f.universe,
          hay
        });
        frag.appendChild(tile);
      });

      const empty = document.createElement('div');
      empty.className = 'avatar-grid-empty hidden';
      empty.innerHTML = `<span>Không tìm thấy chiến binh phù hợp.</span>`;
      this._avatarEmptyEl = empty;
      frag.appendChild(empty);

      grid.appendChild(frag);
      this._avatarGridBuiltCount = this.roster.length;
    }

    renderAvatarGrid() {
      const grid = document.getElementById('selAvatarGrid');
      if (!grid) return;

      if (this._avatarGridBuiltCount !== this.roster.length || !this._avatarTileEntries.length || !grid.contains(this._avatarTileEntries[0].tile)) {
        this.buildAvatarGridTiles(grid);
      }

      const q = (this.searchQuery || '').trim().toLowerCase();
      const uni = this.selectedUniverse;
      let visibleCount = 0;

      for (let i = 0; i < this._avatarTileEntries.length; i++) {
        const entry = this._avatarTileEntries[i];
        const visible = (uni === 'all' || entry.universe === uni) && (!q || entry.hay.includes(q));
        entry.tile.classList.toggle('hidden', !visible);
        if (visible) visibleCount++;
      }

      if (this._avatarRandTile) {
        this._avatarRandTile.classList.toggle('hidden', visibleCount === 0);
      }
      if (this._avatarEmptyEl) {
        this._avatarEmptyEl.classList.toggle('hidden', visibleCount > 0);
      }

      this.updateGridCursorClasses();
    }

    confirmPickForSlot(slot, fighterId) {
      const need = this.requiredTeamSize;
      if (slot === 1) {
        if (this.p1Team.length < need) {
          this.p1Team.push(fighterId);
          this.playSfx('ui_confirm');
        } else if (!this.p1Assist) {
          this.p1Assist = fighterId;
          this.p1Ready = true;
          this.playSfx('ui_confirm');
          // In offline modes, auto-switch mouse target to P2 after P1 finishes!
          if (this.mode !== 'ONLINE_PVP' && !this.p2Ready) {
            if (this.mode === 'TEAM_CPU' || this.mode === 'SINGLE_CPU') {
              // Auto-pick opponent AI team if P2 not picked yet? Let player also customize P2 OR auto-fill!
              this.activeClickTarget = 2;
            } else {
              this.activeClickTarget = 2;
            }
          }
        }
      } else {
        if (this.p2Team.length < need) {
          this.p2Team.push(fighterId);
          this.playSfx('ui_confirm');
        } else if (!this.p2Assist) {
          this.p2Assist = fighterId;
          this.p2Ready = true;
          this.playSfx('ui_confirm');
        }
      }

      this.syncSelectStateToPeer();
      this.refreshSelectUI();
    }

    undoPick(slot) {
      this.playSfx('ui_cancel');
      if (slot === 1) {
        if (this.p1Assist) {
          this.p1Assist = null;
          this.p1Ready = false;
        } else if (this.p1Team.length > 0) {
          this.p1Team.pop();
        }
      } else {
        if (this.p2Assist) {
          this.p2Assist = null;
          this.p2Ready = false;
        } else if (this.p2Team.length > 0) {
          this.p2Team.pop();
        }
      }
      this.syncSelectStateToPeer();
      this.refreshSelectUI();
    }

    fillRandomForSlot(slot) {
      const pool = this.roster;
      if (!pool.length) return;
      const need = this.requiredTeamSize;
      const picked = [];
      while (picked.length < need) {
        const f = pool[Math.floor(Math.random() * pool.length)];
        if (!picked.includes(f.id) || pool.length <= need) picked.push(f.id);
      }
      const assistPick = pool[Math.floor(Math.random() * pool.length)].id;
      if (slot === 1) {
        this.p1Team = picked;
        this.p1Assist = assistPick;
        this.p1Ready = true;
        this.p1CursorIdx = pool.findIndex((f) => f.id === picked[0]);
      } else {
        this.p2Team = picked;
        this.p2Assist = assistPick;
        this.p2Ready = true;
        this.p2CursorIdx = pool.findIndex((f) => f.id === picked[0]);
      }
      this.syncSelectStateToPeer();
      this.refreshSelectUI();
    }

    syncSelectStateToPeer() {
      if (this.mode !== 'ONLINE_PVP' || !window.netplay) return;
      if (this.onlineRole === 'host') {
        window.netplay.sendSelectState({
          cursorIdx: this.p1CursorIdx,
          team: this.p1Team,
          assist: this.p1Assist,
          ready: this.p1Ready
        });
      } else if (this.onlineRole === 'guest') {
        window.netplay.sendSelectState({
          cursorIdx: this.p2CursorIdx,
          team: this.p2Team,
          assist: this.p2Assist,
          ready: this.p2Ready
        });
      }
    }

    canProceedToMap() {
      if (!this.p1Ready) return false;
      if (this.mode === 'ONLINE_PVP') {
        return this.p1Ready && this.p2Ready && this.onlineRole === 'host';
      }
      if (this.mode === 'TEAM_CPU' || this.mode === 'SINGLE_CPU' || this.mode === 'TRAINING') {
        // Allow proceeding as soon as P1 is ready (auto-fills CPU team if player didn't pick P2!)
        return true;
      }
      return this.p1Ready && this.p2Ready;
    }

    refreshSelectUI() {
      const diffMeta = this.getAiDifficultyMeta(this.aiDifficulty);
      const diffUpper = diffMeta.label.toUpperCase();
      const modeNames = {
        TEAM_CPU: `TEAM PLAY ${this.format.toUpperCase()} · VS CPU (${diffUpper})`,
        SINGLE_CPU: `SINGLE PLAY ${this.format.toUpperCase()} · VS CPU (${diffUpper})`,
        LOCAL_2P: `2P VERSUS ${this.format.toUpperCase()}`,
        ONLINE_PVP: `ONLINE PVP ${this.format.toUpperCase()} · ${this.onlineRoom ? this.onlineRoom.code : ''}`,
        TRAINING: `TRAINING · COMBO LAB`
      };
      const badge = document.getElementById('selectModeBadge');
      if (badge) badge.textContent = modeNames[this.mode] || this.mode;

      // Owner labels
      const p1Owner = document.getElementById('selP1Owner');
      const p2Owner = document.getElementById('selP2Owner');
      if (this.mode === 'ONLINE_PVP' && this.onlineRoom) {
        if (p1Owner) p1Owner.textContent = `${this.onlineRoom.p1.nickname}${this.onlineRole === 'host' ? ' (BẠN)' : ''}`;
        if (p2Owner) p2Owner.textContent = `${this.onlineRoom.p2.nickname}${this.onlineRole === 'guest' ? ' (BẠN)' : ''}`;
      } else {
        const acc = window.gameApp ? window.gameApp.accounts.state : { p1: { nickname: 'P1' }, p2: { nickname: 'P2' } };
        if (p1Owner) p1Owner.textContent = acc.p1.nickname;
        if (p2Owner) {
          p2Owner.textContent = this.mode === 'LOCAL_2P'
            ? acc.p2.nickname
            : (this.isCpuMode(this.mode) ? `CPU · ${diffMeta.label}` : 'TRAINING');
        }
      }

      // Target switch highlight
      const btnP1 = document.getElementById('btnTargetP1');
      const btnP2 = document.getElementById('btnTargetP2');
      btnP1?.classList.toggle('active', this.activeClickTarget === 1);
      btnP2?.classList.toggle('active', this.activeClickTarget === 2);
      btnP1?.setAttribute('aria-pressed', String(this.activeClickTarget === 1));
      btnP2?.setAttribute('aria-pressed', String(this.activeClickTarget === 2));

      // Step indicators
      const need = this.requiredTeamSize;
      const myTeam = (this.mode === 'ONLINE_PVP' && this.onlineRole === 'guest') ? this.p2Team : (this.activeClickTarget === 1 ? this.p1Team : this.p2Team);
      const myAssist = (this.mode === 'ONLINE_PVP' && this.onlineRole === 'guest') ? this.p2Assist : (this.activeClickTarget === 1 ? this.p1Assist : this.p2Assist);
      const step1 = document.getElementById('stepTag1');
      const step2 = document.getElementById('stepTag2');
      const step3 = document.getElementById('stepTag3');
      if (step1 && step2 && step3) {
        const done1 = myTeam.length >= need;
        const done2 = Boolean(myAssist);
        step1.className = 'step-tag ' + (done1 ? 'done' : 'active');
        step2.className = 'step-tag ' + (done2 ? 'done' : (done1 ? 'active' : ''));
        step3.className = 'step-tag ' + (done1 && done2 ? 'active' : '');
      }

      // Turn hint text
      const hint = document.getElementById('selTurnHint');
      if (hint) {
        if (this.mode === 'ONLINE_PVP') {
          const amHost = this.onlineRole === 'host';
          const myDone = amHost ? this.p1Ready : this.p2Ready;
          const oppDone = amHost ? this.p2Ready : this.p1Ready;
          if (!myDone) {
            hint.textContent = myTeam.length < need
              ? `Bước 1: Chọn ${need - myTeam.length} tướng cho đội`
              : `Bước 2: Chọn 1 Viện Trợ [O]`;
          } else if (!oppDone) {
            hint.textContent = 'Đã sẵn sàng · Đang chờ đối thủ...';
          } else {
            hint.textContent = amHost ? 'Cả 2 sẵn sàng · Chọn Bản Đồ để bắt đầu' : 'Cả 2 sẵn sàng · Chờ chủ phòng chọn Bản Đồ...';
          }
        } else {
          const who = this.activeClickTarget === 1 ? 'P1' : 'P2';
          if (myTeam.length < need) {
            hint.textContent = `${who}: Chọn tướng (${myTeam.length}/${need}) · WASD+J hoặc Click`;
          } else if (!myAssist) {
            hint.textContent = `${who}: Chọn 1 nhân vật Viện Trợ [O]`;
          } else {
            hint.textContent = 'Đã chọn đủ đội hình · Tiếp tục chọn Bản Đồ';
          }
        }
      }

      // Proceed button
      const btnGo = document.getElementById('btnProceedMap');
      if (btnGo) {
        const canGo = this.canProceedToMap();
        btnGo.disabled = !canGo;
        if (this.mode === 'ONLINE_PVP' && this.onlineRole === 'guest') {
          this.setButtonLabel(btnGo, (this.p1Ready && this.p2Ready) ? 'CHỜ CHỦ PHÒNG CHỌN MAP...' : 'ĐANG CHỜ 2 BÊN CHỌN...');
        } else {
          this.setButtonLabel(btnGo, 'TIẾP TỤC CHỌN BẢN ĐỒ');
        }
      }

      this.updateShowcasePanels();
      this.renderTeamSlots(1);
      this.renderTeamSlots(2);
      this.updateGridCursorClasses();
    }

    updateShowcasePanels() {
      const updateSide = (slot, cursorIdx, team, assist, isReady) => {
        const f = this.roster[cursorIdx] || this.roster[0];
        if (!f) return;
        const prefix = slot === 1 ? 'selP1' : 'selP2';
        const stage = document.getElementById(`${prefix}Stage`);
        const bigImg = document.getElementById(`${prefix}BigImg`);
        const aura = document.getElementById(`${prefix}Aura`);
        const uni = document.getElementById(`${prefix}Uni`);
        const name = document.getElementById(`${prefix}Name`);
        const title = document.getElementById(`${prefix}Title`);
        const phase = document.getElementById(`${prefix}Phase`);
        const count = document.getElementById(`${prefix}Count`);
        const skillsBox = document.getElementById(`${prefix}Skills`);

        const cleanName = this.cleanFighterName(f.name);
        const cleanTitle = this.cleanFighterTitle(f.title || '');
        const cleanUni = this.cleanUniverseLabel(f.universeLabel || (f.universe || '').toUpperCase());
        const hasAwaken = Boolean(f.awakenedForm && f.awakenedForm.name);

        if (stage) stage.classList.toggle('has-awaken', hasAwaken);
        if (bigImg) {
          bigImg.src = `avatars/${f.id}_big.png`;
          bigImg.alt = cleanName;
        }
        if (aura) aura.style.background = (f.colors && (f.colors.aura || f.colors.primary)) || '#00D2FF';
        if (uni) {
          uni.textContent = cleanUni;
          const uObj = (window.ANIME_UNIVERSES || []).find((u) => u.id === f.universe);
          uni.style.background = (uObj && uObj.color) || (f.colors && f.colors.primary) || '#00D2FF';
        }
        if (name) name.textContent = cleanName;
        if (title) title.textContent = cleanTitle;
        if (count) count.textContent = `(${team.length}/${this.requiredTeamSize} + ${assist ? '1' : '0'} O)`;

        if (phase) {
          if (isReady) {
            phase.textContent = 'SẴN SÀNG';
            phase.classList.add('ready');
          } else if (team.length >= this.requiredTeamSize) {
            phase.textContent = 'CHỌN VIỆN TRỢ [O]';
            phase.classList.remove('ready');
          } else {
            phase.textContent = `CHỌN TƯỚNG (${team.length + 1}/${this.requiredTeamSize})`;
            phase.classList.remove('ready');
          }
        }

        if (skillsBox && f.skills) {
          const previewKeys = [
            { k: 'u', lbl: 'U', cls: '' },
            { k: 'wu', lbl: 'W+U', cls: '' },
            { k: 'i', lbl: 'I', cls: 'bisha' },
            { k: 'si', lbl: 'S+I', cls: 'super' }
          ];
          let html = previewKeys.map((item) => {
            const sk = f.skills[item.k];
            if (!sk) return '';
            const cls = item.cls ? ` ${item.cls}` : '';
            return `<div class="mini-skill-row${cls}"><span class="sk-key">${item.lbl}</span><span class="sk-name">${this.escapeHtml(sk.name)}</span></div>`;
          }).join('');
          if (hasAwaken) {
            const auraCol = f.awakenedForm.auraColor || f.awakenedForm.tailColor || (f.colors && f.colors.awakenAura) || '#F5C531';
            html += `<div class="mini-skill-row awaken-form-pill" style="--awaken-color:${auraCol}"><span class="sk-key">J+K</span><span class="sk-name">THỨC TỈNH · ${this.escapeHtml(f.awakenedForm.name)}</span></div>`;
          }
          skillsBox.innerHTML = html;
        }
      };

      updateSide(1, this.p1CursorIdx, this.p1Team, this.p1Assist, this.p1Ready);
      updateSide(2, this.p2CursorIdx, this.p2Team, this.p2Assist, this.p2Ready);
    }

    renderTeamSlots(slot) {
      const row = document.getElementById(slot === 1 ? 'selP1Slots' : 'selP2Slots');
      if (!row) return;
      const team = slot === 1 ? this.p1Team : this.p2Team;
      const assist = slot === 1 ? this.p1Assist : this.p2Assist;
      const need = this.requiredTeamSize;
      row.innerHTML = '';

      for (let i = 0; i < need; i++) {
        const fid = team[i];
        const box = document.createElement('div');
        box.className = 'team-slot-box' + (fid ? ' filled' : (team.length === i ? ' active-slot' : ''));
        if (fid) {
          const m = this.getFighterMeta(fid);
          const cleanName = this.cleanFighterName(m ? m.name : fid);
          box.setAttribute('role', 'button');
          box.setAttribute('tabindex', '0');
          box.innerHTML = `<img src="avatars/${fid}.png" alt="${this.escapeHtml(cleanName)}" /><span class="slot-tag">#${i + 1}</span>`;
          box.title = `${cleanName} (Click để bỏ chọn)`;
          const removePick = () => {
            if (this.mode === 'ONLINE_PVP' && ((slot === 1 && this.onlineRole !== 'host') || (slot === 2 && this.onlineRole !== 'guest'))) return;
            team.splice(i, 1);
            if (slot === 1) this.p1Ready = false;
            else this.p2Ready = false;
            this.syncSelectStateToPeer();
            this.refreshSelectUI();
          };
          box.addEventListener('click', removePick);
          box.addEventListener('keydown', (e) => {
            if (e.code === 'Enter' || e.code === 'Space') {
              e.preventDefault();
              removePick();
            }
          });
        } else {
          box.innerHTML = `<span>Tướng ${i + 1}</span>`;
        }
        row.appendChild(box);
      }

      // Assist Slot [O]
      const aBox = document.createElement('div');
      aBox.className = 'team-slot-box assist-slot' + (assist ? ' filled' : (team.length >= need ? ' active-slot' : ''));
      if (assist) {
        const m = this.getFighterMeta(assist);
        const cleanName = this.cleanFighterName(m ? m.name : assist);
        aBox.setAttribute('role', 'button');
        aBox.setAttribute('tabindex', '0');
        aBox.innerHTML = `<img src="avatars/${assist}.png" alt="${this.escapeHtml(cleanName)}" /><span class="slot-tag assist">O</span>`;
        aBox.title = `Viện Trợ [O]: ${cleanName} (Click để bỏ chọn)`;
        const removeAssist = () => {
          if (this.mode === 'ONLINE_PVP' && ((slot === 1 && this.onlineRole !== 'host') || (slot === 2 && this.onlineRole !== 'guest'))) return;
          if (slot === 1) { this.p1Assist = null; this.p1Ready = false; }
          else { this.p2Assist = null; this.p2Ready = false; }
          this.syncSelectStateToPeer();
          this.refreshSelectUI();
        };
        aBox.addEventListener('click', removeAssist);
        aBox.addEventListener('keydown', (e) => {
          if (e.code === 'Enter' || e.code === 'Space') {
            e.preventDefault();
            removeAssist();
          }
        });
      } else {
        aBox.innerHTML = `<span>Viện Trợ</span>`;
      }
      row.appendChild(aBox);
    }

    updateGridCursorClasses() {
      const grid = document.getElementById('selAvatarGrid');
      if (!grid) return;
      const p1Picked = new Set([...this.p1Team, ...(this.p1Assist ? [this.p1Assist] : [])]);
      const p2Picked = new Set([...this.p2Team, ...(this.p2Assist ? [this.p2Assist] : [])]);

      grid.querySelectorAll('.avatar-tile[data-fighter-id]').forEach((tile) => {
        const idx = Number(tile.dataset.globalIdx);
        const fid = tile.dataset.fighterId;
        tile.classList.toggle('cursor-p1', idx === this.p1CursorIdx);
        tile.classList.toggle('cursor-p2', idx === this.p2CursorIdx);
        tile.classList.toggle('picked-p1', p1Picked.has(fid));
        tile.classList.toggle('picked-p2', p2Picked.has(fid));
      });
    }

    // ==================== 4. BVN STAGE / MAP SELECT (VISUAL THUMBNAILS + LIVE 60FPS PREVIEW) ====================
    enterMapSelect() {
      // Auto-fill P2 if VS CPU / Training and P2 wasn't manually chosen
      if ((this.mode === 'TEAM_CPU' || this.mode === 'SINGLE_CPU' || this.mode === 'TRAINING') && !this.p2Ready) {
        this.fillRandomForSlot(2);
      }

      this.showScreen('screenMapSelect');
      this.renderMapMatchupStrip();
      this.renderMapCategoryTabs();
      this.renderMapThumbnails();
      this.updateMapPreviewMeta();

      // Background preload selected leads + assists so fetch/decode overlaps stage pick
      if (window.mugenRegistry && typeof window.mugenRegistry.ensureFightersLoaded === 'function') {
        const p1LeadId = this.p1Team[0];
        const p2LeadId = this.p2Team[0];
        if (p1LeadId || p2LeadId) {
          window.mugenRegistry.ensureFightersLoaded(p1LeadId, p2LeadId);
        }
        if (this.p1Assist || this.p2Assist) {
          window.mugenRegistry.ensureFightersLoaded(this.p1Assist, this.p2Assist);
        }
      }

      // In Online mode, Guest waits for Host to confirm stage
      const startBtn = document.getElementById('btnStartBattle');
      if (startBtn) {
        const isGuest = this.mode === 'ONLINE_PVP' && this.onlineRole === 'guest';
        startBtn.disabled = isGuest;
        this.setButtonLabel(startBtn, isGuest ? 'CHỜ CHỦ PHÒNG BẮT ĐẦU...' : 'BẮT ĐẦU TRẬN ĐẤU');
      }
    }

    bindMapSelectEvents() {
      document.getElementById('btnMapBack')?.addEventListener('click', () => {
        this.playSfx('ui_cancel');
        this.showScreen('screenSelect');
      });

      document.getElementById('btnMapPrev')?.addEventListener('click', () => this.cycleMap(-1));
      document.getElementById('btnMapNext')?.addEventListener('click', () => this.cycleMap(1));

      document.getElementById('btnMapRandomPick')?.addEventListener('click', () => {
        if (!this.maps.length) return;
        const pick = this.maps[Math.floor(Math.random() * this.maps.length)];
        this.selectMapId(pick.id);
      });

      document.getElementById('btnStartBattle')?.addEventListener('click', () => {
        if (this.mode === 'ONLINE_PVP' && this.onlineRole === 'guest') return;
        this.playSfx('ui_confirm');
        if (this.mode === 'ONLINE_PVP' && this.onlineRole === 'host' && window.netplay) {
          window.netplay.sendStartBattle({
            p1Team: this.p1Team,
            p2Team: this.p2Team,
            p1Assist: this.p1Assist,
            p2Assist: this.p2Assist,
            mapId: this.selectedMapId,
            format: this.format
          });
        }
        this.startVsSplashAndBattle();
      });
    }

    cycleMap(delta) {
      if (!this.maps.length) return;
      const idx = this.maps.findIndex((m) => m.id === this.selectedMapId);
      const next = (idx + delta + this.maps.length) % this.maps.length;
      this.selectMapId(this.maps[next].id);
    }

    selectMapId(mapId) {
      this.selectedMapId = mapId;
      this.playSfx('ui_move');
      this.updateMapPreviewMeta();
      document.querySelectorAll('.map-thumb-card').forEach((c) => {
        const isActive = c.dataset.mapId === mapId;
        c.classList.toggle('active', isActive);
        c.setAttribute('aria-pressed', String(isActive));
        if (isActive) c.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      });
      if (this.mode === 'ONLINE_PVP' && this.onlineRole === 'host' && window.netplay) {
        window.netplay.sendSelectState({ mapId });
      }
    }

    renderMapMatchupStrip() {
      const el = document.getElementById('mapMatchupStrip');
      if (!el) return;
      const mkMini = (id, cls) => {
        const meta = this.getFighterMeta(id);
        const cleanName = this.cleanFighterName(meta ? meta.name : id);
        return `<img class="mm-mini${cls}" src="avatars/${id}.png" alt="${this.escapeHtml(cleanName)}" title="${this.escapeHtml(cleanName)}" />`;
      };
      const p1Html = this.p1Team.map((id) => mkMini(id, '')).join('');
      const p2Html = this.p2Team.map((id) => mkMini(id, ' p2')).join('');
      el.innerHTML = `${p1Html}<span class="mm-vs">VS</span>${p2Html}`;
    }

    renderMapCategoryTabs() {
      const bar = document.getElementById('mapSelectCatBar');
      if (!bar) return;
      const cats = Array.isArray(window.MAP_CATEGORIES) ? window.MAP_CATEGORIES : [{ id: 'all', name: 'Tất Cả' }];
      bar.innerHTML = '';
      cats.forEach((c) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        const isActive = this.selectedMapCat === c.id;
        btn.className = 'u-tab' + (isActive ? ' active' : '');
        btn.setAttribute('aria-pressed', String(isActive));
        btn.textContent = c.name;
        btn.addEventListener('click', () => {
          this.selectedMapCat = c.id;
          this.renderMapCategoryTabs();
          this.renderMapThumbnails();
        });
        bar.appendChild(btn);
      });
    }

    getMapThumbDataUrl(mapId) {
      if (this.mapThumbCache.has(mapId)) return this.mapThumbCache.get(mapId);
      if (!this._mapThumbScratchCanvas) {
        const cnv = document.createElement('canvas');
        cnv.width = 240;
        cnv.height = 135;
        this._mapThumbScratchCanvas = cnv;
      }
      const cnv = this._mapThumbScratchCanvas;
      const ctx = cnv.getContext('2d');
      ctx.clearRect(0, 0, 240, 135);
      if (typeof window.renderArenaMap === 'function') {
        try {
          window.renderArenaMap(ctx, mapId, 240, 135, 114, 40);
        } catch (_) {}
      }
      const url = cnv.toDataURL('image/png');
      this.mapThumbCache.set(mapId, url);
      return url;
    }

    cancelMapThumbBatch() {
      this._mapThumbRenderGen++;
      if (this._mapThumbBatchHandle !== null) {
        if (this._mapThumbBatchIsTimeout) {
          clearTimeout(this._mapThumbBatchHandle);
        } else if (typeof cancelAnimationFrame === 'function') {
          cancelAnimationFrame(this._mapThumbBatchHandle);
        }
        this._mapThumbBatchHandle = null;
        this._mapThumbBatchIsTimeout = false;
      }
    }

    renderMapThumbnails() {
      const grid = document.getElementById('mapThumbGrid');
      if (!grid) return;
      this.cancelMapThumbBatch();
      const gen = this._mapThumbRenderGen;

      const filtered = this.selectedMapCat === 'all'
        ? this.maps
        : this.maps.filter((m) => m.category === this.selectedMapCat);
      grid.innerHTML = '';

      const frag = document.createDocumentFragment();
      const pending = [];

      filtered.forEach((m) => {
        const card = document.createElement('button');
        card.type = 'button';
        const isActive = m.id === this.selectedMapId;
        card.className = 'map-thumb-card' + (isActive ? ' active' : '');
        card.setAttribute('aria-pressed', String(isActive));
        card.dataset.mapId = m.id;

        const img = document.createElement('img');
        img.alt = m.name;
        if (this.mapThumbCache.has(m.id)) {
          img.src = this.mapThumbCache.get(m.id);
        } else {
          pending.push({ mapId: m.id, img });
        }

        const label = document.createElement('div');
        label.className = 'map-thumb-label';
        label.textContent = m.name;

        card.appendChild(img);
        card.appendChild(label);
        card.addEventListener('click', () => this.selectMapId(m.id));
        frag.appendChild(card);
      });

      grid.appendChild(frag);

      if (!pending.length) return;

      let idx = 0;
      const scheduleNext = (fn) => {
        if (!document.hidden && typeof requestAnimationFrame === 'function') {
          this._mapThumbBatchIsTimeout = false;
          this._mapThumbBatchHandle = requestAnimationFrame(fn);
        } else {
          this._mapThumbBatchIsTimeout = true;
          this._mapThumbBatchHandle = setTimeout(fn, 0);
        }
      };

      const processBatch = () => {
        if (gen !== this._mapThumbRenderGen) return;
        this._mapThumbBatchHandle = null;
        const start = typeof performance !== 'undefined' ? performance.now() : 0;
        let rendered = 0;
        while (idx < pending.length && rendered < 4) {
          if (rendered >= 1 && start && (performance.now() - start) >= 10) break;
          const item = pending[idx++];
          const url = this.getMapThumbDataUrl(item.mapId);
          if (item.img && item.img.isConnected) {
            item.img.src = url;
          }
          rendered++;
        }
        if (idx < pending.length) {
          scheduleNext(processBatch);
        }
      };

      scheduleNext(processBatch);
    }

    updateMapPreviewMeta() {
      const m = this.maps.find((x) => x.id === this.selectedMapId) || this.maps[0];
      if (!m) return;
      const catEl = document.getElementById('mapPreviewCat');
      const nameEl = document.getElementById('mapPreviewName');
      const descEl = document.getElementById('mapPreviewDesc');
      if (catEl) {
        catEl.textContent = (m.category || 'anime').toUpperCase();
        catEl.style.borderColor = m.themeColor || '#00D2FF';
      }
      if (nameEl) nameEl.textContent = m.name;
      if (descEl) descEl.textContent = m.description || m.subtitle || '';
    }

    startMapPreviewLoop() {
      this.stopMapPreviewLoop();
      const cnv = document.getElementById('mapPreviewCanvas');
      if (!cnv) return;
      const ctx = cnv.getContext('2d');
      const tick = () => {
        if (this.currentScreen !== 'screenMapSelect') return;
        this.mapPreviewFrame++;
        if (typeof window.renderArenaMap === 'function') {
          window.renderArenaMap(ctx, this.selectedMapId, cnv.width, cnv.height, Math.round(cnv.height * 0.84), this.mapPreviewFrame);
        }
        this.mapPreviewAnimId = requestAnimationFrame(tick);
      };
      this.mapPreviewAnimId = requestAnimationFrame(tick);
    }

    stopMapPreviewLoop() {
      this.cancelMapThumbBatch();
      if (this.mapPreviewAnimId) {
        cancelAnimationFrame(this.mapPreviewAnimId);
        this.mapPreviewAnimId = null;
      }
    }

    // ==================== 5. BVN VS SPLASH -> BATTLE LAUNCH ====================
    async startVsSplashAndBattle() {
      if (this._startingBattle) return;
      this._startingBattle = true;
      try {
        const p1Lead = this.getFighterMeta(this.p1Team[0] || 'naruto');
        const p2Lead = this.getFighterMeta(this.p2Team[0] || 'luffy');
        const mapMeta = this.maps.find((m) => m.id === this.selectedMapId) || this.maps[0];

        const p1Clean = this.cleanFighterName(p1Lead.name);
        const p2Clean = this.cleanFighterName(p2Lead.name);
        const diffMeta = this.getAiDifficultyMeta(this.aiDifficulty);
        const diffUpper = diffMeta.label.toUpperCase();

        const vsP1Badge = document.getElementById('vsP1Badge');
        const vsP2Badge = document.getElementById('vsP2Badge');
        if (vsP1Badge) {
          vsP1Badge.textContent = (this.mode === 'ONLINE_PVP' && this.onlineRoom && this.onlineRoom.p1)
            ? `P1 · ${this.onlineRoom.p1.nickname}`
            : 'PLAYER 1';
        }
        if (vsP2Badge) {
          if (this.isCpuMode(this.mode)) {
            vsP2Badge.textContent = `CPU · ${diffUpper}`;
          } else if (this.mode === 'ONLINE_PVP' && this.onlineRoom && this.onlineRoom.p2) {
            vsP2Badge.textContent = `P2 · ${this.onlineRoom.p2.nickname}`;
          } else if (this.mode === 'TRAINING') {
            vsP2Badge.textContent = 'TRAINING DUMMY';
          } else {
            vsP2Badge.textContent = 'PLAYER 2';
          }
        }

        document.getElementById('vsP1Img').src = `avatars/${p1Lead.id}_big.png`;
        document.getElementById('vsP2Img').src = `avatars/${p2Lead.id}_big.png`;
        document.getElementById('vsP1Name').textContent = p1Clean;
        document.getElementById('vsP2Name').textContent = p2Clean;
        document.getElementById('vsStageLabel').textContent = mapMeta ? mapMeta.name : this.selectedMapId;
        document.getElementById('vsP1TeamRow').innerHTML = [...this.p1Team, this.p1Assist].filter(Boolean).map((id) => `<img src="avatars/${id}.png" alt="${this.escapeHtml(id)}" />`).join('');
        document.getElementById('vsP2TeamRow').innerHTML = [...this.p2Team, this.p2Assist].filter(Boolean).map((id) => `<img src="avatars/${id}.png" alt="${this.escapeHtml(id)}" />`).join('');

        this.showScreen('screenVsSplash');
        const loadTxt = document.getElementById('vsLoadStatus');
        if (loadTxt) loadTxt.textContent = 'Đang chuẩn bị đấu trường...';

        // Preload lead fighters with a bounded timeout so slow/stalled R2 assets never freeze VS Splash;
        // use a snappy ~300ms transition when leads are already loaded in memory, keeping 1150ms only on cold load.
        const reg = window.mugenRegistry;
        const leadIds = Array.from(new Set([p1Lead.id, p2Lead.id].filter(Boolean)));
        const leadsAlreadyCached = Boolean(
          reg && reg.loadedPacks && leadIds.every((fid) =>
            reg.loadedPacks.has(fid) || (typeof reg.getPreset === 'function' && !reg.getPreset(fid))
          )
        );
        const minWait = new Promise((r) => setTimeout(r, leadsAlreadyCached ? 300 : 1150));
        const preload = (async () => {
          if (!reg) return;
          const assistIds = [this.p1Assist, this.p2Assist].filter((id) => id && !leadIds.includes(id));
          if (assistIds.length) {
            reg.ensureFightersLoaded(assistIds[0], assistIds[1]);
          }
          let doneCount = 0;
          const total = leadIds.length;
          if (total > 0 && loadTxt) {
            loadTxt.textContent = leadsAlreadyCached
              ? 'Đấu trường sẵn sàng!'
              : `Đang tải chiến binh (0/${total})...`;
          }
          const loadLeads = Promise.all(
            leadIds.map((fid) =>
              reg.loadPresetForFighter(fid)
                .catch(() => null)
                .finally(() => {
                  doneCount++;
                  if (loadTxt && this.currentScreen === 'screenVsSplash') {
                    loadTxt.textContent = doneCount >= total
                      ? 'Đấu trường sẵn sàng!'
                      : `Đang tải chiến binh (${doneCount}/${total})...`;
                  }
                })
            )
          );
          const maxSplashWait = new Promise((resolve) => setTimeout(resolve, 6500));
          await Promise.race([loadLeads, maxSplashWait]);
        })();
        await Promise.all([minWait, preload]);

        if (this.currentScreen !== 'screenVsSplash') return;

        // Enter Battle Screen
        this.showScreen('screenBattle');

        const modeTag = document.getElementById('battleModeTag');
        const stageTag = document.getElementById('battleStageTag');
        const pingTag = document.getElementById('battlePingTag');
        const emoteBar = document.getElementById('onlineEmoteBar');
        const p2Deck = document.getElementById('p2DeckContainer');
        const skillBar = document.getElementById('battleSkillBar');
        const toggleBtn = document.getElementById('btnToggleSkillBar');

        const battleModeLabels = {
          TEAM_CPU: `TEAM ${this.format.toUpperCase()} · CPU ${diffUpper}`,
          SINGLE_CPU: `SINGLE ${this.format.toUpperCase()} · CPU ${diffUpper}`,
          LOCAL_2P: `2P VERSUS · ${this.format.toUpperCase()}`,
          ONLINE_PVP: `ONLINE PVP · ${this.format.toUpperCase()}`,
          TRAINING: `TRAINING · COMBO LAB`
        };

        const isSingleDeck = this.mode !== 'LOCAL_2P';
        if (modeTag) modeTag.textContent = battleModeLabels[this.mode] || `${this.mode.replace('_', ' ')} · ${this.format.toUpperCase()}`;
        if (stageTag) stageTag.textContent = mapMeta ? mapMeta.name : this.selectedMapId;
        if (pingTag) pingTag.classList.toggle('hidden', this.mode !== 'ONLINE_PVP');
        if (emoteBar) emoteBar.classList.toggle('hidden', this.mode !== 'ONLINE_PVP');
        if (p2Deck) p2Deck.classList.toggle('hidden', isSingleDeck);
        if (skillBar) {
          skillBar.classList.toggle('single-deck', isSingleDeck);
          skillBar.classList.toggle('hidden', this.skillBarCollapsed);
        }
        if (toggleBtn) {
          toggleBtn.setAttribute('aria-expanded', String(!this.skillBarCollapsed));
          toggleBtn.classList.toggle('is-collapsed', this.skillBarCollapsed);
        }
        document.getElementById('screenBattle')?.classList.toggle('skillbar-collapsed', this.skillBarCollapsed);

        if (window.gameApp) {
          if (this.isCpuMode(this.mode) && typeof window.gameApp.setAiDifficulty === 'function') {
            window.gameApp.setAiDifficulty(this.aiDifficulty);
          }
          window.gameApp.launchMatch({
            mode: this.mode,
            format: this.format,
            aiDifficulty: this.aiDifficulty,
            onlineRole: this.onlineRole,
            p1Team: this.p1Team,
            p2Team: this.p2Team,
            p1Assist: this.p1Assist,
            p2Assist: this.p2Assist,
            mapId: this.selectedMapId,
            p1Profile: this.onlineRoom ? this.onlineRoom.p1 : window.gameApp.accounts.state.p1,
            p2Profile: this.onlineRoom ? this.onlineRoom.p2 : (this.mode === 'LOCAL_2P' ? window.gameApp.accounts.state.p2 : null)
          });
        }
      } finally {
        this._startingBattle = false;
      }
    }

    // ==================== 6. BATTLE TOOLBAR, PAUSE & VICTORY MODALS ====================
    bindBattleAndVictoryEvents() {
      const btnToggleSkill = document.getElementById('btnToggleSkillBar');
      btnToggleSkill?.addEventListener('click', () => {
        const bar = document.getElementById('battleSkillBar');
        if (!bar) return;
        this.skillBarCollapsed = !bar.classList.contains('hidden');
        bar.classList.toggle('hidden', this.skillBarCollapsed);
        btnToggleSkill.setAttribute('aria-expanded', String(!this.skillBarCollapsed));
        btnToggleSkill.classList.toggle('is-collapsed', this.skillBarCollapsed);
        document.getElementById('screenBattle')?.classList.toggle('skillbar-collapsed', this.skillBarCollapsed);
        this.setButtonLabel(btnToggleSkill, this.skillBarCollapsed ? 'Hiện Chiêu' : 'Chiêu');
      });

      document.getElementById('btnBattleRematch')?.addEventListener('click', () => {
        if (this.mode === 'ONLINE_PVP') {
          if (this.onlineRole === 'host' && window.netplay) {
            window.netplay.sendRematchAction('rematch');
            window.gameApp?.resetFullMatch();
          }
          return;
        }
        window.gameApp?.resetFullMatch();
      });

      document.getElementById('btnBattlePause')?.addEventListener('click', () => {
        if (this.mode !== 'ONLINE_PVP') window.gameApp?.setPaused(true);
        this.openModal('modalPause');
      });

      document.getElementById('btnPauseResume')?.addEventListener('click', () => {
        this.closeModal('modalPause');
        window.gameApp?.setPaused(false);
      });
      document.getElementById('btnPauseRematch')?.addEventListener('click', () => {
        this.closeModal('modalPause');
        if (this.mode === 'ONLINE_PVP' && window.netplay) window.netplay.sendRematchAction('rematch');
        window.gameApp?.resetFullMatch();
      });
      document.getElementById('btnPauseChangeChar')?.addEventListener('click', () => {
        this.closeModal('modalPause');
        if (this.mode === 'ONLINE_PVP' && window.netplay) window.netplay.sendRematchAction('reselect');
        this.enterCharacterSelect(this.mode, this.format);
      });
      document.getElementById('btnPauseChangeMap')?.addEventListener('click', () => {
        this.closeModal('modalPause');
        if (this.mode === 'ONLINE_PVP' && window.netplay) window.netplay.sendRematchAction('remap');
        this.enterMapSelect();
      });
      document.getElementById('btnPauseMenu')?.addEventListener('click', () => {
        this.closeModal('modalPause');
        this.leaveOnlineRoomIfAny();
        this.showScreen('screenMenu');
      });

      // Victory modal buttons
      document.getElementById('btnVictoryRematch')?.addEventListener('click', () => {
        this.closeModal('modalVictory');
        if (this.mode === 'ONLINE_PVP' && window.netplay) window.netplay.sendRematchAction('rematch');
        this.startVsSplashAndBattle();
      });
      document.getElementById('btnVictorySelect')?.addEventListener('click', () => {
        this.closeModal('modalVictory');
        if (this.mode === 'ONLINE_PVP' && window.netplay) window.netplay.sendRematchAction('reselect');
        this.enterCharacterSelect(this.mode, this.format);
      });
      document.getElementById('btnVictoryMap')?.addEventListener('click', () => {
        this.closeModal('modalVictory');
        if (this.mode === 'ONLINE_PVP' && window.netplay) window.netplay.sendRematchAction('remap');
        this.enterMapSelect();
      });
      document.getElementById('btnVictoryMenu')?.addEventListener('click', () => {
        this.closeModal('modalVictory');
        this.leaveOnlineRoomIfAny();
        this.showScreen('screenMenu');
      });

      // Online Quick Emotes
      document.querySelectorAll('.emote-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const text = btn.dataset.emote;
          if (window.netplay) window.netplay.sendChat(text);
          this.showOnlineChatToast(`Bạn: ${text}`);
        });
      });
    }

    onMatchFinished(res) {
      const modal = document.getElementById('modalVictory');
      if (modal) {
        modal.classList.toggle('winner-p1', res.winnerSlot === 1);
        modal.classList.toggle('winner-p2', res.winnerSlot === 2);
      }
      const cleanWinner = this.cleanFighterName(res.winnerName);
      document.getElementById('victoryTitle').textContent = `P${res.winnerSlot} · ${res.winnerPlayerName} CHIẾN THẮNG`;
      document.getElementById('victoryFighterName').textContent = cleanWinner;
      document.getElementById('victoryPortrait').src = `avatars/${res.winnerId}_big.png`;
      const baseSub = res.format === '3v3'
        ? 'Hoàn tất trận 3v3 Đấu Đội'
        : 'Chiến thắng chung cuộc 1v1 Best-of-3';
      const cpuSuffix = this.isCpuMode(this.mode)
        ? ` · VS CPU (${this.getAiDifficultyMeta(res.aiDifficulty || this.aiDifficulty).label})`
        : '';
      document.getElementById('victorySubText').textContent = `${baseSub}${cpuSuffix}`;
      document.getElementById('vStatScore').textContent = `${res.p1Wins} - ${res.p2Wins}`;
      document.getElementById('vStatCombo').textContent = `${Math.max(res.maxComboP1, res.maxComboP2)} HITS`;
      document.getElementById('vStatElo').textContent = res.eloDelta >= 0 ? `+${res.eloDelta} Elo` : `${res.eloDelta} Elo`;

      const note = document.getElementById('victoryOnlineNote');
      if (note) {
        if (this.mode === 'ONLINE_PVP') {
          note.textContent = 'Cả 2 người chơi đều có thể bấm Đấu Lại hoặc Đổi Tướng để đồng bộ ván mới.';
          note.classList.remove('hidden');
        } else {
          note.classList.add('hidden');
        }
      }
      this.openModal('modalVictory');
    }

    // ==================== 7. BVN ARCADE KEYBOARD NAVIGATION ====================
    bindKeyboardNavigation() {
      window.addEventListener('keydown', (e) => {
        const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
        if (tag === 'input' || tag === 'textarea') return;

        // Global Escape closes utility modals outside battle
        if (e.code === 'Escape' && this.currentScreen !== 'screenBattle' && this.hasOpenModal()) {
          this.closeAllModals();
          return;
        }

        if (this.currentScreen === 'screenMenu') {
          if (this.hasOpenModal()) return;
          const btns = Array.from(document.querySelectorAll('.bvn-menu-btn'));
          if (!btns.length) return;
          if (e.code === 'KeyS' || e.code === 'ArrowDown') {
            this.menuFocusIdx = (this.menuFocusIdx + 1) % btns.length;
            btns.forEach((b, i) => b.classList.toggle('focused', i === this.menuFocusIdx));
            this.playSfx('ui_move');
          } else if (e.code === 'KeyW' || e.code === 'ArrowUp') {
            this.menuFocusIdx = (this.menuFocusIdx - 1 + btns.length) % btns.length;
            btns.forEach((b, i) => b.classList.toggle('focused', i === this.menuFocusIdx));
            this.playSfx('ui_move');
          } else if (e.code === 'KeyJ' || e.code === 'Enter') {
            btns[this.menuFocusIdx]?.click();
          }
        } else if (this.currentScreen === 'screenSelect') {
          if (this.hasOpenModal()) return;
          const total = this.roster.length;
          if (!total) return;
          const grid = document.getElementById('selAvatarGrid');
          let stepCols = 6;
          if (grid) {
            const cols = getComputedStyle(grid).gridTemplateColumns.trim().split(/\s+/).filter(Boolean).length;
            if (cols >= 2) stepCols = cols;
          }
          const moveCursor = (slot, delta) => {
            if (slot === 1) this.p1CursorIdx = (this.p1CursorIdx + delta + total) % total;
            else this.p2CursorIdx = (this.p2CursorIdx + delta + total) % total;
            this.playSfx('ui_move');
            this.updateShowcasePanels();
            this.updateGridCursorClasses();
            const activeIdx = slot === 1 ? this.p1CursorIdx : this.p2CursorIdx;
            const activeTile = grid?.querySelector(`.avatar-tile[data-global-idx="${activeIdx}"]`);
            if (activeTile) activeTile.scrollIntoView({ block: 'nearest' });
            this.syncSelectStateToPeer();
          };

          // In Online Guest mode, WASD+J controls P2 cursor cleanly
          const p1Target = (this.mode === 'ONLINE_PVP' && this.onlineRole === 'guest') ? 2 : 1;

          if (e.code === 'KeyD') moveCursor(p1Target, 1);
          else if (e.code === 'KeyA') moveCursor(p1Target, -1);
          else if (e.code === 'KeyS') moveCursor(p1Target, stepCols);
          else if (e.code === 'KeyW') moveCursor(p1Target, -stepCols);
          else if (e.code === 'KeyJ') {
            const idx = p1Target === 1 ? this.p1CursorIdx : this.p2CursorIdx;
            const f = this.roster[idx];
            if (f) this.confirmPickForSlot(p1Target, f.id);
          } else if (e.code === 'KeyK') {
            this.undoPick(p1Target);
          } else if (this.mode !== 'ONLINE_PVP') {
            if (e.code === 'ArrowRight') moveCursor(2, 1);
            else if (e.code === 'ArrowLeft') moveCursor(2, -1);
            else if (e.code === 'ArrowDown') moveCursor(2, stepCols);
            else if (e.code === 'ArrowUp') moveCursor(2, -stepCols);
            else if (e.code === 'Numpad1' || e.code === 'Digit1') {
              const f = this.roster[this.p2CursorIdx];
              if (f) this.confirmPickForSlot(2, f.id);
            } else if (e.code === 'Numpad2' || e.code === 'Digit2') {
              this.undoPick(2);
            }
          }

          if (e.code === 'Enter' && this.canProceedToMap()) {
            document.getElementById('btnProceedMap')?.click();
          }
        } else if (this.currentScreen === 'screenMapSelect') {
          if (this.hasOpenModal()) return;
          if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.cycleMap(-1);
          else if (e.code === 'KeyD' || e.code === 'ArrowRight') this.cycleMap(1);
          else if (e.code === 'KeyJ' || e.code === 'Enter') {
            document.getElementById('btnStartBattle')?.click();
          }
        } else if (this.currentScreen === 'screenBattle') {
          if (e.code === 'Escape') {
            const pauseModal = document.getElementById('modalPause');
            if (pauseModal && !pauseModal.classList.contains('hidden')) {
              this.closeModal('modalPause');
              window.gameApp?.setPaused(false);
            } else {
              if (this.mode !== 'ONLINE_PVP') window.gameApp?.setPaused(true);
              this.openModal('modalPause');
            }
          } else if (e.code === 'KeyR' && this.mode !== 'ONLINE_PVP') {
            window.gameApp?.resetFullMatch();
          }
        }
      });
    }
  }

  window.addEventListener('DOMContentLoaded', () => {
    // Initialize after engine.js sets window.gameApp
    setTimeout(() => {
      window.bvnUI = new BvnUiController();
    }, 0);
  });
})();
