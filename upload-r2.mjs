#!/usr/bin/env node
// language: JavaScript (ESM), file: upload-r2.mjs, target: Node.js 18+ Zero-Dependency Cloudflare R2 Uploader (AWS SigV4)
// Uploads active M.U.G.E.N assets (.sff, .air, .act, .def) from chars/ to Cloudflare R2.
// Usage:
//   node upload-r2.mjs                 # Upload via SigV4 (skips already-uploaded files with matching size)
//   node upload-r2.mjs --dry-run       # Preview files to upload without network calls
//   node upload-r2.mjs --force         # Re-upload even if file already exists in R2
//   node upload-r2.mjs --concurrency=6 # Override concurrent uploads (default: 6)
//   node upload-r2.mjs --wrangler      # Alternative mode using `npx wrangler r2 object put`

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CHARS_DIR = path.join(__dirname, 'chars');
const ALLOWED_EXTS = new Set(['.sff', '.air', '.act', '.def']);
const SKIPPED_DIRS = new Set(['jus_db_naruto']);
const MAX_RETRIES = 3;

const CONTENT_TYPES = {
  '.sff': 'application/octet-stream',
  '.act': 'application/octet-stream',
  '.air': 'text/plain; charset=utf-8',
  '.def': 'text/plain; charset=utf-8'
};

// Load local .env file if present (never overrides existing process.env)
function loadDotEnv(envPath) {
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eqIdx = line.indexOf('=');
    if (eqIdx <= 0) continue;
    const key = line.slice(0, eqIdx).trim();
    let val = line.slice(eqIdx + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (key && !(key in process.env)) {
      process.env[key] = val;
    }
  }
}

function parseArgs(argv) {
  const opts = {
    dryRun: false,
    force: false,
    useWrangler: false,
    concurrency: 6
  };
  for (const arg of argv) {
    if (arg === '--dry-run') opts.dryRun = true;
    else if (arg === '--force') opts.force = true;
    else if (arg === '--wrangler') opts.useWrangler = true;
    else if (arg.startsWith('--concurrency=')) {
      const n = Number(arg.split('=')[1]);
      if (Number.isInteger(n) && n >= 1 && n <= 24) opts.concurrency = n;
    }
  }
  return opts;
}

function collectActiveFiles(baseDir) {
  const files = [];
  if (!fs.existsSync(baseDir)) return files;

  function walk(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        if (SKIPPED_DIRS.has(entry.name.toLowerCase())) continue;
        walk(fullPath);
      } else if (entry.isFile()) {
        const lower = entry.name.toLowerCase();
        if (lower.endsWith('_catalog.json')) continue;
        const ext = path.extname(lower);
        if (!ALLOWED_EXTS.has(ext)) continue;
        const stat = fs.statSync(fullPath);
        const relFromRoot = path.relative(__dirname, fullPath).split(path.sep).join('/');
        files.push({
          fullPath,
          key: relFromRoot,
          ext,
          size: stat.size
        });
      }
    }
  }

  walk(baseDir);
  files.sort((a, b) => a.key.localeCompare(b.key));
  return files;
}

