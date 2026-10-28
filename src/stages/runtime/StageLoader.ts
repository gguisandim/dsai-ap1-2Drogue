import type { LevelDefinition } from '../../data/LevelData';
import { cloneLevelDefinition } from '../compatibility/LevelDefinitionCopy';
import { LegacyLevelAdapter } from '../compatibility/LegacyLevelAdapter';
import { ProceduralStageAdapter } from '../compatibility/ProceduralStageAdapter';
import type {
  LoadedStage,
  StageDiagnostic,
  StageLoadFailure,
  StageLoadFailureCode,
  StageLoadRequest,
  StageLoadResult,
  StageManifest,
  StageModule,
} from '../contracts';
import { StageRegistry } from './StageRegistry';
import { StageValidator } from './StageValidator';
import { ResolvedLevelValidator } from './ResolvedLevelValidator';

export interface StageLoaderOptions {
  readonly legacy?: LegacyLevelAdapter;
  readonly procedural?: ProceduralStageAdapter;
}

function cloneData<T>(value: T): T {
  if (Array.isArray(value)) return value.map(entry => cloneData(entry)) as T;
  if (value && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    Object.entries(value as Record<string, unknown>).forEach(([key, entry]) => {
      result[key] = cloneData(entry);
    });
    return result as T;
  }
  return value;
}

function compareDiagnostics(left: StageDiagnostic, right: StageDiagnostic): number {
  const leftKey = `${left.path.map(String).join('.')}|${left.code}|${left.referenceId ?? ''}`;
  const rightKey = `${right.path.map(String).join('.')}|${right.code}|${right.referenceId ?? ''}`;
  return leftKey < rightKey ? -1 : leftKey > rightKey ? 1 : 0;
}

function freezeDiagnostics(diagnostics: readonly StageDiagnostic[]): readonly StageDiagnostic[] {
  return Object.freeze([...diagnostics]
    .sort(compareDiagnostics)
    .map(diagnostic => Object.freeze({
      ...diagnostic,
      path: Object.freeze([...diagnostic.path]),
    })));
}

function hasErrors(diagnostics: readonly StageDiagnostic[]): boolean {
  return diagnostics.some(diagnostic => diagnostic.severity === 'error');
}

function validSeed(seed: string | number): boolean {
  return typeof seed === 'number'
    ? Number.isFinite(seed)
    : typeof seed === 'string' && seed.trim().length > 0;
}

export class StageLoader {
  private readonly legacy: LegacyLevelAdapter;
  private readonly procedural: ProceduralStageAdapter;
  private readonly stageValidator = new StageValidator();
  private readonly levelValidator = new ResolvedLevelValidator();

  public constructor(
    private readonly registry: StageRegistry,
    options: StageLoaderOptions = {},
  ) {
    this.legacy = options.legacy ?? new LegacyLevelAdapter();
    this.procedural = options.procedural ?? new ProceduralStageAdapter();
  }

  public load(request: StageLoadRequest): StageLoadResult {
    const module = this.registry.get(request.stageId);
    if (!module) {
      return this.failure('stage-not-found', request.stageId, [{
        code: 'stage.load.not-found',
        severity: 'error',
        message: `Stage is not registered: ${request.stageId}`,
        path: ['request', 'stageId'],
        stageId: request.stageId,
        referenceId: request.stageId,
      }]);
    }

    const manifestDiagnostics = this.stageValidator.validateModule(module);
    if (hasErrors(manifestDiagnostics)) {
      return this.failure('invalid-manifest', request.stageId, manifestDiagnostics);
    }

    const referenceDiagnostics = this.validateReferences(module);
    if (hasErrors(referenceDiagnostics)) {
      return this.failure('invalid-reference', request.stageId, referenceDiagnostics);
    }

    const resolution = this.resolveLevel(module, request);
    if (!resolution.ok) return resolution;

    const levelDiagnostics = this.levelValidator.validate(resolution.level, module.manifest);
    if (hasErrors(levelDiagnostics)) {
      return this.failure('invalid-level', request.stageId, levelDiagnostics);
    }

    const resumeDiagnostics = this.validateResume(module.manifest, request);
    if (hasErrors(resumeDiagnostics)) {
      return this.failure('incompatible-save', request.stageId, resumeDiagnostics);
    }

    const diagnostics = freezeDiagnostics([
      ...manifestDiagnostics,
      ...referenceDiagnostics,
      ...levelDiagnostics,
      ...resumeDiagnostics,
    ]);
    const loaded: LoadedStage = {
      manifest: cloneData(module.manifest),
      level: cloneLevelDefinition(resolution.level),
      narrative: cloneData(module.narrative ?? {}),
      npcs: cloneData(module.npcs ?? []),
      dialogues: cloneData(module.dialogues ?? []),
      missions: cloneData(module.missions ?? []),
      events: cloneData(module.events ?? []),
      diagnostics,
    };
    return { ok: true, value: loaded };
  }

