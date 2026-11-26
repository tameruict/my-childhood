// language: JavaScript, file: verify-room-flow.js, target: Zero-Dependency Room Refactor E2E Verification (WS/HTTP Protocol + 2-Tab Headless Chrome CDP + Responsive + Screenshots)

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

const ROOT = __dirname;
const PORT = 8097;
const PROD_PORT = 8098;
const SCREENSHOT_DIR = process.env.BVN_SCREENSHOT_DIR || '';
const CHROME_PATH = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
].find((p) => fs.existsSync(p));

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

function assert(cond, msg) {
  if (!cond) throw new Error(`Assertion failed: ${msg}`);
}

function wsConnect(url) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    const inbox = [];
    const waiters = [];
    ws.addEventListener('message', (ev) => {
      let msg;
      try { msg = JSON.parse(ev.data); } catch (_) { msg = { _raw: ev.data }; }
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
    ws.waitFor = (pred, timeoutMs = 4500, label = 'msg') => {
      const idx = inbox.findIndex(pred);
      if (idx !== -1) return Promise.resolve(inbox.splice(idx, 1)[0]);
      return new Promise((res, rej) => {
        const timer = setTimeout(() => {
          const recent = inbox.slice(-5).map((m) => `${m.type}${m.code ? ':' + m.code : ''}`).join(',');
          rej(new Error(`WS waitFor timeout (${label}); inbox=[${recent}]`));
        }, timeoutMs);
        waiters.push({ pred, resolve: res, timer });
      });
    };
    ws.drainInbox = () => { inbox.length = 0; };
    ws.sendJson = (o) => ws.send(JSON.stringify(o));
    ws.addEventListener('open', () => resolve(ws));
    ws.addEventListener('error', (e) => reject(new Error('WS connect error: ' + (e.message || 'unknown'))));
  });
}

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