// ==================== AWS SIGV4 SIGNER (ZERO DEPENDENCIES) ====================
function sha256Hex(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

function hmacSha256(key, data) {
  return crypto.createHmac('sha256', key).update(data).digest();
}

function encodeRfc3986(str) {
  return encodeURIComponent(str).replace(
    /[!'()*]/g,
    (ch) => '%' + ch.charCodeAt(0).toString(16).toUpperCase()
  );
}

function encodeS3Path(bucket, key) {
  const segments = [bucket, ...key.split('/')].map(encodeRfc3986);
  return '/' + segments.join('/');
}

function getAmzDate(now = new Date()) {
  const iso = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  return {
    amzDate: iso,          // YYYYMMDDTHHMMSSZ
    dateStamp: iso.slice(0, 8) // YYYYMMDD
  };
}

function signR2Request({ method, host, canonicalUri, payloadHash, accessKeyId, secretAccessKey, extraHeaders = {} }) {
  const region = 'auto';
  const service = 's3';
  const { amzDate, dateStamp } = getAmzDate();

  const headersMap = new Map();
  headersMap.set('host', host);
  headersMap.set('x-amz-content-sha256', payloadHash);
  headersMap.set('x-amz-date', amzDate);

  for (const [k, v] of Object.entries(extraHeaders)) {
    headersMap.set(k.toLowerCase(), String(v).trim());
  }

  const sortedKeys = Array.from(headersMap.keys()).sort();
  const canonicalHeaders = sortedKeys.map((k) => `${k}:${headersMap.get(k)}\n`).join('');
  const signedHeaders = sortedKeys.join(';');

  const canonicalRequest = [
    method,
    canonicalUri,
    '', // canonical query string
    canonicalHeaders,
    signedHeaders,
    payloadHash
  ].join('\n');

  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest)
  ].join('\n');

  const kDate = hmacSha256(`AWS4${secretAccessKey}`, dateStamp);
  const kRegion = hmacSha256(kDate, region);
  const kService = hmacSha256(kRegion, service);
  const kSigning = hmacSha256(kService, 'aws4_request');
  const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');

  const authorization =
    `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const outHeaders = {
    'x-amz-date': amzDate,
    'x-amz-content-sha256': payloadHash,
    Authorization: authorization
  };
  for (const [k, v] of Object.entries(extraHeaders)) {
    outHeaders[k] = v;
  }
  return outHeaders;
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetries(label, fn) {
  let lastErr;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt < MAX_RETRIES) {
        const delayMs = 600 * Math.pow(2, attempt - 1);
        console.warn(`[retry ${attempt}/${MAX_RETRIES - 1}] ${label}: ${err.message} (wait ${delayMs}ms)`);
        await sleep(delayMs);
      }
    }
  }
  throw lastErr;
}

async function headR2Object(cfg, key) {
  const host = `${cfg.accountId}.r2.cloudflarestorage.com`;
  const canonicalUri = encodeS3Path(cfg.bucket, key);
  const payloadHash = sha256Hex('');
  const headers = signR2Request({
    method: 'HEAD',
    host,
    canonicalUri,
    payloadHash,
    accessKeyId: cfg.accessKeyId,
    secretAccessKey: cfg.secretAccessKey
  });

  const res = await fetch(`https://${host}${canonicalUri}`, {
    method: 'HEAD',
    headers
  });

  if (res.status === 404) return { exists: false, size: -1 };
  if (!res.ok) {
    throw new Error(`HEAD ${key} failed with HTTP ${res.status}`);
  }
  const cl = Number(res.headers.get('content-length') || -1);
  return { exists: true, size: cl };
}

async function putR2Object(cfg, file) {
  const host = `${cfg.accountId}.r2.cloudflarestorage.com`;
  const canonicalUri = encodeS3Path(cfg.bucket, file.key);
  const body = await fs.promises.readFile(file.fullPath);
  const payloadHash = sha256Hex(body);
  const contentType = CONTENT_TYPES[file.ext] || 'application/octet-stream';
  const cacheControl = 'public, max-age=31536000, immutable';

  const headers = signR2Request({
    method: 'PUT',
    host,
    canonicalUri,
    payloadHash,
    accessKeyId: cfg.accessKeyId,
    secretAccessKey: cfg.secretAccessKey,
    extraHeaders: {
      'content-type': contentType,
      'cache-control': cacheControl
    }
  });

  const res = await fetch(`https://${host}${canonicalUri}`, {
    method: 'PUT',
    headers,
    body
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`PUT ${file.key} failed with HTTP ${res.status}: ${errText.slice(0, 200)}`);
  }
}

