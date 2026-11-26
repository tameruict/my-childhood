// language: JavaScript, file: server.js, target: Node.js (>=18) Zero-Dependency Static + Hardened RFC 6455 WebSocket Multiplayer Server
// Run: node server.js -> http://localhost:8080 (supports Local Dev + Render Free Production WebSocket /ws)

'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const PORT = Number(process.env.PORT || 8080);
const HOST = process.env.HOST || '0.0.0.0';
const ROOT = path.resolve(__dirname);
const IS_PROD = process.env.NODE_ENV === 'production' || Boolean(process.env.RENDER);
const DEPLOYMENT_MODE = IS_PROD ? 'production' : 'local';

const ALLOWED_ORIGINS = String(process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const MAX_CLIENTS = Number(process.env.WS_MAX_CLIENTS || 500);
const MAX_ROOMS = Number(process.env.WS_MAX_ROOMS || 200);
const MAX_FRAME_BYTES = 64 * 1024;          // 64 KB max WS message
const MAX_BUFFER_BYTES = 128 * 1024;        // 128 KB max per-socket ingress buffer
const MAX_WRITE_QUEUE_DROP_SNAP = 64 * 1024;
const MAX_WRITE_QUEUE_CLOSE = 512 * 1024;

const HEARTBEAT_INTERVAL_MS = Number(process.env.WS_HEARTBEAT_MS || 25000);
const DEAD_PEER_TIMEOUT_MS = Number(process.env.WS_DEAD_TIMEOUT_MS || 60000);
const STALE_ROOM_WAITING_MS = Number(process.env.ROOM_STALE_WAITING_MS || 30 * 60 * 1000);
const STALE_ROOM_MATCH_MS = Number(process.env.ROOM_STALE_MATCH_MS || 2 * 60 * 60 * 1000);
const ROOM_LIST_DEBOUNCE_MS = 100;

const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // Unambiguous (no 0/O/1/I/L)
const CODE_REGEX = /^[A-Z0-9]{4,8}$/;
const WS_GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav'
};

// ==================== HELPERS: SANITIZATION, SECURITY & RATE LIMITS ====================

function isPrivateLanIpv4(addr) {
  if (addr.startsWith('192.168.') || addr.startsWith('10.')) return true;
  if (addr.startsWith('172.')) {
    const second = Number(addr.split('.')[1]);
    return second >= 16 && second <= 31;
  }
  return false;
}

function getLanUrls() {
  if (IS_PROD) return [];
  const preferred = [];
  const others = [];
  const seen = new Set();
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const net of ifaces[name] || []) {
      if (net.family !== 'IPv4' || net.internal || !net.address) continue;
      const addr = net.address;
      if (addr.startsWith('169.254.') || addr.startsWith('127.') || addr === '0.0.0.0') continue;
      if (seen.has(addr)) continue;
      seen.add(addr);
      const url = `http://${addr}:${PORT}`;
      if (isPrivateLanIpv4(addr)) {
        preferred.push(url);
      } else {
        others.push(url);
      }
    }
  }
  // Prefer 192.168.x.x first, then other RFC1918, then remaining non-link-local IPv4
  preferred.sort((a, b) => (b.startsWith('http://192.168.') ? 1 : 0) - (a.startsWith('http://192.168.') ? 1 : 0));
  return preferred.concat(others);
}

function isOriginAllowed(origin) {
  if (!ALLOWED_ORIGINS.length || !origin) return true;
  return ALLOWED_ORIGINS.includes(origin);
}

function getCorsHeaders(req) {
  const origin = req.headers.origin;
  const headers = {
    'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
  if (!ALLOWED_ORIGINS.length) {
    headers['Access-Control-Allow-Origin'] = '*';
  } else if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Vary'] = 'Origin';
  }
  return headers;
}

function getClientIp(req, socket) {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.trim()) {
    return xff.split(',')[0].trim();
  }
  return (socket && socket.remoteAddress) || 'unknown';
}

