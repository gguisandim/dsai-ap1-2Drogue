import type {
  CampaignSaveDiagnostic,
  CampaignSaveEnvelope,
  CampaignSaveIdentity,
  NarrativeStateSnapshot,
  StageReward,
} from '../contracts';
import { CAMPAIGN_SAVE_SCHEMA } from '../contracts';
import { cloneFrozen, compareStrings, isScalar, isStableId } from '../runtime/data';
import { narrativeScopePrefix } from '../runtime/NarrativeIdentity';

type Path = readonly (string | number)[];

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function add(
  diagnostics: CampaignSaveDiagnostic[],
  code: string,
  message: string,
  path: Path,
  referenceId?: string,
): void {
  diagnostics.push({ code, message, path, ...(referenceId ? { referenceId } : {}) });
}

function validateUniqueStableArray(
  value: unknown,
  diagnostics: CampaignSaveDiagnostic[],
  path: Path,
  prefix?: string,
): value is readonly string[] {
  if (!Array.isArray(value)) {
    add(diagnostics, 'save.array.required', 'Expected an array.', path);
    return false;
  }
  const seen = new Set<string>();
  value.forEach((entry, index) => {
    if (!isStableId(entry)) {
      add(diagnostics, 'save.id.invalid', 'Expected a stable lowercase identifier.', [...path, index]);
    } else {
      if (prefix && !entry.startsWith(prefix)) {
        add(diagnostics, 'save.id.scope-mismatch', 'Identifier does not belong to this save identity.',
          [...path, index], entry);
      }
      if (seen.has(entry)) add(diagnostics, 'save.id.duplicate', 'Identifier is duplicated.', [...path, index], entry);
      seen.add(entry);
    }
  });
  return true;
}

function validateReward(value: unknown, diagnostics: CampaignSaveDiagnostic[], path: Path): value is StageReward {
  if (!isRecord(value) || typeof value.type !== 'string') {
    add(diagnostics, 'save.reward.invalid', 'Pending reward must be a discriminated object.', path);
    return false;
  }
  if (value.type === 'progression.currency') {
    if (!Number.isSafeInteger(value.amount) || Number(value.amount) <= 0) {
      add(diagnostics, 'save.reward.amount-invalid', 'Currency amount must be a positive safe integer.', [...path, 'amount']);
    }
    return true;
  }
  if (value.type === 'progression.unlock') {
    if (!isStableId(value.contentId)) {
      add(diagnostics, 'save.reward.content-id-invalid', 'Unlock contentId must be stable.', [...path, 'contentId']);
    }
    return true;
  }
  add(diagnostics, 'save.reward.external-type-invalid', 'Only external progression rewards may remain pending.',
    [...path, 'type'], String(value.type));
  return false;
}

export function validateCampaignIdentity(
  value: unknown,
  diagnostics: CampaignSaveDiagnostic[],
  path: Path = ['identity'],
): value is CampaignSaveIdentity {
  if (!isRecord(value)) {
    add(diagnostics, 'save.identity.required', 'Save identity must be an object.', path);
    return false;
  }
  for (const field of ['campaignId', 'runId', 'chapterId', 'stageId'] as const) {
    if (!isStableId(value[field])) {
      add(diagnostics, `save.identity.${field}-invalid`, `${field} must be a stable lowercase identifier.`,
        [...path, field]);
    }
  }
  if (typeof value.runSeed !== 'string' || value.runSeed.length === 0 || value.runSeed.trim() !== value.runSeed) {
    add(diagnostics, 'save.identity.run-seed-invalid', 'runSeed must be a non-empty normalized string.',
      [...path, 'runSeed']);
  }
  if (!Number.isSafeInteger(value.manifestRevision) || Number(value.manifestRevision) < 1) {
    add(diagnostics, 'save.identity.revision-invalid', 'manifestRevision must be a positive safe integer.',
      [...path, 'manifestRevision']);
  }
  if (value.stageInstanceId !== undefined && !isStableId(value.stageInstanceId)) {
    add(diagnostics, 'save.identity.stage-instance-invalid',
      'stageInstanceId must be a stable lowercase identifier when present.',
      [...path, 'stageInstanceId']);
  }
  return true;
}

