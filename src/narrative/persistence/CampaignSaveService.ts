import type {
  CampaignLoadOutcome,
  CampaignSaveDiagnostic,
  CampaignSaveEnvelope,
  CampaignSaveFailure,
  CampaignSaveFailureCode,
  CampaignSaveIdentity,
  CampaignSaveResult,
  NarrativeStateSnapshot,
  SaveStoragePort,
  StageResumeMigrationRequest,
} from '../contracts';
import {
  CAMPAIGN_SAVE_SCHEMA,
  CAMPAIGN_SAVE_STORAGE_KEY,
} from '../contracts';
import { NarrativeState } from '../runtime/NarrativeState';
import { scopeNarrativeId } from '../runtime/NarrativeIdentity';
import { cloneFrozen, compareStrings, failure, isStableId, success } from '../runtime/data';
import {
  asCampaignSaveEnvelope,
  isRecord,
  validateCampaignEnvelope,
  validateCampaignIdentity,
} from './CampaignSaveValidator';

export class CampaignSaveService {
  public constructor(
    private readonly storage: SaveStoragePort,
    public readonly storageKey = CAMPAIGN_SAVE_STORAGE_KEY,
  ) {}

  public createEnvelope(
    identity: CampaignSaveIdentity,
    state: NarrativeState,
  ): CampaignSaveResult<CampaignSaveEnvelope> {
    const envelope: CampaignSaveEnvelope = {
      schema: CAMPAIGN_SAVE_SCHEMA,
      version: 1,
      identity: cloneFrozen(identity),
      narrative: state.snapshot(),
    };
    const validation = this.validate(envelope, identity);
    return validation.ok ? success(asCampaignSaveEnvelope(envelope)) : validation;
  }

  public serialize(
    identity: CampaignSaveIdentity,
    state: NarrativeState,
  ): CampaignSaveResult<string> {
    const envelope = this.createEnvelope(identity, state);
    if (!envelope.ok) return envelope;
    return success(JSON.stringify(envelope.value));
  }

  public save(
    identity: CampaignSaveIdentity,
    state: NarrativeState,
  ): CampaignSaveResult<CampaignSaveEnvelope> {
    const envelope = this.createEnvelope(identity, state);
    if (!envelope.ok) return envelope;
    let existing: string | undefined;
    try {
      existing = this.storage.read(this.storageKey);
    } catch (error) {
      return failure(this.failure(
        'storage-read-failed',
        `Campaign save preflight read failed: ${this.errorMessage(error)}.`,
        [{ code: 'save.storage.read-failed', message: 'Storage port rejected the preflight read.', path: ['storage'] }],
      ));
    }
    if (existing !== undefined) {
      let parsed: unknown;
      try {
        parsed = JSON.parse(existing) as unknown;
      } catch {
        return failure(this.conflict('Existing campaign bytes are not valid JSON and were preserved.'));
      }
      const existingDiagnostics = validateCampaignEnvelope(parsed, identity);
      if (existingDiagnostics.length > 0) {
        return failure(this.conflict(
          'Existing campaign save is unknown, incompatible or belongs to another identity and was preserved.',
          existingDiagnostics,
        ));
      }
    }
    try {
      this.storage.write(this.storageKey, JSON.stringify(envelope.value));
      return envelope;
    } catch (error) {
      return failure(this.failure(
        'storage-write-failed',
        `Campaign save write failed: ${this.errorMessage(error)}.`,
        [{ code: 'save.storage.write-failed', message: 'Storage port rejected the write.', path: ['storage'] }],
      ));
    }
  }

