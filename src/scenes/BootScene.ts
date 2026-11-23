// src/scenes/BootScene.ts
import Phaser from 'phaser';
import { TextureGenerator } from '../utils/TextureGenerator';
import { loadSettings } from '../data/PlayerProfile';
import { SoundManager } from '../managers/SoundManager';
import { createPunyAnimations, preloadPunyAssets } from '../presentation/assets/bootPunyAssets';
import {
  createPlayerClassAnimations,
  preloadPlayerClassAssets,
} from '../presentation/assets/bootPlayerClassAssets';
import { preloadIgapoAssets } from '../presentation/assets/bootIgapoAssets';
import { preloadWorldRootAssets } from '../presentation/assets/bootWorldRootAssets';
import { preloadFloresAssets } from '../presentation/assets/bootFloresAssets';
import { createPalacioAnimations, preloadPalacioAssets } from '../presentation/assets/bootPalacioAssets';
import { createMinasAnimations, preloadMinasAssets } from '../presentation/assets/bootMinasAssets';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    preloadPlayerClassAssets(this);
    ['enemy_melee', 'enemy_ranged', 'boss_guardian'].forEach(enemy => {
      this.load.spritesheet(`${enemy}_anim`, new URL(`../assets/animations/${enemy}.png`, import.meta.url).href, {
        frameWidth: 128,
        frameHeight: 114,
      });
    });
    preloadPunyAssets(this);
    preloadIgapoAssets(this);
    preloadWorldRootAssets(this);
    preloadFloresAssets(this);
    preloadPalacioAssets(this);
    preloadMinasAssets(this);
  }

  create() {
    TextureGenerator.generateAllTextures(this);
    createPunyAnimations(this);
    createPlayerClassAnimations(this);
    createPalacioAnimations(this);
    createMinasAnimations(this);

    ['enemy_melee_anim', 'enemy_ranged_anim', 'boss_guardian_anim'].forEach(key => {
      this.anims.create({
        key: `${key}_walk`,
        frames: this.anims.generateFrameNumbers(key, { start: 0, end: 3 }),
        frameRate: 8,
        repeat: -1,
      });
      this.anims.create({
        key: `${key}_attack`,
        frames: this.anims.generateFrameNumbers(key, { start: 4, end: 7 }),
        frameRate: 11,
        repeat: 0,
      });
      this.anims.create({
        key: `${key}_hurt`,
        frames: this.anims.generateFrameNumbers(key, { start: 8, end: 11 }),
        frameRate: 10,
        repeat: 0,
      });
    });
    const settings = loadSettings();
    SoundManager.setEnabled(settings.sound);
    SoundManager.setVolumeLevels(settings.masterVolume, settings.musicVolume, settings.effectsVolume);
    const developmentHost = globalThis.location?.hostname === '127.0.0.1' ||
      globalThis.location?.hostname === 'localhost';
    const search = globalThis.location?.search ?? '';
    const previewRequested = import.meta.env.DEV && developmentHost &&
      (new URLSearchParams(search).has('chapterPreview') ||
        new URLSearchParams(search).has('stagePreview'));
    if (previewRequested) {
      void import('../devtools/chapter-preview/authoringPreview')
        .then(({ startVisualPreviewFromQuery }) => startVisualPreviewFromQuery(search))
        .then(result => {
          if ('session' in result) {
            this.scene.start('GameScene', {
              individualRuntime: {
                stageId: result.session.stageId,
                loadedStage: result.session.loadedStage,
                composition: result.session.composition,
              },
              skipControls: true,
            });
            return;
          }
          console.error('Visual preview failed.', result);
          this.scene.start('MenuScene');
        })
        .catch(error => {
          console.error('Visual preview failed to start.', error);
          this.scene.start('MenuScene');
        });
      return;
    }
    const narrativeCycleLab = developmentHost &&
      new URLSearchParams(globalThis.location?.search ?? '').get('narrativeCycleLab') === '1';
    if (narrativeCycleLab) {
      void import('../devtools/narrative-cycle').then(({ createNarrativeCycleScenario }) => {
        const scenario = createNarrativeCycleScenario();
        (globalThis as typeof globalThis & {
          __UMBRA_NARRATIVE_CYCLE__?: typeof scenario;
        }).__UMBRA_NARRATIVE_CYCLE__ = scenario;
        this.scene.start('GameScene', {
          campaignRuntime: scenario.runtime,
          skipControls: true,
        });
      }).catch(error => {
        console.error('Narrative cycle lab failed to start.', error);
        this.scene.start('MenuScene');
      });
      return;
    }
    this.scene.start('MenuScene');
  }
}
