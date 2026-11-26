// language: JavaScript, file: mugen-loader.js, target: HTML5 Browser M.U.G.E.N (.sff v1 & v2 / .air / .def / .act) Decoder & BVN State Mapper
// Supports SFF v1 (PCX 8-bit RLE + per-sprite/shared palette) AND SFF v2.0/v2.1 (Raw / RLE8 / RLE5 / LZ5 / PNG8+PLTE+tRNS / PNG24 / PNG32)

(function () {
  'use strict';

  function readAscii(dv, offset, length) {
    let str = '';
    const max = Math.min(dv.byteLength, offset + length);
    for (let i = offset; i < max; i++) {
      const code = dv.getUint8(i);
      if (code === 0) break;
      str += String.fromCharCode(code);
    }
    return str;
  }

  function getAssetBaseUrl() {
    return (
      (typeof window !== 'undefined' && window.GAME_DEPLOY_CONFIG && window.GAME_DEPLOY_CONFIG.ASSET_BASE_URL) ||
      (typeof window !== 'undefined' && window.ASSET_BASE_URL) ||
      ''
    ).trim().replace(/\/+$/, '');
  }

  function resolveAssetUrl(relPath) {
    if (!relPath || /^https?:\/\//i.test(relPath)) return relPath;
    const base = getAssetBaseUrl();
    if (!base) return relPath;
    const cleanRel = String(relPath).replace(/^\/+/, '');
    let encodedRel = cleanRel;
    try {
      encodedRel = encodeURI(decodeURI(cleanRel));
    } catch (_) {
      encodedRel = encodeURI(cleanRel);
    }
    return `${base}/${encodedRel}`;
  }

  // ==================== PNG CRC32 & CHUNK PATCHER (SFF v2.1 PNG8 PLTE + tRNS) ====================
  const CRC32_TABLE = (function () {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) {
        c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
      }
      t[n] = c >>> 0;
    }
    return t;
  })();

  function crc32(bytes, start, length) {
    let c = 0xffffffff;
    const end = start + length;
    for (let i = start; i < end; i++) {
      c = CRC32_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  function buildPngChunk(typeStr, dataBytes) {
    const len = dataBytes.length;
    const out = new Uint8Array(12 + len);
    const dv = new DataView(out.buffer);
    dv.setUint32(0, len, false);
    for (let i = 0; i < 4; i++) {
      out[4 + i] = typeStr.charCodeAt(i);
    }
    out.set(dataBytes, 8);
    const crc = crc32(out, 4, 4 + len);
    dv.setUint32(8 + len, crc, false);
    return out;
  }

  function patchPng8PaletteAndAlpha(pngBytes, palette) {
    if (!pngBytes || pngBytes.length < 33 || !palette) return pngBytes;
    // Verify 8-byte PNG signature
    if (
      pngBytes[0] !== 0x89 || pngBytes[1] !== 0x50 ||
      pngBytes[2] !== 0x4e || pngBytes[3] !== 0x47 ||
      pngBytes[4] !== 0x0d || pngBytes[5] !== 0x0a ||
      pngBytes[6] !== 0x1a || pngBytes[7] !== 0x0a
    ) {
      return pngBytes;
    }

    const dv = new DataView(pngBytes.buffer, pngBytes.byteOffset, pngBytes.byteLength);
    const parts = [pngBytes.subarray(0, 8)];
    let totalLen = 8;
    let offset = 8;
    let patched = false;

    while (offset + 12 <= pngBytes.length) {
      const chunkLen = dv.getUint32(offset, false);
      const chunkTotal = 12 + chunkLen;
      if (offset + chunkTotal > pngBytes.length) break;

      const type = String.fromCharCode(
        pngBytes[offset + 4],
        pngBytes[offset + 5],
        pngBytes[offset + 6],
        pngBytes[offset + 7]
      );

      if (type === 'IHDR') {
        const bitDepth = pngBytes[offset + 8 + 8];
        const colorType = pngBytes[offset + 8 + 9];
        // Only rewrite PLTE + tRNS for indexed-color PNG8 (colorType === 3)
        if (colorType !== 3) {
          return pngBytes;
        }
        const ihdrSlice = pngBytes.subarray(offset, offset + chunkTotal);
        parts.push(ihdrSlice);
        totalLen += ihdrSlice.length;

        const maxEntries = bitDepth < 8 ? (1 << bitDepth) : 256;
        const plteData = new Uint8Array(maxEntries * 3);
        for (let c = 0; c < maxEntries; c++) {
          const rgb = palette[c] || [0, 0, 0];
          plteData[c * 3] = rgb[0] & 0xff;
          plteData[c * 3 + 1] = rgb[1] & 0xff;
          plteData[c * 3 + 2] = rgb[2] & 0xff;
        }
        const plteChunk = buildPngChunk('PLTE', plteData);
        const trnsChunk = buildPngChunk('tRNS', new Uint8Array([0]));
        parts.push(plteChunk, trnsChunk);
        totalLen += plteChunk.length + trnsChunk.length;
        patched = true;
      } else if (type === 'PLTE' || type === 'tRNS') {
        // Strip Fighter Factory dummy PLTE / old tRNS; replaced right after IHDR
      } else {
        const slice = pngBytes.subarray(offset, offset + chunkTotal);
        parts.push(slice);
        totalLen += slice.length;
      }

      offset += chunkTotal;
      if (type === 'IEND') break;
    }

    if (!patched) return pngBytes;
    const merged = new Uint8Array(totalLen);
    let pos = 0;
    for (const part of parts) {
      merged.set(part, pos);
      pos += part.length;
    }
    return merged;
  }

  // ==================== PALETTE & .ACT HELPERS ====================
  function decodeActBuffer(buffer, reverseOrder) {
    const dv = new DataView(buffer);
    const palette = new Array(256);
    let offset = 0;
    for (let i = 0; i < 256; i++) {
      if (offset + 2 >= dv.byteLength) {
        palette[i] = [0, 0, 0];
        continue;
      }
      const r = dv.getUint8(offset++);
      const g = dv.getUint8(offset++);
      const b = dv.getUint8(offset++);
      if (reverseOrder) {
        palette[255 - i] = [r, g, b];
      } else {
        palette[i] = [r, g, b];
      }
    }
    return palette;
  }

  function extractPcxEmbeddedPalette(buffer) {
    if (!buffer || buffer.byteLength < 769) return null;
    const dv = new DataView(buffer);
    const palMarkerOffset = buffer.byteLength - 769;
    if (dv.getUint8(palMarkerOffset) !== 12) return null;
    const palette = new Array(256);
    let pOff = palMarkerOffset + 1;
    for (let c = 0; c < 256; c++) {
      palette[c] = [
        dv.getUint8(pOff),
        dv.getUint8(pOff + 1),
        dv.getUint8(pOff + 2)
      ];
      pOff += 3;
    }
    return palette;
  }

  function countPaletteMatches(palA, palB) {
    if (!palA || !palB) return 0;
    let matches = 0;
    for (let i = 0; i < 256; i++) {
      const a = palA[i];
      const b = palB[i];
      if (a && b && a[0] === b[0] && a[1] === b[1] && a[2] === b[2]) {
        matches++;
      }
    }
    return matches;
  }

  // ==================== SFF v1 (PCX 8-bit RLE) DECODER ====================
  function decodePcxToCanvas(buffer, sharedPalette, fallbackPalette) {
    if (!buffer || buffer.byteLength < 128) return null;
    const dv = new DataView(buffer);

    const manufacturer = dv.getUint8(0);
    if (manufacturer !== 0x0a) return null;

    const encoding = dv.getUint8(2);
    const bpp = dv.getUint8(3);
    if (bpp !== 8) return null;

    const xmin = dv.getUint16(4, true);
    const ymin = dv.getUint16(6, true);
    const xmax = dv.getUint16(8, true);
    const ymax = dv.getUint16(10, true);
    const bpl = dv.getUint16(66, true);

    const width = xmax - xmin + 1;
    const height = ymax - ymin + 1;
    if (width <= 0 || height <= 0 || width > 2048 || height > 2048) return null;

    let embeddedPalette = null;
    if (!sharedPalette) {
      embeddedPalette = extractPcxEmbeddedPalette(buffer);
    }
    const palette = sharedPalette || embeddedPalette || fallbackPalette || new Array(256).fill([255, 255, 255]);

    const rgba = new Uint8ClampedArray(width * height * 4);
    let offset = 128;
    // Only exclude trailing 769 bytes when we actually parsed an embedded palette (prevents truncating shared-pal PCX data)
    const maxDataOffset = embeddedPalette ? (buffer.byteLength - 769) : buffer.byteLength;

    const stride = bpl > 0 ? bpl : width;
    let x = 0;
    let y = 0;

    while (y < height && offset < maxDataOffset) {
      const byte = dv.getUint8(offset++);
      let runCount = 1;
      let colorIndex = byte;

      if (encoding === 1 && (byte & 0xc0) === 0xc0) {
        runCount = byte & 0x3f;
        if (offset >= maxDataOffset) break;
        colorIndex = dv.getUint8(offset++);
      }

      for (let r = 0; r < runCount; r++) {
        if (x < width && y < height) {
          const pixIdx = (y * width + x) * 4;
          if (colorIndex === 0) {
            rgba[pixIdx + 3] = 0;
          } else {
            const rgb = palette[colorIndex] || [255, 255, 255];
            rgba[pixIdx] = rgb[0];
            rgba[pixIdx + 1] = rgb[1];
            rgba[pixIdx + 2] = rgb[2];
            rgba[pixIdx + 3] = 255;
          }
        }
        x++;
        if (x >= stride) {
          x = 0;
          y++;
          if (y >= height) break;
        }
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.putImageData(new ImageData(rgba, width, height), 0, 0);

    return { canvas, width, height, palette };
  }

  // ==================== SFF v2 (M.U.G.E.N 1.0 / 1.1 JUS) CODECS ====================
  // Formats in SFF v2: 0=Raw, 2=RLE8, 3=RLE5, 4=LZ5, 10=PNG8, 11=PNG24, 12=PNG32
  function decodeRle8(src, dstLen) {
    const out = new Uint8Array(dstLen);
    let s = 0;
    let d = 0;
    while (s < src.length && d < dstLen) {
      const ch = src[s++];
      if ((ch & 0xc0) === 0x40) {
        const run = ch & 0x3f;
        const val = s < src.length ? src[s++] : 0;
        for (let i = 0; i < run && d < dstLen; i++) {
          out[d++] = val;
        }
      } else {
        out[d++] = ch;
      }
    }
    return out;
  }

  // Canonical Elecbyte / Ikemen-GO SFF v2 RLE5 decoder
  function decodeRle5(src, dstLen) {
    const out = new Uint8Array(dstLen);
    let s = 0;
    let d = 0;
    while (s < src.length && d < dstLen) {
      const rle = src[s++];
      if (s >= src.length) break;
      const dlByte = src[s++];
      const dataLen = dlByte & 0x7f;
      let color = 0;
      if ((dlByte & 0x80) !== 0) {
        if (s >= src.length) break;
        color = src[s++];
      }
      for (let i = 0; i < rle && d < dstLen; i++) {
        out[d++] = color;
      }
      for (let j = 0; j < dataLen && s < src.length && d < dstLen; j++) {
        const b = src[s++];
        const c = b & 0x1f;
        const run = (b >> 5) + 1;
        for (let k = 0; k < run && d < dstLen; k++) {
          out[d++] = c;
        }
      }
    }
    return out;
  }

  // Canonical Elecbyte / Ikemen-GO SFF v2 LZ5 decoder
  function decodeLz5(src, dstLen) {
    const out = new Uint8Array(dstLen);
    if (!src || src.length === 0) return out;
    let s = 0;
    let d = 0;
    let ct = src[s++];
    let ctBit = 0;
    let rb = 0;
    let rbCnt = 0;

    while (s < src.length && d < dstLen) {
      if (ctBit >= 8) {
        if (s >= src.length) break;
        ct = src[s++];
        ctBit = 0;
      }
      const isLz = (ct & (1 << ctBit)) !== 0;
      ctBit++;

      if (isLz) {
        if (s >= src.length) break;
        const b1 = src[s++];
        let offset = 0;
        let len = b1 & 0x3f;
        if (len === 0) {
          // Long LZ packet
          if (s + 1 >= src.length) break;
          const b2 = src[s++];
          const b3 = src[s++];
          offset = (((b1 & 0xc0) << 2) | b2) + 1;
          len = b3 + 3;
        } else {
          // Short LZ packet: accumulate recycled bits MSB-first into rb
          rb |= (b1 & 0xc0) >> (rbCnt * 2);
          rbCnt++;
          if (rbCnt === 4) {
            offset = rb + 1;
            rb = 0;
            rbCnt = 0;
          } else {
            if (s >= src.length) break;
            offset = src[s++] + 1;
          }
          len += 1;
        }
        for (let i = 0; i < len && d < dstLen; i++) {
          const srcIdx = d - offset;
          out[d++] = srcIdx >= 0 ? out[srcIdx] : 0;
        }
      } else {
        // RLE packet: top 3 bits = len (0 => long RLE: nextByte + 8), low 5 bits = color
        if (s >= src.length) break;
        const b1 = src[s++];
        let len = b1 >> 5;
        const color = b1 & 0x1f;
        if (len === 0) {
          if (s >= src.length) break;
          len = src[s++] + 8;
        }
        for (let i = 0; i < len && d < dstLen; i++) {
          out[d++] = color;
        }
      }
    }
    return out;
  }

  function indexedToCanvas(indexedBytes, width, height, palette) {
    const rgba = new Uint8ClampedArray(width * height * 4);
    const total = width * height;
    for (let i = 0; i < total; i++) {
      const idx = indexedBytes[i] || 0;
      const p = i * 4;
      if (idx === 0) {
        rgba[p + 3] = 0;
      } else {
        const c = (palette && palette[idx]) || [255, 255, 255, 255];
        rgba[p] = c[0];
        rgba[p + 1] = c[1];
        rgba[p + 2] = c[2];
        rgba[p + 3] = c[3] !== undefined ? c[3] : 255;
      }
    }
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d').putImageData(new ImageData(rgba, width, height), 0, 0);
    return { canvas, width, height };
  }

  async function decodePngBytesToCanvas(pngBytes) {
    if (typeof Blob === 'undefined' || typeof createImageBitmap === 'undefined') return null;
    try {
      const blob = new Blob([pngBytes], { type: 'image/png' });
      const bmp = await createImageBitmap(blob);
      const c = document.createElement('canvas');
      c.width = bmp.width;
      c.height = bmp.height;
      c.getContext('2d').drawImage(bmp, 0, 0);
      if (typeof bmp.close === 'function') bmp.close();
      return { canvas: c, width: c.width, height: c.height };
    } catch (_) {
      return null;
    }
  }

  async function decodeSFFv2(arrayBuffer) {
    const dv = new DataView(arrayBuffer);
    const verLo3 = dv.getUint8(12);
    const verLo2 = dv.getUint8(13);
    const verLo1 = dv.getUint8(14);
    const verHi = dv.getUint8(15);

    const spriteOffset = dv.getUint32(36, true);
    const nbImages = dv.getUint32(40, true);
    const palOffset = dv.getUint32(44, true);
    const nbPalettes = dv.getUint32(48, true);
    const ldataOffset = dv.getUint32(52, true);
    const tdataOffset = dv.getUint32(60, true);

    // 1. Decode palettes (16 bytes per palette node)
    const palNodes = [];
    const palettes = new Array(nbPalettes);
    for (let p = 0; p < nbPalettes; p++) {
      const pNode = palOffset + p * 16;
      if (pNode + 16 > dv.byteLength) break;
      const numCols = dv.getUint16(pNode + 4, true) || 256;
      const linkIdx = dv.getUint16(pNode + 6, true);
      const dataOff = ldataOffset + dv.getUint32(pNode + 8, true);
      const dataLen = dv.getUint32(pNode + 12, true);
      palNodes.push({ numCols, linkIdx, dataOff, dataLen });

      if (dataLen === 0) {
        palettes[p] = null;
        continue;
      }
      const pal = new Array(256);
      for (let c = 0; c < 256; c++) {
        const cOff = dataOff + c * 4;
        if (c < numCols && cOff + 3 < dv.byteLength) {
          pal[c] = [
            dv.getUint8(cOff),
            dv.getUint8(cOff + 1),
            dv.getUint8(cOff + 2),
            255
          ];
        } else {
          pal[c] = [0, 0, 0, 255];
        }
      }
      palettes[p] = pal;
    }
    // Resolve linked palettes (supports chained links)
    for (let p = 0; p < palNodes.length; p++) {
      if (palettes[p]) continue;
      let cur = palNodes[p].linkIdx;
      for (let hops = 0; hops < 8 && cur < palNodes.length; hops++) {
        if (palettes[cur]) {
          palettes[p] = palettes[cur];
          break;
        }
        cur = palNodes[cur].linkIdx;
      }
      if (!palettes[p]) palettes[p] = palettes[0] || null;
    }

    // 2. Parse & decode sprite nodes (28 bytes per sprite node)
    const nodes = [];
    const spriteMap = new Map();
    const pngTasks = [];

    for (let i = 0; i < nbImages; i++) {
      const sNode = spriteOffset + i * 28;
      if (sNode + 28 > dv.byteLength) break;

      const groupNo = dv.getUint16(sNode, true);
      const imageNo = dv.getUint16(sNode + 2, true);
      const width = dv.getUint16(sNode + 4, true);
      const height = dv.getUint16(sNode + 6, true);
      const axisX = dv.getInt16(sNode + 8, true);
      const axisY = dv.getInt16(sNode + 10, true);
      const linkIdx = dv.getUint16(sNode + 12, true);
      const fmt = dv.getUint8(sNode + 14);
      const colDepth = dv.getUint8(sNode + 15);
      const rawDataOff = dv.getUint32(sNode + 16, true);
      const dataLen = dv.getUint32(sNode + 20, true);
      const palIdx = dv.getUint16(sNode + 24, true);
      const flags = dv.getUint16(sNode + 26, true);

      const baseOff = (flags & 1) ? tdataOffset : ldataOffset;
      const absOff = baseOff + rawDataOff;

      const entry = {
        index: i,
        groupNo,
        imageNo,
        axisX,
        axisY,
        width,
        height,
        fmt,
        colDepth,
        linkIdx,
        dataLen,
        absOff,
        palIdx,
        decoded: null,
        _rawIndexed: null,
        _rawPngBytes: null
      };
      nodes.push(entry);

      // Linked sprites have dataLen === 0 (often fmt === 1); resolve in pass 3 so chained & diff-palette links work
      if (dataLen === 0) {
        continue;
      }

      if (width <= 0 || height <= 0 || width > 2048 || height > 2048 || absOff + dataLen > dv.byteLength) {
        continue;
      }

      const pal = palettes[palIdx] || palettes[0] || null;

      if (fmt === 0) {
        const rawBytes = new Uint8Array(arrayBuffer, absOff, Math.min(dataLen, width * height));
        entry._rawIndexed = rawBytes;
        entry.decoded = indexedToCanvas(rawBytes, width, height, pal);
        spriteMap.set(`${groupNo},${imageNo}`, entry);
      } else if (fmt === 2) {
        // RLE8 (first 4 bytes are uncompressed length)
        if (dataLen > 4) {
          const compBytes = new Uint8Array(arrayBuffer, absOff + 4, dataLen - 4);
          const pix = decodeRle8(compBytes, width * height);
          entry._rawIndexed = pix;
          entry.decoded = indexedToCanvas(pix, width, height, pal);
          spriteMap.set(`${groupNo},${imageNo}`, entry);
        }
      } else if (fmt === 3) {
        // RLE5 (first 4 bytes are uncompressed length)
        if (dataLen > 4) {
          const compBytes = new Uint8Array(arrayBuffer, absOff + 4, dataLen - 4);
          const pix = decodeRle5(compBytes, width * height);
          entry._rawIndexed = pix;
          entry.decoded = indexedToCanvas(pix, width, height, pal);
          spriteMap.set(`${groupNo},${imageNo}`, entry);
        }
      } else if (fmt === 4) {
        // LZ5 (first 4 bytes are uncompressed length)
        if (dataLen > 4) {
          const compBytes = new Uint8Array(arrayBuffer, absOff + 4, dataLen - 4);
          const pix = decodeLz5(compBytes, width * height);
          entry._rawIndexed = pix;
          entry.decoded = indexedToCanvas(pix, width, height, pal);
          spriteMap.set(`${groupNo},${imageNo}`, entry);
        }
      } else if (fmt === 10 || fmt === 11 || fmt === 12) {
        // Embedded PNG8 (10) / PNG24 (11) / PNG32 (12): skip 4-byte uncompressed size prefix before 0x89 PNG magic
        let pngStart = absOff;
        if (dataLen >= 12 && dv.getUint8(absOff) !== 0x89 && dv.getUint8(absOff + 4) === 0x89) {
          pngStart = absOff + 4;
        }
        const pngRaw = new Uint8Array(arrayBuffer, pngStart, absOff + dataLen - pngStart);
        if (fmt === 10) {
          entry._rawPngBytes = pngRaw;
          const patched = patchPng8PaletteAndAlpha(pngRaw, pal);
          pngTasks.push({ entry, pngBytes: patched });
        } else {
          pngTasks.push({ entry, pngBytes: pngRaw });
        }
      }
    }

    // 3. Resolve linked sprites (supports chained links AND different palIdx!)
    for (const entry of nodes) {
      if (entry.dataLen !== 0) continue;
      let target = null;
      let curIdx = entry.linkIdx;
      for (let hops = 0; hops < 8 && curIdx < nodes.length; hops++) {
        const cand = nodes[curIdx];
        if (!cand || cand === entry) break;
        if (cand.dataLen > 0) {
          target = cand;
          break;
        }
        curIdx = cand.linkIdx;
      }
      if (!target) continue;

      if (entry.palIdx !== target.palIdx) {
        const pal = palettes[entry.palIdx] || palettes[0] || null;
        if (target._rawIndexed) {
          entry.decoded = indexedToCanvas(target._rawIndexed, target.width, target.height, pal);
          spriteMap.set(`${entry.groupNo},${entry.imageNo}`, entry);
        } else if (target._rawPngBytes && target.fmt === 10) {
          const patched = patchPng8PaletteAndAlpha(target._rawPngBytes, pal);
          pngTasks.push({ entry, pngBytes: patched });
        } else {
          entry._linkTarget = target;
        }
      } else {
        entry._linkTarget = target;
      }
    }

    // 4. Decode PNG tasks in bounded concurrent batches
    const BATCH_SIZE = 64;
    for (let b = 0; b < pngTasks.length; b += BATCH_SIZE) {
      const slice = pngTasks.slice(b, b + BATCH_SIZE);
      await Promise.all(
        slice.map(async (task) => {
          const decoded = await decodePngBytesToCanvas(task.pngBytes);
          if (decoded) {
            task.entry.decoded = decoded;
            spriteMap.set(`${task.entry.groupNo},${task.entry.imageNo}`, task.entry);
          }
        })
      );
    }

    // 5. Finalize shared linked sprite references & release temporary buffers
    for (const entry of nodes) {
      if (!entry.decoded && entry._linkTarget && entry._linkTarget.decoded) {
        entry.decoded = entry._linkTarget.decoded;
        spriteMap.set(`${entry.groupNo},${entry.imageNo}`, entry);
      }
      entry._rawIndexed = null;
      entry._rawPngBytes = null;
      entry._linkTarget = null;
    }

    return {
      version: `${verHi}.${verLo1}.${verLo2}.${verLo3}`,
      nbGroups: 0,
      nbImages,
      spriteCount: spriteMap.size,
      sprites: spriteMap
    };
  }

  // Unified SFF v1 / v2 Dispatcher
  async function decodeSFF(arrayBuffer, actBufferOptional) {
    const dv = new DataView(arrayBuffer);
    const signature = readAscii(dv, 0, 11);
    if (!signature.startsWith('ElecbyteSpr')) {
      throw new Error('Không phải file M.U.G.E.N SFF hợp lệ (Signature: ' + signature + ')');
    }
    const verHi = dv.getUint8(15);
    if (verHi >= 2) {
      return await decodeSFFv2(arrayBuffer);
    }
    return decodeSFFv1(arrayBuffer, actBufferOptional);
  }

  function decodeSFFv1(arrayBuffer, actBufferOptional) {
    const dv = new DataView(arrayBuffer);
    const verLo3 = dv.getUint8(12);
    const verLo2 = dv.getUint8(13);
    const verLo1 = dv.getUint8(14);
    const verHi = dv.getUint8(15);

    const nbGroups = dv.getUint32(16, true);
    const nbImages = dv.getUint32(20, true);
    const firstSubfileOffset = dv.getUint32(24, true);

    let actPalette = actBufferOptional ? decodeActBuffer(actBufferOptional, true) : null;
    const actPaletteFwd = actBufferOptional ? decodeActBuffer(actBufferOptional, false) : null;
    let actOrderChecked = false;
    let firstPalette = actPalette;
    let prevPalette = actPalette;

    const subfiles = [];
    const spriteMap = new Map();
    let offset = firstSubfileOffset;

    for (let i = 0; i < nbImages && offset > 0 && offset + 32 <= dv.byteLength; i++) {
      const nextOffset = dv.getUint32(offset, true);
      const subLength = dv.getUint32(offset + 4, true);
      const axisX = dv.getInt16(offset + 8, true);
      const axisY = dv.getInt16(offset + 10, true);
      const groupNo = dv.getUint16(offset + 12, true);
      const imageNo = dv.getUint16(offset + 14, true);
      const linkedIndex = dv.getUint16(offset + 16, true);
      const samePalette = dv.getUint8(offset + 18) !== 0;

      const dataStart = offset + 32;
      const dataEnd = subLength > 0
        ? Math.min(dv.byteLength, dataStart + subLength)
        : (nextOffset > dataStart ? Math.min(dv.byteLength, nextOffset) : dv.byteLength);

      const isBigPortrait = (groupNo === 9000 && imageNo === 1);
      let decoded = null;

      if (subLength === 0) {
        // Resolve linked sprite (handle chained links cleanly)
        let curLink = linkedIndex;
        for (let hops = 0; hops < 8 && curLink < subfiles.length; hops++) {
          const target = subfiles[curLink];
          if (!target) break;
          if (target.decoded) {
            decoded = target.decoded;
            break;
          }
          curLink = target.linkedIndex;
        }
      } else if (dataEnd > dataStart) {
        const pcxBuf = arrayBuffer.slice(dataStart, dataEnd);

        // Auto-verify .act byte order against first non-portrait sprite's embedded palette (if present)
        if (actPalette && !actOrderChecked && !isBigPortrait) {
          const embPal = extractPcxEmbeddedPalette(pcxBuf);
          if (embPal) {
            actOrderChecked = true;
            const revScore = countPaletteMatches(actPalette, embPal);
            const fwdScore = countPaletteMatches(actPaletteFwd, embPal);
            if (fwdScore > revScore + 32) {
              actPalette = actPaletteFwd;
              firstPalette = actPalette;
              prevPalette = actPalette;
            }
          }
        }

        // Canonical MUGEN SFF v1 palette rule:
        // - samePalette=true inherits prevPalette (or firstPalette)
        // - sprite 0 / sprite (0,0) with .act uses actPalette
        // - samePalette=false FX/beams/portraits use their OWN embedded PCX palette!
        let palToUse = null;
        if (samePalette) {
          palToUse = prevPalette || firstPalette;
        } else if (actPalette && ((i === 0 && !isBigPortrait) || (groupNo === 0 && imageNo === 0))) {
          palToUse = actPalette;
        }

        decoded = decodePcxToCanvas(pcxBuf, palToUse, prevPalette || firstPalette);

        if (decoded && decoded.palette) {
          if (!firstPalette && !isBigPortrait) {
            firstPalette = decoded.palette;
          }
          if (!isBigPortrait) {
            prevPalette = decoded.palette;
          }
        }
      }

      const entry = {
        index: i,
        groupNo,
        imageNo,
        axisX,
        axisY,
        linkedIndex,
        decoded
      };
      subfiles.push(entry);
      if (decoded) {
        spriteMap.set(`${groupNo},${imageNo}`, entry);
      }

      if (nextOffset <= offset || nextOffset >= dv.byteLength) break;
      offset = nextOffset;
    }

    return {
      version: `${verHi}.${verLo1}.${verLo2}.${verLo3}`,
      nbGroups,
      nbImages,
      spriteCount: spriteMap.size,
      sprites: spriteMap
    };
  }

  // ==================== AIR & DEF DECODERS ====================
  function decodeAIR(text) {
    const actions = new Map();
    const lines = text.split(/\r?\n/);

    let currentAction = null;
    let clsn1Default = null;
    let clsn2Default = null;
    let pendingClsn1 = null;
    let pendingClsn2 = null;
    let activeClsnTarget = null;

    const commitAction = (act) => {
      if (!act) return;
      const existing = actions.get(act.id);
      // Never overwrite a non-empty action with an empty/smaller duplicate header (fixes kakashi, sasuke, vegeta, etc.)
      if (!existing || (existing.elements.length === 0 && act.elements.length > 0)) {
        actions.set(act.id, act);
      }
    };

    const reAction = /^\[Begin Action\s+(-?\d+)\s*\]/i;
    const reClsn1Def = /^Clsn1Default\s*:\s*(\d+)/i;
    const reClsn2Def = /^Clsn2Default\s*:\s*(\d+)/i;
    const reClsn1 = /^Clsn1\s*:\s*(\d+)/i;
    const reClsn2 = /^Clsn2\s*:\s*(\d+)/i;
    const reClsnBox = /^Clsn([12])\[\s*\d+\s*\]\s*=\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)/i;
    const reElem = /^(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)(?:\s*,\s*([HV]*))?(?:\s*,\s*([A-Za-z0-9]+))?/i;

    for (let rawLine of lines) {
      const line = rawLine.replace(/;.*$/, '').trim();
      if (!line) continue;

      let m = line.match(reAction);
      if (m) {
        commitAction(currentAction);
        const id = parseInt(m[1], 10);
        currentAction = { id, elements: [] };
        clsn1Default = null;
        clsn2Default = null;
        pendingClsn1 = null;
        pendingClsn2 = null;
        activeClsnTarget = null;
        continue;
      }

      if (!currentAction) continue;

      if (reClsn1Def.test(line)) {
        clsn1Default = [];
        activeClsnTarget = clsn1Default;
        continue;
      }
      if (reClsn2Def.test(line)) {
        clsn2Default = [];
        activeClsnTarget = clsn2Default;
        continue;
      }
      if (reClsn1.test(line)) {
        pendingClsn1 = [];
        activeClsnTarget = pendingClsn1;
        continue;
      }
      if (reClsn2.test(line)) {
        pendingClsn2 = [];
        activeClsnTarget = pendingClsn2;
        continue;
      }

      m = line.match(reClsnBox);
      if (m && activeClsnTarget) {
        activeClsnTarget.push({
          x1: parseInt(m[2], 10),
          y1: parseInt(m[3], 10),
          x2: parseInt(m[4], 10),
          y2: parseInt(m[5], 10)
        });
        continue;
      }

      m = line.match(reElem);
      if (m) {
        const dur = parseInt(m[5], 10);
        currentAction.elements.push({
          groupNo: parseInt(m[1], 10),
          imageNo: parseInt(m[2], 10),
          x: parseInt(m[3], 10),
          y: parseInt(m[4], 10),
          time: dur <= 0 ? 6 : Math.max(2, dur),
          flip: (m[6] || '').toUpperCase(),
          trans: (m[7] || '').toUpperCase(),
          clsn1: pendingClsn1 ? pendingClsn1.slice() : (clsn1Default ? clsn1Default.slice() : []),
          clsn2: pendingClsn2 ? pendingClsn2.slice() : (clsn2Default ? clsn2Default.slice() : [])
        });
        pendingClsn1 = null;
        pendingClsn2 = null;
        activeClsnTarget = null;
      }
    }
    commitAction(currentAction);

    return actions;
  }

  function decodeDEF(text) {
    const info = { name: 'MUGEN Fighter', displayname: '', author: '', files: {} };
    let section = '';
    for (const raw of text.split(/\r?\n/)) {
      const line = raw.replace(/;.*$/, '').trim();
      if (!line) continue;
      const secMatch = line.match(/^\[([^\]]+)\]/);
      if (secMatch) {
        section = secMatch[1].trim().toLowerCase();
        continue;
      }
      const kv = line.match(/^([\w.\-]+)\s*=\s*(.+)$/);
      if (kv) {
        const k = kv[1].trim().toLowerCase();
        const v = kv[2].trim().replace(/^"|"$/g, '');
        if (section === 'info') {
          info[k] = v;
        } else if (section === 'files') {
          info.files[k] = v;
        }
      }
    }
    return info;
  }

  // ==================== SPRITE BOUNDS, AUTO-SCALING & SMART ACTION MAPPING ====================
  function getSpriteBounds(decoded) {
    if (!decoded || !decoded.canvas) return null;
    if (decoded._bounds) return decoded._bounds;

    const w = decoded.width || decoded.canvas.width;
    const h = decoded.height || decoded.canvas.height;
    if (w <= 0 || h <= 0) return null;

    const ctx = decoded.canvas.getContext('2d');
    const data = ctx.getImageData(0, 0, w, h).data;
    let minX = w;
    let maxX = -1;
    let minY = h;
    let maxY = -1;
    let opaqueCount = 0;

    for (let y = 0; y < h; y++) {
      const rowOff = y * w * 4;
      for (let x = 0; x < w; x++) {
        if (data[rowOff + x * 4 + 3] > 10) {
          opaqueCount++;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    const bounds = opaqueCount > 0
      ? {
          minX,
          maxX,
          minY,
          maxY,
          visW: maxX - minX + 1,
          visH: maxY - minY + 1,
          opaqueCount
        }
      : {
          minX: 0,
          maxX: 0,
          minY: 0,
          maxY: 0,
          visW: 0,
          visH: 0,
          opaqueCount: 0
        };
    decoded._bounds = bounds;
    return bounds;
  }

  function isElementAdditive(el) {
    return Boolean(el && el.trans && el.trans.charAt(0) === 'A');
  }

  function actionHasClsn2(action) {
    if (!action || !action.elements || action.elements.length === 0) return false;
    for (let i = 0; i < action.elements.length; i++) {
      const c2 = action.elements[i].clsn2;
      if (c2 && c2.length > 0) return true;
    }
    return false;
  }

  function findFirstVisibleElement(action, sffSprites, allowPortrait, skipAdditive) {
    if (!action || !action.elements || action.elements.length === 0) return null;
    // Pass 1: Prefer non-additive body sprites so additive FX (", A") never hijack stance detection
    for (const el of action.elements) {
      if (el.groupNo < 0 || el.imageNo < 0) continue;
      if (!allowPortrait && el.groupNo >= 9000) continue;
      if (isElementAdditive(el)) continue;
      const spr = sffSprites.get(`${el.groupNo},${el.imageNo}`);
      if (!spr || !spr.decoded || !spr.decoded.canvas) continue;
      const b = getSpriteBounds(spr.decoded);
      if (b && b.opaqueCount > 16) {
        return { elem: el, spr, bounds: b, isAdditive: false };
      }
    }
    if (skipAdditive) return null;
    // Pass 2: Fallback to additive sprites only when allowed and no non-additive sprite exists
    for (const el of action.elements) {
      if (el.groupNo < 0 || el.imageNo < 0) continue;
      if (!allowPortrait && el.groupNo >= 9000) continue;
      const spr = sffSprites.get(`${el.groupNo},${el.imageNo}`);
      if (!spr || !spr.decoded || !spr.decoded.canvas) continue;
      const b = getSpriteBounds(spr.decoded);
      if (b && b.opaqueCount > 16) {
        return { elem: el, spr, bounds: b, isAdditive: isElementAdditive(el) };
      }
    }
    return null;
  }

  function buildBvnActionMapping(actionsMap, sffSprites, actionOffset) {
    const off = Math.max(0, Math.floor(actionOffset || 0));

    // Per-form isolated mapping strictly within [actionOffset, actionOffset + 2000)
    if (off > 0) {
      const offMax = off + 2000;
      const bodyActionIds = [];
      const nonAddActionIds = [];
      const rangeValidIds = [];
      const rangeFirstVis = new Map();

      actionsMap.forEach((act, id) => {
        if (id < off || id >= offMax) return;
        const vis = findFirstVisibleElement(act, sffSprites, false, false);
        if (!vis) return;
        rangeValidIds.push(id);
        rangeFirstVis.set(id, vis);
        if (!vis.isAdditive) {
          nonAddActionIds.push(id);
          if (actionHasClsn2(act)) {
            bodyActionIds.push(id);
          }
        }
      });

      bodyActionIds.sort((a, b) => a - b);
      nonAddActionIds.sort((a, b) => a - b);
      rangeValidIds.sort((a, b) => a - b);

      const poolIds = bodyActionIds.length > 0
        ? bodyActionIds
        : (nonAddActionIds.length > 0 ? nonAddActionIds : rangeValidIds);

      if (poolIds.length === 0) {
        return buildBvnActionMapping(actionsMap, sffSprites, 0);
      }

      const poolSet = new Set(poolIds);

      const pickFormIdle = () => {
        if (poolSet.has(off)) return off;
        for (const id of poolIds) {
          const v = rangeFirstVis.get(id);
          if (v && v.bounds.visH >= 28 && v.bounds.opaqueCount >= 60) return id;
        }
        return poolIds[0];
      };

      const pickFormAction = (preferredList, minRange, maxRange, fallbackId) => {
        for (const p of preferredList) {
          if (poolSet.has(p)) return p;
        }
        for (const id of poolIds) {
          if (id >= minRange && id <= maxRange) return id;
        }
        return fallbackId;
      };

      const idle = pickFormIdle();
      const walk = pickFormAction([off + 20, off + 21, off + 100], off + 19, off + 39, idle);
      const jump = pickFormAction([off + 40, off + 41, off + 42, off + 43, off + 50], off + 40, off + 65, idle);
      const dash = pickFormAction([off + 100, off + 105, off + 110, walk], off + 100, off + 119, walk);
      const guard = pickFormAction([off + 120, off + 130, off + 131, off + 140], off + 120, off + 149, idle);
      const hurt = pickFormAction([off + 150, off + 5000, off + 5001, off + 5010], off + 150, off + 199, idle);
      const hurtFly = pickFormAction([off + 151, off + 152, off + 150, off + 5030, off + 5050], off + 150, off + 199, hurt);
      const dead = pickFormAction([off + 155, off + 150, off + 5110, off + 5150], off + 150, off + 199, hurtFly);

      const offBody = poolIds.filter((id) => id >= off + 200 && id < offMax && id !== idle);
      const offSuper = offBody.filter((id) => id >= off + 1000);

      const pickFormSkill = (preferredList, fallbackIdx) => {
        for (const p of preferredList) {
          if (poolSet.has(p)) return p;
        }
        if (offBody.length > 0) {
          return offBody[fallbackIdx % offBody.length];
        }
        return idle;
      };

      return {
        idle,
        walk,
        jump,
        dash,
        guard,
        hurt,
        hurtFly,
        dead,
        skills: {
          j: pickFormSkill([off + 200, off + 210], 0),
          wj: pickFormSkill([off + 300, off + 220, off + 250], 1),
          sj: pickFormSkill([off + 400, off + 410, off + 230], 2),
          u: pickFormSkill([off + 900, off + 500, off + 1000], 3),
          wu: pickFormSkill([off + 800, off + 600, off + 1100], 4),
          su: pickFormSkill([off + 600, off + 800, off + 1200], 5),
          i: pickFormSkill([off + 700, off + 500, off + 1300], 6),
          wi: pickFormSkill([off + 500, off + 700, off + 1400], 7),
          si: pickFormSkill([off + 1001, off + 1000, ...offSuper, off + 900, off + 700], 8)
        },
        validActionIds: poolIds,
        actionOffset: off
      };
    }

    const validActionIds = [];
    const actionFirstVis = new Map();

    actionsMap.forEach((act, id) => {
      const vis = findFirstVisibleElement(act, sffSprites, false, false);
      if (vis) {
        validActionIds.push(id);
        actionFirstVis.set(id, vis);
      }
    });
    validActionIds.sort((a, b) => a - b);

    const pickIdleAction = () => {
      // 1. Standard standing Action 0 with real non-additive visible body
      if (actionFirstVis.has(0)) {
        const v0 = actionFirstVis.get(0);
        if (!v0.isAdditive && v0.bounds.visH >= 20 && v0.bounds.opaqueCount >= 50) return 0;
      }
      // 2. Alternate/transformation base stances (e.g. naruto_ashura Action 2000) — avoid tiny FX orbs or additive FX!
      const altStances = [2000, 1000, 11, 20, 2020, 1, 2, 5];
      for (const cand of altStances) {
        const v = actionFirstVis.get(cand);
        if (v && !v.isAdditive && v.bounds.visH >= 32 && v.bounds.opaqueCount >= 80) {
          return cand;
        }
      }
      // 3. Any non-additive action with a real character-sized body
      for (const id of validActionIds) {
        const v = actionFirstVis.get(id);
        if (v && !v.isAdditive && v.bounds.visH >= 28 && v.bounds.opaqueCount >= 60) {
          return id;
        }
      }
      // 4. Last-resort fallback if every action is additive
      for (const id of validActionIds) {
        const v = actionFirstVis.get(id);
        if (v && v.bounds.visH >= 28 && v.bounds.opaqueCount >= 60) {
          return id;
        }
      }
      return validActionIds[0] || 0;
    };

    const pickAction = (preferredList, minRange, maxRange, fallbackId) => {
      for (const p of preferredList) {
        const v = actionFirstVis.get(p);
        if (v && !v.isAdditive) return p;
      }
      const inRangeNonAdd = validActionIds.filter((id) => {
        if (id < minRange || id > maxRange) return false;
        const v = actionFirstVis.get(id);
        return v && !v.isAdditive;
      });
      if (inRangeNonAdd.length > 0) return inRangeNonAdd[0];
      for (const p of preferredList) {
        if (actionFirstVis.has(p)) return p;
      }
      const inRange = validActionIds.filter((id) => id >= minRange && id <= maxRange);
      if (inRange.length > 0) return inRange[0];
      return actionFirstVis.has(fallbackId) ? fallbackId : (validActionIds[0] || 0);
    };

    const idle = pickIdleAction();
    const baseOff = idle >= 1000 ? Math.floor(idle / 1000) * 1000 : 0;

    const walk = pickAction(
      baseOff ? [baseOff + 20, baseOff + 21, 20, 21, 100] : [20, 21, 100],
      baseOff ? baseOff + 19 : 19,
      baseOff ? baseOff + 105 : 105,
      idle
    );
    const jump = pickAction(
      baseOff ? [baseOff + 40, baseOff + 41, 40, 41, 42, 43, 50] : [40, 41, 42, 43, 50],
      baseOff ? baseOff + 40 : 40,
      baseOff ? baseOff + 65 : 65,
      idle
    );
    const dash = pickAction(
      baseOff ? [baseOff + 100, baseOff + 105, 100, 105, 110, walk] : [100, 105, 110, 20],
      baseOff ? baseOff + 100 : 100,
      baseOff ? baseOff + 119 : 119,
      walk
    );
    const guard = pickAction(
      baseOff ? [baseOff + 120, baseOff + 130, 120, 130, 131, 140] : [120, 130, 131, 140],
      baseOff ? baseOff + 120 : 120,
      baseOff ? baseOff + 159 : 159,
      idle
    );
    const hurt = pickAction([5000, 5001, 5010, 5020, baseOff + 5000], 5000, 5099, idle);
    const hurtFly = pickAction([5030, 5050, 5070, 5100], 5030, 5199, hurt);
    const dead = pickAction([5110, 5150, 5050], 5100, 5200, hurtFly);

    const isNonAdd = (id) => {
      const v = actionFirstVis.get(id);
      return Boolean(v && !v.isAdditive);
    };
    const attackActions = validActionIds.filter((id) => id >= 200 && id < 700 && id !== idle && isNonAdd(id));
    const specialActions = validActionIds.filter((id) => id >= 700 && id < 3000 && id !== idle && isNonAdd(id));
    const superActions = validActionIds.filter((id) => id >= 3000 && id < 5000 && id !== idle && isNonAdd(id));
    const allOffensive = [...specialActions, ...superActions, ...attackActions];

    const getOff = (idx, fallback) => {
      if (allOffensive.length === 0) return fallback !== undefined ? fallback : idle;
      return allOffensive[idx % allOffensive.length];
    };

    return {
      idle,
      walk,
      jump,
      dash,
      guard,
      hurt,
      hurtFly,
      dead,
      skills: {
        j: attackActions[0] !== undefined ? attackActions[0] : getOff(0, idle),
        wj: attackActions[1] !== undefined ? attackActions[1] : getOff(1, idle),
        sj: attackActions[2] !== undefined ? attackActions[2] : getOff(2, idle),
        u: specialActions[0] !== undefined ? specialActions[0] : getOff(3, idle),
        wu: specialActions[1] !== undefined ? specialActions[1] : getOff(4, idle),
        su: specialActions[2] !== undefined ? specialActions[2] : getOff(5, idle),
        i: superActions[0] !== undefined ? superActions[0] : (specialActions[3] !== undefined ? specialActions[3] : getOff(6, idle)),
        wi: superActions[1] !== undefined ? superActions[1] : (specialActions[4] !== undefined ? specialActions[4] : getOff(7, idle)),
        si: superActions[2] !== undefined ? superActions[2] : (superActions[0] !== undefined ? superActions[0] : getOff(8, idle))
      },
      validActionIds,
      actionOffset: 0
    };
  }

  function computeFighterMetrics(sff, air, mapping, scaleMult) {
    const mult = (typeof scaleMult === 'number' && scaleMult > 0) ? scaleMult : 1.0;
    const idleAction = air.get(mapping.idle);
    let vis = findFirstVisibleElement(idleAction, sff.sprites, false, true)
      || findFirstVisibleElement(idleAction, sff.sprites, false, false);
    if (!vis) {
      // Fallback: find any visible non-portrait sprite in SFF
      for (const spr of sff.sprites.values()) {
        if (spr.groupNo >= 9000 || !spr.decoded || !spr.decoded.canvas) continue;
        const b = getSpriteBounds(spr.decoded);
        if (b && b.opaqueCount > 50 && b.visH >= 16) {
          vis = { elem: { x: 0, y: 0, flip: '' }, spr, bounds: b };
          break;
        }
      }
    }

    if (!vis) {
      return {
        scale: 1.85 * mult,
        footOffsetY: 0,
        idleHeightPx: Math.round(108 * mult),
        idleBounds: null
      };
    }

    const TARGET_HEIGHT_PX = 112;
    const rawVisH = Math.max(16, vis.bounds.visH);
    const baseScale = Math.max(0.4, Math.min(3.4, TARGET_HEIGHT_PX / rawVisH));
    const scale = Math.max(0.4, Math.min(4.2, baseScale * mult));
    // Align bottom-most opaque pixel of the idle sprite cleanly to local Y = 0 (FLOOR_Y)
    const rawBottomY = (-vis.spr.axisY + vis.elem.y + vis.bounds.maxY + 1) * scale;
    const footOffsetY = -rawBottomY;
    const idleHeightPx = Math.round(vis.bounds.visH * scale);

    return {
      scale,
      footOffsetY,
      idleHeightPx,
      idleBounds: vis.bounds
    };
  }

  function getFormPackView(pack, actionOffset, scaleMult) {
    if (!pack) return null;
    const off = Math.max(0, Math.floor(actionOffset || 0));
    const mult = (typeof scaleMult === 'number' && scaleMult > 0) ? scaleMult : 1.0;

    if (off === 0 && Math.abs(mult - 1.0) < 0.001) {
      return {
        mapping: pack.mapping,
        scale: pack.scale || 1.85,
        footOffsetY: pack.footOffsetY || 0,
        idleHeightPx: pack.idleHeightPx || 110,
        formKey: 'base'
      };
    }

    if (!pack.altMappings) pack.altMappings = new Map();
    if (!pack.altMetrics) pack.altMetrics = new Map();

    const cacheKey = `${off}:${mult.toFixed(3)}`;
    const cached = pack.altMetrics.get(cacheKey);
    if (cached) return cached;

    let view;
    if (off > 0) {
      let mapping = pack.altMappings.get(off);
      if (!mapping) {
        mapping = buildBvnActionMapping(pack.air, pack.sff.sprites, off);
        pack.altMappings.set(off, mapping);
      }
      const metrics = computeFighterMetrics(pack.sff, pack.air, mapping, mult);
      view = {
        mapping,
        scale: metrics.scale,
        footOffsetY: metrics.footOffsetY,
        idleHeightPx: metrics.idleHeightPx,
        formKey: cacheKey
      };
    } else {
      // Scale base form sprite cleanly while keeping feet locked to FLOOR_Y
      const baseScale = pack.scale || 1.85;
      const baseFootOffsetY = pack.footOffsetY || 0;
      const baseIdleH = pack.idleHeightPx || 110;
      view = {
        mapping: pack.mapping,
        scale: baseScale * mult,
        footOffsetY: baseFootOffsetY * mult,
        idleHeightPx: Math.round(baseIdleH * mult),
        formKey: cacheKey
      };
    }

    pack.altMetrics.set(cacheKey, view);
    return view;
  }

  class MugenCharacterRegistry {
    constructor() {
      this.loadedPacks = new Map();
      this.failedIds = new Set();
      this.showHitboxes = false;
      this.builtInPresets = {
        naruto: {
          defUrl: 'chars/naruto/naruto.def',
          sffUrl: 'chars/naruto/naruto.sff',
          airUrl: 'chars/naruto/naruto.air',
          actUrl: 'chars/naruto/n.act'
        },
        sasuke: {
          defUrl: 'chars/sasuke/sasuke.def',
          sffUrl: 'chars/sasuke/sasuke.sff',
          airUrl: 'chars/sasuke/sasuke.air',
          actUrl: 'chars/sasuke/s.act'
        },
        goku: {
          defUrl: 'chars/goku/goku.def',
          sffUrl: 'chars/goku/gokussj-gt.sff',
          airUrl: 'chars/goku/gokussj-gt.air',
          actUrl: null
        },
        vegeta: {
          defUrl: 'chars/vegeta/vegeta.def',
          sffUrl: 'chars/vegeta/VegGT.sff',
          airUrl: 'chars/vegeta/VegGT.air',
          actUrl: null
        },
        itachi: {
          defUrl: 'chars/itachi/itachi.def',
          sffUrl: 'chars/itachi/Itachi.sff',
          airUrl: 'chars/itachi/Itachi.air',
          actUrl: 'chars/itachi/Itachi.act'
        },
        kakashi: {
          defUrl: 'chars/kakashi/kakashi.def',
          sffUrl: 'chars/kakashi/kakashi.sff',
          airUrl: 'chars/kakashi/kakashi.air',
          actUrl: 'chars/kakashi/kakashi.act'
        },
        luffy: {
          defUrl: 'chars/luffy/SM_Luffy_TS.def',
          sffUrl: 'chars/luffy/SM_Luffy_TS.sff',
          airUrl: 'chars/luffy/SM_Luffy_TS.air',
          actUrl: 'chars/luffy/1.act'
        },
        gon: {
          defUrl: 'chars/gon/Gon.def',
          sffUrl: 'chars/gon/Gon.sff',
          airUrl: 'chars/gon/Gon.air',
          actUrl: 'chars/gon/1.act'
        },
        killua: {
          defUrl: 'chars/killua/Killua.def',
          sffUrl: 'chars/killua/Killua.sff',
          airUrl: 'chars/killua/Killua.air',
          actUrl: 'chars/killua/1.act'
        },
        ichigo: {
          defUrl: 'chars/ichigo/Ichigo_Final.def',
          sffUrl: 'chars/ichigo/Ichigo_Final.sff',
          airUrl: 'chars/ichigo/Ichigo_Final.air',
          actUrl: 'chars/ichigo/1.act'
        },
        jotaro: {
          defUrl: 'chars/jotaro/SM_Jotaro.def',
          sffUrl: 'chars/jotaro/SM_Jotaro.sff',
          airUrl: 'chars/jotaro/SM_Jotaro.air',
          actUrl: 'chars/jotaro/1.act'
        },
        kurapika: {
          defUrl: 'chars/kurapika/Kurapika.def',
          sffUrl: 'chars/kurapika/Kurapika.sff',
          airUrl: 'chars/kurapika/Kurapika.air',
          actUrl: null
        },
        hisoka: {
          defUrl: 'chars/hisoka/Hisoka.def',
          sffUrl: 'chars/hisoka/Hisoka.sff',
          airUrl: 'chars/hisoka/Hisoka.air',
          actUrl: null
        },
        meruem: {
          defUrl: 'chars/meruem/Meruem.def',
          sffUrl: 'chars/meruem/Meruem.sff',
          airUrl: 'chars/meruem/Meruem.air',
          actUrl: null
        },
        netero: {
          defUrl: 'chars/netero/Netero.def',
          sffUrl: 'chars/netero/Netero.sff',
          airUrl: 'chars/netero/Netero.air',
          actUrl: null
        },
        chrollo: {
          defUrl: 'chars/chrollo/Chrollo.def',
          sffUrl: 'chars/chrollo/Chrollo.sff',
          airUrl: 'chars/chrollo/Chrollo.air',
          actUrl: null
        },
        feitan: {
          defUrl: 'chars/feitan/Feitan.def',
          sffUrl: 'chars/feitan/Feitan.sff',
          airUrl: 'chars/feitan/Feitan.air',
          actUrl: null
        },
        pitou: {
          defUrl: 'chars/pitou/Pitou.def',
          sffUrl: 'chars/pitou/Pitou.sff',
          airUrl: 'chars/pitou/Pitou.air',
          actUrl: null
        }
      };
      if (typeof window !== 'undefined' && window.EXTRA_MUGEN_PRESETS && typeof window.EXTRA_MUGEN_PRESETS === 'object') {
        for (const key of Object.keys(window.EXTRA_MUGEN_PRESETS)) {
          if (!this.builtInPresets[key]) {
            this.builtInPresets[key] = window.EXTRA_MUGEN_PRESETS[key];
          }
        }
      }
      this.loadingSet = new Set();
      this.maxCachedPacks = 6;
      this._lruSeq = 0;
    }

    getPreset(fighterId) {
      if (!fighterId) return null;
      if (this.builtInPresets[fighterId]) return this.builtInPresets[fighterId];
      if (typeof window !== 'undefined' && window.EXTRA_MUGEN_PRESETS && window.EXTRA_MUGEN_PRESETS[fighterId]) {
        this.builtInPresets[fighterId] = window.EXTRA_MUGEN_PRESETS[fighterId];
        return this.builtInPresets[fighterId];
      }
      return null;
    }

    getFormPackView(pack, actionOffset, scaleMult) {
      return getFormPackView(pack, actionOffset, scaleMult);
    }

    touchPack(pack) {
      if (!pack) return;
      pack._lastUsed = ++this._lruSeq;
      pack._lastUsedAt = Date.now();
    }

    getActiveFighterIds() {
      const active = new Set();
      const app = typeof window !== 'undefined' ? window.gameApp : null;
      if (!app) return active;
      if (app.p1 && app.p1.meta && app.p1.meta.id) active.add(app.p1.meta.id);
      if (app.p2 && app.p2.meta && app.p2.meta.id) active.add(app.p2.meta.id);
      if (app.p1Id) active.add(app.p1Id);
      if (app.p2Id) active.add(app.p2Id);
      if (app.p1AssistId) active.add(app.p1AssistId);
      if (app.p2AssistId) active.add(app.p2AssistId);
      if (Array.isArray(app.assistSummons)) {
        for (const a of app.assistSummons) {
          if (a && a.fighterId) active.add(a.fighterId);
          if (a && a.meta && a.meta.id) active.add(a.meta.id);
        }
      }
      return active;
    }

    evictLruPacks(protectedId) {
      if (this.loadedPacks.size <= this.maxCachedPacks) return;
      const activeIds = this.getActiveFighterIds();
      if (protectedId) activeIds.add(protectedId);

      while (this.loadedPacks.size > this.maxCachedPacks) {
        let victimId = null;
        let oldestUse = Infinity;
        for (const [id, pack] of this.loadedPacks.entries()) {
          if (activeIds.has(id)) continue;
          const used = (pack && typeof pack._lastUsed === 'number') ? pack._lastUsed : 0;
          if (used < oldestUse) {
            oldestUse = used;
            victimId = id;
          }
        }
        if (!victimId) break;
        this.loadedPacks.delete(victimId);
      }
    }

    hasPreset(fighterId) {
      if (this.failedIds.has(fighterId)) return false;
      return Boolean(this.getPreset(fighterId) || this.loadedPacks.has(fighterId));
    }

    getPresetCount() {
      if (typeof window !== 'undefined' && window.EXTRA_MUGEN_PRESETS && typeof window.EXTRA_MUGEN_PRESETS === 'object') {
        for (const key of Object.keys(window.EXTRA_MUGEN_PRESETS)) {
          if (!this.builtInPresets[key]) {
            this.builtInPresets[key] = window.EXTRA_MUGEN_PRESETS[key];
          }
        }
      }
      return Object.keys(this.builtInPresets).length;
    }

    async ensureFightersLoaded(p1Id, p2Id) {
      const targets = [p1Id, p2Id].filter((id) => id && this.getPreset(id) && !this.loadedPacks.has(id) && !this.loadingSet.has(id));
      for (const id of targets) {
        this.loadingSet.add(id);
        this.loadPresetForFighter(id).finally(() => {
          this.loadingSet.delete(id);
        });
      }
    }

    resolveAssetUrl(relPath) {
      return resolveAssetUrl(relPath);
    }

    async loadPresetForFighter(fighterId) {
      if (this.loadedPacks.has(fighterId)) {
        const existing = this.loadedPacks.get(fighterId);
        this.touchPack(existing);
        return existing;
      }
      const preset = this.getPreset(fighterId);
      if (!preset) return null;

      try {
        const hasRemoteBase = Boolean(getAssetBaseUrl());
        const fetchAsset = (relUrl) => {
          const url = resolveAssetUrl(relUrl);
          return hasRemoteBase ? fetch(url, { mode: 'cors' }) : fetch(url);
        };
        const [sffResp, airResp, actResp] = await Promise.all([
          fetchAsset(preset.sffUrl),
          fetchAsset(preset.airUrl),
          preset.actUrl ? fetchAsset(preset.actUrl) : Promise.resolve(null)
        ]);
        if (!sffResp.ok || !airResp.ok) {
          this.failedIds.add(fighterId);
          return null;
        }

        const sffBuf = await sffResp.arrayBuffer();
        const airText = await airResp.text();
        const actBuf = (actResp && actResp.ok) ? await actResp.arrayBuffer() : null;

        const sff = await decodeSFF(sffBuf, actBuf);
        const air = decodeAIR(airText);
        const baseActionOffset = preset.baseActionOffset || 0;
        const baseScaleMult = preset.baseScaleMult || 1.0;
        const mapping = buildBvnActionMapping(air, sff.sprites, baseActionOffset);
        const metrics = computeFighterMetrics(sff, air, mapping, baseScaleMult);

        const pack = {
          fighterId,
          sff,
          air,
          mapping,
          scale: metrics.scale,
          footOffsetY: metrics.footOffsetY,
          idleHeightPx: metrics.idleHeightPx,
          idleBounds: metrics.idleBounds,
          baseActionOffset,
          baseScaleMult,
          altMappings: new Map(),
          altMetrics: new Map(),
          _lastUsed: 0,
          _lastUsedAt: 0
        };
        this.touchPack(pack);
        this.loadedPacks.set(fighterId, pack);
        this.evictLruPacks(fighterId);
        this.notifyStatus(`Đã nạp M.U.G.E.N SFF v${sff.version} cho [${fighterId.toUpperCase()}]: ${sff.spriteCount} sprites, ${air.size} actions (scale ${metrics.scale.toFixed(2)}x)`);
        return pack;
      } catch (err) {
        this.failedIds.add(fighterId);
        console.warn('[MUGEN Loader] Skip preset load for', fighterId, err.message);
        return null;
      }
    }

    async loadAllBuiltInPresets() {
      const ids = Object.keys(this.builtInPresets);
      let loadedCount = 0;
      for (const id of ids) {
        const pack = await this.loadPresetForFighter(id);
        if (pack) loadedCount++;
      }
      if (loadedCount > 0) {
        this.notifyStatus(`Đã nạp thành công ${loadedCount} nhân vật M.U.G.E.N (.sff v1/v2 + .air) vào sàn đấu!`);
      }
    }

    async importFromFileList(fileList, targetSlot) {
      const files = Array.from(fileList || []);
      const sffFile = files.find((f) => f.name.toLowerCase().endsWith('.sff'));
      const airFile = files.find((f) => f.name.toLowerCase().endsWith('.air'));
      const defFile = files.find((f) => f.name.toLowerCase().endsWith('.def'));
      const actFile = files.find((f) => f.name.toLowerCase().endsWith('.act'));

      if (!sffFile || !airFile) {
        alert('Thư mục M.U.G.E.N cần có ít nhất 1 file .sff (Sprite) và 1 file .air (Animation)!');
        return null;
      }

      const [sffBuf, airText, defText, actBuf] = await Promise.all([
        sffFile.arrayBuffer(),
        airFile.text(),
        defFile ? defFile.text() : Promise.resolve(''),
        actFile ? actFile.arrayBuffer() : Promise.resolve(null)
      ]);

      const defInfo = defText ? decodeDEF(defText) : { name: sffFile.name.replace(/\.sff$/i, '') };
      const charName = defInfo.displayname || defInfo.name || sffFile.name.replace(/\.sff$/i, '');
      const customId = 'mugen_' + charName.toLowerCase().replace(/[^a-z0-9]+/g, '_');

      const sff = await decodeSFF(sffBuf, actBuf);
      const air = decodeAIR(airText);
      const mapping = buildBvnActionMapping(air, sff.sprites);
      const metrics = computeFighterMetrics(sff, air, mapping);

      let meta = window.FIGHTER_ROSTER.find((f) => f.id === customId);
      if (!meta) {
        const template = window.FIGHTER_ROSTER[0];
        meta = JSON.parse(JSON.stringify(template));
        meta.id = customId;
        meta.name = charName;
        meta.title = `Chiến binh tùy chỉnh (${sff.spriteCount} Sprites)`;
        meta.universe = 'bleach';
        meta.universeLabel = 'CUSTOM';
        meta.difficulty = 'Easy-Cast BVN';
        window.FIGHTER_ROSTER.unshift(meta);
      }

      const pack = {
        fighterId: customId,
        sff,
        air,
        mapping,
        scale: metrics.scale,
        footOffsetY: metrics.footOffsetY,
        idleHeightPx: metrics.idleHeightPx,
        idleBounds: metrics.idleBounds,
        baseActionOffset: 0,
        baseScaleMult: 1.0,
        altMappings: new Map(),
        altMetrics: new Map(),
        _lastUsed: 0,
        _lastUsedAt: 0
      };
      this.touchPack(pack);
      this.loadedPacks.set(customId, pack);
      this.evictLruPacks(customId);

      if (window.gameApp) {
        if (targetSlot === 2) {
          window.gameApp.p2Id = customId;
        } else {
          window.gameApp.p1Id = customId;
        }
        if (typeof window.gameApp.renderUniverseFilters === 'function') {
          window.gameApp.renderUniverseFilters();
        }
        window.gameApp.renderRosterGrid();
        window.gameApp.startMatch();
      }

      this.notifyStatus(
        `Đã nạp [${charName}] cho P${targetSlot} (${sff.spriteCount} sprites · ${air.size} actions).`
      );
      return pack;
    }

    notifyStatus(msg) {
      const el = document.getElementById('mugenLoaderStatus');
      if (el) el.textContent = msg;
    }

    resolveActionSprite(pack, action, elemIdx, fighter, activeMapping) {
      const elems = action.elements;
      const curEl = elems[elemIdx % elems.length];

      // Try current element first (skip -1,* blank spacers and 90xx portraits/screen-fade helpers)
      if (curEl && curEl.groupNo >= 0 && curEl.imageNo >= 0 && curEl.groupNo < 9000) {
        const spr = pack.sff.sprites.get(`${curEl.groupNo},${curEl.imageNo}`);
        if (spr && spr.decoded && spr.decoded.canvas) {
          fighter._mugenLastValidElem = curEl;
          fighter._mugenLastValidSpr = spr;
          return { elem: curEl, spr };
        }
      }

      // Otherwise hold last valid sprite from this fighter if available
      if (fighter._mugenLastValidSpr && fighter._mugenLastValidSpr.decoded && fighter._mugenLastValidSpr.decoded.canvas) {
        return { elem: fighter._mugenLastValidElem || curEl, spr: fighter._mugenLastValidSpr };
      }

      // Otherwise find first valid visible sprite in the same action
      const inAct = findFirstVisibleElement(action, pack.sff.sprites, false, false);
      if (inAct) {
        fighter._mugenLastValidElem = inAct.elem;
        fighter._mugenLastValidSpr = inAct.spr;
        return { elem: inAct.elem, spr: inAct.spr };
      }

      // Finally fall back to active form's idle action first visible sprite (NEVER flash 9000,0 portrait!)
      const mapping = activeMapping || pack.mapping;
      const idleAct = pack.air.get(mapping.idle);
      const inIdle = findFirstVisibleElement(idleAct, pack.sff.sprites, false, false);
      if (inIdle) {
        fighter._mugenLastValidElem = inIdle.elem;
        fighter._mugenLastValidSpr = inIdle.spr;
        return { elem: inIdle.elem, spr: inIdle.spr };
      }

      return null;
    }

    drawTailedBeastCloak(ctx, fighter, awForm, idleHeightPx) {
      const tailCount = Math.min(9, Math.max(1, Math.floor(awForm.tails || 0)));
      if (tailCount <= 0) return;

      const t = (typeof performance !== 'undefined' ? performance.now() : Date.now()) * 0.0058;
      const dir = -(fighter.direct || 1);
      const tailCol = awForm.tailColor || '#ef4444';
      const auraCol = awForm.auraColor || tailCol;
      const baseX = dir * 8;
      const baseY = -Math.round(idleHeightPx * 0.34);

      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // 1. Animated Bezier Chakra Tails behind the fighter (zero shadowBlur)
      const outerW = tailCount === 1 ? 22 : (tailCount <= 4 ? 15 : 10);
      const midW = tailCount === 1 ? 13 : (tailCount <= 4 ? 9 : 6);
      const coreW = tailCount === 1 ? 5 : (tailCount <= 4 ? 3 : 2);

      for (let i = 0; i < tailCount; i++) {
        const frac = tailCount === 1 ? 0.5 : (i / (tailCount - 1));
        const angle = tailCount === 1 ? -0.28 : (-0.86 + frac * 1.24);
        const len = Math.round(idleHeightPx * (tailCount === 1 ? 0.94 : (0.72 + 0.18 * Math.sin(frac * Math.PI))));
        const phase = t + i * 0.74;

        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);
        const waveMid = Math.sin(phase) * (11 + (i % 3) * 3);
        const waveTip = Math.cos(phase * 1.25) * (15 + (i % 2) * 5);

        const midX = baseX + dir * cosA * (len * 0.52);
        const midY = baseY + sinA * (len * 0.52) + waveMid;
        const tipX = baseX + dir * cosA * len + dir * Math.sin(phase * 0.85) * 7;
        const tipY = baseY + sinA * len + waveTip;

        // Outer translucent chakra sheath
        ctx.strokeStyle = auraCol;
        ctx.globalAlpha = 0.28;
        ctx.lineWidth = outerW;
        ctx.beginPath();
        ctx.moveTo(baseX, baseY);
        ctx.quadraticCurveTo(midX, midY, tipX, tipY);
        ctx.stroke();

        // Main vivid tail body
        ctx.strokeStyle = tailCol;
        ctx.globalAlpha = 0.9;
        ctx.lineWidth = midW;
        ctx.beginPath();
        ctx.moveTo(baseX, baseY);
        ctx.quadraticCurveTo(midX, midY, tipX, tipY);
        ctx.stroke();

        // Inner hot chakra spine
        ctx.strokeStyle = '#fef3c7';
        ctx.globalAlpha = 0.62;
        ctx.lineWidth = coreW;
        ctx.beginPath();
        ctx.moveTo(baseX, baseY);
        ctx.quadraticCurveTo(
          baseX + (midX - baseX) * 0.92,
          baseY + (midY - baseY) * 0.92,
          baseX + (tipX - baseX) * 0.88,
          baseY + (tipY - baseY) * 0.88
        );
        ctx.stroke();
      }

      // 2. Bubbling Tailed Beast Cloak Aura around the fighter (layered ellipses, zero shadowBlur)
      const cx = 0;
      const cy = -Math.round(idleHeightPx * 0.48);
      const pulse = 1 + 0.05 * Math.sin(t * 1.8);
      const rx = Math.round(36 * pulse);
      const ry = Math.round(idleHeightPx * 0.53 * pulse);

      ctx.fillStyle = auraCol;
      ctx.globalAlpha = 0.16;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx + 8, ry + 7, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = auraCol;
      ctx.globalAlpha = 0.34;
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx + 2, ry + 2, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = tailCol;
      ctx.globalAlpha = 0.85;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Rising cloak chakra beads (5 fast circles, zero shadowBlur)
      ctx.fillStyle = tailCol;
      for (let k = 0; k < 5; k++) {
        const cycle = (t * 0.55 + k * 0.2) % 1;
        const wx = Math.sin(t * 1.3 + k * 2.1) * (rx * 0.72);
        const wy = -8 - cycle * (idleHeightPx * 0.95);
        const r = (1 - cycle) * 4.5 + 1.5;
        ctx.globalAlpha = (1 - cycle) * 0.72;
        ctx.beginPath();
        ctx.arc(wx, wy, r, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    drawParryRings(ctx, fighter, idleHeightPx) {
      const now = (typeof performance !== 'undefined' ? performance.now() : Date.now()) * 0.008;
      const col = (fighter.counterSpec && fighter.counterSpec.beamColor) || '#38bdf8';
      const cy = -Math.round(idleHeightPx * 0.48);
      const r1 = Math.max(36, Math.round(idleHeightPx * 0.44));
      const r2 = r1 + 9 + Math.sin(now * 2.4) * 3;

      ctx.save();
      // Soft outer halo ring (no shadowBlur)
      ctx.strokeStyle = col;
      ctx.globalAlpha = 0.25;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(0, cy, r2, 0, Math.PI * 2);
      ctx.stroke();

      // Crisp solid inner defensive ring
      ctx.strokeStyle = '#e0f2fe';
      ctx.globalAlpha = 0.82;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, cy, r1, 0, Math.PI * 2);
      ctx.stroke();

      // Rotating segmented parry arcs
      ctx.strokeStyle = col;
      ctx.globalAlpha = 0.95;
      ctx.lineWidth = 3;
      for (let i = 0; i < 3; i++) {
        const a0 = now + i * ((Math.PI * 2) / 3);
        ctx.beginPath();
        ctx.arc(0, cy, r2, a0, a0 + 1.15);
        ctx.stroke();
      }

      // 4 crisp cardinal glint diamonds
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = 0.9;
      for (let k = 0; k < 4; k++) {
        const ang = -now * 0.7 + k * (Math.PI * 0.5);
        const gx = Math.cos(ang) * r1;
        const gy = cy + Math.sin(ang) * r1;
        ctx.beginPath();
        ctx.moveTo(gx, gy - 4);
        ctx.lineTo(gx + 3.5, gy);
        ctx.lineTo(gx, gy + 4);
        ctx.lineTo(gx - 3.5, gy);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }

    drawMugenFighter(ctx, fighter) {
      const fid = (fighter && fighter.meta && fighter.meta.id) || (fighter && fighter.fighterId);
      const pack = fid ? this.loadedPacks.get(fid) : null;
      if (!pack) return false;
      this.touchPack(pack);

      const isGhost = Boolean(fighter._isGhost);
      const awForm = (fighter.awakened && fighter.meta && fighter.meta.awakenedForm) ? fighter.meta.awakenedForm : null;

      let formView;
      if (awForm && awForm.actionOffset) {
        formView = this.getFormPackView(pack, awForm.actionOffset, awForm.scaleMult || 1.35);
      } else if (awForm && awForm.scaleMult) {
        formView = this.getFormPackView(pack, 0, awForm.scaleMult);
      } else {
        formView = {
          mapping: pack.mapping,
          scale: pack.scale || 1.85,
          footOffsetY: pack.footOffsetY || 0,
          idleHeightPx: pack.idleHeightPx || 110,
          formKey: 'base'
        };
      }

      const activeMapping = formView.mapping;
      if (fighter._mugenLastFormKey !== formView.formKey) {
        fighter._mugenLastFormKey = formView.formKey;
        fighter._mugenLastValidElem = null;
        fighter._mugenLastValidSpr = null;
        fighter._mugenLastActionId = null;
      }

      let actionId = activeMapping.idle;
      if (fighter.actionState === 30) {
        actionId = activeMapping.dead;
      } else if (fighter.actionState === 22) {
        actionId = activeMapping.hurtFly;
      } else if (fighter.actionState === 21) {
        actionId = activeMapping.hurt;
      } else if (fighter.actionState === 20) {
        actionId = activeMapping.guard;
      } else if (fighter.actionState === 15) {
        actionId = activeMapping.dash;
      } else if (
        fighter.activeSkillKey &&
        activeMapping.skills[fighter.activeSkillKey] !== undefined
      ) {
        actionId = activeMapping.skills[fighter.activeSkillKey];
      } else if (fighter.isInAir) {
        actionId = activeMapping.jump;
      } else if (Math.abs(fighter.vx || 0) > 0.8) {
        actionId = activeMapping.walk;
      }

      const action = pack.air.get(actionId) || pack.air.get(activeMapping.idle);
      if (!action || !action.elements || action.elements.length === 0) return false;

      if (fighter._mugenLastActionId !== actionId) {
        fighter._mugenLastActionId = actionId;
        fighter._mugenElemIdx = 0;
        fighter._mugenTick = 0;
      } else {
        fighter._mugenTick = (fighter._mugenTick || 0) + 1;
        const curEl = action.elements[fighter._mugenElemIdx % action.elements.length];
        if (fighter._mugenTick >= (curEl ? curEl.time : 6)) {
          fighter._mugenTick = 0;
          fighter._mugenElemIdx = (fighter._mugenElemIdx + 1) % action.elements.length;
        }
      }

      const resolved = this.resolveActionSprite(pack, action, fighter._mugenElemIdx, fighter, activeMapping);
      if (!resolved) return false;
      const { elem, spr } = resolved;

      const scale = formView.scale || 1.85;
      const footOffsetY = formView.footOffsetY || 0;
      const idleHeightPx = formView.idleHeightPx || 110;

      ctx.save();
      ctx.translate(fighter.x, fighter.y);
      if (isGhost) {
        const gAlpha = typeof fighter._ghostAlpha === 'number' ? fighter._ghostAlpha : 0.45;
        ctx.globalAlpha = ctx.globalAlpha * gAlpha;
      }

      // Ground shadow anchored cleanly at FLOOR_Y (scales cleanly with giant forms)
      if (!isGhost) {
        const sizeRatio = Math.max(1, idleHeightPx / 112);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.beginPath();
        ctx.ellipse(0, 0, Math.round(28 * sizeRatio), Math.round(7 * sizeRatio), 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Tailed Beast Chakra Cloak + Animated Bezier Tails OR standard Awakening/Max-Qi Aura (zero shadowBlur)
      if (!isGhost) {
        if (awForm && awForm.tails > 0) {
          this.drawTailedBeastCloak(ctx, fighter, awForm, idleHeightPx);
        } else if (fighter.awakened || (fighter.qi || 0) >= 300) {
          ctx.save();
          const colors = (fighter.meta && fighter.meta.colors) || {};
          const auraCol = (awForm && awForm.auraColor)
            || (fighter.awakened ? colors.awakenAura : colors.aura)
            || '#fb923c';
          const rx = Math.round(38 * Math.max(1, idleHeightPx / 112));
          const ry = Math.round(idleHeightPx * 0.52);
          const cy = -Math.round(idleHeightPx * 0.48);
          ctx.strokeStyle = auraCol;
          ctx.globalAlpha = 0.24;
          ctx.lineWidth = 8;
          ctx.beginPath();
          ctx.ellipse(0, cy, rx + 3, ry + 3, 0, 0, Math.PI * 2);
          ctx.stroke();

          ctx.globalAlpha = 0.88;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.ellipse(0, cy, rx, ry, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
      }

      // Draw flipped MUGEN sprite & optional Clsn hitboxes
      ctx.save();
      const flipH = (elem.flip && elem.flip.includes('H')) ? -1 : 1;
      const flipV = (elem.flip && elem.flip.includes('V')) ? -1 : 1;
      ctx.scale((fighter.direct || 1) * flipH, flipV);
      ctx.imageSmoothingEnabled = false;

      const drawX = (-spr.axisX + (elem.x || 0)) * scale;
      const drawY = (-spr.axisY + (elem.y || 0)) * scale + footOffsetY;
      const drawW = spr.decoded.width * scale;
      const drawH = spr.decoded.height * scale;

      ctx.drawImage(spr.decoded.canvas, drawX, drawY, drawW, drawH);

      if (!isGhost && this.showHitboxes) {
        if (elem.clsn2 && elem.clsn2.length) {
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
          ctx.lineWidth = 1.5;
          for (const b of elem.clsn2) {
            ctx.strokeRect(
              b.x1 * scale,
              b.y1 * scale + footOffsetY,
              (b.x2 - b.x1) * scale,
              (b.y2 - b.y1) * scale
            );
          }
        }
        if (elem.clsn1 && elem.clsn1.length) {
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.95)';
          ctx.lineWidth = 2;
          for (const b of elem.clsn1) {
            ctx.strokeRect(
              b.x1 * scale,
              b.y1 * scale + footOffsetY,
              (b.x2 - b.x1) * scale,
              (b.y2 - b.y1) * scale
            );
          }
        }
      }
      ctx.restore();

      // Defensive Parry Rings when true_counter window is active
      if (!isGhost && fighter.counterTimer > 0) {
        this.drawParryRings(ctx, fighter, idleHeightPx);
      }

      ctx.restore();

      if (!isGhost && fighter.meta && (fighter.slot === 1 || fighter.slot === 2 || this.showHitboxes)) {
        ctx.save();
        const tagColor = fighter.slot === 1 ? '#38bdf8' : (fighter.slot === 2 ? '#ff5a36' : '#facc15');
        const tagY = fighter.y - Math.max(96, idleHeightPx + 12);
        ctx.textAlign = 'center';
        ctx.lineJoin = 'round';

        if (this.showHitboxes) {
          const debugLabel = fighter.slot ? `P${fighter.slot} · Act ${actionId}` : `Act ${actionId}`;
          ctx.font = '800 12px "Barlow Condensed", "Segoe UI", sans-serif';
          ctx.lineWidth = 3.5;
          ctx.strokeStyle = 'rgba(7, 10, 16, 0.92)';
          ctx.strokeText(debugLabel, fighter.x, tagY - 4);
          ctx.fillStyle = tagColor;
          ctx.fillText(debugLabel, fighter.x, tagY - 4);
        } else if (fighter.slot === 1 || fighter.slot === 2) {
          // Crisp dark-stroked overhead P1/P2 arcade chevron + compact tag
          const slotTag = `P${fighter.slot}`;
          ctx.beginPath();
          ctx.moveTo(fighter.x - 5.5, tagY - 6);
          ctx.lineTo(fighter.x + 5.5, tagY - 6);
          ctx.lineTo(fighter.x, tagY);
          ctx.closePath();
          ctx.lineWidth = 2.5;
          ctx.strokeStyle = 'rgba(7, 10, 16, 0.92)';
          ctx.stroke();
          ctx.fillStyle = tagColor;
          ctx.fill();

          ctx.font = '800 11px "Barlow Condensed", "Segoe UI", sans-serif';
          ctx.lineWidth = 3;
          ctx.strokeStyle = 'rgba(7, 10, 16, 0.92)';
          ctx.strokeText(slotTag, fighter.x, tagY - 10);
          ctx.fillStyle = tagColor;
          ctx.fillText(slotTag, fighter.x, tagY - 10);
        }
        ctx.restore();
      }

      return true;
    }
  }

  window.mugenRegistry = new MugenCharacterRegistry();
})();
