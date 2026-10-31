import type Phaser from 'phaser';
import {
  PUNY_ANIMATIONS,
  PUNY_TEXTURE_ASSETS,
  type PunyTextureAsset,
} from './punyAssetCatalog';

/** Static Vite URLs keep the assets inside the normal build pipeline. */
const PUNY_URLS: Readonly<Record<string, string>> = Object.freeze({
  'asset.puny.world': new URL('../../assets/puny/puny-world-tiles.png', import.meta.url).href,
  'asset.puny.mage-cyan': new URL('../../assets/puny/puny-mage-cyan.png', import.meta.url).href,
  'asset.puny.warrior-red-128': new URL('../../assets/puny/puny-warrior-red-128.png', import.meta.url).href,
  'asset.puny.archer-purple-128': new URL('../../assets/puny/puny-archer-purple-128.png', import.meta.url).href,
});

function urlFor(asset: PunyTextureAsset): string {
  const url = PUNY_URLS[asset.id];
  if (!url) throw new Error(`Puny asset has no boot URL: ${asset.id}.`);
  return url;
}

/** Loads each declared texture exactly once through the existing BootScene preload. */
export function preloadPunyAssets(scene: Phaser.Scene): void {
  const seen = new Set<string>();
  PUNY_TEXTURE_ASSETS.forEach(asset => {
    if (seen.has(asset.textureKey)) throw new Error(`Duplicate Puny texture key: ${asset.textureKey}.`);
    seen.add(asset.textureKey);
    if (asset.kind === 'spritesheet') {
      scene.load.spritesheet(asset.textureKey, urlFor(asset), {
        frameWidth: asset.frameWidth,
        frameHeight: asset.frameHeight,
      });
    } else {
      scene.load.image(asset.textureKey, urlFor(asset));
    }
  });
}

/** Creates named animations once; repeat calls are idempotent. */
export function createPunyAnimations(scene: Phaser.Scene): void {
  PUNY_ANIMATIONS.forEach(animation => {
    if (scene.anims.exists(animation.key)) return;
    scene.anims.create({
      key: animation.key,
      frames: animation.frames.map(frame => ({ key: animation.textureKey, frame })),
      frameRate: animation.frameRate,
      repeat: animation.repeat,
    });
  });
}
