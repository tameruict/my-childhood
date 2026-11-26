// language: JavaScript, file: scrape-naruto-pack.js, target: Node.js M.U.G.E.N Naruto Pack Downloader & Preset Updater
// Downloads 4 verified Naruto characters (obito, deidara, shikamaru, hinata) from streamable Archive.org ZIP/dir sources
// (.def/.sff/.air/.act, skipping .snd), verifies SFF & AIR integrity,
// and registers them + standalone naruto_kurama (baseActionOffset: 10000, baseScaleMult: 1.42)
// into mugen-presets-extra.json and mugen-presets-extra.js.

'use strict';

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = __dirname;
const CHARS_DIR = path.join(ROOT_DIR, 'chars');
const PRESETS_JSON_PATH = path.join(ROOT_DIR, 'mugen-presets-extra.json');
const PRESETS_JS_PATH = path.join(ROOT_DIR, 'mugen-presets-extra.js');

const MAX_RETRIES = 4;
const REQUEST_TIMEOUT_MS = 120000;
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36';

const DIRECT_TARGETS = [
  {
    slotId: 'obito',
    files: [
      { fileName: 'Obito_Juubi_Jinchuriki.def', url: 'https://archive.org/download/naruto-vs-dragon-ball-super-mugen/Naruto%20vs%20Dragon%20Ball%20Super%20Mugen.zip/Naruto%20vs%20Dragon%20Ball%20Super%20Mugen%2Fchars%2FObito_Juubi_Jinchuriki%2FObito_Juubi_Jinchuriki.def' },
      { fileName: 'Obito_Juubi_Jinchuriki.sff', url: 'https://archive.org/download/naruto-vs-dragon-ball-super-mugen/Naruto%20vs%20Dragon%20Ball%20Super%20Mugen.zip/Naruto%20vs%20Dragon%20Ball%20Super%20Mugen%2Fchars%2FObito_Juubi_Jinchuriki%2FObito_Juubi_Jinchuriki.sff' },
      { fileName: 'Obito_Juubi_Jinchuriki.air', url: 'https://archive.org/download/naruto-vs-dragon-ball-super-mugen/Naruto%20vs%20Dragon%20Ball%20Super%20Mugen.zip/Naruto%20vs%20Dragon%20Ball%20Super%20Mugen%2Fchars%2FObito_Juubi_Jinchuriki%2FObito_Juubi_Jinchuriki.air' }
    ]
  },
  {
    slotId: 'deidara',
    files: [
      { fileName: 'Ba_Deidara_J-NS.def', url: 'https://archive.org/download/one-piece-x-naruto-mugen-v2/One%20Piece%20x%20Naruto%20Mugen%20v2.zip/One%20Piece%20x%20Naruto%20Mugen%20v2%2Fchars%2FBa%27Deidara%27J-NS%2FBa%27Deidara%27J-NS.def' },
      { fileName: 'Ba_Deidara_J-NS.sff', url: 'https://archive.org/download/one-piece-x-naruto-mugen-v2/One%20Piece%20x%20Naruto%20Mugen%20v2.zip/One%20Piece%20x%20Naruto%20Mugen%20v2%2Fchars%2FBa%27Deidara%27J-NS%2FBa%27Deidara%27J-NS.sff' },
      { fileName: 'Ba_Deidara_J-NS.air', url: 'https://archive.org/download/one-piece-x-naruto-mugen-v2/One%20Piece%20x%20Naruto%20Mugen%20v2.zip/One%20Piece%20x%20Naruto%20Mugen%20v2%2Fchars%2FBa%27Deidara%27J-NS%2FBa%27Deidara%27J-NS.air' },
      { fileName: 'Ba_Deidara_J-NS.act', url: 'https://archive.org/download/one-piece-x-naruto-mugen-v2/One%20Piece%20x%20Naruto%20Mugen%20v2.zip/One%20Piece%20x%20Naruto%20Mugen%20v2%2Fchars%2FBa%27Deidara%27J-NS%2FBa%27Deidara%27J-NS.act' }
    ]
  },
  {
    slotId: 'hinata',
    files: [
      { fileName: 'SK_Hinata.def', url: 'https://archive.org/download/one-piece-x-naruto-mugen-v2/One%20Piece%20x%20Naruto%20Mugen%20v2.zip/One%20Piece%20x%20Naruto%20Mugen%20v2%2Fchars%2FSK%27Hinata%2FSK%27Hinata.def' },
      { fileName: 'SK_Hinata.sff', url: 'https://archive.org/download/one-piece-x-naruto-mugen-v2/One%20Piece%20x%20Naruto%20Mugen%20v2.zip/One%20Piece%20x%20Naruto%20Mugen%20v2%2Fchars%2FSK%27Hinata%2FSK%27Hinata.sff' },
      { fileName: 'SK_Hinata.air', url: 'https://archive.org/download/one-piece-x-naruto-mugen-v2/One%20Piece%20x%20Naruto%20Mugen%20v2.zip/One%20Piece%20x%20Naruto%20Mugen%20v2%2Fchars%2FSK%27Hinata%2FSK%27Hinata.air' },
      { fileName: 'SK_Hinata_Pal1.act', url: 'https://archive.org/download/one-piece-x-naruto-mugen-v2/One%20Piece%20x%20Naruto%20Mugen%20v2.zip/One%20Piece%20x%20Naruto%20Mugen%20v2%2Fchars%2FSK%27Hinata%2FSK%27Hinata_Pal1.act' }
    ]
  },
  {
    slotId: 'shikamaru',
    dirUrl: 'https://archive.org/download/Naruto-Battle-Arena-w2003-06-14b/Naruto%20Battle%20Arena/chars/cshikamaru/'
  }
];

