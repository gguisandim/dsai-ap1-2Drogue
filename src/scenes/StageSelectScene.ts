import Phaser from 'phaser';
import {
  GameSessionService,
  type GameIndividualSession,
} from '../application/stages';
import type { StageCatalogEntry } from '../stages';
import { createForestMenuBackdrop } from '../presentation/ForestMenuBackdrop';
import { moveFocus } from '../presentation/MenuNavigation';
import {
  describeStageAvailability,
  formatCatalogLabels,
  resolveStagePreview,
} from '../presentation/StageSelectionPresentation';

const PAGE_SIZE = 6;

export class StageSelectScene extends Phaser.Scene {
  private service!: GameSessionService;
  private entries: readonly StageCatalogEntry[] = [];
  private selectedIndex = 0;
  private page = 0;
  private content: Phaser.GameObjects.GameObject[] = [];
  private loadedStages = new Map<string, GameIndividualSession>();
  private selectionError = '';
  private footerFocusItems: Array<{
    readonly background: Phaser.GameObjects.Rectangle;
    readonly label: Phaser.GameObjects.Text;
    readonly index: number;
    readonly enabled: boolean;
  }> = [];
  private focusIndex = 0;
  private transitioning = false;

  constructor() {
    super('StageSelectScene');
  }

  public create(): void {
    this.service = new GameSessionService();
    this.entries = [...(this.service.catalog?.list() ?? [])]
      .sort((left, right) => left.chapterId.localeCompare(right.chapterId) ||
        left.stageId.localeCompare(right.stageId));
    this.loadedStages.clear();
    this.selectedIndex = 0;
    this.page = 0;
    this.focusIndex = 0;
    this.transitioning = false;
    createForestMenuBackdrop(this);

    this.add.text(640, 53, 'DESTINOS DA TRAVESSIA', {
      fontFamily: 'Georgia, serif',
      fontSize: '36px',
      color: '#f0d98a',
      fontStyle: 'bold',
      stroke: '#17201c',
      strokeThickness: 5,
    }).setOrigin(0.5);
    this.add.text(640, 95, 'Escolha uma região; a campanha principal permanece intacta.', {
      fontFamily: 'Georgia, serif',
      fontSize: '14px',
      color: '#c4c6a9',
    }).setOrigin(0.5);

    this.render();
    this.cameras.main.fadeIn(260, 3, 7, 6);
    this.input.keyboard?.on('keydown', this.handleKey, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard?.off('keydown', this.handleKey, this);
    });
  }

  private readonly handleKey = (event: KeyboardEvent): void => {
    if (event.key === 'Escape' || event.key.toLowerCase() === 'b') {
      this.returnToMenu();
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (this.entries.length === 0) return;
      this.selectedIndex = (this.selectedIndex +
        (event.key === 'ArrowDown' ? 1 : -1) + this.entries.length) % this.entries.length;
      this.page = Math.floor(this.selectedIndex / PAGE_SIZE);
      this.focusIndex = 0;
      this.render();
      return;
    }
    if (event.key === 'PageDown' || event.key === 'PageUp') {
      event.preventDefault();
      if (this.entries.length === 0) return;
      this.page = Math.max(0, Math.min(
        this.page + (event.key === 'PageDown' ? 1 : -1),
        Math.max(0, Math.ceil(this.entries.length / PAGE_SIZE) - 1),
      ));
      this.selectedIndex = Math.min(this.entries.length - 1, this.page * PAGE_SIZE);
      this.render();
      return;
    }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'Tab') {
      event.preventDefault();
      this.focusIndex = moveFocus([true, true], this.focusIndex,
        event.key === 'ArrowLeft' || (event.key === 'Tab' && event.shiftKey) ? -1 : 1);
      this.syncFooterFocus();
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (this.focusIndex === 0) this.startSelectedStage();
      else this.returnToMenu();
    }
  };

  private render(): void {
    this.content.forEach(item => item.destroy());
    this.content = [];
    this.footerFocusItems = [];
    this.selectionError = '';
    const pageCount = Math.max(1, Math.ceil(this.entries.length / PAGE_SIZE));
    const pageEntries = this.entries.slice(this.page * PAGE_SIZE, (this.page + 1) * PAGE_SIZE);

    if (this.entries.length === 0) {
      this.track(this.add.text(90, 180, this.service.catalog
        ? 'O catálogo não contém fases para exibir.'
        : 'O catálogo de fases não pôde ser carregado.', {
        fontFamily: 'Georgia, serif',
        fontSize: '18px',
        color: '#e5a89b',
        wordWrap: { width: 580 },
      }));
      this.renderFooter(pageCount);
      return;
    }

    pageEntries.forEach((entry, localIndex) => {
      const index = this.page * PAGE_SIZE + localIndex;
      this.renderStageRow(entry, index, 145 + localIndex * 72);
    });
    this.track(this.add.text(330, 602, `${this.page + 1} / ${pageCount}`, {
      fontFamily: 'Georgia, serif',
      fontSize: '13px',
      color: '#c4c6a9',
    }).setOrigin(0.5));

    const selected = this.entries[this.selectedIndex];
    this.renderSelectedStage(selected);
    this.renderFooter(pageCount);
    this.syncFooterFocus();
  }

  private renderStageRow(entry: StageCatalogEntry, index: number, y: number): void {
    const selected = index === this.selectedIndex;
    const playable = entry.loadability === 'loadable';
    const background = this.track(this.add.rectangle(330, y, 600, 62,
      selected ? 0x344438 : 0x14221d, selected ? 0.88 : 0.62)
      .setStrokeStyle(1, selected ? 0xe7d28a : 0x74816c, selected ? 0.95 : 0.4)
      .setInteractive({ useHandCursor: true }));
    const chapter = this.service.registry.getChapter(entry.chapterId)?.title ?? entry.chapterId;
    const kind = entry.layoutKind === 'legacy'
      ? 'LEGADA'
      : entry.layoutKind === 'procedural'
        ? 'EXPERIMENTAL'
        : 'AUTORAL';
    const state = entry.loadability === 'loadable'
      ? 'DISPONÍVEL'
      : entry.loadability === 'planned' || entry.availability === 'planned'
        ? 'PLANEJADA'
        : 'BLOQUEADA';
    this.track(this.add.text(57, y - 14, chapter, {
      fontFamily: 'Georgia, serif',
      fontSize: '11px',
      color: selected ? '#f0d98a' : '#9fa58d',
      letterSpacing: 1,
    }).setOrigin(0, 0.5));
    this.track(this.add.text(57, y + 7, entry.title, {
      fontFamily: 'Georgia, serif',
      fontSize: '16px',
      color: selected ? '#fff0bd' : playable ? '#d9d4b8' : '#8b9281',
      fontStyle: 'bold',
      wordWrap: { width: 410 },
    }).setOrigin(0, 0.5));
    this.track(this.add.text(608, y, `${state}\n${kind}`, {
      fontFamily: 'Georgia, serif',
      fontSize: '10px',
      color: !playable ? '#e5a89b' : kind === 'EXPERIMENTAL' ? '#d7b6dc' : '#b4c39f',
      align: 'right',
      lineSpacing: 3,
    }).setOrigin(1, 0.5));

    background.on('pointerover', () => background
      .setFillStyle(selected ? 0x344438 : 0x28372d, selected ? 0.88 : 0.78)
      .setStrokeStyle(1, 0xe7d28a, 0.82));
    background.on('pointerout', () => background
      .setFillStyle(selected ? 0x344438 : 0x14221d, selected ? 0.88 : 0.62)
      .setStrokeStyle(1, selected ? 0xe7d28a : 0x74816c, selected ? 0.95 : 0.4));
    background.on('pointerdown', () => {
      this.selectedIndex = index;
      this.page = Math.floor(index / PAGE_SIZE);
      this.render();
    });
  }

  private renderSelectedStage(entry: StageCatalogEntry): void {
    const chapter = this.service.registry.getChapter(entry.chapterId)?.title ?? entry.chapterId;
    this.track(this.add.text(1000, 151, chapter.toLocaleUpperCase(), {
      fontFamily: 'Georgia, serif',
      fontSize: '13px',
      color: '#f0d98a',
      letterSpacing: 2,
      wordWrap: { width: 470 },
      align: 'center',
    }).setOrigin(0.5));
    this.track(this.add.text(1000, 187, entry.title, {
      fontFamily: 'Georgia, serif',
      fontSize: '24px',
      color: '#fff0bd',
      fontStyle: 'bold',
      wordWrap: { width: 470 },
      align: 'center',
    }).setOrigin(0.5));

    const loaded = entry.loadability === 'loadable' ? this.loadStage(entry.stageId) : undefined;
    const preview = resolveStagePreview(
      loaded?.loadedStage.presentation,
      textureKey => this.textures.exists(textureKey),
    );
    if (preview) {
      if (preview.tiled) {
        this.track(this.add.tileSprite(1000, 365, 460, 250, preview.textureKey, preview.frame)
          .setTileScale(3)
          .setAlpha(0.92));
      } else {
        const image = this.track(this.add.image(1000, 365, preview.textureKey, preview.frame));
        const scale = Math.min(460 / image.width, 250 / image.height);
        image.setScale(scale).setAlpha(0.92);
      }
      this.track(this.add.rectangle(1000, 365, 460, 250, 0x07100f, 0.18)
        .setStrokeStyle(1, 0x74816c, 0.44));
    } else {
      this.track(this.add.rectangle(1000, 365, 460, 250, 0x0d1915, 0.54)
        .setStrokeStyle(1, 0x74816c, 0.44));
      this.track(this.add.text(1000, 365, entry.loadability === 'loadable'
        ? 'PRÉVIA VISUAL INDISPONÍVEL'
        : 'CONTEÚDO AINDA NÃO JOGÁVEL', {
        fontFamily: 'Georgia, serif',
        fontSize: '13px',
        color: entry.loadability === 'loadable' ? '#aab39c' : '#e5a89b',
        align: 'center',
        wordWrap: { width: 400 },
      }).setOrigin(0.5));
    }

    const metadata = [
      entry.summary,
      `AMBIENTAÇÃO  ${formatCatalogLabels(entry.biomeIds)}`,
      `REGIÃO  ${formatCatalogLabels(entry.regionIds)}  ·  ${describeStageAvailability(entry)}`,
    ].join('\n');
    this.track(this.add.text(770, 512, metadata, {
      fontFamily: 'Georgia, serif',
      fontSize: '12px',
      color: '#d0d0b8',
      lineSpacing: 2,
      wordWrap: { width: 460 },
    }).setOrigin(0, 0));
    if (this.selectionError) {
      this.track(this.add.text(770, 578, this.selectionError, {
        fontFamily: 'Georgia, serif',
        fontSize: '12px',
        color: '#e5a89b',
        wordWrap: { width: 460 },
      }));
    }
  }

  private loadStage(stageId: string): GameIndividualSession | undefined {
    const cached = this.loadedStages.get(stageId);
    if (cached) return cached;
    const loaded = this.service.startIndividualStage(stageId);
    if (!loaded.ok) {
      this.selectionError = `${loaded.error.code}: ${loaded.error.message}`;
      return undefined;
    }
    this.loadedStages.set(stageId, loaded.value);
    return loaded.value;
  }

  private renderFooter(pageCount: number): void {
    const previousEnabled = this.page > 0;
    const nextEnabled = this.page < pageCount - 1;
    this.createFooterButton('◀  ANTERIOR', 220, previousEnabled, () => {
      this.page = Math.max(0, this.page - 1);
      this.selectedIndex = Math.min(this.selectedIndex, this.entries.length - 1);
      this.render();
    });
    this.createFooterButton('PRÓXIMA  ▶', 440, nextEnabled, () => {
      this.page = Math.min(pageCount - 1, this.page + 1);
      this.selectedIndex = Math.min(this.page * PAGE_SIZE, this.entries.length - 1);
      this.render();
    });
    this.createFooterButton('INICIAR FASE', 890,
      this.entries[this.selectedIndex]?.loadability === 'loadable',
      () => this.startSelectedStage());
    this.createFooterButton('VOLTAR', 1100, true, () => this.returnToMenu());
  }

  private createFooterButton(
    label: string,
    x: number,
    enabled: boolean,
    action: () => void,
  ): Phaser.GameObjects.Rectangle {
    const index = label === 'VOLTAR' ? 1 : 0;
    const background = this.track(this.add.rectangle(x, 660, 180, 42, 0x17231e, enabled ? 0.8 : 0.36));
    const text = this.track(this.add.text(x, 660, label, {
      fontFamily: 'Georgia, serif',
      fontSize: '13px',
      color: enabled ? '#d9d4b8' : '#747c6d',
      fontStyle: 'bold',
    }).setOrigin(0.5));
    this.footerFocusItems.push({ background, label: text, index, enabled });
    if (enabled) {
      background.setInteractive({ useHandCursor: true })
        .on('pointerover', () => {
          this.focusIndex = label === 'VOLTAR' ? 1 : 0;
          this.syncFooterFocus();
        })
        .on('pointerdown', action);
    }
    return background;
  }

  private syncFooterFocus(): void {
    this.footerFocusItems.forEach(item => {
      const focused = item.index === this.focusIndex && item.enabled;
      item.background
        .setFillStyle(focused ? 0x815439 : 0x17231e, item.enabled ? 0.8 : 0.36)
        .setStrokeStyle(1, focused ? 0xe7d28a : 0x827b59, item.enabled ? 0.9 : 0.3);
      item.label.setColor(!item.enabled ? '#747c6d' : focused ? '#fff0bd' : '#d9d4b8');
    });
  }

  private startSelectedStage(): void {
    const entry = this.entries[this.selectedIndex];
    if (!entry || entry.loadability !== 'loadable') return;
    const session = this.loadStage(entry.stageId);
    if (!session) {
      this.render();
      return;
    }
    this.scene.start('GameScene', {
      individualRuntime: {
        stageId: session.stageId,
        loadedStage: session.loadedStage,
        composition: session.composition,
      },
    });
  }

  private track<T extends Phaser.GameObjects.GameObject>(item: T): T {
    this.content.push(item);
    return item;
  }

  private returnToMenu(): void {
    if (this.transitioning) return;
    this.transitioning = true;
    this.cameras.main.fadeOut(200, 3, 7, 6);
    this.time.delayedCall(200, () => this.scene.start('MenuScene'));
  }
}
