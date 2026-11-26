// language: JavaScript, file: scrape-extra-chars.js, target: Node.js M.U.G.E.N Extra Character Scraper & Verifier
// Downloads 31 diverse M.U.G.E.N JUS & Classic character packs (.def/.sff/.air/.act, skipping .snd)
// from existing Archive.org catalogs + Naruto Battle Arena, verifies SFF/AIR integrity,
// and generates mugen-presets-extra.json and mugen-presets-extra.js.

'use strict';

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = __dirname;
const CHARS_DIR = path.join(ROOT_DIR, 'chars');
const PRESETS_JSON_PATH = path.join(ROOT_DIR, 'mugen-presets-extra.json');
const PRESETS_JS_PATH = path.join(ROOT_DIR, 'mugen-presets-extra.js');

const CONCURRENCY = 5;
const MAX_RETRIES = 4;
const REQUEST_TIMEOUT_MS = 60000;

const TARGETS = [
  // Jump Force MUGEN.zip (16)
  { slotId: 'saitama', catalog: 'jump_force_jus_catalog.json', dir: 'Saitama' },
  { slotId: 'genos', catalog: 'jump_force_jus_catalog.json', dir: 'Genos' },
  { slotId: 'tatsumaki', catalog: 'jump_force_jus_catalog.json', dir: 'Tatsumaki_by_TrafalgarLawzz' },
  { slotId: 'dio', catalog: 'jump_force_jus_catalog.json', dir: 'SM_Dio' },
  { slotId: 'natsu', catalog: 'jump_force_jus_catalog.json', dir: 'Natsu_DragonForce' },
  { slotId: 'erza', catalog: 'jump_force_jus_catalog.json', dir: 'Erza_Start' },
  { slotId: 'meliodas', catalog: 'jump_force_jus_catalog.json', dir: 'Meliodas' },
  { slotId: 'deku', catalog: 'jump_force_jus_catalog.json', dir: 'Izuku_Midoriya_Edit_by_TrafalgarLawzz' },
  { slotId: 'bakugo', catalog: 'jump_force_jus_catalog.json', dir: 'Katsuki_Bakugo_by_TrafalgarLawzz_MYTHOS' },
  { slotId: 'eren', catalog: 'jump_force_jus_catalog.json', dir: 'Eren' },
  { slotId: 'kaneki', catalog: 'jump_force_jus_catalog.json', dir: 'Kaneki' },
  { slotId: 'kirito', catalog: 'jump_force_jus_catalog.json', dir: 'Kirito' },
  { slotId: 'goku_ui', catalog: 'jump_force_jus_catalog.json', dir: 'Goku_Migatte' },
  { slotId: 'naruto_ashura', catalog: 'jump_force_jus_catalog.json', dir: 'Naruto_Ashura_JUS' },
  { slotId: 'kenshin', catalog: 'jump_force_jus_catalog.json', dir: 'SM_Kenshin' },
  { slotId: 'yugi', catalog: 'jump_force_jus_catalog.json', dir: 'Yugi' },

  // Dragon Ball - JUS Edition.zip (8)
  { slotId: 'goku_black', catalog: 'db_jus_edition_catalog.json', dir: 'Black_Goku_Normal_JUS' },
  { slotId: 'frieza', catalog: 'db_jus_edition_catalog.json', dir: 'Freezer_4_Form' },
  { slotId: 'cell', catalog: 'db_jus_edition_catalog.json', dir: 'Cell_Perfect_Form' },
  { slotId: 'kid_buu', catalog: 'db_jus_edition_catalog.json', dir: 'Kid_Buu' },
  { slotId: 'gogeta', catalog: 'db_jus_edition_catalog.json', dir: 'New_Gogeta_SSJ_JUS' },
  { slotId: 'vegito', catalog: 'db_jus_edition_catalog.json', dir: 'VegitoSSJ_JUS' },
  { slotId: 'gohan', catalog: 'db_jus_edition_catalog.json', dir: 'Gohan_Ultimate' },
  { slotId: 'trunks', catalog: 'db_jus_edition_catalog.json', dir: 'Trunks_Future_SS' },

  // Hunter x Hunter Mugen V3.zip (4)
  { slotId: 'gon_adult', catalog: 'hxh_v3_jus_catalog.json', dir: 'Gon2' },
  { slotId: 'killua_godspeed', catalog: 'hxh_v3_jus_catalog.json', dir: 'Killua2' },
  { slotId: 'yusuke', catalog: 'hxh_v3_jus_catalog.json', dir: 'Yusuke' },
  { slotId: 'hiei', catalog: 'hxh_v3_jus_catalog.json', dir: 'Hiei' },

  // Naruto Battle Arena unpacked SFF v1 chars (3)
  {
    slotId: 'minato',
    directFiles: [
      { fileName: 'Yondaime.def', url: 'https://archive.org/download/Naruto-Battle-Arena-w2003-06-14b/Naruto%20Battle%20Arena/chars/Yondaime/Yondaime.def' },
      { fileName: 'Yondaime.sff', url: 'https://archive.org/download/Naruto-Battle-Arena-w2003-06-14b/Naruto%20Battle%20Arena/chars/Yondaime/Yondaime.sff' },
      { fileName: 'Yondaime.air', url: 'https://archive.org/download/Naruto-Battle-Arena-w2003-06-14b/Naruto%20Battle%20Arena/chars/Yondaime/Yondaime.air' },
      { fileName: 'Yondaime.act', url: 'https://archive.org/download/Naruto-Battle-Arena-w2003-06-14b/Naruto%20Battle%20Arena/chars/Yondaime/Yondaime.act' }
    ]
  },
  {
    slotId: 'gaara',
    directFiles: [
      { fileName: 'Sabaku_no_Gaara.def', url: 'https://archive.org/download/Naruto-Battle-Arena-w2003-06-14b/Naruto%20Battle%20Arena/chars/Sabaku%20no%20Gaara/Sabaku%20no%20Gaara.def' },
      { fileName: 'Gaara.sff', url: 'https://archive.org/download/Naruto-Battle-Arena-w2003-06-14b/Naruto%20Battle%20Arena/chars/Sabaku%20no%20Gaara/Gaara.sff' },
      { fileName: 'Gaara.air', url: 'https://archive.org/download/Naruto-Battle-Arena-w2003-06-14b/Naruto%20Battle%20Arena/chars/Sabaku%20no%20Gaara/Gaara.air' },
      { fileName: 'Gaarapalette.act', url: 'https://archive.org/download/Naruto-Battle-Arena-w2003-06-14b/Naruto%20Battle%20Arena/chars/Sabaku%20no%20Gaara/Gaarapalette.act' }
    ]
  },
  {
    slotId: 'rock_lee',
    directFiles: [
      { fileName: 'rLee.def', url: 'https://archive.org/download/Naruto-Battle-Arena-w2003-06-14b/Naruto%20Battle%20Arena/chars/rLee/rLee.def' },
      { fileName: 'lee.sff', url: 'https://archive.org/download/Naruto-Battle-Arena-w2003-06-14b/Naruto%20Battle%20Arena/chars/rLee/lee.sff' },
      { fileName: 'lee.air', url: 'https://archive.org/download/Naruto-Battle-Arena-w2003-06-14b/Naruto%20Battle%20Arena/chars/rLee/lee.air' },
      { fileName: 'lee.act', url: 'https://archive.org/download/Naruto-Battle-Arena-w2003-06-14b/Naruto%20Battle%20Arena/chars/rLee/lee.act' }
    ]
  }
];

