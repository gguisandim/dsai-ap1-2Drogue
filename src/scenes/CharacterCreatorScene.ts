import Phaser from 'phaser';
import {
  CharacterAppearance,
  EYE_COLORS,
  HAIR_COLORS,
  OUTFIT_COLORS,
  SHOE_COLORS,
  SKIN_COLORS,
  loadAppearance,
  saveAppearance,
} from '../data/PlayerProfile';
import { generateDetailedCharacterTexture } from '../utils/CharacterTexture';
import { CLASS_DATABASE, PLAYER_CLASS_ORDER, getPlayerClass } from '../data/ClassDatabase';

export class CharacterCreatorScene extends Phaser.Scene {
  private appearance!: CharacterAppearance;
  private preview?: Phaser.GameObjects.Image;
  private valueTexts: Phaser.GameObjects.Text[] = [];
  private classNameText?: Phaser.GameObjects.Text;
  private classDetailText?: Phaser.GameObjects.Text;

  constructor() {
    super('CharacterCreatorScene');
  }

  public create(): void {
    this.appearance = { ...loadAppearance() };
    this.cameras.main.setBackgroundColor('#15101e');
    this.add.rectangle(640, 360, 1160, 640, 0x20152b, 1).setStrokeStyle(4, 0x6f4b7d);
    this.add.text(640, 65, 'CONSTRUA SEU PERSONAGEM', {
      fontFamily: 'Courier New, monospace', fontSize: '36px', color: '#f6d77a', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add.text(640, 105, 'Escolha cada detalhe antes de entrar na passagem', {
      fontFamily: 'Courier New, monospace', fontSize: '15px', color: '#a990b6',
    }).setOrigin(0.5);

    this.add.rectangle(340, 370, 400, 470, 0x100b18, 1).setStrokeStyle(3, 0x4f365c);
    this.add.text(340, 155, 'PRÉVIA DA CLASSE', {
      fontFamily: 'Courier New, monospace', fontSize: '15px', color: '#766281',
    }).setOrigin(0.5);

    this.classNameText = this.add.text(340, 452, '', {
      fontFamily: 'Courier New, monospace', fontSize: '18px', color: '#f6d77a', fontStyle: 'bold',
      align: 'center', wordWrap: { width: 340 },
    }).setOrigin(0.5);
    this.classDetailText = this.add.text(340, 480, '', {
      fontFamily: 'Courier New, monospace', fontSize: '11px', color: '#cbb8d4', align: 'center',
      wordWrap: { width: 330, useAdvancedWrap: true }, lineSpacing: 2,
    }).setOrigin(0.5, 0);

    this.createClassSelector(650, 165);

    const rows: Array<{ label: string; key: keyof CharacterAppearance; count: number; names?: string[] }> = [
      { label: 'GÊNERO', key: 'gender', count: 2, names: ['MULHER', 'HOMEM'] },
      { label: 'PELE / ROSTO', key: 'skin', count: SKIN_COLORS.length },
      { label: 'CABELO', key: 'hair', count: HAIR_COLORS.length },
      { label: 'OLHOS', key: 'eyes', count: EYE_COLORS.length },
      { label: 'ROUPA', key: 'outfit', count: OUTFIT_COLORS.length },
      { label: 'SAPATOS', key: 'shoes', count: SHOE_COLORS.length },
    ];
    rows.forEach((row, index) => this.createSelector(650, 225 + index * 57, row.label, row.key, row.count, row.names));

    this.createButton(755, 615, 'SALVAR', () => {
      saveAppearance(this.appearance);
      this.scene.start('MenuScene');
    }, 0x8f365f);
    this.createButton(1000, 615, 'VOLTAR', () => this.scene.start('MenuScene'), 0x30243a);
    this.refreshPreview();
  }

  private createClassSelector(x: number, y: number): void {
    this.add.text(x, y, 'CLASSE', {
      fontFamily: 'Courier New, monospace', fontSize: '16px', color: '#d8c6df', fontStyle: 'bold',
    }).setOrigin(0, 0.5);
    const value = this.add.text(x + 330, y, '', {
      fontFamily: 'Courier New, monospace', fontSize: '16px', color: '#f6d77a', fontStyle: 'bold',
    }).setOrigin(0.5);
    const refreshValue = () => value.setText(getPlayerClass(this.appearance.classId).name);
    const change = (direction: number) => {
      const current = Math.max(0, PLAYER_CLASS_ORDER.indexOf(this.appearance.classId));
      this.appearance.classId = PLAYER_CLASS_ORDER[(current + direction + PLAYER_CLASS_ORDER.length) % PLAYER_CLASS_ORDER.length];
      refreshValue();
      this.refreshPreview();
    };
    this.arrowButton(x + 245, y, '<', () => change(-1));
    this.arrowButton(x + 415, y, '>', () => change(1));
    refreshValue();
  }

  private createSelector(
    x: number,
    y: number,
    label: string,
    key: keyof CharacterAppearance,
    count: number,
    names?: string[],
  ): void {
    this.add.text(x, y, label, {
      fontFamily: 'Courier New, monospace', fontSize: '16px', color: '#d8c6df', fontStyle: 'bold',
    }).setOrigin(0, 0.5);
    const value = this.add.text(x + 330, y, '', {
      fontFamily: 'Courier New, monospace', fontSize: '16px', color: '#f6d77a',
    }).setOrigin(0.5);
    this.valueTexts.push(value);

    const change = (direction: number) => {
      const current = key === 'gender' ? (this.appearance.gender === 'woman' ? 0 : 1) : this.appearance[key] as number;
      const next = (current + direction + count) % count;
      if (key === 'gender') this.appearance.gender = next === 0 ? 'woman' : 'man';
      else (this.appearance[key] as number) = next;
      value.setText(names?.[next] ?? `OPÇÃO ${next + 1}`);
      this.refreshPreview();
    };
    this.arrowButton(x + 245, y, '<', () => change(-1));
    this.arrowButton(x + 415, y, '>', () => change(1));
    const current = key === 'gender' ? (this.appearance.gender === 'woman' ? 0 : 1) : this.appearance[key] as number;
    value.setText(names?.[current] ?? `OPÇÃO ${current + 1}`);
  }

  private arrowButton(x: number, y: number, label: string, action: () => void): void {
    this.add.text(x, y, label, {
      fontFamily: 'Courier New, monospace', fontSize: '26px', color: '#ffffff', backgroundColor: '#51365f', padding: { x: 12, y: 4 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).on('pointerdown', action);
  }

  private createButton(x: number, y: number, label: string, action: () => void, color: number): void {
    this.add.text(x, y, label, {
      fontFamily: 'Courier New, monospace', fontSize: '20px', color: '#ffffff', backgroundColor: `#${color.toString(16).padStart(6, '0')}`, padding: { x: 34, y: 14 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).on('pointerdown', action);
  }

  private refreshPreview(): void {
    this.preview?.destroy();
    const texture = generateDetailedCharacterTexture(this, this.appearance, 'creator_character');
    this.preview = this.add.image(340, 300, texture).setDisplaySize(260, 260);
    const heroClass = CLASS_DATABASE[this.appearance.classId];
    this.classNameText?.setText(`${heroClass.name} - ${heroClass.title}`);
    this.classDetailText?.setText(
      `${heroClass.weaponName}\nESPECIAL: ${heroClass.specialName}\n${heroClass.description}\n${heroClass.specialDescription}`,
    );
  }
}
