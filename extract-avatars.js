// language: JavaScript, file: extract-avatars.js, target: Zero-Dependency Node + Headless Chrome Real M.U.G.E.N Portrait Extractor
// Uses verified mugen-loader.js in headless Chrome to extract 9000,0 (avatar icon) & 9000,1 / idle (big portrait) for all 58 fighters!

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const os = require('os');

const ROOT = __dirname;
const OUT_DIR = path.join(ROOT, 'avatars');
fs.mkdirSync(OUT_DIR, { recursive: true });

const CHROME_CANDIDATES = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe'
];
const CHROME_PATH = CHROME_CANDIDATES.find((p) => fs.existsSync(p));
if (!CHROME_PATH) {
  console.error('No Chrome/Edge executable found!');
  process.exit(1);
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png'
};

const ONLY_ARG = process.argv.find((a) => a.startsWith('--only='));
const ONLY_IDS = ONLY_ARG ? ONLY_ARG.slice('--only='.length).split(',').map((s) => s.trim()).filter(Boolean) : [];
const MANIFEST_PATH = path.join(OUT_DIR, 'manifest.json');

const EXTRACT_HTML = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Avatar Extractor</title></head>
<body>
  <script src="roster.js"></script>
  <script src="roster-extra.js"></script>
  <script src="mugen-presets-extra.js"></script>
  <script src="mugen-loader.js"></script>
  <script>
    (async () => {
      const ONLY_IDS = ${JSON.stringify(ONLY_IDS)};
      const allRaw = [...(window.FIGHTER_ROSTER || [])];
      const seen = new Set(allRaw.map((f) => f.id));
      for (const f of (window.EXTRA_FIGHTER_ROSTER || [])) {
        if (f && f.id && !seen.has(f.id)) {
          allRaw.push(f);
          seen.add(f.id);
        }
      }
      const all = ONLY_IDS.length ? allRaw.filter((f) => ONLY_IDS.includes(f.id)) : allRaw;

      function analyzeCanvas(cnv) {
        if (!cnv || cnv.width < 8 || cnv.height < 8) return null;
        const tmp = document.createElement('canvas');
        tmp.width = cnv.width;
        tmp.height = cnv.height;
        const ctx = tmp.getContext('2d');
        ctx.drawImage(cnv, 0, 0);
        const img = ctx.getImageData(0, 0, cnv.width, cnv.height).data;
        let minX = cnv.width, minY = cnv.height, maxX = -1, maxY = -1;
        let visible = 0, colorful = 0;
        const colorSet = new Set();
        for (let y = 0; y < cnv.height; y++) {
          for (let x = 0; x < cnv.width; x++) {
            const idx = (y * cnv.width + x) * 4;
            const a = img[idx + 3];
            if (a > 24) {
              visible++;
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
              const r = img[idx], g = img[idx + 1], b = img[idx + 2];
              if (r + g + b > 30) colorful++;
              if (colorSet.size < 32) {
                colorSet.add(((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4));
              }
            }
          }
        }
        if (visible < 40 || maxX < minX || maxY < minY) return null;
        const bw = maxX - minX + 1;
        const bh = maxY - minY + 1;
        return {
          cnv, minX, minY, bw, bh, visible, colorful, uniqueColors: colorSet.size,
          isGood: colorful >= 35 && (colorful / visible) >= 0.42 && colorSet.size >= 4 && bw >= 12 && bh >= 12
        };
      }

      function renderSquareIcon(info, mode) {
        const out = document.createElement('canvas');
        out.width = 112;
        out.height = 112;
        const ctx = out.getContext('2d');
        const isPixelArt = Math.max(info.bw, info.bh) <= 96;
        ctx.imageSmoothingEnabled = !isPixelArt;

        let sx = info.minX, sy = info.minY, sw = info.bw, sh = info.bh;
        if (mode === 'head_crop') {
          sh = Math.min(info.bh, Math.max(info.bw * 1.15, info.bh * 0.62));
        } else if (mode === 'bust_crop') {
          const cropH = Math.min(info.bh, Math.round(info.bh * 0.44));
          const cropW = Math.min(info.bw, cropH);
          sx = info.minX + Math.round((info.bw - cropW) * 0.48);
          sy = info.minY;
          sw = cropW;
          sh = cropH;
        }
        if (mode === 'portrait_cover' || mode === 'bust_crop') {
          const scale = Math.max(112 / sw, 112 / sh);
          const dw = sw * scale;
          const dh = sh * scale;
          const dx = (112 - dw) / 2;
          const dy = mode === 'bust_crop' ? 0 : Math.min(0, (112 - dh) * 0.18);
          ctx.drawImage(info.cnv, sx, sy, sw, sh, dx, dy, dw, dh);
        } else {
          const scale = Math.min(104 / sw, 104 / sh);
          const dw = sw * scale;
          const dh = sh * scale;
          ctx.drawImage(info.cnv, sx, sy, sw, sh, (112 - dw) / 2, (112 - dh) / 2 + 2, dw, dh);
        }
        return out.toDataURL('image/png');
      }

      function renderBigPortrait(info, isFullSprite) {
        const out = document.createElement('canvas');
        out.width = 240;
        out.height = 260;
        const ctx = out.getContext('2d');
        const isPixelArt = Math.max(info.bw, info.bh) <= 128;
        ctx.imageSmoothingEnabled = !isPixelArt;

        const pad = isFullSprite ? 12 : 6;
        const scale = Math.min((240 - pad * 2) / info.bw, (260 - pad * 2) / info.bh);
        const dw = info.bw * scale;
        const dh = info.bh * scale;
        const dx = (240 - dw) / 2;
        const dy = isFullSprite ? (260 - dh - 8) : (260 - dh) / 2;
        ctx.drawImage(info.cnv, info.minX, info.minY, info.bw, info.bh, dx, dy, dw, dh);
        return out.toDataURL('image/png');
      }

      const reg = window.mugenRegistry;
      let ok = 0;
      for (const f of all) {
        try {
          const pack = await reg.loadPresetForFighter(f.id);
          if (!pack || !pack.sff || !pack.sff.sprites) {
            await fetch('/_log', { method: 'POST', body: JSON.stringify({ id: f.id, err: 'no pack' }) });
            continue;
          }
          const getSpr = (k) => {
            const s = pack.sff.sprites.get(k);
            return (s && s.decoded && s.decoded.canvas) ? s.decoded.canvas : null;
          };
          const getIdle = () => {
            const idleAct = pack.air.get(pack.mapping.idle);
            if (idleAct && idleAct.elements) {
              for (const el of idleAct.elements) {
                if (el.groupNo >= 0 && el.groupNo < 9000 && el.imageNo >= 0) {
                  const c = getSpr(el.groupNo + ',' + el.imageNo);
                  if (c) return c;
                }
              }
            }
            for (const [k, s] of pack.sff.sprites.entries()) {
              if (!k.startsWith('9000,') && s && s.decoded && s.decoded.canvas) return s.decoded.canvas;
            }
            return null;
          };

          const i0 = analyzeCanvas(getSpr('9000,0'));
          const i1 = analyzeCanvas(getSpr('9000,1'));
          const idle = analyzeCanvas(getIdle());

          let iconData = null, iconSource = 'none';
          let bigData = null, bigSource = 'none';

          if (f.id === 'naruto_kurama') {
            const kPort = analyzeCanvas(getSpr('9000,9'));
            const kIdle = analyzeCanvas(getSpr('2300,0')) || analyzeCanvas(getSpr('2300,6'));
            if (kPort && kPort.isGood) {
              iconData = renderSquareIcon(kPort, 'portrait_cover');
              iconSource = '9000,9 (' + kPort.bw + 'x' + kPort.bh + ')';
            } else if (kIdle && kIdle.isGood) {
              iconData = renderSquareIcon(kIdle, 'head_crop');
              iconSource = '2300,0 (' + kIdle.bw + 'x' + kIdle.bh + ')';
            }
            if (kIdle && kIdle.isGood) {
              bigData = renderBigPortrait(kIdle, true);
              bigSource = '2300,0 (' + kIdle.bw + 'x' + kIdle.bh + ')';
            } else if (kPort && kPort.isGood) {
              bigData = renderBigPortrait(kPort, false);
              bigSource = '9000,9 (' + kPort.bw + 'x' + kPort.bh + ')';
            }
          }

          if (f.id === 'hinata' && i1 && i1.isGood) {
            iconData = renderSquareIcon(i1, 'bust_crop');
            iconSource = '9000,1 bust_crop (' + i1.bw + 'x' + i1.bh + ')';
          }

          if (!iconData) {
            if (i0 && i0.isGood) {
              iconData = renderSquareIcon(i0, 'portrait_cover');
              iconSource = '9000,0 (' + i0.bw + 'x' + i0.bh + ')';
            } else if (i1 && i1.isGood) {
              const iconMode = (i1.bh > i1.bw * 1.35) ? 'bust_crop' : 'portrait_cover';
              iconData = renderSquareIcon(i1, iconMode);
              iconSource = '9000,1 ' + iconMode + ' (' + i1.bw + 'x' + i1.bh + ')';
            } else if (idle && idle.isGood) {
              iconData = renderSquareIcon(idle, 'head_crop');
              iconSource = 'idle (' + idle.bw + 'x' + idle.bh + ')';
            }
          }

          if (!bigData) {
            if (i1 && i1.isGood && Math.max(i1.bw, i1.bh) >= 56) {
              bigData = renderBigPortrait(i1, false);
              bigSource = '9000,1 (' + i1.bw + 'x' + i1.bh + ')';
            } else if (idle && idle.isGood) {
              bigData = renderBigPortrait(idle, true);
              bigSource = 'idle (' + idle.bw + 'x' + idle.bh + ')';
            } else if (i0 && i0.isGood) {
              bigData = renderBigPortrait(i0, false);
              bigSource = '9000,0 (' + i0.bw + 'x' + i0.bh + ')';
            }
          }

          reg.loadedPacks.delete(f.id);

          if (iconData && bigData) {
            await fetch('/_save', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: f.id, iconData, bigData, iconSource, bigSource })
            });
            ok++;
          } else {
            await fetch('/_log', { method: 'POST', body: JSON.stringify({ id: f.id, err: 'empty icon/big' }) });
          }
        } catch (err) {
          await fetch('/_log', { method: 'POST', body: JSON.stringify({ id: f.id, err: String(err) }) });
        }
      }

      await fetch('/_done', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ok, total: all.length })
      });
    })();
  </script>