export function identitiesEqual(left: CampaignSaveIdentity, right: CampaignSaveIdentity): boolean {
  const sameInstance = left.stageInstanceId === undefined || right.stageInstanceId === undefined ||
    left.stageInstanceId === right.stageInstanceId;
  return left.campaignId === right.campaignId && left.runId === right.runId &&
    left.runSeed === right.runSeed && left.chapterId === right.chapterId &&
    left.stageId === right.stageId && left.manifestRevision === right.manifestRevision &&
    sameInstance;
}

export function validateNarrativeSnapshot(
  value: unknown,
  identity: CampaignSaveIdentity,
  diagnostics: CampaignSaveDiagnostic[],
  path: Path = ['narrative'],
): value is NarrativeStateSnapshot {
  if (!isRecord(value)) {
    add(diagnostics, 'save.snapshot.required', 'Narrative snapshot must be an object.', path);
    return false;
  }
  if (value.version !== 1) {
    add(diagnostics, 'save.snapshot.version-unsupported', 'Narrative snapshot version must be 1.',
      [...path, 'version']);
  }
  if (!isRecord(value.flags)) {
    add(diagnostics, 'save.flags.invalid', 'Flags must be an object.', [...path, 'flags']);
  } else {
    for (const [flag, flagValue] of Object.entries(value.flags)) {
      if (!isStableId(flag) || !isScalar(flagValue)) {
        add(diagnostics, 'save.flag.invalid', 'Flag id and value are invalid.', [...path, 'flags', flag], flag);
      }
    }
  }
  if (!isRecord(value.choices)) {
    add(diagnostics, 'save.choices.invalid', 'Choices must be an object.', [...path, 'choices']);
  } else {
    for (const [dialogueId, choices] of Object.entries(value.choices)) {
      if (!isStableId(dialogueId) || !isRecord(choices)) {
        add(diagnostics, 'save.dialogue-choices.invalid', 'Dialogue choices are invalid.',
          [...path, 'choices', dialogueId], dialogueId);
        continue;
      }
      for (const [nodeId, choiceId] of Object.entries(choices)) {
        if (!isStableId(nodeId) || !isStableId(choiceId)) {
          add(diagnostics, 'save.choice.invalid', 'Node and choice ids must be stable.',
            [...path, 'choices', dialogueId, nodeId]);
        }
      }
    }
  }

  validateUniqueStableArray(value.completedDialogueIds, diagnostics, [...path, 'completedDialogueIds']);

  if (!isRecord(value.missionStates)) {
    add(diagnostics, 'save.missions.invalid', 'missionStates must be an object.', [...path, 'missionStates']);
  } else {
    const statuses = new Set(['locked', 'available', 'active', 'completed', 'failed']);
    for (const [missionId, state] of Object.entries(value.missionStates)) {
      if (!isStableId(missionId) || !isRecord(state) || !statuses.has(String(state.status)) ||
        !isRecord(state.objectives)) {
        add(diagnostics, 'save.mission.invalid', 'Mission state is invalid.',
          [...path, 'missionStates', missionId], missionId);
        continue;
      }
      for (const [objectiveId, progress] of Object.entries(state.objectives)) {
        if (!isStableId(objectiveId) || !Number.isSafeInteger(progress) || Number(progress) < 0) {
          add(diagnostics, 'save.objective.invalid', 'Objective progress must be a non-negative safe integer.',
            [...path, 'missionStates', missionId, 'objectives', objectiveId], objectiveId);
        }
      }
    }
  }

  const scope = narrativeScopePrefix(identity);
  validateUniqueStableArray(value.processedEventIds, diagnostics, [...path, 'processedEventIds'], `${scope}.event.`);
  validateUniqueStableArray(value.firedRuleIds, diagnostics, [...path, 'firedRuleIds'], `${scope}.rule.`);
  const appliedValid = validateUniqueStableArray(
    value.appliedOperationIds,
    diagnostics,
    [...path, 'appliedOperationIds'],
    `${scope}.operation.`,
  );
  validateUniqueStableArray(value.unlockedExitIds, diagnostics, [...path, 'unlockedExitIds']);

  if (!Array.isArray(value.pendingOperations)) {
    add(diagnostics, 'save.pending.invalid', 'pendingOperations must be an array.', [...path, 'pendingOperations']);
  } else {
    const pending = new Set<string>();
    const applied = appliedValid ? new Set(value.appliedOperationIds as string[]) : new Set<string>();
    value.pendingOperations.forEach((operation, index) => {
      const operationPath = [...path, 'pendingOperations', index] as const;
      if (!isRecord(operation) || !isStableId(operation.operationId)) {
        add(diagnostics, 'save.pending-operation.invalid', 'Pending operation is invalid.', operationPath);
        return;
      }
      const operationId = operation.operationId;
      if (!operationId.startsWith(`${scope}.operation.`)) {
        add(diagnostics, 'save.pending-operation.scope-mismatch', 'Pending operation belongs to another identity.',
          [...operationPath, 'operationId'], operationId);
      }
      if (pending.has(operationId)) {
        add(diagnostics, 'save.pending-operation.duplicate', 'Pending operation is duplicated.',
          [...operationPath, 'operationId'], operationId);
      }
      if (!applied.has(operationId)) {
        add(diagnostics, 'save.pending-operation.unjournaled', 'Pending operation is absent from the operation journal.',
          [...operationPath, 'operationId'], operationId);
      }
      pending.add(operationId);
      validateReward(operation.reward, diagnostics, [...operationPath, 'reward']);
    });
  }
  return true;
}

