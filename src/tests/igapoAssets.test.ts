import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {
  IGAPO_ASSET_LIST,
  IGAPO_ASSETS,
  IGAPO_ORIGINAL_ASSET_ORIGIN,
} from '../presentation/assets/igapoAssetCatalog';
import {
  AGUAS_VISUAL_RESOURCES,
  IGAPO_CANOA_TEXTURE_ID,
  IGAPO_ORIGINAL_TEXTURE_IDS,
} from '../stages/chapters/aguas';

const root = process.cwd();
const assetsRoot = path.join(root, 'src', 'assets', 'aguas');

function svgDimensions(file: string): { width: number; height: number } {
  const content = fs.readFileSync(file, 'utf8');
  const match = /^<svg[^>]*\swidth="(\d+)"[^>]*\sheight="(\d+)"/m.exec(content);
  if (!match) throw new Error(`SVG dimensions are missing: ${file}`);
  return { width: Number(match[1]), height: Number(match[2]) };
}

function sha256(file: string): string {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

describe('Igapó original asset pipeline', () => {
  it('declares only original local assets with stable provenance', () => {
    expect(IGAPO_ORIGINAL_ASSET_ORIGIN.license).toContain('asset original');
    expect(IGAPO_ORIGINAL_ASSET_ORIGIN.sourceUrl).toBe('src/assets/aguas/README.md');
    expect(IGAPO_ASSET_LIST.length).toBeGreaterThanOrEqual(12);
    IGAPO_ASSET_LIST.forEach(asset => {
      expect(asset.id).toMatch(/^asset\.aguas\./);
      expect(asset.textureKey).toMatch(/^[A-Za-z0-9]+(?:[._-][A-Za-z0-9]+)*$/);
      expect(asset.fileName).toMatch(/^igapo-[a-z-]+\.svg$/);
      expect(asset.sha256).toMatch(/^[0-9a-f]{64}$/);
      expect(asset.width).toBeGreaterThan(0);
      expect(asset.height).toBeGreaterThan(0);
      expect(asset.usage.length).toBeGreaterThan(10);
    });
  });

  it('keeps files, SVG dimensions and SHA-256 hashes verifiable', () => {
    IGAPO_ASSET_LIST.forEach(asset => {
      const file = path.join(assetsRoot, asset.fileName);
      expect(fs.existsSync(file)).toBe(true);
      expect(svgDimensions(file)).toEqual({ width: asset.width, height: asset.height });
      expect(sha256(file)).toBe(asset.sha256);
    });
  });

  it('declares coherent frame metadata for the sprite sheets', () => {
    IGAPO_ASSET_LIST.filter(asset => asset.frameCount !== undefined).forEach(asset => {
      expect(asset.frameWidth).toBeGreaterThan(0);
      expect(asset.frameHeight).toBeGreaterThan(0);
      expect(asset.width % asset.frameWidth!).toBe(0);
      expect(asset.height % asset.frameHeight!).toBe(0);
      expect((asset.width / asset.frameWidth!) * (asset.height / asset.frameHeight!))
        .toBe(asset.frameCount);
    });
  });

  it('registers every catalog texture in the chapter visual resources', () => {
    const textures = AGUAS_VISUAL_RESOURCES.textures;
    IGAPO_ASSET_LIST.forEach(asset => {
      const texture = textures.find(candidate => candidate.textureKey === asset.textureKey);
      expect(texture).toBeDefined();
      expect(texture).toMatchObject({
        id: expect.stringMatching(/^texture\.aguas\./),
        sourceWidth: asset.width,
        sourceHeight: asset.height,
        pixelArt: true,
        perspective: 'top-down',
        originId: IGAPO_ORIGINAL_ASSET_ORIGIN.id,
      });
      if (asset.frameCount !== undefined) {
        expect(texture).toMatchObject({
          frameWidth: asset.frameWidth,
          frameHeight: asset.frameHeight,
          frameCount: asset.frameCount,
        });
      }
    });
  });

  it('covers every original Igapó texture id exactly once', () => {
    const catalogKeys = new Set(IGAPO_ASSET_LIST.map(asset => asset.textureKey));
    const originalTextures = AGUAS_VISUAL_RESOURCES.textures.filter(texture =>
      texture.originId === IGAPO_ORIGINAL_ASSET_ORIGIN.id &&
      texture.id !== IGAPO_CANOA_TEXTURE_ID);
    expect(originalTextures.length).toBe(IGAPO_ASSET_LIST.length);
    expect(AGUAS_VISUAL_RESOURCES.textures.some(texture =>
      texture.id === IGAPO_CANOA_TEXTURE_ID)).toBe(true);
    originalTextures.forEach(texture => {
      expect(catalogKeys.has(texture.textureKey)).toBe(true);
      expect(Object.values(IGAPO_ORIGINAL_TEXTURE_IDS)).toContain(texture.id);
      expect(IGAPO_ASSETS[Object.keys(IGAPO_ASSETS).find(key =>
        IGAPO_ASSETS[key].textureKey === texture.textureKey) ?? '']).toBeDefined();
    });
  });

  it('documents dimensions and hashes in the asset README', () => {
    const readme = fs.readFileSync(path.join(assetsRoot, 'README.md'), 'utf8');
    IGAPO_ASSET_LIST.forEach(asset => {
      expect(readme).toContain(asset.fileName);
      expect(readme).toContain(asset.sha256);
      expect(readme).toContain(`${asset.width}×${asset.height}`);
    });
  });
});
