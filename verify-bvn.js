// language: JavaScript, file: verify-bvn.js, target: Zero-Dependency E2E Verification (WebSocket 2P Multiplayer + Headless Chrome CDP UI/Avatar/Map/Battle/Awakening/Primitives QA)

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { spawn } = require('child_process');

const ROOT = __dirname;
const PORT = 8096;
const SCREENSHOT_DIR = process.env.BVN_SCREENSHOT_DIR || '';
const CHROME_PATH = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
].find((p) => fs.existsSync(p));

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

function sha256File(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function wsConnect(url) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    const inbox = [];
    const waiters = [];
    ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data);
      for (let i = 0; i < waiters.length; i++) {
        if (waiters[i].pred(msg)) {
          const w = waiters.splice(i, 1)[0];
          clearTimeout(w.timer);
          w.resolve(msg);
          return;
        }
      }
      inbox.push(msg);
    });
    ws.waitFor = (pred, timeoutMs = 4000) => {
      const idx = inbox.findIndex(pred);
      if (idx !== -1) return Promise.resolve(inbox.splice(idx, 1)[0]);
      return new Promise((res, rej) => {
        const timer = setTimeout(() => rej(new Error('WS waitFor timeout')), timeoutMs);
        waiters.push({ pred, resolve: res, timer });
      });
    };
    ws.sendJson = (o) => ws.send(JSON.stringify(o));
    ws.addEventListener('open', () => resolve(ws));
    ws.addEventListener('error', (e) => reject(e));
  });
}

async function testWebSocketMultiplayer() {
  const wsUrl = `ws://127.0.0.1:${PORT}/ws`;
  const c1 = await wsConnect(wsUrl);
  const c2 = await wsConnect(wsUrl);

  c1.sendJson({ type: 'HELLO', profile: { nickname: 'HostNaruto', tag: '#1111', elo: 1250 } });
  c2.sendJson({ type: 'HELLO', profile: { nickname: 'GuestSasuke', tag: '#2222', elo: 1280 } });
  await c1.waitFor((m) => m.type === 'WELCOME');
  await c2.waitFor((m) => m.type === 'WELCOME');

  // 1. Create room
  c1.sendJson({ type: 'CREATE_ROOM', matchFormat: '3v3', profile: { nickname: 'HostNaruto', tag: '#1111', elo: 1250 } });
  const created = await c1.waitFor((m) => m.type === 'ROOM_CREATED');
  if (!created.code || created.matchFormat !== '3v3') throw new Error('ROOM_CREATED invalid');

  // 2. Client 2 sees open room & joins
  const roomsRes = await fetch(`http://127.0.0.1:${PORT}/api/rooms`).then((r) => r.json());
  if (!roomsRes.rooms.some((r) => r.code === created.code)) throw new Error('Room missing from /api/rooms');

  c2.sendJson({ type: 'JOIN_ROOM', code: created.code, profile: { nickname: 'GuestSasuke', tag: '#2222', elo: 1280 } });
  const j2 = await c2.waitFor((m) => m.type === 'ROOM_JOINED');
  const u1 = await c1.waitFor((m) => m.type === 'ROOM_UPDATED' && m.event === 'guest_joined');
  if (j2.slot !== 2 || u1.slot !== 1) throw new Error('Invalid room staging slots');

  // Guest readies up, Host starts match -> ROOM_READY
  c2.sendJson({ type: 'SET_READY', ready: true });
  await c1.waitFor((m) => m.type === 'ROOM_UPDATED' && m.event === 'ready_changed' && m.room?.p2?.ready === true);
  await c2.waitFor((m) => m.type === 'ROOM_UPDATED' && m.event === 'ready_changed' && m.room?.p2?.ready === true);
  c1.sendJson({ type: 'START_MATCH' });
  const r1 = await c1.waitFor((m) => m.type === 'ROOM_READY');
  const r2 = await c2.waitFor((m) => m.type === 'ROOM_READY');
  if (r1.slot !== 1 || r2.slot !== 2) throw new Error('Invalid room slots');

  // 3. Synced Character Select + Start Battle + 11-bit Input + Snapshot + Chat
  c1.sendJson({ type: 'SELECT_STATE', payload: { team: ['naruto_ashura', 'obito', 'hinata'], assist: 'sasuke', ready: true } });
  const selMsg = await c2.waitFor((m) => m.type === 'SELECT_STATE');
  if (!selMsg.payload || selMsg.payload.team.length !== 3) throw new Error('SELECT_STATE relay failed');

  c1.sendJson({ type: 'START_BATTLE', payload: { mapId: 'final_valley', format: '3v3' } });
  const sb = await c2.waitFor((m) => m.type === 'START_BATTLE');
  if (sb.payload.mapId !== 'final_valley') throw new Error('START_BATTLE relay failed');

  c2.sendJson({ type: 'INPUT', h: 0b00001000, e: 0b00010000 });
  const inp = await c1.waitFor((m) => m.type === 'INPUT');
  if (inp.h !== 8 || inp.e !== 16) throw new Error('INPUT relay failed');

  c1.sendJson({ type: 'SNAPSHOT', s: { f: 120, rt: 97, w1: 1, w2: 0, hz: [], gh: [] } });
  const snap = await c2.waitFor((m) => m.type === 'SNAPSHOT');
  if (snap.s.f !== 120) throw new Error('SNAPSHOT relay failed');

  c2.sendJson({ type: 'CHAT', text: 'GG!', sender: 'GuestSasuke' });
  const chat = await c1.waitFor((m) => m.type === 'CHAT');
  if (chat.text !== 'GG!') throw new Error('CHAT relay failed');

  c1.close();
  c2.close();

  // 4. Quick Match pairing test
  const q1 = await wsConnect(wsUrl);
  const q2 = await wsConnect(wsUrl);
  q1.sendJson({ type: 'QUICK_MATCH', matchFormat: '1v1', profile: { nickname: 'QM1', tag: '#1', elo: 1200 } });
  await q1.waitFor((m) => m.type === 'QUICK_QUEUED');
  q2.sendJson({ type: 'QUICK_MATCH', matchFormat: '1v1', profile: { nickname: 'QM2', tag: '#2', elo: 1210 } });
  const qr1 = await q1.waitFor((m) => m.type === 'ROOM_READY');
  const qr2 = await q2.waitFor((m) => m.type === 'ROOM_READY');
  if (qr1.room.code !== qr2.room.code) throw new Error('Quick Match room code mismatch');
  q1.close();
  q2.close();

  console.log('[PASS] WebSocket Multiplayer E2E: Create/Join Room, /api/rooms, Select Sync, Start Battle, 11-bit Input, Snapshot, Chat, Quick Match');
}

