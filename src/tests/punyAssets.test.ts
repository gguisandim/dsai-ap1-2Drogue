import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
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
      'puny-warrior-red-128.png': 'dd059ea7631c85590447ff0e6335a0ca7a941e2deab221e0a03ca1dd453acc43',
      'puny-archer-purple-128.png': '41b682336ef3484240640d328656a5f192c60e4dd636fbeb9577a173fbbf8c0b',
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
