import type {
  StageCapabilityRequirement,
  StageEnemyArchetype,
} from '../../stages';
import {
  DEFAULT_STAGE_RUNTIME_CAPABILITIES,
  STAGE_ENEMY_ARCHETYPES,
  validateStageCapabilityRequirements,
} from '../../stages';
import type { ChapterFileSystem, CliDiagnostic, CliDiagnosticSeverity } from './types';

export const STAGE_PLAN_FILENAME = 'stage-plan.json';
export const STAGE_PLAN_KIND = 'umbra.stage-plan' as const;
export const STAGE_PLAN_SCHEMA_VERSION = 1 as const;
export const STAGE_PLAN_REPORT_KIND = 'umbra.stage-plan.validation' as const;

export type StagePlanProgression = 'linear' | 'branched';
export type StagePlanRegionRole = 'start' | 'exploration' | 'combat' | 'objective' | 'exit';
export type StagePlanInteractionKind = 'npc' | 'dialogue' | 'item';

export const STAGE_PLAN_PROGRESSIONS: readonly StagePlanProgression[] = Object.freeze([
  'linear', 'branched',
]);
export const STAGE_PLAN_REGION_ROLES: readonly StagePlanRegionRole[] = Object.freeze([
  'start', 'exploration', 'combat', 'objective', 'exit',
]);
export const STAGE_PLAN_INTERACTION_KINDS: readonly StagePlanInteractionKind[] = Object.freeze([
  'npc', 'dialogue', 'item',
]);

export interface StagePlanRegion {
  readonly id: string;
  readonly title: string;
  readonly role: StagePlanRegionRole;
  readonly connections: readonly string[];
}

export interface StagePlanObjective {
  readonly id: string;
  readonly title: string;
  /** Optional chapter-local mission id this objective belongs to. */
  readonly missionId?: string;
  readonly regionId: string;
  readonly dependsOn?: readonly string[];
  readonly unlocksExitIds?: readonly string[];
}

export interface StagePlanEncounter {
  readonly id: string;
  readonly regionId: string;
  readonly archetypes: readonly StageEnemyArchetype[];
  readonly waveCount?: number;
}

export interface StagePlanInteraction {
  readonly id: string;
  readonly regionId: string;
  readonly kind: StagePlanInteractionKind;
  /** Chapter-local NPC, dialogue or item id; verified only in the chapter. */
  readonly referenceId: string;
}

export interface StagePlanExitCondition {
  readonly exitId: string;
  readonly regionId: string;
  readonly requiresObjectiveIds: readonly string[];
}

/**
 * Authoring-only plan. It never becomes runtime content by itself; the
 * chapter's StageModule remains the executable source of truth.
 */
export interface StagePlan {
  readonly schemaVersion: 1;
  readonly kind: 'umbra.stage-plan';
  readonly id: string;
  readonly stageId?: string;
  readonly title: string;
  readonly summary: string;
  readonly progression: StagePlanProgression;
  readonly visualDirection: string;
  readonly themeCapabilityId?: string;
  readonly startRegionId: string;
  readonly exitRegionIds: readonly string[];
  readonly regions: readonly StagePlanRegion[];
  readonly objectives: readonly StagePlanObjective[];
  readonly encounters?: readonly StagePlanEncounter[];
  readonly interactions?: readonly StagePlanInteraction[];
  readonly exitConditions: readonly StagePlanExitCondition[];
  readonly capabilities?: readonly StageCapabilityRequirement[];
}

export interface StagePlanSummary {
  readonly planId: string | null;
  readonly stageId: string | null;
  readonly progression: string | null;
  readonly regions: number;
  readonly objectives: number;
  readonly encounters: number;
  readonly interactions: number;
  readonly exitConditions: number;
}

export interface StagePlanValidationReport {
  readonly schemaVersion: 1;
  readonly kind: 'umbra.stage-plan.validation';
  readonly planPath: string;
  readonly ok: boolean;
  readonly summary: StagePlanSummary;
  readonly diagnostics: readonly CliDiagnostic[];
  readonly errors: readonly CliDiagnostic[];
  readonly warnings: readonly CliDiagnostic[];
  readonly infos: readonly CliDiagnostic[];
  readonly runtime: Readonly<{ phaserAssets: 'not-executed' }>;
}

