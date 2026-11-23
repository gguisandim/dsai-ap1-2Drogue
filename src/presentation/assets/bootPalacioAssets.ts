import type Phaser from 'phaser';
import { PALACIO_ASSETS, PALACIO_CREDOR_TEXTURE_KEY } from './palacioAssetCatalog';

export { PALACIO_CREDOR_TEXTURE_KEY };

const assetUrl = (fileName: string): string =>
  new URL(`../../assets/palacio/${fileName}`, import.meta.url).href;

export function preloadPalacioAssets(scene: Phaser.Scene): void {
  PALACIO_ASSETS.forEach(asset => {
    const url = assetUrl(asset.fileName);
    if (asset.frameWidth !== undefined && asset.frameHeight !== undefined) {
      scene.load.spritesheet(asset.textureKey, url, {
        frameWidth: asset.frameWidth,
        frameHeight: asset.frameHeight,
      });
    } else scene.load.image(asset.textureKey, url);
  });
}

/**
 * The Credor sheet preserves the 4x3 contract used by the existing enemy
 * entities: row 1 is walk, row 2 is attack and row 3 is hurt.
 */
export function createPalacioAnimations(scene: Phaser.Scene): void {
  const key = PALACIO_CREDOR_TEXTURE_KEY;
  scene.anims.create({
    key: `${key}_walk`,
    frames: scene.anims.generateFrameNumbers(key, { start: 0, end: 3 }),
    frameRate: 7,
    repeat: -1,
  });
  scene.anims.create({
    key: `${key}_attack`,
    frames: scene.anims.generateFrameNumbers(key, { start: 4, end: 7 }),
    frameRate: 10,
    repeat: 0,
  });
  scene.anims.create({
    key: `${key}_hurt`,
    frames: scene.anims.generateFrameNumbers(key, { start: 8, end: 11 }),
    frameRate: 9,
    repeat: 0,
  });
}
