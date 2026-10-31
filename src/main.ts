// src/main.ts
import Phaser from 'phaser';
import { GameScene } from './scenes/GameScene';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { GameModesScene } from './scenes/GameModesScene';
import { CharacterCreatorScene } from './scenes/CharacterCreatorScene';
import { SettingsScene } from './scenes/SettingsScene';
import { CatalogScene } from './scenes/CatalogScene';
import { EditorScene } from './scenes/EditorScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  backgroundColor: '#0a0a0a',
  pixelArt: true,
  roundPixels: true,
  parent: document.body,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, MenuScene, GameModesScene, CharacterCreatorScene, SettingsScene, CatalogScene, EditorScene, GameScene],
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
};

const game = new Phaser.Game(config);
game.canvas.addEventListener('contextmenu', event => event.preventDefault());