export function validateCampaignEnvelope(
  value: unknown,
  expectedIdentity?: CampaignSaveIdentity,
): readonly CampaignSaveDiagnostic[] {
  const diagnostics: CampaignSaveDiagnostic[] = [];
  if (!isRecord(value)) {
    add(diagnostics, 'save.envelope.required', 'Campaign save envelope must be an object.', []);
    return cloneFrozen(diagnostics);
  }
  if (value.schema !== CAMPAIGN_SAVE_SCHEMA) {
    add(diagnostics, 'save.schema.unsupported', 'Campaign save schema is unknown.', ['schema'], String(value.schema));
  }
  if (value.version !== 1) {
    add(diagnostics, 'save.version.unsupported', 'Campaign save version must be 1.', ['version']);
  }
  const identityDiagnosticsBefore = diagnostics.length;
  validateCampaignIdentity(value.identity, diagnostics);
  if (diagnostics.length === identityDiagnosticsBefore) {
    const identity = value.identity as unknown as CampaignSaveIdentity;
    if (expectedIdentity && !identitiesEqual(identity, expectedIdentity)) {
      add(diagnostics, 'save.identity.mismatch', 'Save identity does not match the requested run.', ['identity']);
    }
    validateNarrativeSnapshot(value.narrative, identity, diagnostics);
  }
  if (value.migration !== undefined) {
    if (!isRecord(value.migration) || value.migration.source !== 'stage-resume' ||
      value.migration.sourceVersion !== 0) {
      add(diagnostics, 'save.migration.invalid', 'Migration metadata is invalid.', ['migration']);
    }
  }
  diagnostics.sort((left, right) => compareStrings(
    `${left.path.join('.')}|${left.code}|${left.referenceId ?? ''}`,
    `${right.path.join('.')}|${right.code}|${right.referenceId ?? ''}`,
  ));
  return cloneFrozen(diagnostics);
}

export function asCampaignSaveEnvelope(value: unknown): CampaignSaveEnvelope {
  return cloneFrozen(value as CampaignSaveEnvelope);
}

export { isRecord };