function stripControlChars(value) {
  if (value === undefined || value === null) return '';
  return String(value)
    .replace(/[\x00-\x1F\x7F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function sanitizeProfile(raw, fallbackName = 'Fighter', fallbackTag = '#0000') {
  const src = raw && typeof raw === 'object' ? raw : {};
  const nickname = stripControlChars(src.nickname).slice(0, 18) || fallbackName;
  const tagRaw = stripControlChars(src.tag).slice(0, 8);
  const tag = tagRaw || fallbackTag;
  const eloNum = Number(src.elo);
  const elo = Number.isFinite(eloNum) ? Math.max(100, Math.min(9999, Math.round(eloNum))) : 1200;
  return { nickname, tag, elo };
}

function normalizeFormat(fmt) {
  return fmt === '3v3' ? '3v3' : '1v1';
}

function normalizeVisibility(vis) {
  return vis === 'private' ? 'private' : 'public';
}

function sanitizeRoomName(rawName, hostNickname) {
  const cleaned = stripControlChars(rawName).slice(0, 32);
  if (cleaned) return cleaned;
  return `Phòng của ${hostNickname || 'Fighter'}`.slice(0, 32);
}

function sanitizePassword(raw) {
  if (raw === undefined || raw === null) return null;
  return String(raw)
    .replace(/[\x00-\x1F\x7F]/g, '')
    .trim()
    .slice(0, 24);
}

function normalizeCodeInput(raw) {
  if (raw === undefined || raw === null) return '';
  return String(raw).trim().toUpperCase();
}

function hashPassword(plain, salt) {
  return crypto.createHmac('sha256', salt).update(plain, 'utf8').digest();
}

function verifyPassword(plain, salt, expectedHash) {
  if (!salt || !expectedHash) return false;
  const actual = hashPassword(plain, salt);
  if (actual.length !== expectedHash.length) return false;
  return crypto.timingSafeEqual(actual, expectedHash);
}

function checkWindowLimit(buckets, key, limit, windowMs, now = Date.now()) {
  let list = buckets.get(key);
  if (!list) {
    list = [];
    buckets.set(key, list);
  }
  const cutoff = now - windowMs;
  while (list.length > 0 && list[0] <= cutoff) {
    list.shift();
  }
  if (list.length >= limit) {
    return false;
  }
  list.push(now);
  return true;
}

// ==================== HARDENED RFC 6455 WEBSOCKET ENGINE (ZERO DEPS) ====================

function encodeWsFrame(payloadBuf, opcode = 0x1) {
  const len = payloadBuf.length;
  let header;
  if (len < 126) {
    header = Buffer.allocUnsafe(2);
    header[0] = 0x80 | opcode;
    header[1] = len;
  } else if (len < 65536) {
    header = Buffer.allocUnsafe(4);
    header[0] = 0x80 | opcode;
    header[1] = 126;
    header.writeUInt16BE(len, 2);
  } else {
    header = Buffer.allocUnsafe(10);
    header[0] = 0x80 | opcode;
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(len), 2);
  }
  return Buffer.concat([header, payloadBuf]);
}

function encodeCloseFrame(code = 1000, reason = '') {
  const reasonBuf = reason ? Buffer.from(reason, 'utf8').subarray(0, 123) : Buffer.alloc(0);
  const payload = Buffer.allocUnsafe(2 + reasonBuf.length);
  payload.writeUInt16BE(code, 0);
  if (reasonBuf.length) reasonBuf.copy(payload, 2);
  return encodeWsFrame(payload, 0x8);
}

class WsClient {
  constructor(socket, remoteIp) {
    this.id = 'p_' + crypto.randomBytes(4).toString('hex');
    this.socket = socket;
    this.remoteIp = remoteIp;
    this.buffer = Buffer.alloc(0);
    this.fragChunks = null;
    this.fragBytes = 0;
    this.closed = false;
    this.lastSeenAt = Date.now();
    this.roomCode = null;
    this.slot = 0; // 1 = Host (P1), 2 = Guest (P2)
    this.profile = { nickname: 'Fighter', tag: '#0000', elo: 1200 };
    this.matchFormat = '1v1';
    this.inQuickQueue = false;
    this.rateBuckets = new Map();
  }

  sendFrame(frameBuf, droppable = false) {
    if (this.closed || this.socket.destroyed) return false;
    const queued = this.socket.writableLength || 0;
    if (queued > MAX_WRITE_QUEUE_CLOSE) {
      this.close(1008, 'Backpressure exceeded');
      return false;
    }
    if (droppable && queued > MAX_WRITE_QUEUE_DROP_SNAP) {
      return false;
    }
    try {
      this.socket.write(frameBuf);
      return true;
    } catch (_) {
      return false;
    }
  }

  send(obj, droppable = false) {
    if (this.closed || this.socket.destroyed) return false;
    try {
      const payload = Buffer.from(JSON.stringify(obj), 'utf8');
      return this.sendFrame(encodeWsFrame(payload, 0x1), droppable);
    } catch (_) {
      return false;
    }
  }

  sendError(code, message, roomCode) {
    const payload = { type: 'ERROR', code, message };
    if (roomCode) payload.roomCode = roomCode;
    return this.send(payload);
  }

  sendPing() {
    return this.sendFrame(encodeWsFrame(Buffer.from('hb'), 0x9));
  }

  sendPong(data) {
    const buf = data && data.length <= 125 ? data : Buffer.alloc(0);
    return this.sendFrame(encodeWsFrame(buf, 0xA));
  }

  close(code = 1000, reason = '') {
    if (this.closed) return;
    this.closed = true;
    try {
      if (!this.socket.destroyed) {
        this.socket.write(encodeCloseFrame(code, reason));
        this.socket.end();
      }
    } catch (_) {}
    setTimeout(() => {
      try {
        if (!this.socket.destroyed) this.socket.destroy();
      } catch (_) {}
    }, 1000).unref();
  }

  destroy() {
    this.closed = true;
    try {
      if (!this.socket.destroyed) this.socket.destroy();
    } catch (_) {}
  }

  allowAction(bucket, limit, windowMs) {
    return checkWindowLimit(this.rateBuckets, bucket, limit, windowMs);
  }
}

function parseWsFrames(client, onMessage) {
  while (!client.closed && client.buffer.length >= 2) {
    const b0 = client.buffer[0];
    const b1 = client.buffer[1];
    const fin = (b0 & 0x80) !== 0;
    const rsv = b0 & 0x70;
    const opcode = b0 & 0x0f;
    const masked = (b1 & 0x80) !== 0;
    let payloadLen = b1 & 0x7f;
    let offset = 2;

    if (rsv !== 0 || !masked) {
      client.close(1002, 'Protocol error');
      return;
    }

    const isControl = opcode >= 0x8;
    if (isControl && (!fin || payloadLen > 125)) {
      client.close(1002, 'Invalid control frame');
      return;
    }

    if (payloadLen === 126) {
      if (client.buffer.length < 4) return;
      payloadLen = client.buffer.readUInt16BE(2);
      offset = 4;
    } else if (payloadLen === 127) {
      if (client.buffer.length < 10) return;
      const bigLen = client.buffer.readBigUInt64BE(2);
      if (bigLen > BigInt(MAX_FRAME_BYTES)) {
        client.close(1009, 'Message too big');
        return;
      }
      payloadLen = Number(bigLen);
      offset = 10;
    }

    if (payloadLen > MAX_FRAME_BYTES) {
      client.close(1009, 'Message too big');
      return;
    }

    const totalLen = offset + 4 + payloadLen;
    if (client.buffer.length < totalLen) return;

    const maskKey = client.buffer.subarray(offset, offset + 4);
    const rawPayload = client.buffer.subarray(offset + 4, totalLen);
    const payload = Buffer.allocUnsafe(payloadLen);
    for (let i = 0; i < payloadLen; i++) {
      payload[i] = rawPayload[i] ^ maskKey[i & 3];
    }

    client.buffer = totalLen === client.buffer.length
      ? Buffer.alloc(0)
      : Buffer.from(client.buffer.subarray(totalLen));

    client.lastSeenAt = Date.now();

    if (opcode === 0x8) {
      client.close(1000, 'Normal closure');
      return;
    }
    if (opcode === 0x9) {
      client.sendPong(payload);
      continue;
    }
    if (opcode === 0xA) {
      continue;
    }

    if (opcode === 0x2) {
      client.close(1003, 'Binary frames unsupported');
      return;
    }

    let completeTextBuf = null;
    if (opcode === 0x1) {
      if (client.fragChunks !== null) {
        client.close(1002, 'Unexpected text frame during fragmentation');
        return;
      }
      if (fin) {
        completeTextBuf = payload;
      } else {
        client.fragChunks = [payload];
        client.fragBytes = payload.length;
      }
    } else if (opcode === 0x0) {
      if (client.fragChunks === null) {
        client.close(1002, 'Unexpected continuation frame');
        return;
      }
      client.fragBytes += payload.length;
      if (client.fragBytes > MAX_FRAME_BYTES) {
        client.fragChunks = null;
        client.fragBytes = 0;
        client.close(1009, 'Fragmented message too big');
        return;
      }
      client.fragChunks.push(payload);
      if (fin) {
        completeTextBuf = Buffer.concat(client.fragChunks, client.fragBytes);
        client.fragChunks = null;
        client.fragBytes = 0;
      }
    } else {
      client.close(1002, 'Unsupported opcode');
      return;
    }

    if (completeTextBuf !== null) {
      let msg;
      try {
        msg = JSON.parse(completeTextBuf.toString('utf8'));
      } catch (_) {
        if (client.allowAction('malformed', 5, 5000)) {
          client.sendError('INVALID_INPUT', 'Dữ liệu JSON không hợp lệ.');
        }
        continue;
      }
      if (!msg || typeof msg !== 'object' || Array.isArray(msg)) {
        if (client.allowAction('malformed', 5, 5000)) {
          client.sendError('INVALID_INPUT', 'Gói tin không hợp lệ.');
        }
        continue;
      }
      onMessage(msg);
    }
  }
}

// ==================== MULTIPLAYER ROOM & MATCHMAKING STATE ====================

const clients = new Set();
const rooms = new Map(); // code -> Room
const quickQueue = [];   // WsClient[]
let broadcastTimer = null;

function genRoomCode(len = 6) {
  for (let attempt = 0; attempt < 64; attempt++) {
    let code = '';
    for (let i = 0; i < len; i++) {
      code += CODE_ALPHABET[crypto.randomInt(0, CODE_ALPHABET.length)];
    }
    if (!rooms.has(code)) return code;
  }
  return genRoomCode(len + 1);
}

function serializePlayerSlot(client, ready) {
  if (!client) return null;
  return {
    id: client.id,
    nickname: client.profile.nickname,
    tag: client.profile.tag,
    elo: client.profile.elo,
    ready: Boolean(ready)
  };
}

function serializeRoomSummary(room) {
  return {
    code: room.code,
    name: room.name,
    matchFormat: room.matchFormat,
    visibility: room.visibility,
    hasPassword: room.hasPassword,
    status: room.status,
    hostSlot: 1,
    p1: serializePlayerSlot(room.p1, room.p1Ready),
    p2: serializePlayerSlot(room.p2, room.p2Ready),
    createdAt: room.createdAt,
    updatedAt: room.updatedAt
  };
}

function serializePublicRoom(room) {
  return {
    code: room.code,
    name: room.name,
    hostName: room.p1.profile.nickname,
    hostTag: room.p1.profile.tag,
    hostElo: room.p1.profile.elo,
    matchFormat: room.matchFormat,
    visibility: 'public',
    hasPassword: room.hasPassword,
    players: 1,
    maxPlayers: 2,
    status: 'waiting',
    createdAt: room.createdAt
  };
}

function serializeRoomLookup(room) {
  return {
    code: room.code,
    name: room.name,
    hostName: room.p1.profile.nickname,
    hostTag: room.p1.profile.tag,
    hostElo: room.p1.profile.elo,
    matchFormat: room.matchFormat,
    visibility: room.visibility,
    hasPassword: room.hasPassword,
    players: room.p2 && !room.p2.closed ? 2 : 1,
    maxPlayers: 2,
    status: room.status,
    createdAt: room.createdAt
  };
}

function getPublicRoomList(filterFormat) {
  const list = [];
  for (const r of rooms.values()) {
    if (
      r.visibility === 'public' &&
      !r.isQuickMatch &&
      r.status === 'waiting' &&
      r.p1 &&
      !r.p1.closed &&
      !r.p2
    ) {
      if (filterFormat && (filterFormat === '1v1' || filterFormat === '3v3') && r.matchFormat !== filterFormat) {
        continue;
      }
      list.push(serializePublicRoom(r));
    }
  }
  return list.sort((a, b) => b.createdAt - a.createdAt).slice(0, 30);
}

function flushBroadcastRoomList() {
  broadcastTimer = null;
  const list = getPublicRoomList();
  const payload = Buffer.from(
    JSON.stringify({ type: 'ROOMS_LIST', rooms: list, onlineCount: clients.size }),
    'utf8'
  );
  const frame = encodeWsFrame(payload, 0x1);
  for (const c of clients) {
    if (!c.closed && !c.roomCode && !c.inQuickQueue) {
      c.sendFrame(frame);
    }
  }
}

function scheduleBroadcastRoomList() {
  if (broadcastTimer) return;
  broadcastTimer = setTimeout(flushBroadcastRoomList, ROOM_LIST_DEBOUNCE_MS);
  if (broadcastTimer.unref) broadcastTimer.unref();
}

function removeFromQuickQueue(client) {
  const idx = quickQueue.indexOf(client);
  if (idx !== -1) quickQueue.splice(idx, 1);
  client.inQuickQueue = false;
}

function pruneQuickQueue(excludeClient = null) {
  for (let i = quickQueue.length - 1; i >= 0; i--) {
    const c = quickQueue[i];
    if (!c || c.closed || !clients.has(c) || c.roomCode || !c.inQuickQueue || c === excludeClient) {
      if (c && c !== excludeClient) c.inQuickQueue = false;
      quickQueue.splice(i, 1);
    }
  }
}

function getPeer(client) {
  if (!client.roomCode) return null;
  const room = rooms.get(client.roomCode);
  if (!room) return null;
  const peer = room.p1 === client ? room.p2 : room.p2 === client ? room.p1 : null;
  return peer && !peer.closed ? peer : null;
}

function leaveRoom(client, silent = false) {
  removeFromQuickQueue(client);

  if (!client.roomCode) return;
  const code = client.roomCode;
  const room = rooms.get(code);
  client.roomCode = null;
  client.slot = 0;
  if (!room) return;

  const isP1 = room.p1 === client;
  const isP2 = room.p2 === client;
  if (!isP1 && !isP2) return;

  const now = Date.now();

  if (room.status === 'waiting') {
    rooms.delete(code);
    scheduleBroadcastRoomList();
    return;
  }

  if (room.status === 'lobby') {
    if (isP2) {
      room.p2 = null;
      room.p2Ready = false;
      room.p1Ready = true;
      room.status = 'waiting';
      room.updatedAt = now;
      room.lastActivityAt = now;

      if (room.p1 && !room.p1.closed) {
        if (!silent) {
          room.p1.send({
            type: 'ROOM_UPDATED',
            slot: 1,
            room: serializeRoomSummary(room),
            event: 'guest_left'
          });
        }
      } else {
        rooms.delete(code);
      }
      scheduleBroadcastRoomList();
      return;
    }

    // Host left during lobby -> transfer host to Guest if still alive
    if (isP1) {
      const guest = room.p2;
      if (guest && !guest.closed) {
        room.p1 = guest;
        room.p2 = null;
        room.p1Ready = true;
        room.p2Ready = false;
        room.status = 'waiting';
        room.updatedAt = now;
        room.lastActivityAt = now;
        guest.slot = 1;
        if (!silent) {
          const summary = serializeRoomSummary(room);
          guest.send({ type: 'HOST_TRANSFERRED', slot: 1, room: summary });
          guest.send({ type: 'ROOM_UPDATED', slot: 1, room: summary, event: 'host_transferred' });
        }
      } else {
        rooms.delete(code);
      }
      scheduleBroadcastRoomList();
      return;
    }
  }

  // Active match states: 'selecting' | 'playing' -> close room, notify remaining peer
  const peer = isP1 ? room.p2 : room.p1;
  room.p1 = null;
  room.p2 = null;
  rooms.delete(code);

  if (peer && !peer.closed) {
    peer.roomCode = null;
    peer.slot = 0;
    if (!silent) {
      peer.send({ type: 'PEER_LEFT', code, reason: 'Đối thủ đã rời phòng.' });
    }
  }
  scheduleBroadcastRoomList();
}

function pairQuickMatch(host, guest, matchFormat) {
  const code = genRoomCode(6);
  const now = Date.now();
  const room = {
    code,
    name: `Ghép nhanh ${matchFormat.toUpperCase()}`,
    matchFormat,
    visibility: 'private',
    passwordSalt: null,
    passwordHash: null,
    hasPassword: false,
    status: 'selecting',
    p1: host,
    p2: guest,
    p1Ready: true,
    p2Ready: true,
    isQuickMatch: true,
    createdAt: now,
    updatedAt: now,
    lastActivityAt: now
  };
  rooms.set(code, room);
  host.roomCode = code;
  host.slot = 1;
  host.matchFormat = matchFormat;
  host.inQuickQueue = false;
  guest.roomCode = code;
  guest.slot = 2;
  guest.matchFormat = matchFormat;
  guest.inQuickQueue = false;

  const summary = serializeRoomSummary(room);
  host.send({ type: 'ROOM_READY', slot: 1, room: summary });
  guest.send({ type: 'ROOM_READY', slot: 2, room: summary });
  scheduleBroadcastRoomList();
}

// ==================== WS MESSAGE ROUTER ====================

function handleWsMessage(client, msg) {
  const type = typeof msg.type === 'string' ? msg.type : '';
  if (!type) {
    client.sendError('INVALID_INPUT', 'Thiếu trường type.');
    return;
  }

  switch (type) {
    case 'PING': {
      client.send({
        type: 'PONG',
        t: msg.t,
        onlineCount: clients.size,
        serverTime: Date.now()
      });
      return;
    }

    case 'HELLO': {
      if (!client.allowAction('hello', 10, 10000)) {
        client.sendError('RATE_LIMITED', 'Gửi yêu cầu quá nhanh, vui lòng thử lại.');
        return;
      }
      if (msg.profile) {
        client.profile = sanitizeProfile(msg.profile, 'Fighter', '#0000');
      }
      client.send({
        type: 'WELCOME',
        id: client.id,
        onlineCount: clients.size,
        rooms: getPublicRoomList(),
        lanUrls: getLanUrls(),
        deploymentMode: DEPLOYMENT_MODE,
        serverTime: Date.now()
      });
      return;
    }

    case 'LIST_ROOMS': {
      if (!client.allowAction('control', 15, 5000)) {
        client.sendError('RATE_LIMITED', 'Làm mới quá nhanh, vui lòng chờ giây lát.');
        return;
      }
      const filter = msg.matchFormat === '1v1' || msg.matchFormat === '3v3' ? msg.matchFormat : null;
      client.send({
        type: 'ROOMS_LIST',
        rooms: getPublicRoomList(filter),
        onlineCount: clients.size
      });
      return;
    }

    case 'CREATE_ROOM': {
      if (!client.allowAction('control', 15, 5000)) {
        client.sendError('RATE_LIMITED', 'Tạo phòng quá nhanh, vui lòng chờ giây lát.');
        return;
      }
      if (!client.roomCode && rooms.size >= MAX_ROOMS) {
        client.sendError('SERVER_FULL', 'Máy chủ đã đạt giới hạn số phòng. Vui lòng thử lại sau.');
        return;
      }

      let code = '';
      if (msg.code !== undefined && msg.code !== null && String(msg.code).trim() !== '') {
        const reqCode = normalizeCodeInput(msg.code);
        if (!CODE_REGEX.test(reqCode)) {
          client.sendError('INVALID_CODE', 'Mã phòng phải gồm 4-8 ký tự chữ hoặc số.');
          return;
        }
        code = !rooms.has(reqCode) ? reqCode : genRoomCode(6);
      } else {
        code = genRoomCode(6);
      }

      leaveRoom(client, false);

      if (msg.profile) {
        client.profile = sanitizeProfile(msg.profile, 'Player1', '#1000');
      }

      const matchFormat = normalizeFormat(msg.matchFormat);
      const visibility = normalizeVisibility(msg.visibility);
      const rawName = msg.name !== undefined ? msg.name : msg.title;
      const name = sanitizeRoomName(rawName, client.profile.nickname);
      const pw = sanitizePassword(msg.password);

      let passwordSalt = null;
      let passwordHash = null;
      let hasPassword = false;
      if (pw && pw.length > 0) {
        passwordSalt = crypto.randomBytes(16).toString('hex');
        passwordHash = hashPassword(pw, passwordSalt);
        hasPassword = true;
      }

      const now = Date.now();
      const room = {
        code,
        name,
        matchFormat,
        visibility,
        passwordSalt,
        passwordHash,
        hasPassword,
        status: 'waiting',
        p1: client,
        p2: null,
        p1Ready: true,
        p2Ready: false,
        isQuickMatch: false,
        createdAt: now,
        updatedAt: now,
        lastActivityAt: now
      };

      rooms.set(code, room);
      client.roomCode = code;
      client.slot = 1;
      client.matchFormat = matchFormat;

      const summary = serializeRoomSummary(room);
      client.send({
        type: 'ROOM_CREATED',
        slot: 1,
        code,
        matchFormat,
        room: summary,
        lanUrls: getLanUrls()
      });
      scheduleBroadcastRoomList();
      return;
    }

    case 'UPDATE_ROOM': {
      if (!client.allowAction('control', 15, 5000)) {
        client.sendError('RATE_LIMITED', 'Thao tác quá nhanh, vui lòng chờ giây lát.');
        return;
      }
      const room = client.roomCode ? rooms.get(client.roomCode) : null;
      if (!room) {
        client.sendError('ROOM_NOT_FOUND', 'Bạn chưa ở trong phòng nào.');
        return;
      }
      if (room.p1 !== client) {
        client.sendError('NOT_HOST', 'Chỉ chủ phòng mới có thể chỉnh sửa cài đặt phòng.', room.code);
        return;
      }
      if (room.status !== 'waiting' && room.status !== 'lobby') {
        client.sendError('ROOM_IN_MATCH', 'Không thể đổi cài đặt khi trận đấu đã bắt đầu.', room.code);
        return;
      }

      if (msg.name !== undefined || msg.title !== undefined) {
        const rawName = msg.name !== undefined ? msg.name : msg.title;
        room.name = sanitizeRoomName(rawName, room.p1.profile.nickname);
      }
      if (msg.visibility !== undefined) {
        room.visibility = normalizeVisibility(msg.visibility);
      }
      if (msg.matchFormat !== undefined) {
        const nextFmt = normalizeFormat(msg.matchFormat);
        if (nextFmt !== room.matchFormat) {
          room.matchFormat = nextFmt;
          room.p1.matchFormat = nextFmt;
          if (room.p2) {
            room.p2.matchFormat = nextFmt;
            room.p2Ready = false;
          }
        }
      }
      if (msg.password !== undefined) {
        const pw = sanitizePassword(msg.password);
        if (!pw) {
          room.passwordSalt = null;
          room.passwordHash = null;
          room.hasPassword = false;
        } else {
          room.passwordSalt = crypto.randomBytes(16).toString('hex');
          room.passwordHash = hashPassword(pw, room.passwordSalt);
          room.hasPassword = true;
        }
      }

      const now = Date.now();
      room.updatedAt = now;
      room.lastActivityAt = now;

      const summary = serializeRoomSummary(room);
      room.p1.send({ type: 'ROOM_UPDATED', slot: 1, room: summary, event: 'settings_updated' });
      if (room.p2 && !room.p2.closed) {
        room.p2.send({ type: 'ROOM_UPDATED', slot: 2, room: summary, event: 'settings_updated' });
      }
      scheduleBroadcastRoomList();
      return;
    }

    case 'JOIN_ROOM': {
      if (!client.allowAction('control', 15, 5000)) {
        client.sendError('RATE_LIMITED', 'Gửi yêu cầu vào phòng quá nhanh.');
        return;
      }
      const code = normalizeCodeInput(msg.code);
      if (!code || !CODE_REGEX.test(code)) {
        client.sendError('INVALID_CODE', 'Mã phòng không hợp lệ (cần 4-8 ký tự chữ hoặc số).');
        return;
      }

      const room = rooms.get(code);
      if (!room || !room.p1 || room.p1.closed) {
        client.sendError('ROOM_NOT_FOUND', `Không tìm thấy phòng [${code}]. Hãy kiểm tra lại mã phòng!`, code);
        return;
      }
      if (room.p1 === client || room.p2 === client) {
        client.sendError('ALREADY_IN_ROOM', `Bạn đã ở trong phòng [${code}].`, code);
        return;
      }
      if (room.status === 'selecting' || room.status === 'playing') {
        client.sendError('ROOM_IN_MATCH', `Phòng [${code}] đang trong trận đấu.`, code);
        return;
      }
      if (room.p2 && !room.p2.closed) {
        client.sendError('ROOM_FULL', `Phòng [${code}] đã đủ 2 người chơi!`, code);
        return;
      }

      if (room.hasPassword) {
        const pw = sanitizePassword(msg.password);
        if (!pw) {
          client.sendError('PASSWORD_REQUIRED', `Phòng [${code}] yêu cầu mật khẩu.`, code);
          return;
        }
        if (!client.allowAction('pw_fail_check', 5, 15000)) {
          client.sendError('RATE_LIMITED', 'Nhập sai mật khẩu quá nhiều lần. Vui lòng chờ 15 giây.', code);
          return;
        }
        if (!verifyPassword(pw, room.passwordSalt, room.passwordHash)) {
          client.sendError('WRONG_PASSWORD', 'Mật khẩu phòng không chính xác!', code);
          return;
        }
      }

      leaveRoom(client, false);

      if (msg.profile) {
        client.profile = sanitizeProfile(msg.profile, 'Player2', '#2000');
      }

      const now = Date.now();
      room.p2 = client;
      room.p1Ready = true;
      room.p2Ready = false;
      room.status = 'lobby';
      room.updatedAt = now;
      room.lastActivityAt = now;

      client.roomCode = code;
      client.slot = 2;
      client.matchFormat = room.matchFormat;

      const summary = serializeRoomSummary(room);
      client.send({ type: 'ROOM_JOINED', slot: 2, room: summary });
      room.p1.send({ type: 'ROOM_UPDATED', slot: 1, room: summary, event: 'guest_joined' });
      scheduleBroadcastRoomList();
      return;
    }

    case 'SET_READY': {
      if (!client.allowAction('control', 15, 5000)) {
        client.sendError('RATE_LIMITED', 'Thao tác quá nhanh.');
        return;
      }
      const room = client.roomCode ? rooms.get(client.roomCode) : null;
      if (!room) {
        client.sendError('ROOM_NOT_FOUND', 'Bạn chưa ở trong phòng nào.');
        return;
      }
      if (room.status !== 'lobby') {
        client.sendError('INVALID_INPUT', 'Chỉ có thể đổi trạng thái sẵn sàng khi phòng đủ 2 người.', room.code);
        return;
      }
      const ready = Boolean(msg.ready);
      if (room.p1 === client) {
        room.p1Ready = ready;
      } else if (room.p2 === client) {
        room.p2Ready = ready;
      } else {
        return;
      }

      const now = Date.now();
      room.updatedAt = now;
      room.lastActivityAt = now;
      const summary = serializeRoomSummary(room);
      room.p1.send({ type: 'ROOM_UPDATED', slot: 1, room: summary, event: 'ready_changed' });
      if (room.p2 && !room.p2.closed) {
        room.p2.send({ type: 'ROOM_UPDATED', slot: 2, room: summary, event: 'ready_changed' });
      }
      return;
    }

    case 'START_MATCH': {
      if (!client.allowAction('control', 15, 5000)) {
        client.sendError('RATE_LIMITED', 'Thao tác quá nhanh.');
        return;
      }
      const room = client.roomCode ? rooms.get(client.roomCode) : null;
      if (!room) {
        client.sendError('ROOM_NOT_FOUND', 'Bạn chưa ở trong phòng nào.');
        return;
      }
      if (room.p1 !== client) {
        client.sendError('NOT_HOST', 'Chỉ chủ phòng mới có thể bắt đầu trận đấu.', room.code);
        return;
      }
      if (room.status === 'selecting' || room.status === 'playing') {
        client.sendError('ROOM_IN_MATCH', 'Phòng đã bắt đầu chọn tướng hoặc đang thi đấu.', room.code);
        return;
      }
      if (room.status !== 'lobby' || !room.p2 || room.p2.closed || room.p2Ready !== true) {
        client.sendError('NOT_READY', 'Đối thủ cần vào phòng và bấm Sẵn Sàng trước khi bắt đầu.', room.code);
        return;
      }

      const now = Date.now();
      room.status = 'selecting';
      room.p1Ready = true;
      room.updatedAt = now;
      room.lastActivityAt = now;

      const summary = serializeRoomSummary(room);
      room.p1.send({ type: 'ROOM_READY', slot: 1, room: summary });
      room.p2.send({ type: 'ROOM_READY', slot: 2, room: summary });
      scheduleBroadcastRoomList();
      return;
    }

    case 'KICK_GUEST': {
      if (!client.allowAction('control', 15, 5000)) {
        client.sendError('RATE_LIMITED', 'Thao tác quá nhanh.');
        return;
      }
      const room = client.roomCode ? rooms.get(client.roomCode) : null;
      if (!room) {
        client.sendError('ROOM_NOT_FOUND', 'Bạn chưa ở trong phòng nào.');
        return;
      }
      if (room.p1 !== client) {
        client.sendError('NOT_HOST', 'Chỉ chủ phòng mới có thể mời đối thủ ra khỏi phòng.', room.code);
        return;
      }
      if (room.status !== 'lobby' || !room.p2) {
        client.sendError('INVALID_INPUT', 'Hiện không có đối thủ trong phòng chờ.', room.code);
        return;
      }

      const reason = stripControlChars(msg.reason).slice(0, 120) || 'Bạn đã bị chủ phòng mời ra khỏi phòng.';
      const guest = room.p2;
      const now = Date.now();

      room.p2 = null;
      room.p2Ready = false;
      room.p1Ready = true;
      room.status = 'waiting';
      room.updatedAt = now;
      room.lastActivityAt = now;

      guest.roomCode = null;
      guest.slot = 0;

      if (!guest.closed) {
        guest.send({ type: 'KICKED', code: room.code, reason });
      }
      room.p1.send({
        type: 'ROOM_UPDATED',
        slot: 1,
        room: serializeRoomSummary(room),
        event: 'guest_kicked'
      });
      scheduleBroadcastRoomList();
      return;
    }

    case 'QUICK_MATCH': {
      if (!client.allowAction('control', 15, 5000)) {
        client.sendError('RATE_LIMITED', 'Tìm trận quá nhanh, vui lòng chờ giây lát.');
        return;
      }
      leaveRoom(client, false);

      if (msg.profile) {
        client.profile = sanitizeProfile(msg.profile, 'Fighter', '#0000');
      }
      const fmt = normalizeFormat(msg.matchFormat);
      client.matchFormat = fmt;

      pruneQuickQueue(client);

      const oppIdx = quickQueue.findIndex((c) => c.matchFormat === fmt && !c.roomCode && !c.closed && c.inQuickQueue);
      if (oppIdx !== -1) {
        if (rooms.size >= MAX_ROOMS) {
          client.sendError('SERVER_FULL', 'Máy chủ đang quá tải số phòng. Vui lòng thử lại sau.');
          return;
        }
        const opp = quickQueue.splice(oppIdx, 1)[0];
        pairQuickMatch(opp, client, fmt);
      } else {
        client.inQuickQueue = true;
        quickQueue.push(client);
        const queueSize = quickQueue.filter((c) => c.matchFormat === fmt).length;
        client.send({
          type: 'QUICK_QUEUED',
          matchFormat: fmt,
          queueSize,
          onlineCount: clients.size
        });
      }
      return;
    }

    case 'CANCEL_QUICK_MATCH': {
      removeFromQuickQueue(client);
      client.send({ type: 'QUICK_CANCELLED' });
      return;
    }

    case 'LEAVE_ROOM': {
      leaveRoom(client, false);
      client.send({ type: 'LEFT_ROOM' });
      return;
    }

    // ==================== REAL-TIME MATCH & LOBBY RELAYS ====================

    case 'CHAT': {
      if (!client.allowAction('chat', 8, 5000)) {
        client.sendError('RATE_LIMITED', 'Nhắn tin quá nhanh.');
        return;
      }
      const room = client.roomCode ? rooms.get(client.roomCode) : null;
      if (!room || (room.status !== 'lobby' && room.status !== 'selecting' && room.status !== 'playing')) {
        return;
      }
      const peer = getPeer(client);
      if (!peer) return;
      const text = stripControlChars(msg.text !== undefined ? msg.text : msg.message).slice(0, 200);
      if (!text) return;
      room.lastActivityAt = Date.now();
      peer.send({
        type: 'CHAT',
        text,
        message: text,
        fromSlot: client.slot,
        sender: client.profile.nickname,
        ts: Date.now()
      });
      return;
    }

    case 'INPUT': {
      if (!client.allowAction('relay', 180, 1000)) return;
      const room = client.roomCode ? rooms.get(client.roomCode) : null;
      if (!room) return;
      const peer = getPeer(client);
      if (!peer) return;
      room.lastActivityAt = Date.now();
      peer.send({
        type: 'INPUT',
        h: msg.h | 0,
        e: msg.e | 0,
        fromSlot: client.slot
      });
      return;
    }

    case 'SNAPSHOT': {
      if (!client.allowAction('relay', 180, 1000)) return;
      const room = client.roomCode ? rooms.get(client.roomCode) : null;
      if (!room) return;
      const peer = getPeer(client);
      if (!peer) return;
      room.lastActivityAt = Date.now();
      peer.send({ type: 'SNAPSHOT', s: msg.s, fromSlot: client.slot }, true);
      return;
    }

    case 'START_BATTLE': {
      const room = client.roomCode ? rooms.get(client.roomCode) : null;
      if (!room) return;
      if (room.p1 !== client) {
        client.sendError('NOT_HOST', 'Chỉ chủ phòng mới có thể bắt đầu trận đấu.', room.code);
        return;
      }
      const peer = getPeer(client);
      if (!peer) return;
      const now = Date.now();
      room.status = 'playing';
      room.updatedAt = now;
      room.lastActivityAt = now;
      peer.send({ ...msg, fromSlot: client.slot });
      return;
    }

    case 'REMATCH_ACTION': {
      const room = client.roomCode ? rooms.get(client.roomCode) : null;
      if (!room) return;
      const peer = getPeer(client);
      if (!peer) return;
      const now = Date.now();
      if (room.status === 'playing' && (msg.action === 'rematch' || msg.action === 'select' || msg.action === 'accepted')) {
        room.status = 'selecting';
        room.updatedAt = now;
      }
      room.lastActivityAt = now;
      peer.send({ ...msg, fromSlot: client.slot });
      return;
    }

    case 'SELECT_STATE': {
      if (!client.allowAction('relay', 180, 1000)) return;
      const room = client.roomCode ? rooms.get(client.roomCode) : null;
      if (!room) return;
      const peer = getPeer(client);
      if (!peer) return;
      room.lastActivityAt = Date.now();
      peer.send({ ...msg, fromSlot: client.slot });
      return;
    }

    default:
      if (client.allowAction('unknown_type', 5, 5000)) {
        client.sendError('INVALID_INPUT', `Loại gói tin không được hỗ trợ: ${type.slice(0, 32)}`);
      }
  }
}

// ==================== HEARTBEAT & STALE ROOM GARBAGE COLLECTOR ====================

const sweepTimer = setInterval(() => {
  const now = Date.now();

  // 1. Dead-peer detection & RFC 6455 keepalive Ping (also prevents Render proxy idle timeout)
  for (const client of Array.from(clients)) {
    if (client.closed || client.socket.destroyed) {
      clients.delete(client);
      leaveRoom(client, false);
      continue;
    }
    if (now - client.lastSeenAt > DEAD_PEER_TIMEOUT_MS) {
      client.destroy();
      continue;
    }
    client.sendPing();
  }

  // 2. Stale room GC
  let roomChanged = false;
  for (const [code, room] of Array.from(rooms.entries())) {
    const p1Dead = !room.p1 || room.p1.closed || !clients.has(room.p1);
    const p2Dead = !room.p2 || room.p2.closed || !clients.has(room.p2);

    if (p1Dead && p2Dead) {
      rooms.delete(code);
      roomChanged = true;
      continue;
    }

    const idleMs = now - room.lastActivityAt;
    const isStaging = room.status === 'waiting' || room.status === 'lobby';
    const maxIdle = isStaging ? STALE_ROOM_WAITING_MS : STALE_ROOM_MATCH_MS;

    if (idleMs > maxIdle) {
      const p1 = room.p1;
      const p2 = room.p2;
      rooms.delete(code);
      roomChanged = true;
      if (p1 && !p1.closed) {
        p1.roomCode = null;
        p1.slot = 0;
        p1.send({ type: 'LEFT_ROOM', reason: 'Phòng tự động đóng do không hoạt động.' });
      }
      if (p2 && !p2.closed) {
        p2.roomCode = null;
        p2.slot = 0;
        p2.send({ type: 'LEFT_ROOM', reason: 'Phòng tự động đóng do không hoạt động.' });
      }
    }
  }

  // 3. Quick queue hygiene
  pruneQuickQueue();

  if (roomChanged) {
    scheduleBroadcastRoomList();
  }
}, HEARTBEAT_INTERVAL_MS);
if (sweepTimer.unref) sweepTimer.unref();

// ==================== HTTP SERVER + WEBSOCKET UPGRADE ====================

function sendJson(req, res, statusCode, data, extraHeaders = {}) {
  const headers = {
    ...getCorsHeaders(req),
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...extraHeaders
  };
  if (req.method === 'HEAD') {
    res.writeHead(statusCode, headers);
    res.end();
    return;
  }
  const body = JSON.stringify(data);
  res.writeHead(statusCode, headers);
  res.end(body);
}

const server = http.createServer((req, res) => {
  let urlObj;
  try {
    urlObj = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  } catch (_) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('400 Bad Request');
    return;
  }

  const pathname = urlObj.pathname;
  const isApiPath =
    pathname === '/healthz' ||
    pathname === '/api/rooms' ||
    pathname.startsWith('/api/rooms/') ||
    pathname === '/api/server-info';

  if (isApiPath && req.method === 'OPTIONS') {
    res.writeHead(204, getCorsHeaders(req));
    res.end();
    return;
  }

  if (pathname === '/healthz') {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, getCorsHeaders(req));
      res.end();
      return;
    }
    sendJson(req, res, 200, {
      ok: true,
      online: clients.size,
      rooms: rooms.size,
      openRooms: getPublicRoomList().length,
      queue: quickQueue.length,
      uptimeSec: Math.floor(process.uptime()),
      mode: DEPLOYMENT_MODE
    });
    return;
  }

  if (pathname === '/api/server-info') {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, getCorsHeaders(req));
      res.end();
      return;
    }
    sendJson(req, res, 200, {
      port: PORT,
      lanUrls: getLanUrls(),
      deploymentMode: DEPLOYMENT_MODE,
      onlinePlayers: clients.size,
      openRoomsCount: getPublicRoomList().length
    });
    return;
  }

  if (pathname === '/api/rooms') {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, getCorsHeaders(req));
      res.end();
      return;
    }
    const fmt = urlObj.searchParams.get('matchFormat');
    const filter = fmt === '1v1' || fmt === '3v3' ? fmt : null;
    sendJson(req, res, 200, {
      rooms: getPublicRoomList(filter),
      onlinePlayers: clients.size
    });
    return;
  }

  if (pathname.startsWith('/api/rooms/')) {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, getCorsHeaders(req));
      res.end();
      return;
    }
    let rawCode;
    try {
      rawCode = decodeURIComponent(pathname.slice('/api/rooms/'.length));
    } catch (_) {
      sendJson(req, res, 400, { exists: false, code: 'INVALID_CODE', message: 'Mã phòng không hợp lệ.' });
      return;
    }
    const code = normalizeCodeInput(rawCode);
    if (!code || !CODE_REGEX.test(code)) {
      sendJson(req, res, 400, { exists: false, code: 'INVALID_CODE', message: 'Mã phòng không hợp lệ.' });
      return;
    }
    const room = rooms.get(code);
    if (!room || !room.p1 || room.p1.closed) {
      sendJson(req, res, 404, { exists: false, code: 'ROOM_NOT_FOUND', message: 'Không tìm thấy phòng.' });
      return;
    }
    sendJson(req, res, 200, {
      exists: true,
      room: serializeRoomLookup(room)
    });
    return;
  }

  // Static file serving (local development & fallback)
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('405 Method Not Allowed');
    return;
  }

  let relPath;
  try {
    relPath = decodeURIComponent(pathname === '/' ? '/index.html' : pathname);
  } catch (_) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('400 Bad Request');
    return;
  }

  if (relPath.includes('\0')) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('400 Bad Request');
    return;
  }

  const segments = relPath.split('/').filter(Boolean);
  if (segments.some((seg) => seg.startsWith('.'))) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('403 Forbidden');
    return;
  }

  const filePath = path.resolve(ROOT, '.' + relPath);
  if (filePath !== ROOT && !filePath.startsWith(ROOT + path.sep)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('403 Forbidden');
    return;
  }

  fs.stat(filePath, (statErr, stat) => {
    if (statErr || !stat.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const headers = {
      'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
      'X-Content-Type-Options': 'nosniff'
    };
    if (relPath.startsWith('/avatars/') || relPath.startsWith('/chars/')) {
      headers['Cache-Control'] = 'public, max-age=3600';
    }

    if (req.method === 'HEAD') {
      headers['Content-Length'] = stat.size;
      res.writeHead(200, headers);
      res.end();
      return;
    }

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 Not Found');
        return;
      }
      res.writeHead(200, headers);
      res.end(content);
    });
  });
});

