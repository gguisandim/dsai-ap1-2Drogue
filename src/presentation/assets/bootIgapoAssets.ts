import type Phaser from 'phaser';
import { IGAPO_CANOA_TEXTURE_KEY } from '../../stages/chapters/aguas/igapoVisuals';

export function preloadIgapoAssets(scene: Phaser.Scene): void {
  scene.load.image(
    IGAPO_CANOA_TEXTURE_KEY,
    new URL('../../assets/aguas/igapo-canoa.svg', import.meta.url).href,
  );
}
