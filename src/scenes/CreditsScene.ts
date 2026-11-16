import Phaser from 'phaser';
import { createForestMenuBackdrop } from '../presentation/ForestMenuBackdrop';

export class CreditsScene extends Phaser.Scene {
  private backFocused = true;
  private backBackground?: Phaser.GameObjects.Rectangle;
  private backLabel?: Phaser.GameObjects.Text;

  private readonly handleKey = (event: KeyboardEvent): void => {
    if (event.key === 'Escape' || event.key.toLowerCase() === 'b') {
      this.returnToMenu();
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (this.backFocused) this.returnToMenu();
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Tab') {
      event.preventDefault();
      this.backFocused = true;
      this.syncBackFocus();
    }
  };

  constructor() {
    super('CreditsScene');
  }

  public create(): void {
    createForestMenuBackdrop(this);
    this.add.text(640, 92, 'CRÉDITOS', {
      fontFamily: 'Georgia, serif',
      fontSize: '43px',
      color: '#f0d98a',
      fontStyle: 'bold',
      stroke: '#17201c',
      strokeThickness: 5,
    }).setOrigin(0.5);

    this.add.text(640, 160, 'UMBRA TRAIL', {
      fontFamily: 'Georgia, serif',
      fontSize: '24px',
      color: '#fff0bd',
      fontStyle: 'bold',
      letterSpacing: 2,
    }).setOrigin(0.5);
    this.add.text(640, 198,
      'Uma aventura de exploração e combate entre florestas inundadas, memórias e rotas corrompidas.', {
        fontFamily: 'Georgia, serif',
        fontSize: '15px',
        color: '#d0d0b8',
        align: 'center',
        wordWrap: { width: 820 },
      }).setOrigin(0.5);

    this.add.text(640, 282, 'EQUIPE DO PROJETO', {
      fontFamily: 'Georgia, serif',
      fontSize: '16px',
      color: '#f0d98a',
      fontStyle: 'bold',
      letterSpacing: 2,
    }).setOrigin(0.5);
    this.add.text(640, 323, 'Guilherme Sandim  ·  Jonas Bragança', {
      fontFamily: 'Georgia, serif',
      fontSize: '20px',
      color: '#eee4bf',
    }).setOrigin(0.5);
    this.add.text(640, 366, 'ARTE E TECNOLOGIAS', {
      fontFamily: 'Georgia, serif',
      fontSize: '16px',
      color: '#f0d98a',
      fontStyle: 'bold',
      letterSpacing: 2,
    }).setOrigin(0.5);
    this.add.text(640, 408,
      'Arte original da Floresta das Raízes e do Igapó · Shade — Puny World e Puny Characters (CC0)\n' +
      'Phaser · TypeScript · Vite · Jest', {
        fontFamily: 'Georgia, serif',
        fontSize: '15px',
        color: '#d0d0b8',
        align: 'center',
        lineSpacing: 8,
      }).setOrigin(0.5);
    this.add.text(640, 508,
      'Nomes e atribuições conforme os créditos e a documentação do repositório.', {
        fontFamily: 'Georgia, serif',
        fontSize: '12px',
        color: '#aab39c',
        align: 'center',
      }).setOrigin(0.5);

    const backBackground = this.add.rectangle(640, 620, 250, 48, 0x344438, 0.88)
      .setStrokeStyle(1, 0xffe6a1, 1)
      .setInteractive({ useHandCursor: true });
    this.backBackground = backBackground;
    this.backLabel = this.add.text(640, 620, 'VOLTAR AO MENU', {
      fontFamily: 'Georgia, serif',
      fontSize: '15px',
      color: '#fff0bd',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    backBackground.on('pointerover', () => {
      this.backFocused = true;
      this.syncBackFocus();
    });
    backBackground.on('pointerdown', () => this.returnToMenu());
    this.cameras.main.fadeIn(260, 3, 7, 6);
    this.input.keyboard?.on('keydown', this.handleKey, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard?.off('keydown', this.handleKey, this);
    });
  }

  private returnToMenu(): void {
    this.cameras.main.fadeOut(200, 3, 7, 6);
    this.time.delayedCall(200, () => this.scene.start('MenuScene'));
  }

  private syncBackFocus(): void {
    this.backBackground
      ?.setFillStyle(this.backFocused ? 0x815439 : 0x17231e, this.backFocused ? 0.95 : 0.78)
      .setStrokeStyle(1, this.backFocused ? 0xffe6a1 : 0xe7d28a, this.backFocused ? 1 : 0.6);
    this.backLabel?.setColor(this.backFocused ? '#fff0bd' : '#eee4bf');
  }
}