</body>
</html>`;

const manifest = (ONLY_IDS.length && fs.existsSync(MANIFEST_PATH))
  ? JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'))
  : {};
let savedCount = 0;
let chromeProc = null;
const tmpProfile = fs.mkdtempSync(path.join(os.tmpdir(), 'bvn-avatars-'));

const server = http.createServer((req, res) => {
  const urlObj = new URL(req.url, 'http://127.0.0.1');

  if (urlObj.pathname === '/_extract.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(EXTRACT_HTML);
    return;
  }

  if (urlObj.pathname === '/_save' && req.method === 'POST') {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      try {
        const data = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        const iconBuf = Buffer.from(data.iconData.replace(/^data:image\/png;base64,/, ''), 'base64');
        const bigBuf = Buffer.from(data.bigData.replace(/^data:image\/png;base64,/, ''), 'base64');
        fs.writeFileSync(path.join(OUT_DIR, `${data.id}.png`), iconBuf);
        fs.writeFileSync(path.join(OUT_DIR, `${data.id}_big.png`), bigBuf);
        manifest[data.id] = {
          icon: `avatars/${data.id}.png`,
          big: `avatars/${data.id}_big.png`,
          iconSource: data.iconSource,
          bigSource: data.bigSource
        };
        savedCount++;
        if (savedCount % 10 === 0) {
          console.log(`  Extracted ${savedCount} fighters...`);
        }
        res.writeHead(200);
        res.end('ok');
      } catch (err) {
        console.error('Save error:', err.message);
        res.writeHead(500);
        res.end('err');
      }
    });
    return;
  }

  if (urlObj.pathname === '/_log' && req.method === 'POST') {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      console.warn('  [WARN]', Buffer.concat(chunks).toString('utf8'));
      res.writeHead(200);
      res.end('ok');
    });
    return;
  }

  if (urlObj.pathname === '/_done' && req.method === 'POST') {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      const summary = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      fs.writeFileSync(path.join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));
      console.log(`DONE: Extracted ${savedCount}/${summary.total} fighter avatar pairs into avatars/`);
      res.writeHead(200);
      res.end('ok');
      setTimeout(() => {
        if (chromeProc) {
          try { chromeProc.kill(); } catch (_) {}
        }
        server.close(() => {
          try { fs.rmSync(tmpProfile, { recursive: true, force: true }); } catch (_) {}
          process.exit(0);
        });
      }, 200);
    });
    return;
  }

  const fp = path.join(ROOT, decodeURIComponent(urlObj.pathname));
  if (!fp.startsWith(ROOT)) {
    res.writeHead(403);
    res.end();
    return;
  }
  fs.readFile(fp, (err, buf) => {
    if (err) {
      res.writeHead(404);
      res.end();
      return;
    }
    const ext = path.extname(fp).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(buf);
  });
});

server.listen(0, '127.0.0.1', () => {
  const port = server.address().port;
  const url = `http://127.0.0.1:${port}/_extract.html`;
  console.log(`Launching headless browser at ${url}`);
  chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${tmpProfile}`,
    url
  ], { stdio: 'ignore' });
});

setTimeout(() => {
  console.error('Timed out after 120s!');
  if (chromeProc) try { chromeProc.kill(); } catch (_) {}
  process.exit(1);
}, 120000);
