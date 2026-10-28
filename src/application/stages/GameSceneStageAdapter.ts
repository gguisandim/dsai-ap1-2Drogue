import type { LevelDefinition } from '../../data/LevelData';
import type {
  LoadedStage,
  StageLoadFailure,
  StageLoadRequest,
  StageLoadResult,
} from '../../stages';

export const INCREMENTAL_MODULAR_STAGE_ID = 'verse_01_atrium';

export interface StageLoaderPort {
  load(request: StageLoadRequest): StageLoadResult;
}

export interface GameSceneStageRequest {
  readonly enabled: boolean;
  readonly legacyLevel: LevelDefinition;
  readonly runId: string;
  readonly runSeed: string | number;
}

export type GameSceneStageResolution =
  | {
      readonly source: 'legacy';
      readonly level: LevelDefinition;
    }
  | {
      readonly source: 'modular';
      readonly level: LevelDefinition;
      readonly loadedStage: LoadedStage;
    }
  | {
      readonly source: 'rollback';
      readonly level: LevelDefinition;
      readonly failure: StageLoadFailure;
    };

export class GameSceneStageAdapter {
  public constructor(private readonly loader: StageLoaderPort) {}

  public resolve(request: GameSceneStageRequest): GameSceneStageResolution {
    if (!request.enabled || request.legacyLevel.id !== INCREMENTAL_MODULAR_STAGE_ID) {
      return Object.freeze({ source: 'legacy' as const, level: request.legacyLevel });
    }
    let result: StageLoadResult;
    try {
      result = this.loader.load({
        stageId: request.legacyLevel.id,
        runId: request.runId,
        runSeed: request.runSeed,
      });
    } catch (error) {
      return this.rollback(request.legacyLevel, 'load-failed', `Stage loader threw: ${this.message(error)}`);
    }
    if (!result.ok) {
      return Object.freeze({ source: 'rollback' as const, level: request.legacyLevel, failure: result.error });
    }
    if (result.value.manifest.id !== request.legacyLevel.id ||
      result.value.level.id !== request.legacyLevel.id) {
      return this.rollback(
        request.legacyLevel,
        'invalid-reference',
        'Loaded stage identity does not match the selected legacy stage.',
      );
    }
    return Object.freeze({
      source: 'modular' as const,
      level: result.value.level,
      loadedStage: result.value,
    });
  }

  private rollback(
    level: LevelDefinition,
    code: StageLoadFailure['code'],
    message: string,
  ): GameSceneStageResolution {
    const failure: StageLoadFailure = Object.freeze({
      code,
      stageId: level.id,
      diagnostics: Object.freeze([Object.freeze({
        code: 'stage.application.rollback',
        severity: 'error' as const,
        message,
        path: Object.freeze(['application', 'stage']),
        stageId: level.id,
      })]),
    });
    return Object.freeze({ source: 'rollback' as const, level, failure });
  }

  private message(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}