async function testHttpAndWsProtocol() {
  const base = `http://127.0.0.1:${PORT}`;
  const wsUrl = `ws://127.0.0.1:${PORT}/ws`;

  // 1. HTTP /healthz GET + HEAD, /api/rooms, /api/server-info, malformed % URL, dotfile guard
  const hzGet = await fetch(`${base}/healthz`);
  assert(hzGet.status === 200, `GET /healthz expected 200, got ${hzGet.status}`);
  const hzJson = await hzGet.json();
  assert(hzJson.ok === true, '/healthz json ok !== true');

  const hzHead = await fetch(`${base}/healthz`, { method: 'HEAD' });
  assert(hzHead.status === 200, `HEAD /healthz expected 200, got ${hzHead.status}`);

  const emptyRooms = await fetch(`${base}/api/rooms`).then((r) => r.json());
  assert(Array.isArray(emptyRooms.rooms) && emptyRooms.rooms.length === 0, 'Initial /api/rooms should be empty');

  const srvInfo = await fetch(`${base}/api/server-info`).then((r) => r.json());
  assert(Array.isArray(srvInfo.lanUrls), '/api/server-info missing lanUrls array');
  assert(srvInfo.lanUrls.every((u) => !u.includes('169.254.')), `APIPA 169.254.x.x leaked in lanUrls: ${JSON.stringify(srvInfo.lanUrls)}`);

  const badPct = await fetch(`${base}/%E0%A4%A`);
  assert(badPct.status === 400, `Malformed % URL expected 400, got ${badPct.status}`);

  const dotfile = await fetch(`${base}/.gitignore`);
  assert(dotfile.status === 403, `Dotfile /.gitignore expected 403, got ${dotfile.status}`);

  const dotEnv = await fetch(`${base}/.env`);
  assert(dotEnv.status === 403, `Dotfile /.env expected 403, got ${dotEnv.status}`);

  console.log('[PASS] HTTP endpoints (/healthz GET/HEAD, /api/rooms, /api/server-info, malformed %, dotfiles)');

  // 2. Connect 5 clients & HELLO
  const clients = await Promise.all([
    wsConnect(wsUrl),
    wsConnect(wsUrl),
    wsConnect(wsUrl),
    wsConnect(wsUrl),
    wsConnect(wsUrl)
  ]);
  const [c1, c2, c3, c4, c5] = clients;
  const profiles = [
    { nickname: 'HostAlpha', tag: '#1111', elo: 1300 },
    { nickname: 'HostPrivate', tag: '#2222', elo: 1250 },
    { nickname: 'HostLocked', tag: '#3333', elo: 1400 },
    { nickname: 'GuestFour', tag: '#4444', elo: 1220 },
    { nickname: 'GuestFive', tag: '#5555', elo: 1210 }
  ];
  const welcomes = [];
  for (let i = 0; i < clients.length; i++) {
    clients[i].sendJson({ type: 'HELLO', profile: profiles[i] });
    welcomes.push(await clients[i].waitFor((m) => m.type === 'WELCOME', 4000, `WELCOME-${i}`));
  }

  // 3. Create public (3v3), private (1v1), and password-protected public (1v1) rooms
  c1.sendJson({ type: 'CREATE_ROOM', name: 'Phòng Công Khai 3v3', matchFormat: '3v3', visibility: 'public', profile: profiles[0] });
  const rPub = await c1.waitFor((m) => m.type === 'ROOM_CREATED', 4000, 'ROOM_CREATED pub');
  assert(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/.test(rPub.code), `Invalid unambiguous 6-char code: ${rPub.code}`);
  assert(rPub.slot === 1 && rPub.room.matchFormat === '3v3' && rPub.room.visibility === 'public' && rPub.room.hasPassword === false && rPub.room.status === 'waiting', 'Public room schema mismatch');
  assert(rPub.room.p1 && rPub.room.p1.ready === true && rPub.room.p2 === null, 'Public room initial slots mismatch');

  c2.sendJson({ type: 'CREATE_ROOM', name: 'Phòng Riêng Tư', matchFormat: '1v1', visibility: 'private', profile: profiles[1] });
  const rPriv = await c2.waitFor((m) => m.type === 'ROOM_CREATED', 4000, 'ROOM_CREATED priv');
  assert(rPriv.room.visibility === 'private' && rPriv.room.hasPassword === false, 'Private room schema mismatch');

  const secretPwd = 'konoha2026';
  c3.sendJson({ type: 'CREATE_ROOM', name: 'Phòng Có Khóa', matchFormat: '1v1', visibility: 'public', password: secretPwd, profile: profiles[2] });
  const rLock = await c3.waitFor((m) => m.type === 'ROOM_CREATED', 4000, 'ROOM_CREATED locked');
  assert(rLock.room.hasPassword === true && rLock.room.visibility === 'public', 'Locked room schema mismatch');
  assert(!JSON.stringify(rLock).includes(secretPwd) && !JSON.stringify(rLock).includes('passwordHash'), 'Secret leaked in ROOM_CREATED');

  // Verify /api/rooms & /api/rooms/:code filtering + zero secret leakage
  const apiRoomsRes = await fetch(`${base}/api/rooms`).then((r) => r.json());
  const listedCodes = apiRoomsRes.rooms.map((r) => r.code);
  assert(listedCodes.includes(rPub.code), 'Public room missing from /api/rooms');
  assert(listedCodes.includes(rLock.code), 'Public locked room missing from /api/rooms');
  assert(!listedCodes.includes(rPriv.code), 'Private room leaked into /api/rooms!');
  assert(!JSON.stringify(apiRoomsRes).includes(secretPwd) && !JSON.stringify(apiRoomsRes).includes('passwordHash'), 'Secret leaked in /api/rooms');

  const lockMetaRes = await fetch(`${base}/api/rooms/${rLock.code}`);
  assert(lockMetaRes.status === 200, 'GET /api/rooms/:code failed');
  const lockMetaText = await lockMetaRes.text();
  assert(!lockMetaText.includes(secretPwd) && !lockMetaText.includes('passwordHash'), 'Secret leaked in /api/rooms/:code');
  const lockMeta = JSON.parse(lockMetaText);
  assert(lockMeta.room?.hasPassword === true || lockMeta.hasPassword === true, 'GET /api/rooms/:code missing hasPassword=true');

  // LIST_ROOMS filter check
  c4.drainInbox();
  c4.sendJson({ type: 'LIST_ROOMS', matchFormat: '3v3' });
  const list3v3 = await c4.waitFor((m) => m.type === 'ROOMS_LIST', 4000, 'LIST_ROOMS 3v3');
  assert(list3v3.rooms.every((r) => r.matchFormat === '3v3') && list3v3.rooms.some((r) => r.code === rPub.code), 'LIST_ROOMS 3v3 filter failed');
  assert(!list3v3.rooms.some((r) => r.code === rPriv.code), 'Private room leaked into ROOMS_LIST');

  console.log('[PASS] Room creation (public/private/password), visibility filtering, /api/rooms/:code & zero secret leaks');

  // 4. Join errors: invalid code, nonexistent, missing password, wrong password, right password, full room, already in room
  c4.sendJson({ type: 'JOIN_ROOM', code: '!!', profile: profiles[3] });
  const errBadCode = await c4.waitFor((m) => m.type === 'ERROR', 4000, 'INVALID_CODE');
  assert(errBadCode.code === 'INVALID_CODE', `Expected INVALID_CODE, got ${errBadCode.code}`);

  c4.sendJson({ type: 'JOIN_ROOM', code: 'ZZZZZZ', profile: profiles[3] });
  const errNotFound = await c4.waitFor((m) => m.type === 'ERROR', 4000, 'ROOM_NOT_FOUND');
  assert(errNotFound.code === 'ROOM_NOT_FOUND', `Expected ROOM_NOT_FOUND, got ${errNotFound.code}`);

  c4.sendJson({ type: 'JOIN_ROOM', code: rLock.code, profile: profiles[3] });
  const errNeedPwd = await c4.waitFor((m) => m.type === 'ERROR', 4000, 'PASSWORD_REQUIRED');
  assert(errNeedPwd.code === 'PASSWORD_REQUIRED', `Expected PASSWORD_REQUIRED, got ${errNeedPwd.code}`);

  c4.sendJson({ type: 'JOIN_ROOM', code: rLock.code, password: 'wrongpassword', profile: profiles[3] });
  const errWrongPwd = await c4.waitFor((m) => m.type === 'ERROR', 4000, 'WRONG_PASSWORD');
  assert(errWrongPwd.code === 'WRONG_PASSWORD', `Expected WRONG_PASSWORD, got ${errWrongPwd.code}`);

  // Correct password -> ROOM_JOINED (P2) + ROOM_UPDATED guest_joined (P1)
  c4.sendJson({ type: 'JOIN_ROOM', code: rLock.code, password: secretPwd, profile: profiles[3] });
  const joinedLock = await c4.waitFor((m) => m.type === 'ROOM_JOINED', 4000, 'ROOM_JOINED lock');
  const hostSeenJoin = await c3.waitFor((m) => m.type === 'ROOM_UPDATED' && m.event === 'guest_joined', 4000, 'ROOM_UPDATED guest_joined');
  assert(joinedLock.slot === 2 && joinedLock.room.status === 'lobby' && joinedLock.room.p2.ready === false, 'ROOM_JOINED state mismatch');
  assert(hostSeenJoin.slot === 1 && hostSeenJoin.room.status === 'lobby', 'Host ROOM_UPDATED state mismatch');

  // Locked room now full (lobby) -> must disappear from /api/rooms & reject 3rd client
  const roomsAfterJoin = await fetch(`${base}/api/rooms`).then((r) => r.json());
  assert(!roomsAfterJoin.rooms.some((r) => r.code === rLock.code), 'Full room still shown in /api/rooms');

  c5.sendJson({ type: 'JOIN_ROOM', code: rLock.code, password: secretPwd, profile: profiles[4] });
  const errFull = await c5.waitFor((m) => m.type === 'ERROR', 4000, 'ROOM_FULL');
  assert(errFull.code === 'ROOM_FULL', `Expected ROOM_FULL, got ${errFull.code}`);

  c4.sendJson({ type: 'JOIN_ROOM', code: rLock.code, password: secretPwd });
  const errAlready = await c4.waitFor((m) => m.type === 'ERROR', 4000, 'ALREADY_IN_ROOM');
  assert(errAlready.code === 'ALREADY_IN_ROOM', `Expected ALREADY_IN_ROOM, got ${errAlready.code}`);

  console.log('[PASS] Join guards (INVALID_CODE, ROOM_NOT_FOUND, PASSWORD_REQUIRED, WRONG_PASSWORD, ROOM_FULL, ALREADY_IN_ROOM)');

  // 5. Staging lifecycle: NOT_HOST, NOT_READY, SET_READY, UPDATE_ROOM (resets p2.ready & clears password), KICK_GUEST, Guest Leave, Host Transfer
  c4.sendJson({ type: 'START_MATCH' });
  const errNotHost = await c4.waitFor((m) => m.type === 'ERROR', 4000, 'NOT_HOST');
  assert(errNotHost.code === 'NOT_HOST', `Expected NOT_HOST, got ${errNotHost.code}`);

  c3.sendJson({ type: 'START_MATCH' });
  const errNotReady = await c3.waitFor((m) => m.type === 'ERROR', 4000, 'NOT_READY');
  assert(errNotReady.code === 'NOT_READY', `Expected NOT_READY, got ${errNotReady.code}`);

  c4.sendJson({ type: 'SET_READY', ready: true });
  const rd1 = await c3.waitFor((m) => m.type === 'ROOM_UPDATED' && m.event === 'ready_changed', 4000, 'ready P1');
  const rd2 = await c4.waitFor((m) => m.type === 'ROOM_UPDATED' && m.event === 'ready_changed', 4000, 'ready P2');
  assert(rd1.room.p2.ready === true && rd2.room.p2.ready === true, 'SET_READY true did not sync');

  // UPDATE_ROOM changing format resets p2.ready=false & password:"" removes lock
  c3.sendJson({ type: 'UPDATE_ROOM', name: 'Phòng Đã Mở Khóa', matchFormat: '3v3', password: '' });
  const upd1 = await c3.waitFor((m) => m.type === 'ROOM_UPDATED' && m.event === 'settings_updated', 4000, 'upd P1');
  const upd2 = await c4.waitFor((m) => m.type === 'ROOM_UPDATED' && m.event === 'settings_updated', 4000, 'upd P2');
  assert(upd1.room.matchFormat === '3v3' && upd1.room.hasPassword === false && upd1.room.p2.ready === false, 'UPDATE_ROOM P1 mismatch');
  assert(upd2.room.name === 'Phòng Đã Mở Khóa' && upd2.room.p2.ready === false, 'UPDATE_ROOM P2 mismatch');

  // KICK_GUEST
  c3.sendJson({ type: 'KICK_GUEST', reason: 'kicked_by_test' });
  const kicked = await c4.waitFor((m) => m.type === 'KICKED', 4000, 'KICKED');
  const hostAfterKick = await c3.waitFor((m) => m.type === 'ROOM_UPDATED' && m.event === 'guest_kicked', 4000, 'guest_kicked');
  assert(kicked.code === rLock.code && hostAfterKick.room.status === 'waiting' && hostAfterKick.room.p2 === null, 'KICK_GUEST state mismatch');

  // Rejoin unlocked room (no password needed now), then Guest leaves -> Host stays in room
  c4.sendJson({ type: 'JOIN_ROOM', code: rLock.code, profile: profiles[3] });
  await c4.waitFor((m) => m.type === 'ROOM_JOINED', 4000, 'rejoin unlocked');
  await c3.waitFor((m) => m.type === 'ROOM_UPDATED' && m.event === 'guest_joined', 4000, 'host rejoin');

  c4.sendJson({ type: 'LEAVE_ROOM' });
  await c4.waitFor((m) => m.type === 'LEFT_ROOM', 4000, 'guest LEFT_ROOM');
  const hostAfterLeave = await c3.waitFor((m) => m.type === 'ROOM_UPDATED' && m.event === 'guest_left', 4000, 'guest_left');
  assert(hostAfterLeave.room.status === 'waiting' && hostAfterLeave.room.p2 === null, 'Host did not stay waiting on guest leave');

  // Rejoin again, then Host leaves -> HOST_TRANSFERRED to Guest!
  c4.sendJson({ type: 'JOIN_ROOM', code: rLock.code, profile: profiles[3] });
  await c4.waitFor((m) => m.type === 'ROOM_JOINED', 4000, 'rejoin before transfer');
  await c3.waitFor((m) => m.type === 'ROOM_UPDATED' && m.event === 'guest_joined', 4000, 'host seen rejoin 2');

  c3.sendJson({ type: 'LEAVE_ROOM' });
  await c3.waitFor((m) => m.type === 'LEFT_ROOM', 4000, 'host LEFT_ROOM');
  const xfer = await c4.waitFor((m) => m.type === 'HOST_TRANSFERRED', 4000, 'HOST_TRANSFERRED');
  const xferUpd = await c4.waitFor((m) => m.type === 'ROOM_UPDATED' && m.event === 'host_transferred', 4000, 'ROOM_UPDATED host_transferred');
  assert(xfer.slot === 1 && xfer.room.p1.id === welcomes[3].id && xfer.room.p1.ready === true && xfer.room.p2 === null && xfer.room.status === 'waiting', 'HOST_TRANSFERRED payload mismatch');
  assert(xferUpd.slot === 1 && xferUpd.room.status === 'waiting', 'host_transferred update mismatch');

  // Private room join + ready + START_MATCH -> ROOM_READY -> START_BATTLE host-only -> disconnect PEER_LEFT
  c5.sendJson({ type: 'JOIN_ROOM', code: rPriv.code, profile: profiles[4] });
  await c5.waitFor((m) => m.type === 'ROOM_JOINED', 4000, 'priv join');
  await c2.waitFor((m) => m.type === 'ROOM_UPDATED' && m.event === 'guest_joined', 4000, 'priv host join');
  c5.sendJson({ type: 'SET_READY', ready: true });
  await c2.waitFor((m) => m.type === 'ROOM_UPDATED' && m.event === 'ready_changed', 4000, 'priv ready');
  c2.sendJson({ type: 'START_MATCH' });
  const sr1 = await c2.waitFor((m) => m.type === 'ROOM_READY', 4000, 'START_MATCH P1');
  const sr2 = await c5.waitFor((m) => m.type === 'ROOM_READY', 4000, 'START_MATCH P2');
  assert(sr1.room.status === 'selecting' && sr2.room.status === 'selecting', 'START_MATCH did not enter selecting');

  // Guest cannot START_BATTLE
  c5.sendJson({ type: 'START_BATTLE', payload: { mapId: 'final_valley', format: '1v1' } });
  const errSbNotHost = await c5.waitFor((m) => m.type === 'ERROR', 4000, 'START_BATTLE NOT_HOST');
  assert(errSbNotHost.code === 'NOT_HOST', `Expected NOT_HOST on START_BATTLE, got ${errSbNotHost.code}`);

  c2.sendJson({ type: 'START_BATTLE', payload: { mapId: 'final_valley', format: '1v1' } });
  await c5.waitFor((m) => m.type === 'START_BATTLE', 4000, 'START_BATTLE relay');

  // Disconnect in active match -> PEER_LEFT
  c5.close();
  const peerLeft = await c2.waitFor((m) => m.type === 'PEER_LEFT', 4000, 'PEER_LEFT on match disconnect');
  assert(peerLeft.code === rPriv.code, 'PEER_LEFT missing room code');

  console.log('[PASS] Staging lifecycle (SET_READY, UPDATE_ROOM, KICK_GUEST, guest leave, HOST_TRANSFERRED, START_MATCH, START_BATTLE host-only, PEER_LEFT)');

  // 6. Quick Match strict 1v1/3v3 isolation & CANCEL_QUICK_MATCH (remember c1 has an open public 3v3 room!)
  const q1 = await wsConnect(wsUrl);
  const q2 = await wsConnect(wsUrl);
  const q3 = await wsConnect(wsUrl);
  q1.sendJson({ type: 'QUICK_MATCH', matchFormat: '3v3', profile: { nickname: 'QM3A', tag: '#71', elo: 1200 } });
  const qq1 = await q1.waitFor((m) => m.type === 'QUICK_QUEUED', 4000, 'q1 QUICK_QUEUED');
  assert(qq1.matchFormat === '3v3', 'q1 queued wrong format (or collided with custom room)');

  q2.sendJson({ type: 'QUICK_MATCH', matchFormat: '1v1', profile: { nickname: 'QM1A', tag: '#72', elo: 1200 } });
  const qq2 = await q2.waitFor((m) => m.type === 'QUICK_QUEUED', 4000, 'q2 QUICK_QUEUED 1v1');
  assert(qq2.matchFormat === '1v1', 'q2 1v1 should NOT pair with q1 3v3');

  q2.sendJson({ type: 'CANCEL_QUICK_MATCH' });
  await q2.waitFor((m) => m.type === 'QUICK_CANCELLED', 4000, 'q2 QUICK_CANCELLED');

  q3.sendJson({ type: 'QUICK_MATCH', matchFormat: '3v3', profile: { nickname: 'QM3B', tag: '#73', elo: 1210 } });
  const qm1 = await q1.waitFor((m) => m.type === 'ROOM_READY', 4000, 'q1 paired');
  const qm3 = await q3.waitFor((m) => m.type === 'ROOM_READY', 4000, 'q3 paired');
  assert(qm1.room.code === qm3.room.code && qm1.room.matchFormat === '3v3', 'Quick match 3v3 pairing mismatch');

  console.log('[PASS] Quick Match strict 1v1/3v3 isolation, custom-room isolation, and CANCEL_QUICK_MATCH');

  // 7. Malformed JSON + Rate Limit check
  const rl = await wsConnect(wsUrl);
  rl.send('{invalid-json');
  const badJsonErr = await rl.waitFor((m) => m.type === 'ERROR', 4000, 'bad json ERROR');
  assert(badJsonErr.code === 'INVALID_INPUT', `Expected INVALID_INPUT on bad JSON, got ${badJsonErr.code}`);

  let sawRateLimited = false;
  for (let i = 0; i < 20; i++) {
    rl.sendJson({ type: 'JOIN_ROOM', code: 'ZZZZZZ' });
  }
  const deadline = Date.now() + 3000;
  while (Date.now() < deadline) {
    try {
      const m = await rl.waitFor((x) => x.type === 'ERROR', 600, 'rate limit check');
      if (m.code === 'RATE_LIMITED') { sawRateLimited = true; break; }
    } catch (_) { break; }
  }
  assert(sawRateLimited, 'Expected RATE_LIMITED error under rapid JOIN_ROOM flood');

  console.log('[PASS] Malformed JSON rejection & per-client rate limiting');

  for (const s of [c1, c2, c3, c4, q1, q2, q3, rl]) {
    try { s.close(); } catch (_) {}
  }
  await sleep(150);

  // 8. Production mode check: lanUrls === []
  const prodSrv = spawn(process.execPath, [path.join(ROOT, 'ws-server.js')], {
    env: { ...process.env, PORT: String(PROD_PORT), NODE_ENV: 'production' },
    stdio: 'pipe'
  });
  try {
    await waitForServer(PROD_PORT);
    const pInfo = await fetch(`http://127.0.0.1:${PROD_PORT}/api/server-info`).then((r) => r.json());
    assert(Array.isArray(pInfo.lanUrls) && pInfo.lanUrls.length === 0, `Prod /api/server-info leaked lanUrls: ${JSON.stringify(pInfo.lanUrls)}`);
    const pw = await wsConnect(`ws://127.0.0.1:${PROD_PORT}/ws`);
    pw.sendJson({ type: 'HELLO', profile: { nickname: 'ProdUser', tag: '#99', elo: 1200 } });
    const pWel = await pw.waitFor((m) => m.type === 'WELCOME', 4000, 'prod WELCOME');
    assert(Array.isArray(pWel.lanUrls) && pWel.lanUrls.length === 0 && pWel.deploymentMode === 'production', `Prod WELCOME leaked lanUrls: ${JSON.stringify(pWel)}`);
    pw.sendJson({ type: 'CREATE_ROOM', matchFormat: '1v1' });
    const pRoom = await pw.waitFor((m) => m.type === 'ROOM_CREATED', 4000, 'prod ROOM_CREATED');
    assert(Array.isArray(pRoom.lanUrls) && pRoom.lanUrls.length === 0, `Prod ROOM_CREATED leaked lanUrls: ${JSON.stringify(pRoom.lanUrls)}`);
    pw.close();
    console.log('[PASS] Production deployment mode: lanUrls === [] across /api/server-info, WELCOME, ROOM_CREATED');
  } finally {
    prodSrv.kill();
  }
}

