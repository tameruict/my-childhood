// language: JavaScript, file: engine.js, target: HTML5 Canvas 60FPS Authentic Bleach vs Naruto Engine + 3v3 Team + Assist Summon + Online Netplay
// Direct port & cross-reference of net.play5d.game.bvn (GameConfig, FighterActionState, FighterInputCmd, HitVO, FightUI, HitsUI, SocketInputBitCodec)

(function () {
  'use strict';

  // ==================== 0. MERGE EXTRA UNIVERSES & FIGHTERS (DEDUPLICATED) ====================
  function mergeExtraRosterData() {
    if (typeof window === 'undefined') return;
    if (!Array.isArray(window.ANIME_UNIVERSES)) window.ANIME_UNIVERSES = [];
    if (!Array.isArray(window.FIGHTER_ROSTER)) window.FIGHTER_ROSTER = [];

    if (Array.isArray(window.EXTRA_ANIME_UNIVERSES)) {
      const seenU = new Set(window.ANIME_UNIVERSES.map((u) => u && u.id));
      for (const u of window.EXTRA_ANIME_UNIVERSES) {
        if (u && u.id && !seenU.has(u.id)) {
          window.ANIME_UNIVERSES.push(u);
          seenU.add(u.id);
        }
      }
    }

    if (Array.isArray(window.EXTRA_FIGHTER_ROSTER)) {
      const seenF = new Set(window.FIGHTER_ROSTER.map((f) => f && f.id));
      for (const f of window.EXTRA_FIGHTER_ROSTER) {
        if (f && f.id && !seenF.has(f.id)) {
          window.FIGHTER_ROSTER.push(f);
          seenF.add(f.id);
        }
      }
    }
  }
  mergeExtraRosterData();

  // ==================== 1. BVN CORE CONSTANTS ====================
  const BVN_CONFIG = {
    WIDTH: 960,
    HEIGHT: 540,
    FLOOR_Y: 455,
    FPS: 60,
    G: 0.72,
    FIGHTER_HP_MAX: 1000,
    QI_MAX: 300,
    ENERGY_MAX: 100,
    FZQI_MAX: 100,
    USE_ENERGY_CD_FRAMES: 48,
    ENERGY_ADD_NORMAL: 1.0,
    ENERGY_ADD_OVERLOAD: 0.35,
    ENERGY_OVERLOAD_RESUME: 30,
    DEFENSE_LOSE_HP_RATE: 0.05,
    QI_ADD_HIT_RATE: 0.17,
    QI_ADD_HURT_RATE: 0.08,
    FZQI_ADD_PERFRAME: 0.25
  };

  const FighterActionState = {
    NORMAL: 0,
    ATTACK_ING: 10,
    SKILL_ING: 11,
    BISHA_ING: 12,
    BISHA_SUPER_ING: 13,
    JUMP_ING: 14,
    DASH_ING: 15,
    HURT_ACT_ING: 16,
    DEFENSE_ING: 20,
    HURT_ING: 21,
    HURT_FLYING: 22,
    HURT_DOWN: 23,
    DEAD: 30,
    FREEZE: 40,
    WAN_KAI_ING: 50
  };

  const GameMode = {
    TEAM_CPU: 'TEAM_CPU',
    SINGLE_CPU: 'SINGLE_CPU',
    LOCAL_2P: 'LOCAL_2P',
    ONLINE_PVP: 'ONLINE_PVP',
    TRAINING: 'TRAINING'
  };

  const AI_DEFAULT_DIFFICULTY = 'normal';

  const AI_DIFFICULTIES = Object.freeze([
    Object.freeze({
      id: 'easy',
      label: 'Dễ',
      shortDesc: 'Phản xạ chậm, hay chừa khoảng hở để tập combo.'
    }),
    Object.freeze({
      id: 'normal',
      label: 'Trung Bình',
      shortDesc: 'Cân bằng như người chơi thật, công thủ vừa sức.'
    }),
    Object.freeze({
      id: 'hard',
      label: 'Khó',
      shortDesc: 'Ép góc nhanh, nối combo sắc và biết giữ nộ.'
    }),
    Object.freeze({
      id: 'nightmare',
      label: 'Ác Mộng',
      shortDesc: 'Phản xạ cực gắt, phản đòn và combo gần như hoàn hảo.'
    })
  ]);

  const AI_DIFFICULTY_MAP = Object.freeze(
    AI_DIFFICULTIES.reduce((acc, item) => {
      acc[item.id] = item;
      return acc;
    }, {})
  );

  // Data-driven behavioral profiles (60 FPS frame timings & per-decision probabilities)
  const AI_DIFFICULTY_PROFILES = Object.freeze({
    easy: Object.freeze({
      thinkMinFrames: 22,
      thinkMaxFrames: 36,
      reactionDelayFrames: 18,
      reactionCheckInterval: 16,
      pauseMinFrames: 24,
      pauseMaxFrames: 46,
      idleHesitationProb: 0.38,
      postActionPauseProb: 0.55,
      approachProb: 0.60,
      retreatProb: 0.24,
      moveIntentMinFrames: 22,
      moveIntentMaxFrames: 42,
      blockProb: 0.14,
      guardHoldMinFrames: 10,
      guardHoldMaxFrames: 18,
      guardCooldownFrames: 95,
      minGuardEnergy: 0,
      counterProb: 0.04,
      counterCooldownFrames: 360,
      reversalSuProb: 0.0,
      evadeDashProb: 0.06,
      evadeJumpProb: 0.08,
      teleportBehindProb: 0.0,
      hazardEvadeProb: 0.20,
      dashCooldownFrames: 150,
      jumpCooldownFrames: 130,
      approachDashProb: 0.08,
      attackProb: 0.32,
      attackCooldownFrames: 34,
      whiffProb: 0.22,
      whiffRangeSlack: 42,
      comboExtendProb: 0.18,
      maxComboHits: 2,
      comboDelayFrames: 13,
      guardBreakProb: 0.06,
      skillProb: 0.16,
      skillCooldownFrames: 120,
      bishaMinQi: 240,
      bishaProb: 0.08,
      bishaCooldownFrames: 540,
      superProb: 0.14,
      superCooldownFrames: 600,
      respectInvincible: false,
      assistProb: 0.10,
      assistCooldownFrames: 600,
      subMinHitstunFrames: 24,
      subEscapeProb: 0.10,
      subCooldownFrames: 540,
      awakenMinQi: 260,
      awakenMaxHpRatio: 0.65,
      awakenProb: 0.14,
      awakenCooldownFrames: 480
    }),
    normal: Object.freeze({
      thinkMinFrames: 15,
      thinkMaxFrames: 24,
      reactionDelayFrames: 10,
      reactionCheckInterval: 11,
      pauseMinFrames: 16,
      pauseMaxFrames: 32,
      idleHesitationProb: 0.26,
      postActionPauseProb: 0.40,
      approachProb: 0.76,
      retreatProb: 0.16,
      moveIntentMinFrames: 18,
      moveIntentMaxFrames: 32,
      blockProb: 0.34,
      guardHoldMinFrames: 15,
      guardHoldMaxFrames: 25,
      guardCooldownFrames: 56,
      minGuardEnergy: 12,
      counterProb: 0.12,
      counterCooldownFrames: 240,
      reversalSuProb: 0.04,
      evadeDashProb: 0.14,
      evadeJumpProb: 0.16,
      teleportBehindProb: 0.04,
      hazardEvadeProb: 0.46,
      dashCooldownFrames: 105,
      jumpCooldownFrames: 90,
      approachDashProb: 0.18,
      attackProb: 0.48,
      attackCooldownFrames: 23,
      whiffProb: 0.09,
      whiffRangeSlack: 20,
      comboExtendProb: 0.36,
      maxComboHits: 3,
      comboDelayFrames: 9,
      guardBreakProb: 0.18,
      skillProb: 0.24,
      skillCooldownFrames: 85,
      bishaMinQi: 190,
      bishaProb: 0.16,
      bishaCooldownFrames: 360,
      superProb: 0.26,
      superCooldownFrames: 420,
      respectInvincible: false,
      assistProb: 0.18,
      assistCooldownFrames: 450,
      subMinHitstunFrames: 20,
      subEscapeProb: 0.24,
      subCooldownFrames: 420,
      awakenMinQi: 220,
      awakenMaxHpRatio: 0.80,
      awakenProb: 0.26,
      awakenCooldownFrames: 300
    }),
    hard: Object.freeze({
      thinkMinFrames: 8,
      thinkMaxFrames: 14,
      reactionDelayFrames: 7,
      reactionCheckInterval: 8,
      pauseMinFrames: 9,
      pauseMaxFrames: 18,
      idleHesitationProb: 0.13,
      postActionPauseProb: 0.20,
      approachProb: 0.88,
      retreatProb: 0.09,
      moveIntentMinFrames: 11,
      moveIntentMaxFrames: 22,
      blockProb: 0.55,
      guardHoldMinFrames: 19,
      guardHoldMaxFrames: 30,
      guardCooldownFrames: 34,
      minGuardEnergy: 22,
      counterProb: 0.34,
      counterCooldownFrames: 125,
      reversalSuProb: 0.16,
      evadeDashProb: 0.32,
      evadeJumpProb: 0.30,
      teleportBehindProb: 0.14,
      hazardEvadeProb: 0.76,
      dashCooldownFrames: 56,
      jumpCooldownFrames: 52,
      approachDashProb: 0.38,
      attackProb: 0.68,
      attackCooldownFrames: 14,
      whiffProb: 0.02,
      whiffRangeSlack: 6,
      comboExtendProb: 0.66,
      maxComboHits: 4,
      comboDelayFrames: 5,
      guardBreakProb: 0.45,
      skillProb: 0.44,
      skillCooldownFrames: 46,
      bishaMinQi: 130,
      bishaProb: 0.36,
      bishaCooldownFrames: 180,
      superProb: 0.50,
      superCooldownFrames: 220,
      respectInvincible: true,
      assistProb: 0.38,
      assistCooldownFrames: 260,
      subMinHitstunFrames: 12,
      subEscapeProb: 0.50,
      subCooldownFrames: 240,
      awakenMinQi: 185,
      awakenMaxHpRatio: 0.95,
      awakenProb: 0.52,
      awakenCooldownFrames: 150
    }),
    nightmare: Object.freeze({
      thinkMinFrames: 2,
      thinkMaxFrames: 4,
      reactionDelayFrames: 2,
      reactionCheckInterval: 4,
      pauseMinFrames: 2,
      pauseMaxFrames: 5,
      idleHesitationProb: 0.02,
      postActionPauseProb: 0.03,
      approachProb: 0.97,
      retreatProb: 0.04,
      moveIntentMinFrames: 6,
      moveIntentMaxFrames: 12,
      blockProb: 0.84,
      guardHoldMinFrames: 24,
      guardHoldMaxFrames: 36,
      guardCooldownFrames: 8,
      minGuardEnergy: 30,
      counterProb: 0.72,
      counterCooldownFrames: 50,
      reversalSuProb: 0.44,
      evadeDashProb: 0.60,
      evadeJumpProb: 0.48,
      teleportBehindProb: 0.36,
      hazardEvadeProb: 0.96,
      dashCooldownFrames: 22,
      jumpCooldownFrames: 22,
      approachDashProb: 0.74,
      attackProb: 0.94,
      attackCooldownFrames: 3,
      whiffProb: 0.0,
      whiffRangeSlack: 0,
      comboExtendProb: 0.94,
      maxComboHits: 7,
      comboDelayFrames: 1,
      guardBreakProb: 0.82,
      skillProb: 0.78,
      skillCooldownFrames: 12,
      bishaMinQi: 100,
      bishaProb: 0.78,
      bishaCooldownFrames: 45,
      superProb: 0.90,
      superCooldownFrames: 55,
      respectInvincible: true,
      assistProb: 0.74,
      assistCooldownFrames: 95,
      subMinHitstunFrames: 4,
      subEscapeProb: 0.90,
      subCooldownFrames: 110,
      awakenMinQi: 160,
      awakenMaxHpRatio: 1.0,
      awakenProb: 0.88,
      awakenCooldownFrames: 40
    })
  });

  function normalizeAiDifficulty(level) {
    if (typeof level !== 'string') return AI_DEFAULT_DIFFICULTY;
    const key = level.trim().toLowerCase();
    return Object.prototype.hasOwnProperty.call(AI_DIFFICULTY_PROFILES, key)
      ? key
      : AI_DEFAULT_DIFFICULTY;
  }

  function getAiDifficultyMeta(level) {
    return AI_DIFFICULTY_MAP[normalizeAiDifficulty(level)] || AI_DIFFICULTY_MAP[AI_DEFAULT_DIFFICULTY];
  }

  function getAiProfile(level) {
    return AI_DIFFICULTY_PROFILES[normalizeAiDifficulty(level)] || AI_DIFFICULTY_PROFILES[AI_DEFAULT_DIFFICULTY];
  }

  function formatCpuDisplayName(level) {
    return `CPU · ${getAiDifficultyMeta(level).label}`;
  }

  function randIntRange(min, max) {
    if (max <= min) return min;
    return min + Math.floor(Math.random() * (max - min + 1));
  }

  const VFX_ID_TO_STYLE = ['orb', 'spiral_orb', 'slash_arc', 'blade_volley', 'lightning_bolt', 'beast_wave'];
  const VFX_STYLE_TO_ID = {
    orb: 0,
    spiral_orb: 1,
    slash_arc: 2,
    blade_volley: 3,
    lightning_bolt: 4,
    beast_wave: 5
  };
  const MAX_PARTICLES = 160;
  const FONT_DISPLAY = '"Barlow Condensed", "Chakra Petch", "Segoe UI", sans-serif';
  const FONT_UI = '"Chakra Petch", "Segoe UI", sans-serif';
  function cleanDisplayName(name) {
    return String(name || '').replace(/\s*\[M\.U\.G\.E\.N\]\s*/gi, '').trim();
  }

  // ==================== 2. AVATAR IMAGE CACHE (FOR CANVAS HUD & SUPER CUT-IN) ====================
  const avatarImgCache = new Map();
  function getCachedAvatarImage(fighterId, isBig) {
    const key = `${fighterId}:${isBig ? 'big' : 'icon'}`;
    let entry = avatarImgCache.get(key);
    if (entry) return entry;
    const img = new Image();
    const src = `avatars/${fighterId}${isBig ? '_big' : ''}.png`;
    entry = { img, loaded: false, failed: false, src };
    img.onload = () => { entry.loaded = true; };
    img.onerror = () => { entry.failed = true; };
    img.src = src;
    avatarImgCache.set(key, entry);
    return entry;
  }

  // ==================== 3. WEB AUDIO SYNTHESIZER ====================
  class SoundSynth {
    constructor() {
      this.ctx = null;
      this.muted = false;
    }
    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }
    toggleMute() {
      this.muted = !this.muted;
      return this.muted;
    }
    play(type) {
      if (this.muted) return;
      try {
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        if (type === 'ui_move') {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(520, now);
          osc.frequency.exponentialRampToValueAtTime(660, now + 0.045);
          gain.gain.setValueAtTime(0.08, now);
          gain.gain.linearRampToValueAtTime(0.005, now + 0.045);
          osc.start(now);
          osc.stop(now + 0.045);
        } else if (type === 'ui_confirm') {
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(440, now);
          osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
          gain.gain.setValueAtTime(0.14, now);
          gain.gain.linearRampToValueAtTime(0.005, now + 0.11);
          osc.start(now);
          osc.stop(now + 0.11);
        } else if (type === 'ui_cancel') {
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(320, now);
          osc.frequency.exponentialRampToValueAtTime(160, now + 0.09);
          gain.gain.setValueAtTime(0.1, now);
          gain.gain.linearRampToValueAtTime(0.005, now + 0.09);
          osc.start(now);
          osc.stop(now + 0.09);
        } else if (type === 'hit') {
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(195, now);
          osc.frequency.exponentialRampToValueAtTime(52, now + 0.09);
          gain.gain.setValueAtTime(0.22, now);
          gain.gain.linearRampToValueAtTime(0.01, now + 0.09);
          osc.start(now);
          osc.stop(now + 0.09);
        } else if (type === 'heavy') {
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(145, now);
          osc.frequency.exponentialRampToValueAtTime(34, now + 0.18);
          gain.gain.setValueAtTime(0.28, now);
          gain.gain.linearRampToValueAtTime(0.01, now + 0.18);
          osc.start(now);
          osc.stop(now + 0.18);
        } else if (type === 'dash') {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(520, now);
          osc.frequency.exponentialRampToValueAtTime(180, now + 0.11);
          gain.gain.setValueAtTime(0.14, now);
          gain.gain.linearRampToValueAtTime(0.01, now + 0.11);
          osc.start(now);
          osc.stop(now + 0.11);
        } else if (type === 'bisha') {
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(220, now);
          osc.frequency.exponentialRampToValueAtTime(680, now + 0.24);
          gain.gain.setValueAtTime(0.26, now);
          gain.gain.linearRampToValueAtTime(0.01, now + 0.26);
          osc.start(now);
          osc.stop(now + 0.26);
        } else if (type === 'super') {
          osc.type = 'square';
          osc.frequency.setValueAtTime(150, now);
          osc.frequency.exponentialRampToValueAtTime(920, now + 0.44);
          gain.gain.setValueAtTime(0.28, now);
          gain.gain.linearRampToValueAtTime(0.01, now + 0.46);
          osc.start(now);
          osc.stop(now + 0.46);
        } else if (type === 'ko') {
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(260, now);
          osc.frequency.exponentialRampToValueAtTime(42, now + 0.55);
          gain.gain.setValueAtTime(0.32, now);
          gain.gain.linearRampToValueAtTime(0.01, now + 0.58);
          osc.start(now);
          osc.stop(now + 0.58);
        }
      } catch (_) {}
    }
  }

  const sfx = new SoundSynth();

  // ==================== 4. QUICK ACCOUNT MANAGER ====================
  class QuickAccountManager {
    constructor() {
      this.storageKey = 'bvn_crossover_accounts_v2';
      this.state = this.load();
    }

    load() {
      try {
        const raw = localStorage.getItem(this.storageKey) || localStorage.getItem('bvn_crossover_accounts_v1');
        if (raw) return JSON.parse(raw);
      } catch (_) {}
      const randId = Math.floor(1000 + Math.random() * 9000);
      return {
        p1: {
          nickname: 'Shinobi_' + randId,
          tag: '#' + randId,
          elo: 1200,
          wins: 0,
          losses: 0
        },
        p2: {
          nickname: 'Player2',
          tag: '#2026',
          elo: 1200,
          wins: 0,
          losses: 0
        }
      };
    }

    save() {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(this.state));
      } catch (_) {}
      this.renderUI();
      if (window.netplay) {
        window.netplay.setProfile(this.state.p1);
      }
    }

    quickLogin(slot, nameInput) {
      const clean = (nameInput || '').trim().slice(0, 16);
      const tagNum = Math.floor(1000 + Math.random() * 9000);
      if (slot === 1) {
        this.state.p1.nickname = clean || ('Shinobi_' + tagNum);
        this.state.p1.tag = '#' + tagNum;
      } else {
        this.state.p2.nickname = clean || ('Player2_' + tagNum);
        this.state.p2.tag = '#' + tagNum;
      }
      this.save();
    }

    recordMatchResult(winnerSlot, isLocalPlayerP2) {
      const localSlot = isLocalPlayerP2 ? 2 : 1;
      let delta = 0;
      if (winnerSlot === localSlot) {
        this.state.p1.wins++;
        this.state.p1.elo += 24;
        delta = 24;
      } else if (winnerSlot === 1 || winnerSlot === 2) {
        this.state.p1.losses++;
        this.state.p1.elo = Math.max(800, this.state.p1.elo - 16);
        delta = -16;
      }
      this.save();
      return delta;
    }

    renderUI() {
      const p1Name = document.getElementById('p1ProfileName');
      const p1Stats = document.getElementById('p1ProfileStats');
      if (p1Name) p1Name.textContent = `${this.state.p1.nickname} ${this.state.p1.tag}`;
      if (p1Stats) p1Stats.textContent = `Elo ${this.state.p1.elo} · ${this.state.p1.wins}W/${this.state.p1.losses}L`;
      const in1 = document.getElementById('inputP1Name');
      const in2 = document.getElementById('inputP2Name');
      if (in1 && !in1.value) in1.value = this.state.p1.nickname;
      if (in2 && !in2.value) in2.value = this.state.p2.nickname;
    }
  }

  // ==================== 5. DUAL-KEYBOARD ZERO-GHOSTING INPUT ENGINE ====================
  class DualKeyboardInput {
    constructor() {
      this.keysDown = new Set();
      this.keysJustPressed = new Set();

      window.addEventListener('keydown', (e) => {
        const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
        if (tag === 'input' || tag === 'textarea') return;

        const code = e.code;
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(code)) {
          e.preventDefault();
        }
        if (!this.keysDown.has(code)) {
          this.keysJustPressed.add(code);
        }
        this.keysDown.add(code);
      });

      window.addEventListener('keyup', (e) => {
        this.keysDown.delete(e.code);
      });

      window.addEventListener('blur', () => {
        this.keysDown.clear();
        this.keysJustPressed.clear();
      });
    }

    clearJustPressed() {
      this.keysJustPressed.clear();
    }

    getPlayerInput(slot) {
      if (slot === 1) {
        return {
          up: this.keysDown.has('KeyW'),
          down: this.keysDown.has('KeyS'),
          left: this.keysDown.has('KeyA'),
          right: this.keysDown.has('KeyD'),
          attack: this.keysJustPressed.has('KeyJ'),
          jump: this.keysJustPressed.has('KeyK'),
          dash: this.keysJustPressed.has('KeyL'),
          skill: this.keysJustPressed.has('KeyU'),
          bisha: this.keysJustPressed.has('KeyI'),
          assist: this.keysJustPressed.has('KeyO'),
          awaken: (
            (this.keysDown.has('KeyJ') && this.keysJustPressed.has('KeyK')) ||
            (this.keysDown.has('KeyK') && this.keysJustPressed.has('KeyJ')) ||
            this.keysJustPressed.has('KeyP')
          )
        };
      }
      return {
        up: this.keysDown.has('ArrowUp'),
        down: this.keysDown.has('ArrowDown'),
        left: this.keysDown.has('ArrowLeft'),
        right: this.keysDown.has('ArrowRight'),
        attack: this.keysJustPressed.has('Numpad1') || this.keysJustPressed.has('Digit1'),
        jump: this.keysJustPressed.has('Numpad2') || this.keysJustPressed.has('Digit2'),
        dash: this.keysJustPressed.has('Numpad3') || this.keysJustPressed.has('Digit3'),
        skill: this.keysJustPressed.has('Numpad4') || this.keysJustPressed.has('Digit4'),
        bisha: this.keysJustPressed.has('Numpad5') || this.keysJustPressed.has('Digit5'),
        assist: this.keysJustPressed.has('Numpad6') || this.keysJustPressed.has('Digit6'),
        awaken: (
          (this.keysDown.has('Numpad1') && this.keysJustPressed.has('Numpad2')) ||
          (this.keysDown.has('Numpad2') && this.keysJustPressed.has('Numpad1')) ||
          (this.keysDown.has('Digit1') && this.keysJustPressed.has('Digit2')) ||
          (this.keysDown.has('Digit2') && this.keysJustPressed.has('Digit1')) ||
          this.keysJustPressed.has('Numpad0') ||
          this.keysJustPressed.has('Digit0')
        )
      };
    }

    // Online Guest convenience: accept BOTH P1 keys (WASD+JKLUI) AND P2 keys (Arrows+1..6)
    getCombinedLocalInput() {
      const a = this.getPlayerInput(1);
      const b = this.getPlayerInput(2);
      return {
        up: a.up || b.up,
        down: a.down || b.down,
        left: a.left || b.left,
        right: a.right || b.right,
        attack: a.attack || b.attack,
        jump: a.jump || b.jump,
        dash: a.dash || b.dash,
        skill: a.skill || b.skill,
        bisha: a.bisha || b.bisha,
        assist: a.assist || b.assist,
        awaken: a.awaken || b.awaken
      };
    }
  }

  // ==================== 6. FIGHTER ENTITY ====================
  class FighterEntity {
    constructor(slot, meta, startX, direct) {
      this.slot = slot;
      this.meta = meta;
      this.x = startX;
      this.y = BVN_CONFIG.FLOOR_Y;
      this.vx = 0;
      this.vy = 0;
      this.width = 54;
      this.height = 92;
      this.direct = direct;

      this.hpMax = meta.hpMax || BVN_CONFIG.FIGHTER_HP_MAX;
      this.hp = this.hpMax;
      this.displayHp = this.hpMax; // Delayed BVN red damage trail
      this.qi = 100;
      this.qiMax = BVN_CONFIG.QI_MAX;
      this.energy = BVN_CONFIG.ENERGY_MAX;
      this.energyMax = BVN_CONFIG.ENERGY_MAX;
      this.energyOverLoad = false;
      this.energyGap = 0;
      this.fzqi = 100;
      this.fzqiMax = BVN_CONFIG.FZQI_MAX;

      this.actionState = FighterActionState.NORMAL;
      this.stateTimer = 0;
      this.comboStep = 0;
      this.comboTimer = 0;
      this.jumpTimes = 2;
      this.awakened = false;
      this.awakenTimer = 0;
      this.invincibleTimer = 0;
      this.frozenTimer = 0;
      this.counterTimer = 0;
      this.counterSpec = null;
      this.superArmorBudget = 0;
      this.grabbedBy = 0;
      this.hazardSlowMult = 1.0;
      this.buffTimer = 0;
      this.buffSpeedMult = 1.0;
      this.buffDmgMult = 1.0;
      this.buffColor = null;
      this.activeSkillKey = null;
      this.lastCmdLabel = 'IDLE';
      this.cooldowns = {};
      this.afterimages = [];

      // BVN Combo Tracking (HitsUI)
      this.hitComboCount = 0;
      this.hitComboDamage = 0;
      this.hitComboDisplayTimer = 0;
      this.maxComboCount = 0;
      this.lastHurtFrame = 0;
    }

    get isInAir() {
      return this.y < BVN_CONFIG.FLOOR_Y - 1;
    }

    useEnergy(amount) {
      if (this.energyOverLoad) return false;
      this.energy -= amount;
      this.energyGap = BVN_CONFIG.USE_ENERGY_CD_FRAMES;
      if (this.energy <= 0) {
        this.energy = 0;
        this.energyOverLoad = true;
      }
      return true;
    }

    addQi(amount) {
      this.qi = Math.min(this.qiMax, this.qi + amount);
    }

    useQi(amount) {
      if (this.qi < amount) return false;
      this.qi -= amount;
      return true;
    }

    canAct() {
      return (
        this.actionState === FighterActionState.NORMAL ||
        this.actionState === FighterActionState.JUMP_ING ||
        this.actionState === FighterActionState.DEFENSE_ING
      );
    }

    updateResources(isTraining, frameCounter) {
      if (this.displayHp > this.hp) {
        this.displayHp = Math.max(this.hp, this.displayHp - Math.max(2.2, (this.displayHp - this.hp) * 0.085));
      } else {
        this.displayHp = this.hp;
      }

      if (this.hitComboDisplayTimer > 0) {
        this.hitComboDisplayTimer--;
        if (this.hitComboDisplayTimer === 0) {
          this.hitComboCount = 0;
          this.hitComboDamage = 0;
        }
      }

      if (isTraining) {
        this.qi = Math.max(this.qi, 300);
        this.energy = 100;
        this.energyOverLoad = false;
        this.fzqi = 100;
        if (this.hp < this.hpMax && frameCounter - this.lastHurtFrame > 110) {
          this.hp = Math.min(this.hpMax, this.hp + 14);
        }
      }

      for (const k in this.cooldowns) {
        if (this.cooldowns[k] > 0) this.cooldowns[k]--;
      }

      if (this.energyGap > 0) {
        this.energyGap--;
      } else if (this.energy < this.energyMax) {
        if (this.energyOverLoad) {
          this.energy += BVN_CONFIG.ENERGY_ADD_OVERLOAD;
          if (this.energy >= BVN_CONFIG.ENERGY_OVERLOAD_RESUME) {
            this.energyOverLoad = false;
          }
        } else if (this.actionState === FighterActionState.DEFENSE_ING) {
          this.energy += 0.4;
        } else {
          this.energy += BVN_CONFIG.ENERGY_ADD_NORMAL;
        }
        if (this.energy > this.energyMax) this.energy = this.energyMax;
      }

      if (this.fzqi < this.fzqiMax) {
        this.fzqi = Math.min(this.fzqiMax, this.fzqi + BVN_CONFIG.FZQI_ADD_PERFRAME);
      }

      let awakenEnded = false;
      if (this.awakened) {
        this.awakenTimer--;
        const awForm = this.meta && this.meta.awakenedForm;
        if (awForm && awForm.hpDrainPerSec > 0) {
          this.hp = Math.max(1, this.hp - awForm.hpDrainPerSec / BVN_CONFIG.FPS);
        } else {
          this.hp = Math.min(this.hpMax, this.hp + 0.15);
        }
        if (this.awakenTimer <= 0) {
          this.awakened = false;
          this.superArmorBudget = 0;
          awakenEnded = true;
        }
      }

      if (this.counterTimer > 0) {
        this.counterTimer--;
        if (this.counterTimer === 0) {
          this.counterSpec = null;
        }
      }

      if (this.buffTimer > 0) {
        this.buffTimer--;
        if (this.buffTimer <= 0) {
          this.buffSpeedMult = 1.0;
          this.buffDmgMult = 1.0;
          this.buffColor = null;
        }
      }

      if (this.invincibleTimer > 0) this.invincibleTimer--;
      if (this.comboTimer > 0) {
        this.comboTimer--;
        if (this.comboTimer === 0) this.comboStep = 0;
      }
      return awakenEnded;
    }
  }

  // ==================== 7. MAIN BVN GAME ENGINE ====================
  class AnimeCrossoverGame {
    constructor() {
      mergeExtraRosterData();
      this.canvas = document.getElementById('gameCanvas');
      this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
      this.input = new DualKeyboardInput();
      this.accounts = new QuickAccountManager();
      this.sfx = sfx;

      this.inBattle = false;
      this.paused = false;

      // Match Config (BVN 3v3 Team or 1v1 Single + Assists)
      this.mode = GameMode.SINGLE_CPU;
      this.matchFormat = '1v1'; // '1v1' | '3v3'
      this.onlineRole = null;   // null | 'host' | 'guest'
      this.aiDifficulty = AI_DEFAULT_DIFFICULTY;
      this.aiState = this.createInitialAIState();
      this.p1TeamIds = ['naruto'];
      this.p2TeamIds = ['luffy'];
      this.p1TeamIdx = 0;
      this.p2TeamIdx = 0;
      this.p1AssistId = 'sasuke';
      this.p2AssistId = 'zoro';
      this.p1Id = 'naruto';
      this.p2Id = 'luffy';
      this.p1Wins = 0;
      this.p2Wins = 0;
      this.roundNumber = 1;
      this.roundPhase = 'INTRO'; // 'INTRO' | 'FIGHT' | 'KO_SLOWMO' | 'MATCH_OVER'
      this.roundPhaseTimer = 0;
      this.koBannerText = 'K.O!';
      this.lastRoundWinner = 0;
      this.maxComboP1 = 0;
      this.maxComboP2 = 0;
      this.p1DisplayName = this.accounts.state.p1.nickname;
      this.p2DisplayName = formatCpuDisplayName(this.aiDifficulty);

      this.p1 = null;
      this.p2 = null;
      this.projectiles = [];
      this.beams = [];
      this.assistSummons = [];
      this.scheduledEffects = [];
      this.hazards = [];
      this.ghosts = [];
      this.vfxEffects = [];
      this.particles = [];
      this.floatingTexts = [];
      this.hitstopFrames = 0;
      this.shakeFrames = 0;
      this.superFlashFrames = 0;
      this.superFlashTitle = '';
      this.superFlashColor = '#38bdf8';
      this.superFlashFighterId = null;
      this.superFlashSlot = 1;
      this.timeFreezeOverlay = null;
      this.domainOverlay = null;

      this.roundTime = 99;
      this.frameCounter = 0;
      this.matchOver = false;
      this.winnerText = '';
      this.currentMapId = (Array.isArray(window.GAME_MAPS) && window.GAME_MAPS.length > 0)
        ? window.GAME_MAPS[0].id
        : 'konoha_village';

      this.bindCoreUI();
      this.loop();
    }

    getFighterMeta(id) {
      return window.FIGHTER_ROSTER.find((f) => f.id === id) || window.FIGHTER_ROSTER[0];
    }

    getActiveSkill(fighter, key) {
      if (!fighter || !fighter.meta) return null;
      if (fighter.awakened && fighter.meta.awakenedSkills && fighter.meta.awakenedSkills[key]) {
        return fighter.meta.awakenedSkills[key];
      }
      return fighter.meta.skills ? fighter.meta.skills[key] : null;
    }

    bindCoreUI() {
      this.accounts.renderUI();

      // Quick Login bindings
      const btnP1Login = document.getElementById('btnP1Login');
      const btnP2Login = document.getElementById('btnP2Login');
      if (btnP1Login) {
        btnP1Login.addEventListener('click', () => {
          const val = document.getElementById('inputP1Name').value;
          this.accounts.quickLogin(1, val);
          sfx.play('ui_confirm');
        });
      }
      if (btnP2Login) {
        btnP2Login.addEventListener('click', () => {
          const val = document.getElementById('inputP2Name').value;
          this.accounts.quickLogin(2, val);
          sfx.play('ui_confirm');
        });
      }

      // MUGEN custom importer bindings
      const inputMugenP1 = document.getElementById('inputMugenFilesP1');
      const inputMugenP2 = document.getElementById('inputMugenFilesP2');
      const chkHitbox = document.getElementById('chkMugenHitbox');
      if (inputMugenP1) {
        inputMugenP1.addEventListener('change', (e) => {
          if (window.mugenRegistry && e.target.files.length) {
            window.mugenRegistry.importFromFileList(e.target.files, 1);
          }
        });
      }
      if (inputMugenP2) {
        inputMugenP2.addEventListener('change', (e) => {
          if (window.mugenRegistry && e.target.files.length) {
            window.mugenRegistry.importFromFileList(e.target.files, 2);
          }
        });
      }
      if (chkHitbox) {
        chkHitbox.addEventListener('change', (e) => {
          if (window.mugenRegistry) {
            window.mugenRegistry.showHitboxes = e.target.checked;
          }
        });
      }

      // Listen for Online Snapshots when guest
      if (window.netplay) {
        window.netplay.on('snapshot', (snap) => {
          if (this.inBattle && this.mode === GameMode.ONLINE_PVP && this.onlineRole === 'guest') {
            this.applyOnlineSnapshot(snap);
          }
        });
      }
    }

    createInitialAIState() {
      return {
        thinkTimer: 0,
        pauseTimer: 0,
        moveIntent: 0,
        moveIntentTimer: 0,
        guardHoldTimer: 0,
        guardCooldown: 0,
        perceivedAttackFrames: 0,
        perceivedProjectileFrames: 0,
        perceivedHazardFrames: 0,
        perceivedGuardFrames: 0,
        hitstunFrames: 0,
        subCheckedThisCombo: false,
        comboChainLeft: 0,
        comboFollowupTimer: 0,
        wasActing: false,
        attackCooldown: 0,
        skillCooldown: 0,
        dashCooldown: 0,
        jumpCooldown: 0,
        counterCooldown: 0,
        bishaCooldown: 0,
        superCooldown: 0,
        assistCooldown: 0,
        awakenCooldown: 0,
        subCooldown: 0
      };
    }

    setAiDifficulty(level) {
      this.aiDifficulty = normalizeAiDifficulty(level);
      this.aiState = this.createInitialAIState();
      if (this.mode === GameMode.SINGLE_CPU || this.mode === GameMode.TEAM_CPU) {
        this.p2DisplayName = formatCpuDisplayName(this.aiDifficulty);
      }
      return this.aiDifficulty;
    }

    getAiDifficulty() {
      return this.aiDifficulty;
    }

    // Called by bvn-ui.js when starting a new match from Stage Select / Rematch
    launchMatch(config) {
      const cfg = config || {};
      this.mode = cfg.mode || GameMode.SINGLE_CPU;
      this.matchFormat = cfg.format === '3v3' ? '3v3' : '1v1';
      this.onlineRole = cfg.onlineRole || null;
      this.aiDifficulty = normalizeAiDifficulty(cfg.aiDifficulty);
      this.aiState = this.createInitialAIState();
      this.p1TeamIds = Array.isArray(cfg.p1Team) && cfg.p1Team.length ? [...cfg.p1Team] : ['naruto'];
      this.p2TeamIds = Array.isArray(cfg.p2Team) && cfg.p2Team.length ? [...cfg.p2Team] : ['luffy'];
      this.p1AssistId = cfg.p1Assist || this.p1TeamIds[0];
      this.p2AssistId = cfg.p2Assist || this.p2TeamIds[0];
      this.currentMapId = cfg.mapId || this.currentMapId || 'konoha_village';

      this.p1DisplayName = (cfg.p1Profile && cfg.p1Profile.nickname) || this.accounts.state.p1.nickname;
      this.p2DisplayName = (cfg.p2Profile && cfg.p2Profile.nickname) || (
        this.mode === GameMode.LOCAL_2P ? this.accounts.state.p2.nickname
        : this.mode === GameMode.TRAINING ? 'Training Dummy'
        : formatCpuDisplayName(this.aiDifficulty)
      );

      this.p1TeamIdx = 0;
      this.p2TeamIdx = 0;
      this.p1Wins = 0;
      this.p2Wins = 0;
      this.roundNumber = 1;
      this.maxComboP1 = 0;
      this.maxComboP2 = 0;
      this.paused = false;
      this.inBattle = true;

      // Preload avatar images for HUD & all team/assist members
      [...this.p1TeamIds, ...this.p2TeamIds, this.p1AssistId, this.p2AssistId].forEach((fid) => {
        getCachedAvatarImage(fid, false);
        getCachedAvatarImage(fid, true);
      });

      this.setupRound(null);
    }

    resetFullMatch() {
      const isCpuMode = this.mode === GameMode.SINGLE_CPU || this.mode === GameMode.TEAM_CPU;
      this.launchMatch({
        mode: this.mode,
        format: this.matchFormat,
        onlineRole: this.onlineRole,
        aiDifficulty: this.aiDifficulty,
        p1Team: this.p1TeamIds,
        p2Team: this.p2TeamIds,
        p1Assist: this.p1AssistId,
        p2Assist: this.p2AssistId,
        mapId: this.currentMapId,
        p1Profile: { nickname: this.p1DisplayName },
        p2Profile: isCpuMode ? null : { nickname: this.p2DisplayName }
      });
    }

    stopBattle() {
      this.inBattle = false;
      this.paused = false;
      this.projectiles = [];
      this.beams = [];
      this.assistSummons = [];
      this.scheduledEffects = [];
      this.hazards = [];
      this.ghosts = [];
      this.vfxEffects = [];
      this.particles = [];
      this.floatingTexts = [];
    }

    setPaused(val) {
      this.paused = Boolean(val);
    }

    setupRound(carryOver) {
      this.p1Id = this.p1TeamIds[Math.min(this.p1TeamIdx, this.p1TeamIds.length - 1)];
      this.p2Id = this.p2TeamIds[Math.min(this.p2TeamIdx, this.p2TeamIds.length - 1)];

      const m1 = this.getFighterMeta(this.p1Id);
      const m2 = this.getFighterMeta(this.p2Id);
      this.p1 = new FighterEntity(1, m1, 220, 1);
      this.p2 = new FighterEntity(2, m2, 740, -1);

      // Authentic BVN 3v3 Team Play carryover: surviving fighter recovers +30% HP and keeps Qi!
      if (carryOver && carryOver.slot === 1) {
        this.p1.hp = Math.min(this.p1.hpMax, Math.round(carryOver.hp + this.p1.hpMax * 0.3));
        this.p1.displayHp = this.p1.hp;
        this.p1.qi = carryOver.qi;
      } else if (carryOver && carryOver.slot === 2) {
        this.p2.hp = Math.min(this.p2.hpMax, Math.round(carryOver.hp + this.p2.hpMax * 0.3));
        this.p2.displayHp = this.p2.hp;
        this.p2.qi = carryOver.qi;
      }

      this.projectiles = [];
      this.beams = [];
      this.assistSummons = [];
      this.scheduledEffects = [];
      this.hazards = [];
      this.ghosts = [];
      this.vfxEffects = [];
      this.particles = [];
      this.floatingTexts = [];
      this.roundTime = 99;
      this.frameCounter = 0;
      this.matchOver = false;
      this.winnerText = '';
      this.hitstopFrames = 0;
      this.superFlashFrames = 0;
      this.timeFreezeOverlay = null;
      this.domainOverlay = null;

      this.roundPhase = this.mode === GameMode.TRAINING ? 'FIGHT' : 'INTRO';
      this.roundPhaseTimer = this.mode === GameMode.TRAINING ? 0 : 88;
      this.lastRoundWinner = 0;
      this.aiState = this.createInitialAIState();

      this.renderSkillDeck();

      // Ensure active fighters + assists are loaded in MUGEN registry
      if (window.mugenRegistry) {
        window.mugenRegistry.ensureFightersLoaded(this.p1Id, this.p2Id);
        window.mugenRegistry.ensureFightersLoaded(this.p1AssistId, this.p2AssistId);
      }
    }

    // Accepts a full match config (delegating to launchMatch) OR acts as legacy MUGEN hot-importer hook when called with no args
    startMatch(config) {
      if (config && typeof config === 'object') {
        this.launchMatch(config);
        return;
      }
      this.p1TeamIds = [this.p1Id];
      this.p2TeamIds = [this.p2Id];
      this.p1TeamIdx = 0;
      this.p2TeamIdx = 0;
      this.setupRound(null);
    }

    // ==================== 8. SKILL & ASSIST EXECUTION ====================
    triggerSkill(fighter, opponent, skillKey) {
      if (this.roundPhase !== 'FIGHT') return false;
      const skill = this.getActiveSkill(fighter, skillKey);
      if (!skill) return false;

      if (fighter.cooldowns[skillKey] && fighter.cooldowns[skillKey] > 0) {
        this.spawnFloatingText(fighter.x, fighter.y - 105, 'Hồi chiêu!', '#94a3b8');
        return false;
      }

      if (skill.qiCost && !fighter.useQi(skill.qiCost)) {
        this.spawnFloatingText(fighter.x, fighter.y - 105, `Cần ${skill.qiCost} Nộ!`, '#f87171');
        return false;
      }

      if (skill.cooldown) {
        fighter.cooldowns[skillKey] = skill.cooldown;
      }

      fighter.direct = opponent.x >= fighter.x ? 1 : -1;
      fighter.activeSkillKey = skillKey;
      fighter.lastCmdLabel = `${skill.cmd}: ${skill.name}`;

      const awForm = fighter.awakened && fighter.meta.awakenedForm ? fighter.meta.awakenedForm : null;
      const awDmgMult = fighter.awakened ? ((awForm && awForm.dmgMult) || 1.25) : 1.0;
      const dmgMult = awDmgMult * (fighter.buffTimer > 0 ? fighter.buffDmgMult : 1.0);
      const finalDmg = Math.round((skill.dmg || 40) * dmgMult);
      const skillType = skill.type || '';
      const vfxStyle = skill.vfxStyle || 'orb';
      const qiBurn = skill.qiBurn || 0;
      const isSuperSlot = skillKey === 'si' || (skill.qiCost && skill.qiCost >= 300);
      const isBishaSlot = skillKey === 'i' || skillKey === 'wi' || (skill.qiCost && skill.qiCost >= 100 && !isSuperSlot);

      // ---- NEW PRIMITIVE 1: multi_hit_rush ----
      if (skillType === 'multi_hit_rush') {
        const hits = Math.max(2, Math.min(10, skill.hits || 5));
        const hitInterval = Math.max(2, Math.min(10, skill.hitInterval || 4));
        const rangeX = skill.rangeX || 145;
        const rangeY = skill.rangeY || 115;
        const dashSpeed = skill.dashSpeed !== undefined ? skill.dashSpeed : 11.5;
        const rushColor = skill.beamColor || fighter.meta.colors.aura;
        const rushVfx = skill.vfxStyle || 'slash_arc';
        const totalDur = (hits - 1) * hitInterval + 14;

        fighter.actionState = isSuperSlot
          ? FighterActionState.BISHA_SUPER_ING
          : (isBishaSlot ? FighterActionState.BISHA_ING : FighterActionState.SKILL_ING);
        fighter.stateTimer = Math.max(22, totalDur);
        if (isSuperSlot) {
          fighter.invincibleTimer = Math.max(30, totalDur);
          this.triggerSuperFlash(fighter, `SIÊU TUYỆT KỸ: ${skill.name}`, rushColor, 32);
          sfx.play('super');
          this.shakeFrames = Math.max(this.shakeFrames, 18);
        } else if (isBishaSlot) {
          fighter.invincibleTimer = Math.max(22, totalDur - 4);
          this.triggerSuperFlash(fighter, skill.name, rushColor, 22);
          sfx.play('bisha');
        } else {
          sfx.play('heavy');
        }

        fighter.vx = fighter.direct * dashSpeed;
        this.recordAfterimage(fighter);

        const perHitDmg = Math.max(8, Math.round(finalDmg / (hits + 0.5)));
        const finalHitDmg = Math.max(14, Math.round(perHitDmg * 1.55));
        const perHitQiGain = Math.max(0, Math.round((skill.qiGain || (isBishaSlot || isSuperSlot ? 0 : 24)) / hits));
        const rushState = { defenderQiGranted: false };

        const executeRushSwing = (hitIdx) => {
          if (
            this.roundPhase !== 'FIGHT' ||
            fighter.actionState === FighterActionState.DEAD ||
            fighter.actionState === FighterActionState.HURT_ING ||
            fighter.actionState === FighterActionState.HURT_FLYING ||
            fighter.frozenTimer > 0
          ) {
            return;
          }
          const isFinal = hitIdx === hits - 1;
          fighter.direct = opponent.x >= fighter.x ? 1 : -1;
          fighter.vx = fighter.direct * (isFinal ? Math.max(4, dashSpeed * 0.4) : Math.max(4, dashSpeed * 0.65));
          if (hitIdx > 0) {
            this.recordAfterimage(fighter);
            sfx.play(isFinal ? 'heavy' : 'hit');
          }
          this.spawnVfxBurst(
            fighter.x + fighter.direct * 44,
            fighter.y - 48 + (hitIdx % 2 === 0 ? -6 : 6),
            fighter.direct,
            rushVfx,
            rushColor,
            isFinal ? 1.35 : 0.95
          );
          this.performMeleeHitbox(fighter, opponent, {
            rangeX,
            rangeY,
            dmg: isFinal ? finalHitDmg : perHitDmg,
            hitx: fighter.direct * (isFinal ? 12.5 : 3.5),
            hity: isFinal ? -10.5 : -1.5,
            hurtType: isFinal ? 1 : 0,
            hitstop: isFinal ? 5 : 1,
            qiGain: perHitQiGain,
            qiBurn: isFinal ? qiBurn : 0,
            isBreakDef: isFinal ? (!!skill.isBreakDef || isBishaSlot || isSuperSlot) : false,
            isBisha: isBishaSlot,
            isSuper: isSuperSlot,
            color: rushColor,
            vfxStyle: rushVfx,
            rushState
          });
        };

        executeRushSwing(0);
        for (let h = 1; h < hits; h++) {
          this.scheduledEffects.push({
            delay: h * hitInterval,
            ownerSlot: fighter.slot,
            fn: () => executeRushSwing(h)
          });
        }
        return true;
      }

      // ---- NEW PRIMITIVE 2: true_counter ----
      if (skillType === 'true_counter') {
        const windowFrames = Math.max(16, Math.min(36, skill.windowFrames || 24));
        const counterCol = skill.beamColor || fighter.meta.colors.aura;
        const counterLabel = skill.counterLabel || skill.name || 'PHẢN ĐÒN';
        fighter.actionState = FighterActionState.SKILL_ING;
        fighter.stateTimer = windowFrames;
        fighter.vx *= 0.2;
        fighter.counterTimer = windowFrames;
        fighter.counterSpec = {
          mult: skill.counterMult || 1.45,
          rangeX: skill.counterRangeX || 260,
          vfxStyle: skill.vfxStyle || 'slash_arc',
          color: counterCol,
          label: counterLabel,
          baseDmg: finalDmg,
          qiGain: skill.qiGain || 26,
          qiBurn,
          isBisha: isBishaSlot || isSuperSlot
        };
        sfx.play('dash');
        this.spawnVfxBurst(fighter.x, fighter.y - 48, fighter.direct, 'orb', counterCol, 0.9);
        this.spawnFloatingText(fighter.x, fighter.y - 110, `⚡ ${counterLabel}`, counterCol);
        return true;
      }

      // ---- NEW PRIMITIVE 3: command_grab ----
      if (skillType === 'command_grab') {
        const grabRangeX = skill.grabRangeX || 145;
        const holdFrames = Math.max(20, Math.min(54, skill.holdFrames || 34));
        const ticks = Math.max(2, Math.min(5, skill.ticks || 3));
        const grabCol = skill.beamColor || fighter.meta.colors.aura;
        const grabVfx = skill.vfxStyle || 'orb';
        const grabLabel = skill.grabLabel || skill.name || 'KHỐNG CHẾ';

        fighter.actionState = isBishaSlot ? FighterActionState.BISHA_ING : FighterActionState.SKILL_ING;
        fighter.stateTimer = 20;
        fighter.vx = fighter.direct * 8.5;
        sfx.play('dash');

        const dx = opponent.x - fighter.x;
        const dy = Math.abs(opponent.y - fighter.y);
        const inFront = dx * fighter.direct >= -28;
        const canGrab =
          inFront &&
          Math.abs(dx) <= grabRangeX &&
          dy <= 115 &&
          opponent.invincibleTimer <= 0 &&
          opponent.actionState !== FighterActionState.DEAD;

        if (!canGrab) {
          this.spawnVfxBurst(fighter.x + fighter.direct * 52, fighter.y - 48, fighter.direct, grabVfx, grabCol, 0.85);
          this.spawnFloatingText(fighter.x, fighter.y - 98, 'Hụt!', '#94a3b8');
          return true;
        }

        // If defender has active true_counter, route through applyHit so counter triggers properly
        if (opponent.counterTimer > 0) {
          this.applyHit(fighter, opponent, {
            dmg: finalDmg,
            hitx: fighter.direct * 8,
            hity: -6,
            hurtType: 1,
            qiGain: skill.qiGain || 20,
            qiBurn,
            isBreakDef: true,
            isGrab: true,
            color: grabCol,
            vfxStyle: grabVfx
          });
          return true;
        }

        if (isBishaSlot || isSuperSlot) {
          this.triggerSuperFlash(fighter, grabLabel, grabCol, 22);
          sfx.play(isSuperSlot ? 'super' : 'bisha');
        } else {
          sfx.play('heavy');
        }

        fighter.stateTimer = holdFrames + 6;
        fighter.invincibleTimer = Math.max(fighter.invincibleTimer, Math.floor(holdFrames * 0.6));
        fighter.vx = 0;

        opponent.x = Math.max(55, Math.min(BVN_CONFIG.WIDTH - 55, fighter.x + fighter.direct * 58));
        opponent.vx = 0;
        opponent.vy = 0;
        opponent.frozenTimer = holdFrames;
        opponent.grabbedBy = fighter.slot;
        opponent.actionState = FighterActionState.FREEZE;

        this.spawnVfxBurst(opponent.x, opponent.y - 48, fighter.direct, grabVfx, grabCol, 1.3);
        this.spawnFloatingText(opponent.x, opponent.y - 118, `⛓ ${grabLabel}!`, '#fde047');

        const step = Math.max(6, Math.floor((holdFrames - 4) / ticks));
        const midTickDmg = Math.max(10, Math.round((finalDmg * 0.6) / Math.max(1, ticks - 1)));
        const slamDmg = Math.max(20, Math.round(finalDmg * 0.48));
        const rushState = { defenderQiGranted: false };

        for (let t = 0; t < ticks; t++) {
          const isSlam = t === ticks - 1;
          const delay = isSlam ? Math.max(step * t, holdFrames - 2) : Math.max(4, step * t + 4);
          this.scheduledEffects.push({
            delay,
            ownerSlot: fighter.slot,
            grabOwnerSlot: fighter.slot,
            grabTargetSlot: opponent.slot,
            fn: () => {
              if (
                this.roundPhase !== 'FIGHT' ||
                opponent.grabbedBy !== fighter.slot ||
                fighter.actionState === FighterActionState.DEAD ||
                opponent.actionState === FighterActionState.DEAD
              ) {
                return;
              }
              if (isSlam) {
                opponent.frozenTimer = 0;
                opponent.grabbedBy = 0;
                this.shakeFrames = Math.max(this.shakeFrames, 12);
                sfx.play('heavy');
              } else {
                sfx.play('hit');
              }
              this.spawnVfxBurst(opponent.x, opponent.y - 48, fighter.direct, grabVfx, grabCol, isSlam ? 1.45 : 0.9);
              this.applyHit(fighter, opponent, {
                dmg: isSlam ? slamDmg : midTickDmg,
                hitx: isSlam ? fighter.direct * 13 : 0,
                hity: isSlam ? -11 : 0,
                hurtType: isSlam ? 1 : 0,
                hitstop: isSlam ? 6 : 2,
                qiGain: isSlam ? (skill.qiGain || 24) : 0,
                qiBurn: isSlam ? qiBurn : 0,
                isBreakDef: true,
                isGrab: true,
                isBisha: isBishaSlot,
                isSuper: isSuperSlot,
                keepFrozen: !isSlam,
                color: grabCol,
                vfxStyle: grabVfx,
                rushState
              });
            }
          });
        }
        return true;
      }

      // ---- NEW PRIMITIVE 4: dot_hazard ----
      if (skillType === 'dot_hazard') {
        const duration = Math.max(120, Math.min(300, skill.duration || 210));
        const tickInterval = Math.max(14, Math.min(45, skill.tickInterval || 25));
        const radius = Math.max(55, Math.min(160, skill.radius || 96));
        const slowMult = Math.max(0.4, Math.min(0.95, skill.slowMult || 0.68));
        const hazCol = skill.beamColor || fighter.meta.colors.aura;
        const hazVfx = skill.vfxStyle || 'orb';
        const hazLabel = skill.hazardLabel || skill.name;
        const expectedTicks = Math.max(1, Math.floor(duration / tickInterval));
        const tickDmg = skill.tickDmg
          ? Math.max(6, Math.round(skill.tickDmg * dmgMult))
          : Math.max(10, Math.round(finalDmg / Math.max(2, expectedTicks * 0.65)));

        fighter.actionState = isBishaSlot ? FighterActionState.BISHA_ING : FighterActionState.SKILL_ING;
        fighter.stateTimer = isBishaSlot ? 24 : 18;
        if (isBishaSlot) {
          fighter.invincibleTimer = 18;
          this.triggerSuperFlash(fighter, hazLabel, hazCol, 20);
          sfx.play('bisha');
        } else {
          sfx.play('dash');
        }

        // Cap max 2 hazards per side
        const ownHazards = this.hazards.filter((h) => h.ownerSlot === fighter.slot);
        if (ownHazards.length >= 2) {
          const oldestIdx = this.hazards.findIndex((h) => h.ownerSlot === fighter.slot);
          if (oldestIdx !== -1) this.hazards.splice(oldestIdx, 1);
        }

        const placeX = Math.max(
          60,
          Math.min(
            BVN_CONFIG.WIDTH - 60,
            Math.abs(opponent.x - fighter.x) <= 270 ? opponent.x : fighter.x + fighter.direct * 165
          )
        );
        this.hazards.push({
          owner: fighter,
          ownerSlot: fighter.slot,
          target: opponent,
          x: placeX,
          y: BVN_CONFIG.FLOOR_Y,
          radius,
          life: duration,
          maxLife: duration,
          tickInterval,
          tickCounter: 0,
          tickDmg,
          slowMult,
          vfxStyle: hazVfx,
          color: hazCol,
          label: hazLabel,
          qiGain: Math.max(3, Math.round((skill.qiGain || 18) / Math.max(2, expectedTicks))),
          qiBurn
        });
        this.spawnExplosion(placeX, BVN_CONFIG.FLOOR_Y - 12, hazCol, 18);
        this.spawnVfxBurst(placeX, BVN_CONFIG.FLOOR_Y - 18, fighter.direct, hazVfx, hazCol, 1.1);
        this.spawnFloatingText(placeX, BVN_CONFIG.FLOOR_Y - 52, hazLabel, hazCol);
        return true;
      }

      // ---- NEW PRIMITIVE 5: ghost_followup ----
      if (skillType === 'ghost_followup') {
        const delayFrames = Math.max(8, Math.min(24, skill.delayFrames || 12));
        const rangeX = skill.rangeX || 135;
        const rangeY = skill.rangeY || 110;
        const ghostCol = skill.beamColor || fighter.meta.colors.aura;
        const ghostVfx = skill.vfxStyle || 'slash_arc';
        const dashToTarget = skill.dashToTarget !== false;

        fighter.actionState = isBishaSlot ? FighterActionState.BISHA_ING : FighterActionState.SKILL_ING;
        fighter.stateTimer = isBishaSlot ? 24 : 18;
        if (isBishaSlot) {
          fighter.invincibleTimer = 20;
          this.triggerSuperFlash(fighter, skill.name, ghostCol, 20);
          sfx.play('bisha');
        } else {
          sfx.play('dash');
        }

        // Optional quick initial poke if already close
        let initialHit = false;
        if (Math.abs(opponent.x - fighter.x) <= 115 && Math.abs(opponent.y - fighter.y) <= 95) {
          initialHit = this.performMeleeHitbox(fighter, opponent, {
            rangeX: 115,
            rangeY: 95,
            dmg: Math.max(12, Math.round(finalDmg * 0.35)),
            hitx: fighter.direct * 3.5,
            hity: -2,
            hurtType: 0,
            hitstop: 2,
            qiGain: Math.round((skill.qiGain || 20) * 0.35),
            qiBurn: 0,
            isBreakDef: false,
            color: ghostCol,
            vfxStyle: ghostVfx
          });
        }

        const ghostX = dashToTarget
          ? Math.max(55, Math.min(BVN_CONFIG.WIDTH - 55, opponent.x - fighter.direct * 52))
          : Math.max(55, Math.min(BVN_CONFIG.WIDTH - 55, fighter.x + fighter.direct * 68));
        const ghostY = dashToTarget ? opponent.y : fighter.y;
        const ghostDir = opponent.x >= ghostX ? 1 : -1;

        const ghost = {
          fighterId: fighter.meta.id,
          meta: fighter.meta,
          slot: fighter.slot,
          x: ghostX,
          y: ghostY,
          direct: ghostDir,
          life: delayFrames + 18,
          maxLife: delayFrames + 18,
          color: ghostCol,
          vfxStyle: ghostVfx,
          actionState: FighterActionState.SKILL_ING,
          activeSkillKey: skillKey,
          awakened: fighter.awakened,
          _isGhost: true
        };
        this.ghosts.push(ghost);
        this.spawnExplosion(ghostX, ghostY - 48, ghostCol, 12);

        const ghostDmg = initialHit ? Math.max(18, Math.round(finalDmg * 0.78)) : finalDmg;
        this.scheduledEffects.push({
          delay: delayFrames,
          ownerSlot: fighter.slot,
          fn: () => {
            if (this.roundPhase !== 'FIGHT' || fighter.actionState === FighterActionState.DEAD) return;
            if (dashToTarget) {
              ghost.x = Math.max(55, Math.min(BVN_CONFIG.WIDTH - 55, opponent.x - ghost.direct * 46));
              ghost.y = opponent.y;
            }
            ghost.direct = opponent.x >= ghost.x ? 1 : -1;
            sfx.play('heavy');
            this.spawnExplosion(ghost.x + ghost.direct * 24, ghost.y - 48, ghostCol, 18);
            this.spawnVfxBurst(ghost.x + ghost.direct * 34, ghost.y - 48, ghost.direct, ghostVfx, ghostCol, 1.25);
            this.performMeleeHitbox(fighter, opponent, {
              originX: ghost.x,
              originY: ghost.y,
              originDirect: ghost.direct,
              rangeX,
              rangeY,
              dmg: ghostDmg,
              hitx: ghost.direct * 10,
              hity: -8.5,
              hurtType: 1,
              qiGain: Math.round((skill.qiGain || 20) * (initialHit ? 0.65 : 1)),
              qiBurn,
              isBreakDef: !!skill.isBreakDef || isBishaSlot,
              isBisha: isBishaSlot,
              color: ghostCol,
              vfxStyle: ghostVfx,
              bothSides: true
            });
          }
        });
        return true;
      }

      if (skillType === 'multi_projectile') {
        fighter.actionState = isBishaSlot ? FighterActionState.BISHA_ING : FighterActionState.SKILL_ING;
        fighter.stateTimer = isBishaSlot ? 28 : 20;
        if (isBishaSlot) {
          fighter.invincibleTimer = 22;
          this.triggerSuperFlash(fighter, skill.name, skill.beamColor || fighter.meta.colors.aura, 22);
          sfx.play('bisha');
        } else {
          sfx.play('dash');
        }
        const count = Math.max(3, Math.min(5, skill.projCount || 4));
        const baseSpeed = skill.projSpeed || 14;
        const spread = skill.projSpread !== undefined ? skill.projSpread : 0.2;
        const projCol = skill.beamColor || fighter.meta.colors.aura;
        const perShotDmg = Math.max(12, Math.round(finalDmg / Math.max(1, count * 0.65)));
        const mid = (count - 1) / 2;
        for (let idx = 0; idx < count; idx++) {
          const offsetIdx = idx - mid;
          const angle = offsetIdx * spread;
          const speedScale = 1 + Math.abs(offsetIdx) * 0.06;
          this.projectiles.push({
            owner: fighter,
            target: opponent,
            x: fighter.x + fighter.direct * (38 + idx * 10),
            y: fighter.y - 48 + offsetIdx * 10,
            vx: fighter.direct * Math.cos(angle) * baseSpeed * speedScale,
            vy: Math.sin(angle) * baseSpeed * 0.72,
            radius: skill.projSize || 18,
            dmg: perShotDmg,
            qiGain: Math.max(4, Math.round((skill.qiGain || 20) / count)),
            qiBurn: Math.round(qiBurn / count),
            isBreakDef: !!skill.isBreakDef,
            isBisha: isBishaSlot,
            color: projCol,
            coreColor: '#ffffff',
            vfxStyle,
            name: skill.name,
            life: 78
          });
        }
        return true;
      }

      if (skillType === 'beam_laser' || skillType === 'super_beam') {
        const isSuperBeam = skillType === 'super_beam' || isSuperSlot;
        const beamDur = skill.beamDuration || (isSuperBeam ? 36 : (isBishaSlot ? 26 : 22));
        const beamWidth = skill.beamWidth || (isSuperBeam ? 66 : (isBishaSlot ? 44 : 32));
        const beamColor = skill.beamColor || (isSuperBeam ? fighter.meta.colors.awakenAura : fighter.meta.colors.aura);

        if (isSuperBeam) {
          fighter.actionState = FighterActionState.BISHA_SUPER_ING;
          fighter.stateTimer = Math.max(46, beamDur + 12);
          fighter.invincibleTimer = Math.max(46, beamDur + 12);
          this.triggerSuperFlash(fighter, `SIÊU TUYỆT KỸ: ${skill.name}`, beamColor, 34);
          sfx.play('super');
          this.shakeFrames = 26;
        } else if (isBishaSlot) {
          fighter.actionState = FighterActionState.BISHA_ING;
          fighter.stateTimer = Math.max(30, beamDur + 6);
          fighter.invincibleTimer = Math.max(24, beamDur);
          this.triggerSuperFlash(fighter, skill.name, beamColor, 22);
          sfx.play('bisha');
          this.shakeFrames = Math.max(this.shakeFrames, 14);
        } else {
          fighter.actionState = FighterActionState.SKILL_ING;
          fighter.stateTimer = Math.max(22, beamDur);
          sfx.play('bisha');
          this.shakeFrames = Math.max(this.shakeFrames, 8);
        }

        const tickInterval = isSuperBeam ? 5 : 4;
        const expectedTicks = Math.max(1, Math.floor(beamDur / tickInterval));
        this.beams.push({
          owner: fighter,
          target: opponent,
          x: fighter.x + fighter.direct * 32,
          y: fighter.y - 50,
          direct: fighter.direct,
          width: beamWidth,
          color: beamColor,
          coreColor: '#ffffff',
          life: beamDur,
          maxLife: beamDur,
          dmgPerTick: Math.max(14, Math.round(finalDmg / expectedTicks)),
          tickInterval,
          tickCounter: 0,
          qiGain: isSuperBeam || isBishaSlot ? 0 : Math.max(4, Math.round((skill.qiGain || 24) / expectedTicks)),
          qiBurn: Math.round(qiBurn / expectedTicks),
          isBreakDef: true,
          isBisha: isBishaSlot,
          isSuper: isSuperBeam,
          countered: false,
          name: skill.name
        });
        this.spawnExplosion(fighter.x + fighter.direct * 34, fighter.y - 50, beamColor, isSuperBeam ? 30 : 16);
        return true;
      }

      if (skillType === 'time_freeze') {
        const freezeFrames = skill.freezeFrames || 80;
        const freezeCol = skill.domainColor || '#a855f7';
        const freezeLabel = skill.freezeLabel || 'TOKI WO TOMARE!';
        fighter.actionState = isBishaSlot ? FighterActionState.BISHA_ING : FighterActionState.SKILL_ING;
        fighter.stateTimer = 24;
        fighter.invincibleTimer = 22;
        if (isBishaSlot) this.triggerSuperFlash(fighter, freezeLabel, freezeCol, 22);
        sfx.play('super');
        this.shakeFrames = Math.max(this.shakeFrames, 12);

        opponent.frozenTimer = Math.max(opponent.frozenTimer || 0, freezeFrames);
        opponent.actionState = FighterActionState.FREEZE;
        opponent.vx = 0;
        opponent.vy = 0;

        this.timeFreezeOverlay = {
          timer: freezeFrames,
          maxTimer: freezeFrames,
          color: freezeCol,
          label: freezeLabel,
          originX: fighter.x,
          originY: fighter.y - 48,
          casterSlot: fighter.slot
        };

        this.spawnExplosion(opponent.x, opponent.y - 48, freezeCol, 28);
        this.spawnFloatingText(opponent.x, opponent.y - 118, freezeLabel, '#fde047');
        if (finalDmg > 0) {
          this.performMeleeHitbox(fighter, opponent, {
            rangeX: 460,
            rangeY: 240,
            dmg: finalDmg,
            hitx: fighter.direct * 2,
            hity: 0,
            hurtType: 0,
            qiGain: skill.qiGain || 24,
            qiBurn,
            isBreakDef: true,
            isBisha: isBishaSlot,
            color: freezeCol,
            bothSides: true,
            keepFrozen: true
          });
        }
        return true;
      }

      if (skillType === 'buff_install') {
        const buffFrames = skill.buffFrames || 280;
        const buffCol = skill.beamColor || fighter.meta.colors.awakenAura;
        const healAmt = skill.healAmount || 45;
        fighter.actionState = FighterActionState.SKILL_ING;
        fighter.stateTimer = 18;
        fighter.invincibleTimer = 16;
        fighter.buffTimer = buffFrames;
        fighter.buffSpeedMult = skill.speedBuff || 1.3;
        fighter.buffDmgMult = skill.dmgBuff || 1.25;
        fighter.buffColor = buffCol;
        if (healAmt > 0) fighter.hp = Math.min(fighter.hpMax, fighter.hp + healAmt);
        if (skill.qiGain) fighter.addQi(skill.qiGain);
        sfx.play('bisha');
        this.spawnExplosion(fighter.x, fighter.y - 48, buffCol, 28);
        this.spawnFloatingText(
          fighter.x,
          fighter.y - 115,
          healAmt > 0 ? `+${healAmt} HP · CƯỜNG HÓA!` : 'CƯỜNG HÓA TỐC/SÁT THƯƠNG!',
          '#4ade80'
        );
        if (finalDmg > 0) {
          this.performMeleeHitbox(fighter, opponent, {
            rangeX: 125,
            rangeY: 110,
            dmg: finalDmg,
            hitx: fighter.direct * 9,
            hity: -7,
            hurtType: 1,
            qiGain: 0,
            qiBurn,
            isBreakDef: true,
            color: buffCol,
            vfxStyle,
            bothSides: true
          });
        }
        return true;
      }

      if (skillType === 'domain_super') {
        const domainFrames = Math.max(90, skill.domainFrames || 95);
        const domainCol = skill.domainColor || fighter.meta.colors.awakenAura;
        const accentCol = skill.beamColor || '#fde047';
        const domainLabel = skill.domainLabel || skill.name;

        fighter.actionState = FighterActionState.BISHA_SUPER_ING;
        fighter.stateTimer = 54;
        fighter.invincibleTimer = 54;

        this.domainOverlay = {
          timer: domainFrames,
          maxTimer: domainFrames,
          color: domainCol,
          accentColor: accentCol,
          label: domainLabel,
          casterName: fighter.meta.name
        };

        this.triggerSuperFlash(fighter, `LÃNH ĐỊA SIÊU TUYỆT KỸ: ${domainLabel}`, domainCol, 38);
        sfx.play('super');
        this.shakeFrames = 32;

        this.spawnExplosion(opponent.x, opponent.y - 50, domainCol, 32);
        this.spawnExplosion(opponent.x, opponent.y - 50, accentCol, 28);
        this.spawnExplosion(BVN_CONFIG.WIDTH / 2, BVN_CONFIG.FLOOR_Y - 120, domainCol, 24);
        this.spawnVfxBurst(opponent.x, opponent.y - 50, fighter.direct, vfxStyle, accentCol, 1.8);
        this.spawnFloatingText(BVN_CONFIG.WIDTH / 2, 165, domainLabel, accentCol);

        this.performMeleeHitbox(fighter, opponent, {
          rangeX: 780,
          rangeY: 360,
          dmg: finalDmg,
          hitx: fighter.direct * 16,
          hity: -16,
          hurtType: 1,
          qiGain: 0,
          qiBurn,
          isBreakDef: true,
          isSuper: true,
          color: accentCol,
          vfxStyle,
          bothSides: true
        });
        return true;
      }

      // Standard BVN Easy-Cast mechanics (with optional fighter.meta.meleeProfile)
      const mp = (fighter.meta.meleeProfile && fighter.meta.meleeProfile[skillKey]) || null;

      if (skillKey === 'j') {
        fighter.actionState = FighterActionState.ATTACK_ING;
        fighter.stateTimer = (mp && mp.stateTimer) || 14;
        fighter.comboStep = (fighter.comboStep % 4) + 1;
        fighter.comboTimer = 35;
        fighter.vx = fighter.direct * ((mp && mp.vx !== undefined) ? mp.vx : 4.5);
        if (mp && mp.vy !== undefined) fighter.vy = mp.vy;
        sfx.play('hit');

        const isFinisher = fighter.comboStep === 4;
        const mRangeX = (mp && mp.rangeX) || 94;
        const mRangeY = (mp && mp.rangeY) || 76;
        const mColor = (mp && mp.color) || skill.beamColor || fighter.meta.colors.aura;
        const mVfx = (mp && mp.vfxStyle) || vfxStyle;
        const mQiBurn = (mp && mp.qiBurn) || qiBurn;
        const mTotalDmg = isFinisher ? finalDmg * 1.4 : finalDmg;
        const mHits = (mp && mp.hits && mp.hits > 1) ? Math.min(5, mp.hits) : 1;

        this.spawnVfxBurst(fighter.x + fighter.direct * 46, fighter.y - 48, fighter.direct, mVfx, mColor, isFinisher ? 1.1 : 0.78);
        if (mHits > 1) {
          const mInt = (mp && mp.hitInterval) || 4;
          const rushState = { defenderQiGranted: false };
          const subDmg = Math.max(6, Math.round(mTotalDmg / mHits));
          const doSwing = (idx) => {
            if (this.roundPhase !== 'FIGHT' || fighter.actionState === FighterActionState.DEAD) return;
            const last = idx === mHits - 1;
            if (idx > 0) this.spawnVfxBurst(fighter.x + fighter.direct * 48, fighter.y - 48, fighter.direct, mVfx, mColor, 0.85);
            this.performMeleeHitbox(fighter, opponent, {
              rangeX: mRangeX,
              rangeY: mRangeY,
              dmg: subDmg,
              hitx: fighter.direct * (last && isFinisher ? 9 : 3.2),
              hity: last && isFinisher ? -8.5 : -1.8,
              hurtType: last && isFinisher ? 1 : 0,
              hitstop: last ? (isFinisher ? 4 : 2) : 1,
              qiGain: last ? (skill.qiGain || 15) : 0,
              qiBurn: last ? mQiBurn : 0,
              isBreakDef: false,
              color: mColor,
              vfxStyle: mVfx,
              rushState
            });
          };
          doSwing(0);
          for (let h = 1; h < mHits; h++) {
            this.scheduledEffects.push({ delay: h * mInt, ownerSlot: fighter.slot, fn: () => doSwing(h) });
          }
        } else {
          this.performMeleeHitbox(fighter, opponent, {
            rangeX: mRangeX,
            rangeY: mRangeY,
            dmg: mTotalDmg,
            hitx: fighter.direct * (isFinisher ? 9 : 3.5),
            hity: isFinisher ? -8.5 : -2,
            hurtType: isFinisher ? 1 : 0,
            qiGain: skill.qiGain || 15,
            qiBurn: mQiBurn,
            isBreakDef: false,
            color: mColor,
            vfxStyle: mVfx
          });
        }
      } else if (skillKey === 'wj') {
        fighter.actionState = FighterActionState.SKILL_ING;
        fighter.stateTimer = (mp && mp.stateTimer) || 22;
        fighter.vy = (mp && mp.vy !== undefined) ? mp.vy : -12.5;
        fighter.vx = fighter.direct * ((mp && mp.vx !== undefined) ? mp.vx : 5.5);
        sfx.play('heavy');
        const mRangeX = (mp && mp.rangeX) || 112;
        const mRangeY = (mp && mp.rangeY) || 115;
        const mColor = (mp && mp.color) || skill.beamColor || fighter.meta.colors.aura;
        const mVfx = (mp && mp.vfxStyle) || vfxStyle;
        const mQiBurn = (mp && mp.qiBurn) || qiBurn;
        const mHits = (mp && mp.hits && mp.hits > 1) ? Math.min(5, mp.hits) : 1;

        this.spawnVfxBurst(fighter.x + fighter.direct * 44, fighter.y - 68, fighter.direct, mVfx, mColor, 1.15);
        if (mHits > 1) {
          const mInt = (mp && mp.hitInterval) || 4;
          const rushState = { defenderQiGranted: false };
          const subDmg = Math.max(8, Math.round(finalDmg / mHits));
          const doSwing = (idx) => {
            if (this.roundPhase !== 'FIGHT' || fighter.actionState === FighterActionState.DEAD) return;
            const last = idx === mHits - 1;
            this.performMeleeHitbox(fighter, opponent, {
              rangeX: mRangeX,
              rangeY: mRangeY,
              dmg: subDmg,
              hitx: fighter.direct * (last ? 5 : 2.5),
              hity: last ? -12 : -4,
              hurtType: last ? 1 : 0,
              hitstop: last ? 4 : 1,
              qiGain: last ? (skill.qiGain || 22) : 0,
              qiBurn: last ? mQiBurn : 0,
              isBreakDef: last && !!skill.isBreakDef,
              color: mColor,
              vfxStyle: mVfx,
              rushState
            });
          };
          doSwing(0);
          for (let h = 1; h < mHits; h++) {
            this.scheduledEffects.push({ delay: h * mInt, ownerSlot: fighter.slot, fn: () => doSwing(h) });
          }
        } else {
          this.performMeleeHitbox(fighter, opponent, {
            rangeX: mRangeX,
            rangeY: mRangeY,
            dmg: finalDmg,
            hitx: fighter.direct * 5,
            hity: -12,
            hurtType: 1,
            qiGain: skill.qiGain || 22,
            qiBurn: mQiBurn,
            isBreakDef: !!skill.isBreakDef,
            color: mColor,
            vfxStyle: mVfx
          });
        }
      } else if (skillKey === 'sj') {
        fighter.actionState = FighterActionState.SKILL_ING;
        fighter.stateTimer = (mp && mp.stateTimer) || 22;
        fighter.vx = fighter.direct * ((mp && mp.vx !== undefined) ? mp.vx : 13.5);
        if (mp && mp.vy !== undefined) fighter.vy = mp.vy;
        sfx.play('heavy');
        this.recordAfterimage(fighter);
        const mRangeX = (mp && mp.rangeX) || 138;
        const mRangeY = (mp && mp.rangeY) || 82;
        const mColor = (mp && mp.color) || skill.beamColor || fighter.meta.colors.primary;
        const mVfx = (mp && mp.vfxStyle) || vfxStyle;
        const mQiBurn = (mp && mp.qiBurn) || qiBurn;
        const mHits = (mp && mp.hits && mp.hits > 1) ? Math.min(5, mp.hits) : 1;

        this.spawnVfxBurst(fighter.x + fighter.direct * 56, fighter.y - 44, fighter.direct, mVfx, mColor, 1.2);
        if (mHits > 1) {
          const mInt = (mp && mp.hitInterval) || 4;
          const rushState = { defenderQiGranted: false };
          const subDmg = Math.max(8, Math.round(finalDmg / mHits));
          const doSwing = (idx) => {
            if (this.roundPhase !== 'FIGHT' || fighter.actionState === FighterActionState.DEAD) return;
            const last = idx === mHits - 1;
            this.performMeleeHitbox(fighter, opponent, {
              rangeX: mRangeX,
              rangeY: mRangeY,
              dmg: subDmg,
              hitx: fighter.direct * (last ? 10 : 4),
              hity: last ? -6 : -2,
              hurtType: last ? 1 : 0,
              hitstop: last ? 4 : 1,
              qiGain: last ? (skill.qiGain || 28) : 0,
              qiBurn: last ? mQiBurn : 0,
              isBreakDef: last,
              color: mColor,
              vfxStyle: mVfx,
              rushState
            });
          };
          doSwing(0);
          for (let h = 1; h < mHits; h++) {
            this.scheduledEffects.push({ delay: h * mInt, ownerSlot: fighter.slot, fn: () => doSwing(h) });
          }
        } else {
          this.performMeleeHitbox(fighter, opponent, {
            rangeX: mRangeX,
            rangeY: mRangeY,
            dmg: finalDmg,
            hitx: fighter.direct * 10,
            hity: -6,
            hurtType: 1,
            qiGain: skill.qiGain || 28,
            qiBurn: mQiBurn,
            isBreakDef: true,
            color: mColor,
            vfxStyle: mVfx
          });
        }
      } else if (skillKey === 'u') {
        fighter.actionState = FighterActionState.SKILL_ING;
        fighter.stateTimer = 18;
        sfx.play('dash');
        const projCol = skill.beamColor || fighter.meta.colors.aura;
        this.projectiles.push({
          owner: fighter,
          target: opponent,
          x: fighter.x + fighter.direct * 42,
          y: fighter.y - 48,
          vx: fighter.direct * (skill.projSpeed || 14),
          vy: 0,
          radius: skill.projSize || 24,
          dmg: finalDmg,
          qiGain: skill.qiGain || 20,
          qiBurn,
          isBreakDef: !!skill.isBreakDef,
          isBisha: false,
          color: projCol,
          coreColor: fighter.meta.colors.primary,
          vfxStyle,
          name: skill.name,
          life: 75
        });
      } else if (skillKey === 'wu') {
        fighter.actionState = FighterActionState.SKILL_ING;
        fighter.stateTimer = 24;
        sfx.play('heavy');
        const wuCol = skill.beamColor || fighter.meta.colors.aura;
        if (skill.type === 'target_burst') {
          this.recordAfterimage(fighter);
          fighter.x = Math.max(60, Math.min(BVN_CONFIG.WIDTH - 60, opponent.x - fighter.direct * 55));
          this.spawnExplosion(opponent.x, opponent.y - 45, wuCol, 22);
          this.spawnVfxBurst(opponent.x, opponent.y - 48, fighter.direct, vfxStyle, wuCol, 1.3);
          this.performMeleeHitbox(fighter, opponent, {
            rangeX: 120,
            rangeY: 110,
            dmg: finalDmg,
            hitx: fighter.direct * 8,
            hity: -9,
            hurtType: 1,
            qiGain: skill.qiGain || 28,
            qiBurn,
            isBreakDef: true,
            color: wuCol,
            vfxStyle
          });
        } else {
          this.spawnExplosion(fighter.x + fighter.direct * 95, fighter.y - 45, wuCol, 24);
          this.spawnVfxBurst(fighter.x + fighter.direct * 95, fighter.y - 48, fighter.direct, vfxStyle, wuCol, 1.35);
          this.performMeleeHitbox(fighter, opponent, {
            rangeX: 165,
            rangeY: 120,
            dmg: finalDmg,
            hitx: fighter.direct * 9,
            hity: -9.5,
            hurtType: 1,
            qiGain: skill.qiGain || 28,
            qiBurn,
            isBreakDef: true,
            color: wuCol,
            vfxStyle
          });
        }
      } else if (skillKey === 'su') {
        fighter.actionState = FighterActionState.SKILL_ING;
        fighter.stateTimer = 22;
        fighter.invincibleTimer = 14;
        sfx.play('heavy');
        const suCol = skill.beamColor || fighter.meta.colors.primary;
        this.spawnExplosion(fighter.x, fighter.y - 45, suCol, 24);
        this.spawnVfxBurst(fighter.x, fighter.y - 48, fighter.direct, vfxStyle, suCol, 1.3);
        this.performMeleeHitbox(fighter, opponent, {
          rangeX: 145,
          rangeY: 115,
          dmg: finalDmg,
          hitx: fighter.direct * 11,
          hity: -8,
          hurtType: 1,
          qiGain: skill.qiGain || 25,
          qiBurn,
          isBreakDef: true,
          color: suCol,
          vfxStyle,
          bothSides: true
        });
      } else if (skillKey === 'i') {
        fighter.actionState = FighterActionState.BISHA_ING;
        fighter.stateTimer = 32;
        fighter.invincibleTimer = 25;
        const iCol = skill.beamColor || fighter.meta.colors.aura;
        this.triggerSuperFlash(fighter, skill.name, iCol, 24);
        sfx.play('bisha');
        this.projectiles.push({
          owner: fighter,
          target: opponent,
          x: fighter.x + fighter.direct * 50,
          y: fighter.y - 50,
          vx: fighter.direct * (skill.projSpeed || 16.5),
          vy: 0,
          radius: skill.projSize || 44,
          dmg: finalDmg,
          qiGain: 0,
          qiBurn,
          isBreakDef: true,
          isBisha: true,
          color: iCol,
          coreColor: '#ffffff',
          vfxStyle,
          name: skill.name,
          life: 85
        });
      } else if (skillKey === 'wi') {
        fighter.actionState = FighterActionState.BISHA_ING;
        fighter.stateTimer = 34;
        fighter.invincibleTimer = 28;
        const wiCol = skill.beamColor || fighter.meta.colors.primary;
        this.triggerSuperFlash(fighter, skill.name, wiCol, 24);
        sfx.play('bisha');
        this.recordAfterimage(fighter);
        fighter.x = Math.max(70, Math.min(BVN_CONFIG.WIDTH - 70, opponent.x - fighter.direct * 35));
        fighter.y = BVN_CONFIG.FLOOR_Y - 35;
        this.spawnExplosion(opponent.x, opponent.y - 50, wiCol, 32);
        this.spawnVfxBurst(opponent.x, opponent.y - 50, fighter.direct, vfxStyle, wiCol, 1.5);
        this.performMeleeHitbox(fighter, opponent, {
          rangeX: 175,
          rangeY: 160,
          dmg: finalDmg,
          hitx: fighter.direct * 12,
          hity: -13,
          hurtType: 1,
          qiGain: 0,
          qiBurn,
          isBreakDef: true,
          isBisha: true,
          color: wiCol,
          vfxStyle,
          bothSides: true
        });
      } else if (skillKey === 'si') {
        fighter.actionState = FighterActionState.BISHA_SUPER_ING;
        fighter.stateTimer = 50;
        fighter.invincibleTimer = 50;
        const siCol = skill.beamColor || fighter.meta.colors.awakenAura;
        this.triggerSuperFlash(fighter, `SIÊU TUYỆT KỸ: ${skill.name}`, siCol, 38);
        sfx.play('super');
        this.shakeFrames = 26;
        this.spawnExplosion(opponent.x, opponent.y - 50, siCol, 42);
        this.spawnVfxBurst(opponent.x, opponent.y - 50, fighter.direct, vfxStyle, siCol, 1.9);
        this.performMeleeHitbox(fighter, opponent, {
          rangeX: 680,
          rangeY: 320,
          dmg: finalDmg,
          hitx: fighter.direct * 16,
          hity: -15,
          hurtType: 1,
          qiGain: 0,
          qiBurn,
          isBreakDef: true,
          isSuper: true,
          color: siCol,
          vfxStyle,
          bothSides: true
        });
      }

      return true;
    }

    // Authentic BVN Assist Summon (O / 6)
    triggerAssistOrEscape(fighter, opponent) {
      fighter.fzqi = 0;
      const inHitstun = (
        fighter.actionState === FighterActionState.HURT_ING ||
        fighter.actionState === FighterActionState.HURT_FLYING ||
        fighter.frozenTimer > 0 ||
        fighter.grabbedBy > 0
      );

      if (inHitstun) {
        // Defensive Substitute Escape (Thế Thân Thoát Combo / Thoát Khống Chế)
        if (fighter.grabbedBy > 0) {
          this.scheduledEffects = this.scheduledEffects.filter((e) => e.grabTargetSlot !== fighter.slot);
          if (opponent && opponent.slot === fighter.grabbedBy && opponent.actionState !== FighterActionState.DEAD) {
            opponent.actionState = opponent.isInAir ? FighterActionState.JUMP_ING : FighterActionState.NORMAL;
            opponent.stateTimer = 0;
            opponent.activeSkillKey = null;
          }
          fighter.grabbedBy = 0;
        }
        fighter.frozenTimer = 0;
        fighter.invincibleTimer = 26;
        fighter.actionState = FighterActionState.NORMAL;
        fighter.stateTimer = 0;
        this.recordAfterimage(fighter);
        fighter.x = Math.max(60, Math.min(BVN_CONFIG.WIDTH - 60, opponent.x - opponent.direct * 80));
        fighter.direct = opponent.x >= fighter.x ? 1 : -1;
        fighter.lastCmdLabel = 'O: Thế Thân Thoát Combo!';
        sfx.play('dash');
        this.spawnExplosion(fighter.x, fighter.y - 45, '#38bdf8', 22);
        this.spawnFloatingText(fighter.x, fighter.y - 110, 'THẾ THÂN!', '#38bdf8');
        return;
      }

      // Offensive BVN Assist Summon!
      const assistId = fighter.slot === 1 ? this.p1AssistId : this.p2AssistId;
      const assistMeta = this.getFighterMeta(assistId);
      const dir = opponent.x >= fighter.x ? 1 : -1;
      const spawnX = Math.max(55, Math.min(BVN_CONFIG.WIDTH - 55, fighter.x - dir * 56));
      const cleanAssistName = cleanDisplayName(assistMeta.name);
      fighter.lastCmdLabel = `O: Gọi Viện Trợ [${cleanAssistName}]!`;
      sfx.play('bisha');
      this.spawnExplosion(spawnX, BVN_CONFIG.FLOOR_Y - 48, assistMeta.colors.aura, 22);
      this.spawnFloatingText(spawnX, BVN_CONFIG.FLOOR_Y - 122, `VIỆN TRỢ: ${cleanAssistName}`, '#12D88A');

      this.assistSummons.push({
        slot: fighter.slot,
        fighterId: assistMeta.id,
        meta: assistMeta,
        owner: fighter,
        target: opponent,
        x: spawnX,
        y: BVN_CONFIG.FLOOR_Y,
        direct: dir,
        life: 44,
        fired: false,
        actionState: FighterActionState.SKILL_ING,
        activeSkillKey: 'u'
      });
    }

    triggerSuperFlash(fighter, title, color, frames) {
      this.superFlashFrames = frames;
      this.superFlashTitle = `${cleanDisplayName(fighter.meta.name).toUpperCase()} — ${title}`;
      this.superFlashColor = color;
      this.superFlashFighterId = fighter.meta.id;
      this.superFlashSlot = fighter.slot;
      this.hitstopFrames = 11;
    }

    performMeleeHitbox(attacker, defender, opts) {
      const ox = opts.originX !== undefined ? opts.originX : attacker.x;
      const oy = opts.originY !== undefined ? opts.originY : attacker.y;
      const dir = opts.originDirect !== undefined ? opts.originDirect : attacker.direct;
      const dx = defender.x - ox;
      const dy = Math.abs(defender.y - oy);
      const inFront = opts.bothSides || (dx * dir >= -25);
      if (inFront && Math.abs(dx) <= opts.rangeX && dy <= opts.rangeY) {
        this.applyHit(attacker, defender, opts);
        return true;
      }
      return false;
    }

    applyHit(attacker, defender, opts) {
      if (!defender || defender.actionState === FighterActionState.DEAD) return;
      if (defender.invincibleTimer > 0 && !opts.isHazard && !opts.isCounterStrike) return;
      if (this.roundPhase !== 'FIGHT') return;

      const realAttacker = (attacker && attacker.owner) ? attacker.owner : attacker;

      // True Counter check (triggers on melee, projectiles, and beams; bypassed by dot_hazard)
      if (
        defender.counterTimer > 0 &&
        !opts.isHazard &&
        !opts.isCounterStrike &&
        realAttacker &&
        realAttacker !== defender &&
        realAttacker.actionState !== FighterActionState.DEAD
      ) {
        const spec = defender.counterSpec || {
          mult: 1.45,
          rangeX: 260,
          vfxStyle: 'slash_arc',
          color: defender.meta.colors.aura,
          label: 'PHẢN ĐÒN',
          baseDmg: 75,
          qiGain: 24,
          qiBurn: 0
        };
        defender.counterTimer = 0;
        defender.counterSpec = null;
        defender.invincibleTimer = Math.max(defender.invincibleTimer, 16);
        defender.actionState = FighterActionState.SKILL_ING;
        defender.stateTimer = 18;
        if (opts.sourceBeam) opts.sourceBeam.countered = true;

        const incomingDmg = Math.max(40, opts.dmg || 60);
        const counterDmg = Math.round(Math.max(spec.baseDmg || 0, incomingDmg * (spec.mult || 1.45)));
        defender.direct = realAttacker.x >= defender.x ? 1 : -1;

        this.hitstopFrames = Math.max(this.hitstopFrames, 7);
        this.shakeFrames = Math.max(this.shakeFrames, 12);
        sfx.play('heavy');
        this.spawnExplosion(defender.x, defender.y - 48, spec.color, 24);
        this.spawnFloatingText(defender.x, defender.y - 122, `⚡ ${spec.label}!`, '#fde047');

        const distX = Math.abs(realAttacker.x - defender.x);
        const maxRange = Math.max(220, spec.rangeX || 260);
        if (distX <= maxRange) {
          if (distX > 95) {
            this.recordAfterimage(defender);
            defender.x = Math.max(55, Math.min(BVN_CONFIG.WIDTH - 55, realAttacker.x - defender.direct * 56));
          }
          this.spawnVfxBurst(realAttacker.x, realAttacker.y - 48, defender.direct, spec.vfxStyle, spec.color, 1.4);
          this.applyHit(defender, realAttacker, {
            dmg: counterDmg,
            hitx: defender.direct * 13,
            hity: -10.5,
            hurtType: 1,
            qiGain: spec.qiGain || 24,
            qiBurn: spec.qiBurn || 0,
            isBreakDef: true,
            isCounterStrike: true,
            color: spec.color,
            vfxStyle: spec.vfxStyle
          });
        } else {
          // Full-screen ranged counter reflection (e.g. Full Counter / Uchiha Reflection)
          this.projectiles.push({
            owner: defender,
            target: realAttacker,
            x: defender.x + defender.direct * 46,
            y: defender.y - 48,
            vx: defender.direct * 20,
            vy: 0,
            radius: 30,
            dmg: counterDmg,
            qiGain: spec.qiGain || 24,
            qiBurn: spec.qiBurn || 0,
            isBreakDef: true,
            isBisha: true,
            isCounterStrike: true,
            color: spec.color,
            coreColor: '#ffffff',
            vfxStyle: spec.vfxStyle || 'beast_wave',
            name: spec.label,
            life: 65
          });
        }
        return;
      }

      const isDefending =
        defender.actionState === FighterActionState.DEFENSE_ING &&
        !opts.isBreakDef &&
        !opts.isHazard &&
        !defender.energyOverLoad;

      if (isDefending) {
        const chipDmg = Math.max(1, Math.round(opts.dmg * BVN_CONFIG.DEFENSE_LOSE_HP_RATE));
        defender.hp = Math.max(1, defender.hp - chipDmg);
        defender.useEnergy(14);
        defender.vx = (realAttacker ? realAttacker.direct : 1) * 4;
        this.spawnFloatingText(defender.x, defender.y - 85, `Đỡ! -${chipDmg}`, '#38bdf8');
        this.spawnExplosion(defender.x, defender.y - 45, '#38bdf8', 10);
        return;
      }

      // Combo Proration
      const comboBefore = realAttacker ? Math.max(0, realAttacker.hitComboCount) : 0;
      const scale = Math.max(0.35, 1 - 0.08 * comboBefore);
      const actualDmg = Math.max(1, Math.round((opts.dmg || 1) * scale));

      if (this.mode === GameMode.TRAINING) {
        defender.hp = Math.max(1, defender.hp - actualDmg);
      } else {
        defender.hp = Math.max(0, defender.hp - actualDmg);
      }
      defender.lastHurtFrame = this.frameCounter;

      // Qi Burn on unblocked hit
      if (opts.qiBurn > 0) {
        const drained = Math.min(defender.qi, Math.round(opts.qiBurn));
        if (drained > 0) {
          defender.qi = Math.max(0, defender.qi - drained);
          this.spawnFloatingText(defender.x, defender.y - 118, `-${drained} NỘ!`, '#38bdf8');
        }
      }

      // BVN Combo Counter (HitsUI)
      if (realAttacker) {
        realAttacker.hitComboCount++;
        realAttacker.hitComboDamage += actualDmg;
        realAttacker.hitComboDisplayTimer = 95;
        if (realAttacker.hitComboCount > realAttacker.maxComboCount) {
          realAttacker.maxComboCount = realAttacker.hitComboCount;
        }
        if (realAttacker.slot === 1 && realAttacker.hitComboCount > this.maxComboP1) {
          this.maxComboP1 = realAttacker.hitComboCount;
        } else if (realAttacker.slot === 2 && realAttacker.hitComboCount > this.maxComboP2) {
          this.maxComboP2 = realAttacker.hitComboCount;
        }
        if (opts.qiGain > 0) realAttacker.addQi(opts.qiGain);
      }

      // Defender Qi gain (capped once per multi_hit_rush)
      let grantDefenderQi = !opts.skipDefenderQi;
      if (opts.rushState) {
        if (opts.rushState.defenderQiGranted) {
          grantDefenderQi = false;
        } else {
          opts.rushState.defenderQiGranted = true;
        }
      }
      if (grantDefenderQi) {
        defender.addQi(Math.min(22, Math.round(actualDmg * BVN_CONFIG.QI_ADD_HURT_RATE + 6)));
      }

      // Super Armor check (broken by isBreakDef / grab / bisha / super)
      const breaksArmor = !!(opts.isBreakDef || opts.isGrab || opts.isBisha || opts.isSuper);
      let absorbedByArmor = false;
      let armorShattered = false;
      if (defender.superArmorBudget > 0 && !opts.isHazard) {
        if (breaksArmor) {
          defender.superArmorBudget = 0;
          armorShattered = true;
        } else {
          defender.superArmorBudget--;
          absorbedByArmor = true;
        }
      }

      if (opts.isHazard) {
        // Persistent floor hazard deals DoT without hitstop-locking movement
        this.spawnExplosion(defender.x, defender.y - 26, opts.color || '#f97316', 8);
        this.spawnFloatingText(defender.x, defender.y - 88, `-${actualDmg}`, opts.color || '#fb923c');
      } else if (absorbedByArmor) {
        this.hitstopFrames = Math.max(this.hitstopFrames, 2);
        this.spawnExplosion(defender.x, defender.y - 48, '#facc15', 14);
        this.spawnFloatingText(defender.x, defender.y - 98, `SIÊU GIÁP! -${actualDmg}`, '#facc15');
      } else {
        const atkDir = realAttacker ? realAttacker.direct : 1;
        defender.vx = opts.hitx !== undefined ? opts.hitx : atkDir * 5;
        defender.vy = opts.hity !== undefined ? opts.hity : -4;

        if (opts.keepFrozen && defender.frozenTimer > 0) {
          defender.actionState = FighterActionState.FREEZE;
          defender.vx = 0;
          defender.vy = 0;
          const hs = opts.hitstop !== undefined ? opts.hitstop : 4;
          if (hs > 0) this.hitstopFrames = Math.max(this.hitstopFrames, hs);
        } else if (opts.hurtType === 1 || actualDmg >= 75) {
          defender.actionState = FighterActionState.HURT_FLYING;
          defender.stateTimer = 26;
          const hs = opts.hitstop !== undefined ? opts.hitstop : 5;
          if (hs > 0) this.hitstopFrames = Math.max(this.hitstopFrames, hs);
          this.shakeFrames = Math.max(this.shakeFrames, 8);
        } else {
          defender.actionState = FighterActionState.HURT_ING;
          defender.stateTimer = 14;
          const hs = opts.hitstop !== undefined ? opts.hitstop : 3;
          if (hs > 0) this.hitstopFrames = Math.max(this.hitstopFrames, hs);
        }

        this.spawnExplosion(defender.x, defender.y - 48, opts.color || '#f97316', actualDmg >= 150 ? 28 : 14);
        const dmgLabel = armorShattered
          ? `PHÁ SIÊU GIÁP! -${actualDmg}`
          : (opts.isBreakDef ? `PHÁ GIÁP! -${actualDmg}` : `-${actualDmg}`);
        this.spawnFloatingText(
          defender.x,
          defender.y - 95,
          dmgLabel,
          armorShattered || actualDmg >= 150 ? '#fde047' : '#fb7185'
        );
      }

      if (defender.hp <= 0 && this.mode !== GameMode.TRAINING) {
        defender.actionState = FighterActionState.DEAD;
        defender.grabbedBy = 0;
        defender.frozenTimer = 0;
        this.onRoundEnd(realAttacker ? realAttacker.slot : (defender.slot === 1 ? 2 : 1), 'K.O!');
      }
    }

    onRoundEnd(winnerSlot, bannerLabel) {
      if (this.roundPhase !== 'FIGHT') return;
      this.roundPhase = 'KO_SLOWMO';
      this.roundPhaseTimer = 92;
      this.koBannerText = bannerLabel || 'K.O!';
      this.lastRoundWinner = winnerSlot;
      this.shakeFrames = 18;
      sfx.play('ko');

      if (winnerSlot === 1) this.p1Wins++;
      else if (winnerSlot === 2) this.p2Wins++;
    }

    advanceAfterKo() {
      const winnerSlot = this.lastRoundWinner;
      if (this.matchFormat === '3v3') {
        if (winnerSlot === 1) {
          this.p2TeamIdx++;
          if (this.p2TeamIdx >= this.p2TeamIds.length) {
            this.finishMatch(1);
            return;
          }
          this.roundNumber++;
          this.setupRound({ slot: 1, hp: this.p1.hp, qi: this.p1.qi });
          return;
        } else {
          this.p1TeamIdx++;
          if (this.p1TeamIdx >= this.p1TeamIds.length) {
            this.finishMatch(2);
            return;
          }
          this.roundNumber++;
          this.setupRound({ slot: 2, hp: this.p2.hp, qi: this.p2.qi });
          return;
        }
      } else {
        // 1v1 Best of 3 (first to 2 wins)
        if (this.p1Wins >= 2) {
          this.finishMatch(1);
          return;
        }
        if (this.p2Wins >= 2) {
          this.finishMatch(2);
          return;
        }
        this.roundNumber++;
        this.setupRound(null);
      }
    }

    finishMatch(winnerSlot) {
      if (this.matchOver) return;
      this.matchOver = true;
      this.roundPhase = 'MATCH_OVER';
      const winner = winnerSlot === 1 ? this.p1 : this.p2;
      const pName = winnerSlot === 1 ? this.p1DisplayName : this.p2DisplayName;
      const cleanWinnerName = cleanDisplayName(winner.meta.name);
      this.winnerText = `P${winnerSlot} (${pName} · ${cleanWinnerName}) CHIẾN THẮNG!`;

      const isLocalP2 = this.mode === GameMode.ONLINE_PVP && this.onlineRole === 'guest';
      const eloDelta = (this.mode === GameMode.TRAINING) ? 0 : this.accounts.recordMatchResult(winnerSlot, isLocalP2);

      // Push final snapshot so guest sees Match Over cleanly
      if (this.mode === GameMode.ONLINE_PVP && this.onlineRole === 'host' && window.netplay) {
        window.netplay.sendSnapshot(this.buildSnapshot());
      }

      if (window.bvnUI && typeof window.bvnUI.onMatchFinished === 'function') {
        window.bvnUI.onMatchFinished({
          winnerSlot,
          winnerId: winner.meta.id,
          winnerName: cleanWinnerName,
          winnerPlayerName: pName,
          p1Wins: this.p1Wins,
          p2Wins: this.p2Wins,
          maxComboP1: this.maxComboP1,
          maxComboP2: this.maxComboP2,
          eloDelta,
          mode: this.mode,
          format: this.matchFormat,
          aiDifficulty: this.aiDifficulty
        });
      }
    }

    processPlayerController(fighter, opponent, ctrl) {
      if (this.roundPhase !== 'FIGHT' || fighter.actionState === FighterActionState.DEAD) return;
      if (fighter.frozenTimer > 0) {
        // Allow O escape even while frozen or grabbed!
        if (ctrl.assist && fighter.fzqi >= 100) {
          this.triggerAssistOrEscape(fighter, opponent);
        }
        return;
      }

      if (ctrl.assist && fighter.fzqi >= 100) {
        this.triggerAssistOrEscape(fighter, opponent);
        return;
      }

      if (ctrl.awaken && fighter.canAct() && !fighter.awakened && fighter.qi >= 150) {
        fighter.useQi(150);
        fighter.awakened = true;
        fighter.awakenTimer = 780;
        const awForm = fighter.meta.awakenedForm || null;
        fighter.superArmorBudget = awForm && awForm.superArmorHits
          ? Math.min(3, Math.max(0, awForm.superArmorHits))
          : 0;
        fighter.actionState = FighterActionState.WAN_KAI_ING;
        fighter.stateTimer = 24;
        fighter.invincibleTimer = 28;
        const formName = (awForm && awForm.name) || fighter.meta.awakenName || 'THỨC TỈNH';
        const auraCol = (awForm && (awForm.auraColor || awForm.tailColor)) || fighter.meta.colors.awakenAura;
        fighter.lastCmdLabel = `THỨC TỈNH: ${formName}`;
        this.triggerSuperFlash(fighter, formName, auraCol, 30);
        sfx.play('super');
        this.spawnExplosion(fighter.x, fighter.y - 45, auraCol, 36);
        this.spawnVfxBurst(fighter.x, fighter.y - 48, fighter.direct, 'beast_wave', auraCol, 1.55);
        this.renderSkillDeck();
        return;
      }

      if (!fighter.canAct()) return;

      if (ctrl.bisha) {
        if (ctrl.down && fighter.qi >= 300) {
          this.triggerSkill(fighter, opponent, 'si');
          return;
        } else if (ctrl.up && fighter.qi >= 100) {
          this.triggerSkill(fighter, opponent, 'wi');
          return;
        } else if (fighter.qi >= 100) {
          this.triggerSkill(fighter, opponent, 'i');
          return;
        } else {
          this.spawnFloatingText(fighter.x, fighter.y - 105, 'Chưa đủ 100 Nộ!', '#f87171');
        }
      }

      if (ctrl.skill) {
        if (ctrl.up) this.triggerSkill(fighter, opponent, 'wu');
        else if (ctrl.down) this.triggerSkill(fighter, opponent, 'su');
        else this.triggerSkill(fighter, opponent, 'u');
        return;
      }

      if (ctrl.attack) {
        if (ctrl.up) this.triggerSkill(fighter, opponent, 'wj');
        else if (ctrl.down) this.triggerSkill(fighter, opponent, 'sj');
        else this.triggerSkill(fighter, opponent, 'j');
        return;
      }

      if (ctrl.dash) {
        if ((ctrl.down || ctrl.up) && fighter.qi >= 60 && !fighter.energyOverLoad && fighter.energy >= 60) {
          fighter.useQi(60);
          fighter.useEnergy(60);
          this.recordAfterimage(fighter);
          fighter.x = Math.max(50, Math.min(BVN_CONFIG.WIDTH - 50, opponent.x + opponent.direct * 55));
          fighter.direct = opponent.x >= fighter.x ? 1 : -1;
          fighter.invincibleTimer = 18;
          fighter.lastCmdLabel = 'S+L: U Bộ Dịch Chuyển Sau Lưng!';
          sfx.play('dash');
          return;
        } else if (fighter.useEnergy(25)) {
          this.recordAfterimage(fighter);
          fighter.actionState = FighterActionState.DASH_ING;
          fighter.stateTimer = 10;
          fighter.vx = fighter.direct * 16;
          fighter.invincibleTimer = 10;
          fighter.lastCmdLabel = 'L: Thuấn Bộ (Shunpo Dash)';
          sfx.play('dash');
          return;
        }
      }

      if (ctrl.jump && fighter.jumpTimes > 0) {
        fighter.jumpTimes--;
        fighter.vy = -fighter.meta.jumpPower;
        fighter.actionState = FighterActionState.JUMP_ING;
        sfx.play('dash');
      }

      if (ctrl.down && !fighter.isInAir && !fighter.energyOverLoad) {
        fighter.actionState = FighterActionState.DEFENSE_ING;
        fighter.vx *= 0.5;
        return;
      } else if (fighter.actionState === FighterActionState.DEFENSE_ING) {
        fighter.actionState = FighterActionState.NORMAL;
      }

      const awForm = fighter.awakened && fighter.meta.awakenedForm ? fighter.meta.awakenedForm : null;
      const awSpeedMult = fighter.awakened ? ((awForm && awForm.speedMult) || 1.15) : 1.0;
      const speedMult = awSpeedMult * (fighter.buffTimer > 0 ? fighter.buffSpeedMult : 1.0) * (fighter.hazardSlowMult || 1.0);
      if (ctrl.left && !ctrl.right) {
        fighter.vx = -fighter.meta.speed * speedMult;
        fighter.direct = -1;
      } else if (ctrl.right && !ctrl.left) {
        fighter.vx = fighter.meta.speed * speedMult;
        fighter.direct = 1;
      } else {
        fighter.vx *= 0.72;
      }
    }

    generateAIInput(ai, target) {
      const ctrl = {
        up: false, down: false, left: false, right: false,
        attack: false, jump: false, dash: false, skill: false,
        bisha: false, assist: false, awaken: false
      };

      if (!ai || !target || ai.actionState === FighterActionState.DEAD || target.actionState === FighterActionState.DEAD) {
        return ctrl;
      }

      const profile = getAiProfile(this.aiDifficulty);
      if (!this.aiState) this.aiState = this.createInitialAIState();
      const st = this.aiState;

      // Decrement all tactical cooldowns & timers once per 60FPS frame
      if (st.thinkTimer > 0) st.thinkTimer--;
      if (st.pauseTimer > 0) st.pauseTimer--;
      if (st.moveIntentTimer > 0) st.moveIntentTimer--;
      if (st.guardHoldTimer > 0) st.guardHoldTimer--;
      if (st.guardCooldown > 0) st.guardCooldown--;
      if (st.comboFollowupTimer > 0) st.comboFollowupTimer--;
      if (st.attackCooldown > 0) st.attackCooldown--;
      if (st.skillCooldown > 0) st.skillCooldown--;
      if (st.dashCooldown > 0) st.dashCooldown--;
      if (st.jumpCooldown > 0) st.jumpCooldown--;
      if (st.counterCooldown > 0) st.counterCooldown--;
      if (st.bishaCooldown > 0) st.bishaCooldown--;
      if (st.superCooldown > 0) st.superCooldown--;
      if (st.assistCooldown > 0) st.assistCooldown--;
      if (st.awakenCooldown > 0) st.awakenCooldown--;
      if (st.subCooldown > 0) st.subCooldown--;

      const dx = target.x - ai.x;
      const absDx = Math.abs(dx);
      const towardsDir = dx >= 0 ? 1 : -1;

      const applySkillKeyToCtrl = (key) => {
        if (key === 'j') { ctrl.attack = true; }
        else if (key === 'wj') { ctrl.up = true; ctrl.attack = true; }
        else if (key === 'sj') { ctrl.down = true; ctrl.attack = true; }
        else if (key === 'u') { ctrl.skill = true; }
        else if (key === 'wu') { ctrl.up = true; ctrl.skill = true; }
        else if (key === 'su') { ctrl.down = true; ctrl.skill = true; }
        else if (key === 'i') { ctrl.bisha = true; }
        else if (key === 'wi') { ctrl.up = true; ctrl.bisha = true; }
        else if (key === 'si') { ctrl.down = true; ctrl.bisha = true; }
      };

      const isSkillReady = (key) => {
        const sk = this.getActiveSkill(ai, key);
        if (!sk) return false;
        if (ai.cooldowns[key] && ai.cooldowns[key] > 0) return false;
        if (sk.qiCost && ai.qi < sk.qiCost) return false;
        return true;
      };

      const applyMoveIntent = (dir) => {
        if (dir < 0) ctrl.left = true;
        else if (dir > 0) ctrl.right = true;
      };

      // ==================== A. HITSTUN / SUBSTITUTE ESCAPE (ONCE PER COMBO) ====================
      const inHitstun = (
        ai.actionState === FighterActionState.HURT_ING ||
        ai.actionState === FighterActionState.HURT_FLYING ||
        ai.frozenTimer > 0 ||
        ai.grabbedBy > 0
      );
      if (inHitstun) {
        st.hitstunFrames++;
        st.comboChainLeft = 0;
        st.guardHoldTimer = 0;
        if (
          ai.fzqi >= 100 &&
          st.subCooldown <= 0 &&
          !st.subCheckedThisCombo &&
          st.hitstunFrames >= profile.subMinHitstunFrames
        ) {
          st.subCheckedThisCombo = true;
          if (Math.random() < profile.subEscapeProb) {
            st.subCooldown = profile.subCooldownFrames;
            st.pauseTimer = 0;
            ctrl.assist = true;
            return ctrl;
          }
        }
        return ctrl;
      } else if (st.hitstunFrames > 0) {
        st.hitstunFrames = 0;
        st.subCheckedThisCombo = false;
      }

      // Track end of own attack/skill to inject natural recovery breathing room
      const isCurrentlyActing = (
        ai.actionState === FighterActionState.ATTACK_ING ||
        ai.actionState === FighterActionState.SKILL_ING ||
        ai.actionState === FighterActionState.BISHA_ING ||
        ai.actionState === FighterActionState.BISHA_SUPER_ING ||
        ai.actionState === FighterActionState.WAN_KAI_ING
      );
      if (isCurrentlyActing) {
        st.wasActing = true;
        return ctrl;
      }
      if (st.wasActing) {
        st.wasActing = false;
        if (st.comboChainLeft <= 0 && Math.random() < profile.postActionPauseProb) {
          st.pauseTimer = Math.max(st.pauseTimer, randIntRange(profile.pauseMinFrames, profile.pauseMaxFrames));
        }
      }

      // ==================== B. HUMAN THREAT PERCEPTION (NO FRAME-1 INPUT READING) ====================
      const targetAttackingNear = (
        absDx < 175 && (
          target.actionState === FighterActionState.ATTACK_ING ||
          target.actionState === FighterActionState.SKILL_ING ||
          target.actionState === FighterActionState.BISHA_ING ||
          target.actionState === FighterActionState.BISHA_SUPER_ING
        )
      );
      const targetHeavyThreat = (
        target.actionState === FighterActionState.BISHA_ING ||
        target.actionState === FighterActionState.BISHA_SUPER_ING
      );
      const incomingProj = this.projectiles.find(
        (p) => p.owner !== ai && Math.abs(p.x - ai.x) < 210 && Math.sign(p.vx || 0) === Math.sign(ai.x - p.x)
      );
      const dangerHazard = this.hazards.find(
        (h) => h.ownerSlot !== ai.slot && Math.abs(ai.x - h.x) <= h.radius + 14 && ai.y >= BVN_CONFIG.FLOOR_Y - 26
      );
      const targetGuardingNear = (absDx <= 115 && target.actionState === FighterActionState.DEFENSE_ING);

      st.perceivedAttackFrames = targetAttackingNear ? st.perceivedAttackFrames + 1 : 0;
      st.perceivedProjectileFrames = incomingProj ? st.perceivedProjectileFrames + 1 : 0;
      st.perceivedHazardFrames = dangerHazard ? st.perceivedHazardFrames + 1 : 0;
      st.perceivedGuardFrames = targetGuardingNear ? st.perceivedGuardFrames + 1 : 0;

      const canReactTo = (perceivedFrames) => (
        perceivedFrames >= profile.reactionDelayFrames &&
        ((perceivedFrames - profile.reactionDelayFrames) % profile.reactionCheckInterval === 0)
      );

      // ==================== C. ACTIVE GUARD HOLD ====================
      if (st.guardHoldTimer > 0) {
        if (!ai.isInAir && !ai.energyOverLoad && ai.energy > profile.minGuardEnergy) {
          ctrl.down = true;
          return ctrl;
        }
        st.guardHoldTimer = 0;
      }

      // ==================== D. HAZARD EVASION (AFTER REACTION DELAY) ====================
      if (dangerHazard && canReactTo(st.perceivedHazardFrames)) {
        if (Math.random() < profile.hazardEvadeProb) {
          const awayDir = ai.x < dangerHazard.x ? -1 : 1;
          applyMoveIntent(awayDir);
          if (st.jumpCooldown <= 0 && Math.random() < 0.52) {
            st.jumpCooldown = profile.jumpCooldownFrames;
            ctrl.jump = true;
            return ctrl;
          }
          if (st.dashCooldown <= 0 && !ai.energyOverLoad && ai.energy >= 28) {
            st.dashCooldown = profile.dashCooldownFrames;
            ctrl.dash = true;
            return ctrl;
          }
        }
      }

      // ==================== E. DEFENSIVE REACTIONS (COUNTER / EVADE / GUARD) ====================
      const reactedToAttack = canReactTo(st.perceivedAttackFrames);
      const reactedToProj = canReactTo(st.perceivedProjectileFrames);
      if (reactedToAttack || reactedToProj) {
        // 1) True Counter skill (gated by reaction delay + cooldown + tier prob)
        if (st.counterCooldown <= 0 && Math.random() < profile.counterProb) {
          const counterKeys = ['su', 'wu', 'u', 'sj', 'wj', 'i', 'wi'];
          for (const ck of counterKeys) {
            const sk = this.getActiveSkill(ai, ck);
            if (sk && sk.type === 'true_counter' && isSkillReady(ck)) {
              st.counterCooldown = profile.counterCooldownFrames;
              applySkillKeyToCtrl(ck);
              return ctrl;
            }
          }
        }

        // 2) Evasive Dash / Teleport / Jump (especially vs projectiles or guard-breaking bishas)
        const evadeBoost = (reactedToProj || targetHeavyThreat) ? 1.25 : 1.0;
        if (
          st.dashCooldown <= 0 &&
          !ai.energyOverLoad &&
          ai.energy >= 60 &&
          ai.qi >= 60 &&
          absDx < 180 &&
          Math.random() < profile.teleportBehindProb
        ) {
          st.dashCooldown = profile.dashCooldownFrames + 20;
          ctrl.down = true;
          ctrl.dash = true;
          return ctrl;
        }
        if (
          st.dashCooldown <= 0 &&
          !ai.energyOverLoad &&
          ai.energy >= 30 &&
          Math.random() < Math.min(0.95, profile.evadeDashProb * evadeBoost)
        ) {
          st.dashCooldown = profile.dashCooldownFrames;
          applyMoveIntent(reactedToProj ? towardsDir : -towardsDir);
          ctrl.dash = true;
          return ctrl;
        }
        if (
          st.jumpCooldown <= 0 &&
          ai.jumpTimes > 0 &&
          Math.random() < Math.min(0.95, profile.evadeJumpProb * evadeBoost)
        ) {
          st.jumpCooldown = profile.jumpCooldownFrames;
          applyMoveIntent(reactedToProj ? towardsDir : -towardsDir);
          ctrl.jump = true;
          return ctrl;
        }

        // 3) Guard (imperfect on Easy/Normal, respects energy on Hard/Nightmare)
        if (
          st.guardCooldown <= 0 &&
          !ai.isInAir &&
          !ai.energyOverLoad &&
          ai.energy > profile.minGuardEnergy &&
          Math.random() < profile.blockProb
        ) {
          st.guardHoldTimer = randIntRange(profile.guardHoldMinFrames, profile.guardHoldMaxFrames);
          st.guardCooldown = st.guardHoldTimer + profile.guardCooldownFrames;
          ctrl.down = true;
          return ctrl;
        }

        // 4) Close-range invincible SU reversal (0% on Easy, rare on Normal)
        if (
          reactedToAttack &&
          absDx <= 115 &&
          st.skillCooldown <= 0 &&
          isSkillReady('su') &&
          Math.random() < profile.reversalSuProb
        ) {
          st.skillCooldown = profile.skillCooldownFrames;
          ctrl.down = true;
          ctrl.skill = true;
          return ctrl;
        }
      }

      // ==================== F. COMBO CONTINUATION (WHEN MID-CHAIN) ====================
      if (st.comboChainLeft > 0) {
        if (absDx > 155 || target.invincibleTimer > 0) {
          st.comboChainLeft = 0;
        } else if (st.comboFollowupTimer <= 0) {
          st.comboChainLeft--;
          st.comboFollowupTimer = profile.comboDelayFrames;
          const finishChain = st.comboChainLeft === 0;
          const rCombo = Math.random();
          if (finishChain && ai.qi >= profile.bishaMinQi && st.bishaCooldown <= 0 && rCombo < profile.bishaProb) {
            st.bishaCooldown = profile.bishaCooldownFrames;
            if (isSkillReady('wi') && Math.random() < 0.5) applySkillKeyToCtrl('wi');
            else applySkillKeyToCtrl('i');
            return ctrl;
          }
          if (finishChain && st.skillCooldown <= 0 && rCombo < profile.skillProb) {
            st.skillCooldown = profile.skillCooldownFrames;
            const enders = ['wj', 'sj', 'wu'].filter((k) => isSkillReady(k));
            if (enders.length > 0) {
              applySkillKeyToCtrl(enders[Math.floor(Math.random() * enders.length)]);
              return ctrl;
            }
          }
          if (ai.comboStep >= 2 && rCombo < 0.45 && isSkillReady('wj')) {
            applySkillKeyToCtrl('wj');
          } else {
            ctrl.attack = true;
          }
          return ctrl;
        }
      }

      // ==================== G. BREATHING ROOM / NEUTRAL HESITATION PAUSE ====================
      if (st.pauseTimer > 0) {
        if (st.moveIntentTimer <= 0) {
          st.moveIntentTimer = randIntRange(profile.moveIntentMinFrames, profile.moveIntentMaxFrames);
          const rp = Math.random();
          if (rp < 0.62) st.moveIntent = 0;
          else if (rp < 0.85) st.moveIntent = -towardsDir;
          else st.moveIntent = towardsDir;
        }
        applyMoveIntent(st.moveIntent);
        return ctrl;
      }

      // ==================== H. DECISION CADENCE GATE ====================
      if (st.thinkTimer > 0) {
        if (st.moveIntentTimer <= 0) {
          st.moveIntentTimer = randIntRange(profile.moveIntentMinFrames, profile.moveIntentMaxFrames);
          const rm = Math.random();
          if (absDx > 110) {
            if (rm < profile.approachProb) st.moveIntent = towardsDir;
            else if (rm < profile.approachProb + profile.retreatProb) st.moveIntent = -towardsDir;
            else st.moveIntent = 0;
          } else {
            if (rm < profile.retreatProb) st.moveIntent = -towardsDir;
            else if (rm < profile.retreatProb + 0.35) st.moveIntent = 0;
            else st.moveIntent = towardsDir;
          }
        }
        applyMoveIntent(st.moveIntent);
        return ctrl;
      }

      // Schedule next tactical think window
      st.thinkTimer = randIntRange(profile.thinkMinFrames, profile.thinkMaxFrames);

      // Intentional neutral hesitation pause so players get clean openings
      if (Math.random() < profile.idleHesitationProb) {
        st.pauseTimer = randIntRange(profile.pauseMinFrames, profile.pauseMaxFrames);
        st.moveIntent = Math.random() < 0.6 ? 0 : -towardsDir;
        st.moveIntentTimer = st.pauseTimer;
        applyMoveIntent(st.moveIntent);
        return ctrl;
      }

      const targetInvuln = profile.respectInvincible && target.invincibleTimer > 4;

      // ==================== I. AWAKENING / ASSIST / ULTIMATE DECISIONS ====================
      // 1) Awakening (form-swap or standard) gated by Qi, HP ratio, and cooldown
      const hpRatio = ai.hp / Math.max(1, ai.hpMax);
      if (
        !ai.awakened &&
        st.awakenCooldown <= 0 &&
        ai.qi >= profile.awakenMinQi &&
        hpRatio <= profile.awakenMaxHpRatio &&
        Math.random() < profile.awakenProb
      ) {
        st.awakenCooldown = profile.awakenCooldownFrames;
        ctrl.awaken = true;
        return ctrl;
      }

      // 2) Offensive Assist Summon (O) at mid-range
      if (
        ai.fzqi >= 100 &&
        st.assistCooldown <= 0 &&
        absDx > 135 &&
        absDx < 400 &&
        !targetInvuln &&
        Math.random() < profile.assistProb
      ) {
        st.assistCooldown = profile.assistCooldownFrames;
        ctrl.assist = true;
        return ctrl;
      }

      // 3) Super Ultimate (S+I, 300 Qi)
      if (
        ai.qi >= 300 &&
        st.superCooldown <= 0 &&
        absDx < 380 &&
        !targetInvuln &&
        isSkillReady('si') &&
        Math.random() < profile.superProb
      ) {
        if (!ai.awakened && ai.meta.awakenedForm && st.awakenCooldown <= 0 && hpRatio <= profile.awakenMaxHpRatio) {
          st.awakenCooldown = profile.awakenCooldownFrames;
          ctrl.awaken = true;
          return ctrl;
        }
        st.superCooldown = profile.superCooldownFrames;
        applySkillKeyToCtrl('si');
        return ctrl;
      }

      // 4) Bisha (I / W+I, 100 Qi)
      if (
        ai.qi >= profile.bishaMinQi &&
        st.bishaCooldown <= 0 &&
        absDx < 275 &&
        !targetInvuln &&
        Math.random() < profile.bishaProb
      ) {
        st.bishaCooldown = profile.bishaCooldownFrames;
        if (isSkillReady('wi') && (absDx > 150 || Math.random() < 0.45)) {
          applySkillKeyToCtrl('wi');
        } else if (isSkillReady('i')) {
          applySkillKeyToCtrl('i');
        } else {
          return ctrl;
        }
        return ctrl;
      }

      // ==================== J. RANGE-BASED NEUTRAL & OFFENSE ====================
      // 1) Guard-break attempt if player is holding block nearby (after reaction delay)
      if (
        targetGuardingNear &&
        st.perceivedGuardFrames >= profile.reactionDelayFrames &&
        st.skillCooldown <= 0 &&
        Math.random() < profile.guardBreakProb
      ) {
        const grabKey = ['wu', 'su', 'sj', 'u'].find((k) => {
          const sk = this.getActiveSkill(ai, k);
          return sk && sk.type === 'command_grab' && isSkillReady(k);
        });
        const breakerKey = grabKey || ['sj', 'wu'].find((k) => isSkillReady(k));
        if (breakerKey) {
          st.skillCooldown = profile.skillCooldownFrames;
          applySkillKeyToCtrl(breakerKey);
          return ctrl;
        }
      }

      // 2) Long range (> 215px): approach, occasional projectile, or gap-close dash
      if (absDx > 215) {
        if (Math.random() < profile.approachProb) {
          st.moveIntent = towardsDir;
        } else {
          st.moveIntent = 0;
        }
        st.moveIntentTimer = randIntRange(profile.moveIntentMinFrames, profile.moveIntentMaxFrames);
        applyMoveIntent(st.moveIntent);

        if (st.skillCooldown <= 0 && isSkillReady('u') && !targetInvuln && Math.random() < profile.skillProb * 0.75) {
          st.skillCooldown = profile.skillCooldownFrames;
          applySkillKeyToCtrl('u');
          return ctrl;
        }
        if (
          st.dashCooldown <= 0 &&
          !ai.energyOverLoad &&
          ai.energy >= 35 &&
          Math.random() < profile.approachDashProb
        ) {
          st.dashCooldown = profile.dashCooldownFrames;
          ctrl.left = towardsDir < 0;
          ctrl.right = towardsDir > 0;
          ctrl.dash = true;
          return ctrl;
        }
        return ctrl;
      }

      // 3) Mid range (98px .. 215px): spacing, lunge/skill poke, or occasional whiff on Easy
      if (absDx > 98) {
        st.moveIntent = Math.random() < profile.approachProb ? towardsDir : (Math.random() < 0.5 ? 0 : -towardsDir);
        st.moveIntentTimer = randIntRange(profile.moveIntentMinFrames, profile.moveIntentMaxFrames);
        applyMoveIntent(st.moveIntent);

        // Easy/Normal slight early-swing tendency creates natural whiff-punish openings
        if (
          absDx <= 98 + profile.whiffRangeSlack &&
          st.attackCooldown <= 0 &&
          Math.random() < profile.whiffProb
        ) {
          st.attackCooldown = profile.attackCooldownFrames;
          ctrl.attack = true;
          return ctrl;
        }

        if (st.skillCooldown <= 0 && !targetInvuln && Math.random() < profile.skillProb) {
          const midSkills = ['sj', 'wu', 'u'].filter((k) => isSkillReady(k));
          if (midSkills.length > 0) {
            st.skillCooldown = profile.skillCooldownFrames;
            applySkillKeyToCtrl(midSkills[Math.floor(Math.random() * midSkills.length)]);
            return ctrl;
          }
        }
        if (
          st.dashCooldown <= 0 &&
          !ai.energyOverLoad &&
          ai.energy >= 35 &&
          Math.random() < profile.approachDashProb * 0.7
        ) {
          st.dashCooldown = profile.dashCooldownFrames;
          ctrl.left = towardsDir < 0;
          ctrl.right = towardsDir > 0;
          ctrl.dash = true;
          return ctrl;
        }
        return ctrl;
      }

      // 4) Close range (<= 98px): melee attack, combo plan, or occasional spacing retreat
      if (st.attackCooldown <= 0 && !targetInvuln && Math.random() < profile.attackProb) {
        st.attackCooldown = profile.attackCooldownFrames;
        // Plan follow-up hits based on difficulty combo extension profile
        let planned = 0;
        for (let step = 1; step < profile.maxComboHits; step++) {
          if (Math.random() < profile.comboExtendProb) planned++;
          else break;
        }
        st.comboChainLeft = planned;
        st.comboFollowupTimer = profile.comboDelayFrames;

        const rClose = Math.random();
        if (rClose < 0.68) {
          ctrl.attack = true;
        } else if (rClose < 0.86 && isSkillReady('wj')) {
          applySkillKeyToCtrl('wj');
        } else if (st.skillCooldown <= 0 && isSkillReady('sj')) {
          st.skillCooldown = profile.skillCooldownFrames;
          applySkillKeyToCtrl('sj');
        } else {
          ctrl.attack = true;
        }
        return ctrl;
      }

      // Otherwise hold spacing cleanly
      st.moveIntent = Math.random() < profile.retreatProb ? -towardsDir : 0;
      st.moveIntentTimer = randIntRange(profile.moveIntentMinFrames, profile.moveIntentMaxFrames);
      applyMoveIntent(st.moveIntent);
      return ctrl;
    }

    updateFighterPhysics(f) {
      const awakenEnded = f.updateResources(this.mode === GameMode.TRAINING, this.frameCounter);
      if (awakenEnded) {
        this.renderSkillDeck();
      }

      if (f.frozenTimer > 0) {
        f.frozenTimer--;
        f.vx = 0;
        f.vy = 0;
        if (f.frozenTimer === 0 && f.grabbedBy !== 0) {
          f.grabbedBy = 0;
        }
        if (f.actionState !== FighterActionState.DEAD) {
          f.actionState = f.frozenTimer > 0
            ? FighterActionState.FREEZE
            : (f.isInAir ? FighterActionState.JUMP_ING : FighterActionState.NORMAL);
        }
        return;
      }

      if (f.stateTimer > 0) {
        f.stateTimer--;
        if (f.stateTimer === 0 && f.actionState !== FighterActionState.DEAD) {
          f.actionState = f.isInAir ? FighterActionState.JUMP_ING : FighterActionState.NORMAL;
          f.activeSkillKey = null;
        }
      }

      f.x += f.vx;
      f.y += f.vy;

      if (f.y < BVN_CONFIG.FLOOR_Y) {
        f.vy += BVN_CONFIG.G;
      } else {
        f.y = BVN_CONFIG.FLOOR_Y;
        f.vy = 0;
        f.jumpTimes = 2;
        if (f.actionState === FighterActionState.JUMP_ING || f.actionState === FighterActionState.HURT_FLYING) {
          f.actionState = FighterActionState.NORMAL;
        }
      }

      if (f.x < 42) f.x = 42;
      if (f.x > BVN_CONFIG.WIDTH - 42) f.x = BVN_CONFIG.WIDTH - 42;

      if (f.actionState !== FighterActionState.NORMAL) {
        f.vx *= 0.85;
      }

      for (let i = f.afterimages.length - 1; i >= 0; i--) {
        f.afterimages[i].alpha -= 0.08;
        if (f.afterimages[i].alpha <= 0) f.afterimages.splice(i, 1);
      }
    }

    recordAfterimage(f) {
      f.afterimages.push({ x: f.x, y: f.y, direct: f.direct, color: f.meta.colors.aura, alpha: 0.55 });
    }

    addParticle(pt) {
      if (this.particles.length >= MAX_PARTICLES) {
        // Swap-pop oldest/evicted slot to strictly cap particles <= 160 in O(1)
        const dropIdx = this.frameCounter % this.particles.length;
        this.particles[dropIdx] = pt;
        return;
      }
      this.particles.push(pt);
    }

    spawnVfxBurst(x, y, direct, vfxStyle, color, scale) {
      if (this.vfxEffects.length >= 24) {
        this.vfxEffects.shift();
      }
      this.vfxEffects.push({
        x,
        y,
        direct: direct || 1,
        vfxStyle: vfxStyle || 'orb',
        color: color || '#38bdf8',
        scale: scale || 1.0,
        life: 14,
        maxLife: 14
      });
    }

    spawnExplosion(x, y, color, count) {
      const capped = Math.min(count, 28);
      for (let i = 0; i < capped; i++) {
        const angle = Math.random() * Math.PI * 2;
        const spd = 2 + Math.random() * 9;
        this.addParticle({
          x, y,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd - 1.5,
          radius: 3 + Math.random() * 5.5,
          color,
          alpha: 1
        });
      }
    }

    spawnFloatingText(x, y, text, color) {
      this.floatingTexts.push({ x, y, text, color, alpha: 1, vy: -1.6 });
    }

    // ==================== 9. ONLINE SNAPSHOT SYNC (HOST -> GUEST) ====================
    buildSnapshot() {
      const packF = (f) => ({
        id: f.meta.id,
        x: Math.round(f.x),
        y: Math.round(f.y),
        vx: Number(f.vx.toFixed(1)),
        vy: Number(f.vy.toFixed(1)),
        d: f.direct,
        hp: Math.round(f.hp),
        dhp: Math.round(f.displayHp),
        qi: Math.round(f.qi),
        en: Math.round(f.energy),
        eo: f.energyOverLoad ? 1 : 0,
        fz: Math.round(f.fzqi),
        st: f.actionState,
        sk: f.activeSkillKey || '',
        aw: f.awakened ? 1 : 0,
        at: Math.round(f.awakenTimer || 0),
        bf: f.buffTimer > 0 ? 1 : 0,
        fr: f.frozenTimer > 0 ? 1 : 0,
        gb: f.grabbedBy || 0,
        ct: Math.round(f.counterTimer || 0),
        sa: f.superArmorBudget || 0,
        cc: f.hitComboCount,
        cd: f.hitComboDamage,
        cdt: f.hitComboDisplayTimer,
        cmd: f.lastCmdLabel
      });

      return {
        f: this.frameCounter,
        rt: this.roundTime,
        rn: this.roundNumber,
        rp: this.roundPhase,
        rpt: this.roundPhaseTimer,
        ko: this.koBannerText,
        w1: this.p1Wins,
        w2: this.p2Wins,
        t1: this.p1TeamIdx,
        t2: this.p2TeamIdx,
        mo: this.matchOver ? 1 : 0,
        lw: this.lastRoundWinner,
        sf: this.superFlashFrames,
        sft: this.superFlashTitle,
        sfc: this.superFlashColor,
        sff: this.superFlashFighterId,
        sfs: this.superFlashSlot,
        mc1: this.maxComboP1,
        mc2: this.maxComboP2,
        p1: packF(this.p1),
        p2: packF(this.p2),
        pr: this.projectiles.map((p) => [
          Math.round(p.x), Math.round(p.y), Math.round(p.vx), Math.round(p.radius),
          p.color, p.coreColor, p.isBisha ? 1 : 0,
          VFX_STYLE_TO_ID[p.vfxStyle] || 0, Math.round(p.vy || 0)
        ]),
        bm: this.beams.map((b) => [Math.round(b.x), Math.round(b.y), b.direct, Math.round(b.width), b.color, b.life, b.maxLife, b.isSuper ? 1 : 0]),
        as: this.assistSummons.map((a) => [a.fighterId, Math.round(a.x), Math.round(a.y), a.direct, a.life]),
        hz: this.hazards.map((h) => [
          Math.round(h.x), Math.round(h.y), Math.round(h.radius), h.color,
          VFX_STYLE_TO_ID[h.vfxStyle] || 0, h.life, h.maxLife, h.ownerSlot, h.label || ''
        ]),
        gh: this.ghosts.map((g) => [
          g.fighterId, Math.round(g.x), Math.round(g.y), g.direct,
          g.life, g.maxLife, g.color, VFX_STYLE_TO_ID[g.vfxStyle] || 0,
          g.activeSkillKey || '', g.awakened ? 1 : 0
        ]),
        tf: this.timeFreezeOverlay ? [this.timeFreezeOverlay.timer, this.timeFreezeOverlay.maxTimer, this.timeFreezeOverlay.color, this.timeFreezeOverlay.label, Math.round(this.timeFreezeOverlay.originX), Math.round(this.timeFreezeOverlay.originY)] : null,
        dm: this.domainOverlay ? [this.domainOverlay.timer, this.domainOverlay.maxTimer, this.domainOverlay.color, this.domainOverlay.accentColor, this.domainOverlay.label] : null
      };
    }

    applyOnlineSnapshot(s) {
      if (!s || !this.p1 || !this.p2) return;
      this.frameCounter = s.f;
      this.roundTime = s.rt;
      this.roundNumber = s.rn;
      this.roundPhase = s.rp;
      this.roundPhaseTimer = s.rpt;
      this.koBannerText = s.ko;
      this.p1Wins = s.w1;
      this.p2Wins = s.w2;
      this.maxComboP1 = s.mc1 || 0;
      this.maxComboP2 = s.mc2 || 0;

      // Handle team switch if round transitioned in 3v3
      let deckDirty = false;
      if (s.t1 !== this.p1TeamIdx || s.p1.id !== this.p1.meta.id) {
        this.p1TeamIdx = s.t1;
        this.p1Id = s.p1.id;
        this.p1 = new FighterEntity(1, this.getFighterMeta(s.p1.id), s.p1.x, s.p1.d);
        deckDirty = true;
        if (window.mugenRegistry) window.mugenRegistry.ensureFightersLoaded(this.p1Id, this.p2Id);
      }
      if (s.t2 !== this.p2TeamIdx || s.p2.id !== this.p2.meta.id) {
        this.p2TeamIdx = s.t2;
        this.p2Id = s.p2.id;
        this.p2 = new FighterEntity(2, this.getFighterMeta(s.p2.id), s.p2.x, s.p2.d);
        deckDirty = true;
        if (window.mugenRegistry) window.mugenRegistry.ensureFightersLoaded(this.p1Id, this.p2Id);
      }

      const prevAw1 = this.p1.awakened;
      const prevAw2 = this.p2.awakened;

      const unpackF = (f, d) => {
        f.x = d.x;
        f.y = d.y;
        f.vx = d.vx;
        f.vy = d.vy;
        f.direct = d.d;
        f.hp = d.hp;
        f.displayHp = d.dhp;
        f.qi = d.qi;
        f.energy = d.en;
        f.energyOverLoad = Boolean(d.eo);
        f.fzqi = d.fz;
        f.actionState = d.st;
        f.activeSkillKey = d.sk || null;
        f.awakened = Boolean(d.aw);
        f.awakenTimer = d.at || 0;
        f.buffTimer = d.bf ? 10 : 0;
        f.frozenTimer = d.fr ? 10 : 0;
        f.grabbedBy = d.gb || 0;
        f.counterTimer = d.ct || 0;
        f.superArmorBudget = d.sa || 0;
        f.hitComboCount = d.cc;
        f.hitComboDamage = d.cd;
        f.hitComboDisplayTimer = d.cdt !== undefined ? d.cdt : 0;
        f.lastCmdLabel = d.cmd;
      };
      unpackF(this.p1, s.p1);
      unpackF(this.p2, s.p2);

      if (deckDirty || this.p1.awakened !== prevAw1 || this.p2.awakened !== prevAw2) {
        this.renderSkillDeck();
      }

      this.superFlashFrames = s.sf || 0;
      this.superFlashTitle = s.sft || '';
      this.superFlashColor = s.sfc || '#38bdf8';
      this.superFlashFighterId = s.sff || null;
      this.superFlashSlot = s.sfs || 1;

      this.projectiles = (s.pr || []).map((a) => ({
        x: a[0], y: a[1], vx: a[2], vy: a[8] || 0, radius: a[3], color: a[4], coreColor: a[5],
        isBisha: Boolean(a[6]), vfxStyle: VFX_ID_TO_STYLE[a[7]] || 'orb'
      }));
      this.beams = (s.bm || []).map((a) => ({
        x: a[0], y: a[1], direct: a[2], width: a[3], color: a[4], life: a[5], maxLife: a[6], isSuper: Boolean(a[7]), coreColor: '#ffffff'
      }));
      this.assistSummons = (s.as || []).map((a) => ({
        fighterId: a[0], meta: this.getFighterMeta(a[0]), x: a[1], y: a[2], direct: a[3], life: a[4],
        actionState: FighterActionState.SKILL_ING, activeSkillKey: 'u'
      }));
      this.hazards = (s.hz || []).map((a) => ({
        x: a[0], y: a[1], radius: a[2], color: a[3],
        vfxStyle: VFX_ID_TO_STYLE[a[4]] || 'orb',
        life: a[5], maxLife: a[6], ownerSlot: a[7], label: a[8] || ''
      }));
      this.ghosts = (s.gh || []).map((a) => ({
        fighterId: a[0], meta: this.getFighterMeta(a[0]), x: a[1], y: a[2], direct: a[3],
        life: a[4], maxLife: a[5], color: a[6], vfxStyle: VFX_ID_TO_STYLE[a[7]] || 'slash_arc',
        actionState: FighterActionState.SKILL_ING, activeSkillKey: a[8] || 'u',
        awakened: Boolean(a[9]), _isGhost: true
      }));

      this.timeFreezeOverlay = s.tf ? {
        timer: s.tf[0], maxTimer: s.tf[1], color: s.tf[2], label: s.tf[3], originX: s.tf[4], originY: s.tf[5]
      } : null;
      this.domainOverlay = s.dm ? {
        timer: s.dm[0], maxTimer: s.dm[1], color: s.dm[2], accentColor: s.dm[3], label: s.dm[4]
      } : null;

      if (s.mo && !this.matchOver) {
        this.finishMatch(s.lw || (this.p1Wins >= this.p2Wins ? 1 : 2));
      }
    }

    // ==================== 10. MAIN 60FPS UPDATE LOOP ====================
    update() {
      if (!this.inBattle || this.paused || !this.p1 || !this.p2) return;

      // Online Guest mode: send 11-bit local controls to Host, render Host snapshots
      if (this.mode === GameMode.ONLINE_PVP && this.onlineRole === 'guest') {
        const ctrl = this.input.getCombinedLocalInput();
        const held = { up: ctrl.up, down: ctrl.down, left: ctrl.left, right: ctrl.right };
        const edges = {
          attack: ctrl.attack, jump: ctrl.jump, dash: ctrl.dash,
          skill: ctrl.skill, bisha: ctrl.bisha, assist: ctrl.assist, awaken: ctrl.awaken
        };
        if (window.netplay) window.netplay.sendGuestInput(held, edges);
        this.updateLiveDeckStatus();
        this.input.clearJustPressed();
        return;
      }

      if (this.superFlashFrames > 0) this.superFlashFrames--;
      if (this.timeFreezeOverlay) {
        this.timeFreezeOverlay.timer--;
        if (this.timeFreezeOverlay.timer <= 0) this.timeFreezeOverlay = null;
      }
      if (this.domainOverlay) {
        this.domainOverlay.timer--;
        if (this.domainOverlay.timer <= 0) this.domainOverlay = null;
      }

      // Round Intro & K.O. Slow-Mo phases
      if (this.roundPhase === 'INTRO') {
        this.frameCounter++;
        this.roundPhaseTimer--;
        if (this.roundPhaseTimer === 24) sfx.play('ui_confirm');
        if (this.roundPhaseTimer <= 0) this.roundPhase = 'FIGHT';
        this.broadcastHostSnapshotIfNeeded();
        this.input.clearJustPressed();
        return;
      }

      if (this.roundPhase === 'KO_SLOWMO') {
        this.roundPhaseTimer--;
        if (this.roundPhaseTimer % 3 === 0) {
          this.updateFighterPhysics(this.p1);
          this.updateFighterPhysics(this.p2);
        }
        this.updateParticlesAndTexts();
        this.broadcastHostSnapshotIfNeeded();
        if (this.roundPhaseTimer <= 0) {
          this.advanceAfterKo();
        }
        this.input.clearJustPressed();
        return;
      }

      if (this.roundPhase === 'MATCH_OVER') {
        this.updateParticlesAndTexts();
        this.input.clearJustPressed();
        return;
      }

      if (this.hitstopFrames > 0) {
        this.hitstopFrames--;
        this.broadcastHostSnapshotIfNeeded();
        this.input.clearJustPressed();
        return;
      }

      this.frameCounter++;
      if (this.mode !== GameMode.TRAINING && this.frameCounter % 60 === 0) {
        if (this.roundTime > 0) {
          this.roundTime--;
          if (this.roundTime === 0) {
            const winSlot = this.p1.hp >= this.p2.hp ? 1 : 2;
            this.onRoundEnd(winSlot, 'TIME OVER!');
          }
        }
      }

      // Compute hazard slow multipliers before movement
      this.p1.hazardSlowMult = 1.0;
      this.p2.hazardSlowMult = 1.0;
      for (const h of this.hazards) {
        if (h.target && Math.abs(h.target.x - h.x) <= h.radius && h.target.y >= BVN_CONFIG.FLOOR_Y - 44) {
          h.target.hazardSlowMult = Math.min(h.target.hazardSlowMult, h.slowMult || 0.7);
        }
      }

      // Gather inputs per mode
      let p1Ctrl = this.input.getPlayerInput(1);
      let p2Ctrl;
      if (this.mode === GameMode.ONLINE_PVP && this.onlineRole === 'host') {
        p1Ctrl = this.input.getCombinedLocalInput();
        p2Ctrl = window.netplay ? window.netplay.consumeRemoteP2Input() : { up: false, down: false, left: false, right: false };
      } else if (this.mode === GameMode.LOCAL_2P || this.mode === GameMode.TRAINING) {
        p2Ctrl = this.input.getPlayerInput(2);
      } else {
        p2Ctrl = this.generateAIInput(this.p2, this.p1);
      }

      this.processPlayerController(this.p1, this.p2, p1Ctrl);
      this.processPlayerController(this.p2, this.p1, p2Ctrl);

      this.updateFighterPhysics(this.p1);
      this.updateFighterPhysics(this.p2);

      // Process unified scheduledEffects queue (multi_hit_rush, command_grab ticks, ghost_followup)
      for (let i = this.scheduledEffects.length - 1; i >= 0; i--) {
        const ef = this.scheduledEffects[i];
        ef.delay--;
        if (ef.delay <= 0) {
          this.scheduledEffects.splice(i, 1);
          if (typeof ef.fn === 'function') ef.fn();
        }
      }

      // Update persistent floor hazards (dot_hazard)
      for (let i = this.hazards.length - 1; i >= 0; i--) {
        const h = this.hazards[i];
        h.life--;
        h.tickCounter++;
        if (h.life % 6 === 0) {
          this.addParticle({
            x: h.x + (Math.random() - 0.5) * h.radius * 1.6,
            y: h.y - 4 - Math.random() * 14,
            vx: (Math.random() - 0.5) * 1.4,
            vy: -1.2 - Math.random() * 2.2,
            radius: 2.5 + Math.random() * 3,
            color: h.color,
            alpha: 0.8
          });
        }
        if (h.target && (h.tickCounter === 1 || h.tickCounter % h.tickInterval === 0)) {
          if (Math.abs(h.target.x - h.x) <= h.radius + 14 && h.target.y >= BVN_CONFIG.FLOOR_Y - 56) {
            this.applyHit(h.owner, h.target, {
              dmg: h.tickDmg,
              hitx: 0,
              hity: 0,
              hurtType: 0,
              hitstop: 0,
              qiGain: h.qiGain,
              qiBurn: h.qiBurn || 0,
              isBreakDef: true,
              isHazard: true,
              skipDefenderQi: (h.tickCounter % (h.tickInterval * 2) !== 0),
              color: h.color,
              vfxStyle: h.vfxStyle
            });
          }
        }
        if (h.life <= 0) {
          this.hazards.splice(i, 1);
        }
      }

      // Update ghost visuals (ghost_followup)
      for (let i = this.ghosts.length - 1; i >= 0; i--) {
        this.ghosts[i].life--;
        if (this.ghosts[i].life <= 0) this.ghosts.splice(i, 1);
      }

      // Update Assist Summons
      for (let i = this.assistSummons.length - 1; i >= 0; i--) {
        const a = this.assistSummons[i];
        a.life--;
        if (!a.fired && a.life === 28) {
          a.fired = true;
          const uSkill = a.meta.skills && a.meta.skills.u ? a.meta.skills.u : { name: 'Hộ Viện Xung Kích', dmg: 70 };
          this.projectiles.push({
            owner: a.owner,
            target: a.target,
            x: a.x + a.direct * 36,
            y: a.y - 48,
            vx: a.direct * 15,
            vy: 0,
            radius: 28,
            dmg: Math.max(55, Math.round((uSkill.dmg || 65) * 1.15)),
            qiGain: 15,
            qiBurn: uSkill.qiBurn || 0,
            isBreakDef: true,
            isBisha: false,
            color: uSkill.beamColor || a.meta.colors.aura,
            coreColor: '#ffffff',
            vfxStyle: uSkill.vfxStyle || 'orb',
            name: uSkill.name,
            life: 70
          });
          this.performMeleeHitbox(a, a.target, {
            rangeX: 130,
            rangeY: 100,
            dmg: 55,
            hitx: a.direct * 9,
            hity: -7,
            hurtType: 1,
            qiGain: 12,
            isBreakDef: true,
            color: a.meta.colors.aura
          });
        }
        if (a.life <= 0) {
          this.spawnExplosion(a.x, a.y - 45, '#e2e8f0', 12);
          this.assistSummons.splice(i, 1);
        }
      }

      // Update projectiles
      for (let i = this.projectiles.length - 1; i >= 0; i--) {
        const p = this.projectiles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        if (this.frameCounter % 2 === 0) {
          this.addParticle({
            x: p.x, y: p.y,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            radius: Math.max(2, p.radius * 0.28),
            color: p.color,
            alpha: 0.72
          });
        }

        const dist = Math.hypot(p.x - p.target.x, p.y - (p.target.y - 45));
        if (dist <= p.radius + 32) {
          this.spawnVfxBurst(p.x, p.y, Math.sign(p.vx) || 1, p.vfxStyle || 'orb', p.color, p.isBisha ? 1.35 : 0.95);
          this.applyHit(p.owner, p.target, {
            dmg: p.dmg,
            hitx: Math.sign(p.vx) * (p.isBisha ? 13 : 7),
            hity: p.isBisha ? -11 : -5,
            hurtType: p.isBisha ? 1 : 0,
            qiGain: p.qiGain,
            qiBurn: p.qiBurn || 0,
            isBreakDef: p.isBreakDef,
            isBisha: p.isBisha,
            isCounterStrike: p.isCounterStrike,
            isProjectile: true,
            color: p.color,
            vfxStyle: p.vfxStyle
          });
          this.projectiles.splice(i, 1);
          continue;
        }
        if (p.life <= 0 || p.x < -60 || p.x > BVN_CONFIG.WIDTH + 60 || p.y < -80 || p.y > BVN_CONFIG.HEIGHT + 80) {
          this.projectiles.splice(i, 1);
        }
      }

      // Update beams
      for (let i = this.beams.length - 1; i >= 0; i--) {
        const b = this.beams[i];
        b.x = b.owner.x + b.direct * 32;
        b.y = b.owner.y - 50;
        b.life--;
        b.tickCounter++;

        const span = b.direct > 0 ? (BVN_CONFIG.WIDTH - b.x) : b.x;
        if (span > 20 && this.frameCounter % 2 === 0) {
          for (let k = 0; k < (b.isSuper ? 2 : 1); k++) {
            const distAlong = Math.random() * span;
            this.addParticle({
              x: b.x + b.direct * distAlong,
              y: b.y + (Math.random() - 0.5) * b.width,
              vx: b.direct * (2 + Math.random() * 5),
              vy: (Math.random() - 0.5) * 3.5,
              radius: 2 + Math.random() * 3.5,
              color: Math.random() < 0.35 ? '#ffffff' : b.color,
              alpha: 0.85
            });
          }
        }

        if (!b.countered && (b.tickCounter === 1 || b.tickCounter % b.tickInterval === 0)) {
          const dx = b.target.x - b.x;
          const inPath = dx * b.direct >= -20;
          const dy = Math.abs((b.target.y - 46) - b.y);
          if (inPath && dy <= b.width * 0.65 + 46) {
            const isFinalTick = b.life <= b.tickInterval;
            this.applyHit(b.owner, b.target, {
              dmg: b.dmgPerTick,
              hitx: b.direct * (isFinalTick ? (b.isSuper ? 16 : 11) : 4.5),
              hity: isFinalTick ? (b.isSuper ? -13 : -9) : -2.5,
              hurtType: isFinalTick || b.isSuper ? 1 : 0,
              qiGain: b.qiGain,
              qiBurn: b.qiBurn || 0,
              isBreakDef: b.isBreakDef,
              isBisha: b.isBisha,
              isSuper: b.isSuper,
              sourceBeam: b,
              color: b.color
            });
          }
        }
        if (b.life <= 0) this.beams.splice(i, 1);
      }

      this.updateParticlesAndTexts();
      this.updateLiveDeckStatus();
      this.broadcastHostSnapshotIfNeeded();
      this.input.clearJustPressed();
    }

    broadcastHostSnapshotIfNeeded() {
      if (this.mode === GameMode.ONLINE_PVP && this.onlineRole === 'host' && window.netplay && (this.frameCounter % 2 === 0)) {
        window.netplay.sendSnapshot(this.buildSnapshot());
      }
    }

    updateParticlesAndTexts() {
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const pt = this.particles[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.alpha -= 0.038;
        if (pt.alpha <= 0) {
          const last = this.particles.length - 1;
          if (i !== last) this.particles[i] = this.particles[last];
          this.particles.pop();
        }
      }
      for (let i = this.vfxEffects.length - 1; i >= 0; i--) {
        this.vfxEffects[i].life--;
        if (this.vfxEffects[i].life <= 0) {
          const last = this.vfxEffects.length - 1;
          if (i !== last) this.vfxEffects[i] = this.vfxEffects[last];
          this.vfxEffects.pop();
        }
      }
      for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
        const ft = this.floatingTexts[i];
        ft.y += ft.vy;
        ft.alpha -= 0.022;
        if (ft.alpha <= 0) this.floatingTexts.splice(i, 1);
      }
    }

    // ==================== 11. CANVAS RENDERING (AUTHENTIC BVN ARENA & HUD) ====================
    draw() {
      if (!this.ctx || !this.inBattle || !this.p1 || !this.p2) return;
      const ctx = this.ctx;
      ctx.save();

      if (this.shakeFrames > 0) {
        this.shakeFrames--;
        ctx.translate((Math.random() - 0.5) * 12, (Math.random() - 0.5) * 12);
      }

      // 1. Background Stage (22 Anime Maps)
      this.drawArenaBackground(ctx);

      // 1b. Domain Overlay
      if (this.domainOverlay) {
        const d = this.domainOverlay;
        const progress = d.timer / Math.max(1, d.maxTimer);
        const fadeAlpha = Math.min(1, progress * 3.2, (1 - progress) * 8 + 0.25);
        ctx.save();
        ctx.globalAlpha = 0.42 * fadeAlpha;
        ctx.fillStyle = d.color;
        ctx.fillRect(0, 0, BVN_CONFIG.WIDTH, BVN_CONFIG.HEIGHT);

        const cx = BVN_CONFIG.WIDTH / 2;
        const cy = BVN_CONFIG.FLOOR_Y - 145;
        ctx.globalAlpha = 0.55 * fadeAlpha;
        ctx.strokeStyle = d.accentColor;
        ctx.lineWidth = 2.5;
        for (let r = 0; r < 4; r++) {
          const rad = 75 + r * 68 + Math.sin(this.frameCounter * 0.12 + r) * 14;
          ctx.beginPath();
          ctx.arc(cx, cy, rad, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.globalAlpha = 0.9 * fadeAlpha;
        ctx.font = '900 15px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = d.accentColor;
        ctx.fillText(`✦ ${d.label} ✦`, cx, 112);
        ctx.restore();
      }

      // 1c. Persistent Floor Hazards (dot_hazard)
      for (const h of this.hazards) {
        this.drawHazard(ctx, h);
      }

      // 2. Assist Summons
      for (const a of this.assistSummons) {
        ctx.save();
        ctx.globalAlpha = Math.min(1, a.life / 10);
        if (!window.mugenRegistry || !window.mugenRegistry.drawMugenFighter(ctx, a)) {
          // Fallback badge if assist SFF still loading
          const av = getCachedAvatarImage(a.fighterId, false);
          if (av.loaded) {
            ctx.drawImage(av.img, a.x - 32, a.y - 84, 64, 64);
          }
        }
        ctx.restore();
      }

      // 2b. Ghost / Clone Followups (ghost_followup)
      for (const g of this.ghosts) {
        ctx.save();
        const alpha = Math.min(0.65, (g.life / Math.max(1, g.maxLife)) * 0.78);
        ctx.globalAlpha = alpha;
        if (!window.mugenRegistry || !window.mugenRegistry.drawMugenFighter(ctx, g)) {
          ctx.fillStyle = g.color || '#38bdf8';
          ctx.beginPath();
          ctx.ellipse(g.x, g.y - 46, 20, 44, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.strokeStyle = g.color || '#38bdf8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(g.x, g.y - 4, 24, 6, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // 3. Fighters
      this.drawFighter(ctx, this.p1);
      this.drawFighter(ctx, this.p2);

      // 3b. Transient Melee & Impact VFX Bursts (no per-particle shadowBlur)
      for (const ef of this.vfxEffects) {
        this.drawVfxEffect(ctx, ef);
      }

      // 4. Projectiles (6 distinct vfxStyles)
      for (const p of this.projectiles) {
        this.drawProjectile(ctx, p);
      }

      // 4b. Beams
      for (const b of this.beams) {
        const lifeRatio = Math.max(0.15, b.life / Math.max(1, b.maxLife));
        const pulse = 0.88 + Math.sin(this.frameCounter * 0.85) * 0.16;
        const beamH = b.width * pulse * Math.min(1, lifeRatio * 2.2);
        const startX = b.direct > 0 ? b.x : 0;
        const beamLen = b.direct > 0 ? (BVN_CONFIG.WIDTH - b.x) : b.x;

        ctx.save();
        ctx.shadowColor = b.color;
        ctx.shadowBlur = b.isSuper ? 30 : 18;
        ctx.globalAlpha = 0.42 * lifeRatio;
        ctx.fillStyle = b.color;
        ctx.fillRect(startX, b.y - beamH * 0.85, beamLen, beamH * 1.7);
        ctx.globalAlpha = 0.85 * lifeRatio;
        ctx.fillRect(startX, b.y - beamH * 0.5, beamLen, beamH);
        ctx.globalAlpha = 0.96;
        ctx.fillStyle = b.coreColor || '#ffffff';
        ctx.fillRect(startX, b.y - beamH * 0.24, beamLen, beamH * 0.48);
        ctx.restore();
      }

      // 4c. Time Freeze Overlay
      if (this.timeFreezeOverlay) {
        const tf = this.timeFreezeOverlay;
        const elapsed = tf.maxTimer - tf.timer;
        const expandRadius = Math.min(BVN_CONFIG.WIDTH * 1.1, 45 + elapsed * 36);
        const pulseAlpha = Math.min(1, tf.timer / 20);
        ctx.save();
        ctx.globalAlpha = 0.22 * pulseAlpha;
        ctx.fillStyle = tf.color || '#a855f7';
        ctx.fillRect(0, 0, BVN_CONFIG.WIDTH, BVN_CONFIG.HEIGHT);
        ctx.globalAlpha = 0.8 * pulseAlpha;
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(tf.originX, tf.originY, expandRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.font = '900 20px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fde047';
        ctx.fillText(`⏱ ${tf.label}`, BVN_CONFIG.WIDTH / 2, 134);
        ctx.restore();
      }

      // 5. Particles (capped <= 160, zero per-particle shadowBlur) & Floating Damage
      for (const pt of this.particles) {
        ctx.globalAlpha = Math.max(0, pt.alpha);
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      for (const ft of this.floatingTexts) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, ft.alpha);
        ctx.font = '900 18px "Segoe UI", sans-serif';
        ctx.fillStyle = ft.color;
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.textAlign = 'center';
        ctx.strokeText(ft.text, ft.x, ft.y);
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
      }

      // 6. Shonen Kurogane Arcade Super Cut-in Banner WITH BIG CHARACTER PORTRAIT
      if (this.superFlashFrames > 0) {
        const isP1Flash = this.superFlashSlot === 1;
        const slant = isP1Flash ? -14 : 14;
        ctx.save();
        // Diagonal obsidian band
        ctx.beginPath();
        ctx.moveTo(0, 166 + slant);
        ctx.lineTo(BVN_CONFIG.WIDTH, 166 - slant);
        ctx.lineTo(BVN_CONFIG.WIDTH, 294 - slant);
        ctx.lineTo(0, 294 + slant);
        ctx.closePath();
        ctx.fillStyle = 'rgba(9, 10, 15, 0.9)';
        ctx.fill();

        // Crisp accent top & bottom slash rails
        ctx.strokeStyle = this.superFlashColor;
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(0, 166 + slant);
        ctx.lineTo(BVN_CONFIG.WIDTH, 166 - slant);
        ctx.moveTo(0, 294 + slant);
        ctx.lineTo(BVN_CONFIG.WIDTH, 294 - slant);
        ctx.stroke();

        // Dynamic angled speedlines
        ctx.strokeStyle = this.superFlashColor;
        ctx.globalAlpha = 0.28;
        ctx.lineWidth = 1.6;
        for (let i = 0; i < 8; i++) {
          const ly = 178 + i * 14;
          ctx.beginPath();
          ctx.moveTo(0, ly + slant);
          ctx.lineTo(BVN_CONFIG.WIDTH, ly - slant);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;

        // Big Avatar Portrait Cut-in in beveled accent frame
        if (this.superFlashFighterId) {
          const bigAv = getCachedAvatarImage(this.superFlashFighterId, true);
          if (bigAv.loaded) {
            const px = isP1Flash ? 48 : BVN_CONFIG.WIDTH - 196;
            ctx.save();
            ctx.fillStyle = '#090A0F';
            ctx.strokeStyle = this.superFlashColor;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(px + 12, 138);
            ctx.lineTo(px + 148, 138);
            ctx.lineTo(px + 148, 286);
            ctx.lineTo(px + 136, 298);
            ctx.lineTo(px, 298);
            ctx.lineTo(px, 150);
            ctx.closePath();
            ctx.fill();
            ctx.save();
            ctx.clip();
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(bigAv.img, px + 2, 140, 144, 158);
            ctx.restore();
            ctx.stroke();
            ctx.restore();
          }
        }

        // Dark-stroked Barlow Condensed italic title (zero muddy blur)
        const titleX = BVN_CONFIG.WIDTH / 2 + (isP1Flash ? 66 : -66);
        ctx.font = `italic 900 32px ${FONT_DISPLAY}`;
        ctx.textAlign = 'center';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 7;
        ctx.strokeStyle = '#090A0F';
        ctx.strokeText(this.superFlashTitle, titleX, 240);
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = this.superFlashColor;
        ctx.strokeText(this.superFlashTitle, titleX, 240);
        ctx.fillStyle = '#F5F7FA';
        ctx.fillText(this.superFlashTitle, titleX, 240);
        ctx.restore();
      }

      // 7. Shonen Kurogane Arcade HUD (Slanted HP + Energy + Assist + Beveled Timer + 3-Stock Qi)
      this.drawBvnHud(ctx);

      // 8. Round Intro / K.O. Overlays
      if (this.roundPhase === 'INTRO') {
        const isFight = this.roundPhaseTimer <= 26;
        ctx.save();
        ctx.fillStyle = 'rgba(9, 10, 15, 0.72)';
        ctx.fillRect(0, 188, BVN_CONFIG.WIDTH, 102);
        ctx.fillStyle = isFight ? '#F5C531' : '#00D2FF';
        ctx.fillRect(0, 188, BVN_CONFIG.WIDTH, 3);
        ctx.fillRect(0, 287, BVN_CONFIG.WIDTH, 3);
        ctx.font = isFight ? `italic 900 68px ${FONT_DISPLAY}` : `italic 900 48px ${FONT_DISPLAY}`;
        ctx.textAlign = 'center';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 8;
        ctx.strokeStyle = '#090A0F';
        ctx.fillStyle = isFight ? '#F5C531' : '#F5F7FA';
        const txt = isFight ? 'FIGHT!' : (this.matchFormat === '3v3' ? `TRẬN ${this.roundNumber}` : `ROUND ${this.roundNumber}`);
        ctx.strokeText(txt, BVN_CONFIG.WIDTH / 2, 260);
        ctx.fillText(txt, BVN_CONFIG.WIDTH / 2, 260);
        ctx.restore();
      } else if (this.roundPhase === 'KO_SLOWMO') {
        ctx.save();
        ctx.fillStyle = 'rgba(9, 10, 15, 0.78)';
        ctx.fillRect(0, 178, BVN_CONFIG.WIDTH, 122);
        ctx.fillStyle = '#FF5E2B';
        ctx.fillRect(0, 178, BVN_CONFIG.WIDTH, 3.5);
        ctx.fillRect(0, 296.5, BVN_CONFIG.WIDTH, 3.5);
        ctx.font = `italic 900 76px ${FONT_DISPLAY}`;
        ctx.textAlign = 'center';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 9;
        ctx.strokeStyle = '#090A0F';
        ctx.fillStyle = '#F5C531';
        ctx.strokeText(this.koBannerText, BVN_CONFIG.WIDTH / 2, 264);
        ctx.fillText(this.koBannerText, BVN_CONFIG.WIDTH / 2, 264);
        ctx.restore();
      }

      ctx.restore();
    }

    drawProjectile(ctx, p) {
      const style = p.vfxStyle || 'orb';
      const r = p.radius || 20;
      const angle = Math.atan2(p.vy || 0, p.vx || 1);
      ctx.save();
      ctx.translate(p.x, p.y);

      if (style === 'spiral_orb') {
        const rot = this.frameCounter * 0.42 * (p.vx >= 0 ? 1 : -1);
        ctx.globalAlpha = 0.34;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(0, 0, r * 1.32, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 0.95;
        ctx.rotate(rot);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = Math.max(2, r * 0.14);
        for (let k = 0; k < 4; k++) {
          const a0 = (k * Math.PI) / 2;
          ctx.beginPath();
          ctx.arc(0, 0, r * 0.96, a0, a0 + 1.05);
          ctx.stroke();
        }
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.68, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = p.coreColor || '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.38, 0, Math.PI * 2);
        ctx.fill();
      } else if (style === 'slash_arc') {
        ctx.rotate(angle);
        ctx.globalAlpha = 0.38;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = Math.max(6, r * 0.55);
        ctx.beginPath();
        ctx.arc(-r * 0.35, 0, r * 1.2, -1.05, 1.05);
        ctx.stroke();
        ctx.globalAlpha = 0.95;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = Math.max(3, r * 0.3);
        ctx.beginPath();
        ctx.arc(-r * 0.25, 0, r * 1.12, -1.02, 1.02);
        ctx.stroke();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = Math.max(2, r * 0.14);
        ctx.beginPath();
        ctx.arc(-r * 0.18, 0, r * 1.05, -0.88, 0.88);
        ctx.stroke();
      } else if (style === 'blade_volley') {
        ctx.rotate(angle);
        const len = Math.max(20, r * 1.65);
        const wid = Math.max(5, r * 0.34);
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = p.color;
        ctx.fillRect(-len * 1.35, -wid * 0.45, len * 1.2, wid * 0.9);
        ctx.globalAlpha = 0.98;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(len * 0.85, 0);
        ctx.lineTo(-len * 0.1, -wid);
        ctx.lineTo(-len * 0.75, 0);
        ctx.lineTo(-len * 0.1, wid);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(len * 0.65, 0);
        ctx.lineTo(-len * 0.05, -wid * 0.42);
        ctx.lineTo(-len * 0.45, 0);
        ctx.lineTo(-len * 0.05, wid * 0.42);
        ctx.closePath();
        ctx.fill();
      } else if (style === 'lightning_bolt') {
        ctx.rotate(angle);
        const span = Math.max(26, r * 1.9);
        const jitter = Math.sin(this.frameCounter * 1.9 + p.x * 0.1) * (r * 0.35);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = Math.max(5, r * 0.32);
        ctx.beginPath();
        ctx.moveTo(-span, -jitter * 0.6);
        ctx.lineTo(-span * 0.4, jitter);
        ctx.lineTo(0, -jitter * 0.8);
        ctx.lineTo(span * 0.55, jitter * 0.5);
        ctx.lineTo(span * 0.95, 0);
        ctx.stroke();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = Math.max(2, r * 0.13);
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(span * 0.5, 0, r * 0.32, 0, Math.PI * 2);
        ctx.fill();
      } else if (style === 'beast_wave') {
        ctx.rotate(angle);
        const pulse = 0.9 + Math.sin(this.frameCounter * 0.7) * 0.12;
        ctx.globalAlpha = 0.32;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(-r * 0.3, 0, r * 1.45 * pulse, r * 1.1 * pulse, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 0.92;
        for (let ring = 0; ring < 2; ring++) {
          ctx.strokeStyle = ring === 0 ? p.color : '#fde047';
          ctx.lineWidth = Math.max(3, (r * 0.24) - ring * 1.5);
          ctx.beginPath();
          ctx.arc(-ring * r * 0.45, 0, r * (1.1 - ring * 0.22), -1.15, 1.15);
          ctx.stroke();
        }
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(r * 0.15, 0, r * 0.45, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Default 'orb'
        if (p.isBisha) {
          const grad = ctx.createLinearGradient(-p.vx * 7, 0, 0, 0);
          grad.addColorStop(0, 'transparent');
          grad.addColorStop(1, p.color);
          ctx.fillStyle = grad;
          ctx.fillRect(-p.vx * 7, -r * 0.65, p.vx * 7, r * 1.3);
        }
        ctx.globalAlpha = 0.32;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(0, 0, r * 1.28, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 0.96;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.55, 0, Math.PI * 2);
        ctx.fillStyle = p.coreColor || '#ffffff';
        ctx.fill();
      }
      ctx.restore();
    }

    drawVfxEffect(ctx, ef) {
      const t = 1 - ef.life / Math.max(1, ef.maxLife);
      const alpha = Math.max(0, 1 - t);
      const s = ef.scale * (0.75 + t * 0.65);
      ctx.save();
      ctx.translate(ef.x, ef.y);
      ctx.scale(ef.direct || 1, 1);
      ctx.globalAlpha = alpha;

      if (ef.vfxStyle === 'slash_arc') {
        ctx.strokeStyle = ef.color;
        ctx.lineWidth = 7 * (1 - t * 0.5);
        ctx.beginPath();
        ctx.arc(-14, 0, 46 * s, -1.15, 1.15);
        ctx.stroke();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.8;
        ctx.beginPath();
        ctx.arc(-10, 0, 44 * s, -0.95, 0.95);
        ctx.stroke();
      } else if (ef.vfxStyle === 'spiral_orb') {
        ctx.rotate(t * 5.2);
        ctx.strokeStyle = ef.color;
        ctx.lineWidth = 3.5;
        for (let k = 0; k < 3; k++) {
          const a = (k * Math.PI * 2) / 3;
          ctx.beginPath();
          ctx.arc(0, 0, 32 * s, a, a + 1.3);
          ctx.stroke();
        }
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 18 * s, 0, Math.PI * 2);
        ctx.stroke();
      } else if (ef.vfxStyle === 'blade_volley') {
        ctx.strokeStyle = ef.color;
        ctx.lineWidth = 3;
        for (let k = -2; k <= 2; k++) {
          const a = k * 0.24;
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * 8, Math.sin(a) * 8);
          ctx.lineTo(Math.cos(a) * 48 * s, Math.sin(a) * 48 * s);
          ctx.stroke();
        }
      } else if (ef.vfxStyle === 'lightning_bolt') {
        ctx.strokeStyle = ef.color;
        ctx.lineWidth = 4;
        for (let b = -1; b <= 1; b++) {
          ctx.beginPath();
          ctx.moveTo(-18 * s, b * 12);
          ctx.lineTo(0, b * 18 - 10);
          ctx.lineTo(18 * s, b * 8 + 10);
          ctx.lineTo(42 * s, b * 14);
          ctx.stroke();
        }
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.8;
        ctx.stroke();
      } else if (ef.vfxStyle === 'beast_wave') {
        ctx.strokeStyle = ef.color;
        ctx.lineWidth = 5 * (1 - t * 0.5);
        ctx.beginPath();
        ctx.arc(0, 0, 38 * s, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, 26 * s, -1.2, 1.2);
        ctx.stroke();
      } else {
        ctx.strokeStyle = ef.color;
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(0, 0, 30 * s, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 10 * (1 - t), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    drawHazard(ctx, h) {
      const fade = Math.min(1, h.life / 24);
      const pulse = 0.92 + Math.sin(this.frameCounter * 0.22 + h.x * 0.05) * 0.08;
      ctx.save();
      ctx.globalAlpha = 0.28 * fade;
      ctx.fillStyle = h.color;
      ctx.beginPath();
      ctx.ellipse(h.x, h.y + 2, h.radius * pulse, 16, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = 0.82 * fade;
      ctx.strokeStyle = h.color;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.ellipse(h.x, h.y + 2, h.radius * pulse, 14, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Style-specific animated ground pattern
      const style = h.vfxStyle || 'orb';
      ctx.strokeStyle = '#ffffff';
      ctx.globalAlpha = 0.65 * fade;
      ctx.lineWidth = 1.8;
      if (style === 'slash_arc') {
        for (let k = -2; k <= 2; k++) {
          const sx = h.x + k * (h.radius * 0.34);
          const jitter = Math.sin(this.frameCounter * 0.4 + k) * 6;
          ctx.beginPath();
          ctx.moveTo(sx - 10, h.y - 28 + jitter);
          ctx.lineTo(sx + 10, h.y - 4 + jitter);
          ctx.stroke();
        }
      } else if (style === 'lightning_bolt') {
        ctx.beginPath();
        ctx.moveTo(h.x - h.radius * 0.7, h.y - 4);
        ctx.lineTo(h.x - h.radius * 0.25, h.y - 16);
        ctx.lineTo(h.x + h.radius * 0.2, h.y - 2);
        ctx.lineTo(h.x + h.radius * 0.7, h.y - 14);
        ctx.stroke();
      } else if (style === 'spiral_orb' || style === 'beast_wave') {
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        ctx.ellipse(h.x, h.y + 2, h.radius * 0.62, 8, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      } else {
        for (let k = -1; k <= 1; k++) {
          const fx = h.x + k * (h.radius * 0.45);
          const fh = 12 + Math.sin(this.frameCounter * 0.3 + k * 2) * 6;
          ctx.beginPath();
          ctx.moveTo(fx, h.y);
          ctx.lineTo(fx, h.y - fh);
          ctx.stroke();
        }
      }

      if (h.label) {
        ctx.globalAlpha = 0.85 * fade;
        ctx.font = '800 10px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = h.color;
        ctx.fillText(h.label, h.x, h.y + 22);
      }
      ctx.restore();
    }

    drawArenaBackground(ctx) {
      if (typeof window.renderArenaMap === 'function') {
        try {
          window.renderArenaMap(ctx, this.currentMapId, BVN_CONFIG.WIDTH, BVN_CONFIG.HEIGHT, BVN_CONFIG.FLOOR_Y, this.frameCounter);
          return;
        } catch (_) {}
      }
      ctx.fillStyle = '#090d1e';
      ctx.fillRect(0, 0, BVN_CONFIG.WIDTH, BVN_CONFIG.HEIGHT);
    }

    drawFighterStatusEffects(ctx, f) {
      if (f.buffTimer > 0) {
        const bCol = f.buffColor || f.meta.colors.awakenAura || '#facc15';
        const pulse = 34 + Math.sin(this.frameCounter * 0.25) * 5;
        ctx.save();
        ctx.strokeStyle = bCol;
        ctx.lineWidth = 2.5;
        ctx.setLineDash([7, 5]);
        ctx.beginPath();
        ctx.ellipse(f.x, f.y - 46, pulse, 56, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
      if (f.counterTimer > 0) {
        const pulse = 44 + Math.sin(this.frameCounter * 0.5) * 4;
        ctx.save();
        ctx.strokeStyle = '#F5C531';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(f.x, f.y - 48, pulse, 0, Math.PI * 2);
        ctx.stroke();
        ctx.font = `700 10px ${FONT_UI}`;
        ctx.textAlign = 'center';
        ctx.fillStyle = '#F5C531';
        ctx.strokeStyle = '#090A0F';
        ctx.lineWidth = 3.5;
        ctx.strokeText('PHẢN ĐÒN', f.x, f.y - 108);
        ctx.fillText('PHẢN ĐÒN', f.x, f.y - 108);
        ctx.restore();
      }
      if (f.superArmorBudget > 0) {
        ctx.save();
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(f.x, f.y - 46, 36, 54, 0, 0, Math.PI * 2);
        ctx.stroke();
        for (let i = 0; i < f.superArmorBudget; i++) {
          const px = f.x - ((f.superArmorBudget - 1) * 8) + i * 16;
          ctx.fillStyle = '#facc15';
          ctx.strokeStyle = '#090d16';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(px, f.y - 102, 4.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
        ctx.restore();
      }
      if (f.grabbedBy > 0) {
        ctx.save();
        ctx.strokeStyle = '#f97316';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.ellipse(f.x, f.y - 46, 36, 14, 0.25, 0, Math.PI * 2);
        ctx.ellipse(f.x, f.y - 46, 36, 14, -0.25, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      } else if (f.frozenTimer > 0) {
        ctx.save();
        ctx.strokeStyle = '#fde047';
        ctx.fillStyle = 'rgba(168, 85, 247, 0.24)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(f.x, f.y - 46, 40, 56, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
      if (f.actionState === FighterActionState.DEFENSE_ING) {
        ctx.save();
        ctx.strokeStyle = '#38bdf8';
        ctx.fillStyle = 'rgba(56, 189, 248, 0.16)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(f.x, f.y - 48, 44, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
    }

    drawFighter(ctx, f) {
      for (const ai of f.afterimages) {
        ctx.save();
        ctx.globalAlpha = ai.alpha * 0.45;
        ctx.fillStyle = ai.color;
        ctx.fillRect(ai.x - 18, ai.y - 84, 36, 84);
        ctx.restore();
      }

      if (window.mugenRegistry && window.mugenRegistry.drawMugenFighter(ctx, f)) {
        this.drawFighterStatusEffects(ctx, f);
        return;
      }

      // Shaded Vector fallback only while SFF is still downloading
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.beginPath();
      ctx.ellipse(0, 0, 26, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.scale(f.direct, 1);
      const c = f.meta.colors;
      ctx.fillStyle = c.primary;
      ctx.fillRect(-16, -74, 32, 42);
      ctx.fillStyle = c.secondary;
      ctx.fillRect(-14, -32, 11, 32);
      ctx.fillRect(3, -32, 11, 32);
      ctx.fillStyle = '#fde68a';
      ctx.beginPath();
      ctx.arc(0, -86, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      this.drawFighterStatusEffects(ctx, f);
    }

    drawBvnHud(ctx) {
      // Shonen Kurogane Arcade geometry helpers (zero shadowBlur for locked 60fps)
      const traceChamferBox = (x, y, w, h, cut) => {
        ctx.beginPath();
        ctx.moveTo(x + cut, y);
        ctx.lineTo(x + w, y);
        ctx.lineTo(x + w, y + h - cut);
        ctx.lineTo(x + w - cut, y + h);
        ctx.lineTo(x, y + h);
        ctx.lineTo(x, y + cut);
        ctx.closePath();
      };

      const traceSlantBar = (x, y, w, h, skew) => {
        ctx.beginPath();
        ctx.moveTo(x + skew, y);
        ctx.lineTo(x + w + skew, y);
        ctx.lineTo(x + w, y + h);
        ctx.lineTo(x, y + h);
        ctx.closePath();
      };

      const drawOutlinedText = (text, x, y, fill, align, strokeW) => {
        ctx.textAlign = align;
        ctx.lineJoin = 'round';
        ctx.lineWidth = strokeW || 3.5;
        ctx.strokeStyle = '#090A0F';
        ctx.strokeText(text, x, y);
        ctx.fillStyle = fill;
        ctx.fillText(text, x, y);
      };

      // Helper: Chamfered Arcade Portrait Frame
      const drawFaceFrame = (fighter, x, y, size, borderColor, tagLabel) => {
        ctx.save();
        traceChamferBox(x, y, size, size, size >= 40 ? 8 : 4);
        ctx.fillStyle = '#090A0F';
        ctx.fill();
        ctx.save();
        ctx.clip();
        const av = getCachedAvatarImage(fighter.meta.id, false);
        if (av.loaded) {
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(av.img, x + 2, y + 2, size - 4, size - 4);
        } else {
          ctx.fillStyle = fighter.meta.colors.primary;
          ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
        }
        ctx.restore();
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = size >= 40 ? 2.4 : 1.6;
        ctx.stroke();

        if (tagLabel) {
          ctx.fillStyle = borderColor;
          ctx.fillRect(x + 2, y + size - 14, 18, 12);
          ctx.font = `800 9px ${FONT_UI}`;
          ctx.fillStyle = '#090A0F';
          ctx.textAlign = 'center';
          ctx.fillText(tagLabel, x + 11, y + size - 5);
        }
        ctx.restore();
      };

      // Helper: Slanted Dual-Layer Delayed Damage HP Bar (Shonen Kurogane Arcade)
      const drawSlantHpBar = (x, y, w, h, hpRatio, trailRatio, isP2) => {
        const skew = isP2 ? -9 : 9;
        const clampedHp = Math.max(0, Math.min(1, hpRatio));
        const clampedTrail = Math.max(0, Math.min(1, trailRatio));
        ctx.save();
        traceSlantBar(x, y, w, h, skew);
        ctx.fillStyle = 'rgba(9, 10, 15, 0.92)';
        ctx.fill();

        ctx.save();
        ctx.clip();
        const trailW = (w + Math.abs(skew)) * clampedTrail;
        ctx.fillStyle = '#E53935';
        if (isP2) ctx.fillRect(x + w - trailW, y, trailW + Math.abs(skew), h);
        else ctx.fillRect(x, y, trailW, h);

        const fillW = (w + Math.abs(skew)) * clampedHp;
        const grad = ctx.createLinearGradient(x, y, x + w, y);
        if (clampedHp <= 0.25) {
          grad.addColorStop(0, '#E53935');
          grad.addColorStop(1, '#F5C531');
        } else if (!isP2) {
          grad.addColorStop(0, '#0277BD');
          grad.addColorStop(0.55, '#00D2FF');
          grad.addColorStop(1, '#12D88A');
        } else {
          grad.addColorStop(0, '#F59E0B');
          grad.addColorStop(0.45, '#FF5E2B');
          grad.addColorStop(1, '#C9350C');
        }
        ctx.fillStyle = grad;
        if (isP2) ctx.fillRect(x + w - fillW, y, fillW + Math.abs(skew), h);
        else ctx.fillRect(x, y, fillW, h);

        // Top metallic specular sheen
        ctx.fillStyle = 'rgba(255, 255, 255, 0.24)';
        ctx.fillRect(x - 10, y, w + 20, 4);

        // Subtle tactical quarter dividers
        ctx.fillStyle = 'rgba(9, 10, 15, 0.28)';
        for (let q = 1; q <= 3; q++) {
          ctx.fillRect(x + (w * q) / 4, y, 1.2, h);
        }
        ctx.restore();

        traceSlantBar(x, y, w, h, skew);
        ctx.strokeStyle = 'rgba(245, 247, 250, 0.55)';
        ctx.lineWidth = 1.6;
        ctx.stroke();
        ctx.restore();
      };

      const drawSlantMeter = (x, y, w, h, ratio, color, isP2, skewAmt) => {
        const skew = isP2 ? -(skewAmt || 6) : (skewAmt || 6);
        const clamped = Math.max(0, Math.min(1, ratio));
        ctx.save();
        traceSlantBar(x, y, w, h, skew);
        ctx.fillStyle = 'rgba(9, 10, 15, 0.88)';
        ctx.fill();
        if (clamped > 0) {
          ctx.save();
          ctx.clip();
          const fw = (w + Math.abs(skew)) * clamped;
          ctx.fillStyle = color;
          if (isP2) ctx.fillRect(x + w - fw, y, fw + Math.abs(skew), h);
          else ctx.fillRect(x, y, fw, h);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
          ctx.fillRect(x - 8, y, w + 16, Math.max(2, h * 0.3));
          ctx.restore();
        }
        traceSlantBar(x, y, w, h, skew);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.24)';
        ctx.lineWidth = 1.1;
        ctx.stroke();
        ctx.restore();
      };

      // P1 Portrait + Slanted Bars (Left)
      drawFaceFrame(this.p1, 14, 12, 56, this.p1.awakened ? '#F5C531' : '#00D2FF', 'P1');
      drawSlantHpBar(76, 26, 344, 18, this.p1.hp / this.p1.hpMax, this.p1.displayHp / this.p1.hpMax, false);
      drawSlantMeter(76, 48, 212, 8, this.p1.energy / this.p1.energyMax, this.p1.energyOverLoad ? '#E53935' : '#00D2FF', false, 5);
      // P1 Assist Mini Avatar + Jade/Gold Gauge
      drawFaceFrame({ meta: this.getFighterMeta(this.p1AssistId) }, 296, 46, 22, this.p1.fzqi >= 100 ? '#F5C531' : '#12D88A', null);
      drawSlantMeter(322, 48, 92, 8, this.p1.fzqi / this.p1.fzqiMax, this.p1.fzqi >= 100 ? '#F5C531' : '#12D88A', false, 5);

      // P2 Portrait + Slanted Bars (Right)
      drawFaceFrame(this.p2, BVN_CONFIG.WIDTH - 70, 12, 56, this.p2.awakened ? '#F5C531' : '#FF5E2B', 'P2');
      drawSlantHpBar(BVN_CONFIG.WIDTH - 420, 26, 344, 18, this.p2.hp / this.p2.hpMax, this.p2.displayHp / this.p2.hpMax, true);
      drawSlantMeter(BVN_CONFIG.WIDTH - 288, 48, 212, 8, this.p2.energy / this.p2.energyMax, this.p2.energyOverLoad ? '#E53935' : '#00D2FF', true, 5);
      // P2 Assist Mini Avatar + Jade/Gold Gauge
      drawFaceFrame({ meta: this.getFighterMeta(this.p2AssistId) }, BVN_CONFIG.WIDTH - 318, 46, 22, this.p2.fzqi >= 100 ? '#F5C531' : '#12D88A', null);
      drawSlantMeter(BVN_CONFIG.WIDTH - 414, 48, 92, 8, this.p2.fzqi / this.p2.fzqiMax, this.p2.fzqi >= 100 ? '#F5C531' : '#12D88A', true, 5);

      // Outlined Fighter Names & Numeric HP cleanly ABOVE HP Bars (high contrast on all arenas)
      const p1Clean = cleanDisplayName(this.p1.meta.name).toUpperCase();
      const p2Clean = cleanDisplayName(this.p2.meta.name).toUpperCase();
      ctx.save();
      ctx.font = `italic 800 15px ${FONT_DISPLAY}`;
      drawOutlinedText(p1Clean, 84, 21, '#F5F7FA', 'left', 4);
      drawOutlinedText(p2Clean, BVN_CONFIG.WIDTH - 84, 21, '#F5F7FA', 'right', 4);

      ctx.font = `700 12px ${FONT_UI}`;
      drawOutlinedText(`${Math.ceil(this.p1.hp)}`, 424, 21, this.p1.hp <= this.p1.hpMax * 0.25 ? '#F5C531' : '#00D2FF', 'right', 3.5);
      drawOutlinedText(`${Math.ceil(this.p2.hp)}`, BVN_CONFIG.WIDTH - 424, 21, this.p2.hp <= this.p2.hpMax * 0.25 ? '#F5C531' : '#FF5E2B', 'left', 3.5);
      ctx.restore();

      // Team Reserve Avatars (3v3) OR Chamfered Round Win Pips (1v1)
      if (this.matchFormat === '3v3') {
        const drawTeamMinis = (teamIds, activeIdx, startX, step) => {
          teamIds.forEach((fid, idx) => {
            const mx = startX + idx * step;
            const my = 60;
            const av = getCachedAvatarImage(fid, false);
            ctx.save();
            traceChamferBox(mx, my, 22, 22, 4);
            ctx.fillStyle = '#090A0F';
            ctx.fill();
            if (av.loaded) {
              ctx.save();
              ctx.clip();
              ctx.globalAlpha = idx < activeIdx ? 0.35 : 1;
              ctx.imageSmoothingEnabled = false;
              ctx.drawImage(av.img, mx + 1, my + 1, 20, 20);
              ctx.restore();
            }
            ctx.globalAlpha = 1;
            ctx.strokeStyle = idx === activeIdx ? '#F5C531' : (idx < activeIdx ? '#E53935' : 'rgba(255,255,255,0.32)');
            ctx.lineWidth = idx === activeIdx ? 2 : 1;
            ctx.stroke();
            if (idx < activeIdx) {
              ctx.strokeStyle = '#E53935';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.moveTo(mx + 4, my + 4); ctx.lineTo(mx + 18, my + 18);
              ctx.moveTo(mx + 18, my + 4); ctx.lineTo(mx + 4, my + 18);
              ctx.stroke();
            }
            ctx.restore();
          });
        };
        drawTeamMinis(this.p1TeamIds, this.p1TeamIdx, 76, 26);
        drawTeamMinis(this.p2TeamIds, this.p2TeamIdx, BVN_CONFIG.WIDTH - 98, -26);
      } else {
        const drawRoundDiamonds = (wins, startX, step) => {
          for (let i = 0; i < 2; i++) {
            const cx = startX + i * step;
            const cy = 66;
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(cx, cy - 6);
            ctx.lineTo(cx + 6, cy);
            ctx.lineTo(cx, cy + 6);
            ctx.lineTo(cx - 6, cy);
            ctx.closePath();
            ctx.fillStyle = i < wins ? '#F5C531' : 'rgba(9, 10, 15, 0.88)';
            ctx.fill();
            ctx.strokeStyle = '#F5C531';
            ctx.lineWidth = 1.6;
            ctx.stroke();
            ctx.restore();
          }
        };
        drawRoundDiamonds(this.p1Wins, 84, 18);
        drawRoundDiamonds(this.p2Wins, BVN_CONFIG.WIDTH - 84, -18);
      }

      // Awakening Form & Active Status Badges on HUD
      const drawStatusBadge = (fighter, x, alignRight) => {
        if (!fighter.awakened && fighter.counterTimer <= 0 && fighter.superArmorBudget <= 0) return;
        ctx.save();
        const awForm = fighter.meta && fighter.meta.awakenedForm;
        const badgeCol = (awForm && (awForm.auraColor || awForm.tailColor)) || fighter.meta.colors.awakenAura || '#F5C531';
        const parts = [];
        if (fighter.awakened) {
          parts.push(`★ ${(awForm && awForm.name) || fighter.meta.awakenName || 'THỨC TỈNH'}`);
        }
        if (fighter.superArmorBudget > 0) parts.push(`GIÁP x${fighter.superArmorBudget}`);
        if (fighter.counterTimer > 0) parts.push('PHẢN ĐÒN');
        const label = parts.join(' · ');
        ctx.font = `700 10px ${FONT_UI}`;
        const tw = Math.min(250, ctx.measureText(label).width + 16);
        const bx = alignRight ? x - tw : x;
        const by = this.matchFormat === '3v3' ? 86 : 78;
        traceChamferBox(bx, by, tw, 18, 5);
        ctx.fillStyle = 'rgba(9, 10, 15, 0.9)';
        ctx.fill();
        if (fighter.awakened) {
          ctx.save();
          ctx.clip();
          const awRatio = Math.max(0, Math.min(1, (fighter.awakenTimer || 0) / 780));
          ctx.fillStyle = badgeCol;
          ctx.globalAlpha = 0.28;
          ctx.fillRect(alignRight ? bx + tw * (1 - awRatio) : bx, by, tw * awRatio, 18);
          ctx.restore();
        }
        traceChamferBox(bx, by, tw, 18, 5);
        ctx.strokeStyle = badgeCol;
        ctx.lineWidth = 1.4;
        ctx.stroke();
        ctx.fillStyle = '#F5F7FA';
        ctx.textAlign = alignRight ? 'right' : 'left';
        ctx.fillText(label, alignRight ? x - 8 : x + 8, by + 13);
        ctx.restore();
      };
      drawStatusBadge(this.p1, 14, false);
      drawStatusBadge(this.p2, BVN_CONFIG.WIDTH - 14, true);

      // Beveled Center Arcade Timer Crest
      ctx.save();
      const tx = BVN_CONFIG.WIDTH / 2;
      ctx.beginPath();
      ctx.moveTo(tx - 38, 10);
      ctx.lineTo(tx + 38, 10);
      ctx.lineTo(tx + 44, 22);
      ctx.lineTo(tx + 36, 54);
      ctx.lineTo(tx - 36, 54);
      ctx.lineTo(tx - 44, 22);
      ctx.closePath();
      ctx.fillStyle = 'rgba(9, 10, 15, 0.95)';
      ctx.fill();
      ctx.strokeStyle = '#F5C531';
      ctx.lineWidth = 2.2;
      ctx.stroke();

      ctx.font = `italic 900 31px ${FONT_DISPLAY}`;
      drawOutlinedText(this.mode === GameMode.TRAINING ? '∞' : String(this.roundTime), tx, 44, '#F5C531', 'center', 3);

      // Clean Round Sub-Plate
      const roundLabel = this.matchFormat === '3v3' ? `3v3 · TRẬN ${this.roundNumber}` : `ROUND ${this.roundNumber}`;
      ctx.font = `700 10px ${FONT_UI}`;
      drawOutlinedText(roundLabel, tx, 69, '#F5F7FA', 'center', 3.5);
      ctx.restore();

      // BVN Combo Counter (HitsUI.as — Barlow Condensed italic)
      const drawComboCounter = (fighter, x, align) => {
        if (fighter.hitComboCount < 2 || fighter.hitComboDisplayTimer <= 0) return;
        ctx.save();
        const scale = fighter.hitComboDisplayTimer > 86 ? 1.18 : 1.0;
        ctx.translate(x, 148);
        ctx.scale(scale, scale);
        ctx.font = `italic 900 38px ${FONT_DISPLAY}`;
        drawOutlinedText(`${fighter.hitComboCount} HITS`, 0, 0, fighter.hitComboCount >= 6 ? '#F5C531' : '#00D2FF', align, 6);
        ctx.font = `700 13px ${FONT_UI}`;
        drawOutlinedText(`${fighter.hitComboDamage} DMG`, 0, 18, '#F5F7FA', align, 3.5);
        ctx.restore();
      };
      drawComboCounter(this.p1, 22, 'left');
      drawComboCounter(this.p2, BVN_CONFIG.WIDTH - 22, 'right');

      // Bottom Slanted 3-Stock Qi Bars with Dark-Stroked Compact Labels
      const drawQiStocks = (fighter, x, y, isP2) => {
        const stocks = Math.floor(fighter.qi / 100);
        const partial = (fighter.qi % 100) / 100;
        const fullCol = isP2 ? '#FF5E2B' : '#00D2FF';
        const chargeCol = isP2 ? '#C9350C' : '#0277BD';
        for (let s = 0; s < 3; s++) {
          const bx = isP2 ? x - (s + 1) * 90 : x + s * 90;
          const ratio = s < stocks ? 1 : s === stocks ? partial : 0;
          const col = stocks >= 3 ? '#F5C531' : s < stocks ? fullCol : chargeCol;
          drawSlantMeter(bx, y, 84, 12, ratio, col, isP2, 6);
        }
        ctx.save();
        ctx.font = `700 11px ${FONT_UI}`;
        const labelCol = stocks >= 3 ? '#F5C531' : (!fighter.awakened && fighter.qi >= 150 ? '#F5C531' : '#F5F7FA');
        const qiHint = stocks >= 3
          ? 'MAX · S+I SIÊU TUYỆT KỸ'
          : (!fighter.awakened && fighter.qi >= 150)
          ? `LV.${stocks} · J+K THỨC TỈNH`
          : stocks >= 1
          ? `LV.${stocks} · I / W+I`
          : `LV.0 (${Math.floor(fighter.qi)})`;
        drawOutlinedText(qiHint, isP2 ? x - 2 : x + 4, y - 6, labelCol, isP2 ? 'right' : 'left', 3.5);
        ctx.restore();
      };

      drawQiStocks(this.p1, 18, BVN_CONFIG.HEIGHT - 20, false);
      drawQiStocks(this.p2, BVN_CONFIG.WIDTH - 18, BVN_CONFIG.HEIGHT - 20, true);
    }

    renderSkillDeck() {
      const buildDeck = (fighter, opponent, containerId, isP2) => {
        const el = document.getElementById(containerId);
        if (!el || !fighter) return;
        el.innerHTML = '';
        const keys = ['j', 'wj', 'sj', 'u', 'wu', 'su', 'i', 'wi', 'si'];
        const p1ShortKey = {
          j: 'J', wj: 'W+J', sj: 'S+J',
          u: 'U', wu: 'W+U', su: 'S+U',
          i: 'I', wi: 'W+I', si: 'S+I'
        };
        const p2ShortKey = {
          j: '1', wj: '↑+1', sj: '↓+1',
          u: '4', wu: '↑+4', su: '↓+4',
          i: '5', wi: '↑+5', si: '↓+5'
        };
        keys.forEach((k) => {
          const sk = this.getActiveSkill(fighter, k);
          if (!sk) return;
          const isAwSkill = Boolean(fighter.awakened && fighter.meta.awakenedSkills && fighter.meta.awakenedSkills[k]);
          const cost = sk.qiCost || (k === 'si' ? 300 : (k === 'i' || k === 'wi') ? 100 : 0);
          const classes = ['skill-pill'];
          if (isAwSkill) classes.push('awakened-skill');
          if (cost >= 300 || k === 'si') classes.push('cost-3');
          else if (cost >= 100 || k === 'i' || k === 'wi') classes.push('cost-1');

          const pill = document.createElement('div');
          pill.className = classes.join(' ');
          pill.dataset.skillKey = k;
          const displayCmd = isP2 ? (p2ShortKey[k] || sk.cmd) : (p1ShortKey[k] || sk.cmd);
          pill.innerHTML = `<span class="s-cmd">${displayCmd}</span><span class="s-name" title="${sk.name}">${sk.name}</span>`;
          pill.addEventListener('click', () => {
            if (this.onlineRole !== 'guest') {
              this.triggerSkill(fighter, opponent, k);
            }
          });
          el.appendChild(pill);
        });
      };
      buildDeck(this.p1, this.p2, 'p1SkillPills', false);
      buildDeck(this.p2, this.p1, 'p2SkillPills', true);
    }

    updateLiveDeckStatus() {
      const updatePills = (fighter, containerId) => {
        const el = document.getElementById(containerId);
        if (!el || !fighter) return;
        el.querySelectorAll('.skill-pill').forEach((pill) => {
          const k = pill.dataset.skillKey;
          const sk = this.getActiveSkill(fighter, k);
          const cost = (sk && sk.qiCost) || (k === 'si' ? 300 : (k === 'i' || k === 'wi') ? 100 : 0);
          pill.classList.toggle('bisha-ready', (k === 'i' || k === 'wi' || (cost >= 100 && cost < 300)) && fighter.qi >= Math.max(100, cost));
          pill.classList.toggle('super-ready', (k === 'si' || cost >= 300) && fighter.qi >= Math.max(300, cost));
        });
      };
      updatePills(this.p1, 'p1SkillPills');
      updatePills(this.p2, 'p2SkillPills');
    }

    loop() {
      this.update();
      this.draw();
      requestAnimationFrame(() => this.loop());
    }
  }

  window.BVN_GAME_MODE = GameMode;
  window.BVN_AI_DIFFICULTIES = AI_DIFFICULTIES;
  window.BVN_AI_DIFFICULTY_MAP = AI_DIFFICULTY_MAP;
  window.BVN_AI_PROFILES = AI_DIFFICULTY_PROFILES;
  window.BVN_AI_DEFAULT_DIFFICULTY = AI_DEFAULT_DIFFICULTY;
  window.addEventListener('DOMContentLoaded', () => {
    window.gameApp = new AnimeCrossoverGame();
  });
})();
