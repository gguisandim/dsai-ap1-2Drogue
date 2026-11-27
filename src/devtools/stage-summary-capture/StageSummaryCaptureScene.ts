import Phaser from 'phaser';
import { GameSessionService } from '../../application/stages';
import { StageMapRenderer } from '../../presentation/stages/StageMapRenderer';

const CAPTURE_WIDTH = 460;
const CAPTURE_HEIGHT = 250;
const CAPTURE_FOCUS: Readonly<Record<string, { x: number; y: number }>> = {
  level_01_forgotten_passage: { x: 22.5, y: 8.5 },
};

interface StageSummaryCaptureData {
  readonly stageId: string;
  readonly presentationVariantId?: string;
}

interface StageSummaryCaptureState {
  readonly status: 'rendering' | 'ready' | 'error';
  readonly stageId: string;
  readonly presentationVariantId?: string;
  readonly title?: string;
  readonly renderer?: 'webgl' | 'canvas';
  readonly renderSetupMs?: number;
  readonly error?: string;
}

declare global {
  interface Window {
    __UMBRA_STAGE_SUMMARY_CAPTURE__?: StageSummaryCaptureState;
  }
}

export class StageSummaryCaptureScene extends Phaser.Scene {
  private captureData!: StageSummaryCaptureData;

  public constructor() {
    super({ key: 'StageSummaryCaptureScene' });
  }

  public init(data: StageSummaryCaptureData): void {
    this.captureData = data;
  }

  public create(): void {
    const { stageId, presentationVariantId } = this.captureData;
    this.setCaptureState({ status: 'rendering', stageId, presentationVariantId });
    const service = new GameSessionService();
    const started = service.startIndividualStage(stageId, {
      ...(presentationVariantId ? { presentationVariantId } : {}),
    });
    if (!started.ok) {
      this.fail(`${started.error.code}: ${started.error.message}`);
      return;
    }

    try {
      const loaded = started.value.loadedStage;
      const { level, presentation } = loaded;
      if (!presentation) {
        this.fail(`Resolved stage presentation is missing: ${stageId}.`);
        return;
      }
      const mapWidth = (level.tileMap[0]?.length ?? 0) * presentation.tileSize;
      const mapHeight = level.tileMap.length * presentation.tileSize;
      const camera = this.cameras.main
        .setViewport(0, 0, CAPTURE_WIDTH, CAPTURE_HEIGHT)
        .setRoundPixels(true);
      camera.setBounds(
        0,
        0,
        Math.max(CAPTURE_WIDTH, mapWidth),
        Math.max(CAPTURE_HEIGHT, mapHeight),
      );
      const focus = CAPTURE_FOCUS[stageId];
      camera.centerOn(
        focus ? focus.x * presentation.tileSize : mapWidth / 2,
        focus ? focus.y * presentation.tileSize : mapHeight / 2,
      );

      const renderStartedAt = performance.now();
      new StageMapRenderer().render(
        this,
        level,
        presentation,
        this.physics.add.staticGroup(),
        false,
      );
      const renderSetupMs = performance.now() - renderStartedAt;

      this.time.delayedCall(100, () => {
        this.setCaptureState({
          status: 'ready',
          stageId,
          presentationVariantId,
          title: loaded.manifest.title,
          renderer: this.game.renderer.type === Phaser.WEBGL ? 'webgl' : 'canvas',
          renderSetupMs,
        });
      });
    } catch (error) {
      this.fail(error instanceof Error ? error.message : String(error));
    }
  }

  private fail(error: string): void {
    this.setCaptureState({
      status: 'error',
      stageId: this.captureData.stageId,
      presentationVariantId: this.captureData.presentationVariantId,
      error,
    });
    console.error('Stage summary capture failed.', error);
  }

  private setCaptureState(state: StageSummaryCaptureState): void {
    globalThis.window.__UMBRA_STAGE_SUMMARY_CAPTURE__ = Object.freeze(state);
  }
}
