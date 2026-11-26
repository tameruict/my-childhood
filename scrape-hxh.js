// language: JavaScript, file: scrape-hxh.js, target: Node.js Downloader for Hunter x Hunter MUGEN V3.zip characters
const https = require('https');
const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, 'chars');

function fetchBuffer(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const next = res.headers.location.startsWith('http')
          ? res.headers.location
          : 'https:' + res.headers.location;
        return resolve(fetchBuffer(next));
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

async function main() {
  const catalogPath = path.join(OUT_DIR, 'hxh_v3_jus_catalog.json');
  const v3Map = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

  const targets = [
    { slotId: 'kurapika', dir: 'Kurapika' },
    { slotId: 'hisoka', dir: 'Hisoka' },
    { slotId: 'meruem', dir: 'Meruem' },
    { slotId: 'netero', dir: 'Netero' },
    { slotId: 'chrollo', dir: 'Chrollo' },
    { slotId: 'feitan', dir: 'Feitan' },
    { slotId: 'pitou', dir: 'Pitou' }
  ];

  for (const t of targets) {
    const files = v3Map[t.dir] || [];
    const wanted = files.filter((f) => /\.(def|sff|air|cns|act)$/i.test(f.fileName) && !f.fileRel.includes('/'));
    const destDir = path.join(OUT_DIR, t.slotId);
    fs.mkdirSync(destDir, { recursive: true });
    console.log(`\n[HxH V3] Downloading ${t.slotId.toUpperCase()} (${wanted.length} files)...`);

    for (const wf of wanted) {
      const destPath = path.join(destDir, wf.fileName);
      if (fs.existsSync(destPath) && fs.statSync(destPath).size === wf.size) {
        console.log(`  -> [Cached] ${wf.fileName}`);
        continue;
      }
      const buf = await fetchBuffer(wf.url);
      fs.writeFileSync(destPath, buf);
      let extra = '';
      if (wf.fileName.toLowerCase().endsWith('.sff') && buf.length >= 16) {
        const sig = buf.subarray(0, 11).toString('ascii');
        const vHi = buf[15];
        const vLo = buf[14];
        const nbImages = vHi >= 2 ? buf.readUInt32LE(40) : buf.readUInt32LE(20);
        extra = ` | ${sig} v${vHi}.${vLo} (${nbImages} sprites)`;
      }
      console.log(`  -> ${wf.fileName.padEnd(24)} | ${(buf.length / 1024).toFixed(1)} KB${extra}`);
    }
  }
  console.log('\n[DONE] All 7 additional Hunter x Hunter characters downloaded!');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