async function testHeadlessChromeUI(manifestCount) {
  if (!CHROME_PATH) throw new Error('Chrome/Edge executable not found');
  const tmpProfile = fs.mkdtempSync(path.join(os.tmpdir(), 'bvn-qa-'));
  const dbgPort = 9237;
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    '--disable-gpu',
    '--window-size=1440,900',
    `--remote-debugging-port=${dbgPort}`,
    `--user-data-dir=${tmpProfile}`,
    'about:blank'
  ], { stdio: 'ignore' });

  let targets = null;
  for (let i = 0; i < 30; i++) {
    try {
      targets = await fetch(`http://127.0.0.1:${dbgPort}/json`).then((r) => r.json());
      if (targets && targets.length) break;
    } catch (_) {}
    await sleep(250);
  }
  if (!targets || !targets.length) {
    chrome.kill();
    throw new Error('Chrome CDP failed to start');
  }

  const pageTarget = targets.find((t) => t.type === 'page') || targets[0];
  const cdp = new WebSocket(pageTarget.webSocketDebuggerUrl);
  let nextId = 1;
  const pending = new Map();
  const pageErrors = [];
  const consoleErrors = [];
  const savedScreenshots = [];

  await new Promise((res) => cdp.addEventListener('open', res));
  cdp.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const p = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) p.reject(new Error(msg.error.message));
      else p.resolve(msg.result);
    } else if (msg.method === 'Runtime.exceptionThrown') {
      pageErrors.push(msg.params.exceptionDetails.text + ' ' + (msg.params.exceptionDetails.exception?.description || ''));
    } else if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
      consoleErrors.push(msg.params.args.map((a) => a.value || a.description).join(' '));
    }
  });

  const sendCdp = (method, params = {}) => new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve, reject });
    cdp.send(JSON.stringify({ id, method, params }));
  });

  const evalJs = async (expression) => {
    const r = await sendCdp('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error('Eval exception: ' + JSON.stringify(r.exceptionDetails));
    return r.result ? r.result.value : undefined;
  };

  const captureScreenshot = async (filename) => {
    if (!SCREENSHOT_DIR) return null;
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    const res = await sendCdp('Page.captureScreenshot', { format: 'png' });
    const outPath = path.join(SCREENSHOT_DIR, filename);
    fs.writeFileSync(outPath, Buffer.from(res.data, 'base64'));
    savedScreenshots.push(outPath);
    console.log(`[SCREENSHOT] Saved ${outPath}`);
    return outPath;
  };

  try {
    const checkViewportFit = async (label) => {
      const m1440 = await evalJs(`({
        scrollW: document.documentElement.scrollWidth,
        clientW: document.documentElement.clientWidth,
        scrollH: document.documentElement.scrollHeight,
        clientH: document.documentElement.clientHeight
      })`);
      await sendCdp('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
      await sleep(120);
      const m1280 = await evalJs(`({
        scrollW: document.documentElement.scrollWidth,
        clientW: document.documentElement.clientWidth,
        scrollH: document.documentElement.scrollHeight,
        clientH: document.documentElement.clientHeight
      })`);
      await sendCdp('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
      await sleep(120);
      console.log(`[INFO] Viewport fit (${label}): 1440x900=${JSON.stringify(m1440)} 1280x720=${JSON.stringify(m1280)}`);
      if (m1440.scrollW > m1440.clientW || m1280.scrollW > m1280.clientW) {
        throw new Error(`Horizontal overflow on ${label}: 1440=${JSON.stringify(m1440)} 1280=${JSON.stringify(m1280)}`);
      }
      if (m1440.scrollH > m1440.clientH + 2 || m1280.scrollH > m1280.clientH + 2) {
        throw new Error(`Vertical overflow on ${label}: 1440=${JSON.stringify(m1440)} 1280=${JSON.stringify(m1280)}`);
      }
      return { m1440, m1280 };
    };

    await sendCdp('Page.enable');
    await sendCdp('Runtime.enable');
    await sendCdp('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });

    await sendCdp('Page.navigate', { url: `http://127.0.0.1:${PORT}/` });
    await sleep(1800);

    // 1. Check Menu screen, WS connected, dynamic roster count >= 63 & matches manifest, clean copy
    const menuCheck = await evalJs(`({
      activeScreen: document.querySelector('.bvn-screen.active')?.id,
      wsConnected: Boolean(window.netplay && window.netplay.connected),
      rosterCount: window.FIGHTER_ROSTER.length,
      mapCount: window.GAME_MAPS.length,
      menuRosterText: document.getElementById('menuRosterCount')?.textContent?.trim() || '',
      menuMapText: document.getElementById('menuMapCount')?.textContent?.trim() || '',
      hasJunkText: /\\[M\\.U\\.G\\.E\\.N\\]|\\[SFF Action|node server\\.js/i.test(document.body.innerText),
      heroImgsLoaded: Array.from(document.querySelectorAll('#menuHeroStrip img')).every(i => i.complete && i.naturalWidth > 0)
    })`);
    console.log('[INFO] Menu check:', JSON.stringify(menuCheck));
    if (
      menuCheck.activeScreen !== 'screenMenu' ||
      !menuCheck.wsConnected ||
      menuCheck.rosterCount < 63 ||
      menuCheck.rosterCount !== manifestCount ||
      menuCheck.mapCount < 22 ||
      menuCheck.menuRosterText !== String(menuCheck.rosterCount) ||
      menuCheck.menuMapText !== String(menuCheck.mapCount) ||
      menuCheck.hasJunkText ||
      !menuCheck.heroImgsLoaded
    ) {
      throw new Error(`Menu check failed (expected rosterCount=${manifestCount} >= 63): ` + JSON.stringify(menuCheck));
    }
    await checkViewportFit('screenMenu');
    await captureScreenshot('ui_01_menu.png');

    // 1B. Check Online Lobby screen (clean copy, zero overflow, screenshot)
    await evalJs(`document.querySelector('[data-menu-action="ONLINE_PVP"]').click()`);
    await sleep(500);
    const lobbyCheck = await evalJs(`({
      activeScreen: document.querySelector('.bvn-screen.active')?.id,
      hasDevJargon: /node server\\.js|WEBSOCKET REALTIME/i.test(document.getElementById('screenLobby')?.innerText || '')
    })`);
    console.log('[INFO] Lobby check:', JSON.stringify(lobbyCheck));
    if (lobbyCheck.activeScreen !== 'screenLobby' || lobbyCheck.hasDevJargon) {
      throw new Error('Lobby check failed: ' + JSON.stringify(lobbyCheck));
    }
    await checkViewportFit('screenLobby');
    await captureScreenshot('ui_02_lobby.png');
    await evalJs(`document.getElementById('btnLobbyBack')?.click()`);
    await sleep(300);

    const expectedRosterCount = menuCheck.rosterCount;
    const expectedMapCount = menuCheck.mapCount;

    // 2. Click TEAM PLAY (3v3) -> Verify Character Select screen + ALL dynamic avatars + Awakening pill
    await evalJs(`document.querySelector('[data-menu-action="TEAM_CPU"]').click()`);
    await sleep(1200);

    const selectCheck = await evalJs(`(async () => {
      const imgs = Array.from(document.querySelectorAll('#selAvatarGrid img'));
      await Promise.all(imgs.map(img => {
        img.loading = 'eager';
        if (img.complete && img.naturalWidth > 0) return Promise.resolve();
        return new Promise(r => { img.onload = r; img.onerror = r; setTimeout(r, 4000); });
      }));
      const loadedCount = imgs.filter(i => i.complete && i.naturalWidth > 0).length;

      // Focus naruto_ashura (P1) & obito (P2) to verify showcase, big portraits & THỨC TỈNH pill
      if (window.bvnUI) {
        const ashuraIdx = window.bvnUI.roster.findIndex(f => f.id === 'naruto_ashura');
        const obitoIdx = window.bvnUI.roster.findIndex(f => f.id === 'obito');
        if (ashuraIdx >= 0) window.bvnUI.p1CursorIdx = ashuraIdx;
        if (obitoIdx >= 0) window.bvnUI.p2CursorIdx = obitoIdx;
        window.bvnUI.updateShowcasePanels();
      }
      const big1 = document.getElementById('selP1BigImg');
      const big2 = document.getElementById('selP2BigImg');
      await Promise.all([big1, big2].map(img => {
        if (img.complete && img.naturalWidth > 0) return Promise.resolve();
        return new Promise(r => { img.onload = r; img.onerror = r; setTimeout(r, 4000); });
      }));
      const awakenPillText = document.querySelector('#selP1Skills .awaken-form-pill')?.textContent?.trim() || '';
      const hasSelectJunk = /\\[M\\.U\\.G\\.E\\.N\\]|\\(Đề xuất\\)|\\(BVN Core\\)/i.test(document.getElementById('screenSelect')?.innerText || '');

      return {
        activeScreen: document.querySelector('.bvn-screen.active')?.id,
        totalTiles: imgs.length,
        loadedAvatars: loadedCount,
        awakenPillText,
        hasSelectJunk,
        bigP1Ok: big1.complete && big1.naturalWidth > 0,
        bigP2Ok: big2.complete && big2.naturalWidth > 0
      };
    })()`);
    await checkViewportFit('screenSelect');
    await captureScreenshot('ui_03_select.png');

    // Pick 3v3 teams + assists via Quick Random button
    const selectRandomCheck = await evalJs(`(async () => {
      document.getElementById('btnSelectRandomAll').click();
      const big1 = document.getElementById('selP1BigImg');
      const big2 = document.getElementById('selP2BigImg');
      await Promise.all([big1, big2].map(img => {
        if (img.complete && img.naturalWidth > 0) return Promise.resolve();
        return new Promise(r => { img.onload = r; img.onerror = r; setTimeout(r, 4000); });
      }));
      return {
        bigP1Ok: big1.complete && big1.naturalWidth > 0,
        bigP2Ok: big2.complete && big2.naturalWidth > 0,
        p1TeamLen: window.bvnUI.p1Team.length,
        p2TeamLen: window.bvnUI.p2Team.length,
        p1Assist: window.bvnUI.p1Assist,
        p2Assist: window.bvnUI.p2Assist,
        canProceed: !document.getElementById('btnProceedMap').disabled
      };
    })()`);
    console.log('[INFO] Select check:', JSON.stringify({ ...selectCheck, ...selectRandomCheck }));
    if (
      selectCheck.totalTiles !== expectedRosterCount ||
      selectCheck.loadedAvatars !== expectedRosterCount ||
      !selectCheck.awakenPillText.includes('THỨC TỈNH') ||
      selectCheck.hasSelectJunk ||
      !selectCheck.bigP1Ok ||
      !selectCheck.bigP2Ok ||
      !selectRandomCheck.bigP1Ok ||
      !selectRandomCheck.bigP2Ok ||
      selectRandomCheck.p1TeamLen !== 3 ||
      !selectRandomCheck.canProceed
    ) {
      throw new Error('Select check failed: ' + JSON.stringify({ ...selectCheck, ...selectRandomCheck }));
    }

    // 3. Proceed to Map Select -> Verify visual map thumbnails + live preview canvas
    await evalJs(`document.getElementById('btnProceedMap').click()`);
    await sleep(900);
    const mapCheck = await evalJs(`({
      activeScreen: document.querySelector('.bvn-screen.active')?.id,
      thumbsTotal: document.querySelectorAll('#mapThumbGrid img').length,
      thumbsLoaded: Array.from(document.querySelectorAll('#mapThumbGrid img')).filter(i => i.src.startsWith('data:image/png') && i.complete && i.naturalWidth > 0).length,
      previewFrame: window.bvnUI.mapPreviewFrame
    })`);
    console.log('[INFO] Map select check:', JSON.stringify(mapCheck));
    if (mapCheck.activeScreen !== 'screenMapSelect' || mapCheck.thumbsLoaded !== expectedMapCount || mapCheck.previewFrame < 2) {
      throw new Error('Map select check failed: ' + JSON.stringify(mapCheck));
    }
    await checkViewportFit('screenMapSelect');
    await captureScreenshot('ui_04_map_select.png');

    // 4. Click Start Battle -> Wait through VS Splash -> Verify active Battle Arena + Assist Summon + Skill + Canvas pixels
    await evalJs(`document.getElementById('btnStartBattle').click()`);
    const battleCheck = await evalJs(`(async () => {
      const app = window.gameApp;
      const deadline = Date.now() + 15000;
      while ((!app.inBattle || !app.p1 || !app.p2 || document.querySelector('.bvn-screen.active')?.id !== 'screenBattle') && Date.now() < deadline) {
        await new Promise(r => setTimeout(r, 150));
      }
      if (!app.inBattle || !app.p1 || !app.p2) {
        throw new Error('Timed out waiting for Battle Arena initialization');
      }
      await Promise.all([
        window.mugenRegistry.loadPresetForFighter(app.p1Id),
        window.mugenRegistry.loadPresetForFighter(app.p2Id)
      ]);
      app.roundPhase = 'FIGHT';
      app.roundPhaseTimer = 0;
      app.triggerAssistOrEscape(app.p1, app.p2);
      app.triggerSkill(app.p1, app.p2, 'u');
      app.update();
      app.draw();
      const ctx = app.ctx;
      const data = ctx.getImageData(0, 0, 960, 540).data;
      let nonZero = 0;
      for (let i = 0; i < data.length; i += 400) {
        if (data[i] + data[i+1] + data[i+2] > 20) nonZero++;
      }
      const topbarHidden = getComputedStyle(document.querySelector('.bvn-topbar')).display === 'none';
      const p2DeckHiddenInCpu = document.getElementById('p2DeckContainer')?.classList.contains('hidden');
      return {
        activeScreen: document.querySelector('.bvn-screen.active')?.id,
        inBattle: app.inBattle,
        topbarHidden,
        p2DeckHiddenInCpu,
        showHitboxesDefault: Boolean(window.mugenRegistry.showHitboxes),
        format: app.matchFormat,
        p1Id: app.p1Id,
        p2Id: app.p2Id,
        p1Loaded: window.mugenRegistry.loadedPacks.has(app.p1Id),
        p2Loaded: window.mugenRegistry.loadedPacks.has(app.p2Id),
        assistCount: app.assistSummons.length,
        projCount: app.projectiles.length,
        nonZeroSamples: nonZero
      };
    })()`);
    console.log('[INFO] Battle check:', JSON.stringify(battleCheck));
    if (
      battleCheck.activeScreen !== 'screenBattle' ||
      !battleCheck.inBattle ||
      !battleCheck.topbarHidden ||
      !battleCheck.p2DeckHiddenInCpu ||
      battleCheck.showHitboxesDefault ||
      !battleCheck.p1Loaded ||
      !battleCheck.p2Loaded ||
      battleCheck.assistCount < 1 ||
      battleCheck.nonZeroSamples < 100
    ) {
      throw new Error('Battle check failed: ' + JSON.stringify(battleCheck));
    }

    // Check overflow on both 1440x900 and 1280x720 in Battle
    await checkViewportFit('screenBattle');

    // 5. Verify all 5 new Naruto/Kurama fighters load SFF sprites cleanly without errors
    const newPackCheck = await evalJs(`(async () => {
      const ids = ['naruto_kurama', 'obito', 'shikamaru', 'deidara', 'hinata'];
      const results = [];
      for (const id of ids) {
        const pack = await window.mugenRegistry.loadPresetForFighter(id);
        results.push({
          id,
          loaded: Boolean(pack && window.mugenRegistry.loadedPacks.has(id)),
          spriteCount: pack?.sff?.spriteCount || 0,
          actionCount: pack?.air?.size || 0,
          idleAction: pack?.mapping?.idle
        });
      }
      return results;
    })()`);
    console.log('[INFO] New 5 Naruto/Kurama SFF packs check:', JSON.stringify(newPackCheck));
    for (const r of newPackCheck) {
      if (!r.loaded || r.spriteCount < 50 || r.actionCount < 20 || typeof r.idleAction !== 'number') {
        throw new Error('New fighter SFF load failed: ' + JSON.stringify(r));
      }
      if (r.id === 'naruto_kurama' && r.idleAction < 10000) {
        throw new Error(`naruto_kurama expected idleAction >= 10000, got ${r.idleAction}`);
      }
    }

    // 6. Test naruto_ashura J+K Awakening -> Kurama Avatar (Action >= 10000) + Swapped #p1SkillPills + Screenshot 1
    const ashuraCheck = await evalJs(`(async () => {
      const app = window.gameApp;
      app.launchMatch({
        mode: window.BVN_GAME_MODE.LOCAL_2P,
        format: '1v1',
        p1Team: ['naruto_ashura'],
        p2Team: ['obito'],
        p1Assist: 'minato',
        p2Assist: 'madara',
        mapId: 'final_valley'
      });
      await Promise.all([
        window.mugenRegistry.loadPresetForFighter('naruto_ashura'),
        window.mugenRegistry.loadPresetForFighter('obito')
      ]);
      if (!window.mugenRegistry.loadedPacks.has('naruto_ashura') || !window.mugenRegistry.loadedPacks.has('obito')) {
        throw new Error('Failed to load MUGEN packs for naruto_ashura / obito');
      }
      app.paused = true; // Pause RAF loop during deterministic assertions & capture
      app.roundPhase = 'FIGHT';
      app.roundPhaseTimer = 0;
      app.p1.x = 300;
      app.p2.x = 680;
      app.p1.direct = 1;
      app.p2.direct = -1;
      app.draw();

      const beforeAction = app.p1._mugenLastActionId;
      const beforePillsText = document.getElementById('p1SkillPills').innerText;

      // Press J+K with >= 150 Qi to trigger Awakening Form-Swap
      app.p1.qi = 240;
      window.dispatchEvent(new Event('blur'));
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyJ' }));
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyK' }));
      app.paused = false;
      app.update();
      app.paused = true;
      window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyJ' }));
      window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyK' }));

      app.draw();
      const afterAwaken = app.p1.awakened;
      const afterAction = app.p1._mugenLastActionId;
      const afterArmor = app.p1.superArmorBudget;
      const afterPillsText = document.getElementById('p1SkillPills').innerText;
      const awakenedPillCount = document.querySelectorAll('#p1SkillPills .skill-pill.awakened-skill').length;

      // Stage crisp combat pose with Kurama Avatar + Renzoku Bijuudama VFX for screenshot
      app.superFlashFrames = 0;
      app.hitstopFrames = 0;
      app.p1.stateTimer = 0;
      app.p1.actionState = 0;
      app.p1.activeSkillKey = null;
      app.p1.x = 290;
      app.p2.x = 700;
      app.p1.qi = 260;
      app.p2.qi = 180;
      app.triggerSkill(app.p1, app.p2, 'u'); // Renzoku Bijuudama!
      app.paused = false;
      for (let f = 0; f < 5; f++) app.update();
      app.paused = true;
      app.draw();
      const shotAction = app.p1._mugenLastActionId;

      return {
        beforeAction,
        afterAwaken,
        afterAction,
        shotAction,
        afterArmor,
        awakenedPillCount,
        pillsChanged: beforePillsText !== afterPillsText,
        hasKuramaText: /Cửu Vĩ|Bijuudama|Kurama/i.test(afterPillsText),
        p1Finite: Number.isFinite(app.p1.x) && Number.isFinite(app.p1.hp)
      };
    })()`);
    console.log('[INFO] naruto_ashura Kurama Awakening check:', JSON.stringify(ashuraCheck));
    if (
      typeof ashuraCheck.beforeAction !== 'number' ||
      ashuraCheck.beforeAction >= 10000 ||
      !ashuraCheck.afterAwaken ||
      typeof ashuraCheck.afterAction !== 'number' ||
      ashuraCheck.afterAction < 10000 ||
      typeof ashuraCheck.shotAction !== 'number' ||
      ashuraCheck.shotAction < 10000 ||
      ashuraCheck.afterArmor < 2 ||
      !ashuraCheck.pillsChanged ||
      !ashuraCheck.hasKuramaText ||
      ashuraCheck.awakenedPillCount < 5 ||
      !ashuraCheck.p1Finite
    ) {
      throw new Error('naruto_ashura Awakening check failed: ' + JSON.stringify(ashuraCheck));
    }
    await captureScreenshot('battle_naruto_ashura_kurama.png');

    // 7. Test naruto J+K Awakening -> 4-Tails Kyuubi Cloak (tails === 4) + Swapped Skills vs sasuke + Screenshot 2
    const naruto4TailsCheck = await evalJs(`(async () => {
      const app = window.gameApp;
      app.launchMatch({
        mode: window.BVN_GAME_MODE.LOCAL_2P,
        format: '1v1',
        p1Team: ['naruto'],
        p2Team: ['sasuke'],
        p1Assist: 'kakashi',
        p2Assist: 'itachi',
        mapId: 'final_valley'
      });
      await Promise.all([
        window.mugenRegistry.loadPresetForFighter('naruto'),
        window.mugenRegistry.loadPresetForFighter('sasuke')
      ]);
      if (!window.mugenRegistry.loadedPacks.has('naruto') || !window.mugenRegistry.loadedPacks.has('sasuke')) {
        throw new Error('Failed to load MUGEN packs for naruto / sasuke');
      }
      app.paused = true;
      app.roundPhase = 'FIGHT';
      app.roundPhaseTimer = 0;
      app.p1.x = 300;
      app.p2.x = 670;
      app.p1.direct = 1;
      app.p2.direct = -1;
      app.draw();

      const beforePillsText = document.getElementById('p1SkillPills').innerText;

      // Press J+K with >= 150 Qi
      app.p1.qi = 240;
      window.dispatchEvent(new Event('blur'));
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyJ' }));
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyK' }));
      app.paused = false;
      app.update();
      app.paused = true;
      window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyJ' }));
      window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyK' }));

      const afterAwaken = app.p1.awakened;
      const tails = app.p1.meta?.awakenedForm?.tails || 0;
      const afterPillsText = document.getElementById('p1SkillPills').innerText;
      const awakenedPillCount = document.querySelectorAll('#p1SkillPills .skill-pill.awakened-skill').length;

      // Stage crisp combat shot: 4-Tails Naruto firing Kyuubi Chakra Volley vs Sasuke dropping Amaterasu hazard
      app.superFlashFrames = 0;
      app.hitstopFrames = 0;
      app.p1.stateTimer = 0;
      app.p1.actionState = 0;
      app.p1.activeSkillKey = null;
      app.p1.x = 310;
      app.p2.x = 660;
      app.p1.qi = 220;
      app.p2.qi = 220;
      app.triggerSkill(app.p2, app.p1, 'wu'); // Sasuke Amaterasu dot_hazard
      app.triggerSkill(app.p1, app.p2, 'u');  // Naruto 4-Tails Kyuubi Chakra Volley
      app.paused = false;
      for (let f = 0; f < 6; f++) app.update();
      app.paused = true;
      app.draw();

      return {
        afterAwaken,
        tails,
        awakenedPillCount,
        pillsChanged: beforePillsText !== afterPillsText,
        hasKyuubiText: /Kyuubi|Cửu Vĩ|Bijuudama/i.test(afterPillsText),
        hazardsActive: app.hazards.length,
        projectilesActive: app.projectiles.length
      };
    })()`);
    console.log('[INFO] naruto 4-Tails Kyuubi Cloak check:', JSON.stringify(naruto4TailsCheck));
    if (
      !naruto4TailsCheck.afterAwaken ||
      naruto4TailsCheck.tails !== 4 ||
      !naruto4TailsCheck.pillsChanged ||
      !naruto4TailsCheck.hasKyuubiText ||
      naruto4TailsCheck.awakenedPillCount < 4
    ) {
      throw new Error('naruto 4-Tails Awakening check failed: ' + JSON.stringify(naruto4TailsCheck));
    }
    await captureScreenshot('battle_naruto_4tails_vs_sasuke.png');

    // 8. Test all 5 new combat primitives: true_counter, multi_hit_rush, command_grab + O escape, dot_hazard, ghost_followup + Screenshot 3
    const primitivesPart1 = await evalJs(`(async () => {
      const app = window.gameApp;
      const isFiniteState = () => (
        [app.p1.x, app.p1.y, app.p1.hp, app.p1.qi, app.p2.x, app.p2.y, app.p2.hp, app.p2.qi].every(Number.isFinite)
      );

      // 8A. true_counter (obito su) + multi_hit_rush (hinata wu) + Screenshot 3 pose
      app.launchMatch({
        mode: window.BVN_GAME_MODE.LOCAL_2P,
        format: '1v1',
        p1Team: ['obito'],
        p2Team: ['hinata'],
        p1Assist: 'deidara',
        p2Assist: 'shikamaru',
        mapId: 'konoha_village'
      });
      await Promise.all([
        window.mugenRegistry.loadPresetForFighter('obito'),
        window.mugenRegistry.loadPresetForFighter('hinata')
      ]);
      if (!window.mugenRegistry.loadedPacks.has('obito') || !window.mugenRegistry.loadedPacks.has('hinata')) {
        throw new Error('Failed to load MUGEN packs for obito / hinata');
      }
      app.paused = true;
      app.roundPhase = 'FIGHT';
      app.roundPhaseTimer = 0;
      app.p1.x = 320;
      app.p2.x = 640;
      app.p1.direct = 1;
      app.p2.direct = -1;

      // Trigger Obito true_counter (Kamui parry rings visible!) & Hinata Air Palms mid-flight for Screenshot 3
      app.triggerSkill(app.p1, app.p2, 'su');
      const counterTimerStarted = app.p1.counterTimer;
      app.triggerSkill(app.p2, app.p1, 'u'); // Hinata Air Palm volley approaching Obito parry rings
      app.paused = false;
      app.update();
      app.update();
      app.paused = true;
      app.draw();

      return {
        counterTimerStarted,
        finiteBeforeShot: isFiniteState()
      };
    })()`);
    if (primitivesPart1.counterTimerStarted <= 0 || !primitivesPart1.finiteBeforeShot) {
      throw new Error('Primitives Part 1 (true_counter setup) failed: ' + JSON.stringify(primitivesPart1));
    }
    await captureScreenshot('battle_obito_vs_hinata_primitives.png');

    const primitivesCheck = await evalJs(`(async () => {
      const app = window.gameApp;
      const isFiniteState = () => (
        [app.p1.x, app.p1.y, app.p1.hp, app.p1.qi, app.p2.x, app.p2.y, app.p2.hp, app.p2.qi].every(Number.isFinite)
      );

      // Complete 8A: Obito true_counter catches Hinata melee attack
      app.p1.x = 420;
      app.p2.x = 500;
      app.p1.hp = app.p1.hpMax;
      app.p2.hp = app.p2.hpMax;
      app.p1.invincibleTimer = 0;
      app.p2.invincibleTimer = 0;
      app.p1.counterTimer = 0;
      app.p2.counterTimer = 0;
      app.p1.cooldowns = {};
      app.p2.cooldowns = {};
      app.p1.actionState = 0;
      app.p1.stateTimer = 0;
      app.p2.actionState = 0;
      app.p2.stateTimer = 0;
      app.projectiles = [];
      app.scheduledEffects = [];

      app.triggerSkill(app.p1, app.p2, 'su'); // true_counter
      const counterActive = app.p1.counterTimer > 0;
      app.triggerSkill(app.p2, app.p1, 'j');  // Hinata strikes into counter
      app.paused = false;
      for (let f = 0; f < 8; f++) app.update();
      app.paused = true;
      const trueCounterResult = {
        counterActive,
        counterConsumed: app.p1.counterTimer === 0,
        defenderUnscathed: app.p1.hp === app.p1.hpMax,
        attackerDamaged: app.p2.hp < app.p2.hpMax,
        finite: isFiniteState()
      };

      // 8B: multi_hit_rush (Hinata wu 64 Palms with qiBurn)
      app.p1.x = 420;
      app.p2.x = 500;
      app.p1.hp = app.p1.hpMax;
      app.p1.qi = 160;
      app.p1.invincibleTimer = 0;
      app.p1.counterTimer = 0;
      app.p2.actionState = 0;
      app.p2.stateTimer = 0;
      app.p2.cooldowns = {};
      app.scheduledEffects = [];

      const qiBeforeRush = app.p1.qi;
      app.triggerSkill(app.p2, app.p1, 'wu'); // multi_hit_rush
      const scheduledAfterRush = app.scheduledEffects.length;
      app.paused = false;
      for (let f = 0; f < 40; f++) app.update();
      app.paused = true;
      const multiHitRushResult = {
        scheduledAfterRush,
        targetDamaged: app.p1.hp < app.p1.hpMax,
        dmgDealt: app.p1.hpMax - app.p1.hp,
        qiAfterRush: app.p1.qi,
        qiBeforeRush,
        finite: isFiniteState()
      };

      // 8C: command_grab + O escape (Shikamaru wu) & dot_hazard (Deidara wu)
      app.launchMatch({
        mode: window.BVN_GAME_MODE.LOCAL_2P,
        format: '1v1',
        p1Team: ['shikamaru'],
        p2Team: ['deidara'],
        p1Assist: 'naruto',
        p2Assist: 'obito',
        mapId: 'konoha_village'
      });
      await Promise.all([
        window.mugenRegistry.loadPresetForFighter('shikamaru'),
        window.mugenRegistry.loadPresetForFighter('deidara')
      ]);
      app.paused = true;
      app.roundPhase = 'FIGHT';
      app.roundPhaseTimer = 0;
      app.p1.x = 420;
      app.p2.x = 515;
      app.p1.direct = 1;
      app.p2.direct = -1;

      app.triggerSkill(app.p1, app.p2, 'wu'); // command_grab
      const grabbedBy = app.p2.grabbedBy;
      const frozenOnGrab = app.p2.frozenTimer;
      // Escape via O (triggerAssistOrEscape)
      app.p2.fzqi = 100;
      app.triggerAssistOrEscape(app.p2, app.p1);
      const pendingGrabTicksAfterEscape = app.scheduledEffects.filter(e => e.grabTargetSlot === 2).length;
      app.paused = false;
      for (let f = 0; f < 10; f++) app.update();
      app.paused = true;
      const commandGrabResult = {
        grabbedBy,
        frozenOnGrab,
        escapedGrabbedBy: app.p2.grabbedBy,
        escapedFrozen: app.p2.frozenTimer,
        pendingGrabTicksAfterEscape,
        finite: isFiniteState()
      };

      // 8D: dot_hazard (Deidara wu) — verify slows/ticks damage & bypasses true_counter
      app.p1.x = 420;
      app.p2.x = 540;
      app.p1.hp = app.p1.hpMax;
      app.p1.invincibleTimer = 0;
      app.p2.invincibleTimer = 0;
      app.p2.actionState = 0;
      app.p2.stateTimer = 0;
      app.p2.cooldowns = {};
      app.hazards = [];
      app.triggerSkill(app.p2, app.p1, 'wu'); // dot_hazard
      const hazardCount = app.hazards.length;
      if (hazardCount > 0) {
        app.p1.x = app.hazards[0].x;
        app.p1.y = app.hazards[0].y;
      }
      app.p1.counterTimer = 60; // Confirm dot_hazard bypasses true_counter!
      const hpBeforeHazard = app.p1.hp;
      app.paused = false;
      for (let f = 0; f < 45; f++) app.update();
      app.paused = true;
      const dotHazardResult = {
        hazardCount,
        dmgDealt: hpBeforeHazard - app.p1.hp,
        finite: isFiniteState()
      };

      // 8E: ghost_followup (Naruto wu)
      app.launchMatch({
        mode: window.BVN_GAME_MODE.LOCAL_2P,
        format: '1v1',
        p1Team: ['naruto'],
        p2Team: ['deidara'],
        p1Assist: 'sasuke',
        p2Assist: 'obito',
        mapId: 'konoha_village'
      });
      await Promise.all([
        window.mugenRegistry.loadPresetForFighter('naruto'),
        window.mugenRegistry.loadPresetForFighter('deidara')
      ]);
      app.paused = true;
      app.roundPhase = 'FIGHT';
      app.roundPhaseTimer = 0;
      app.p1.x = 420;
      app.p2.x = 510;
      app.p1.direct = 1;
      app.p2.direct = -1;
      const hpBeforeGhost = app.p2.hp;
      app.triggerSkill(app.p1, app.p2, 'wu'); // ghost_followup
      const ghostsSpawned = app.ghosts.length;
      app.paused = false;
      for (let f = 0; f < 26; f++) app.update();
      app.paused = true;
      app.draw();
      const ghostFollowupResult = {
        ghostsSpawned,
        dmgDealt: hpBeforeGhost - app.p2.hp,
        finite: isFiniteState()
      };

      return {
        trueCounterResult,
        multiHitRushResult,
        commandGrabResult,
        dotHazardResult,
        ghostFollowupResult
      };
    })()`);

    console.log('[INFO] Primitives check:', JSON.stringify(primitivesCheck));
    const { trueCounterResult, multiHitRushResult, commandGrabResult, dotHazardResult, ghostFollowupResult } = primitivesCheck;
    if (!trueCounterResult.counterActive || !trueCounterResult.counterConsumed || !trueCounterResult.defenderUnscathed || !trueCounterResult.attackerDamaged || !trueCounterResult.finite) {
      throw new Error('true_counter check failed: ' + JSON.stringify(trueCounterResult));
    }
    if (multiHitRushResult.scheduledAfterRush < 2 || !multiHitRushResult.targetDamaged || !multiHitRushResult.finite) {
      throw new Error('multi_hit_rush check failed: ' + JSON.stringify(multiHitRushResult));
    }
    if (commandGrabResult.grabbedBy !== 1 || commandGrabResult.frozenOnGrab <= 0 || commandGrabResult.escapedGrabbedBy !== 0 || commandGrabResult.escapedFrozen !== 0 || commandGrabResult.pendingGrabTicksAfterEscape !== 0 || !commandGrabResult.finite) {
      throw new Error('command_grab + O escape check failed: ' + JSON.stringify(commandGrabResult));
    }
    if (dotHazardResult.hazardCount < 1 || dotHazardResult.dmgDealt <= 0 || !dotHazardResult.finite) {
      throw new Error('dot_hazard check failed: ' + JSON.stringify(dotHazardResult));
    }
    if (ghostFollowupResult.ghostsSpawned < 1 || ghostFollowupResult.dmgDealt <= 0 || !ghostFollowupResult.finite) {
      throw new Error('ghost_followup check failed: ' + JSON.stringify(ghostFollowupResult));
    }

    if (pageErrors.length || consoleErrors.length) {
      throw new Error(`Browser errors detected! pageErrors=${JSON.stringify(pageErrors)} consoleErrors=${JSON.stringify(consoleErrors)}`);
    }
    console.log(`[PASS] Headless Chrome E2E: Menu -> ${expectedRosterCount} Real Avatars Select -> ${expectedMapCount} Maps -> Battle Arena -> 5 New SFF Packs -> Kurama/4-Tails Form-Swaps -> 5 Primitives -> 0 Errors!`);
  } finally {
    try { cdp.close(); } catch (_) {}
    chrome.kill();
    try { fs.rmSync(tmpProfile, { recursive: true, force: true }); } catch (_) {}
  }
}

(async () => {
  // Check dynamic PNG avatar files on disk from avatars/manifest.json
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'avatars', 'manifest.json'), 'utf8'));
  const keys = Object.keys(manifest);
  if (keys.length < 63) throw new Error(`Expected >= 63 avatars in manifest, got ${keys.length}`);
  for (const id of keys) {
    const f1 = path.join(ROOT, 'avatars', `${id}.png`);
    const f2 = path.join(ROOT, 'avatars', `${id}_big.png`);
    if (!fs.existsSync(f1) || fs.statSync(f1).size < 200) throw new Error(`Invalid avatar icon: ${f1}`);
    if (!fs.existsSync(f2) || fs.statSync(f2).size < 200) throw new Error(`Invalid avatar big: ${f2}`);
  }
  const kuramaIconHash = sha256File(path.join(ROOT, 'avatars', 'naruto_kurama.png'));
  const ashuraIconHash = sha256File(path.join(ROOT, 'avatars', 'naruto_ashura.png'));
  if (kuramaIconHash === ashuraIconHash) {
    throw new Error('naruto_kurama.png and naruto_ashura.png have identical hashes');
  }
  console.log(`[PASS] Verified ${keys.length}/${keys.length} avatar pairs (${keys.length * 2} valid PNGs) on disk.`);

  const srv = spawn(process.execPath, [path.join(ROOT, 'ws-server.js')], {
    env: { ...process.env, PORT: String(PORT) },
    stdio: 'pipe'
  });

  await sleep(900);
  try {
    await testWebSocketMultiplayer();
    await testHeadlessChromeUI(keys.length);
    console.log('=== ALL BVN E2E VERIFICATION CHECKS PASSED (100%) ===');
  } finally {
    srv.kill();
  }
})().catch((err) => {
  console.error('[FAIL]', err);
  process.exit(1);
});
