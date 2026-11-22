import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { CLASS_DATABASE, PLAYER_CLASS_ORDER } from '../data/ClassDatabase';
import {
  PLAYER_CLASS_AIM_BODY_ASSETS,
  PLAYER_CLASS_VISUAL_ASSETS,
} from '../presentation/assets/playerClassAssetCatalog';

const root = process.cwd();
const assetRoot = path.join(root, 'src', 'assets', 'player-classes');

function dimensions(file: string): { width: number; height: number } {
  const buffer = fs.readFileSync(file);
  expect(buffer.subarray(1, 4).toString('ascii')).toBe('PNG');
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

function sha256(file: string): string {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

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

function framePixels(
  image: { width: number; height: number; pixels: Buffer },
  column: number,
  row: number,
): Buffer {
  const frame = Buffer.alloc(128 * 114 * 4);
  for (let y = 0; y < 114; y += 1) {
    const sourceStart = (((row * 114) + y) * image.width + column * 128) * 4;
    image.pixels.copy(frame, y * 128 * 4, sourceStart, sourceStart + 128 * 4);
  }
  return frame;
}

function visiblePixels(pixels: Buffer): number {
  let visible = 0;
  for (let index = 3; index < pixels.length; index += 4) {
    if (pixels[index] > 8) visible += 1;
  }
  return visible;
}

describe('authored Amazonian player-class assets', () => {
  it('keeps two visual variants for every stable class id with unique public keys', () => {
    expect(PLAYER_CLASS_VISUAL_ASSETS).toHaveLength(8);
    PLAYER_CLASS_ORDER.forEach(classId => {
      expect(PLAYER_CLASS_VISUAL_ASSETS.filter(asset => asset.classId === classId)
        .map(asset => asset.gender).sort()).toEqual(['man', 'woman']);
    });
    expect(new Set(PLAYER_CLASS_VISUAL_ASSETS.map(asset => asset.textureKey)).size).toBe(8);
    expect(new Set(PLAYER_CLASS_VISUAL_ASSETS.map(asset => asset.portraitTextureKey)).size).toBe(8);
  });

  it('verifies source, sheet and portrait dimensions and hashes', () => {
    PLAYER_CLASS_VISUAL_ASSETS.forEach(asset => {
      const source = path.join(assetRoot, asset.sourceFileName);
      const sheet = path.join(assetRoot, asset.sheetFileName);
      const portrait = path.join(assetRoot, asset.portraitFileName);
      expect(fs.existsSync(source)).toBe(true);
      expect(fs.existsSync(sheet)).toBe(true);
      expect(fs.existsSync(portrait)).toBe(true);
      expect(dimensions(source)).toEqual({ width: 1534, height: 1025 });
      expect(dimensions(sheet)).toEqual({ width: 512, height: 342 });
      expect(dimensions(portrait)).toEqual({ width: 384, height: 384 });
      expect(sha256(source)).toBe(asset.sourceSha256);
      expect(sha256(sheet)).toBe(asset.sheetSha256);
      expect(sha256(portrait)).toBe(asset.portraitSha256);
    });
  });

  it('keeps twelve visible, distinct and cell-isolated animation frames per sheet', () => {
    PLAYER_CLASS_VISUAL_ASSETS.forEach(asset => {
      const image = readRgba(path.join(assetRoot, asset.sheetFileName));
      const frameHashes = new Set<string>();
      for (let row = 0; row < 3; row += 1) {
        for (let column = 0; column < 4; column += 1) {
          const frame = framePixels(image, column, row);
          const visible = visiblePixels(frame);
          expect(visible).toBeGreaterThan(400);
          expect(visible).toBeLessThan(128 * 114 * 0.9);
          frameHashes.add(crypto.createHash('sha256').update(frame).digest('hex'));
        }
      }
      expect(frameHashes.size).toBe(12);
    });
  });

  it('keeps the articulated ranger body contract and provenance', () => {
    expect(PLAYER_CLASS_AIM_BODY_ASSETS).toHaveLength(2);
    PLAYER_CLASS_AIM_BODY_ASSETS.forEach(asset => {
      const source = path.join(assetRoot, asset.sourceFileName);
      const body = path.join(assetRoot, asset.fileName);
      expect(dimensions(source)).toEqual({ width: 1254, height: 1254 });
      expect(dimensions(body)).toEqual({ width: 128, height: 114 });
      expect(sha256(source)).toBe(asset.sourceSha256);
      expect(sha256(body)).toBe(asset.sha256);
      expect(visiblePixels(readRgba(body).pixels)).toBeGreaterThan(900);
    });
  });

  it('preserves class mechanics while exposing the new territorial identities', () => {
    expect(CLASS_DATABASE.knight).toMatchObject({
      title: 'Guardião do Cerne', primaryStyle: 'melee', specialStyle: 'aegis',
      maxHp: 6, maxMagic: 100, speed: 205, baseDamage: 42, attackRange: 92,
      attackCooldown: 430, projectileSpeed: 360, magicCost: 35, spriteFacing: 'left',
    });
    expect(CLASS_DATABASE.mage).toMatchObject({
      title: 'Condutor das Sementes', primaryStyle: 'orb', specialStyle: 'nova',
      maxHp: 4, maxMagic: 140, speed: 215, baseDamage: 30, attackRange: 360,
      attackCooldown: 330, projectileSpeed: 560, magicCost: 40, spriteFacing: 'left',
    });
    expect(CLASS_DATABASE.ranger).toMatchObject({
      title: 'Rastreador do Igapó', primaryStyle: 'arrow', specialStyle: 'volley',
      maxHp: 5, maxMagic: 110, speed: 215, baseDamage: 34, attackRange: 460,
      attackCooldown: 390, projectileSpeed: 570, magicCost: 35, spriteFacing: 'right',
    });
    expect(CLASS_DATABASE.rogue).toMatchObject({
      title: 'Lâmina do Cipó', primaryStyle: 'daggers', specialStyle: 'shadow',
      maxHp: 4, maxMagic: 100, speed: 265, baseDamage: 19, attackRange: 230,
      attackCooldown: 245, projectileSpeed: 500, magicCost: 30, spriteFacing: 'left',
    });
  });

  it('keeps long authored labels inside the selection panel and combat HUD', () => {
    const creator = fs.readFileSync(path.join(root, 'src', 'scenes', 'CharacterCreatorScene.ts'), 'utf8');
    const game = fs.readFileSync(path.join(root, 'src', 'scenes', 'GameScene.ts'), 'utf8');
    expect(creator).toContain("setDisplaySize(260, 260)");
    expect(creator).toContain("wordWrap: { width: 330, useAdvancedWrap: true }");
    expect(creator).toContain("setOrigin(0.5, 0)");
    expect(game).toContain("wordWrap: { width: 285, useAdvancedWrap: true }");
    expect(game).toContain("fontSize: '12px'");
  });

  it('keeps legacy class art recoverable while booting only the new catalog', () => {
    expect(fs.existsSync(path.join(root, 'src', 'assets', 'classes', 'knight_woman.png'))).toBe(true);
    expect(fs.existsSync(path.join(root, 'src', 'assets', 'animations', 'knight_woman_walk_v5.png'))).toBe(true);
    const boot = fs.readFileSync(path.join(root, 'src', 'scenes', 'BootScene.ts'), 'utf8');
    expect(boot).toContain('preloadPlayerClassAssets(this)');
    expect(boot).toContain('createPlayerClassAnimations(this)');
    expect(boot).not.toContain('assets/classes');
    expect(boot).not.toContain('_walk_v5.png');
  });
});

