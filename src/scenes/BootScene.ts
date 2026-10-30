// src/scenes/BootScene.ts
import Phaser from 'phaser';
import { TextureGenerator } from '../utils/TextureGenerator';
import { loadSettings } from '../data/PlayerProfile';
import { SoundManager } from '../managers/SoundManager';
import { createMageCastTexture } from '../utils/MageCastTexture';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    const classSprites = [
      'knight_man', 'knight_woman',
      'mage_man', 'mage_woman',
      'ranger_man', 'ranger_woman',
      'rogue_man', 'rogue_woman',
    ];
    classSprites.forEach(sprite => {
      this.load.image(`class_${sprite}`, new URL(`../assets/classes/${sprite}.png`, import.meta.url).href);
      this.load.spritesheet(`anim_${sprite}`, new URL(`../assets/animations/${sprite}_walk_v5.png`, import.meta.url).href, {
        frameWidth: 128,
        frameHeight: 114,
      });
    });
    ['woman', 'man'].forEach(gender => {
      this.load.image(`anim_ranger_${gender}_aim_body`,
        new URL(`../assets/animations/ranger_${gender}_aim_body_v2.png`, import.meta.url).href);
    });
    ['enemy_melee', 'enemy_ranged', 'boss_guardian'].forEach(enemy => {
      this.load.spritesheet(`${enemy}_anim`, new URL(`../assets/animations/${enemy}.png`, import.meta.url).href, {
        frameWidth: 128,
        frameHeight: 114,
      });
    });
  }

  create() {
    TextureGenerator.generateAllTextures(this);
    const playerSprites = [
      'anim_knight_man', 'anim_knight_woman',
      'anim_mage_man', 'anim_mage_woman',
      'anim_ranger_man', 'anim_ranger_woman',
      'anim_rogue_man', 'anim_rogue_woman',
    ];
    playerSprites.forEach(key => {
      this.anims.create({
        key: `${key}_walk`,
        frames: this.anims.generateFrameNumbers(key, { start: 0, end: 3 }),
        frameRate: 8,
        repeat: -1,
      });
      const mage = key.startsWith('anim_mage_');
      const archer = key.startsWith('anim_ranger_');
      const attackTexture = mage ? createMageCastTexture(this, key) : key;
      this.anims.create({
        key: `${key}_attack`,
        // Archer frames 4–5 are driven by the held charge; 6–7 release the arrow.
        frames: this.anims.generateFrameNumbers(attackTexture, { start: mage ? 0 : archer ? 6 : 4, end: mage ? 3 : 7 }),
        frameRate: mage ? 24 : 11,
        repeat: 0,
      });
      this.anims.create({
        key: `${key}_hurt`,
        frames: this.anims.generateFrameNumbers(key, { start: 8, end: 11 }),
        frameRate: 10,
        repeat: 0,
      });
      this.anims.create({
        key: `${key}_dodge`,
        frames: [0, 1, 2, 3].map(frame => ({ key, frame })),
        frameRate: 16,
        repeat: 0,
      });
    });

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
    SoundManager.setEnabled(loadSettings().sound);
    const developmentHost = globalThis.location?.hostname === '127.0.0.1' ||
      globalThis.location?.hostname === 'localhost';
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