function rejectUpgrade(socket, statusLine) {
  try {
    socket.write(`HTTP/1.1 ${statusLine}\r\nConnection: close\r\n\r\n`);
  } catch (_) {}
  socket.destroy();
}

server.on('upgrade', (req, socket, head) => {
  if (isShuttingDown) {
    rejectUpgrade(socket, '503 Service Unavailable');
    return;
  }

  let pathname = '/';
  try {
    const u = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    pathname = u.pathname;
  } catch (_) {
    rejectUpgrade(socket, '400 Bad Request');
    return;
  }

  if (pathname !== '/ws' && pathname !== '/') {
    rejectUpgrade(socket, '404 Not Found');
    return;
  }

  const upgradeHdr = String(req.headers.upgrade || '').toLowerCase();
  const key = req.headers['sec-websocket-key'];
  if (upgradeHdr !== 'websocket' || typeof key !== 'string' || !key.trim()) {
    rejectUpgrade(socket, '400 Bad Request');
    return;
  }

  if (!isOriginAllowed(req.headers.origin)) {
    rejectUpgrade(socket, '403 Forbidden');
    return;
  }

  if (clients.size >= MAX_CLIENTS) {
    rejectUpgrade(socket, '503 Service Unavailable');
    return;
  }

  const acceptKey = crypto.createHash('sha1').update(key.trim() + WS_GUID).digest('base64');
  const headers = [
    'HTTP/1.1 101 Switching Protocols',
    'Upgrade: websocket',
    'Connection: Upgrade',
    `Sec-WebSocket-Accept: ${acceptKey}`,
    '\r\n'
  ];

  try {
    socket.setNoDelay(true);
    socket.setKeepAlive(true, 30000);
    socket.write(headers.join('\r\n'));
  } catch (_) {
    socket.destroy();
    return;
  }

  const client = new WsClient(socket, getClientIp(req, socket));
  clients.add(client);

  const cleanup = () => {
    if (!clients.has(client)) return;
    clients.delete(client);
    client.closed = true;
    leaveRoom(client, false);
    scheduleBroadcastRoomList();
  };

  socket.on('data', (chunk) => {
    if (client.closed) return;
    if (client.buffer.length + chunk.length > MAX_BUFFER_BYTES) {
      client.close(1009, 'Buffer limit exceeded');
      return;
    }
    client.buffer = client.buffer.length ? Buffer.concat([client.buffer, chunk]) : Buffer.from(chunk);
    parseWsFrames(client, (msg) => handleWsMessage(client, msg));
  });

  socket.on('close', cleanup);
  socket.on('error', cleanup);

  if (head && head.length > 0) {
    if (head.length > MAX_BUFFER_BYTES) {
      client.close(1009, 'Buffer limit exceeded');
      return;
    }
    client.buffer = Buffer.from(head);
    parseWsFrames(client, (msg) => handleWsMessage(client, msg));
  }
});

server.listen(PORT, HOST, () => {
  const lans = getLanUrls();
  console.log(`[Anime Crossover BVN] Server (${DEPLOYMENT_MODE}) running at http://localhost:${PORT}`);
  if (lans.length) {
    console.log(`[Anime Crossover BVN] LAN Multiplayer URLs: ${lans.join(' | ')}`);
  }
});

let isShuttingDown = false;
function gracefulShutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`[Anime Crossover BVN] Received ${signal}, shutting down cleanly...`);

  clearInterval(sweepTimer);
  if (broadcastTimer) {
    clearTimeout(broadcastTimer);
    broadcastTimer = null;
  }

  for (const client of Array.from(clients)) {
    try {
      client.close(1001, 'Server shutting down');
    } catch (_) {}
  }
  clients.clear();
  rooms.clear();
  quickQueue.length = 0;

  server.close(() => {
    process.exit(0);
  });

  setTimeout(() => {
    process.exit(0);
  }, 5000).unref();
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
