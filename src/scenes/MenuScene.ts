import Phaser from 'phaser';
import {
  GameSessionService,
  createBrowserCampaignSaveStorage,
  UMBRA_CAMPAIGN_ROUTE_SLICE,
} from '../application/stages';
import { generateDetailedCharacterTexture } from '../utils/CharacterTexture';
import { loadAppearance } from '../data/PlayerProfile';
import { getPlayerClass } from '../data/ClassDatabase';
import { createForestMenuBackdrop } from '../presentation/ForestMenuBackdrop';
import { firstFocusableIndex, moveFocus } from '../presentation/MenuNavigation';

interface MenuButton {
  readonly background: Phaser.GameObjects.Rectangle;
  readonly label: Phaser.GameObjects.Text;
  readonly enabled: boolean;
  readonly action: () => void;
}

export class MenuScene extends Phaser.Scene {
  private readonly buttons: MenuButton[] = [];
  private focusedIndex = -1;
  private confirmationOpen = false;
  private confirmationFocus = 0;
  private confirmationItems: Phaser.GameObjects.GameObject[] = [];
  private transitioning = false;
  private sessions!: GameSessionService;
  private menuState!: ReturnType<GameSessionService['menuState']>;

  constructor() {
    super('MenuScene');
  }

  public create(): void {
    this.buttons.length = 0;
    this.confirmationOpen = false;
    this.transitioning = false;
    this.sessions = new GameSessionService({
      storage: createBrowserCampaignSaveStorage(),
    });
    this.menuState = this.sessions.menuState();
    createForestMenuBackdrop(this);

    const appearance = loadAppearance();
    const heroClass = getPlayerClass(appearance.classId);
    const characterTexture = this.textures.exists('menu_character')
      ? 'menu_character'
      : generateDetailedCharacterTexture(this, appearance, 'menu_character');

    this.add.text(355, 88, 'UMBRA TRAIL', {
      fontFamily: 'Georgia, serif',
      fontSize: '56px',
      color: '#f0d98a',
      fontStyle: 'bold',
      stroke: '#17201c',
      strokeThickness: 7,
    }).setOrigin(0.5);
    this.add.text(355, 137, 'UMA TRAVESSIA PELAS PASSAGENS ESQUECIDAS', {
      fontFamily: 'Georgia, serif',
      fontSize: '15px',
      color: '#c4c6a9',
      letterSpacing: 2,
    }).setOrigin(0.5);

    this.add.image(355, 385, characterTexture).setDisplaySize(300, 300);
    this.add.ellipse(355, 525, 240, 24, 0x020605, 0.6).setDepth(2);
    this.add.text(355, 568, `${heroClass.name}\n${heroClass.weaponName}  ·  ${heroClass.specialName}`, {
      fontFamily: 'Georgia, serif',
      fontSize: '14px',
      color: '#e5d49a',
      align: 'center',
      lineSpacing: 5,
    }).setOrigin(0.5);

    const macroSave = this.menuState.savedClassicCampaign;
    const canContinueMacro = macroSave?.campaignId === UMBRA_CAMPAIGN_ROUTE_SLICE.id &&
      macroSave.status === 'active';
    const canContinueComposed = this.menuState.savedCampaign?.status === 'active';
    const canContinue = canContinueMacro || canContinueComposed;
    const hasExistingClassicSave = macroSave !== undefined;
    const cannotSafelyReplace = this.menuState.savedClassicCampaignError !== undefined;
    const continueDetail = canContinueMacro && macroSave.currentStageId
      ? this.sessions.catalog?.get(macroSave.currentStageId)?.title ?? macroSave.currentStageId
      : canContinueComposed
        ? this.menuState.savedCampaign?.currentStageId
        : undefined;

    this.add.text(852, 174, continueDetail
      ? `TRAVESSIA SALVA  ·  ${continueDetail}`
      : cannotSafelyReplace
        ? `SAVE NÃO VALIDADO: ${this.menuState.savedClassicCampaignError}`
        : hasExistingClassicSave
          ? 'SAVE EXISTENTE  ·  NOVA CAMPANHA SUBSTITUIRÁ ESTA TRAVESSIA'
          : 'A FLORESTA AGUARDA SUA ESCOLHA', {
      fontFamily: 'Georgia, serif',
      fontSize: '12px',
      color: cannotSafelyReplace ? '#e5a89b' : '#aaa98d',
      letterSpacing: 1,
      wordWrap: { width: 430 },
      align: 'center',
    }).setOrigin(0.5);

    const options: Array<{ label: string; enabled: boolean; action: () => void }> = [
      { label: 'CONTINUAR', enabled: canContinue, action: () => this.continueCampaign() },
      {
        label: 'NOVA CAMPANHA',
        enabled: !cannotSafelyReplace,
        action: () => hasExistingClassicSave
          ? this.openOverwriteConfirmation()
          : this.startNewCampaign(false),
      },
      { label: 'SELECIONAR FASE', enabled: true, action: () => this.transitionTo('StageSelectScene') },
      { label: 'MODOS DE JOGO', enabled: true, action: () => this.transitionTo('GameModesScene') },
      { label: 'PERSONAGEM', enabled: true, action: () => this.transitionTo('CharacterCreatorScene') },
      { label: 'FORJA DE FASES', enabled: true, action: () => this.transitionTo('EditorScene') },
      { label: 'CONFIGURAÇÕES', enabled: true, action: () => this.transitionTo('SettingsScene') },
      { label: 'CRÉDITOS', enabled: true, action: () => this.transitionTo('CreditsScene') },
      { label: 'CATÁLOGO', enabled: true, action: () => this.transitionTo('CatalogScene') },
    ];
    options.forEach((option, index) => this.createButton(option, 852, 222 + index * 49, index));
    this.focusedIndex = firstFocusableIndex(this.buttons.map(button => button.enabled));
    this.syncFocus();

    this.add.text(640, 690, '↑ ↓ NAVEGAR   ENTER CONFIRMAR   ·   MOUSE PARA EXPLORAR', {
      fontFamily: 'Georgia, serif',
      fontSize: '12px',
      color: '#9b9c84',
      letterSpacing: 1,
    }).setOrigin(0.5);

    this.cameras.main.fadeIn(320, 3, 7, 6);
    this.input.keyboard?.on('keydown', this.handleKey, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard?.off('keydown', this.handleKey, this);
    });
  }

  private readonly handleKey = (event: KeyboardEvent): void => {
    if (this.confirmationOpen) {
      if (event.key === 'Escape' || event.key.toLowerCase() === 'b') {
        this.closeOverwriteConfirmation();
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'Tab') {
        event.preventDefault();
        this.confirmationFocus = this.confirmationFocus === 0 ? 1 : 0;
        this.syncConfirmationFocus();
      } else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        if (this.confirmationFocus === 0) this.startNewCampaign(true);
        else this.closeOverwriteConfirmation();
      }
      return;
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Tab') {
      event.preventDefault();
      this.focusedIndex = moveFocus(
        this.buttons.map(button => button.enabled),
        this.focusedIndex,
        event.key === 'ArrowUp' || (event.key === 'Tab' && event.shiftKey) ? -1 : 1,
      );
      this.syncFocus();
    } else if ((event.key === 'Enter' || event.key === ' ') && this.focusedIndex >= 0) {
      event.preventDefault();
      const button = this.buttons[this.focusedIndex];
      if (button.enabled) button.action();
    }
  };

  private createButton(
    option: { readonly label: string; readonly enabled: boolean; readonly action: () => void },
    x: number,
    y: number,
    index: number,
  ): void {
    const background = this.add.rectangle(x, y, 420, 42, 0x17231e, 0.16)
      .setStrokeStyle(1, 0x827b59, 0.28);
    const label = this.add.text(x - 174, y, option.label, {
      fontFamily: 'Georgia, serif',
      fontSize: '17px',
      color: option.enabled ? '#d9d4b8' : '#747c6d',
      fontStyle: 'bold',
      letterSpacing: 1,
    }).setOrigin(0, 0.5);
    this.buttons.push({ background, label, enabled: option.enabled, action: option.action });
    if (option.enabled) {
      background.setInteractive({ useHandCursor: true });
      background.on('pointerover', () => {
        this.focusedIndex = index;
        this.syncFocus();
      });
      background.on('pointerdown', option.action);
    }
  }

  private syncFocus(): void {
    this.buttons.forEach((button, index) => {
      const focused = index === this.focusedIndex && button.enabled;
      button.background
        .setFillStyle(focused ? 0x774c36 : 0x17231e, focused ? 0.58 : 0.16)
        .setStrokeStyle(1, focused ? 0xe7d28a : 0x827b59, focused ? 0.92 : 0.28)
        .setScale(focused ? 1.025 : 1);
      button.label
        .setColor(!button.enabled ? '#747c6d' : focused ? '#fff0bd' : '#d9d4b8')
        .setX(focused ? 649 : 678);
    });
  }

  private continueCampaign(): void {
    const saved = this.menuState?.savedClassicCampaign;
    if (saved?.campaignId === UMBRA_CAMPAIGN_ROUTE_SLICE.id && saved.status === 'active') {
      this.transitionTo('GameScene', {
        macroCampaign: true,
        macroRunId: saved.runId,
        macroRunSeed: saved.runSeed,
      });
      return;
    }
    if (this.menuState?.savedCampaign?.status === 'active') {
      this.transitionTo('GameModesScene', { continueSavedCampaign: true });
    }
  }

  private startNewCampaign(replaceExistingRun: boolean): void {
    const randomId = globalThis.crypto?.randomUUID?.() ??
      `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
    this.transitionTo('GameScene', {
      macroCampaign: true,
      macroRunId: `campaign.umbra-trail.menu.${randomId}`,
      macroRunSeed: `seed.umbra-trail.${randomId}`,
      macroReplaceExistingRun: replaceExistingRun,
    });
  }

  private openOverwriteConfirmation(): void {
    if (this.confirmationOpen || this.transitioning) return;
    this.confirmationOpen = true;
    this.confirmationFocus = 0;
    const { width, height } = this.scale.gameSize;
    this.confirmationItems = [
      this.add.rectangle(width / 2, height / 2, width, height, 0x020605, 0.76)
        .setDepth(30).setInteractive(),
      this.add.rectangle(width / 2, height / 2, 570, 260, 0x17231e, 0.98)
        .setStrokeStyle(2, 0xe7d28a, 0.9).setDepth(31).setInteractive(),
      this.add.text(width / 2, height / 2 - 68, 'INICIAR NOVA TRAVESSIA?', {
        fontFamily: 'Georgia, serif',
        fontSize: '27px',
        color: '#f0d98a',
        fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(32),
      this.add.text(width / 2, height / 2 - 12,
        'O progresso da campanha salva será substituído.\nAs outras modalidades permanecerão intactas.', {
          fontFamily: 'Georgia, serif',
          fontSize: '16px',
          color: '#d9d4b8',
          align: 'center',
          lineSpacing: 7,
        }).setOrigin(0.5).setDepth(32),
    ];
    this.createConfirmationButton('INICIAR', width / 2 - 110, height / 2 + 78, 0, true);
    this.createConfirmationButton('VOLTAR', width / 2 + 110, height / 2 + 78, 1, false);
    this.syncConfirmationFocus();
  }

  private createConfirmationButton(
    text: string,
    x: number,
    y: number,
    index: number,
    confirm: boolean,
  ): void {
    const background = this.add.rectangle(x, y, 170, 44, 0x273c31, 0.9)
      .setStrokeStyle(1, 0xe7d28a, 0.7)
      .setDepth(32)
      .setInteractive({ useHandCursor: true });
    const label = this.add.text(x, y, text, {
      fontFamily: 'Georgia, serif',
      fontSize: '15px',
      color: '#eee4bf',
      fontStyle: 'bold',
      letterSpacing: 1,
    }).setOrigin(0.5).setDepth(33);
    background.on('pointerover', () => {
      this.confirmationFocus = index;
      this.syncConfirmationFocus();
    });
    background.on('pointerdown', () => confirm
      ? this.startNewCampaign(true)
      : this.closeOverwriteConfirmation());
    this.confirmationItems.push(background, label);
  }

  private syncConfirmationFocus(): void {
    const buttons = this.confirmationItems.slice(4);
    for (let index = 0; index < 2; index += 1) {
      const background = buttons[index * 2] as Phaser.GameObjects.Rectangle;
      const label = buttons[index * 2 + 1] as Phaser.GameObjects.Text;
      const focused = this.confirmationFocus === index;
      background.setFillStyle(focused ? 0x815439 : 0x273c31, focused ? 1 : 0.82)
        .setStrokeStyle(1, focused ? 0xffe6a1 : 0xe7d28a, focused ? 1 : 0.7);
      label.setColor(focused ? '#fff0bd' : '#d9d4b8');
    }
  }

  private closeOverwriteConfirmation(): void {
    this.confirmationItems.forEach(item => item.destroy());
    this.confirmationItems = [];
    this.confirmationOpen = false;
  }

  private transitionTo(key: string, data?: object): void {
    if (this.transitioning) return;
    this.transitioning = true;
    this.cameras.main.fadeOut(220, 3, 7, 6);
    this.time.delayedCall(220, () => this.scene.start(key, data));
  }
}
