import Phaser from 'phaser';
import { generateDetailedCharacterTexture } from '../utils/CharacterTexture';
import { loadAppearance } from '../data/PlayerProfile';
import { getPlayerClass } from '../data/ClassDatabase';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  public create(): void {
    this.cameras.main.setBackgroundColor('#100b18');
    this.drawBackdrop();
    const appearance = loadAppearance();
    const heroClass = getPlayerClass(appearance.classId);
    const characterTexture = generateDetailedCharacterTexture(this, appearance, 'menu_character');

    this.add.text(640, 105, 'UMBRA TRAIL', {
      fontFamily: 'Courier New, monospace',
      fontSize: '64px',
      color: '#f6d77a',
      fontStyle: 'bold',
      stroke: '#3e214f',
      strokeThickness: 8,
    }).setOrigin(0.5);
    this.add.text(640, 160, 'UMA AVENTURA NAS PASSAGENS ESQUECIDAS', {
      fontFamily: 'Courier New, monospace',
      fontSize: '16px',
      color: '#b89dc7',
      letterSpacing: 3,
    }).setOrigin(0.5);

    this.add.image(350, 365, characterTexture).setDisplaySize(320, 320);
    this.add.rectangle(350, 505, 250, 18, 0x000000, 0.35).setScale(1, 0.5);
    this.add.text(350, 540, `${heroClass.name}\n${heroClass.weaponName}  •  ${heroClass.specialName}`, {
      fontFamily: 'Courier New, monospace', fontSize: '14px', color: '#f6d77a', align: 'center', lineSpacing: 5,
    }).setOrigin(0.5);

    this.createButton(780, 275, 'JOGAR', () => this.scene.start('GameModesScene'), true);
    this.createButton(780, 345, 'EDITAR PERSONAGEM', () => this.scene.start('CharacterCreatorScene'));
    this.createButton(780, 415, 'FORJA DE FASES', () => this.scene.start('EditorScene'));
    this.createButton(780, 485, 'AJUSTES', () => this.scene.start('SettingsScene'));
    this.createButton(780, 555, 'CATÁLOGO', () => this.scene.start('CatalogScene'));

    this.add.text(640, 665, 'WASD / SETAS  •  MOUSE  •  B PARA LOJA', {
      fontFamily: 'Courier New, monospace',
      fontSize: '14px',
      color: '#75667e',
    }).setOrigin(0.5);
  }

  private createButton(x: number, y: number, label: string, action: () => void, primary = false): void {
    const color = primary ? 0x9b3f68 : 0x2d2038;
    const border = primary ? 0xf6d77a : 0x765683;
    const bg = this.add.rectangle(x, y, 390, 58, color, 1).setStrokeStyle(3, border).setInteractive({ useHandCursor: true });
    const text = this.add.text(x, y, label, {
      fontFamily: 'Courier New, monospace',
      fontSize: '22px',
      color: primary ? '#fff1b8' : '#decfe5',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    bg.on('pointerover', () => bg.setScale(1.03));
    bg.on('pointerout', () => bg.setScale(1));
    bg.on('pointerdown', action);
    text.setDepth(1);
  }

  private drawBackdrop(): void {
    const g = this.add.graphics();
    g.fillStyle(0x1b1226, 1);
    g.fillRect(0, 0, 1280, 720);
    g.fillStyle(0x2b1a35, 1);
    for (let x = 0; x < 1280; x += 64) {
      g.fillRect(x, 590 + ((x / 64) % 2) * 8, 64, 130);
      g.lineStyle(2, 0x3c2948, 1);
      g.strokeRect(x, 590 + ((x / 64) % 2) * 8, 64, 130);
    }
    g.fillStyle(0x6f3156, 0.18);
    g.fillCircle(250, 270, 210);
    g.fillCircle(1080, 150, 170);
  }
}
