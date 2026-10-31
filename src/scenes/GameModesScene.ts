import Phaser from 'phaser';
import {
  GameSessionService,
  createBrowserCampaignSaveStorage,
  type GameComposedSession,
  type GameIndividualStageView,
  type GameSessionFailure,
  type GameSessionMenuState,
} from '../application/stages';
import { FIXED_NINE_COMPOSITION_SLOTS } from '../stages';
import { ProgressionService } from '../progression';
import type { GameSceneCampaignRuntime } from './GameScene';

type GameMode = 'campaign-random' | 'campaign-custom' | 'campaign-classic' | 'stage-individual';

const MODE_LABELS: Readonly<Record<GameMode, string>> = Object.freeze({
  'campaign-random': 'CAMPANHA ALEATÓRIA',
  'campaign-custom': 'CAMPANHA PERSONALIZADA',
  'campaign-classic': 'CAMPANHA CLÁSSICA',
  'stage-individual': 'JOGAR FASE',
});

const PAGE_SIZE = 8;

function generateSeed(): string {
  const cryptoValue = globalThis.crypto as Crypto | undefined;
  if (cryptoValue && typeof cryptoValue.randomUUID === 'function') {
    return `seed.${cryptoValue.randomUUID()}`;
  }
  return `seed.${Date.now().toString(36)}`;
}

function failureMessage(error: GameSessionFailure): string {
  const details = error.composition?.diagnostics.slice(0, 3).map(item => `• ${item.message}`) ?? [];
  const stage = error.stage?.diagnostics.slice(0, 2).map(item => `• ${item.message}`) ?? [];
  const save = error.save ? [`• ${error.save.code}: ${error.save.message}`] : [];
  return [`FALHA: ${error.code}`, error.message, ...details, ...stage, ...save].join('\n');
}

/** Thin Phaser renderer over the headless GameSessionService. */
export class GameModesScene extends Phaser.Scene {
  private service!: GameSessionService;
  private menuState!: GameSessionMenuState;
  private mode: GameMode = 'campaign-random';
  private content: Phaser.GameObjects.GameObject[] = [];
  private modeButtons: Array<{ readonly mode: GameMode; readonly background: Phaser.GameObjects.Rectangle;
    readonly label: Phaser.GameObjects.Text }> = [];
  private seed = '';
  private seedText?: Phaser.GameObjects.Text;
  private feedback?: Phaser.GameObjects.Text;
  private individualPage = 0;
  private customPage = 0;
  private selectedSlot?: string;
  private readonly customSelections = new Map<string, string>();

  public constructor() {
    super('GameModesScene');
  }

  public create(): void {
    this.service = new GameSessionService({ storage: createBrowserCampaignSaveStorage() });
    this.menuState = this.service.menuState();
    const savedCampaign = this.menuState.savedCampaign;
    this.seed = savedCampaign?.status === 'active' ? savedCampaign.seed : generateSeed();
    this.customSelections.clear();
    savedCampaign?.assignments.forEach(assignment => {
      this.customSelections.set(assignment.slotId, assignment.stageId);
    });
    this.cameras.main.setBackgroundColor('#100b18');
    this.add.rectangle(640, 360, 1280, 720, 0x1b1226, 1);
    this.add.text(640, 54, 'MODOS DE JOGO', {
      fontFamily: 'Courier New, monospace', fontSize: '40px', color: '#f6d77a', fontStyle: 'bold',
      stroke: '#3e214f', strokeThickness: 6,
    }).setOrigin(0.5);

    (Object.keys(MODE_LABELS) as GameMode[]).forEach((mode, index) => {
      const availability = this.menuState.modes.find(item => item.mode === mode);
      const background = this.add.rectangle(310, 160 + index * 92, 430, 72, 0x2d2038, 1)
        .setStrokeStyle(3, mode === this.mode ? 0xf6d77a : 0x765683)
        .setInteractive({ useHandCursor: true });
      const label = this.add.text(310, 160 + index * 92, MODE_LABELS[mode], {
        fontFamily: 'Courier New, monospace', fontSize: '18px',
        color: availability?.enabled === false ? '#8e7f99' : '#decfe5', fontStyle: 'bold',
        align: 'center',
      }).setOrigin(0.5);
      background.on('pointerdown', () => {
        this.mode = mode;
        this.syncModeButtons();
        this.renderContent();
      });
      this.modeButtons.push({ mode, background, label });
    });

    const back = this.add.text(640, 682, '[ VOLTAR AO MENU ]', {
      fontFamily: 'Courier New, monospace', fontSize: '18px', color: '#decfe5',
      backgroundColor: '#2d2038', padding: { x: 12, y: 6 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => this.scene.start('MenuScene'));

    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => this.handleKey(event));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard?.removeAllListeners('keydown');
    });

