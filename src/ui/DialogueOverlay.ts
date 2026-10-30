import Phaser from 'phaser';
import type { GameNarrativeSession } from '../application/stages/GameStageCompositionRoot';
import type { DialogueChoiceView, DialogueSession, DialogueTurn } from '../narrative';

export interface DialogueOverlayHooks {
  readonly onOpen: () => void;
  readonly onClose: () => void;
  /** Returns false when a committed external consequence still needs retry. */
  readonly onNarrativeCommitted: () => boolean;
}

/**
 * Minimal, reusable dialogue panel. It never implements dialogue rules of its
 * own: it renders turns/choices produced by the existing DialogueEngine (via
 * GameNarrativeSession) and commits each turn's commands atomically through the
 * existing NarrativeEventProcessor.
 */
export class DialogueOverlay {
  private readonly container: Phaser.GameObjects.Container;
  private readonly speakerText: Phaser.GameObjects.Text;
  private readonly bodyText: Phaser.GameObjects.Text;
  private readonly hintText: Phaser.GameObjects.Text;
  private readonly choiceTexts: Phaser.GameObjects.Text[] = [];
  private session?: DialogueSession;
  private dialogueId?: string;
  private choices: readonly DialogueChoiceView[] = [];
  private choiceIndex = 0;
  private pendingTurn?: DialogueTurn;
  private errorHint?: string;
  private open = false;

  public constructor(
    private readonly scene: Phaser.Scene,
    private readonly narrative: GameNarrativeSession,
    private readonly speakerName: (speakerId: string) => string,
    private readonly hooks: DialogueOverlayHooks,
  ) {
    const width = scene.cameras.main.width;
    const height = scene.cameras.main.height;
    this.container = scene.add.container(0, 0).setScrollFactor(0).setDepth(1100).setVisible(false);
    const panel = scene.add.rectangle(width / 2, height - 160, Math.min(width - 80, 960), 240, 0x0b0a14, 0.96)
      .setStrokeStyle(3, 0xd9b45a);
    this.speakerText = scene.add.text(120, height - 262, '', {
      fontFamily: 'Courier New, monospace',
      fontSize: '17px',
      color: '#f2cf72',
      fontStyle: 'bold',
    });
    this.bodyText = scene.add.text(120, height - 232, '', {
      fontFamily: 'Georgia, serif',
      fontSize: '19px',
      color: '#f1e9f7',
      lineSpacing: 6,
      wordWrap: { width: Math.min(width - 200, 880) },
    });
    this.hintText = scene.add.text(width - 70, height - 62, '', {
      fontFamily: 'Courier New, monospace',
      fontSize: '13px',
      color: '#a68fb8',
    }).setOrigin(1, 1);
    this.container.add([panel, this.speakerText, this.bodyText, this.hintText]);
  }

  public isOpen(): boolean {
    return this.open;
  }

  public openDialogue(dialogueId: string): boolean {
    const started = this.narrative.startDialogue(dialogueId);
    if (!started.ok) {
      this.showError(`DIÁLOGO INDISPONÍVEL: ${started.error.code}`);
      return false;
    }
    this.dialogueId = dialogueId;
    this.session = undefined;
    this.setOpen(true);
    this.commitTurn(started.value);
    return true;
  }

  /** `E`: confirm the selected choice, retry a failed commit, or advance. */
  public confirm(): void {
    if (this.pendingTurn) {
      this.commitTurn(this.pendingTurn);
      return;
    }
    if (this.choices.length > 0) {
      this.selectChoice(this.choices[this.choiceIndex].id);
      return;
    }
    if (!this.session) {
      this.close();
      return;
    }
    const next = this.narrative.advanceDialogue(this.session);
    if (!next.ok) {
      this.showError(`DIÁLOGO INVÁLIDO: ${next.error.code}`);
      return;
    }
    if (next.value.status === 'completed') {
      const done = this.narrative.completeDialogue(next.value.dialogueId);
      if (!done.ok) {
        this.showError(`FALHA AO CONCLUIR: ${done.error.code}`);
        return;
      }
      if (!this.hooks.onNarrativeCommitted()) {
        this.showError('RECOMPENSA PENDENTE — E para tentar novamente');
        return;
      }
      this.close();
      return;
    }
    this.commitTurn(next.value);
  }