async function headPublicR2Object(publicUrl, key) {
  const base = publicUrl.replace(/\/+$/, '');
  const encodedKey = key.split('/').map(encodeRfc3986).join('/');
  const res = await fetch(`${base}/${encodedKey}`, { method: 'HEAD' });
  if (res.status === 404) return { exists: false, size: -1 };
  if (!res.ok) return { exists: false, size: -1 };
  const lenHeader = res.headers.get('content-length');
  return { exists: true, size: lenHeader ? Number(lenHeader) : -1 };
}

function resolveWranglerCommand() {
  if (process.platform === 'win32' && process.env.APPDATA) {
    const directJs = path.join(process.env.APPDATA, 'npm', 'node_modules', 'wrangler', 'bin', 'wrangler.js');
    if (fs.existsSync(directJs)) {
      return { cmd: process.execPath, prefixArgs: [directJs], shell: false };
    }
    return { cmd: 'wrangler.cmd', prefixArgs: [], shell: true };
  }
  return { cmd: 'wrangler', prefixArgs: [], shell: false };
}

const WRANGLER_CMD = resolveWranglerCommand();

async function putWithWrangler(bucket, file) {
  const contentType = CONTENT_TYPES[file.ext] || 'application/octet-stream';
  await execFileAsync(
    WRANGLER_CMD.cmd,
    [
      ...WRANGLER_CMD.prefixArgs,
      'r2',
      'object',
      'put',
      `${bucket}/${file.key}`,
      '--file',
      file.fullPath,
      '--content-type',
      contentType,
      '--cache-control',
      'public, max-age=31536000, immutable',
      '--remote'
    ],
    { shell: WRANGLER_CMD.shell, maxBuffer: 10 * 1024 * 1024 }
  );
}

function formatMB(bytes) {
  return (bytes / (1024 * 1024)).toFixed(2);
}

function printMissingEnvHelp(missing) {
  console.error('\n[upload-r2] Missing required environment variables:');
  for (const name of missing) {
    console.error(`  - ${name}`);
  }
  console.error('\nSet them before running `npm run upload-r2` (or place them in a gitignored `.env` file):');
  console.error('\n  PowerShell:');
  console.error('    $env:R2_ACCOUNT_ID="your_cloudflare_account_id"');
  console.error('    $env:R2_ACCESS_KEY_ID="your_r2_access_key_id"');
  console.error('    $env:R2_SECRET_ACCESS_KEY="your_r2_secret_access_key"');
  console.error('    $env:R2_BUCKET="anime-crossover-assets"');
  console.error('    npm run upload-r2');
  console.error('\n  Bash / macOS / Linux:');
  console.error('    export R2_ACCOUNT_ID="your_cloudflare_account_id"');
  console.error('    export R2_ACCESS_KEY_ID="your_r2_access_key_id"');
  console.error('    export R2_SECRET_ACCESS_KEY="your_r2_secret_access_key"');
  console.error('    export R2_BUCKET="anime-crossover-assets"');
  console.error('    npm run upload-r2\n');
}

