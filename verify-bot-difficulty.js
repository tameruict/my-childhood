// language: JavaScript, file: verify-bot-difficulty.js, target: Zero-Dependency Bot Difficulty Tiers E2E Verification (UI, Persistence, Mode Visibility, Battle Engine Wiring, Responsive, Screenshot)

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

const ROOT = __dirname;
const PORT = 8099;
const SCREENSHOT_DIR = process.env.BVN_SCREENSHOT_DIR || '';
const CHROME_PATH = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
].find((p) => fs.existsSync(p));

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
function assert(cond, msg) { if (!cond) throw new Error(`Assertion failed: ${msg}`); }

async function waitForServer(port, timeoutMs = 6000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/healthz`);
      if (res.ok) return;
    } catch (_) {}
    await sleep(150);
  }
  throw new Error(`Server on port ${port} failed to start`);
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
    ws.addEventListener('error', reject);
  });
}

async function runBotDifficultyE2E() {
  assert(CHROME_PATH, 'Chrome/Edge executable not found');
  const tmpProfile = fs.mkdtempSync(path.join(os.tmpdir(), 'bvn-bot-qa-'));
  const dbgPort = 9241;
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
  assert(targets && targets.length, 'Chrome CDP failed to start');

  const pageTarget = targets.find((t) => t.type === 'page') || targets[0];
  const cdp = new WebSocket(pageTarget.webSocketDebuggerUrl);
  let nextId = 1;
  const pending = new Map();
  const pageErrors = [];
  const consoleErrors = [];

  await new Promise((res, rej) => {
    cdp.addEventListener('open', res);
    cdp.addEventListener('error', rej);
  });
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
    const r = await sendCdp('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true, userGesture: true });
    if (r.exceptionDetails) throw new Error('Eval exception: ' + JSON.stringify(r.exceptionDetails));
    return r.result ? r.result.value : undefined;
  };
  const waitUntil = async (predJs, timeoutMs = 8000, label = 'cond') => {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      try {
        if (await evalJs(`Boolean(${predJs})`)) return true;
      } catch (_) {}
      await sleep(120);
    }
    throw new Error(`waitUntil timeout (${label}): ${predJs}`);
  };
  const setViewport = async (w, h, mobile = false) => {
    await sendCdp('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile });
    await sleep(120);
  };
  const captureScreenshot = async (filename) => {
    if (!SCREENSHOT_DIR) return null;
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    const res = await sendCdp('Page.captureScreenshot', { format: 'png' });
    const outPath = path.join(SCREENSHOT_DIR, filename);
    fs.writeFileSync(outPath, Buffer.from(res.data, 'base64'));
    console.log(`[SCREENSHOT] ${outPath}`);
    return outPath;
  };

  const baseUrl = `http://127.0.0.1:${PORT}`;
  const wsUrl = `ws://127.0.0.1:${PORT}/ws`;
  let peerWs = null;

  try {
    await sendCdp('Page.enable');
    await sendCdp('Runtime.enable');
    await setViewport(1440, 900, false);

    await sendCdp('Page.navigate', { url: `${baseUrl}/` });
    await waitUntil(`document.readyState === 'complete' && Boolean(window.bvnUI && window.gameApp && window.BVN_AI_DIFFICULTIES)`, 8000, 'app boot');

    // 1. SINGLE_CPU: confirm #selectAiDifficulty visible, 4 tiers, default 'normal', click all 4 tiers & verify UI/storage sync
    await evalJs(`document.querySelector('[data-menu-action="SINGLE_CPU"]').click()`);
    await waitUntil(`document.querySelector('.bvn-screen.active')?.id === 'screenSelect'`, 4000, 'SINGLE_CPU screenSelect');

    const initState = await evalJs(`({
      pickerVisible: !document.getElementById('selectAiDifficulty').classList.contains('hidden'),
      tiers: Array.from(document.querySelectorAll('#selectAiDifficulty [data-ai-diff]')).map(b => ({
        id: b.dataset.aiDiff,
        label: b.textContent.trim(),
        active: b.classList.contains('active')
      })),
      defaultDiff: window.bvnUI.aiDifficulty,
      engineDiff: window.gameApp.getAiDifficulty(),
      hint: document.getElementById('selectAiDiffHint').textContent.trim(),
      badge: document.getElementById('selectModeBadge').textContent.trim(),
      p2Owner: document.getElementById('selP2Owner').textContent.trim()
    })`);
    assert(initState.pickerVisible, 'SINGLE_CPU: #selectAiDifficulty should be visible');
    assert(initState.tiers.length === 4, `Expected 4 tier buttons, got ${initState.tiers.length}`);
    assert(initState.tiers.map(t => t.id).join(',') === 'easy,normal,hard,nightmare', `Tier IDs mismatch: ${JSON.stringify(initState.tiers)}`);
    assert(initState.defaultDiff === 'normal' && initState.engineDiff === 'normal', `Default difficulty should be normal: ${JSON.stringify(initState)}`);
    assert(initState.tiers.find(t => t.id === 'normal').active, 'normal button not active by default');
    assert(initState.hint.length > 0 && /TRUNG BÌNH/i.test(initState.badge) && /Trung Bình/i.test(initState.p2Owner), `Default labels mismatch: ${JSON.stringify(initState)}`);

    const expectedLabels = [
      { id: 'easy', upper: 'DỄ', label: 'Dễ' },
      { id: 'normal', upper: 'TRUNG BÌNH', label: 'Trung Bình' },
      { id: 'nightmare', upper: 'ÁC MỘNG', label: 'Ác Mộng' },
      { id: 'hard', upper: 'KHÓ', label: 'Khó' }
    ];
    const seenHints = new Set();
    for (const tier of expectedLabels) {
      await evalJs(`document.querySelector('#selectAiDifficulty [data-ai-diff="${tier.id}"]').click()`);
      await sleep(80);
      const st = await evalJs(`({
        activeBtn: document.querySelector('#selectAiDifficulty .ai-diff-btn.active')?.dataset?.aiDiff,
        uiDiff: window.bvnUI.aiDifficulty,
        engineDiff: window.gameApp.getAiDifficulty(),
        stored: localStorage.getItem('bvn_ai_difficulty'),
        hint: document.getElementById('selectAiDiffHint').textContent.trim(),
        badge: document.getElementById('selectModeBadge').textContent.trim(),
        p2Owner: document.getElementById('selP2Owner').textContent.trim()
      })`);
      assert(st.activeBtn === tier.id && st.uiDiff === tier.id && st.engineDiff === tier.id && st.stored === tier.id, `Tier ${tier.id} sync failed: ${JSON.stringify(st)}`);
      assert(st.hint.length > 0, `Empty hint for tier ${tier.id}`);
      seenHints.add(st.hint);
      assert(st.badge.toUpperCase().includes(tier.upper), `Badge missing ${tier.upper}: ${st.badge}`);
      assert(st.p2Owner.includes(tier.label), `selP2Owner missing ${tier.label}: ${st.p2Owner}`);
    }
    assert(seenHints.size === 4, `Expected 4 distinct tier hints, got ${seenHints.size}`);

    // Capture crisp 1440x900 screenshot on SINGLE_CPU Select with 'hard' active + avatars loaded
    await evalJs(`(async () => {
      const imgs = Array.from(document.querySelectorAll('#selAvatarGrid img, #selP1BigImg, #selP2BigImg'));
      await Promise.all(imgs.map(img => {
        img.loading = 'eager';
        if (img.complete && img.naturalWidth > 0) return Promise.resolve();
        return new Promise(r => { img.onload = r; img.onerror = r; setTimeout(r, 3000); });
      }));
    })()`);
    await captureScreenshot('bot_01_select_difficulty.png');

    // 2. Responsive checks on #screenSelect (1440x900, 1280x720, 390x844)
    for (const vp of [{ w: 1440, h: 900, m: false }, { w: 1280, h: 720, m: false }, { w: 390, h: 844, m: true }]) {
      await setViewport(vp.w, vp.h, vp.m);
      const rm = await evalJs(`(() => {
        const doc = document.documentElement;
        const picker = document.getElementById('selectAiDifficulty');
        const pr = picker.getBoundingClientRect();
        const btns = Array.from(picker.querySelectorAll('.ai-diff-btn')).map(b => {
          const r = b.getBoundingClientRect();
          return { id: b.dataset.aiDiff, w: Math.round(r.width), h: Math.round(r.height), left: Math.round(r.left), right: Math.round(r.right) };
        });
        return { scrollW: doc.scrollWidth, clientW: doc.clientWidth, pickerW: Math.round(pr.width), pickerRight: Math.round(pr.right), btns };
      })()`);
      assert(rm.scrollW <= rm.clientW + 1, `Horizontal overflow on #screenSelect @ ${vp.w}x${vp.h}: scrollW=${rm.scrollW} > clientW=${rm.clientW}`);
      assert(rm.pickerW > 0 && rm.pickerRight <= vp.w + 2, `#selectAiDifficulty clipped @ ${vp.w}x${vp.h}: ${JSON.stringify(rm)}`);
      for (const b of rm.btns) {
        assert(b.w > 0 && b.h > 0 && b.right <= vp.w + 2 && b.left >= -2, `Tier button ${b.id} clipped @ ${vp.w}x${vp.h}: ${JSON.stringify(b)}`);
      }
    }
    await setViewport(1440, 900, false);
    console.log('[PASS] SINGLE_CPU difficulty picker: 4 tiers, UI/storage sync, 1440x900/1280x720/390x844 responsive');

    // 3. Reload page -> verify persistence ('hard') restored in TEAM_CPU
    await sendCdp('Page.navigate', { url: `${baseUrl}/` });
    await waitUntil(`document.readyState === 'complete' && Boolean(window.bvnUI && window.gameApp)`, 8000, 'reload boot');
    await evalJs(`document.querySelector('[data-menu-action="TEAM_CPU"]').click()`);
    await waitUntil(`document.querySelector('.bvn-screen.active')?.id === 'screenSelect'`, 4000, 'TEAM_CPU screenSelect');

    const persisted = await evalJs(`({
      pickerVisible: !document.getElementById('selectAiDifficulty').classList.contains('hidden'),
      uiDiff: window.bvnUI.aiDifficulty,
      activeBtn: document.querySelector('#selectAiDifficulty .ai-diff-btn.active')?.dataset?.aiDiff,
      stored: localStorage.getItem('bvn_ai_difficulty'),
      badge: document.getElementById('selectModeBadge').textContent.trim()
    })`);
    assert(persisted.pickerVisible && persisted.uiDiff === 'hard' && persisted.activeBtn === 'hard' && persisted.stored === 'hard' && /KHÓ/i.test(persisted.badge), `Persistence across reload failed: ${JSON.stringify(persisted)}`);
    console.log('[PASS] localStorage persistence across reload verified in TEAM_CPU (restored hard)');

    // 4. Verify #selectAiDifficulty is HIDDEN in LOCAL_2P, TRAINING, and ONLINE_PVP
    for (const mode of ['LOCAL_2P', 'TRAINING']) {
      await evalJs(`document.getElementById('btnSelectBack').click()`);
      await waitUntil(`document.querySelector('.bvn-screen.active')?.id === 'screenMenu'`, 4000, 'back to menu');
      await evalJs(`document.querySelector('[data-menu-action="${mode}"]').click()`);
      await waitUntil(`document.querySelector('.bvn-screen.active')?.id === 'screenSelect'`, 4000, `${mode} screenSelect`);
      const hidden = await evalJs(`document.getElementById('selectAiDifficulty').classList.contains('hidden')`);
      assert(hidden, `#selectAiDifficulty MUST be hidden in ${mode}`);
    }

    // ONLINE_PVP: create room via WS peer, join in browser via ?room=CODE, ready + start -> #screenSelect has picker HIDDEN
    peerWs = await wsConnect(wsUrl);
    peerWs.sendJson({ type: 'HELLO', profile: { nickname: 'PeerHost', tag: '#8888', elo: 1200 } });
    await peerWs.waitFor((m) => m.type === 'WELCOME');
    peerWs.sendJson({ type: 'CREATE_ROOM', name: 'CheckHideDiff', matchFormat: '1v1', visibility: 'public' });
    const created = await peerWs.waitFor((m) => m.type === 'ROOM_CREATED');

    await sendCdp('Page.navigate', { url: `${baseUrl}/?room=${created.code}` });
    await waitUntil(`!document.getElementById('lobbyRoomView').classList.contains('hidden')`, 6000, 'browser joined online room');
    await peerWs.waitFor((m) => m.type === 'ROOM_UPDATED' && m.event === 'guest_joined');
    await evalJs(`document.getElementById('btnToggleReady').click()`);
    await peerWs.waitFor((m) => m.type === 'ROOM_UPDATED' && m.event === 'ready_changed' && m.room?.p2?.ready === true);
    peerWs.sendJson({ type: 'START_MATCH' });
    await waitUntil(`document.querySelector('.bvn-screen.active')?.id === 'screenSelect'`, 5000, 'ONLINE_PVP screenSelect');
    const onlinePickerHidden = await evalJs(`document.getElementById('selectAiDifficulty').classList.contains('hidden')`);
    assert(onlinePickerHidden, '#selectAiDifficulty MUST be hidden in ONLINE_PVP');
    peerWs.close();
    peerWs = null;
    console.log('[PASS] #selectAiDifficulty confirmed HIDDEN in LOCAL_2P, TRAINING, and ONLINE_PVP');

    // 5. Launch real CPU battles at 'easy' and 'hard' via UI flow -> verify engine aiDifficulty, p2DisplayName, and 120-frame active sim
    for (const run of [
      { id: 'easy', expectedP2: 'CPU · Dễ', expectedTag: 'DỄ' },
      { id: 'hard', expectedP2: 'CPU · Khó', expectedTag: 'KHÓ' }
    ]) {
      await sendCdp('Page.navigate', { url: `${baseUrl}/` });
      await waitUntil(`document.readyState === 'complete' && Boolean(window.bvnUI && window.gameApp)`, 8000, `boot for ${run.id}`);
      await evalJs(`document.querySelector('[data-menu-action="SINGLE_CPU"]').click()`);
      await waitUntil(`document.querySelector('.bvn-screen.active')?.id === 'screenSelect'`, 4000, `select for ${run.id}`);
      await evalJs(`document.querySelector('#selectAiDifficulty [data-ai-diff="${run.id}"]').click()`);
      await evalJs(`document.getElementById('btnSelectRandomAll').click()`);
      await waitUntil(`!document.getElementById('btnProceedMap').disabled`, 3000, `proceed enabled for ${run.id}`);
      await evalJs(`document.getElementById('btnProceedMap').click()`);
      await waitUntil(`document.querySelector('.bvn-screen.active')?.id === 'screenMapSelect'`, 4000, `map select for ${run.id}`);
      await evalJs(`document.getElementById('btnStartBattle').click()`);

      const battleResult = await evalJs(`(async () => {
        const app = window.gameApp;
        const deadline = Date.now() + 15000;
        while ((!app.inBattle || !app.p1 || !app.p2 || document.querySelector('.bvn-screen.active')?.id !== 'screenBattle') && Date.now() < deadline) {
          await new Promise(r => setTimeout(r, 120));
        }
        if (!app.inBattle || !app.p1 || !app.p2) throw new Error('Battle failed to start');
        app.paused = true;
        app.roundPhase = 'FIGHT';
        app.roundPhaseTimer = 0;
        app.paused = false;
        for (let f = 0; f < 120; f++) app.update();
        app.paused = true;
        return {
          aiDifficulty: app.aiDifficulty,
          p2DisplayName: app.p2DisplayName,
          battleModeTag: document.getElementById('battleModeTag')?.textContent?.trim() || '',
          finite: [app.p1.x, app.p1.y, app.p1.hp, app.p2.x, app.p2.y, app.p2.hp].every(Number.isFinite)
        };
      })()`);
      assert(battleResult.aiDifficulty === run.id, `Engine aiDifficulty mismatch for ${run.id}: ${JSON.stringify(battleResult)}`);
      assert(battleResult.p2DisplayName === run.expectedP2, `p2DisplayName mismatch for ${run.id}: ${JSON.stringify(battleResult)}`);
      assert(battleResult.battleModeTag.toUpperCase().includes(run.expectedTag), `battleModeTag missing ${run.expectedTag}: ${JSON.stringify(battleResult)}`);
      assert(battleResult.finite, `Non-finite fighter state during ${run.id} battle sim`);
    }
    console.log('[PASS] CPU battle launches verified at easy (CPU · Dễ) and hard (CPU · Khó) with 120-frame active sim');

    // 6. Strict 0 console errors & 0 uncaught exceptions
    assert(pageErrors.length === 0 && consoleErrors.length === 0, `Browser errors detected: page=${JSON.stringify(pageErrors)} console=${JSON.stringify(consoleErrors)}`);
    console.log('[PASS] Strict Browser Gate: 0 console errors & 0 uncaught exceptions');
  } finally {
    try { peerWs && peerWs.close(); } catch (_) {}
    try { cdp.close(); } catch (_) {}
    chrome.kill();
    try { fs.rmSync(tmpProfile, { recursive: true, force: true }); } catch (_) {}
  }
}

(async () => {
  const srv = spawn(process.execPath, [path.join(ROOT, 'server.js')], {
    env: { ...process.env, PORT: String(PORT) },
    stdio: 'pipe'
  });
  try {
    await waitForServer(PORT);
    await runBotDifficultyE2E();
    console.log('=== ALL BOT DIFFICULTY E2E CHECKS PASSED (100%) ===');
  } finally {
    srv.kill();
  }
})().catch((err) => {
  console.error('[FAIL]', err);
  process.exit(1);
});
