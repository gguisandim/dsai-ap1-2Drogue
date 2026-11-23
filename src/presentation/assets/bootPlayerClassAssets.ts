import type Phaser from 'phaser';
import {
  PLAYER_CLASS_AIM_BODY_ASSETS,
  PLAYER_CLASS_VISUAL_ASSETS,
  type PlayerClassAimBodyAsset,
  type PlayerClassVisualAsset,
} from './playerClassAssetCatalog';

const VISUAL_URLS: Readonly<Record<string, { readonly sheet: string; readonly portrait: string }>> = Object.freeze({
  'asset.player-class.knight.woman': Object.freeze({
    sheet: new URL('../../assets/player-classes/knight_woman.png', import.meta.url).href,
    portrait: new URL('../../assets/player-classes/knight_woman-portrait.png', import.meta.url).href,
  }),
  'asset.player-class.knight.man': Object.freeze({
    sheet: new URL('../../assets/player-classes/knight_man.png', import.meta.url).href,
    portrait: new URL('../../assets/player-classes/knight_man-portrait.png', import.meta.url).href,
  }),
  'asset.player-class.mage.woman': Object.freeze({
    sheet: new URL('../../assets/player-classes/mage_woman.png', import.meta.url).href,
    portrait: new URL('../../assets/player-classes/mage_woman-portrait.png', import.meta.url).href,
  }),
  'asset.player-class.mage.man': Object.freeze({
    sheet: new URL('../../assets/player-classes/mage_man.png', import.meta.url).href,
    portrait: new URL('../../assets/player-classes/mage_man-portrait.png', import.meta.url).href,
  }),
  'asset.player-class.ranger.woman': Object.freeze({
    sheet: new URL('../../assets/player-classes/ranger_woman.png', import.meta.url).href,
    portrait: new URL('../../assets/player-classes/ranger_woman-portrait.png', import.meta.url).href,
  }),
  'asset.player-class.ranger.man': Object.freeze({
    sheet: new URL('../../assets/player-classes/ranger_man.png', import.meta.url).href,
    portrait: new URL('../../assets/player-classes/ranger_man-portrait.png', import.meta.url).href,
  }),
  'asset.player-class.rogue.woman': Object.freeze({
    sheet: new URL('../../assets/player-classes/rogue_woman.png', import.meta.url).href,
    portrait: new URL('../../assets/player-classes/rogue_woman-portrait.png', import.meta.url).href,
  }),
  'asset.player-class.rogue.man': Object.freeze({
    sheet: new URL('../../assets/player-classes/rogue_man.png', import.meta.url).href,
    portrait: new URL('../../assets/player-classes/rogue_man-portrait.png', import.meta.url).href,
  }),
});

const AIM_BODY_URLS: Readonly<Record<string, string>> = Object.freeze({
  'asset.player-class.ranger.woman.aim-body':
    new URL('../../assets/player-classes/ranger_woman_aim_body.png', import.meta.url).href,
  'asset.player-class.ranger.man.aim-body':
    new URL('../../assets/player-classes/ranger_man_aim_body.png', import.meta.url).href,
});

function visualUrls(asset: PlayerClassVisualAsset) {
  const urls = VISUAL_URLS[asset.id];
  if (!urls) throw new Error(`Player class asset has no boot URLs: ${asset.id}.`);
  return urls;
}

function aimBodyUrl(asset: PlayerClassAimBodyAsset): string {
  const url = AIM_BODY_URLS[asset.id];
  if (!url) throw new Error(`Player class aim body has no boot URL: ${asset.id}.`);
  return url;
}

export function preloadPlayerClassAssets(scene: Phaser.Scene): void {
  PLAYER_CLASS_VISUAL_ASSETS.forEach(asset => {
    const urls = visualUrls(asset);
    scene.load.image(asset.portraitTextureKey, urls.portrait);
    scene.load.spritesheet(asset.textureKey, urls.sheet, {
      frameWidth: asset.frameWidth,
      frameHeight: asset.frameHeight,
    });
  });
  PLAYER_CLASS_AIM_BODY_ASSETS.forEach(asset => {
    scene.load.image(asset.textureKey, aimBodyUrl(asset));
  });
}

export function createPlayerClassAnimations(scene: Phaser.Scene): void {
  PLAYER_CLASS_VISUAL_ASSETS.forEach(asset => {
    const key = asset.textureKey;
    scene.anims.create({
      key: `${key}_walk`,
      frames: scene.anims.generateFrameNumbers(key, { start: 0, end: 3 }),
      frameRate: 8,
      repeat: -1,
    });
    scene.anims.create({
      key: `${key}_attack`,
      frames: scene.anims.generateFrameNumbers(key, {
        start: asset.classId === 'ranger' ? 6 : 4,
        end: 7,
      }),
      frameRate: 11,
      repeat: 0,
    });
    scene.anims.create({
      key: `${key}_hurt`,
      frames: scene.anims.generateFrameNumbers(key, { start: 8, end: 11 }),
      frameRate: 10,
      repeat: 0,
    });
    scene.anims.create({
      key: `${key}_dodge`,
      frames: [0, 1, 2, 3].map(frame => ({ key, frame })),
      frameRate: 16,
      repeat: 0,
    });
  });
}

