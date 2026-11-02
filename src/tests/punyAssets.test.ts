import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import {
  PUNY_ANIMATIONS,
  PUNY_ASSET_ORIGINS,
  PUNY_SOURCE_FILES,
  PUNY_TEXTURE_ASSETS,
} from '../presentation/assets/punyAssetCatalog';
import { AGUAS_VISUAL_RESOURCES } from '../stages';

const root = process.cwd();
const punyRoot = path.join(root, 'src', 'assets', 'puny');

function readPngDimensions(file: string): { width: number; height: number } {
  const buffer = fs.readFileSync(file);
  expect(buffer.subarray(1, 4).toString('ascii')).toBe('PNG');
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function sha256(file: string): string {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

/** Reads an 8-bit RGBA PNG written by the deterministic derived-sheet generator. */
function readRgba(file: string): { width: number; height: number; pixels: Buffer } {
  const buffer = fs.readFileSync(file);
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  const chunks: Buffer[] = [];
  let offset = 8;
  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.subarray(offset + 4, offset + 8).toString('ascii');
    if (type === 'IDAT') chunks.push(buffer.subarray(offset + 8, offset + 8 + length));
    if (type === 'IEND') break;
    offset += 12 + length;
  }
  const raw = zlib.inflateSync(Buffer.concat(chunks));
  const stride = width * 4;
  const pixels = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    expect(raw[y * (stride + 1)]).toBe(0);
    raw.copy(pixels, y * stride, y * (stride + 1) + 1, (y + 1) * (stride + 1));
  }
  return { width, height, pixels };
}

function alphaBounds(
  image: { width: number; height: number; pixels: Buffer },
  originX: number,
  originY: number,
  width: number,
  height: number,
): { minX: number; minY: number; maxX: number; maxY: number } {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = image.pixels[((originY + y) * image.width + originX + x) * 4 + 3];
      if (alpha <= 8) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  return { minX, minY, maxX, maxY };
}