function sanitizeFileName(name) {
  let clean = name;
  try { clean = decodeURIComponent(name); } catch (_) {}
  return clean.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '_');
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fetchText(url, redirectsLeft = 10) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https:') ? https : http;
    const req = mod.get(url, { headers: { 'User-Agent': UA } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        if (redirectsLeft <= 0) return reject(new Error(`Too many redirects for ${url}`));
        const next = res.headers.location.startsWith('http')
          ? res.headers.location
          : res.headers.location.startsWith('//')
            ? 'https:' + res.headers.location
            : new URL(res.headers.location, url).href;
        return resolve(fetchText(next, redirectsLeft - 1));
      }
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    });
    req.setTimeout(30000, () => req.destroy(new Error(`Timeout fetching ${url}`)));
    req.on('error', reject);
  });
}

function downloadToFileOnce(url, destPath, redirectsLeft = 10) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https:') ? https : http;
    const req = mod.get(url, { headers: { 'User-Agent': UA } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        if (redirectsLeft <= 0) return reject(new Error(`Too many redirects for ${url}`));
        const next = res.headers.location.startsWith('http')
          ? res.headers.location
          : res.headers.location.startsWith('//')
            ? 'https:' + res.headers.location
            : new URL(res.headers.location, url).href;
        return resolve(downloadToFileOnce(next, destPath, redirectsLeft - 1));
      }

      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }

      const tmpPath = destPath + '.tmp.' + process.pid + '.' + Math.random().toString(36).slice(2, 8);
      const out = fs.createWriteStream(tmpPath);
      let received = 0;
      let settled = false;

      const fail = (err) => {
        if (settled) return;
        settled = true;
        out.destroy();
        res.destroy();
        try { fs.unlinkSync(tmpPath); } catch (_) {}
        reject(err);
      };

      res.on('data', (chunk) => { received += chunk.length; });
      res.on('error', fail);
      out.on('error', fail);
      out.on('finish', () => {
        if (settled) return;
        settled = true;
        try {
          const expectedLen = res.headers['content-length'] ? parseInt(res.headers['content-length'], 10) : null;
          if (expectedLen && received !== expectedLen) {
            try { fs.unlinkSync(tmpPath); } catch (_) {}
            return reject(new Error(`Truncated download (${received}/${expectedLen}) for ${url}`));
          }
          if (received === 0) {
            try { fs.unlinkSync(tmpPath); } catch (_) {}
            return reject(new Error(`Zero-byte download for ${url}`));
          }
          fs.renameSync(tmpPath, destPath);
          resolve(received);
        } catch (err) {
          try { fs.unlinkSync(tmpPath); } catch (_) {}
          reject(err);
        }
      });

      res.pipe(out);
    });

    req.setTimeout(REQUEST_TIMEOUT_MS, () => {
      req.destroy(new Error(`Timeout after ${REQUEST_TIMEOUT_MS}ms for ${url}`));
    });
    req.on('error', reject);
  });
}