function sanitizeFileName(name) {
  let clean = name;
  try {
    clean = decodeURIComponent(name);
  } catch (_) {}
  return clean.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '_');
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function downloadToFileOnce(url, destPath, redirectsLeft = 10) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https:') ? https : http;
    const req = mod.get(
      url,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AnimeCrossoverScraper/1.0'
        }
      },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          res.resume();
          if (redirectsLeft <= 0) {
            return reject(new Error(`Too many redirects for ${url}`));
          }
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

        res.on('data', (chunk) => {
          received += chunk.length;
        });
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
      }
    );

    req.setTimeout(REQUEST_TIMEOUT_MS, () => {
      req.destroy(new Error(`Timeout after ${REQUEST_TIMEOUT_MS}ms for ${url}`));
    });
    req.on('error', reject);
  });
}

async function downloadWithRetry(url, destPath, expectedSize) {
  if (fs.existsSync(destPath)) {
    const st = fs.statSync(destPath);
    if (expectedSize && st.size === expectedSize) {
      return { bytes: st.size, cached: true };
    }
    if (!expectedSize && st.size > 0) {
      return { bytes: st.size, cached: true };
    }
  }

  let lastErr;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const bytes = await downloadToFileOnce(url, destPath);
      if (expectedSize && bytes !== expectedSize) {
        try { fs.unlinkSync(destPath); } catch (_) {}
        throw new Error(`Size mismatch: got ${bytes}, expected ${expectedSize}`);
      }
      return { bytes, cached: false };
    } catch (err) {
      lastErr = err;
      if (attempt < MAX_RETRIES) {
        await sleep(1000 * Math.pow(2, attempt - 1));
      }
    }
  }
  throw lastErr;
}

