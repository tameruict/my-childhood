// language: JavaScript, file: scrape-missing-chars.js, target: Node.js Missing M.U.G.E.N Character Scraper & Verifier
// Downloads the 9 missing roster characters (zoro, ace, law, madara, aizen, gojo, sukuna, tanjiro, zenitsu)
// from Archive.org ZIP streams + MediaFire JUS archives, verifies SFF/AIR integrity,
// and updates mugen-presets-extra.json & mugen-presets-extra.js while preserving all 31 existing extra presets.

'use strict';

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const ROOT_DIR = __dirname;
const CHARS_DIR = path.join(ROOT_DIR, 'chars');
const PRESETS_JSON_PATH = path.join(ROOT_DIR, 'mugen-presets-extra.json');
const PRESETS_JS_PATH = path.join(ROOT_DIR, 'mugen-presets-extra.js');

const MAX_RETRIES = 4;
const REQUEST_TIMEOUT_MS = 120000;
const MIN_SPRITES = 50;

const ARCHIVE_ZIPS = {
  one_piece_v1: 'https://archive.org/download/one-piece-mugen-v1/One%20Piece%20Mugen%20V1.zip/',
  one_piece_x_naruto_v2: 'https://archive.org/download/one-piece-x-naruto-mugen-v2/One%20Piece%20x%20Naruto%20Mugen%20v2.zip/',
  naruto_vs_dbs: 'https://archive.org/download/naruto-vs-dragon-ball-super-mugen/Naruto%20vs%20Dragon%20Ball%20Super%20Mugen.zip/',
  bleach_2015: 'https://archive.org/download/bleach-mugen-2015/Bleach%20Mugen%202015.zip/',
  demon_slayer_v12: 'https://archive.org/download/demon-slayer-mugen-v12/Demon%20Slayer%20Mugen%20V12.zip/'
};

const TARGETS = [
  {
    slotId: 'zoro',
    candidates: [
      { type: 'archive', zipKey: 'one_piece_v1', dir: 'SM_Zoro_TS' },
      { type: 'archive', zipKey: 'one_piece_v1', dir: 'ZoroRoronoa' }
    ]
  },
  {
    slotId: 'ace',
    candidates: [
      { type: 'archive', zipKey: 'one_piece_v1', dir: 'Ace' }
    ]
  },
  {
    slotId: 'law',
    candidates: [
      { type: 'archive', zipKey: 'one_piece_x_naruto_v2', dir: 'LawTS' },
      { type: 'archive', zipKey: 'one_piece_v1', dir: 'TrafalgarLaw' }
    ]
  },
  {
    slotId: 'madara',
    candidates: [
      { type: 'archive', zipKey: 'naruto_vs_dbs', dir: 'Madara_Rikudou' },
      { type: 'archive', zipKey: 'one_piece_x_naruto_v2', dir: 'A-m-Madara Uchiha edo tensei' }
    ]
  },
  {
    slotId: 'aizen',
    candidates: [
      { type: 'archive', zipKey: 'bleach_2015', dir: 'Ultimate_Aizen' },
      { type: 'archive', zipKey: 'bleach_2015', dir: 'Aizen' }
    ]
  },
  {
    slotId: 'tanjiro',
    candidates: [
      { type: 'archive', zipKey: 'demon_slayer_v12', dir: 'Tanjiro all forms' },
      { type: 'archive', zipKey: 'demon_slayer_v12', dir: 'Tanjiro_HK' }
    ]
  },
  {
    slotId: 'zenitsu',
    candidates: [
      { type: 'archive', zipKey: 'demon_slayer_v12', dir: 'Zenitsu_Agatsuma' },
      { type: 'archive', zipKey: 'demon_slayer_v12', dir: 'Zenitsu' }
    ]
  },
  {
    slotId: 'gojo',
    candidates: [
      { type: 'mediafire', pageUrl: 'https://www.mediafire.com/file/8b3nxci81uhs8h3/Gojo.rar/file', archiveName: 'Gojo.rar' },
      { type: 'mediafire', pageUrl: 'https://www.mediafire.com/file/tmbm0jvls6l9luc/TC_Gojo_Satoru_BETA.zip/file', archiveName: 'TC_Gojo_Satoru_BETA.zip' }
    ]
  },
  {
    slotId: 'sukuna',
    candidates: [
      { type: 'mediafire', pageUrl: 'https://www.mediafire.com/file/a9mdp2t0gcf9w8n/Sukuna_Ryomen_S1.zip/file', archiveName: 'Sukuna_Ryomen_S1.zip' },
      { type: 'mediafire', pageUrl: 'https://www.mediafire.com/file/hazma9lei2bxxgv/Sukuna_Shibuya_Cinontk.zip/file', archiveName: 'Sukuna_Shibuya_Cinontk.zip' }
    ]
  }
];

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36';

