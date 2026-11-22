#!/usr/bin/env node
/**
 * Palácio do Credor — gerador determinístico de assets autorais.
 *
 * Produz SVGs vetoriais (arquitetura, vegetação corrompida, pisos) e a folha
 * PNG 4x3 (128x114) do chefe Credor. Não baixa, copia ou deriva arte de
 * terceiros; todo o conteúdo é desenhado por este script.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIRECTORY = path.join(ROOT, 'src', 'assets', 'palacio');

const PALETTE = Object.freeze({
  void: '#120d18',
  stoneDark: '#241d31',
  stone: '#332844',
  stoneMid: '#4a3c5e',
  stoneLight: '#6a5b7e',
  stonePale: '#94869f',
  goldDark: '#6f5327',
  gold: '#b58a3f',
  goldLight: '#e8c987',
  ivory: '#e7dcc4',
  ivoryShade: '#b9ab8e',
  moss: '#4f6a3a',
  mossLight: '#7f9a52',
  rot: '#5c3a2a',
  corruption: '#6f8f3a',
  corruptionLight: '#a6c44e',
  corruptionDark: '#35461f',
  bloom: '#6b2f4a',
  bloomLight: '#b05070',
  blood: '#7a2436',
  glass: '#38808a',
  glassLight: '#7fd6d0',
});

const svg = (width, height, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">\n${body}\n</svg>\n`;

const rect = (x, y, w, h, fill, extra = '') =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"${extra ? ` ${extra}` : ''}/>`;

const pathEl = (d, fill, extra = '') =>
  `<path d="${d}" fill="${fill}"${extra ? ` ${extra}` : ''}/>`;

const circle = (cx, cy, r, fill, extra = '') =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"${extra ? ` ${extra}` : ''}/>`;

const g = (body, extra = '') => `<g${extra ? ` ${extra}` : ''}>${body}</g>`;

function stoneBlock(x, y, w, h, tone = PALETTE.stone) {
  return [
    rect(x, y, w, h, tone),
    rect(x, y, w, 3, PALETTE.stoneMid, 'opacity="0.9"'),
    rect(x, y + h - 3, w, 3, PALETTE.void, 'opacity="0.55"'),
  ].join('\n');
}

function arch(x, y, w, h, tone, inner = PALETTE.void) {
  const radius = w / 2;
  return [
    pathEl(`M ${x} ${y + h} L ${x} ${y + radius} A ${radius} ${radius} 0 0 1 ${x + w} ${y + radius} L ${x + w} ${y + h} Z`, tone),
    pathEl(`M ${x + 12} ${y + h} L ${x + 12} ${y + radius + 4} A ${radius - 12} ${radius - 12} 0 0 1 ${x + w - 12} ${y + radius + 4} L ${x + w - 12} ${y + h} Z`, inner),
  ].join('\n');
}

function roots(x, y, scale, tone, seed) {
  let value = seed;
  const random = () => {
    value = (value * 1103515245 + 12345) & 0x7fffffff;
    return value / 0x7fffffff;
  };
  const pieces = [];
  const count = 7;
  for (let index = 0; index < count; index += 1) {
    const startX = x + (random() - 0.5) * 120 * scale;
    const startY = y - random() * 10;
    const length = (40 + random() * 90) * scale;
    const bend = (random() - 0.5) * 70 * scale;
    pieces.push(pathEl(
      `M ${startX.toFixed(1)} ${startY.toFixed(1)} C ${(startX + bend).toFixed(1)} ${(startY - length * 0.4).toFixed(1)} ${(startX + bend * 1.6).toFixed(1)} ${(startY - length * 0.8).toFixed(1)} ${(startX + bend * 0.4).toFixed(1)} ${(startY - length).toFixed(1)}`,
      'none',
      `stroke="${tone}" stroke-width="${(5 + random() * 7).toFixed(1)}" stroke-linecap="round" opacity="0.92"`,
    ));
  }
  return pieces.join('\n');
}

/* ---------------------------------------------------------------- pisos -- */