class CdpTab {
  constructor(name, wsUrl) {
    this.name = name;
    this.wsUrl = wsUrl;
    this.nextId = 1;
    this.pending = new Map();
    this.pageErrors = [];
    this.consoleErrors = [];
    this.ws = null;
  }

  async connect() {
    this.ws = new WebSocket(this.wsUrl);
    await new Promise((res, rej) => {
      this.ws.addEventListener('open', res);
      this.ws.addEventListener('error', rej);
    });
    this.ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const p = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) p.reject(new Error(`${this.name} CDP error: ${msg.error.message}`));
        else p.resolve(msg.result);
      } else if (msg.method === 'Runtime.exceptionThrown') {
        const txt = msg.params.exceptionDetails.text + ' ' + (msg.params.exceptionDetails.exception?.description || '');
        this.pageErrors.push(txt);
      } else if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
        this.consoleErrors.push(msg.params.args.map((a) => a.value || a.description).join(' '));
      }
    });
    await this.send('Page.enable');
    await this.send('Runtime.enable');
    await this.setViewport(1440, 900, false);
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.nextId++;
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async setViewport(width, height, mobile = false) {
    await this.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile });
    await sleep(120);
  }

  async goto(url) {
    await this.send('Page.navigate', { url });
    await this.waitUntil(`document.readyState === 'complete' && Boolean(window.bvnUI && window.netplay)`, 8000, 'page boot');
  }

  async eval(expression) {
    const r = await this.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true, userGesture: true });
    if (r.exceptionDetails) throw new Error(`${this.name} eval exception: ${JSON.stringify(r.exceptionDetails)}`);
    return r.result ? r.result.value : undefined;
  }

  async waitUntil(predicateJs, timeoutMs = 8000, label = 'condition') {
    const deadline = Date.now() + timeoutMs;
    let lastVal = null;
    while (Date.now() < deadline) {
      try {
        lastVal = await this.eval(`Boolean(${predicateJs})`);
        if (lastVal) return true;
      } catch (_) {}
      await sleep(120);
    }
    throw new Error(`${this.name} waitUntil timeout (${label}): ${predicateJs}`);
  }

  async screenshot(filename) {
    if (!SCREENSHOT_DIR) return null;
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    const outPath = path.join(SCREENSHOT_DIR, filename);
    fs.writeFileSync(outPath, Buffer.from(res.data, 'base64'));
    console.log(`[SCREENSHOT] ${outPath}`);
    return outPath;
  }

  close() {
    try { this.ws && this.ws.close(); } catch (_) {}
  }
}