function sanitizeFileName(name) {
  let clean = name;
  try { clean = decodeURIComponent(name); } catch (_) {}
  return clean.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '_');
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function fetchText(url, redirectsLeft = 10) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https:') ? https : http;
    const req = mod.get(url, { headers: { 'User-Agent': UA } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        if (redirectsLeft <= 0) return reject(new Error(`Too many redirects: ${url}`));
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
      res.on('data', (c) => { received += c.length; });
      res.on('error', fail);
      out.on('error', fail);
      out.on('finish', () => {
        if (settled) return;
        settled = true;
        try {
          const expectedLen = res.headers['content-length'] ? parseInt(res.headers['content-length'], 10) : null;
          if (expectedLen && received !== expectedLen) {
            try { fs.unlinkSync(tmpPath); } catch (_) {}
            return reject(new Error(`Truncated download (${received}/${expectedLen})`));
          }
          if (received === 0) {
            try { fs.unlinkSync(tmpPath); } catch (_) {}
            return reject(new Error('Zero-byte download'));
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
    req.setTimeout(REQUEST_TIMEOUT_MS, () => req.destroy(new Error(`Timeout after ${REQUEST_TIMEOUT_MS}ms`)));
    req.on('error', reject);
  });
}

async function downloadWithRetry(url, destPath, expectedSize) {
  if (fs.existsSync(destPath)) {
    const st = fs.statSync(destPath);
    if ((expectedSize && st.size === expectedSize) || (!expectedSize && st.size > 0)) {
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
      if (attempt < MAX_RETRIES) await sleep(1200 * attempt);
    }
  }
  throw lastErr;
}

function parseArchiveHtml(html) {
  const re = /href="(\/\/archive\.org\/download\/[^"]+)"[^>]*>([^<]+)<\/a><td><td>([^<]*)<td id="size">(\d+)/g;
  const map = {};
  let m;
  while ((m = re.exec(html)) !== null) {
    const url = 'https:' + m[1];
    const rel = m[2];
    const size = parseInt(m[4], 10);
    const cm = rel.match(/chars\/([^/]+)\/(.+)$/i);
    if (!cm) continue;
    const charDir = cm[1];
    const fileRel = cm[2];
    if (!map[charDir]) map[charDir] = [];
    map[charDir].push({ fileName: path.basename(fileRel), fileRel, size, url });
  }
  return map;
}

function parseDefFields(defText) {
  const out = {};
  const lines = defText.split(/\r?\n/);
  let inFiles = false;
  for (const raw of lines) {
    const line = raw.replace(/;.*$/, '').trim();
    if (!line) continue;
    if (/^\[(.+)\]$/.test(line)) {
      inFiles = /^\[files\]$/i.test(line);
      continue;
    }
    if (!inFiles) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const k = line.slice(0, eq).trim().toLowerCase();
    const v = line.slice(eq + 1).trim().replace(/^["']|["']$/g, '').replace(/\\/g, '/');
    if (v && !out[k]) out[k] = v;
  }
  return out;
}

function matchEntryByDefRef(entries, refVal, extRegex) {
  if (refVal) {
    const refLower = refVal.toLowerCase();
    const baseLower = path.basename(refVal).toLowerCase();
    const exactRel = entries.find((e) => (e.fileRel || e.fileName).toLowerCase() === refLower);
    if (exactRel) return exactRel;
    const exactBase = entries.find((e) => e.fileName.toLowerCase() === baseLower);
    if (exactBase) return exactBase;
  }
  const cands = entries.filter((e) => extRegex.test(e.fileName) && !/ending|intro/i.test(e.fileName));
  if (cands.length === 0) return entries.find((e) => extRegex.test(e.fileName)) || null;
  cands.sort((a, b) => (b.size || 0) - (a.size || 0));
  return cands[0];
}

function pickPrimaryAct(actEntries, defFields) {
  if (!actEntries || actEntries.length === 0) return null;
  if (defFields.pal1) {
    const want = path.basename(defFields.pal1).toLowerCase();
    const found = actEntries.find((a) => a.fileName.toLowerCase() === want);
    if (found) return found;
  }
  const oneAct = actEntries.find((a) => a.fileName.toLowerCase() === '1.act');
  if (oneAct) return oneAct;
  return actEntries.slice().sort((a, b) => a.fileName.localeCompare(b.fileName))[0];
}

function inspectSffFile(filePath) {
  const st = fs.statSync(filePath);
  if (st.size < 64) throw new Error(`SFF too small (${st.size} bytes)`);
  const fd = fs.openSync(filePath, 'r');
  const hdr = Buffer.alloc(64);
  try {
    fs.readSync(fd, hdr, 0, 64, 0);
  } finally {
    fs.closeSync(fd);
  }
  const sig = hdr.subarray(0, 11).toString('ascii');
  if (sig !== 'ElecbyteSpr') throw new Error(`Invalid SFF signature "${sig}"`);
  const verHi = hdr[15];
  const sffVersion = verHi >= 2 ? 'v2.0' : 'v1.0';
  const sprites = verHi >= 2 ? hdr.readUInt32LE(40) : hdr.readUInt32LE(20);
  if (sprites < MIN_SPRITES) throw new Error(`Too few sprites (${sprites} < ${MIN_SPRITES})`);
  return { sffVersion, sprites, sizeBytes: st.size };
}

function inspectAirFile(filePath) {
  const text = fs.readFileSync(filePath, 'latin1');
  if (!/\[Begin Action/i.test(text)) throw new Error('Missing [Begin Action in AIR');
  const actionIds = new Set();
  const re = /^\s*\[Begin Action\s+(-?\d+)\]/gmi;
  let m;
  while ((m = re.exec(text)) !== null) {
    actionIds.add(m[1]);
  }
  if (actionIds.size === 0) throw new Error('No parsed actions in AIR');
  return { actions: actionIds.size, hasIdle0: actionIds.has('0') };
}

function cleanDir(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
  }
  fs.mkdirSync(dirPath, { recursive: true });
}

function walkFiles(dirPath, base = dirPath) {
  const out = [];
  for (const ent of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const full = path.join(dirPath, ent.name);
    if (ent.isDirectory()) {
      out.push(...walkFiles(full, base));
    } else {
      const st = fs.statSync(full);
      out.push({
        fullPath: full,
        fileName: ent.name,
        fileRel: path.relative(base, full).replace(/\\/g, '/'),
        size: st.size
      });
    }
  }
  return out;
}

async function tryArchiveCandidate(slotId, cand, zipCatalogs) {
  const map = zipCatalogs[cand.zipKey];
  const entries = map && map[cand.dir];
  if (!entries || entries.length === 0) {
    throw new Error(`Dir "${cand.dir}" not found in ${cand.zipKey}`);
  }
  const coreEntries = entries.filter((f) => /\.(def|sff|air|act)$/i.test(f.fileName));
  const defCandidates = coreEntries.filter((f) => /\.def$/i.test(f.fileName) && !/ending|intro/i.test(f.fileName) && !f.fileRel.includes('/'));
  const defItem = defCandidates[0] || coreEntries.find((f) => /\.def$/i.test(f.fileName));
  if (!defItem) throw new Error(`No .def in ${cand.dir}`);

  const charDir = path.join(CHARS_DIR, slotId);
  cleanDir(charDir);

  const defName = sanitizeFileName(defItem.fileName);
  const defPath = path.join(charDir, defName);
  await downloadWithRetry(defItem.url, defPath, defItem.size);
  const defText = fs.readFileSync(defPath, 'latin1');
  const defFields = parseDefFields(defText);

  const sffItem = matchEntryByDefRef(coreEntries, defFields.sprite, /\.sff$/i);
  const airItem = matchEntryByDefRef(coreEntries, defFields.anim, /\.air$/i);
  const actEntries = coreEntries.filter((f) => /\.act$/i.test(f.fileName));
  const actItem = pickPrimaryAct(actEntries, defFields);

  if (!sffItem || !airItem) {
    throw new Error(`Missing sff/air for ${cand.dir} (sff=${!!sffItem}, air=${!!airItem})`);
  }

  const sffName = sanitizeFileName(sffItem.fileName);
  const airName = sanitizeFileName(airItem.fileName);
  const actName = actItem ? sanitizeFileName(actItem.fileName) : null;

  const sffPath = path.join(charDir, sffName);
  const airPath = path.join(charDir, airName);
  const actPath = actName ? path.join(charDir, actName) : null;

  await Promise.all([
    downloadWithRetry(sffItem.url, sffPath, sffItem.size),
    downloadWithRetry(airItem.url, airPath, airItem.size),
    actItem ? downloadWithRetry(actItem.url, actPath, actItem.size) : Promise.resolve(null)
  ]);

  const sffInfo = inspectSffFile(sffPath);
  const airInfo = inspectAirFile(airPath);

  return {
    source: `archive.org/${cand.zipKey}/${cand.dir}`,
    preset: {
      defUrl: `chars/${slotId}/${defName}`,
      sffUrl: `chars/${slotId}/${sffName}`,
      airUrl: `chars/${slotId}/${airName}`,
      actUrl: actName ? `chars/${slotId}/${actName}` : null,
      sffVersion: sffInfo.sffVersion,
      sprites: sffInfo.sprites,
      actions: airInfo.actions
    },
    sizeBytes: sffInfo.sizeBytes,
    hasIdle0: airInfo.hasIdle0
  };
}

async function tryMediafireCandidate(slotId, cand) {
  const html = await fetchText(cand.pageUrl);
  const m = html.match(/href="(https:\/\/download\d+\.mediafire\.com\/[^"]+)"/i);
  if (!m) throw new Error(`No direct download URL on MediaFire page ${cand.pageUrl}`);
  const directUrl = m[1];

  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), `mugen-${slotId}-`));
  const archivePath = path.join(tmpRoot, cand.archiveName);
  const extractDir = path.join(tmpRoot, 'extracted');
  fs.mkdirSync(extractDir, { recursive: true });

  try {
    console.log(`  [${slotId}] Downloading ${cand.archiveName} from MediaFire...`);
    await downloadWithRetry(directUrl, archivePath);

    // Extract ONLY .def, .sff, .air, .act (skip huge .snd!)
    execFileSync(
      '7z',
      ['x', archivePath, `-o${extractDir}`, '-y', '*.def', '*.sff', '*.air', '*.act', '-r'],
      { stdio: 'pipe' }
    );

    const extracted = walkFiles(extractDir);
    const defs = extracted.filter((f) => /\.def$/i.test(f.fileName) && !/ending|intro|story/i.test(f.fileName));
    if (defs.length === 0) throw new Error('No .def extracted from archive');

    // Pick best .def whose referenced sff+air exist
    let chosen = null;
    for (const defEnt of defs) {
      const defDir = path.dirname(defEnt.fullPath);
      const relFiles = extracted.map((f) => ({
        ...f,
        fileRel: path.relative(defDir, f.fullPath).replace(/\\/g, '/')
      }));
      const defFields = parseDefFields(fs.readFileSync(defEnt.fullPath, 'latin1'));
      const sffEnt = matchEntryByDefRef(relFiles, defFields.sprite, /\.sff$/i);
      const airEnt = matchEntryByDefRef(relFiles, defFields.anim, /\.air$/i);
      const actEnt = pickPrimaryAct(relFiles.filter((f) => /\.act$/i.test(f.fileName)), defFields);
      if (sffEnt && airEnt) {
        chosen = { defEnt, sffEnt, airEnt, actEnt };
        break;
      }
    }
    if (!chosen) throw new Error('Could not resolve def+sff+air pair in archive');

    const charDir = path.join(CHARS_DIR, slotId);
    cleanDir(charDir);

    const defName = sanitizeFileName(chosen.defEnt.fileName);
    const sffName = sanitizeFileName(chosen.sffEnt.fileName);
    const airName = sanitizeFileName(chosen.airEnt.fileName);
    const actName = chosen.actEnt ? sanitizeFileName(chosen.actEnt.fileName) : null;

    const defPath = path.join(charDir, defName);
    const sffPath = path.join(charDir, sffName);
    const airPath = path.join(charDir, airName);
    const actPath = actName ? path.join(charDir, actName) : null;

    fs.copyFileSync(chosen.defEnt.fullPath, defPath);
    fs.copyFileSync(chosen.sffEnt.fullPath, sffPath);
    fs.copyFileSync(chosen.airEnt.fullPath, airPath);
    if (chosen.actEnt && actPath) fs.copyFileSync(chosen.actEnt.fullPath, actPath);

    const sffInfo = inspectSffFile(sffPath);
    const airInfo = inspectAirFile(airPath);

    return {
      source: `mediafire/${cand.archiveName}`,
      preset: {
        defUrl: `chars/${slotId}/${defName}`,
        sffUrl: `chars/${slotId}/${sffName}`,
        airUrl: `chars/${slotId}/${airName}`,
        actUrl: actName ? `chars/${slotId}/${actName}` : null,
        sffVersion: sffInfo.sffVersion,
        sprites: sffInfo.sprites,
        actions: airInfo.actions
      },
      sizeBytes: sffInfo.sizeBytes,
      hasIdle0: airInfo.hasIdle0
    };
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
}