const STABLE_ID = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/;
const SEVERITY_RANK: Readonly<Record<CliDiagnosticSeverity, number>> = Object.freeze({
  error: 3, warning: 2, info: 1,
});

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isStableId(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value === value.trim() && STABLE_ID.test(value);
}

function nonEmpty(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function diagnostic(input: {
  readonly code: string;
  readonly severity: CliDiagnosticSeverity;
  readonly message: string;
  readonly path: readonly (string | number)[];
  readonly referenceId?: string;
}): CliDiagnostic {
  return Object.freeze({
    code: input.code,
    severity: input.severity,
    message: input.message,
    path: Object.freeze([...input.path]),
    origin: 'plan' as const,
    component: 'authoring/plan',
    ...(input.referenceId ? { referenceId: input.referenceId } : {}),
  });
}

function sortDiagnostics(values: readonly CliDiagnostic[]): readonly CliDiagnostic[] {
  return Object.freeze([...values].sort((left, right) => {
    const severity = SEVERITY_RANK[right.severity] - SEVERITY_RANK[left.severity];
    if (severity !== 0) return severity;
    const leftKey = `${left.code}|${left.path.map(String).join('.')}|${left.referenceId ?? ''}`;
    const rightKey = `${right.code}|${right.path.map(String).join('.')}|${right.referenceId ?? ''}`;
    return leftKey < rightKey ? -1 : leftKey > rightKey ? 1 : 0;
  }));
}

function summaryFrom(raw: Record<string, unknown> | undefined): StagePlanSummary {
  return Object.freeze({
    planId: isStableId(raw?.id) ? raw.id : null,
    stageId: isStableId(raw?.stageId) ? raw.stageId : null,
    progression: typeof raw?.progression === 'string' ? raw.progression : null,
    regions: Array.isArray(raw?.regions) ? raw.regions.length : 0,
    objectives: Array.isArray(raw?.objectives) ? raw.objectives.length : 0,
    encounters: Array.isArray(raw?.encounters) ? raw.encounters.length : 0,
    interactions: Array.isArray(raw?.interactions) ? raw.interactions.length : 0,
    exitConditions: Array.isArray(raw?.exitConditions) ? raw.exitConditions.length : 0,
  });
}

function finish(
  planPath: string,
  raw: Record<string, unknown> | undefined,
  values: readonly CliDiagnostic[],
): StagePlanValidationReport {
  const diagnostics = sortDiagnostics(values);
  const errors = Object.freeze(diagnostics.filter(item => item.severity === 'error'));
  const warnings = Object.freeze(diagnostics.filter(item => item.severity === 'warning'));
  const infos = Object.freeze(diagnostics.filter(item => item.severity === 'info'));
  return Object.freeze({
    schemaVersion: 1 as const,
    kind: STAGE_PLAN_REPORT_KIND,
    planPath,
    ok: errors.length === 0,
    summary: summaryFrom(raw),
    diagnostics,
    errors,
    warnings,
    infos,
    runtime: Object.freeze({ phaserAssets: 'not-executed' as const }),
  });
}

/**
 * Validates a parsed plan. It is pure and deterministic: graph checks never
 * depend on filesystem order or map iteration order.
 */
export function validateStagePlan(value: unknown, planPath = STAGE_PLAN_FILENAME): StagePlanValidationReport {
  const diagnostics: CliDiagnostic[] = [];
  const add = (
    code: string,
    severity: CliDiagnosticSeverity,
    message: string,
    path: readonly (string | number)[],
    referenceId?: string,
  ): void => {
    diagnostics.push(diagnostic({ code, severity, message, path, ...(referenceId ? { referenceId } : {}) }));
  };

  if (!isObject(value)) {
    add('plan.invalid', 'error', 'Stage plan root must be a JSON object.', []);
    return finish(planPath, undefined, diagnostics);
  }
  const raw = value;

  if (raw.schemaVersion !== STAGE_PLAN_SCHEMA_VERSION) add(
    'plan.schema-version.unsupported', 'error', 'Stage plan schemaVersion must be 1.', ['schemaVersion'],
  );
  if (raw.kind !== STAGE_PLAN_KIND) add(
    'plan.kind.invalid', 'error', `Stage plan kind must be ${STAGE_PLAN_KIND}.`, ['kind'], String(raw.kind),
  );
  if (!isStableId(raw.id)) add('plan.id.invalid', 'error', 'Plan id must be a stable identifier.', ['id'], String(raw.id));
  if (!nonEmpty(raw.title)) add('plan.title.required', 'error', 'Plan title is required.', ['title']);
  if (!nonEmpty(raw.summary)) add('plan.summary.required', 'error', 'Plan summary is required.', ['summary']);
  if (!STAGE_PLAN_PROGRESSIONS.includes(raw.progression as StagePlanProgression)) add(
    'plan.progression.invalid', 'error', 'Plan progression must be linear or branched.',
    ['progression'], String(raw.progression),
  );
  if (!nonEmpty(raw.visualDirection)) add(
    'plan.visual-direction.required', 'error', 'Plan visualDirection is required.', ['visualDirection'],
  );
  if (raw.stageId !== undefined && !isStableId(raw.stageId)) add(
    'plan.stage-id.invalid', 'error', 'Plan stageId must be a stable identifier.', ['stageId'], String(raw.stageId),
  );

  const regionsRaw = Array.isArray(raw.regions) ? raw.regions : [];
  const regionIds = new Set<string>();
  const regionRoles = new Map<string, unknown>();
  if (!Array.isArray(raw.regions) || regionsRaw.length === 0) {
    add('plan.regions.empty', 'error', 'Plan requires at least one region.', ['regions']);
  }

  regionsRaw.forEach((entry, index) => {
    const base = ['regions', index] as const;
    if (!isObject(entry)) {
      add('plan.region.invalid', 'error', 'Region must be an object.', base);
      return;
    }
    if (!isStableId(entry.id)) {
      add('plan.region.id.invalid', 'error', 'Region id must be stable.', [...base, 'id'], String(entry.id));
    } else if (regionIds.has(entry.id)) {
      add('plan.region.id.duplicate', 'error', `Region id is duplicated: ${entry.id}.`,
        [...base, 'id'], entry.id);
    } else {
      regionIds.add(entry.id);
      regionRoles.set(entry.id, entry.role);
    }
    if (!nonEmpty(entry.title)) add('plan.region.title.required', 'error', 'Region title is required.', [...base, 'title']);
    if (!STAGE_PLAN_REGION_ROLES.includes(entry.role as StagePlanRegionRole)) add(
      'plan.region.role.invalid', 'error', 'Region role is invalid.', [...base, 'role'], String(entry.role),
    );
    if (!Array.isArray(entry.connections)) {
      add('plan.region.connections.invalid', 'error', 'Region connections must be an array.', [...base, 'connections']);
      return;
    }
    const seen = new Set<string>();
    entry.connections.forEach((connection, connectionIndex) => {
      const connectionPath = [...base, 'connections', connectionIndex];
      if (!isStableId(connection)) {
        add('plan.region.connection.invalid', 'error', 'Region connection must be stable.',
          connectionPath, String(connection));
      } else if (connection === entry.id) {
        add('plan.region.connection.self', 'error', 'Region cannot connect to itself.',
          connectionPath, connection);
      } else if (seen.has(connection)) {
        add('plan.region.connection.duplicate', 'error', 'Region connection is duplicated.',
          connectionPath, connection);
      }
      if (isStableId(connection)) seen.add(connection);
    });
  });

  regionsRaw.forEach((entry, index) => {
    if (!isObject(entry) || !isStableId(entry.id) || !Array.isArray(entry.connections)) return;
    entry.connections.forEach((connection, connectionIndex) => {
      if (isStableId(connection) && !regionIds.has(connection)) add(
        'plan.region.connection.missing', 'error', `Connection references an unknown region: ${connection}.`,
        ['regions', index, 'connections', connectionIndex], connection,
      );
    });
  });

  const startRegionId = raw.startRegionId;
  if (!isStableId(startRegionId)) {
    add('plan.start.invalid', 'error', 'Plan startRegionId must be stable.', ['startRegionId'], String(startRegionId));
  } else if (!regionIds.has(startRegionId)) {
    add('plan.start.missing', 'error', `Start region is not declared: ${startRegionId}.`,
      ['startRegionId'], startRegionId);
  } else if (regionRoles.get(startRegionId) !== 'start') {
    add('plan.start.role-invalid', 'error', 'Start region must use the start role.',
      ['startRegionId'], startRegionId);
  }

  const exitRegionIds = new Set<string>();
  if (!Array.isArray(raw.exitRegionIds) || raw.exitRegionIds.length === 0) {
    add('plan.exit.empty', 'error', 'Plan requires at least one exit region.', ['exitRegionIds']);
  } else {
    raw.exitRegionIds.forEach((exitRegionId, index) => {
      const exitPath = ['exitRegionIds', index] as const;
      if (!isStableId(exitRegionId)) {
        add('plan.exit.id.invalid', 'error', 'Exit region id must be stable.', exitPath, String(exitRegionId));
      } else if (exitRegionIds.has(exitRegionId)) {
        add('plan.exit.duplicate', 'error', 'Exit region is duplicated.', exitPath, exitRegionId);
      } else {
        exitRegionIds.add(exitRegionId);
        if (!regionIds.has(exitRegionId)) add(
          'plan.exit.region-missing', 'error', `Exit region is not declared: ${exitRegionId}.`,
          exitPath, exitRegionId,
        );
        else if (regionRoles.get(exitRegionId) !== 'exit') add(
          'plan.exit.role-invalid', 'error', 'Exit region must use the exit role.',
          exitPath, exitRegionId,
        );
      }
    });
  }

  const objectivesRaw = Array.isArray(raw.objectives) ? raw.objectives : [];
  const objectiveIds = new Set<string>();
  const objectiveIndexes = new Map<string, number>();
  const dependencies = new Map<string, readonly string[]>();
  const unlockRefs = new Map<string, readonly string[]>();

  objectivesRaw.forEach((entry, index) => {
    const base = ['objectives', index] as const;
    if (!isObject(entry)) {
      add('plan.objective.invalid', 'error', 'Objective must be an object.', base);
      return;
    }
    if (!isStableId(entry.id)) {
      add('plan.objective.id.invalid', 'error', 'Objective id must be stable.', [...base, 'id'], String(entry.id));
    } else if (objectiveIds.has(entry.id)) {
      add('plan.objective.id.duplicate', 'error', `Objective id is duplicated: ${entry.id}.`,
        [...base, 'id'], entry.id);
    } else {
      objectiveIds.add(entry.id);
      objectiveIndexes.set(entry.id, index);
    }
    if (!nonEmpty(entry.title)) add(
      'plan.objective.title.required', 'error', 'Objective title is required.', [...base, 'title'],
    );
    if (entry.missionId !== undefined && !isStableId(entry.missionId)) add(
      'plan.objective.mission-id.invalid', 'error', 'Objective missionId must be stable.',
      [...base, 'missionId'], String(entry.missionId),
    );
    if (!isStableId(entry.regionId)) {
      add('plan.objective.region-invalid', 'error', 'Objective regionId must be stable.',
        [...base, 'regionId'], String(entry.regionId));
    } else if (!regionIds.has(entry.regionId)) {
      add('plan.objective.region-missing', 'error', `Objective references an unknown region: ${entry.regionId}.`,
        [...base, 'regionId'], entry.regionId);
    }
    if (entry.dependsOn === undefined) {
      dependencies.set(String(entry.id), Object.freeze([]));
    } else if (!Array.isArray(entry.dependsOn)) {
      add('plan.objective.dependency.invalid', 'error', 'Objective dependsOn must be an array.',
        [...base, 'dependsOn']);
    } else {
      const seen = new Set<string>();
      entry.dependsOn.forEach((dependency, dependencyIndex) => {
        const dependencyPath = [...base, 'dependsOn', dependencyIndex];
        if (!isStableId(dependency)) {
          add('plan.objective.dependency.invalid', 'error', 'Objective dependency must be stable.',
            dependencyPath, String(dependency));
        } else if (dependency === entry.id) {
          add('plan.objective.dependency.self', 'error', 'Objective cannot depend on itself.',
            dependencyPath, dependency);
        } else if (seen.has(dependency)) {
          add('plan.objective.dependency.duplicate', 'error', 'Objective dependency is duplicated.',
            dependencyPath, dependency);
        }
        if (isStableId(dependency)) seen.add(dependency);
      });
      dependencies.set(String(entry.id), Object.freeze([...seen]));
    }
    if (entry.unlocksExitIds === undefined) {
      unlockRefs.set(String(entry.id), Object.freeze([]));
    } else if (!Array.isArray(entry.unlocksExitIds)) {
      add('plan.objective.exit-ref.invalid', 'error', 'Objective unlocksExitIds must be an array.',
        [...base, 'unlocksExitIds']);
    } else {
      const seen = new Set<string>();
      entry.unlocksExitIds.forEach((exitId, exitIndex) => {
        const exitPath = [...base, 'unlocksExitIds', exitIndex];
        if (!isStableId(exitId)) add(
          'plan.objective.exit-ref.invalid', 'error', 'Objective exit reference must be stable.',
          exitPath, String(exitId),
        );
        else if (seen.has(exitId)) add(
          'plan.objective.exit-ref.duplicate', 'error', 'Objective exit reference is duplicated.',
          exitPath, exitId,
        );
        if (isStableId(exitId)) seen.add(exitId);
      });
      unlockRefs.set(String(entry.id), Object.freeze([...seen]));
    }
  });

  dependencies.forEach((values, objectiveId) => {
    const index = objectiveIndexes.get(objectiveId);
    if (index === undefined) return;
    values.forEach((dependency, dependencyIndex) => {
      if (!objectiveIds.has(dependency)) add(
        'plan.objective.dependency.missing',
        'error',
        `Objective depends on an unknown objective: ${dependency}.`,
        ['objectives', index, 'dependsOn', dependencyIndex],
        dependency,
      );
    });
  });

  const visitState = new Map<string, 0 | 1 | 2>();
  const visit = (objectiveId: string, trail: readonly string[]): void => {
    const state = visitState.get(objectiveId) ?? 0;
    if (state === 1) {
      add(
        'plan.objective.cycle',
        'error',
        `Objective dependency cycle: ${[...trail, objectiveId].join(' -> ')}.`,
        ['objectives', objectiveIndexes.get(objectiveId) ?? 0, 'dependsOn'],
        objectiveId,
      );
      return;
    }
    if (state === 2) return;
    visitState.set(objectiveId, 1);
    (dependencies.get(objectiveId) ?? []).forEach(dependency => {
      if (objectiveIds.has(dependency)) visit(dependency, [...trail, objectiveId]);
    });
    visitState.set(objectiveId, 2);
  };
  objectivesRaw.forEach(entry => {
    if (isObject(entry) && isStableId(entry.id) && objectiveIds.has(entry.id)) visit(entry.id, []);
  });

  const exitConditionsRaw = Array.isArray(raw.exitConditions) ? raw.exitConditions : [];
  const exitConditionIds = new Set<string>();
  const exitRequirements = new Map<string, readonly string[]>();
  if (!Array.isArray(raw.exitConditions)) {
    add('plan.exit-conditions.invalid', 'error', 'Plan exitConditions must be an array.', ['exitConditions']);
  }
  exitConditionsRaw.forEach((entry, index) => {
    const base = ['exitConditions', index] as const;
    if (!isObject(entry)) {
      add('plan.exit-condition.invalid', 'error', 'Exit condition must be an object.', base);
      return;
    }
    if (!isStableId(entry.exitId)) {
      add('plan.exit-condition.exit-id.invalid', 'error', 'Exit id must be stable.',
        [...base, 'exitId'], String(entry.exitId));
    } else if (exitConditionIds.has(entry.exitId)) {
      add('plan.exit-condition.duplicate', 'error', `Exit condition is duplicated: ${entry.exitId}.`,
        [...base, 'exitId'], entry.exitId);
    } else {
      exitConditionIds.add(entry.exitId);
    }
    if (!isStableId(entry.regionId)) {
      add('plan.exit-condition.region-invalid', 'error', 'Exit condition regionId must be stable.',
        [...base, 'regionId'], String(entry.regionId));
    } else if (!regionIds.has(entry.regionId)) {
      add('plan.exit-condition.region-missing', 'error',
        `Exit condition references an unknown region: ${entry.regionId}.`,
        [...base, 'regionId'], entry.regionId);
    } else if (!exitRegionIds.has(entry.regionId)) {
      add('plan.exit-condition.region-not-exit', 'error',
        'Exit condition region must be declared in exitRegionIds.',
        [...base, 'regionId'], entry.regionId);
    }
    if (!Array.isArray(entry.requiresObjectiveIds) || entry.requiresObjectiveIds.length === 0) {
      add('plan.exit-condition.objectives-empty', 'error',
        'Exit condition requires at least one objective.', [...base, 'requiresObjectiveIds']);
      return;
    }
    const seen = new Set<string>();
    entry.requiresObjectiveIds.forEach((objectiveId, objectiveIndex) => {
      const objectivePath = [...base, 'requiresObjectiveIds', objectiveIndex];
      if (!isStableId(objectiveId)) {
        add('plan.exit-condition.objective-invalid', 'error',
          'Exit condition objective id must be stable.', objectivePath, String(objectiveId));
      } else if (seen.has(objectiveId)) {
        add('plan.exit-condition.objective-duplicate', 'error',
          'Exit condition objective is duplicated.', objectivePath, objectiveId);
      } else if (!objectiveIds.has(objectiveId)) {
        add('plan.exit-condition.objective-missing', 'error',
          `Exit condition references an unknown objective: ${objectiveId}.`, objectivePath, objectiveId);
      }
      if (isStableId(objectiveId)) seen.add(objectiveId);
    });
    if (isStableId(entry.exitId)) exitRequirements.set(entry.exitId, Object.freeze([...seen]));
  });

  exitRegionIds.forEach(exitRegionId => {
    const covered = exitConditionsRaw.some(entry =>
      isObject(entry) && entry.regionId === exitRegionId);
    if (!covered) add(
      'plan.exit.condition-missing', 'error',
      `Exit region has no exit condition: ${exitRegionId}.`, ['exitConditions'], exitRegionId,
    );
  });

  unlockRefs.forEach((exitIds, objectiveId) => {
    const index = objectiveIndexes.get(objectiveId);
    if (index === undefined) return;
    exitIds.forEach((exitId, exitIndex) => {
      if (!exitConditionIds.has(exitId)) add(
        'plan.objective.exit-missing',
        'error',
        `Objective unlocks an unknown exit condition: ${exitId}.`,
        ['objectives', index, 'unlocksExitIds', exitIndex],
        exitId,
      );
      const required = exitRequirements.get(exitId);
      if (required && !required.includes(objectiveId)) add(
        'plan.exit-condition.objective-not-required',
        'error',
        `Exit condition ${exitId} does not require objective ${objectiveId} that unlocks it.`,
        ['objectives', index, 'unlocksExitIds', exitIndex],
        exitId,
      );
    });
  });

  if (isStableId(startRegionId) && regionIds.has(startRegionId)) {
    const adjacency = new Map<string, Set<string>>();
    regionIds.forEach(regionId => adjacency.set(regionId, new Set()));
    regionsRaw.forEach(entry => {
      const regionId = isObject(entry) ? entry.id : undefined;
      if (!isStableId(regionId) || !isObject(entry) || !Array.isArray(entry.connections)) return;
      entry.connections.forEach(connection => {
        if (!isStableId(connection) || !regionIds.has(connection)) return;
        adjacency.get(regionId)?.add(connection);
        adjacency.get(connection)?.add(regionId);
      });
    });
    const reachable = new Set<string>([startRegionId]);
    const pending = [startRegionId];
    while (pending.length > 0) {
      const current = pending.shift()!;
      adjacency.get(current)?.forEach(next => {
        if (!reachable.has(next)) {
          reachable.add(next);
          pending.push(next);
        }
      });
    }
    regionsRaw.forEach((entry, index) => {
      if (!isObject(entry) || !isStableId(entry.id) || !regionIds.has(entry.id)) return;
      if (!reachable.has(entry.id)) add(
        'plan.region.unreachable',
        'error',
        `Region is not reachable from the start region: ${entry.id}.`,
        ['regions', index],
        entry.id,
      );
    });
  }

  const profile = new Map(DEFAULT_STAGE_RUNTIME_CAPABILITIES.capabilities
    .map(capability => [capability.id, capability]));
  const encountersRaw = Array.isArray(raw.encounters) ? raw.encounters : [];
  const encounterIds = new Set<string>();
  encountersRaw.forEach((entry, index) => {
    const base = ['encounters', index] as const;
    if (!isObject(entry)) {
      add('plan.encounter.invalid', 'error', 'Encounter must be an object.', base);
      return;
    }
    if (!isStableId(entry.id)) {
      add('plan.encounter.id.invalid', 'error', 'Encounter id must be stable.', [...base, 'id'], String(entry.id));
    } else if (encounterIds.has(entry.id)) {
      add('plan.encounter.id.duplicate', 'error', `Encounter id is duplicated: ${entry.id}.`,
        [...base, 'id'], entry.id);
    } else {
      encounterIds.add(entry.id);
    }
    if (!isStableId(entry.regionId) || !regionIds.has(entry.regionId)) add(
      'plan.encounter.region-missing', 'error',
      `Encounter references an unknown region: ${String(entry.regionId)}.`, [...base, 'regionId'],
      String(entry.regionId),
    );
    if (!Array.isArray(entry.archetypes) || entry.archetypes.length === 0) {
      add('plan.encounter.archetypes.empty', 'error',
        'Encounter requires at least one archetype.', [...base, 'archetypes']);
    } else entry.archetypes.forEach((archetype, archetypeIndex) => {
      const archetypePath = [...base, 'archetypes', archetypeIndex];
      if (!STAGE_ENEMY_ARCHETYPES.includes(archetype as StageEnemyArchetype)) {
        add('plan.encounter.archetype.unknown', 'error',
          `Encounter archetype is unknown: ${String(archetype)}.`, archetypePath, String(archetype));
        return;
      }
      if (profile.get(`enemy.${archetype}`)?.status !== 'supported') add(
        'plan.encounter.archetype.unavailable', 'error',
        `Encounter archetype is not supported: ${archetype}.`, archetypePath, String(archetype),
      );
    });
    if (entry.waveCount !== undefined &&
      (!Number.isInteger(entry.waveCount) || Number(entry.waveCount) < 1)) add(
      'plan.encounter.wave-count.invalid', 'error', 'waveCount must be a positive integer.',
      [...base, 'waveCount'],
    );
  });

  const interactionsRaw = Array.isArray(raw.interactions) ? raw.interactions : [];
  const interactionIds = new Set<string>();
  interactionsRaw.forEach((entry, index) => {
    const base = ['interactions', index] as const;
    if (!isObject(entry)) {
      add('plan.interaction.invalid', 'error', 'Interaction must be an object.', base);
      return;
    }
    if (!isStableId(entry.id)) {
      add('plan.interaction.id.invalid', 'error', 'Interaction id must be stable.',
        [...base, 'id'], String(entry.id));
    } else if (interactionIds.has(entry.id)) {
      add('plan.interaction.id.duplicate', 'error', `Interaction id is duplicated: ${entry.id}.`,
        [...base, 'id'], entry.id);
    } else {
      interactionIds.add(entry.id);
    }
    if (!isStableId(entry.regionId) || !regionIds.has(entry.regionId)) add(
      'plan.interaction.region-missing', 'error',
      `Interaction references an unknown region: ${String(entry.regionId)}.`, [...base, 'regionId'],
      String(entry.regionId),
    );
    if (!STAGE_PLAN_INTERACTION_KINDS.includes(entry.kind as StagePlanInteractionKind)) add(
      'plan.interaction.kind.invalid', 'error', 'Interaction kind is invalid.',
      [...base, 'kind'], String(entry.kind),
    );
    if (!isStableId(entry.referenceId)) add(
      'plan.interaction.reference.invalid', 'error', 'Interaction referenceId must be stable.',
      [...base, 'referenceId'], String(entry.referenceId),
    );
  });
  if (interactionsRaw.length > 0) add(
    'plan.references.chapter-local', 'info',
    `${interactionsRaw.length} interaction reference(s) use chapter-local ids and must be verified in the chapter.`,
    ['interactions'],
  );

  if (raw.capabilities === undefined) {
    add('plan.capabilities.missing', 'info',
      'Plan declares no capability requirements; the chapter manifest still must.', ['capabilities']);
  } else {
    validateStageCapabilityRequirements(
      raw.capabilities as readonly StageCapabilityRequirement[] | undefined,
      profile,
      ['capabilities'],
    ).forEach(item => add(
      item.code,
      item.severity,
      item.message,
      item.path,
      item.referenceId,
    ));
  }

  if (raw.themeCapabilityId !== undefined) {
    if (!isStableId(raw.themeCapabilityId)) {
      add('plan.theme.invalid', 'error', 'themeCapabilityId must be stable.',
        ['themeCapabilityId'], String(raw.themeCapabilityId));
    } else {
      const theme = profile.get(raw.themeCapabilityId);
      if (theme && theme.category !== 'theme') add(
        'plan.theme.category-invalid', 'error',
        `themeCapabilityId is not a theme capability: ${raw.themeCapabilityId}.`,
        ['themeCapabilityId'], raw.themeCapabilityId,
      );
      else if (theme?.status === 'planned') add(
        'plan.theme.unavailable', 'warning',
        `Theme capability is planned, not implemented: ${raw.themeCapabilityId}.`,
        ['themeCapabilityId'], raw.themeCapabilityId,
      );
      else if (!theme) add(
        'plan.theme.dynamic', 'warning',
        `Theme is not listed globally; verify it is registered by the chapter: ${raw.themeCapabilityId}.`,
        ['themeCapabilityId'], raw.themeCapabilityId,
      );
    }
  }

  return finish(planPath, raw, diagnostics);
}

/** Reads and validates a plan file through the existing CLI file system. */
export function validateStagePlanFile(
  planFilePath: string,
  fileSystem: ChapterFileSystem,
  displayPath = planFilePath,
): StagePlanValidationReport {
  if (!fileSystem.exists(planFilePath)) {
    return finish(displayPath, undefined, [diagnostic({
      code: 'plan.missing',
      severity: 'error',
      message: `Stage plan file is missing: ${displayPath}.`,
      path: [],
    })]);
  }
  let source: string;
  try {
    source = fileSystem.readFile(planFilePath);
  } catch (error) {
    return finish(displayPath, undefined, [diagnostic({
      code: 'plan.read-failed',
      severity: 'error',
      message: `Stage plan could not be read: ${error instanceof Error ? error.message : String(error)}`,
      path: [],
    })]);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(source);
  } catch (error) {
    return finish(displayPath, undefined, [diagnostic({
      code: 'plan.json-invalid',
      severity: 'error',
      message: `Stage plan is not valid JSON: ${error instanceof Error ? error.message : String(error)}`,
      path: [],
    })]);
  }
  return validateStagePlan(parsed, displayPath);
}
