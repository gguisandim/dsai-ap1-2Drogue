import Phaser from 'phaser';
import { GameSettings, loadSettings, saveSettings } from '../data/PlayerProfile';
import { SoundManager } from '../managers/SoundManager';
import { createForestMenuBackdrop } from '../presentation/ForestMenuBackdrop';
import { moveFocus } from '../presentation/MenuNavigation';

interface VolumeSlider {
  readonly key: 'masterVolume' | 'musicVolume' | 'effectsVolume';
  readonly y: number;
  readonly track: Phaser.GameObjects.Rectangle;
  readonly fill: Phaser.GameObjects.Rectangle;
  readonly knob: Phaser.GameObjects.Arc;
  readonly value: Phaser.GameObjects.Text;
}

export class SettingsScene extends Phaser.Scene {
  private settings!: GameSettings;
  private sliders: VolumeSlider[] = [];
  private focusIndex = 0;
  private activeSlider?: VolumeSlider;
  private statusText?: Phaser.GameObjects.Text;
  private soundButton?: Phaser.GameObjects.Text;
  private controlsButton?: Phaser.GameObjects.Text;
  private fullscreenButton?: Phaser.GameObjects.Text;
  private backButton?: Phaser.GameObjects.Text;

  constructor() {
    super('SettingsScene');
  }