  public load(expectedIdentity?: CampaignSaveIdentity): CampaignSaveResult<CampaignLoadOutcome> {
    if (expectedIdentity) {
      const identityDiagnostics: CampaignSaveDiagnostic[] = [];
      validateCampaignIdentity(expectedIdentity, identityDiagnostics, ['expectedIdentity']);
      if (identityDiagnostics.length > 0) {
        return failure(this.failure('invalid-identity', 'Expected save identity is invalid.', identityDiagnostics));
      }
    }
    let raw: string | undefined;
    try {
      raw = this.storage.read(this.storageKey);
    } catch (error) {
      return failure(this.failure(
        'storage-read-failed',
        `Campaign save read failed: ${this.errorMessage(error)}.`,
        [{ code: 'save.storage.read-failed', message: 'Storage port rejected the read.', path: ['storage'] }],
      ));
    }
    if (raw === undefined) return success(cloneFrozen({ status: 'empty' as const }));

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw) as unknown;
    } catch {
      return failure(this.failure(
        'invalid-json',
        'Stored campaign save is not valid JSON.',
        [{ code: 'save.json.invalid', message: 'Stored value could not be parsed as JSON.', path: [] }],
      ));
    }

    if (isRecord(parsed) && parsed.schema === CAMPAIGN_SAVE_SCHEMA) {
      const validation = this.validate(parsed, expectedIdentity);
      if (!validation.ok) return validation;
      return success(cloneFrozen({ status: 'loaded' as const, envelope: asCampaignSaveEnvelope(parsed) }));
    }
    if (expectedIdentity && this.looksLikeStageResume(parsed)) {
      const migration = this.migrateStageResume({ identity: expectedIdentity, resume: parsed as never });
      if (!migration.ok) return migration;
      return success(cloneFrozen({ status: 'migrated' as const, envelope: migration.value }));
    }
    return failure(this.failure(
      'invalid-envelope',
      'Stored value is neither a campaign envelope nor a recognized stage resume.',
      [{ code: 'save.envelope.unknown', message: 'Unknown save payload was preserved unchanged.', path: [] }],
    ));
  }

  public restore(
    envelope: CampaignSaveEnvelope,
    target: NarrativeState,
    expectedIdentity?: CampaignSaveIdentity,
  ): CampaignSaveResult<NarrativeStateSnapshot> {
    const validation = this.validate(envelope, expectedIdentity);
    if (!validation.ok) return validation;
    const working = NarrativeState.fromSnapshot(envelope.narrative);
    target.restore(working.snapshot());
    return success(target.snapshot());
  }

  public loadAndRestore(
    expectedIdentity: CampaignSaveIdentity,
    target: NarrativeState,
  ): CampaignSaveResult<CampaignLoadOutcome> {
    const loaded = this.load(expectedIdentity);
    if (!loaded.ok || loaded.value.status === 'empty') return loaded;
    const restored = this.restore(loaded.value.envelope, target, expectedIdentity);
    return restored.ok ? loaded : restored;
  }

  public migrateStageResume(
    request: StageResumeMigrationRequest,
  ): CampaignSaveResult<CampaignSaveEnvelope> {
    const diagnostics: CampaignSaveDiagnostic[] = [];
    validateCampaignIdentity(request.identity, diagnostics);
    const value = request.resume as unknown;
    if (!isRecord(value)) {
      diagnostics.push({ code: 'save.migration.resume-required', message: 'Stage resume must be an object.', path: ['resume'] });
      return failure(this.failure('migration-failed', 'Stage resume migration failed.', diagnostics));
    }
    if (value.stageId !== request.identity.stageId) {
      diagnostics.push({ code: 'save.migration.stage-mismatch', message: 'Stage resume belongs to another stage.',
        path: ['resume', 'stageId'], referenceId: String(value.stageId) });
    }
    if (value.manifestRevision !== request.identity.manifestRevision) {
      diagnostics.push({ code: 'save.migration.revision-mismatch', message: 'Stage resume manifest revision is incompatible.',
        path: ['resume', 'manifestRevision'] });
    }
    const hasRunId = value.runId !== undefined;
    const hasRunSeed = value.runSeed !== undefined;
    if (hasRunId !== hasRunSeed) {
      diagnostics.push({ code: 'save.migration.partial-run-binding', message: 'Legacy run binding must contain runId and runSeed together.',
        path: ['resume'] });
    } else if (hasRunId && (value.runId !== request.identity.runId ||
      String(value.runSeed) !== request.identity.runSeed)) {
      diagnostics.push({ code: 'save.migration.run-mismatch', message: 'Stage resume belongs to another run.',
        path: ['resume', 'runId'] });
    }
    if (!Array.isArray(value.collectedEntityIds) ||
      value.collectedEntityIds.some(item => !isStableId(item))) {
      diagnostics.push({ code: 'save.migration.collected-invalid', message: 'collectedEntityIds must contain stable ids.',
        path: ['resume', 'collectedEntityIds'] });
    }
    if (!isRecord(value.flags)) {
      diagnostics.push({ code: 'save.migration.flags-invalid', message: 'Legacy flags must be an object.',
        path: ['resume', 'flags'] });
    }
    if (!isRecord(value.missionStates)) {
      diagnostics.push({ code: 'save.migration.missions-invalid', message: 'Legacy missionStates must be an object.',
        path: ['resume', 'missionStates'] });
    }
    if (!Array.isArray(value.appliedOperationIds) ||
      value.appliedOperationIds.some(item => !isStableId(item))) {
      diagnostics.push({ code: 'save.migration.operations-invalid', message: 'appliedOperationIds must contain stable ids.',
        path: ['resume', 'appliedOperationIds'] });
    }

    const rawOperationIds = Array.isArray(value.appliedOperationIds)
      ? value.appliedOperationIds.filter(isStableId)
      : [];
    const snapshot: NarrativeStateSnapshot = {
      version: 1,
      flags: isRecord(value.flags) ? value.flags as NarrativeStateSnapshot['flags'] : {},
      choices: {},
      completedDialogueIds: [],
      missionStates: isRecord(value.missionStates)
        ? value.missionStates as NarrativeStateSnapshot['missionStates']
        : {},
      processedEventIds: [],
      firedRuleIds: [],
      appliedOperationIds: rawOperationIds.map(operationId =>
        scopeNarrativeId(request.identity, 'operation', operationId)),
      pendingOperations: [],
      unlockedExitIds: [],
    };
    const envelope: CampaignSaveEnvelope = {
      schema: CAMPAIGN_SAVE_SCHEMA,
      version: 1,
      identity: cloneFrozen(request.identity),
      narrative: cloneFrozen(snapshot),
      migration: { source: 'stage-resume', sourceVersion: 0 },
    };
    diagnostics.push(...validateCampaignEnvelope(envelope, request.identity));
    if (diagnostics.length > 0) {
      return failure(this.failure('migration-failed', 'Stage resume migration failed.', diagnostics));
    }
    return success(asCampaignSaveEnvelope(envelope));
  }

  private validate(
    envelope: unknown,
    expectedIdentity?: CampaignSaveIdentity,
  ): CampaignSaveResult<CampaignSaveEnvelope> {
    const diagnostics = validateCampaignEnvelope(envelope, expectedIdentity);
    if (diagnostics.length === 0) return success(asCampaignSaveEnvelope(envelope));
    const codes = new Set(diagnostics.map(diagnostic => diagnostic.code));
    let code: CampaignSaveFailureCode = 'invalid-envelope';
    if (codes.has('save.version.unsupported') || codes.has('save.snapshot.version-unsupported')) {
      code = 'unsupported-version';
    } else if ([...codes].some(item => item.startsWith('save.identity.') && item !== 'save.identity.mismatch')) {
      code = 'invalid-identity';
    } else if (codes.has('save.identity.mismatch')) {
      code = 'identity-mismatch';
    } else if ([...codes].some(item => item.startsWith('save.snapshot') || item.startsWith('save.flag') ||
      item.startsWith('save.choice') || item.startsWith('save.mission') || item.startsWith('save.objective') ||
      item.startsWith('save.pending') || item.startsWith('save.id') || item.startsWith('save.reward') ||
      item.startsWith('save.array'))) {
      code = 'invalid-snapshot';
    }
    return failure(this.failure(code, 'Campaign save validation failed.', diagnostics));
  }

  private looksLikeStageResume(value: unknown): boolean {
    return isRecord(value) && value.version === undefined && value.schema === undefined &&
      'stageId' in value && 'manifestRevision' in value &&
      'flags' in value && 'missionStates' in value && 'collectedEntityIds' in value &&
      'appliedOperationIds' in value;
  }

  private failure(
    code: CampaignSaveFailureCode,
    message: string,
    diagnostics: readonly CampaignSaveDiagnostic[],
  ): CampaignSaveFailure {
    const sorted = [...diagnostics].sort((left, right) => compareStrings(
      `${left.path.join('.')}|${left.code}|${left.referenceId ?? ''}`,
      `${right.path.join('.')}|${right.code}|${right.referenceId ?? ''}`,
    ));
    return cloneFrozen({ code, message, diagnostics: sorted });
  }

  private conflict(
    message: string,
    diagnostics: readonly CampaignSaveDiagnostic[] = [],
  ): CampaignSaveFailure {
    return this.failure('storage-conflict', message, diagnostics.length > 0 ? diagnostics : [{
      code: 'save.storage.conflict',
      message: 'Existing bytes cannot be replaced safely.',
      path: ['storage'],
    }]);
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}