async function downloadWithRetry(url, destPath) {
  if (fs.existsSync(destPath)) {
    const st = fs.statSync(destPath);
    if (st.size > 0) return { bytes: st.size, cached: true };
  }

  let lastErr;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const bytes = await downloadToFileOnce(url, destPath);
      return { bytes, cached: false };
    } catch (err) {
      lastErr = err;
      if (attempt < MAX_RETRIES) {
        await sleep(1200 * Math.pow(2, attempt - 1));
      }
    }
  }
  throw lastErr;
}

function inspectSffFile(filePath) {
  const st = fs.statSync(filePath);
  if (st.size < 64) throw new Error(`SFF too small (${st.size} bytes): ${filePath}`);
  const fd = fs.openSync(filePath, 'r');
  const hdr = Buffer.alloc(64);
  try {
    fs.readSync(fd, hdr, 0, 64, 0);
  } finally {
    fs.closeSync(fd);
  }
  const sig = hdr.subarray(0, 11).toString('ascii');
  if (sig !== 'ElecbyteSpr') throw new Error(`Invalid SFF signature "${sig}" in ${filePath}`);
  const verHi = hdr[15];
  const sffVersion = verHi >= 2 ? 'v2.0' : 'v1.0';
  const sprites = verHi >= 2 ? hdr.readUInt32LE(40) : hdr.readUInt32LE(20);
  if (sprites <= 0) throw new Error(`Zero sprites in SFF header: ${filePath}`);
  return { sffVersion, sprites, sizeBytes: st.size };
}

function inspectAirFile(filePath) {
  const text = fs.readFileSync(filePath, 'latin1');
  if (!/\[Begin Action/i.test(text)) throw new Error(`Missing [Begin Action in AIR: ${filePath}`);
  const actionIds = new Set();
  const re = /^\s*\[Begin Action\s+(-?\d+)\]/gmi;
  let m;
  while ((m = re.exec(text)) !== null) actionIds.add(m[1]);
  if (actionIds.size === 0) throw new Error(`No parsed actions in AIR: ${filePath}`);
  return { actions: actionIds.size };
}

async function discoverDirFiles(dirUrl) {
  const html = await fetchText(dirUrl);
  const re = /href="([^"]+\.(?:def|sff|air|act))"/gi;
  const files = [];
  const seen = new Set();
  let m;
  while ((m = re.exec(html)) !== null) {
    const raw = m[1];
    if (raw.startsWith('..') || raw.includes('/')) continue;
    if (seen.has(raw)) continue;
    seen.add(raw);
    files.push({
      fileName: sanitizeFileName(raw),
      url: new URL(raw, dirUrl).href
    });
  }
  return files;
}

