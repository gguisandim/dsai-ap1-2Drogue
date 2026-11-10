import type Phaser from 'phaser';
import { IGAPO_CANOA_TEXTURE_KEY } from '../../stages/chapters/aguas/igapoVisuals';
import { IGAPO_ASSET_LIST } from './igapoAssetCatalog';

const assetUrl = (fileName: string): string =>
  new URL(`../../assets/aguas/${fileName}`, import.meta.url).href;

export function preloadIgapoAssets(scene: Phaser.Scene): void {
  scene.load.image(
    IGAPO_CANOA_TEXTURE_KEY,
    new URL('../../assets/aguas/igapo-canoa.svg', import.meta.url).href,
  );
  IGAPO_ASSET_LIST.forEach(asset => {
    const url = assetUrl(asset.fileName);
    if (asset.frameWidth !== undefined && asset.frameHeight !== undefined) {
      // The shore, lily, moss and floor assets are frame atlases. Loading them
      // as images would squeeze every frame into the first one when the
      // renderer asks for frame 0 (Phaser treats zero as the default frame).
      scene.load.spritesheet(asset.textureKey, url, {
        frameWidth: asset.frameWidth,
        frameHeight: asset.frameHeight,
      });
      return;
    }
    scene.load.image(asset.textureKey, url);
  });
}
