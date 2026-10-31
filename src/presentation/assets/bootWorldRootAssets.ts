import type Phaser from 'phaser';
import { WORLD_ROOT_TEXTURE_ASSET } from './worldRootAssetCatalog';

const WORLD_ROOT_SANCTUARY_URL = new URL(
  '../../assets/world-root/world-root-sanctuary.png', import.meta.url,
).href;

export function preloadWorldRootAssets(scene: Phaser.Scene): void {
  scene.load.image(WORLD_ROOT_TEXTURE_ASSET.textureKey, WORLD_ROOT_SANCTUARY_URL);
}