async function createIsolatedTab(browserSend, dbgPort, name) {
  const { browserContextId } = await browserSend('Target.createBrowserContext');
  const { targetId } = await browserSend('Target.createTarget', { url: 'about:blank', browserContextId });
  await sleep(150);
  const targets = await fetch(`http://127.0.0.1:${dbgPort}/json`).then((r) => r.json());
  const target = targets.find((t) => t.id === targetId);
  assert(target && target.webSocketDebuggerUrl, `Could not find CDP target for ${name}`);
  const tab = new CdpTab(name, target.webSocketDebuggerUrl);
  await tab.connect();
  return { tab, browserContextId, targetId };
}

async function checkResponsiveNoHorizontalOverflow(tab, label, selectorList) {
  const viewports = [
    { w: 1440, h: 900, mobile: false },
    { w: 1280, h: 720, mobile: false },
    { w: 390, h: 844, mobile: true }
  ];
  for (const vp of viewports) {
    await tab.setViewport(vp.w, vp.h, vp.mobile);
    const m = await tab.eval(`(() => {
      const doc = document.documentElement;
      const sels = ${JSON.stringify(selectorList)};
      const controls = sels.map((s) => {
        const el = document.querySelector(s);
        if (!el) return { s, found: false };
        const r = el.getBoundingClientRect();
        return { s, found: true, w: Math.round(r.width), h: Math.round(r.height), right: Math.round(r.right), left: Math.round(r.left) };
      });
      return {
        scrollW: doc.scrollWidth,
        clientW: doc.clientWidth,
        controls
      };
    })()`);
    assert(m.scrollW <= m.clientW + 1, `Horizontal overflow on ${label} @ ${vp.w}x${vp.h}: scrollW=${m.scrollW} > clientW=${m.clientW}`);
    for (const c of m.controls) {
      assert(c.found && c.w > 0 && c.h > 0, `Control ${c.s} missing/hidden on ${label} @ ${vp.w}x${vp.h}: ${JSON.stringify(c)}`);
      assert(c.right <= vp.w + 2 && c.left >= -2, `Control ${c.s} clipped horizontally on ${label} @ ${vp.w}x${vp.h}: ${JSON.stringify(c)}`);
    }
  }
  await tab.setViewport(1440, 900, false);
  console.log(`[PASS] Responsive layout (${label}): 1440x900, 1280x720, 390x844 zero horizontal overflow & controls visible`);
}

