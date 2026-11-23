import type Phaser from 'phaser';
import { MINAS_ASSETS } from './minasAssetCatalog';

const assetUrl = (fileName: string): string =>
  new URL(`../../assets/minas-corrompidas/${fileName}`, import.meta.url).href;

export function preloadMinasAssets(scene: Phaser.Scene): void {
  MINAS_ASSETS.forEach(asset => {
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
 * Enemy sprites are single-frame SVGs loaded with `load.image`, so every
 * animation targets the texture's `__BASE` frame. They exist to satisfy the
 * entity animation contract (walk/attack/hurt) while preserving the authored
 * silhouette; the visual identity comes from the texture itself.
 */
export function createMinasAnimations(scene: Phaser.Scene): void {
  ['minas_mole', 'minas_rootling', 'minas_guardian', 'minas_heart'].forEach(key => {
    ['walk', 'attack', 'hurt'].forEach(action => {
      scene.anims.create({
        key: `${key}_${action}`,
        frames: [{ key, frame: '__BASE' }],
        frameRate: 1,
        repeat: action === 'walk' ? -1 : 0,
      });
    });
  });
}

