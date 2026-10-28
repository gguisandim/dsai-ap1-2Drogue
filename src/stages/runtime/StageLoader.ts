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

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function validNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function requestedStageId(request: unknown): string {
  try {
    if (isRecord(request) && validNonEmptyString(request.stageId)) return request.stageId;
  } catch {
    // A hostile object must still be converted into a typed boundary failure.
  }
  return 'unknown.stage';
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'unknown error';
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
    const stageId = requestedStageId(request);
    try {
      return this.loadValidated(request);
    } catch (error) {
      return this.failure('load-failed', stageId, [{
        code: 'stage.load.unexpected-error',
        severity: 'error',
        message: `Stage loading failed unexpectedly: ${errorMessage(error)}`,
        path: ['request'],
        stageId,
      }]);
    }
  }

  private loadValidated(request: StageLoadRequest): StageLoadResult {
    const requestDiagnostics = this.validateRequest(request);
    if (hasErrors(requestDiagnostics)) {
      return this.failure('invalid-request', requestedStageId(request), requestDiagnostics);
    }

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

    const resumeDiagnostics = this.validateResume(module.manifest, request);
    if (hasErrors(resumeDiagnostics)) {
      return this.failure('incompatible-save', request.stageId, resumeDiagnostics);
    }

    const resolution = this.resolveLevel(module, request);
    if (!resolution.ok) return resolution;

    const levelDiagnostics = this.levelValidator.validate(resolution.level, module.manifest);
    if (hasErrors(levelDiagnostics)) {
      return this.failure('invalid-level', request.stageId, levelDiagnostics);
    }

    const diagnostics = freezeDiagnostics([
      ...requestDiagnostics,
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

  private validateRequest(request: unknown): readonly StageDiagnostic[] {
    const diagnostics: StageDiagnostic[] = [];
    const stageId = requestedStageId(request);
    const add = (code: string, message: string, path: readonly (string | number)[]): void => {
      diagnostics.push({ code, severity: 'error', message, path, stageId });
    };
    if (!isRecord(request)) {
      add('stage.load.request-invalid', 'Stage load request must be an object.', ['request']);
      return freezeDiagnostics(diagnostics);
    }
    if (!validNonEmptyString(request.stageId)) {
      add('stage.load.request-stage-id-invalid', 'Stage load request requires a non-empty stageId.', ['request', 'stageId']);
    }
    if (!validNonEmptyString(request.runId)) {
      add('stage.load.request-run-id-invalid', 'Stage load request requires a non-empty runId.', ['request', 'runId']);
    }
    if (typeof request.runSeed !== 'string' && typeof request.runSeed !== 'number') {
      add('stage.load.request-seed-type-invalid', 'Stage load request seed must be a string or number.', ['request', 'runSeed']);
    }
    return freezeDiagnostics(diagnostics);
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
      return { ok: true, level: module.authoredLevel! };
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
        message: `Procedural generation failed: ${errorMessage(error)}`,
        path: ['manifest', 'layout'],
        stageId: manifest.id,
      }]);
    }
  }

  private validateResume(manifest: StageManifest, request: StageLoadRequest): readonly StageDiagnostic[] {
    if (request.resume === undefined) return Object.freeze([]);
    const diagnostics: StageDiagnostic[] = [];
    const resume: unknown = request.resume;
    const add = (
      code: string,
      message: string,
      path: readonly (string | number)[],
      referenceId?: string,
    ): void => {
      diagnostics.push({
        code,
        severity: 'error',
        message,
        path,
        stageId: manifest.id,
        ...(referenceId ? { referenceId } : {}),
      });
    };

    if (!isRecord(resume)) {
      add('stage.load.resume-invalid', 'Resume state must be an object.', ['request', 'resume']);
      return freezeDiagnostics(diagnostics);
    }

    if (!validNonEmptyString(resume.stageId)) {
      add('stage.load.resume-stage-invalid', 'Resume stageId must be a non-empty string.', ['request', 'resume', 'stageId']);
    } else if (resume.stageId !== manifest.id) {
      diagnostics.push({
        code: 'stage.load.resume-stage-mismatch',
        severity: 'error',
        message: `Resume stage ${resume.stageId} does not match ${manifest.id}.`,
        path: ['request', 'resume', 'stageId'],
        stageId: manifest.id,
        referenceId: resume.stageId,
      });
    }
    if (!Number.isInteger(resume.manifestRevision) || (resume.manifestRevision as number) < 1) {
      add(
        'stage.load.resume-revision-invalid',
        'Resume manifestRevision must be a positive integer.',
        ['request', 'resume', 'manifestRevision'],
      );
    } else if (resume.manifestRevision !== manifest.revision) {
      diagnostics.push({
        code: 'stage.load.resume-revision-mismatch',
        severity: 'error',
        message: `Resume revision ${resume.manifestRevision} does not match ${manifest.revision}.`,
        path: ['request', 'resume', 'manifestRevision'],
        stageId: manifest.id,
      });
    }

    const hasRunId = resume.runId !== undefined;
    const hasRunSeed = resume.runSeed !== undefined;
    if (hasRunId !== hasRunSeed) {
      add(
        'stage.load.resume-binding-incomplete',
        'Resume run binding must contain both runId and runSeed.',
        ['request', 'resume'],
      );
    } else if (hasRunId && hasRunSeed) {
      if (!validNonEmptyString(resume.runId)) {
        add('stage.load.resume-run-id-invalid', 'Resume runId must be a non-empty string.', ['request', 'resume', 'runId']);
      } else if (resume.runId !== request.runId) {
        add(
          'stage.load.resume-run-id-mismatch',
          `Resume runId ${resume.runId} does not match the requested run.`,
          ['request', 'resume', 'runId'],
          resume.runId,
        );
      }
      if ((typeof resume.runSeed !== 'string' && typeof resume.runSeed !== 'number') ||
        !validSeed(resume.runSeed as string | number)) {
        add('stage.load.resume-seed-invalid', 'Resume runSeed must be a non-empty string or finite number.', ['request', 'resume', 'runSeed']);
      } else if (String(resume.runSeed) !== String(request.runSeed)) {
        add(
          'stage.load.resume-seed-mismatch',
          'Resume runSeed does not match the seed that resolves this run.',
          ['request', 'resume', 'runSeed'],
        );
      }
    }

    this.validateResumeFlags(resume.flags, manifest.id, diagnostics);
    this.validateMissionStates(resume.missionStates, manifest.id, diagnostics);
    this.validateStringList(resume.collectedEntityIds, 'collectedEntityIds', manifest.id, diagnostics);
    this.validateStringList(resume.appliedOperationIds, 'appliedOperationIds', manifest.id, diagnostics);

    if (!hasRunId && !hasRunSeed && !hasErrors(diagnostics)) {
      diagnostics.push({
        code: 'stage.load.resume-binding-missing',
        severity: 'warning',
        message: 'Resume predates run binding; future saves must persist runId and runSeed.',
        path: ['request', 'resume'],
        stageId: manifest.id,
      });
    }
    return freezeDiagnostics(diagnostics);
  }

  private validateResumeFlags(
    value: unknown,
    stageId: string,
    diagnostics: StageDiagnostic[],
  ): void {
    if (!isRecord(value)) {
      diagnostics.push({
        code: 'stage.load.resume-flags-invalid',
        severity: 'error',
        message: 'Resume flags must be an object.',
        path: ['request', 'resume', 'flags'],
        stageId,
      });
      return;
    }
    Object.entries(value).forEach(([key, entry]) => {
      if (!validNonEmptyString(key) ||
        (typeof entry !== 'boolean' && typeof entry !== 'string' &&
          (typeof entry !== 'number' || !Number.isFinite(entry)))) {
        diagnostics.push({
          code: 'stage.load.resume-flag-invalid',
          severity: 'error',
          message: `Resume flag has an invalid value: ${key}.`,
          path: ['request', 'resume', 'flags', key],
          stageId,
          referenceId: key,
        });
      }
    });
  }

  private validateMissionStates(
    value: unknown,
    stageId: string,
    diagnostics: StageDiagnostic[],
  ): void {
    if (!isRecord(value)) {
      diagnostics.push({
        code: 'stage.load.resume-missions-invalid',
        severity: 'error',
        message: 'Resume missionStates must be an object.',
        path: ['request', 'resume', 'missionStates'],
        stageId,
      });
      return;
    }
    const statuses = new Set(['locked', 'active', 'completed', 'failed']);
    Object.entries(value).forEach(([missionId, state]) => {
      if (!validNonEmptyString(missionId) || !isRecord(state) || !statuses.has(String(state.status)) ||
        !isRecord(state.objectives)) {
        diagnostics.push({
          code: 'stage.load.resume-mission-invalid',
          severity: 'error',
          message: `Resume mission state is invalid: ${missionId}.`,
          path: ['request', 'resume', 'missionStates', missionId],
          stageId,
          referenceId: missionId,
        });
        return;
      }
      Object.entries(state.objectives).forEach(([objectiveId, progress]) => {
        if (!validNonEmptyString(objectiveId) || typeof progress !== 'number' ||
          !Number.isFinite(progress) || progress < 0) {
          diagnostics.push({
            code: 'stage.load.resume-objective-invalid',
            severity: 'error',
            message: `Resume objective progress is invalid: ${objectiveId}.`,
            path: ['request', 'resume', 'missionStates', missionId, 'objectives', objectiveId],
            stageId,
            referenceId: objectiveId,
          });
        }
      });
    });
  }

  private validateStringList(
    value: unknown,
    field: 'collectedEntityIds' | 'appliedOperationIds',
    stageId: string,
    diagnostics: StageDiagnostic[],
  ): void {
    if (!Array.isArray(value)) {
      diagnostics.push({
        code: 'stage.load.resume-list-invalid',
        severity: 'error',
        message: `Resume ${field} must be an array.`,
        path: ['request', 'resume', field],
        stageId,
        referenceId: field,
      });
      return;
    }
    const seen = new Set<string>();
    value.forEach((entry, index) => {
      if (!validNonEmptyString(entry)) {
        diagnostics.push({
          code: 'stage.load.resume-list-entry-invalid',
          severity: 'error',
          message: `Resume ${field} contains an invalid id.`,
          path: ['request', 'resume', field, index],
          stageId,
          referenceId: field,
        });
      } else if (seen.has(entry)) {
        diagnostics.push({
          code: 'stage.load.resume-list-duplicate',
          severity: 'error',
          message: `Resume ${field} contains duplicate id: ${entry}.`,
          path: ['request', 'resume', field, index],
          stageId,
          referenceId: entry,
        });
      } else {
        seen.add(entry);
      }
    });
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
