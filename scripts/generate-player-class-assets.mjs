#!/usr/bin/env node
/**
 * Normalizes the authored ImageGen sources into the player contracts already
 * consumed by Phaser. Runtime sheets remain 4x3 cells of 128x114; portraits
 * are deterministic 384x384 derivatives of the first frame.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIRECTORY = path.join(ROOT, 'src', 'assets', 'player-classes');
const FRAME_WIDTH = 128;
const FRAME_HEIGHT = 114;
const COLUMNS = 4;
const ROWS = 3;

const CHARACTERS = Object.freeze([
  'knight_woman', 'knight_man',
  'mage_woman', 'mage_man',
  'ranger_woman', 'ranger_man',
  'rogue_woman', 'rogue_man',
]);

const AIM_BODIES = Object.freeze(['ranger_woman_aim_body', 'ranger_man_aim_body']);

function crc32(buffer) {
  let crc = 0xffffffff;
  for (let index = 0; index < buffer.length; index += 1) {
    crc ^= buffer[index];
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
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

function paeth(left, above, upperLeft) {
  const estimate = left + above - upperLeft;
  const leftDistance = Math.abs(estimate - left);
  const aboveDistance = Math.abs(estimate - above);
  const upperLeftDistance = Math.abs(estimate - upperLeft);
  if (leftDistance <= aboveDistance && leftDistance <= upperLeftDistance) return left;
  return aboveDistance <= upperLeftDistance ? above : upperLeft;
}

function decodePng(file) {
  const buffer = fs.readFileSync(file);
  if (buffer.subarray(1, 4).toString('ascii') !== 'PNG') throw new Error(`Not a PNG: ${file}`);
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  let interlace = 0;
  const data = [];
  let offset = 8;
  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.subarray(offset + 4, offset + 8).toString('ascii');
    const body = buffer.subarray(offset + 8, offset + 8 + length);
    if (type === 'IHDR') {
      width = body.readUInt32BE(0);
      height = body.readUInt32BE(4);
      bitDepth = body[8];
      colorType = body[9];
      interlace = body[12];
    } else if (type === 'IDAT') {
      data.push(body);
    } else if (type === 'IEND') break;
    offset += 12 + length;
  }
  if (bitDepth !== 8 || colorType !== 6 || interlace !== 0) {
    throw new Error(`Unsupported PNG layout in ${file}: bit=${bitDepth} color=${colorType} interlace=${interlace}`);
  }
  const raw = zlib.inflateSync(Buffer.concat(data));
  const bytesPerPixel = 4;
  const stride = width * bytesPerPixel;
  const pixels = Buffer.alloc(width * height * bytesPerPixel);
  let position = 0;
  for (let y = 0; y < height; y += 1) {
    const filter = raw[position];
    position += 1;
    const line = raw.subarray(position, position + stride);
    position += stride;
    const target = y * stride;
    const previous = target - stride;
    for (let x = 0; x < stride; x += 1) {
      const left = x >= bytesPerPixel ? pixels[target + x - bytesPerPixel] : 0;
      const above = y > 0 ? pixels[previous + x] : 0;
      const upperLeft = y > 0 && x >= bytesPerPixel ? pixels[previous + x - bytesPerPixel] : 0;
      let value = line[x];
      if (filter === 1) value += left;
      else if (filter === 2) value += above;
      else if (filter === 3) value += (left + above) >> 1;
      else if (filter === 4) value += paeth(left, above, upperLeft);
      else if (filter !== 0) throw new Error(`Unsupported PNG filter ${filter} in ${file}`);
      pixels[target + x] = value & 0xff;
    }
  }
  return { width, height, pixels };
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

function sourcePixel(source, x, y) {
  const safeX = Math.max(0, Math.min(source.width - 1, x));
  const safeY = Math.max(0, Math.min(source.height - 1, y));
  const index = (safeY * source.width + safeX) * 4;
  return source.pixels.subarray(index, index + 4);
}

function isChromaArtifact(red, green, blue) {
  return (red > 180 && green < 85 && blue < 90) ||
    (green > 185 && red < 80 && blue < 100) ||
    (blue > 185 && red < 90 && green < 150) ||
    (red > 220 && green > 220 && blue < 50);
}

function writePixel(target, width, x, y, rgba) {
  const index = (y * width + x) * 4;
  const artifact = isChromaArtifact(rgba[0], rgba[1], rgba[2]);
  target[index] = rgba[0];
  target[index + 1] = rgba[1];
  target[index + 2] = rgba[2];
  target[index + 3] = rgba[3] < 10 || artifact ? 0 : rgba[3];
}

function resizeRegion(source, bounds, width, height) {
  const pixels = Buffer.alloc(width * height * 4);
  const spanX = Math.max(1, bounds.x1 - bounds.x0);
  const spanY = Math.max(1, bounds.y1 - bounds.y0);
  for (let y = 0; y < height; y += 1) {
    const sourceY = Math.min(bounds.y1 - 1, bounds.y0 + Math.floor((y + 0.5) * spanY / height));
    for (let x = 0; x < width; x += 1) {
      const sourceX = Math.min(bounds.x1 - 1, bounds.x0 + Math.floor((x + 0.5) * spanX / width));
      writePixel(pixels, width, x, y, sourcePixel(source, sourceX, sourceY));
    }
  }
  return pixels;
}

function renderSheet(source) {
  const width = FRAME_WIDTH * COLUMNS;
  const height = FRAME_HEIGHT * ROWS;
  const pixels = Buffer.alloc(width * height * 4);
  for (let row = 0; row < ROWS; row += 1) {
    for (let column = 0; column < COLUMNS; column += 1) {
      const cell = resizeRegion(source, {
        x0: Math.round(column * source.width / COLUMNS),
        y0: Math.round(row * source.height / ROWS),
        x1: Math.round((column + 1) * source.width / COLUMNS),
        y1: Math.round((row + 1) * source.height / ROWS),
      }, FRAME_WIDTH, FRAME_HEIGHT);
      for (let y = 0; y < FRAME_HEIGHT; y += 1) {
        const sourceStart = y * FRAME_WIDTH * 4;
        const targetStart = ((row * FRAME_HEIGHT + y) * width + column * FRAME_WIDTH) * 4;
        cell.copy(pixels, targetStart, sourceStart, sourceStart + FRAME_WIDTH * 4);
      }
    }
  }
  return { width, height, pixels };
}

function renderPortrait(sheet) {
  const width = 384;
  const height = 384;
  const pixels = Buffer.alloc(width * height * 4);
  const offsetY = 21;
  for (let y = 0; y < FRAME_HEIGHT; y += 1) {
    for (let x = 0; x < FRAME_WIDTH; x += 1) {
      const rgba = sheet.pixels.subarray((y * sheet.width + x) * 4, (y * sheet.width + x) * 4 + 4);
      for (let scaleY = 0; scaleY < 3; scaleY += 1) {
        for (let scaleX = 0; scaleX < 3; scaleX += 1) {
          writePixel(pixels, width, x * 3 + scaleX, offsetY + y * 3 + scaleY, rgba);
        }
      }
    }
  }
  return { width, height, pixels };
}

function alphaBounds(source) {
  let minX = source.width;
  let minY = source.height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < source.height; y += 1) {
    for (let x = 0; x < source.width; x += 1) {
      if (source.pixels[(y * source.width + x) * 4 + 3] < 16) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  if (maxX < minX || maxY < minY) throw new Error('Generated aim body contains no visible pixels.');
  return { x0: minX, y0: minY, x1: maxX + 1, y1: maxY + 1 };
}

function renderAimBody(source) {
  const bounds = alphaBounds(source);
  const sourceWidth = bounds.x1 - bounds.x0;
  const sourceHeight = bounds.y1 - bounds.y0;
  const scale = Math.min(88 / sourceWidth, 102 / sourceHeight);
  const width = Math.max(1, Math.round(sourceWidth * scale));
  const height = Math.max(1, Math.round(sourceHeight * scale));
  const resized = resizeRegion(source, bounds, width, height);
  const pixels = Buffer.alloc(FRAME_WIDTH * FRAME_HEIGHT * 4);
  const offsetX = Math.round((FRAME_WIDTH - width) / 2);
  const offsetY = 110 - height;
  for (let y = 0; y < height; y += 1) {
    resized.copy(pixels, ((offsetY + y) * FRAME_WIDTH + offsetX) * 4,
      y * width * 4, (y + 1) * width * 4);
  }
  return { width: FRAME_WIDTH, height: FRAME_HEIGHT, pixels };
}

function writeAsset(fileName, image) {
  const encoded = encodePng(image.width, image.height, image.pixels);
  const file = path.join(DIRECTORY, fileName);
  fs.writeFileSync(file, encoded);
  const digest = crypto.createHash('sha256').update(encoded).digest('hex');
  console.log(`${fileName}\t${image.width}x${image.height}\t${digest}`);
}

function main() {
  CHARACTERS.forEach(character => {
    const source = decodePng(path.join(DIRECTORY, `${character}-source.png`));
    const sheet = renderSheet(source);
    writeAsset(`${character}.png`, sheet);
    writeAsset(`${character}-portrait.png`, renderPortrait(sheet));
  });
  AIM_BODIES.forEach(name => {
    const source = decodePng(path.join(DIRECTORY, `${name}-source.png`));
    writeAsset(`${name}.png`, renderAimBody(source));
  });
}

main();