async function main() {
  loadDotEnv(path.join(__dirname, '.env'));
  const opts = parseArgs(process.argv.slice(2));

  const files = collectActiveFiles(CHARS_DIR);
  const totalBytes = files.reduce((sum, f) => sum + f.size, 0);

  if (files.length === 0) {
    console.error(`[upload-r2] No active .sff/.air/.act/.def files found in ${CHARS_DIR}`);
    process.exit(1);
  }

  console.log(
    `[upload-r2] Found ${files.length} active M.U.G.E.N files (${formatMB(totalBytes)} MB) ` +
    `(skipping *_catalog.json & jus_db_naruto).`
  );

  if (opts.dryRun) {
    for (const f of files.slice(0, 15)) {
      console.log(`  [dry-run] ${f.key} (${formatMB(f.size)} MB)`);
    }
    if (files.length > 15) {
      console.log(`  ... and ${files.length - 15} more files.`);
    }
    console.log('[upload-r2] Dry-run complete.');
    return;
  }

  const cfg = {
    accountId: (process.env.R2_ACCOUNT_ID || '').trim(),
    accessKeyId: (process.env.R2_ACCESS_KEY_ID || '').trim(),
    secretAccessKey: (process.env.R2_SECRET_ACCESS_KEY || '').trim(),
    bucket: (process.env.R2_BUCKET || '').trim()
  };

  if (opts.useWrangler) {
    if (!cfg.bucket) {
      printMissingEnvHelp(['R2_BUCKET']);
      process.exit(1);
    }
  } else {
    const missing = [];
    if (!cfg.accountId) missing.push('R2_ACCOUNT_ID');
    if (!cfg.accessKeyId) missing.push('R2_ACCESS_KEY_ID');
    if (!cfg.secretAccessKey) missing.push('R2_SECRET_ACCESS_KEY');
    if (!cfg.bucket) missing.push('R2_BUCKET');
    if (missing.length > 0) {
      printMissingEnvHelp(missing);
      process.exit(1);
    }
  }

  console.log(
    `[upload-r2] Target bucket: ${cfg.bucket} | mode: ${opts.useWrangler ? 'wrangler' : 'SigV4'} | ` +
    `concurrency: ${opts.concurrency} | force: ${opts.force}`
  );

  let nextIdx = 0;
  let uploaded = 0;
  let skipped = 0;
  let failed = 0;
  let uploadedBytes = 0;
  const startMs = Date.now();

  async function worker() {
    while (true) {
      const idx = nextIdx++;
      if (idx >= files.length) return;
      const file = files[idx];
      const tag = `[${idx + 1}/${files.length}]`;

      try {
        if (opts.useWrangler) {
          const publicUrl = (process.env.R2_PUBLIC_URL || '').trim();
          if (!opts.force && publicUrl) {
            const head = await withRetries(`HEAD ${file.key}`, () => headPublicR2Object(publicUrl, file.key));
            if (head.exists && head.size === file.size) {
              skipped++;
              console.log(`${tag} SKIPPED  ${file.key} (exists, ${formatMB(file.size)} MB)`);
              continue;
            }
          }
          await withRetries(file.key, () => putWithWrangler(cfg.bucket, file));
          uploaded++;
          uploadedBytes += file.size;
          console.log(`${tag} UPLOADED ${file.key} (${formatMB(file.size)} MB)`);
        } else {
          if (!opts.force) {
            const head = await withRetries(`HEAD ${file.key}`, () => headR2Object(cfg, file.key));
            if (head.exists && head.size === file.size) {
              skipped++;
              console.log(`${tag} SKIPPED  ${file.key} (exists, ${formatMB(file.size)} MB)`);
              continue;
            }
          }
          await withRetries(`PUT ${file.key}`, () => putR2Object(cfg, file));
          uploaded++;
          uploadedBytes += file.size;
          console.log(`${tag} UPLOADED ${file.key} (${formatMB(file.size)} MB)`);
        }
      } catch (err) {
        failed++;
        console.error(`${tag} FAILED   ${file.key}: ${err.message}`);
      }
    }
  }

  const workers = Array.from({ length: Math.min(opts.concurrency, files.length) }, () => worker());
  await Promise.all(workers);

  const elapsedSec = ((Date.now() - startMs) / 1000).toFixed(1);
  console.log('\n==================== UPLOAD SUMMARY ====================');
  console.log(`Uploaded : ${uploaded} files (${formatMB(uploadedBytes)} MB)`);
  console.log(`Skipped  : ${skipped} files`);
  console.log(`Failed   : ${failed} files`);
  console.log(`Elapsed  : ${elapsedSec}s`);
  console.log('========================================================');

  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('[upload-r2] Fatal error:', err);
  process.exit(1);
});