  private validateReferences(module: StageModule): readonly StageDiagnostic[] {
    const diagnostics: StageDiagnostic[] = [];
    const manifest = module.manifest;
    const chapter = this.registry.getChapter(manifest.chapterId);
    if (!chapter) {
      diagnostics.push({
        code: 'stage.load.chapter-missing',
        severity: 'error',
        message: `Stage chapter is not registered: ${manifest.chapterId}`,
        path: ['manifest', 'chapterId'],
        stageId: manifest.id,
        referenceId: manifest.chapterId,
      });
    } else if (!chapter.stageIds.includes(manifest.id)) {
      diagnostics.push({
        code: 'stage.load.chapter-stage-unlisted',
        severity: 'error',
        message: `Stage is absent from chapter stageIds: ${manifest.id}`,
        path: ['manifest', 'chapterId'],
        stageId: manifest.id,
        referenceId: manifest.chapterId,
      });
    }
    manifest.exits.forEach((exit, index) => {
      if (exit.targetStageId !== 'campaign.complete' && !this.registry.get(exit.targetStageId)) {
        diagnostics.push({
          code: 'stage.load.exit-target-missing',
          severity: 'error',
          message: `Stage exit target is not registered: ${exit.targetStageId}`,
          path: ['manifest', 'exits', index, 'targetStageId'],
          stageId: manifest.id,
          referenceId: exit.targetStageId,
        });
      }
    });
    return freezeDiagnostics(diagnostics);
  }

  private resolveLevel(
    module: StageModule,
    request: StageLoadRequest,
  ): { readonly ok: true; readonly level: LevelDefinition } | { readonly ok: false; readonly error: StageLoadFailure } {
    const manifest = module.manifest;
    if (manifest.layout.kind === 'authored') {
      return { ok: true, level: cloneLevelDefinition(module.authoredLevel!) };
    }
    if (manifest.layout.kind === 'legacy') {
      const level = this.legacy.resolve(manifest.layout.levelId);
      if (!level) {
        return this.failure('invalid-reference', manifest.id, [{
          code: 'stage.load.legacy-level-missing',
          severity: 'error',
          message: `Legacy level is not available: ${manifest.layout.levelId}`,
          path: ['manifest', 'layout', 'levelId'],
          stageId: manifest.id,
          referenceId: manifest.layout.levelId,
        }]);
      }
      return { ok: true, level };
    }

    if (!validSeed(request.runSeed)) {
      return this.failure('generation-failed', manifest.id, [{
        code: 'stage.load.seed-invalid',
        severity: 'error',
        message: 'Procedural runSeed must be a non-empty string or finite number.',
        path: ['request', 'runSeed'],
        stageId: manifest.id,
      }]);
    }
    try {
      return { ok: true, level: this.procedural.resolve(manifest, request.runSeed) };
    } catch (error) {
      return this.failure('generation-failed', manifest.id, [{
        code: 'stage.load.generation-failed',
        severity: 'error',
        message: `Procedural generation failed: ${error instanceof Error ? error.message : 'unknown error'}`,
        path: ['manifest', 'layout'],
        stageId: manifest.id,
      }]);
    }
  }

  private validateResume(manifest: StageManifest, request: StageLoadRequest): readonly StageDiagnostic[] {
    if (!request.resume) return Object.freeze([]);
    const diagnostics: StageDiagnostic[] = [];
    if (request.resume.stageId !== manifest.id) {
      diagnostics.push({
        code: 'stage.load.resume-stage-mismatch',
        severity: 'error',
        message: `Resume stage ${request.resume.stageId} does not match ${manifest.id}.`,
        path: ['request', 'resume', 'stageId'],
        stageId: manifest.id,
        referenceId: request.resume.stageId,
      });
    }
    if (request.resume.manifestRevision !== manifest.revision) {
      diagnostics.push({
        code: 'stage.load.resume-revision-mismatch',
        severity: 'error',
        message: `Resume revision ${request.resume.manifestRevision} does not match ${manifest.revision}.`,
        path: ['request', 'resume', 'manifestRevision'],
        stageId: manifest.id,
      });
    }
    return freezeDiagnostics(diagnostics);
  }

  private failure(
    code: StageLoadFailureCode,
    stageId: string,
    diagnostics: readonly StageDiagnostic[],
  ): { readonly ok: false; readonly error: StageLoadFailure } {
    return {
      ok: false,
      error: Object.freeze({
        code,
        stageId,
        diagnostics: freezeDiagnostics(diagnostics),
      }),
    };
  }
}