async function main() {
  const startMs = Date.now();
  console.log('[scrape-missing-chars] Indexing Archive.org ZIP catalogs...');

  const zipCatalogs = {};
  await Promise.all(
    Object.entries(ARCHIVE_ZIPS).map(async ([key, url]) => {
      const html = await fetchText(url);
      zipCatalogs[key] = parseArchiveHtml(html);
      console.log(`  [INDEX] ${key}: ${Object.keys(zipCatalogs[key]).length} chars`);
    })
  );

  // Load existing presets so we preserve ALL 31 existing entries
  const existingPresets = JSON.parse(fs.readFileSync(PRESETS_JSON_PATH, 'utf8'));
  const existingCount = Object.keys(existingPresets).length;
  console.log(`[scrape-missing-chars] Loaded ${existingCount} existing extra presets.`);

  const added = {};
  const failed = [];

  for (const target of TARGETS) {
    let ok = null;
    const errs = [];
    for (const cand of target.candidates) {
      try {
        if (cand.type === 'archive') {
          ok = await tryArchiveCandidate(target.slotId, cand, zipCatalogs);
        } else if (cand.type === 'mediafire') {
          ok = await tryMediafireCandidate(target.slotId, cand);
        }
        break;
      } catch (err) {
        errs.push(`${cand.dir || cand.archiveName}: ${err.message}`);
      }
    }

    if (ok) {
      added[target.slotId] = ok;
      existingPresets[target.slotId] = ok.preset;
      console.log(
        `[OK] ${target.slotId.padEnd(10)} | ${ok.preset.sffVersion} | ${String(ok.preset.sprites).padStart(5)} sprites | ${String(ok.preset.actions).padStart(4)} actions | idle0=${ok.hasIdle0} | ${(ok.sizeBytes / 1048576).toFixed(2).padStart(6)} MB | ${ok.source}`
      );
    } else {
      failed.push({ slotId: target.slotId, errs });
      console.error(`[FAIL] ${target.slotId}: ${errs.join(' ; ')}`);
    }
  }

  // Write merged mugen-presets-extra.json & mugen-presets-extra.js
  fs.writeFileSync(PRESETS_JSON_PATH, JSON.stringify(existingPresets, null, 2) + '\n', 'utf8');
  const jsOutput =
    '// Auto-generated by scrape-extra-chars.js & scrape-missing-chars.js — Extra M.U.G.E.N character presets\n' +
    'window.EXTRA_MUGEN_PRESETS = ' +
    JSON.stringify(existingPresets, null, 2) +
    ';\n';
  fs.writeFileSync(PRESETS_JS_PATH, jsOutput, 'utf8');

  const elapsedSec = ((Date.now() - startMs) / 1000).toFixed(1);
  console.log('\n==================== MISSING CHARS SUMMARY ====================');
  console.log(`Added & verified : ${Object.keys(added).length}/${TARGETS.length} in ${elapsedSec}s`);
  console.log(`Total extra keys : ${Object.keys(existingPresets).length} (preserved ${existingCount} existing)`);
  if (failed.length > 0) {
    console.log('Failed:');
    for (const f of failed) console.log(`  - ${f.slotId}: ${f.errs.join(' ; ')}`);
  }
  console.log('===============================================================');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
