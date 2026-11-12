import type Phaser from 'phaser';
import { FLORES_ASSETS } from './floresAssetCatalog';

const assetUrl = (fileName: string): string =>
  new URL(`../../assets/flores/${fileName}`, import.meta.url).href;

export function preloadFloresAssets(scene: Phaser.Scene): void {
  FLORES_ASSETS.forEach(asset => {
    const url = assetUrl(asset.fileName);
    if (asset.frameWidth !== undefined && asset.frameHeight !== undefined) {
      scene.load.spritesheet(asset.textureKey, url, {
        frameWidth: asset.frameWidth,
        frameHeight: asset.frameHeight,
      });
    } else scene.load.image(asset.textureKey, url);
  });
}
