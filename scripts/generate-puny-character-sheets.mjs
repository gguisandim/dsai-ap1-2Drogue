#!/usr/bin/env node
/**
 * Regenerates the derived 128x114 character sheets from the pristine Puny
 * Characters source files. The entity contract (4 columns x 3 rows, frames
 * 0-3 walk, 4-7 attack, 8-11 hurt) is preserved.
 *
 * The previous manual derivation cropped a scaled strip, so each frame
 * contained fragments of neighbouring characters. This generator instead
 * samples one 32x32 source cell at a time with a fixed crop and a fixed
 * integer scale, which keeps every directional frame aligned, undeformed and
 * free of neighbouring pixels.
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT_WIDTH = 128;
const OUTPUT_HEIGHT = 114;
const COLUMNS = 4;
const ROWS = 3;
const SOURCE_CELL = 32;
const CROP = Object.freeze({ x: 5, y: 5, size: 21 });
const SCALE = 6;
const DESTINATION = Object.freeze({ x: 1, y: 0 });

const CHARACTERS = Object.freeze([
  Object.freeze({
    source: 'puny-warrior-red.png',
    output: 'puny-warrior-red-128.png',
    attackRow: 2,
  }),
  Object.freeze({
    source: 'puny-archer-purple.png',
    output: 'puny-archer-purple-128.png',
    attackRow: 3,
  }),
]);

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
  header[10] = 0;
  header[11] = 0;
  header[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function getPixel(source, x, y) {
  if (x < 0 || y < 0 || x >= source.width || y >= source.height) return [0, 0, 0, 0];
  const index = (y * source.width + x) * 4;
  return [
    source.pixels[index],
    source.pixels[index + 1],
    source.pixels[index + 2],
    source.pixels[index + 3],
  ];
}

function renderDerivedSheet(source, attackRow) {
  const sheet = Buffer.alloc(OUTPUT_WIDTH * COLUMNS * OUTPUT_HEIGHT * ROWS * 4);
  const animationRows = [1, attackRow, 6];
  animationRows.forEach((sourceRow, outputRow) => {
    const sourceFrames = [0, 1, 2, 1];
    sourceFrames.forEach((sourceColumn, outputColumn) => {
      const originX = outputColumn * OUTPUT_WIDTH + DESTINATION.x;
      const originY = outputRow * OUTPUT_HEIGHT + DESTINATION.y;
      for (let scaledY = 0; scaledY < CROP.size * SCALE; scaledY += 1) {
        for (let scaledX = 0; scaledX < CROP.size * SCALE; scaledX += 1) {
          const [red, green, blue, alpha] = getPixel(
            source,
            sourceColumn * SOURCE_CELL + CROP.x + Math.floor(scaledX / SCALE),
            sourceRow * SOURCE_CELL + CROP.y + Math.floor(scaledY / SCALE),
          );
          const targetX = originX + scaledX;
          const targetY = originY + scaledY;
          const index = (targetY * OUTPUT_WIDTH * COLUMNS + targetX) * 4;
          sheet[index] = red;
          sheet[index + 1] = green;
          sheet[index + 2] = blue;
          sheet[index + 3] = alpha;
        }
      }
    });
  });
  return encodePng(OUTPUT_WIDTH * COLUMNS, OUTPUT_HEIGHT * ROWS, sheet);
}

function main() {
  const directory = path.join(ROOT, 'src', 'assets', 'puny');
  CHARACTERS.forEach(character => {
    const source = decodePng(path.join(directory, character.source));
    const derived = renderDerivedSheet(source, character.attackRow);
    fs.writeFileSync(path.join(directory, character.output), derived);
    console.log(`generated ${character.output} (${derived.length} bytes)`);
  });
}

main();
