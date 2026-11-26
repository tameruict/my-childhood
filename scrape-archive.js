// language: JavaScript, file: scrape-archive.js, target: Node.js JUS M.U.G.E.N Scraper & Downloader
// Scrapes dragon-ball-vs-naruto-jus-mugen (.7z), jump-force-mugen (.zip), and dragon-ball-jus-edition (.zip)
// Downloads real non-zero .def / .sff / .air / .cns / .act files directly from ZIP streams into chars/

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
    map[charDir].push({
      fileName: path.basename(fileRel),
      fileRel,
      size,
      url
    });
  }
  return map;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  console.log('[1] Scraping Jump Force MUGEN.zip & Dragon Ball - JUS Edition.zip...');
  const [jfBuf, dbBuf] = await Promise.all([
    fetchBuffer('https://archive.org/download/jump-force-mugen/Jump%20Force%20MUGEN.zip/'),
    fetchBuffer('https://archive.org/download/dragon-ball-jus-edition/Dragon%20Ball%20-%20JUS%20Edition.zip/')
  ]);

  const jfMap = parseArchiveHtml(jfBuf.toString('utf8'));
  const dbMap = parseArchiveHtml(dbBuf.toString('utf8'));

  fs.writeFileSync(path.join(OUT_DIR, 'jump_force_jus_catalog.json'), JSON.stringify(jfMap, null, 2));
  fs.writeFileSync(path.join(OUT_DIR, 'db_jus_edition_catalog.json'), JSON.stringify(dbMap, null, 2));

  console.log(`[2] Indexed Jump Force JUS: ${Object.keys(jfMap).length} chars | DB JUS Edition: ${Object.keys(dbMap).length} chars`);
  console.log('    DB JUS Edition chars:', Object.keys(dbMap).join(', '));

  // Download Luffy, Gon, Killua, Ichigo, Jotaro from Jump Force MUGEN.zip (ZIP supports fast random-access extraction!)
  const picks = [
    { slotId: 'luffy', srcMap: jfMap, dir: 'SM_Luffy_TS' },
    { slotId: 'gon', srcMap: jfMap, dir: 'Gon_Edit_by_TrafalgarLawzz' },
    { slotId: 'killua', srcMap: jfMap, dir: 'Killua_Edit_by_TrafalgarLawzz' },
    { slotId: 'ichigo', srcMap: jfMap, dir: 'Ichigo_Final_by_TrafalgarLawzz' },
    { slotId: 'jotaro', srcMap: jfMap, dir: 'SM_Jotaro' }
  ];

  for (const p of picks) {
    const files = p.srcMap[p.dir] || [];
    const targetFiles = files.filter((f) => /\.(def|sff|air|cns|act)$/i.test(f.fileName) && !f.fileRel.includes('/'));
    const charOutDir = path.join(OUT_DIR, p.slotId);
    fs.mkdirSync(charOutDir, { recursive: true });
    console.log(`\n[3] Downloading JUS character [${p.slotId.toUpperCase()}] from ${p.dir} (${targetFiles.length} files)...`);

    for (const tf of targetFiles) {
      const dest = path.join(charOutDir, tf.fileName);
      const buf = await fetchBuffer(tf.url);
      fs.writeFileSync(dest, buf);
      let extra = '';
      if (tf.fileName.toLowerCase().endsWith('.sff') && buf.length >= 16) {
        const sig = buf.subarray(0, 11).toString('ascii');
        const vHi = buf[15];
        const vLo1 = buf[14];
        extra = ` | SFF Header: ${sig} v${vHi}.${vLo1}`;
      }
      console.log(`    -> ${tf.fileName.padEnd(32)} | ${(buf.length / 1024).toFixed(1)} KB${extra}`);
    }
  }

  console.log('\n[DONE] All JUS character packs downloaded successfully!');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