function pickPrimaryAct(acts, defText) {
  if (!acts || acts.length === 0) return null;
  if (defText) {
    const m = defText.match(/^\s*pal1\s*=\s*([^\r\n;]+)/im);
    if (m) {
      const want = path.basename(m[1].trim().replace(/^["']|["']$/g, '')).toLowerCase();
      const found = acts.find((a) => a.fileName.toLowerCase() === want);
      if (found) return found;
    }
  }
  const oneAct = acts.find((a) => a.fileName.toLowerCase() === '1.act');
  if (oneAct) return oneAct;
  return acts.slice().sort((a, b) => a.fileName.localeCompare(b.fileName))[0];
}

function inspectSffFile(filePath) {
  const st = fs.statSync(filePath);
  if (st.size < 64) {
    throw new Error(`SFF too small (${st.size} bytes): ${filePath}`);
  }
  const fd = fs.openSync(filePath, 'r');
  const hdr = Buffer.alloc(64);
  try {
    fs.readSync(fd, hdr, 0, 64, 0);
  } finally {
    fs.closeSync(fd);
  }
  const sig = hdr.subarray(0, 11).toString('ascii');
  if (sig !== 'ElecbyteSpr') {
    throw new Error(`Invalid SFF signature "${sig}" in ${filePath}`);
  }
  const verHi = hdr[15];
  const sffVersion = verHi >= 2 ? 'v2.0' : 'v1.0';
  const sprites = verHi >= 2 ? hdr.readUInt32LE(40) : hdr.readUInt32LE(20);
  if (sprites <= 0) {
    throw new Error(`Zero sprites in SFF header: ${filePath}`);
  }
  return { sffVersion, sprites, sizeBytes: st.size };
}

function inspectAirFile(filePath) {
  const text = fs.readFileSync(filePath, 'latin1');
  if (!/\[Begin Action/i.test(text)) {
    throw new Error(`Missing [Begin Action in AIR: ${filePath}`);
  }
  const actionIds = new Set();
  const re = /^\s*\[Begin Action\s+(-?\d+)\]/gmi;
  let m;
  while ((m = re.exec(text)) !== null) {
    actionIds.add(m[1]);
  }
  if (actionIds.size === 0) {
    throw new Error(`No parsed actions in AIR: ${filePath}`);
  }
  return { actions: actionIds.size };
}

async function processTarget(target, catalogs) {
  const charDir = path.join(CHARS_DIR, target.slotId);
  fs.mkdirSync(charDir, { recursive: true });

  let files;
  if (target.directFiles) {
    files = target.directFiles;
  } else {
    const map = catalogs[target.catalog];
    const entries = map[target.dir];
    if (!entries || entries.length === 0) {
      throw new Error(`Directory "${target.dir}" not found in ${target.catalog}`);
    }
    files = entries.filter(
      (f) => /\.(def|sff|air|act)$/i.test(f.fileName) && !f.fileRel.includes('/')
    );
  }

  const defItem = files.find((f) => /\.def$/i.test(f.fileName));
  const sffItem = files.find((f) => /\.sff$/i.test(f.fileName));
  const airItem = files.find((f) => /\.air$/i.test(f.fileName));
  const actItems = files.filter((f) => /\.act$/i.test(f.fileName));

  if (!defItem || !sffItem || !airItem) {
    throw new Error(`Missing core files for ${target.slotId} (def=${!!defItem}, sff=${!!sffItem}, air=${!!airItem})`);
  }

  // Download .def first so we can resolve pal1 -> primary .act cleanly
  const defName = sanitizeFileName(defItem.fileName);
  const defPath = path.join(charDir, defName);
  await downloadWithRetry(defItem.url, defPath, defItem.size);
  const defText = fs.readFileSync(defPath, 'latin1');

  const actItem = pickPrimaryAct(actItems, defText);
  const sffName = sanitizeFileName(sffItem.fileName);
  const airName = sanitizeFileName(airItem.fileName);
  const actName = actItem ? sanitizeFileName(actItem.fileName) : null;

  const sffPath = path.join(charDir, sffName);
  const airPath = path.join(charDir, airName);
  const actPath = actName ? path.join(charDir, actName) : null;

  const [sffRes, airRes] = await Promise.all([
    downloadWithRetry(sffItem.url, sffPath, sffItem.size),
    downloadWithRetry(airItem.url, airPath, airItem.size),
    actItem ? downloadWithRetry(actItem.url, actPath, actItem.size) : Promise.resolve(null)
  ]);

  const sffInfo = inspectSffFile(sffPath);
  const airInfo = inspectAirFile(airPath);

  const preset = {
    defUrl: `chars/${target.slotId}/${defName}`,
    sffUrl: `chars/${target.slotId}/${sffName}`,
    airUrl: `chars/${target.slotId}/${airName}`,
    actUrl: actName ? `chars/${target.slotId}/${actName}` : null,
    sffVersion: sffInfo.sffVersion,
    sprites: sffInfo.sprites,
    actions: airInfo.actions
  };

  const tag = sffRes.cached ? 'CACHED' : 'DL';
  console.log(
    `[OK][${tag}] ${target.slotId.padEnd(16)} | ${preset.sffVersion} | ${String(preset.sprites).padStart(5)} sprites | ${String(preset.actions).padStart(4)} actions | ${(sffInfo.sizeBytes / 1048576).toFixed(2).padStart(6)} MB`
  );

  return { slotId: target.slotId, preset, sizeBytes: sffInfo.sizeBytes };
}

async function runPool(items, concurrency, workerFn) {
  const results = new Array(items.length);
  let nextIdx = 0;

  async function worker() {
    while (true) {
      const idx = nextIdx++;
      if (idx >= items.length) return;
      try {
        results[idx] = { ok: true, value: await workerFn(items[idx], idx) };
      } catch (err) {
        console.error(`[FAIL] ${items[idx].slotId}: ${err.message}`);
        results[idx] = { ok: false, error: err, slotId: items[idx].slotId };
      }
    }
  }

  const workers = [];
  for (let i = 0; i < Math.min(concurrency, items.length); i++) {
    workers.push(worker());
  }
  await Promise.all(workers);
  return results;
}

async function main() {
  const catalogs = {
    'jump_force_jus_catalog.json': JSON.parse(fs.readFileSync(path.join(CHARS_DIR, 'jump_force_jus_catalog.json'), 'utf8')),
    'db_jus_edition_catalog.json': JSON.parse(fs.readFileSync(path.join(CHARS_DIR, 'db_jus_edition_catalog.json'), 'utf8')),
    'hxh_v3_jus_catalog.json': JSON.parse(fs.readFileSync(path.join(CHARS_DIR, 'hxh_v3_jus_catalog.json'), 'utf8'))
  };

  console.log(`[scrape-extra-chars] Starting download & verification of ${TARGETS.length} characters (concurrency=${CONCURRENCY})...`);
  const startMs = Date.now();
  const outcomes = await runPool(TARGETS, CONCURRENCY, (t) => processTarget(t, catalogs));

  const presets = {};
  const failed = [];
  let totalSprites = 0;
  let totalActions = 0;
  let totalBytes = 0;

  for (const o of outcomes) {
    if (o.ok) {
      const { slotId, preset, sizeBytes } = o.value;
      presets[slotId] = preset;
      totalSprites += preset.sprites;
      totalActions += preset.actions;
      totalBytes += sizeBytes;
    } else {
      failed.push(`${o.slotId}: ${o.error.message}`);
    }
  }

  const okIds = Object.keys(presets);
  fs.writeFileSync(PRESETS_JSON_PATH, JSON.stringify(presets, null, 2) + '\n', 'utf8');

  const jsOutput =
    '// Auto-generated by scrape-extra-chars.js — Extra M.U.G.E.N character presets\n' +
    'window.EXTRA_MUGEN_PRESETS = ' +
    JSON.stringify(presets, null, 2) +
    ';\n';
  fs.writeFileSync(PRESETS_JS_PATH, jsOutput, 'utf8');

  const elapsedSec = ((Date.now() - startMs) / 1000).toFixed(1);
  console.log('\n==================== SUMMARY ====================');
  console.log(`Downloaded & verified : ${okIds.length}/${TARGETS.length} characters in ${elapsedSec}s`);
  console.log(`Total sprites         : ${totalSprites.toLocaleString()}`);
  console.log(`Total AIR actions     : ${totalActions.toLocaleString()}`);
  console.log(`Total SFF size        : ${(totalBytes / 1048576).toFixed(2)} MB`);
  console.log(`Wrote JSON            : ${PRESETS_JSON_PATH}`);
  console.log(`Wrote JS              : ${PRESETS_JS_PATH}`);
  if (failed.length > 0) {
    console.log(`Failed (${failed.length}):`);
    for (const f of failed) console.log('  - ' + f);
  }
  console.log('=================================================');

  if (okIds.length < 18) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
