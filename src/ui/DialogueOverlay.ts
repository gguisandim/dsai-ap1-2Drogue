import Phaser from 'phaser';
import type { GameNarrativeSession } from '../application/stages/GameStageCompositionRoot';
import type { DialogueSession, DialogueTurn } from '../narrative';

export interface DialogueOverlayHooks {
  readonly onOpen: () => void;
  readonly onClose: () => void;
}

/**
 * Minimal, reusable dialogue panel. It never implements dialogue rules of its
 * own: it renders turns and completion produced by the existing DialogueEngine
 * (through GameNarrativeSession) and reports open/close to the scene so combat
 * can pause.
 */
export class DialogueOverlay {
  private readonly container: Phaser.GameObjects.Container;
  private readonly speakerText: Phaser.GameObjects.Text;
  private readonly bodyText: Phaser.GameObjects.Text;
  private readonly hintText: Phaser.GameObjects.Text;
  private session?: DialogueSession;
  private dialogueId?: string;
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
    const panel = scene.add.rectangle(width / 2, height - 150, Math.min(width - 80, 960), 190, 0x0b0a14, 0.96)
      .setStrokeStyle(3, 0xd9b45a);
    this.speakerText = scene.add.text(120, height - 232, '', {
      fontFamily: 'Courier New, monospace',
      fontSize: '17px',
      color: '#f2cf72',
      fontStyle: 'bold',
    });
    this.bodyText = scene.add.text(120, height - 200, '', {
      fontFamily: 'Georgia, serif',
      fontSize: '19px',
      color: '#f1e9f7',
      lineSpacing: 6,
      wordWrap: { width: Math.min(width - 200, 880) },
    });
    this.hintText = scene.add.text(width - 70, height - 72, 'E — continuar   •   ESC — fechar', {
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
    if (!started.ok) return false;
    this.dialogueId = dialogueId;
    this.session = undefined;
    this.renderTurn(started.value);
    this.setOpen(true);
    return true;
  }

  public advance(): void {
    if (!this.session) {
      this.close();
      return;
    }
    const next = this.narrative.advanceDialogue(this.session);
    if (!next.ok) {
      this.close();
      return;
    }
    if (next.value.status === 'completed') {
      this.narrative.completeDialogue(next.value.dialogueId);
      this.close();
      return;
    }
    this.renderTurn(next.value);
  }

  public close(): void {
    const wasOpen = this.open;
    this.session = undefined;
    this.dialogueId = undefined;
    this.setOpen(false);
    if (wasOpen) this.hooks.onClose();
  }

  private renderTurn(turn: DialogueTurn): void {
    this.session = turn.session;
    this.speakerText.setText(this.speakerName(String(turn.node.speakerId)));
    this.bodyText.setText(turn.node.text);
    this.hintText.setText(turn.choices.length > 0 ? 'Escolha indisponível — E para continuar' : 'E — continuar   •   ESC — fechar');
  }

  private setOpen(open: boolean): void {
    const wasOpen = this.open;
    this.open = open;
    this.container.setVisible(open);
    if (open && !wasOpen) this.hooks.onOpen();
  }

  public getDialogueId(): string | undefined {
    return this.dialogueId;
  }

  public destroy(): void {
    this.container.destroy(true);
    this.session = undefined;
    this.dialogueId = undefined;
    this.open = false;
  }
}