async function testTwoBrowserRoomE2E() {
  assert(CHROME_PATH, 'Chrome/Edge executable not found');
  const tmpProfile = fs.mkdtempSync(path.join(os.tmpdir(), 'bvn-room-qa-'));
  const dbgPort = 9239;
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    '--disable-gpu',
    '--window-size=1440,900',
    `--remote-debugging-port=${dbgPort}`,
    `--user-data-dir=${tmpProfile}`,
    'about:blank'
  ], { stdio: 'ignore' });

  let versionInfo = null;
  for (let i = 0; i < 30; i++) {
    try {
      versionInfo = await fetch(`http://127.0.0.1:${dbgPort}/json/version`).then((r) => r.json());
      if (versionInfo && versionInfo.webSocketDebuggerUrl) break;
    } catch (_) {}
    await sleep(250);
  }
  assert(versionInfo && versionInfo.webSocketDebuggerUrl, 'Chrome browser CDP failed to start');

  const browserWs = new WebSocket(versionInfo.webSocketDebuggerUrl);
  const bPending = new Map();
  let bId = 1;
  await new Promise((res, rej) => {
    browserWs.addEventListener('open', res);
    browserWs.addEventListener('error', rej);
  });
  browserWs.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && bPending.has(msg.id)) {
      const p = bPending.get(msg.id);
      bPending.delete(msg.id);
      if (msg.error) p.reject(new Error(msg.error.message));
      else p.resolve(msg.result);
    }
  });
  const browserSend = (method, params = {}) => new Promise((resolve, reject) => {
    const id = bId++;
    bPending.set(id, { resolve, reject });
    browserWs.send(JSON.stringify({ id, method, params }));
  });

  const hostCtx = await createIsolatedTab(browserSend, dbgPort, 'HostTab');
  const guestCtx = await createIsolatedTab(browserSend, dbgPort, 'GuestTab');
  const host = hostCtx.tab;
  const guest = guestCtx.tab;
  const baseUrl = `http://127.0.0.1:${PORT}`;

  try {
    // 1. Host boots -> Menu -> Online Lobby Hub
    await host.goto(`${baseUrl}/`);
    await host.waitUntil(`window.netplay.connected === true`, 6000, 'Host WS connected');

    // Verify menu subtitle has no LAN-only copy
    const menuSub = await host.eval(`document.querySelector('[data-menu-action="ONLINE_PVP"] small')?.textContent || ''`);
    assert(!/LAN/i.test(menuSub), `Menu ONLINE_PVP subtitle still mentions LAN: ${menuSub}`);

    await host.eval(`document.querySelector('[data-menu-action="ONLINE_PVP"]').click()`);
    await host.waitUntil(`document.querySelector('.bvn-screen.active')?.id === 'screenLobby'`, 4000, 'Host screenLobby');

    const hubState = await host.eval(`({
      hubVisible: !document.getElementById('lobbyHubView').classList.contains('hidden'),
      roomHidden: document.getElementById('lobbyRoomView').classList.contains('hidden'),
      connBannerHidden: document.getElementById('lobbyConnBanner').classList.contains('hidden'),
      pillOnline: document.getElementById('netStatusPill').classList.contains('online'),
      hasDevJargon: /node server\\.js|WEBSOCKET REALTIME/i.test(document.getElementById('screenLobby').innerText)
    })`);
    assert(hubState.hubVisible && hubState.roomHidden && hubState.connBannerHidden && hubState.pillOnline && !hubState.hasDevJargon, `Lobby hub check failed: ${JSON.stringify(hubState)}`);
    await host.screenshot('room_01_lobby_hub.png');

    // Responsive check on Lobby Hub
    await checkResponsiveNoHorizontalOverflow(host, 'Lobby Hub', ['#btnCreateRoom', '#btnQuickMatch', '#btnJoinRoomByCode', '#openRoomsList']);

    // 2. Host creates a password-protected public 3v3 room
    await host.eval(`(() => {
      document.getElementById('inputLobbyRoomName').value = 'Giải Đấu BVN 3v3';
      document.getElementById('inputLobbyRoomPassword').value = 'bvn2026';
      document.querySelector('[data-lobby-format="3v3"]').click();
      document.querySelector('[data-lobby-visibility="public"]').click();
      document.getElementById('btnCreateRoom').click();
    })()`);
    await host.waitUntil(`!document.getElementById('lobbyRoomView').classList.contains('hidden')`, 5000, 'Host staging room visible');

    const staging1 = await host.eval(`({
      hubHidden: document.getElementById('lobbyHubView').classList.contains('hidden'),
      code: document.getElementById('roomStageCode').textContent.trim(),
      name: document.getElementById('roomStageName').textContent.trim(),
      fmtBadge: document.getElementById('roomStageFormatBadge').textContent.trim(),
      lockVisible: !document.getElementById('roomStageLockBadge').classList.contains('hidden'),
      inviteUrl: document.getElementById('roomInviteUrlInput').value,
      p2EmptyVisible: !document.getElementById('roomP2Empty').classList.contains('hidden'),
      startDisabled: document.getElementById('btnStartRoomMatch').disabled,
      topPillVisible: !document.getElementById('activeRoomPill').classList.contains('hidden'),
      topPillCode: document.getElementById('topRoomCode').textContent.trim()
    })`);
    assert(/^[A-Z0-9]{6}$/.test(staging1.code), `Invalid staging room code: ${staging1.code}`);
    assert(staging1.hubHidden && staging1.name === 'Giải Đấu BVN 3v3' && staging1.fmtBadge === '3V3' && staging1.lockVisible, `Staging header mismatch: ${JSON.stringify(staging1)}`);
    assert(staging1.inviteUrl.includes(`?room=${staging1.code}`), `Invite URL missing ?room=CODE: ${staging1.inviteUrl}`);
    assert(staging1.p2EmptyVisible && staging1.startDisabled && staging1.topPillVisible && staging1.topPillCode === staging1.code, `Staging waiting state mismatch: ${JSON.stringify(staging1)}`);

    // Copy Code + Copy Link buttons work cleanly with feedback
    await host.eval(`document.getElementById('btnCopyRoomCode').click()`);
    await sleep(150);
    await host.eval(`document.getElementById('btnCopyInviteLink').click()`);
    await sleep(150);
    const noticeAfterCopy = await host.eval(`document.getElementById('lobbyNoticeMsg').textContent.trim()`);
    assert(noticeAfterCopy.length > 0, 'Copy link/code did not display feedback notice');

    await host.screenshot('room_02_staging_waiting.png');

    // Responsive check on Staging Room (waiting)
    await checkResponsiveNoHorizontalOverflow(host, 'Staging Room', ['#btnCopyRoomCode', '#btnCopyInviteLink', '#btnLeaveRoomStage', '#roomSlotP1', '#roomSlotP2']);

    // 3. Guest opens ?room=CODE invite URL -> Password Modal -> Wrong Password -> Right Password -> 2/2 Staging Sync
    await guest.goto(`${baseUrl}/?room=${staging1.code}`);
    await guest.waitUntil(`!document.getElementById('modalRoomPassword').classList.contains('hidden')`, 6000, 'Guest password modal open');
    const modalCode = await guest.eval(`document.getElementById('pwdModalRoomCode').textContent.trim()`);
    const modalErrInitiallyHidden = await guest.eval(`document.getElementById('pwdModalError').classList.contains('hidden')`);
    assert(modalCode === staging1.code, `Password modal code mismatch: ${modalCode} !== ${staging1.code}`);
    assert(modalErrInitiallyHidden, 'Password modal should NOT show red error alert on initial open before user input');
    await guest.screenshot('room_03_password_modal.png');

    // Wrong password shows inline error
    await guest.eval(`(() => {
      document.getElementById('inputRoomModalPassword').value = 'wrong999';
      document.getElementById('btnConfirmRoomPassword').click();
    })()`);
    await guest.waitUntil(`!document.getElementById('pwdModalError').classList.contains('hidden')`, 4000, 'Wrong password error visible');
    const wrongErrText = await guest.eval(`document.getElementById('pwdModalError').textContent.trim()`);
    assert(wrongErrText.length > 0, 'Empty wrong-password error message');

    // Right password joins room & cleans ?room= from URL
    await guest.eval(`(() => {
      document.getElementById('inputRoomModalPassword').value = 'bvn2026';
      document.getElementById('btnConfirmRoomPassword').click();
    })()`);
    await guest.waitUntil(`!document.getElementById('lobbyRoomView').classList.contains('hidden') && document.getElementById('modalRoomPassword').classList.contains('hidden')`, 5000, 'Guest entered staging room');
    await host.waitUntil(`!document.getElementById('roomP2Filled').classList.contains('hidden')`, 5000, 'Host sees Guest P2 filled');

    const sync2P = await host.eval(`({
      p2Filled: !document.getElementById('roomP2Filled').classList.contains('hidden'),
      p2ReadyText: document.getElementById('roomP2ReadyBadge').textContent.trim(),
      kickVisible: !document.getElementById('btnKickGuest').classList.contains('hidden'),
      startDisabled: document.getElementById('btnStartRoomMatch').disabled
    })`);
    const guestUrlAfterJoin = await guest.eval(`window.location.search`);
    assert(sync2P.p2Filled && sync2P.kickVisible && sync2P.startDisabled, `2P pre-ready sync failed: ${JSON.stringify(sync2P)}`);
    assert(!guestUrlAfterJoin.includes('room='), `?room= not cleaned from URL after join: ${guestUrlAfterJoin}`);

    // Guest toggles Ready -> Host Start Match becomes enabled -> Automatic 4s ping updates online badge -> Screenshot -> Start -> Both enter screenSelect!
    await guest.eval(`document.getElementById('btnToggleReady').click()`);
    await host.waitUntil(`document.getElementById('btnStartRoomMatch').disabled === false`, 5000, 'Host Start Match enabled');
    await guest.waitUntil(`document.getElementById('roomP2ReadyBadge').classList.contains('ready')`, 5000, 'Guest sees own Ready badge');
    await host.waitUntil(`document.getElementById('lobbyOnlineBadge').textContent.includes('2')`, 6500, 'Host lobbyOnlineBadge synced to 2 online via heartbeat');
    await host.screenshot('room_04_staging_2p_ready.png');

    await host.eval(`document.getElementById('btnStartRoomMatch').click()`);
    await host.waitUntil(`document.querySelector('.bvn-screen.active')?.id === 'screenSelect'`, 5000, 'Host transitioned to screenSelect');
    await guest.waitUntil(`document.querySelector('.bvn-screen.active')?.id === 'screenSelect'`, 5000, 'Guest transitioned to screenSelect');

    console.log('[PASS] 2-Tab Browser E2E: Create locked room -> ?room=CODE password modal (wrong/right) -> 2/2 staging -> Ready -> START_MATCH -> Character Select');

    // 4. Open ?room=CODE auto-join (no password) + Host Kick Guest + Invalid ?room=ZZZZZZ
    await host.goto(`${baseUrl}/`);
    await host.waitUntil(`window.netplay.connected === true`, 6000, 'Host reconnect');
    await host.eval(`document.querySelector('[data-menu-action="ONLINE_PVP"]').click()`);
    await host.waitUntil(`!document.getElementById('lobbyHubView').classList.contains('hidden')`, 4000, 'Host back in Lobby Hub');
    await host.eval(`(() => {
      document.getElementById('inputLobbyRoomName').value = 'Phòng Mở Nhanh';
      document.getElementById('inputLobbyRoomPassword').value = '';
      document.querySelector('[data-lobby-format="1v1"]').click();
      document.querySelector('[data-lobby-visibility="public"]').click();
      document.getElementById('btnCreateRoom').click();
    })()`);
    await host.waitUntil(`!document.getElementById('lobbyRoomView').classList.contains('hidden')`, 5000, 'Host open room created');
    const openCode = await host.eval(`document.getElementById('roomStageCode').textContent.trim()`);

    await guest.goto(`${baseUrl}/?room=${openCode}`);
    await guest.waitUntil(`!document.getElementById('lobbyRoomView').classList.contains('hidden')`, 6000, 'Guest auto-joined open room');
    await host.waitUntil(`!document.getElementById('roomP2Filled').classList.contains('hidden')`, 5000, 'Host sees open room guest');

    // Host kicks Guest -> Guest returns to Hub, Host stays in Waiting Room
    await host.eval(`document.getElementById('btnKickGuest').click()`);
    await guest.waitUntil(`!document.getElementById('lobbyHubView').classList.contains('hidden') && document.getElementById('lobbyRoomView').classList.contains('hidden')`, 5000, 'Kicked guest returned to Hub');
    await host.waitUntil(`!document.getElementById('roomP2Empty').classList.contains('hidden') && !document.getElementById('lobbyRoomView').classList.contains('hidden')`, 5000, 'Host remained in staging waiting after kick');

    // Invalid invite link shows Vietnamese error cleanly
    await guest.goto(`${baseUrl}/?room=ZZZZZZ`);
    await guest.waitUntil(`document.querySelector('.bvn-screen.active')?.id === 'screenLobby' && !document.getElementById('lobbyErrorMsg').classList.contains('hidden')`, 6000, 'Invalid ?room=ZZZZZZ error visible');

    console.log('[PASS] 2-Tab Browser E2E: Open ?room=CODE auto-join, Host Kick Guest recovery, Invalid ?room=ZZZZZZ error');

    // 5. Strict 0 console errors & 0 uncaught exceptions across both tabs
    assert(host.pageErrors.length === 0 && host.consoleErrors.length === 0, `HostTab errors: page=${JSON.stringify(host.pageErrors)} console=${JSON.stringify(host.consoleErrors)}`);
    assert(guest.pageErrors.length === 0 && guest.consoleErrors.length === 0, `GuestTab errors: page=${JSON.stringify(guest.pageErrors)} console=${JSON.stringify(guest.consoleErrors)}`);
    console.log('[PASS] Strict Browser Gate: 0 console errors & 0 uncaught exceptions across both tabs');
  } finally {
    host.close();
    guest.close();
    try { await browserSend('Target.disposeBrowserContext', { browserContextId: hostCtx.browserContextId }); } catch (_) {}
    try { await browserSend('Target.disposeBrowserContext', { browserContextId: guestCtx.browserContextId }); } catch (_) {}
    try { browserWs.close(); } catch (_) {}
    chrome.kill();
    try { fs.rmSync(tmpProfile, { recursive: true, force: true }); } catch (_) {}
  }
}

(async () => {
  const srv = spawn(process.execPath, [path.join(ROOT, 'ws-server.js')], {
    env: { ...process.env, PORT: String(PORT) },
    stdio: 'pipe'
  });
  let srvStderr = '';
  srv.stderr.on('data', (d) => { srvStderr += d.toString(); });

  try {
    await waitForServer(PORT);
    await testHttpAndWsProtocol();
    await testTwoBrowserRoomE2E();
    console.log('=== ALL ROOM FLOW VERIFICATION CHECKS PASSED (100%) ===');
  } finally {
    srv.kill();
    if (srvStderr.trim()) console.error('[SERVER STDERR]', srvStderr.trim());
  }
})().catch((err) => {
  console.error('[FAIL]', err);
  process.exit(1);
});