describe('Puny asset pipeline', () => {
  it('documents verifiable CC0 provenance and local files', () => {
    Object.values(PUNY_ASSET_ORIGINS).forEach(origin => {
      expect(origin.author).toBe('Shade');
      expect(origin.license).toBe('CC0');
      expect(origin.sourceUrl).toMatch(/^https:\/\/opengameart\.org\/content\//);
      expect(origin.notes.length).toBeGreaterThan(0);
    });
    PUNY_SOURCE_FILES.forEach(source => {
      expect(source.sha256).toMatch(/^[0-9a-f]{64}$/);
      expect(source.width).toBeGreaterThan(0);
      expect(source.height).toBeGreaterThan(0);
    });
    const readme = fs.readFileSync(path.join(punyRoot, 'README.md'), 'utf8');
    expect(readme).toContain('CC0');
    expect(readme).toContain('Shade');
    expect(readme).toContain('https://opengameart.org/content/16x16-puny-world-tileset');
    expect(readme).toContain('https://opengameart.org/content/puny-characters');
  });

  it('contains every declared local texture with declared dimensions and hashes', () => {
    PUNY_TEXTURE_ASSETS.forEach(asset => {
      const file = path.join(punyRoot, asset.fileName);
      expect(fs.existsSync(file)).toBe(true);
      const dimensions = readPngDimensions(file);
      if (asset.kind === 'spritesheet') {
        expect(dimensions.width % asset.frameWidth).toBe(0);
        expect(dimensions.height % asset.frameHeight).toBe(0);
        const computedFrames = (dimensions.width / asset.frameWidth) *
          (dimensions.height / asset.frameHeight);
        expect(computedFrames).toBe(asset.frameCount);
      }
    });
    const expectedDerived = {
      'puny-warrior-red-128.png': '7c37bdce12b6eca0076a6b456daeac0ff7557e275254bd5c1456a169a8c10816',
      'puny-archer-purple-128.png': '6cea72e2f9df9cb0e00a8da7b44363d32a6478e9bdd5e4af81798794489eccc1',
    };
    Object.entries(expectedDerived).forEach(([file, hash]) => {
      expect(sha256(path.join(punyRoot, file))).toBe(hash);
    });
    PUNY_SOURCE_FILES.forEach(source => {
      const incorporated = PUNY_TEXTURE_ASSETS.find(asset =>
        asset.sourceFileId === source.id && asset.modifications.every(item => item.includes('without pixel')));
      if (!incorporated) return;
      expect(sha256(path.join(punyRoot, incorporated.fileName))).toBe(source.sha256);
    });
  });

  it('keeps every derived frame inside its own cell without neighbouring fragments', () => {
    const script = path.join(root, 'scripts', 'generate-puny-character-sheets.mjs');
    expect(fs.existsSync(script)).toBe(true);
    ['puny-warrior-red-128.png', 'puny-archer-purple-128.png'].forEach(file => {
      const image = readRgba(path.join(punyRoot, file));
      expect(image.width).toBe(512);
      expect(image.height).toBe(342);
      const rowBounds: Array<{ minX: number; maxX: number }> = [];
      for (let row = 0; row < 3; row += 1) {
        for (let column = 0; column < 4; column += 1) {
          const bounds = alphaBounds(image, column * 128, row * 114, 128, 114);
          // A single character never reaches the cell border; the old manual
          // derivation filled an entire cell and bled into its neighbours.
          expect(bounds.minX).toBeGreaterThan(4);
          expect(bounds.maxX).toBeLessThan(123);
          expect(bounds.minY).toBeGreaterThanOrEqual(0);
          expect(bounds.maxY).toBeLessThanOrEqual(113);
          expect(bounds.maxX - bounds.minX).toBeLessThan(100);
          expect(bounds.maxY - bounds.minY).toBeGreaterThan(60);
          rowBounds.push({ minX: bounds.minX, maxX: bounds.maxX });
        }
      }
      // Repeated walk pose frames keep the same horizontal silhouette.
      expect(Math.max(...rowBounds.slice(0, 4).map(item => item.minX)) -
        Math.min(...rowBounds.slice(0, 4).map(item => item.minX))).toBeLessThanOrEqual(1);
      expect(Math.max(...rowBounds.slice(0, 4).map(item => item.maxX)) -
        Math.min(...rowBounds.slice(0, 4).map(item => item.maxX))).toBeLessThanOrEqual(6);
    });
  });

  it('declares unique texture keys and valid animation frames', () => {
    const keys = PUNY_TEXTURE_ASSETS.map(asset => asset.textureKey);
    expect(new Set(keys).size).toBe(keys.length);
    PUNY_TEXTURE_ASSETS.forEach(asset => {
      expect(asset.frameCount).toBeGreaterThan(0);
      expect(asset.frameWidth).toBeGreaterThan(0);
      expect(asset.frameHeight).toBeGreaterThan(0);
    });
    PUNY_ANIMATIONS.forEach(animation => {
      const texture = PUNY_TEXTURE_ASSETS.find(asset => asset.textureKey === animation.textureKey);
      expect(texture).toBeDefined();
      animation.frames.forEach(frame => {
        expect(frame).toBeGreaterThanOrEqual(0);
        expect(frame).toBeLessThan(texture?.frameCount ?? 0);
      });
      expect(new Set(animation.frames).size).toBe(animation.frames.length);
    });
  });

  it('keeps every Igapó tile, decoration and sprite frame inside its declared sheet', () => {
    const textures = new Map(AGUAS_VISUAL_RESOURCES.textures.map(texture => [texture.id, texture]));
    const assertFrame = (textureId: string, frame: number | undefined): void => {
      const texture = textures.get(textureId);
      expect(texture).toBeDefined();
      if (frame === undefined) return;
      expect(Number.isInteger(frame)).toBe(true);
      expect(frame).toBeGreaterThanOrEqual(0);
      expect(frame).toBeLessThan(texture?.frameCount ?? 0);
    };
    AGUAS_VISUAL_RESOURCES.tilesets.forEach(tileset => {
      Object.values(tileset.tiles).forEach(tile => {
        assertFrame(tile.textureId, tile.frame);
        tile.variants?.forEach(variant => assertFrame(variant.textureId, variant.frame));
      });
    });
    AGUAS_VISUAL_RESOURCES.decorations?.forEach(decoration =>
      assertFrame(decoration.textureId, decoration.frame));
    AGUAS_VISUAL_RESOURCES.sprites?.forEach(sprite => assertFrame(sprite.textureId, sprite.frame));
  });

  it('does not import complete asset archives into the project', () => {
    const files = fs.readdirSync(punyRoot).filter(file => !file.endsWith('.md'));
    expect(files.every(file => file.endsWith('.png'))).toBe(true);
    expect(files.length).toBeLessThanOrEqual(6);
  });
});
