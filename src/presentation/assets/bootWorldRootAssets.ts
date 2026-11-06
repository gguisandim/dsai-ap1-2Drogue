import type Phaser from 'phaser';
import {
  WORLD_ROOT_APPROACH_ASSET,
  WORLD_ROOT_CANOPY_ASSET,
  WORLD_ROOT_ENTRANCE_ASSET,
  WORLD_ROOT_GROVE_ASSET,
  WORLD_ROOT_PASSAGE_ASSET,
  WORLD_ROOT_STONE_ASSET,
  WORLD_ROOT_STREAM_ASSET,
  WORLD_ROOT_TEXTURE_ASSET,
  WORLD_ROOT_TRAIL_ASSET,
} from './worldRootAssetCatalog';

const WORLD_ROOT_SANCTUARY_URL = new URL(
  '../../assets/world-root/world-root-sanctuary.png', import.meta.url,
).href;
const WORLD_ROOT_GROUND_URL = new URL(
  '../../assets/world-root/world-root-ground.svg', import.meta.url,
).href;
const WORLD_ROOT_STONE_URL = new URL(
  '../../assets/world-root/world-root-stone.svg', import.meta.url,
).href;
const WORLD_ROOT_CANOPY_URL = new URL(
  '../../assets/world-root/world-root-canopy.svg', import.meta.url,
).href;
const WORLD_ROOT_TRAIL_URL = new URL(
  '../../assets/world-root/world-root-trail-composition.png', import.meta.url,
).href;
const WORLD_ROOT_APPROACH_URL = new URL(
  '../../assets/world-root/world-root-sanctuary-approach.png', import.meta.url,
).href;
const WORLD_ROOT_STREAM_URL = new URL(
  '../../assets/world-root/world-root-stream.png', import.meta.url,
).href;
const WORLD_ROOT_GROVE_URL = new URL(
  '../../assets/world-root/world-root-grove.png', import.meta.url,
).href;
const WORLD_ROOT_ENTRANCE_URL = new URL(
  '../../assets/world-root/world-root-entrance.png', import.meta.url,
).href;
const WORLD_ROOT_PASSAGE_URL = new URL(
  '../../assets/world-root/world-root-passage.png', import.meta.url,
).href;

export function preloadWorldRootAssets(scene: Phaser.Scene): void {
  scene.load.image(WORLD_ROOT_TEXTURE_ASSET.textureKey, WORLD_ROOT_SANCTUARY_URL);
  scene.load.image('world_root_ground', WORLD_ROOT_GROUND_URL);
  scene.load.image(WORLD_ROOT_STONE_ASSET.textureKey, WORLD_ROOT_STONE_URL);
  scene.load.image(WORLD_ROOT_CANOPY_ASSET.textureKey, WORLD_ROOT_CANOPY_URL);
  scene.load.image(WORLD_ROOT_TRAIL_ASSET.textureKey, WORLD_ROOT_TRAIL_URL);
  scene.load.image(WORLD_ROOT_APPROACH_ASSET.textureKey, WORLD_ROOT_APPROACH_URL);
  scene.load.image(WORLD_ROOT_STREAM_ASSET.textureKey, WORLD_ROOT_STREAM_URL);
  scene.load.image(WORLD_ROOT_GROVE_ASSET.textureKey, WORLD_ROOT_GROVE_URL);
  scene.load.image(WORLD_ROOT_ENTRANCE_ASSET.textureKey, WORLD_ROOT_ENTRANCE_URL);
  scene.load.image(WORLD_ROOT_PASSAGE_ASSET.textureKey, WORLD_ROOT_PASSAGE_URL);
}