function floorFrame(tone, seam, accent, seed) {
  let value = seed;
  const random = () => {
    value = (value * 1664525 + 1013904223) & 0x7fffffff;
    return value / 0x7fffffff;
  };
  const parts = [rect(0, 0, 32, 32, tone)];
  for (let row = 0; row < 4; row += 1) {
    for (let column = 0; column < 4; column += 1) {
      const shade = random();
      if (shade > 0.62) parts.push(rect(column * 8, row * 8, 8, 8, seam, 'opacity="0.35"'));
    }
  }
  parts.push(rect(0, 0, 32, 1, seam));
  parts.push(rect(0, 15, 32, 1, seam, 'opacity="0.7"'));
  parts.push(rect(15, 0, 1, 32, seam, 'opacity="0.7"'));
  parts.push(rect(0, 31, 32, 1, PALETTE.void, 'opacity="0.5"'));
  for (let index = 0; index < 4; index += 1) {
    const x = Math.floor(random() * 30);
    const y = Math.floor(random() * 30);
    parts.push(rect(x, y, 1 + Math.floor(random() * 3), 1, accent, 'opacity="0.6"'));
  }
  if (seed % 2 === 0) parts.push(pathEl('M 4 22 L 10 25 L 13 21', 'none', `stroke="${seam}" stroke-width="1" opacity="0.7"`));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="32" viewBox="0 0 128 32">${[0, 1, 2, 3].map(frame =>
    `<g transform="translate(${frame * 32} 0)">${parts.join('')}</g>`).join('')}</svg>\n`;
}

/* ------------------------------------------------------------ arquitetura -- */

function gate(corrupted) {
  const body = [];
  body.push(rect(0, 236, 320, 20, PALETTE.void, 'opacity="0.55"'));
  body.push(stoneBlock(24, 72, 48, 170));
  body.push(stoneBlock(248, 72, 48, 170));
  body.push(stoneBlock(30, 48, 36, 28, PALETTE.stoneMid));
  body.push(stoneBlock(254, 48, 36, 28, PALETTE.stoneMid));
  body.push(arch(72, 92, 176, 150, PALETTE.stoneDark, corrupted ? PALETTE.void : '#1a1422'));
  for (let index = 0; index < 7; index += 1) {
    body.push(rect(84 + index * 23, 128, 5, 114, corrupted ? PALETTE.corruptionDark : PALETTE.goldDark, 'opacity="0.85"'));
  }
  body.push(rect(72, 88, 176, 8, PALETTE.stoneLight));
  body.push(rect(88, 96, 144, 6, corrupted ? PALETTE.corruption : PALETTE.goldDark, 'opacity="0.8"'));
  body.push(pathEl('M 160 60 L 176 84 L 144 84 Z', corrupted ? PALETTE.corruptionLight : PALETTE.goldLight));
  body.push(circle(160, 78, 5, PALETTE.void));
  if (!corrupted) {
    body.push(pathEl('M 60 96 L 74 120 L 60 144 L 46 120 Z', PALETTE.gold, 'opacity="0.55"'));
    body.push(rect(258, 100, 10, 60, PALETTE.goldDark, 'opacity="0.6"'));
    body.push(rect(262, 100, 3, 60, PALETTE.goldLight, 'opacity="0.45"'));
  } else {
    body.push(roots(160, 250, 1.2, PALETTE.corruption, 7));
    body.push(pathEl('M 110 70 L 132 108 L 120 150 L 146 190 L 136 236', 'none', `stroke="${PALETTE.corruptionLight}" stroke-width="7" stroke-linecap="round" opacity="0.85"`));
    body.push(pathEl('M 206 60 L 188 104 L 202 142 L 180 186 L 194 232', 'none', `stroke="${PALETTE.corruption}" stroke-width="9" stroke-linecap="round" opacity="0.8"`));
    body.push(circle(150, 116, 4, PALETTE.bloomLight));
    body.push(circle(210, 150, 3, PALETTE.bloomLight));
  }
  return svg(320, 256, body.join('\n'));
}

function tower(corrupted) {
  const body = [rect(0, 268, 192, 20, PALETTE.void, 'opacity="0.5"')];
  body.push(stoneBlock(48, 60, 96, 210));
  body.push(stoneBlock(56, 40, 80, 22, PALETTE.stoneMid));
  body.push(pathEl('M 40 42 L 96 6 L 152 42 Z', corrupted ? PALETTE.corruptionDark : PALETTE.stoneDark));
  for (let index = 0; index < 3; index += 1) {
    const y = 92 + index * 52;
    body.push(arch(70, y, 22, 30, PALETTE.void, corrupted ? PALETTE.corruptionDark : '#0d0912'));
    body.push(arch(100, y, 22, 30, PALETTE.void, corrupted ? PALETTE.corruptionDark : '#0d0912'));
  }
  body.push(rect(92, 248, 8, 20, PALETTE.void, 'opacity="0.6"'));
  if (!corrupted) {
    body.push(rect(54, 70, 4, 190, PALETTE.stoneLight, 'opacity="0.35"'));
    body.push(pathEl('M 62 250 L 74 232 L 70 250 Z', PALETTE.moss));
    body.push(pathEl('M 128 250 L 142 228 L 136 250 Z', PALETTE.moss));
  } else {
    body.push(pathEl('M 96 6 L 108 52 L 96 88 L 112 126 L 98 172 L 112 214 L 104 260', 'none', `stroke="${PALETTE.corruptionLight}" stroke-width="7" stroke-linecap="round" opacity="0.85"`));
    body.push(pathEl('M 96 90 L 60 120 L 74 150', 'none', `stroke="${PALETTE.corruption}" stroke-width="6" stroke-linecap="round" opacity="0.8"`));
    body.push(roots(96, 268, 0.9, PALETTE.corruptionDark, 11));
    body.push(circle(96, 120, 5, PALETTE.bloomLight));
    body.push(circle(74, 152, 4, PALETTE.bloomLight));
  }
  return svg(192, 288, body.join('\n'));
}

function arcade(corrupted) {
  const body = [rect(0, 158, 288, 18, PALETTE.void, 'opacity="0.5"')];
  for (let index = 0; index < 4; index += 1) {
    const x = 18 + index * 68;
    body.push(stoneBlock(x, 48, 22, 110));
    body.push(stoneBlock(x - 6, 42, 34, 10, PALETTE.stoneMid));
    if (index < 3) body.push(arch(x + 22, 64, 46, 94, PALETTE.stoneDark, corrupted ? PALETTE.void : '#1a1422'));
  }
  body.push(rect(6, 38, 276, 8, PALETTE.stoneMid));
  if (!corrupted) {
    body.push(pathEl('M 10 38 L 24 20 L 38 38 Z', PALETTE.stoneLight));
    body.push(pathEl('M 250 38 L 264 20 L 278 38 Z', PALETTE.stoneLight));
    body.push(pathEl('M 60 156 L 72 138 L 84 156 Z', PALETTE.moss));
    body.push(pathEl('M 196 156 L 208 134 L 220 156 Z', PALETTE.moss));
  } else {
    body.push(pathEl('M 28 158 L 48 110 L 40 74 L 66 52', 'none', `stroke="${PALETTE.corruption}" stroke-width="8" stroke-linecap="round" opacity="0.85"`));
    body.push(pathEl('M 250 158 L 232 112 L 244 76 L 220 56', 'none', `stroke="${PALETTE.corruptionDark}" stroke-width="9" stroke-linecap="round" opacity="0.9"`));
    for (let index = 0; index < 5; index += 1) {
      body.push(circle(50 + index * 48, 120 + (index % 2) * 22, 3, PALETTE.bloomLight, 'opacity="0.8"'));
    }
    body.push(rect(96, 42, 96, 6, PALETTE.corruptionDark));
  }
  return svg(288, 176, body.join('\n'));
}

function dais() {
  const body = [];
  body.push(pathEl('M 12 156 L 56 40 L 168 40 L 212 156 Z', PALETTE.stoneDark));
  body.push(pathEl('M 30 156 L 68 56 L 156 56 L 194 156 Z', PALETTE.stone));
  body.push(pathEl('M 50 156 L 82 72 L 142 72 L 174 156 Z', PALETTE.stoneMid));
  body.push(rect(82, 72, 60, 6, PALETTE.stoneLight));
  for (let index = 0; index < 5; index += 1) {
    body.push(rect(48 + index * 32, 104, 20, 4, PALETTE.goldDark, 'opacity="0.55"'));
    body.push(rect(40 + index * 34, 132, 24, 4, PALETTE.goldDark, 'opacity="0.4"'));
  }
  body.push(circle(112, 82, 10, PALETTE.gold, 'opacity="0.35"'));
  return svg(224, 160, body.join('\n'));
}

function throne(corrupted) {
  const body = [rect(0, 210, 160, 14, PALETTE.void, 'opacity="0.5"')];
  body.push(pathEl('M 34 210 L 46 44 L 114 44 L 126 210 Z', corrupted ? PALETTE.corruptionDark : PALETTE.stoneDark));
  body.push(pathEl('M 46 52 L 54 190 L 106 190 L 114 52 Z', corrupted ? '#233016' : PALETTE.stone));
  body.push(pathEl('M 60 20 L 80 2 L 100 20 L 80 34 Z', corrupted ? PALETTE.corruptionLight : PALETTE.goldLight));
  body.push(circle(80, 18, 7, PALETTE.void));
  for (let index = 0; index < 4; index += 1) {
    body.push(rect(56 + index * 14, 62, 3, 120, corrupted ? PALETTE.corruption : PALETTE.goldDark, 'opacity="0.7"'));
  }
  if (!corrupted) {
    body.push(rect(48, 196, 24, 16, PALETTE.stoneMid));
    body.push(rect(88, 196, 24, 16, PALETTE.stoneMid));
    body.push(pathEl('M 62 90 L 80 108 L 98 90', 'none', `stroke="${PALETTE.gold}" stroke-width="3" opacity="0.75"`));
  } else {
    body.push(roots(80, 210, 0.8, PALETTE.corruption, 19));
    body.push(pathEl('M 60 60 L 74 96 L 64 140 L 80 180', 'none', `stroke="${PALETTE.corruptionLight}" stroke-width="6" stroke-linecap="round" opacity="0.8"`));
    body.push(circle(80, 108, 6, PALETTE.bloomLight, 'opacity="0.9"'));
    body.push(circle(80, 108, 14, PALETTE.bloom, 'opacity="0.25"'));
  }
  return svg(160, 224, body.join('\n'));
}

function chain() {
  const body = [];
  for (let index = 0; index < 9; index += 1) {
    const yy = 12 + index * 26;
    body.push(`<ellipse cx="48" cy="${yy}" rx="12" ry="16" fill="none" stroke="${index % 2 === 0 ? PALETTE.goldDark : PALETTE.stoneLight}" stroke-width="4" transform="rotate(${index % 2 === 0 ? 18 : -18} 48 ${yy})" opacity="0.9"/>`);
  }
  body.push(circle(48, 250, 9, PALETTE.gold, 'opacity="0.5"'));
  return svg(96, 256, body.join('\n'));
}

function sigil(corrupted) {
  const body = [];
  body.push(circle(48, 48, 40, corrupted ? PALETTE.corruptionDark : PALETTE.stone, 'opacity="0.55"'));
  body.push(`<circle cx="48" cy="48" r="34" fill="none" stroke="${corrupted ? PALETTE.corruptionLight : PALETTE.gold}" stroke-width="3"/>`);
  body.push(rect(46, 20, 4, 56, corrupted ? PALETTE.bloomLight : PALETTE.goldLight));
  body.push(rect(24, 34, 48, 3, corrupted ? PALETTE.bloomLight : PALETTE.goldLight));
  body.push(pathEl('M 24 34 L 30 48 L 18 48 Z', corrupted ? PALETTE.bloom : PALETTE.gold));
  body.push(pathEl('M 72 34 L 78 48 L 66 48 Z', corrupted ? PALETTE.bloom : PALETTE.gold));
  body.push(circle(48, 26, 5, corrupted ? PALETTE.bloomLight : PALETTE.goldLight));
  body.push(circle(48, 60, 6, PALETTE.void, 'opacity="0.8"'));
  if (corrupted) {
    body.push(pathEl('M 48 60 L 40 76 L 48 88 L 56 76 Z', PALETTE.blood, 'opacity="0.75"'));
    body.push(circle(48, 60, 3, PALETTE.bloomLight));
  }
  return svg(96, 96, body.join('\n'));
}

function ledger() {
  const body = [];
  body.push(rect(8, 82, 144, 22, PALETTE.stoneDark));
  body.push(pathEl('M 18 82 L 26 34 L 134 34 L 142 82 Z', PALETTE.stone));
  body.push(rect(30, 40, 100, 38, PALETTE.ivory, 'opacity="0.9"'));
  body.push(rect(66, 40, 3, 38, PALETTE.goldDark));
  for (let index = 0; index < 4; index += 1) {
    body.push(rect(36, 46 + index * 8, 26, 2, PALETTE.stoneMid, 'opacity="0.7"'));
    body.push(rect(74, 46 + index * 8, 48, 2, PALETTE.stoneMid, 'opacity="0.7"'));
  }
  body.push(rect(28, 78, 104, 4, PALETTE.goldDark));
  body.push(circle(80, 26, 8, PALETTE.gold, 'opacity="0.5"'));
  return svg(160, 112, body.join('\n'));
}

function statue() {
  const body = [rect(0, 150, 96, 12, PALETTE.void, 'opacity="0.5"')];
  body.push(rect(22, 142, 52, 16, PALETTE.stoneDark));
  body.push(pathEl('M 30 142 L 36 66 L 60 66 L 66 142 Z', PALETTE.stoneMid));
  body.push(circle(48, 48, 16, PALETTE.stoneLight));
  body.push(pathEl('M 34 66 L 20 108 L 30 114 L 42 74 Z', PALETTE.stone));
  body.push(pathEl('M 62 66 L 76 108 L 66 114 L 54 74 Z', PALETTE.stone));
  body.push(rect(40, 44, 16, 5, PALETTE.void, 'opacity="0.75"'));
  body.push(rect(44, 30, 8, 10, PALETTE.stoneDark));
  body.push(pathEl('M 30 120 L 66 120', 'none', `stroke="${PALETTE.moss}" stroke-width="4" opacity="0.6"`));
  body.push(pathEl('M 22 146 L 32 126 L 40 146 Z', PALETTE.moss, 'opacity="0.7"'));
  return svg(96, 176, body.join('\n'));
}

function banner() {
  const body = [];
  body.push(rect(10, 6, 76, 6, PALETTE.goldDark));
  body.push(pathEl('M 18 12 L 78 12 L 78 132 L 66 148 L 54 132 L 42 148 L 30 132 L 18 148 Z', PALETTE.stoneDark));
  body.push(pathEl('M 30 22 L 66 22 L 62 118 L 48 110 L 34 118 Z', '#3b2a4e', 'opacity="0.9"'));
  body.push(circle(48, 54, 16, 'none', `stroke="${PALETTE.gold}" stroke-width="2" opacity="0.7"`));
  body.push(rect(47, 38, 2, 32, PALETTE.goldLight, 'opacity="0.7"'));
  body.push(pathEl('M 32 80 L 64 96 L 36 100 Z', PALETTE.blood, 'opacity="0.45"'));
  return svg(96, 176, body.join('\n'));
}

function canopy() {
  const body = [];
  for (let index = 0; index < 9; index += 1) {
    const cx = 20 + index * 28;
    const cy = 40 + (index % 3) * 22;
    body.push(circle(cx, cy, 34 + (index % 2) * 10, index % 2 === 0 ? '#1f2a22' : '#26332a', 'opacity="0.9"'));
  }
  body.push(pathEl('M 0 160 L 0 118 C 60 96 92 132 128 110 C 168 84 214 120 256 96 L 256 160 Z', '#141a18'));
  for (let index = 0; index < 7; index += 1) {
    body.push(pathEl(`M ${16 + index * 36} 122 C ${28 + index * 36} 96, ${4 + index * 36} 74, ${22 + index * 36} 48`, 'none', `stroke="#2e4634" stroke-width="6" stroke-linecap="round" opacity="0.85"`));
  }
  return svg(256, 160, body.join('\n'));
}

function glass() {
  const body = [];
  body.push(arch(8, 8, 112, 176, PALETTE.stoneDark, PALETTE.void));
  body.push(arch(20, 24, 88, 152, PALETTE.glass, '#1c3038'));
  body.push(rect(62, 24, 4, 152, PALETTE.void, 'opacity="0.8"'));
  body.push(rect(20, 92, 88, 4, PALETTE.void, 'opacity="0.8"'));
  body.push(circle(64, 70, 22, PALETTE.glassLight, 'opacity="0.4"'));
  body.push(pathEl('M 40 150 L 64 112 L 88 150 Z', PALETTE.goldLight, 'opacity="0.35"'));
  body.push(circle(64, 70, 8, PALETTE.goldLight, 'opacity="0.6"'));
  return svg(128, 192, body.join('\n'));
}

function rootMass() {
  const body = [];
  body.push(pathEl('M 16 176 C 26 120 54 104 48 64 C 44 34 84 22 112 38 C 144 56 140 100 168 116 C 194 130 206 158 196 176 Z', PALETTE.corruptionDark));
  body.push(roots(112, 176, 1.4, PALETTE.corruption, 31));
  body.push(pathEl('M 60 150 C 82 130 96 146 116 124 C 136 102 152 118 172 96', 'none', `stroke="${PALETTE.corruptionLight}" stroke-width="7" stroke-linecap="round" opacity="0.85"`));
  for (let index = 0; index < 6; index += 1) {
    body.push(circle(40 + index * 30, 96 + (index % 2) * 30, 4, PALETTE.bloomLight, 'opacity="0.8"'));
  }
  return svg(224, 176, body.join('\n'));
}

function rubble() {
  const body = [];
  for (let index = 0; index < 10; index += 1) {
    const x = 8 + index * 21;
    const y = 120 + (index % 3) * 18;
    body.push(pathEl(`M ${x} ${y + 40} L ${x + 12} ${y} L ${x + 30} ${y + 12} L ${x + 24} ${y + 40} Z`, index % 2 === 0 ? PALETTE.stone : PALETTE.stoneMid));
  }
  body.push(pathEl('M 20 160 L 44 108 L 52 160 Z', PALETTE.stoneDark));
  body.push(pathEl('M 150 160 L 176 96 L 190 160 Z', PALETTE.stoneDark));
  body.push(pathEl('M 60 150 C 80 132 92 144 108 128', 'none', `stroke="${PALETTE.moss}" stroke-width="5" opacity="0.6"`));
  return svg(224, 176, body.join('\n'));
}

/* --------------------------------------------------------------- credor -- */

const BOSS_W = 128;
const BOSS_H = 114;
const BOSS_COLUMNS = 4;
const BOSS_ROWS = 3;

function crc32(buffer) {
  let crc = 0xffffffff;
  for (let index = 0; index < buffer.length; index += 1) {
    crc ^= buffer[index];
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])), 0);
  return Buffer.concat([length, typeBytes, data, crc]);
}

function encodePng(width, height, pixels) {
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (stride + 1)] = 0;
    pixels.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const rgb = (hex) => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16),
];

function canvas(width, height) {
  const pixels = Buffer.alloc(width * height * 4);
  const put = (x, y, color, alpha = 255) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const index = (y * width + x) * 4;
    const [r, g, b] = rgb(color);
    if (alpha >= 255) {
      pixels[index] = r; pixels[index + 1] = g; pixels[index + 2] = b; pixels[index + 3] = 255;
      return;
    }
    const a = alpha / 255;
    pixels[index] = Math.round(pixels[index] * (1 - a) + r * a);
    pixels[index + 1] = Math.round(pixels[index + 1] * (1 - a) + g * a);
    pixels[index + 2] = Math.round(pixels[index + 2] * (1 - a) + b * a);
    pixels[index + 3] = Math.max(pixels[index + 3], alpha);
  };
  return { width, height, pixels, put };
}

function fillRect(target, x, y, w, h, color, alpha = 255) {
  for (let yy = y; yy < y + h; yy += 1) for (let xx = x; xx < x + w; xx += 1) target.put(xx, yy, color, alpha);
}

function fillEllipse(target, cx, cy, rx, ry, color, alpha = 255) {
  for (let yy = -ry; yy <= ry; yy += 1) {
    for (let xx = -rx; xx <= rx; xx += 1) {
      if ((xx * xx) / (rx * rx) + (yy * yy) / (ry * ry) <= 1) target.put(cx + xx, cy + yy, color, alpha);
    }
  }
}

function stroke(target, x0, y0, x1, y1, color, width = 1, alpha = 255) {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let step = 0; step <= steps; step += 1) {
    const x = Math.round(x0 + (x1 - x0) * (step / steps));
    const y = Math.round(y0 + (y1 - y0) * (step / steps));
    fillRect(target, x - Math.floor(width / 2), y - Math.floor(width / 2), width, width, color, alpha);
  }
}

/**
 * Desenha um quadro do Credor. O corpo é uma silhueta alta de manto, máscara
 * marfim, coroa de raízes e balança-corrente. Cada quadro desloca membros e
 * brilho para produzir caminhada, ataque e dano legíveis.
 */
function drawCredorFrame(sheet, originX, originY, pose) {
  const target = canvas(BOSS_W, BOSS_H);
  const cx = 64;
  const lean = pose.lean;
  const bob = pose.bob;
  const hem = pose.hem;
  const armSwing = pose.armSwing;
  const glow = pose.glow;

  // Sombra de contato.
  fillEllipse(target, cx, originY + 108, 34, 5, '#0b0710', 150);

  // Manto.
  for (let y = 34; y <= 106; y += 1) {
    const t = (y - 34) / 72;
    const half = 20 + t * 30 + hem;
    const shift = Math.round(lean * (1 - t));
    fillRect(target, cx - half + shift, y + bob, half * 2, 1, y > 88 ? '#1b1426' : '#241a33');
  }
  // Dobras do manto.
  for (let index = -3; index <= 3; index += 1) {
    stroke(target, cx + index * 9 + lean, 44 + bob, cx + index * 11, 104 + bob, '#150f20', 2, 220);
  }
  // Barra de ouro.
  fillRect(target, cx - 48 + Math.round(lean), 96 + bob, 96, 3, '#8f6a2e', 230);
  fillRect(target, cx - 44 + Math.round(lean), 99 + bob, 88, 1, '#e0bf7c', 180);

  // Ombros e gola.
  fillEllipse(target, cx + lean, 42 + bob, 30, 10, '#2f2342');
  fillRect(target, cx - 26 + lean, 34 + bob, 52, 6, '#3a2b50');
  // Coroa de raízes.
  for (let index = -4; index <= 4; index += 1) {
    const baseX = cx + index * 6 + lean;
    const tipX = cx + index * 9 + lean;
    const tipY = 6 + bob + Math.abs(index) * 2;
    stroke(target, baseX, 22 + bob, tipX, tipY, index % 2 === 0 ? '#5d4426' : '#7a5a2d', 2, 255);
  }

  // Cabeça e máscara.
  fillEllipse(target, cx + lean, 22 + bob, 15, 17, '#c9b98f');
  fillEllipse(target, cx + lean, 24 + bob, 12, 14, '#e7dcc4');
  fillRect(target, cx - 7 + lean, 20 + bob, 14, 4, '#2a1f38');
  // Olhos.
  const eye = glow > 1 ? '#f7df8a' : '#c99a3e';
  fillRect(target, cx - 8 + lean, 24 + bob, 5, 2, eye);
  fillRect(target, cx + 3 + lean, 24 + bob, 5, 2, eye);
  if (glow > 1.4) {
    fillRect(target, cx - 10 + lean, 23 + bob, 9, 4, '#f7df8a', 90);
    fillRect(target, cx + 1 + lean, 23 + bob, 9, 4, '#f7df8a', 90);
  }
  // Fenda vertical da máscara.
  fillRect(target, cx + lean, 26 + bob, 2, 8, '#5b4a6a');
  if (pose.crack) {
    stroke(target, cx - 10 + lean, 12 + bob, cx - 2 + lean, 30 + bob, '#5b4a6a', 1, 220);
    stroke(target, cx + 8 + lean, 10 + bob, cx + 4 + lean, 22 + bob, '#5b4a6a', 1, 180);
  }

  // Braço esquerdo e corrente.
  const lx0 = cx - 24 + lean;
  const ly0 = 46 + bob;
  const lx1 = cx - 34 + lean + armSwing;
  const ly1 = 74 + bob + pose.chainDrop;
  stroke(target, lx0, ly0, lx1, ly1, '#2a1e3a', 5);
  fillEllipse(target, lx1, ly1 + 2, 5, 5, '#c9b98f');
  let chainX = lx1;
  let chainY = ly1 + 8;
  for (let link = 0; link < pose.chainLinks; link += 1) {
    fillEllipse(target, chainX, chainY, 3, 4, link % 2 === 0 ? '#8f6a2e' : '#5b4a6a');
    chainY += 7;
    chainX += link % 2 === 0 ? 1 : -1;
  }
  fillEllipse(target, chainX, chainY + 2, 5, 5, '#b58a3f');
  fillRect(target, chainX - 2, chainY + 1, 4, 2, '#120d18');

  // Braço direito e balança.
  const rx0 = cx + 24 + lean;
  const ry0 = 46 + bob;
  const rx1 = cx + 38 + lean - armSwing;
  const ry1 = 66 + bob - pose.raise;
  stroke(target, rx0, ry0, rx1, ry1, '#2a1e3a', 5);
  fillEllipse(target, rx1, ry1, 5, 5, '#c9b98f');
  const staffTop = ry1 - 26 - pose.raise;
  stroke(target, rx1, ry1 + 36, rx1, staffTop, '#6f5327', 3);
  fillRect(target, rx1 - 12, staffTop + 4, 24, 2, '#b58a3f');
  fillRect(target, rx1 - 14, staffTop + 16, 28, 2, '#8f6a2e');
  stroke(target, rx1 - 12, staffTop + 4, rx1 - 12, staffTop + 14, '#8f6a2e', 1);
  stroke(target, rx1 + 12, staffTop + 4, rx1 + 12, staffTop + 14, '#8f6a2e', 1);
  fillEllipse(target, rx1, staffTop + 2, 4, 4, glow > 1 ? '#f7df8a' : '#b58a3f');

  // Aura de dívida no ataque.
  if (pose.aura) {
    for (let index = 0; index < 10; index += 1) {
      const angle = (index / 10) * Math.PI * 2;
      const x = cx + Math.cos(angle) * 46;
      const y = 64 + bob + Math.sin(angle) * 40;
      fillRect(target, Math.round(x), Math.round(y), 2, 2, '#a6c44e', 150);
    }
  }

  // Recorta o quadro local para a célula correta da folha.
  for (let y = 0; y < BOSS_H; y += 1) {
    for (let x = 0; x < BOSS_W; x += 1) {
      const source = (y * BOSS_W + x) * 4;
      if (target.pixels[source + 3] === 0) continue;
      const destination = ((originY + y) * sheet.width + originX + x) * 4;
      sheet.pixels[destination] = target.pixels[source];
      sheet.pixels[destination + 1] = target.pixels[source + 1];
      sheet.pixels[destination + 2] = target.pixels[source + 2];
      sheet.pixels[destination + 3] = target.pixels[source + 3];
    }
  }
}

function credorSheet() {
  const sheet = canvas(BOSS_W * BOSS_COLUMNS, BOSS_H * BOSS_ROWS);
  const poses = [
    // Caminhada 0-3.
    { lean: 0, bob: 0, hem: 0, armSwing: 0, chainDrop: 0, chainLinks: 3, raise: 0, glow: 1, crack: false, aura: false },
    { lean: -1, bob: -1, hem: 1, armSwing: -2, chainDrop: 1, chainLinks: 3, raise: 0, glow: 1, crack: false, aura: false },
    { lean: 0, bob: 0, hem: 0, armSwing: 0, chainDrop: 0, chainLinks: 3, raise: 0, glow: 1, crack: false, aura: false },
    { lean: 1, bob: -1, hem: 1, armSwing: 2, chainDrop: 1, chainLinks: 3, raise: 0, glow: 1, crack: false, aura: false },
    // Ataque 4-7.
    { lean: -2, bob: -2, hem: 1, armSwing: -4, chainDrop: -4, chainLinks: 5, raise: 8, glow: 2, crack: false, aura: false },
    { lean: -3, bob: -2, hem: 2, armSwing: -8, chainDrop: -8, chainLinks: 7, raise: 14, glow: 2, crack: false, aura: true },
    { lean: -2, bob: -1, hem: 1, armSwing: -6, chainDrop: -4, chainLinks: 6, raise: 10, glow: 2, crack: false, aura: true },
    { lean: 0, bob: 0, hem: 1, armSwing: -1, chainDrop: 0, chainLinks: 4, raise: 4, glow: 1, crack: false, aura: false },
    // Dano 8-11.
    { lean: 4, bob: -1, hem: 2, armSwing: 6, chainDrop: 3, chainLinks: 3, raise: -2, glow: 1, crack: true, aura: false },
    { lean: 5, bob: -2, hem: 3, armSwing: 9, chainDrop: 6, chainLinks: 2, raise: -4, glow: 0, crack: true, aura: false },
    { lean: 4, bob: -1, hem: 2, armSwing: 7, chainDrop: 4, chainLinks: 3, raise: -2, glow: 1, crack: true, aura: false },
    { lean: 3, bob: 0, hem: 1, armSwing: 4, chainDrop: 2, chainLinks: 3, raise: 0, glow: 1, crack: true, aura: false },
  ];
  poses.forEach((pose, index) => {
    const column = index % BOSS_COLUMNS;
    const row = Math.floor(index / BOSS_COLUMNS);
    drawCredorFrame(sheet, column * BOSS_W, row * BOSS_H, pose);
  });
  return encodePng(sheet.width, sheet.height, sheet.pixels);
}

/* ----------------------------------------------------------------- main -- */

const ASSETS = [
  ['palacio-floor-decayed.svg', () => floorFrame('#3b3048', '#241d31', '#8f7aa0', 1)],
  ['palacio-floor-corrupted.svg', () => floorFrame('#2b2126', '#160f14', '#7f9440', 2)],
  ['palacio-gate.svg', () => gate(false)],
  ['palacio-gate-corrupted.svg', () => gate(true)],
  ['palacio-tower.svg', () => tower(false)],
  ['palacio-tower-corrupted.svg', () => tower(true)],
  ['palacio-arcade.svg', () => arcade(false)],
  ['palacio-arcade-corrupted.svg', () => arcade(true)],
  ['palacio-dais.svg', () => dais()],
  ['palacio-throne.svg', () => throne(false)],
  ['palacio-throne-corrupted.svg', () => throne(true)],
  ['palacio-chain.svg', () => chain()],
  ['palacio-sigil.svg', () => sigil(false)],
  ['palacio-sigil-corrupted.svg', () => sigil(true)],
  ['palacio-ledger.svg', () => ledger()],
  ['palacio-statue.svg', () => statue()],
  ['palacio-banner.svg', () => banner()],
  ['palacio-canopy.svg', () => canopy()],
  ['palacio-glass.svg', () => glass()],
  ['palacio-root-mass.svg', () => rootMass()],
  ['palacio-rubble.svg', () => rubble()],
];

function main() {
  fs.mkdirSync(DIRECTORY, { recursive: true });
  for (const [name, render] of ASSETS) {
    const content = render();
    fs.writeFileSync(path.join(DIRECTORY, name), content, 'utf8');
  }
  fs.writeFileSync(path.join(DIRECTORY, 'credor-sheet.png'), credorSheet());
  console.log(`generated ${ASSETS.length} SVG files and credor-sheet.png`);
  for (const name of [...ASSETS.map(([asset]) => asset), 'credor-sheet.png']) {
    const data = fs.readFileSync(path.join(DIRECTORY, name));
    console.log(`${name} ${data.length} ${crypto.createHash('sha256').update(data).digest('hex')}`);
  }
}

main();