    this.syncModeButtons();
    this.renderContent();
  }

  private syncModeButtons(): void {
    this.modeButtons.forEach(button => {
      const selected = button.mode === this.mode;
      const availability = this.menuState.modes.find(item => item.mode === button.mode);
      button.background.setStrokeStyle(3, selected ? 0xf6d77a : 0x765683);
      button.background.setFillStyle(selected ? 0x3d2a48 : 0x2d2038);
      button.label.setAlpha(availability?.enabled === false ? 0.55 : 1);
    });
  }

  private handleKey(event: KeyboardEvent): void {
    if (this.mode !== 'campaign-random') return;
    if (event.key === 'Backspace') {
      this.seed = this.seed.slice(0, -1);
      this.seedText?.setText(this.seed || '—');
      return;
    }
    if (event.key === 'Enter') {
      this.startRandom();
      return;
    }
    if (event.key.length === 1 && /[a-zA-Z0-9._-]/.test(event.key)) {
      this.seed = `${this.seed}${event.key}`;
      this.seedText?.setText(this.seed || '—');
    }
  }

  private clearContent(): void {
    this.content.forEach(item => item.destroy());
    this.content = [];
    this.seedText = undefined;
    this.feedback = undefined;
  }

  private track<T extends Phaser.GameObjects.GameObject>(item: T): T {
    this.content.push(item);
    return item;
  }

  private renderContent(): void {
    this.clearContent();
    if (this.mode === 'campaign-random') this.renderRandom();
    else if (this.mode === 'campaign-custom') this.renderCustom();
    else if (this.mode === 'campaign-classic') this.renderClassic();
    else this.renderIndividual();
  }

  private panelTitle(text: string): void {
    this.track(this.add.text(760, 108, text, {
      fontFamily: 'Courier New, monospace', fontSize: '24px', color: '#f6d77a', fontStyle: 'bold',
    }).setOrigin(0.5));
  }

  private availabilityReason(mode: GameMode): string | undefined {
    return this.menuState.modes.find(item => item.mode === mode)?.reason;
  }

  private button(
    x: number, y: number, label: string, action: () => void, enabled = true,
  ): Phaser.GameObjects.Rectangle {
    const background = this.track(this.add.rectangle(x, y, 380, 48, enabled ? 0x9b3f68 : 0x2d2038, 1)
      .setStrokeStyle(2, enabled ? 0xf6d77a : 0x4a3a55));
    this.track(this.add.text(x, y, label, {
      fontFamily: 'Courier New, monospace', fontSize: '17px',
      color: enabled ? '#fff1b8' : '#8e7f99', fontStyle: 'bold',
    }).setOrigin(0.5));
    if (enabled) background.setInteractive({ useHandCursor: true }).on('pointerdown', action);
    return background;
  }

  private renderRandom(): void {
    this.panelTitle('CAMPANHA ALEATÓRIA');
    const reason = this.availabilityReason('campaign-random');
    this.track(this.add.text(760, 150, [
      `Fases candidatas: ${this.menuState.candidateStageCount} / ${this.menuState.requiredStageCount}`,
      reason ? `Indisponível: ${reason}` : 'Composição validada com o catálogo real.',
      this.menuState.savedCampaign?.status === 'completed'
        ? `Campanha anterior concluída em ${this.menuState.savedCampaign.currentStageId}.`
        : this.menuState.savedCampaign
          ? `Retomada disponível: ${this.menuState.savedCampaign.currentStageId}`
          : 'Nenhuma campanha composta salva.',
      ...(this.menuState.savedCampaignError
        ? [`Save composto inválido: ${this.menuState.savedCampaignError}`]
        : []),
    ].join('\n'), {
      fontFamily: 'Courier New, monospace', fontSize: '14px', color: '#b89dc7',
      wordWrap: { width: 420 }, lineSpacing: 4,
    }).setOrigin(0.5, 0));

    this.track(this.add.text(760, 250, 'SEED', {
      fontFamily: 'Courier New, monospace', fontSize: '14px', color: '#b89dc7',
    }).setOrigin(0.5));
    this.seedText = this.track(this.add.text(760, 280, this.seed || '—', {
      fontFamily: 'Courier New, monospace', fontSize: '18px', color: '#fff1b8',
      backgroundColor: '#241a30', padding: { x: 10, y: 6 },
    }).setOrigin(0.5));
    this.track(this.add.text(760, 308, 'Digite para editar a seed; Enter inicia.', {
      fontFamily: 'Courier New, monospace', fontSize: '12px', color: '#75667e',
    }).setOrigin(0.5));

    this.button(760, 370, 'GERAR NOVA SEED', () => {
      this.seed = generateSeed();
      this.seedText?.setText(this.seed);
    });
    this.button(760, 432, 'INICIAR CAMPANHA', () => this.startRandom(),
      this.menuState.randomCampaignAvailable);
    if (this.menuState.savedCampaign?.status === 'active') {
      this.button(760, 494, 'RETOMAR CAMPANHA SALVA', () => {
        this.seed = this.menuState.savedCampaign?.seed ?? this.seed;
        this.startRandom();
      }, this.menuState.randomCampaignAvailable);
    }
    this.renderFeedback(760, 560);
  }

  private renderFeedback(x: number, y: number): void {
    this.feedback = this.track(this.add.text(x, y, '', {
      fontFamily: 'Courier New, monospace', fontSize: '13px', color: '#e0a4a4',
      wordWrap: { width: 420 }, align: 'center', lineSpacing: 3,
    }).setOrigin(0.5, 0));
  }

  private startRandom(): void {
    const started = this.service.startRandomCampaign(this.seed);
    if (!started.ok) {
      this.feedback?.setText(failureMessage(started.error));
      return;
    }
    this.startComposed(started.value);
  }

  private startComposed(session: GameComposedSession): void {
    const runtime: GameSceneCampaignRuntime = Object.freeze({
      campaignId: session.campaignId,
      runId: session.runId,
      runSeed: session.runSeed,
      composition: session.composition,
      router: session.router,
      navigation: session.navigation,
      progression: new ProgressionService(),
    });
    this.scene.start('GameScene', { campaignRuntime: runtime });
  }

  private renderIndividual(): void {
    this.panelTitle('JOGAR FASE');
    const stages = this.menuState.individualStages;
    const pageCount = Math.max(1, Math.ceil(stages.length / PAGE_SIZE));
    const page = Math.min(this.individualPage, pageCount - 1);
    const pageStages = stages.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
    if (stages.length === 0) {
      this.track(this.add.text(760, 200, 'Nenhuma fase disponível no catálogo real.', {
        fontFamily: 'Courier New, monospace', fontSize: '15px', color: '#b89dc7',
      }).setOrigin(0.5));
      this.renderFeedback(760, 560);
      return;
    }
    pageStages.forEach((stage, index) => this.renderIndividualRow(stage, 150 + index * 46));
    this.track(this.add.text(760, 540, `${page + 1} / ${pageCount}`, {
      fontFamily: 'Courier New, monospace', fontSize: '13px', color: '#b89dc7',
    }).setOrigin(0.5));
    this.button(620, 590, '◀ ANTERIOR', () => {
      this.individualPage = Math.max(0, page - 1);
      this.renderContent();
    }, page > 0);
    this.button(900, 590, 'PRÓXIMA ▶', () => {
      this.individualPage = Math.min(pageCount - 1, page + 1);
      this.renderContent();
    }, page < pageCount - 1);
    this.renderFeedback(760, 640);
  }

  private renderIndividualRow(stage: GameIndividualStageView, y: number): void {
    const enabled = stage.enabled;
    const background = this.track(this.add.rectangle(760, y, 520, 40,
      enabled ? 0x2d2038 : 0x241a30, 1).setStrokeStyle(1, enabled ? 0x765683 : 0x3a2d45));
    const detail = [
      stage.chapterId,
      stage.biomeIds.join('/') || 'sem bioma',
      stage.difficulty ? `dificuldade ${stage.difficulty.minimum}-${stage.difficulty.maximum}` : 'dificuldade —',
      enabled ? '' : stage.reason ?? 'indisponível',
    ].filter(Boolean).join('  •  ');
    this.track(this.add.text(515, y - 8, `${stage.title} (${stage.stageId})`, {
      fontFamily: 'Courier New, monospace', fontSize: '14px',
      color: enabled ? '#decfe5' : '#8e7f99',
    }).setOrigin(0, 0.5));
    this.track(this.add.text(515, y + 9, detail, {
      fontFamily: 'Courier New, monospace', fontSize: '11px', color: '#8e7f99',
    }).setOrigin(0, 0.5));
    if (enabled) {
      background.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
        const started = this.service.startIndividualStage(stage.stageId);
        if (!started.ok) {
          this.feedback?.setText(failureMessage(started.error));
          return;
        }
        this.scene.start('GameScene', {
          individualRuntime: {
            stageId: started.value.stageId,
            loadedStage: started.value.loadedStage,
            composition: started.value.composition,
          },
        });
      });
    }
  }

  private renderCustom(): void {
    this.panelTitle('CAMPANHA PERSONALIZADA');
    const reason = this.availabilityReason('campaign-custom');
    this.track(this.add.text(760, 145, reason
      ? `Indisponível: ${reason}`
      : 'Escolha uma fase para cada posição. A validação usa o compositor.', {
      fontFamily: 'Courier New, monospace', fontSize: '13px',
      color: reason ? '#e0a4a4' : '#b89dc7', wordWrap: { width: 430 }, align: 'center',
    }).setOrigin(0.5, 0));
    FIXED_NINE_COMPOSITION_SLOTS.forEach((slot, index) => {
      const selected = this.customSelections.get(slot.slotId);
      const active = this.selectedSlot === slot.slotId;
      const row = this.track(this.add.rectangle(760, 184 + index * 38, 440, 32,
        active ? 0x3d2a48 : 0x241a30, 1).setStrokeStyle(1, active ? 0xf6d77a : 0x4a3a55)
        .setInteractive({ useHandCursor: true }));
      row.on('pointerdown', () => {
        this.selectedSlot = slot.slotId;
        if (selected) this.customSelections.delete(slot.slotId);
        this.renderContent();
      });
      this.track(this.add.text(552, 184 + index * 38, `${slot.actId} · ${slot.slotId}`, {
        fontFamily: 'Courier New, monospace', fontSize: '12px', color: '#b89dc7',
      }).setOrigin(0, 0.5));
      this.track(this.add.text(968, 184 + index * 38, selected ?? '—', {
        fontFamily: 'Courier New, monospace', fontSize: '12px',
        color: selected ? '#fff1b8' : '#75667e',
      }).setOrigin(1, 0.5));
    });
    this.track(this.add.text(300, 560, 'Clique num slot para limpá-lo e escolha uma fase abaixo.', {
      fontFamily: 'Courier New, monospace', fontSize: '11px', color: '#75667e',
      wordWrap: { width: 560 }, align: 'center',
    }).setOrigin(0.5, 0));
    this.renderCustomCandidates();
    this.button(760, 620, 'VALIDAR SELEÇÃO', () => this.validateCustom(),
      this.menuState.randomCampaignAvailable);
    this.button(760, 676, 'INICIAR PERSONALIZADA', () => this.startCustom(),
      this.menuState.randomCampaignAvailable && this.customSelections.size === FIXED_NINE_COMPOSITION_SLOTS.length);
    this.renderFeedback(1100, 560);
  }

  private renderCustomCandidates(): void {
    const stages = this.menuState.individualStages.filter(item => item.enabled &&
      (item.eligibility === 'campaign-eligible' || item.eligibility === 'narrative-reserved'));
    const pageCount = Math.max(1, Math.ceil(stages.length / PAGE_SIZE));
    const page = Math.min(this.customPage, pageCount - 1);
    const pageStages = stages.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
    this.track(this.add.text(1100, 150, 'FASES ELEGÍVEIS', {
      fontFamily: 'Courier New, monospace', fontSize: '15px', color: '#f6d77a', fontStyle: 'bold',
    }).setOrigin(0.5));
    pageStages.forEach((stage, index) => {
      const y = 184 + index * 38;
      const background = this.track(this.add.rectangle(1100, y, 300, 32, 0x2d2038, 1)
        .setStrokeStyle(1, 0x765683).setInteractive({ useHandCursor: true }));
      this.track(this.add.text(960, y, stage.title, {
        fontFamily: 'Courier New, monospace', fontSize: '12px', color: '#decfe5',
      }).setOrigin(0, 0.5));
      background.on('pointerdown', () => {
        const target = this.selectedSlot ?? FIXED_NINE_COMPOSITION_SLOTS
          .find(slot => !this.customSelections.has(slot.slotId))?.slotId;
        if (!target) return;
        this.customSelections.set(target, stage.stageId);
        this.selectedSlot = undefined;
        this.renderContent();
      });
    });
    this.track(this.add.text(1100, 510, `${page + 1} / ${pageCount}`, {
      fontFamily: 'Courier New, monospace', fontSize: '12px', color: '#b89dc7',
    }).setOrigin(0.5));
    this.button(1010, 540, '◀', () => {
      this.customPage = Math.max(0, page - 1);
      this.renderContent();
    }, page > 0);
    this.button(1190, 540, '▶', () => {
      this.customPage = Math.min(pageCount - 1, page + 1);
      this.renderContent();
    }, page < pageCount - 1);
  }

  private customSelectionList() {
    return FIXED_NINE_COMPOSITION_SLOTS.flatMap(slot => {
      const stageId = this.customSelections.get(slot.slotId);
      return stageId ? [{ slotId: slot.slotId, stageId }] : [];
    });
  }

  private validateCustom(): void {
    const validated = this.service.previewCustomCampaign(this.customSelectionList(), this.seed);
    this.feedback?.setText(validated.ok
      ? `Seleção válida: ${validated.value.snapshot.assignments.length} fases.`
      : failureMessage(validated.error));
    if (this.feedback) this.feedback.setColor(validated.ok ? '#a8e0a4' : '#e0a4a4');
  }

  private startCustom(): void {
    const started = this.service.startCustomCampaign(this.customSelectionList(), this.seed);
    if (!started.ok) {
      this.feedback?.setText(failureMessage(started.error));
      return;
    }
    this.startComposed(started.value);
  }

  private renderClassic(): void {
    this.panelTitle('CAMPANHA CLÁSSICA');
    this.track(this.add.text(760, 190, [
      'Fluxo macro legado preservado.',
      'Usa o hub, as rotas e os saves existentes.',
      'Não compartilha snapshot com a campanha composta.',
    ].join('\n'), {
      fontFamily: 'Courier New, monospace', fontSize: '15px', color: '#b89dc7',
      align: 'center', lineSpacing: 6,
    }).setOrigin(0.5, 0));
    this.button(760, 340, 'INICIAR CAMPANHA CLÁSSICA', () => {
      this.scene.start('GameScene', { macroCampaign: true });
    });
    this.renderFeedback(760, 430);
  }
}