async function processTarget(target) {
  const charDir = path.join(CHARS_DIR, target.slotId);
  fs.mkdirSync(charDir, { recursive: true });

  const files = target.dirUrl ? await discoverDirFiles(target.dirUrl) : target.files;
  const defItem = files.find((f) => /\.def$/i.test(f.fileName));
  const sffItem = files.find((f) => /\.sff$/i.test(f.fileName));
  const airItem = files.find((f) => /\.air$/i.test(f.fileName));
  const actItems = files.filter((f) => /\.act$/i.test(f.fileName));
  const actItem = actItems.find((a) => /1\.act$/i.test(a.fileName)) || actItems[0] || null;

  if (!defItem || !sffItem || !airItem) {
    throw new Error(`Missing core files for ${target.slotId} (found: ${files.map((f) => f.fileName).join(', ')})`);
  }

  const defPath = path.join(charDir, defItem.fileName);
  const sffPath = path.join(charDir, sffItem.fileName);
  const airPath = path.join(charDir, airItem.fileName);
  const actPath = actItem ? path.join(charDir, actItem.fileName) : null;

  await downloadWithRetry(defItem.url, defPath);
  const sffRes = await downloadWithRetry(sffItem.url, sffPath);
  await downloadWithRetry(airItem.url, airPath);
  if (actItem) await downloadWithRetry(actItem.url, actPath);

  const sffInfo = inspectSffFile(sffPath);
  const airInfo = inspectAirFile(airPath);

  const preset = {
    defUrl: `chars/${target.slotId}/${defItem.fileName}`,
    sffUrl: `chars/${target.slotId}/${sffItem.fileName}`,
    airUrl: `chars/${target.slotId}/${airItem.fileName}`,
    actUrl: actItem ? `chars/${target.slotId}/${actItem.fileName}` : null,
    sffVersion: sffInfo.sffVersion,
    sprites: sffInfo.sprites,
    actions: airInfo.actions
  };

  console.log(
    `[OK][${sffRes.cached ? 'CACHED' : 'DL'}] ${target.slotId.padEnd(14)} | ${preset.sffVersion} | ${String(preset.sprites).padStart(5)} sprites | ${String(preset.actions).padStart(4)} actions | ${(sffInfo.sizeBytes / 1048576).toFixed(2)} MB`
  );

  return { slotId: target.slotId, preset };
}

async function main() {
  const existingPresets = JSON.parse(fs.readFileSync(PRESETS_JSON_PATH, 'utf8'));

  console.log('[scrape-naruto-pack] Downloading 4 Naruto M.U.G.E.N character packs...');
  const results = await Promise.all(DIRECT_TARGETS.map((t) => processTarget(t)));

  for (const r of results) {
    existingPresets[r.slotId] = r.preset;
  }

  const ashura = existingPresets.naruto_ashura;
  if (!ashura) {
    throw new Error('Missing naruto_ashura preset to derive naruto_kurama!');
  }
  existingPresets.naruto_kurama = {
    defUrl: ashura.defUrl,
    sffUrl: ashura.sffUrl,
    airUrl: ashura.airUrl,
    actUrl: ashura.actUrl,
    sffVersion: ashura.sffVersion,
    sprites: ashura.sprites,
    actions: ashura.actions,
    baseActionOffset: 10000,
    baseScaleMult: 1.42
  };
  console.log('[OK][PRESET] naruto_kurama  | baseActionOffset: 10000 | baseScaleMult: 1.42');

  fs.writeFileSync(PRESETS_JSON_PATH, JSON.stringify(existingPresets, null, 2) + '\n', 'utf8');
  const jsOutput =
    '// Auto-generated by scrape-extra-chars.js, scrape-missing-chars.js & scrape-naruto-pack.js — Extra M.U.G.E.N character presets\n' +
    'window.EXTRA_MUGEN_PRESETS = ' +
    JSON.stringify(existingPresets, null, 2) +
    ';\n';
  fs.writeFileSync(PRESETS_JS_PATH, jsOutput, 'utf8');

  console.log(`Updated presets: ${Object.keys(existingPresets).length} total entries in mugen-presets-extra.{json,js}`);
}

main().catch((err) => {
  console.error('[FATAL]', err);
  process.exit(1);
});