  /** Arrow navigation; wraps around the available choices. */
  public moveSelection(delta: number): void {
    if (this.choices.length === 0 || this.pendingTurn) return;
    const size = this.choices.length;
    this.choiceIndex = ((this.choiceIndex + delta) % size + size) % size;
    this.renderChoices();
  }

  public close(): void {
    const wasOpen = this.open;
    this.session = undefined;
    this.dialogueId = undefined;
    this.choices = [];
    this.choiceIndex = 0;
    this.pendingTurn = undefined;
    this.errorHint = undefined;
    this.clearChoices();
    this.setOpen(false);
    if (wasOpen) this.hooks.onClose();
  }

  public destroy(): void {
    this.container.destroy(true);
    this.session = undefined;
    this.dialogueId = undefined;
    this.open = false;
  }

  public getDialogueId(): string | undefined {
    return this.dialogueId;
  }

  private selectChoice(choiceId: string): void {
    if (!this.session) return;
    const chosen = this.narrative.chooseDialogue(this.session, choiceId);
    if (!chosen.ok) {
      this.showError(`ESCOLHA INVÁLIDA: ${chosen.error.code}`);
      return;
    }
    this.commitTurn(chosen.value);
  }

  private commitTurn(turn: DialogueTurn): void {
    this.errorHint = undefined;
    const outcome = this.narrative.applyDialogueTurn(turn);
    if (!outcome.ok) {
      this.pendingTurn = turn;
      this.renderTurn(turn);
      this.showError(`FALHA AO APLICAR: ${outcome.error.code} — E para tentar novamente`);
      return;
    }
    if (!this.hooks.onNarrativeCommitted()) {
      this.pendingTurn = turn;
      this.renderTurn(turn);
      this.showError('RECOMPENSA PENDENTE — E para tentar novamente');
      return;
    }
    this.pendingTurn = undefined;
    this.renderTurn(turn);
  }

  private renderTurn(turn: DialogueTurn): void {
    this.session = turn.session;
    this.speakerText.setText(this.speakerName(String(turn.node.speakerId)));
    this.bodyText.setText(turn.node.text);
    this.choices = turn.choices;
    this.choiceIndex = 0;
    this.renderChoices();
  }

  private renderChoices(): void {
    this.clearChoices();
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    const startY = height - 178;
    this.choices.forEach((choice, index) => {
      const selected = index === this.choiceIndex;
      const text = this.scene.add.text(140, startY + index * 24, `${selected ? '▶ ' : '  '}${choice.text}`, {
        fontFamily: 'Georgia, serif',
        fontSize: '17px',
        color: selected ? '#fff2b0' : '#cbb8d4',
        wordWrap: { width: Math.min(width - 240, 820) },
      });
      this.container.add(text);
      this.choiceTexts.push(text);
    });
    this.updateHint();
  }

  private clearChoices(): void {
    for (const text of this.choiceTexts) text.destroy();
    this.choiceTexts.length = 0;
  }

  private updateHint(): void {
    const hint = this.errorHint
      ?? (this.choices.length > 0
        ? '↑/↓ escolher   •   E confirmar   •   ESC fechar'
        : 'E — continuar   •   ESC — fechar');
    this.hintText.setText(hint);
    this.hintText.setColor(this.errorHint ? '#ff8a9a' : '#a68fb8');
  }

  private showError(message: string): void {
    this.errorHint = message;
    this.updateHint();
  }

  private setOpen(open: boolean): void {
    const wasOpen = this.open;
    this.open = open;
    this.container.setVisible(open);
    if (open && !wasOpen) this.hooks.onOpen();
  }
}