  public create(): void {
    this.settings = { ...loadSettings() };
    this.sliders = [];
    this.focusIndex = 0;
    this.activeSlider = undefined;
    createForestMenuBackdrop(this);
    this.add.text(640, 77, 'CONFIGURAÇÕES', {
      fontFamily: 'Georgia, serif',
      fontSize: '40px',
      color: '#f0d98a',
      fontStyle: 'bold',
      stroke: '#17201c',
      strokeThickness: 5,
    }).setOrigin(0.5);

    this.createSlider(0, 226, 'VOLUME GERAL', 'masterVolume');
    this.createSlider(1, 298, 'MÚSICA E AMBIÊNCIA', 'musicVolume');
    this.createSlider(2, 370, 'EFEITOS SONOROS', 'effectsVolume');
    this.soundButton = this.createOption(430, 'SOM', 462, () => {
      this.settings.sound = !this.settings.sound;
      SoundManager.setEnabled(this.settings.sound);
      this.applyVolumes();
      this.persistSettings();
      this.refreshOptions();
    });
    this.controlsButton = this.createOption(430, 'COMANDOS NA TELA', 512, () => {
      this.settings.showControls = !this.settings.showControls;
      this.persistSettings();
      this.refreshOptions();
    });
    this.fullscreenButton = this.createOption(430, 'TELA CHEIA', 562, () => this.toggleFullscreen());
    this.backButton = this.createOption(640, 'SALVAR E VOLTAR', 642, () => {
      if (this.persistSettings()) this.returnToMenu();
    });
    this.statusText = this.add.text(640, 607, '', {
      fontFamily: 'Georgia, serif',
      fontSize: '12px',
      color: '#e5a89b',
      align: 'center',
      wordWrap: { width: 620 },
    }).setOrigin(0.5);

    this.applyVolumes();
    SoundManager.setEnabled(this.settings.sound);
    this.refreshOptions();
    this.syncFocus();
    this.scale.on(Phaser.Scale.Events.ENTER_FULLSCREEN, this.handleFullscreenChange, this);
    this.scale.on(Phaser.Scale.Events.LEAVE_FULLSCREEN, this.handleFullscreenChange, this);
    this.scale.on(Phaser.Scale.Events.FULLSCREEN_FAILED, this.handleFullscreenFailure, this);
    this.input.on('pointermove', this.handlePointerMove, this);
    this.input.keyboard?.on('keydown', this.handleKey, this);
    this.cameras.main.fadeIn(260, 3, 7, 6);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.ENTER_FULLSCREEN, this.handleFullscreenChange, this);
      this.scale.off(Phaser.Scale.Events.LEAVE_FULLSCREEN, this.handleFullscreenChange, this);
      this.scale.off(Phaser.Scale.Events.FULLSCREEN_FAILED, this.handleFullscreenFailure, this);
      this.input.off('pointermove', this.handlePointerMove, this);
      this.input.keyboard?.off('keydown', this.handleKey, this);
    });
  }

  private createSlider(
    index: number,
    y: number,
    label: string,
    key: VolumeSlider['key'],
  ): void {
    this.add.text(370, y - 22, label, {
      fontFamily: 'Georgia, serif',
      fontSize: '15px',
      color: '#ddd9c0',
      fontStyle: 'bold',
      letterSpacing: 1,
    }).setOrigin(0, 0.5);
    const track = this.add.rectangle(585, y, 360, 10, 0x101915, 0.95)
      .setStrokeStyle(1, 0x849078, 0.7)
      .setInteractive({ useHandCursor: true });
    const fill = this.add.rectangle(405, y, 0, 4, 0xe7d28a, 0.95).setOrigin(0, 0.5);
    const knob = this.add.circle(405, y, 9, 0xeee4bf, 1)
      .setStrokeStyle(2, 0x455842, 1)
      .setInteractive({ useHandCursor: true });
    const value = this.add.text(985, y, '', {
      fontFamily: 'Georgia, serif',
      fontSize: '14px',
      color: '#f0d98a',
    }).setOrigin(1, 0.5);
    const slider = { key, y, track, fill, knob, value };
    this.sliders.push(slider);
    const begin = (pointer: Phaser.Input.Pointer): void => {
      this.activeSlider = slider;
      this.focusIndex = index;
      this.syncFocus();
      this.setSliderFromPointer(slider, pointer.x);
    };
    track.on('pointerdown', begin);
    knob.on('pointerdown', begin);
    this.refreshSlider(slider);
  }

  private createOption(
    x: number,
    label: string,
    y: number,
    action: () => void,
  ): Phaser.GameObjects.Text {
    return this.add.text(x, y, label, {
      fontFamily: 'Georgia, serif',
      fontSize: '15px',
      color: '#d9d4b8',
      fontStyle: 'bold',
      backgroundColor: '#17231e',
      padding: { x: 16, y: 9 },
      letterSpacing: 1,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
      .on('pointerover', () => {
        this.focusIndex = this.optionFocusIndex(label);
        this.syncFocus();
      })
      .on('pointerdown', action);
  }

  private readonly handlePointerMove = (pointer: Phaser.Input.Pointer): void => {
    if (pointer.isDown && this.activeSlider) this.setSliderFromPointer(this.activeSlider, pointer.x);
  };

  private readonly handleKey = (event: KeyboardEvent): void => {
    if (event.key === 'Escape' || event.key.toLowerCase() === 'b') {
      if (this.persistSettings()) this.returnToMenu();
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Tab') {
      event.preventDefault();
      this.focusIndex = moveFocus(Array.from({ length: 7 }, () => true), this.focusIndex,
        event.key === 'ArrowUp' || (event.key === 'Tab' && event.shiftKey) ? -1 : 1);
      this.syncFocus();
      return;
    }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      const slider = this.sliders[this.focusIndex];
      if (slider) {
        event.preventDefault();
        this.setSliderValue(slider, this.settings[slider.key] + (event.key === 'ArrowRight' ? 0.05 : -0.05));
      }
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (this.focusIndex === 3) this.soundButton?.emit('pointerdown');
      else if (this.focusIndex === 4) this.controlsButton?.emit('pointerdown');
      else if (this.focusIndex === 5) this.fullscreenButton?.emit('pointerdown');
      else if (this.focusIndex === 6) this.backButton?.emit('pointerdown');
    }
  };

  private setSliderFromPointer(slider: VolumeSlider, pointerX: number): void {
    const bounds = slider.track.getBounds();
    const value = Phaser.Math.Clamp((pointerX - bounds.left) / bounds.width, 0, 1);
    this.setSliderValue(slider, value);
  }

  private setSliderValue(slider: VolumeSlider, value: number): void {
    this.settings[slider.key] = Phaser.Math.Clamp(value, 0, 1);
    this.refreshSlider(slider);
    this.applyVolumes();
    this.persistSettings();
  }

  private refreshSlider(slider: VolumeSlider): void {
    const value = this.settings[slider.key];
    const startX = 405;
    const width = 360 * value;
    slider.fill.setPosition(startX, slider.y).setSize(width, 4);
    slider.knob.setPosition(startX + width, slider.y);
    slider.value.setText(`${Math.round(value * 100)}%`);
  }

  private applyVolumes(): void {
    SoundManager.setVolumeLevels(
      this.settings.masterVolume,
      this.settings.musicVolume,
      this.settings.effectsVolume,
    );
  }

  private refreshOptions(): void {
    this.soundButton?.setText(`SOM  ·  ${this.settings.sound ? 'LIGADO' : 'DESLIGADO'}`);
    this.controlsButton?.setText(
      `COMANDOS NA TELA  ·  ${this.settings.showControls ? 'LIGADOS' : 'DESLIGADOS'}`,
    );
    const fullscreen = this.scale.isFullscreen;
    const preference = this.settings.fullscreen ? 'PREFERIDA' : 'DESLIGADA';
    this.fullscreenButton?.setText(fullscreen
      ? 'SAIR DA TELA CHEIA'
      : `TELA CHEIA  ·  ${preference}`);
  }

  private syncFocus(): void {
    this.sliders.forEach((slider, index) => {
      const focused = index === this.focusIndex;
      slider.track.setStrokeStyle(1, focused ? 0xffe6a1 : 0x849078, focused ? 1 : 0.7);
      slider.knob.setScale(focused ? 1.18 : 1);
    });
    [this.soundButton, this.controlsButton, this.fullscreenButton, this.backButton]
      .forEach((button, index) => {
        const focused = index + 3 === this.focusIndex;
        button?.setColor(focused ? '#fff0bd' : '#d9d4b8')
          .setBackgroundColor(focused ? '#815439' : '#17231e');
      });
  }

  private optionFocusIndex(label: string): number {
    if (label.startsWith('SOM')) return 3;
    if (label.startsWith('COMANDOS')) return 4;
    if (label.startsWith('TELA CHEIA')) return 5;
    return 6;
  }

  private toggleFullscreen(): void {
    this.statusText?.setText('');
    try {
      if (this.scale.isFullscreen) this.scale.stopFullscreen();
      else this.scale.startFullscreen();
    } catch (error) {
      this.handleFullscreenFailure(error);
    }
  }

  private readonly handleFullscreenChange = (): void => {
    this.settings.fullscreen = this.scale.isFullscreen;
    this.refreshOptions();
    this.persistSettings();
  };

  private readonly handleFullscreenFailure = (error?: unknown): void => {
    const detail = error instanceof Error ? ` ${error.message}` : '';
    this.settings.fullscreen = this.scale.isFullscreen;
    this.refreshOptions();
    if (this.persistSettings()) {
      this.statusText?.setText(`Tela cheia indisponível neste navegador.${detail}`);
    }
  };

  private persistSettings(): boolean {
    try {
      saveSettings(this.settings);
      this.statusText?.setText('');
      return true;
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      this.statusText?.setText(`Não foi possível salvar as configurações: ${detail}`);
      return false;
    }
  }

  private returnToMenu(): void {
    this.cameras.main.fadeOut(200, 3, 7, 6);
    this.time.delayedCall(200, () => this.scene.start('MenuScene'));
  }
}
