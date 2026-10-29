import type {
  CampaignContentReference,
  CampaignMacroDefinition,
  CampaignMacroDiagnostic,
  CampaignMacroProgressState,
  CampaignRegionDefinition,
  CampaignRouteProgress,
} from '../../stages';

const STABLE_ID = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/;

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function stable(value: unknown): value is string {
  return typeof value === 'string' && STABLE_ID.test(value);
}

function positiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
}

function strings(value: unknown, unique = true): value is readonly string[] {
  return Array.isArray(value) && value.every(stable) && (!unique || new Set(value).size === value.length);
}

function compare(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function diagnostic(
  values: CampaignMacroDiagnostic[],
  code: string,
  message: string,
  path: readonly (string | number)[],
  referenceId?: string,
): void {
  values.push({ code, message, path, ...(referenceId ? { referenceId } : {}) });
}

function validateContent(
  value: unknown,
  diagnostics: CampaignMacroDiagnostic[],
  path: readonly (string | number)[],
): value is CampaignContentReference {
  if (!record(value) || (value.kind !== 'stage' && value.kind !== 'planned')) {
    diagnostic(diagnostics, 'macro.content.invalid', 'Content reference must be stage or planned.', path);
    return false;
  }
  if (value.kind === 'stage') {
    if (!stable(value.stageId) || !positiveInteger(value.minimumManifestRevision)) {
      diagnostic(diagnostics, 'macro.content.stage-invalid', 'Playable content needs a stable stage and revision.', path);
      return false;
    }
  } else if (!stable(value.contentId) || typeof value.reason !== 'string' || !value.reason.trim()) {
    diagnostic(diagnostics, 'macro.content.planned-invalid', 'Planned content needs an ID and reason.', path);
    return false;
  }
  return true;
}

function validateRegions(
  values: unknown,
  expectedLayer: 1 | 2,
  diagnostics: CampaignMacroDiagnostic[],
  path: readonly (string | number)[],
  globalIds: Set<string>,
): CampaignRegionDefinition[] {
  if (!Array.isArray(values) || values.length === 0) {
    diagnostic(diagnostics, 'macro.regions.invalid', 'A route layer needs ordered regions.', path);
    return [];
  }
  const result: CampaignRegionDefinition[] = [];
  values.forEach((value, index) => {
    if (!record(value) || !stable(value.id) || typeof value.title !== 'string' || !value.title.trim() ||
      value.order !== index || value.difficultyLayer !== expectedLayer ||
      typeof value.allowsHubReturn !== 'boolean' ||
      !validateContent(value.content, diagnostics, [...path, index, 'content'])) {
      diagnostic(diagnostics, 'macro.region.invalid', 'Region identity, order or layer is invalid.',
        [...path, index]);
      return;
    }
    if (globalIds.has(value.id)) diagnostic(diagnostics, 'macro.region.duplicate',
      'Region IDs must be globally unique.', [...path, index, 'id'], value.id);
    globalIds.add(value.id);
    result.push(value as unknown as CampaignRegionDefinition);
  });
  return result;
}

export function validateCampaignMacroDefinition(value: unknown): readonly CampaignMacroDiagnostic[] {
  const diagnostics: CampaignMacroDiagnostic[] = [];
  if (!record(value) || value.schemaVersion !== 1 || !stable(value.id) ||
    !positiveInteger(value.revision) || typeof value.title !== 'string' || !value.title.trim()) {
    diagnostic(diagnostics, 'macro.definition.invalid', 'Macro definition header is invalid.', []);
    return diagnostics;
  }
  if (!record(value.hub) || !stable(value.hub.id) || value.hub.difficultyLayer !== 0 ||
    !validateContent(value.hub.content, diagnostics, ['hub', 'content'])) {
    diagnostic(diagnostics, 'macro.hub.invalid', 'Hub definition is invalid.', ['hub']);
  }

  const regionIds = new Set<string>();
  const routeIds = new Set<string>();
  const routeRegions = new Map<string, readonly CampaignRegionDefinition[]>();
  const routeMilestones = new Map<string, string>();
  if (!Array.isArray(value.routes) || value.routes.length === 0) {
    diagnostic(diagnostics, 'macro.routes.invalid', 'At least one independent route is required.', ['routes']);
  } else value.routes.forEach((route, index) => {
    if (!record(route) || !stable(route.id) || typeof route.title !== 'string' || !route.title.trim() ||
      !stable(route.completionMilestoneId)) {
      diagnostic(diagnostics, 'macro.route.invalid', 'Route definition is invalid.', ['routes', index]);
      return;
    }
    if (routeIds.has(route.id)) diagnostic(diagnostics, 'macro.route.duplicate',
      'Route IDs must be unique.', ['routes', index, 'id'], route.id);
    routeIds.add(route.id);
    const regions = validateRegions(route.regions, 1, diagnostics,
      ['routes', index, 'regions'], regionIds);
    if (regions.length > 0 && !regions.some(region => region.allowsHubReturn)) {
      diagnostic(diagnostics, 'macro.route.hub-return-missing',
        'Every route needs at least one declared return point to the hub.',
        ['routes', index, 'regions'], route.id);
    }
    routeRegions.set(route.id, regions);
    routeMilestones.set(route.id, route.completionMilestoneId);
  });

  let corruptedRegionIds = new Set<string>();
  if (!record(value.corruptedLayer) || !stable(value.corruptedLayer.id) ||
    value.corruptedLayer.difficultyLayer !== 2 || !stable(value.corruptedLayer.completionMilestoneId)) {
    diagnostic(diagnostics, 'macro.corrupted.invalid', 'Corrupted layer definition is invalid.',
      ['corruptedLayer']);
  } else {
    const regions = validateRegions(value.corruptedLayer.regions, 2, diagnostics,
      ['corruptedLayer', 'regions'], regionIds);
    if (regions.length > 0 && !regions.some(region => region.allowsHubReturn)) {
      diagnostic(diagnostics, 'macro.corrupted.hub-return-missing',
        'Corrupted progression needs at least one return point to the hub.',
        ['corruptedLayer', 'regions'], value.corruptedLayer.id as string);
    }
    corruptedRegionIds = new Set(regions.map(region => region.id));
    const condition = value.corruptedLayer.unlockCondition;
    if (!record(condition) || condition.type !== 'routes.completed' || !strings(condition.routeIds) ||
      condition.routeIds.length !== routeIds.size ||
      condition.routeIds.some(routeId => !routeIds.has(routeId))) {
      diagnostic(diagnostics, 'macro.corrupted.unlock-invalid',
        'Corrupted layer must require every declared route.', ['corruptedLayer', 'unlockCondition']);
    }
  }

  const milestoneIds = new Set<string>();
  const operationIds = new Set<string>();
  if (!Array.isArray(value.milestones)) {
    diagnostic(diagnostics, 'macro.milestones.invalid', 'Milestones must be an array.', ['milestones']);
  } else value.milestones.forEach((milestone, index) => {
    if (!record(milestone) || !stable(milestone.id) || !stable(milestone.completionOperationId) ||
      !strings(milestone.requiredRegionIds) || !record(milestone.scope)) {
      diagnostic(diagnostics, 'macro.milestone.invalid', 'Milestone definition is invalid.',
        ['milestones', index]);
      return;
    }
    if (milestoneIds.has(milestone.id)) diagnostic(diagnostics, 'macro.milestone.duplicate',
      'Milestone IDs must be unique.', ['milestones', index, 'id'], milestone.id);
    if (operationIds.has(milestone.completionOperationId)) diagnostic(diagnostics,
      'macro.operation.duplicate', 'Completion operation IDs must be unique.',
      ['milestones', index, 'completionOperationId'], milestone.completionOperationId);
    milestoneIds.add(milestone.id);
    operationIds.add(milestone.completionOperationId);
    const requiredRegionIds = milestone.requiredRegionIds as readonly string[];
    if (milestone.scope.kind === 'route' && stable(milestone.scope.routeId)) {
      const expected = routeRegions.get(milestone.scope.routeId)?.map(region => region.id) ?? [];
      if (routeMilestones.get(milestone.scope.routeId) !== milestone.id ||
        expected.length !== requiredRegionIds.length ||
        expected.some(regionId => !requiredRegionIds.includes(regionId))) {
        diagnostic(diagnostics, 'macro.milestone.route-mismatch',
          'Route milestone must require every region of its route.', ['milestones', index], milestone.id);
      }
    } else if (milestone.scope.kind === 'corrupted-layer') {
      const expected = [...corruptedRegionIds];
      if (expected.length !== requiredRegionIds.length ||
        expected.some(regionId => !requiredRegionIds.includes(regionId))) {
        diagnostic(diagnostics, 'macro.milestone.corrupted-mismatch',
          'Corrupted milestone must require every corrupted region.', ['milestones', index], milestone.id);
      }
    } else diagnostic(diagnostics, 'macro.milestone.scope-invalid', 'Milestone scope is invalid.',
      ['milestones', index, 'scope']);
  });

  for (const [routeId, milestoneId] of routeMilestones) if (!milestoneIds.has(milestoneId)) {
    diagnostic(diagnostics, 'macro.route.milestone-missing', 'Route milestone is not declared.',
      ['routes'], `${routeId}:${milestoneId}`);
  }
  if (record(value.corruptedLayer) && stable(value.corruptedLayer.completionMilestoneId) &&
    !milestoneIds.has(value.corruptedLayer.completionMilestoneId)) {
    diagnostic(diagnostics, 'macro.corrupted.milestone-missing',
      'Corrupted completion milestone is not declared.', ['corruptedLayer', 'completionMilestoneId']);
  }
  if (!record(value.final) || !stable(value.final.id) || value.final.difficultyLayer !== 3 ||
    !validateContent(value.final.content, diagnostics, ['final', 'content']) ||
    !record(value.final.unlockCondition) || value.final.unlockCondition.type !== 'milestone.completed' ||
    value.final.unlockCondition.milestoneId !== (record(value.corruptedLayer)
      ? value.corruptedLayer.completionMilestoneId : undefined)) {
    diagnostic(diagnostics, 'macro.final.invalid',
      'Final must be gated by the corrupted completion milestone.', ['final']);
  }
  return Object.freeze(diagnostics.sort((left, right) =>
    compare(`${left.path.join('.')}|${left.code}`, `${right.path.join('.')}|${right.code}`)));
}

export function createCampaignMacroProgress(
  definition: CampaignMacroDefinition,
): CampaignMacroProgressState {
  const routes = Object.fromEntries(definition.routes.map(route => [route.id, Object.freeze({
    routeId: route.id,
    status: 'not-started' as const,
    completedRegionIds: Object.freeze([]),
  })]));
  return canonicalCampaignMacroProgress({
    version: 1,
    definitionId: definition.id,
    definitionRevision: definition.revision,
    currentLocation: { kind: 'hub', hubId: definition.hub.id },
    routes,
    completedMilestoneIds: [],
    corrupted: { status: 'locked', completedRegionIds: [] },
    finalStatus: 'locked',
    processedOperationIds: [],
  });
}

export function canonicalCampaignMacroProgress(
  state: CampaignMacroProgressState,
): CampaignMacroProgressState {
  const routes = Object.freeze(Object.fromEntries(Object.entries(state.routes)
    .sort(([left], [right]) => compare(left, right))
    .map(([id, route]) => [id, Object.freeze({
      routeId: route.routeId,
      status: route.status,
      completedRegionIds: Object.freeze([...route.completedRegionIds]),
      ...(route.currentRegionId ? { currentRegionId: route.currentRegionId } : {}),
    })])));
  return Object.freeze({
    version: 1 as const,
    definitionId: state.definitionId,
    definitionRevision: state.definitionRevision,
    currentLocation: Object.freeze({ ...state.currentLocation }),
    routes,
    completedMilestoneIds: Object.freeze([...state.completedMilestoneIds].sort(compare)),
    corrupted: Object.freeze({
      status: state.corrupted.status,
      completedRegionIds: Object.freeze([...state.corrupted.completedRegionIds]),
      ...(state.corrupted.currentRegionId
        ? { currentRegionId: state.corrupted.currentRegionId } : {}),
    }),
    finalStatus: state.finalStatus,
    processedOperationIds: Object.freeze([...state.processedOperationIds].sort(compare)),
  });
}

export function validateCampaignMacroProgress(
  value: unknown,
  definition?: CampaignMacroDefinition,
): readonly CampaignMacroDiagnostic[] {
  const diagnostics: CampaignMacroDiagnostic[] = [];
  if (!record(value) || value.version !== 1 || !stable(value.definitionId) ||
    !positiveInteger(value.definitionRevision) || !record(value.currentLocation) ||
    !record(value.routes) || !strings(value.completedMilestoneIds) ||
    !record(value.corrupted) || !strings(value.processedOperationIds) ||
    (value.finalStatus !== 'locked' && value.finalStatus !== 'available' && value.finalStatus !== 'entered')) {
    diagnostic(diagnostics, 'macro.state.invalid', 'Macro progress state is structurally invalid.', []);
    return diagnostics;
  }

  const routeValues = new Map<string, CampaignRouteProgress>();
  Object.entries(value.routes).forEach(([routeId, progress]) => {
    if (!stable(routeId) || !record(progress) || progress.routeId !== routeId ||
      (progress.status !== 'not-started' && progress.status !== 'in-progress' &&
        progress.status !== 'completed') || !strings(progress.completedRegionIds) ||
      (progress.currentRegionId !== undefined && !stable(progress.currentRegionId))) {
      diagnostic(diagnostics, 'macro.state.route-invalid', 'Route progress is invalid.',
        ['routes', routeId], routeId);
    } else routeValues.set(routeId, progress as unknown as CampaignRouteProgress);
  });
  if (value.corrupted.status !== 'locked' && value.corrupted.status !== 'available' &&
    value.corrupted.status !== 'in-progress' && value.corrupted.status !== 'milestone-completed') {
    diagnostic(diagnostics, 'macro.state.corrupted-invalid', 'Corrupted progress status is invalid.',
      ['corrupted', 'status']);
  }
  if (!strings(value.corrupted.completedRegionIds) ||
    (value.corrupted.currentRegionId !== undefined && !stable(value.corrupted.currentRegionId))) {
    diagnostic(diagnostics, 'macro.state.corrupted-invalid', 'Corrupted region progress is invalid.',
      ['corrupted']);
  }
  if (value.finalStatus !== 'locked' && value.corrupted.status !== 'milestone-completed') {
    diagnostic(diagnostics, 'macro.state.final-early',
      'Final cannot unlock before corrupted progress reaches its milestone.', ['finalStatus']);
  }
  const location = value.currentLocation;
  if ((location.kind === 'hub' && !stable(location.hubId)) ||
    (location.kind === 'route' && (!stable(location.routeId) || !stable(location.regionId))) ||
    (location.kind === 'corrupted' && !stable(location.regionId)) ||
    (location.kind === 'final' && !stable(location.finalId)) ||
    (location.kind !== 'hub' && location.kind !== 'route' &&
      location.kind !== 'corrupted' && location.kind !== 'final')) {
    diagnostic(diagnostics, 'macro.state.location-invalid', 'Current macro location is invalid.',
      ['currentLocation']);
  }
  if (!definition || diagnostics.length > 0) return diagnostics;
  if (value.definitionId !== definition.id || value.definitionRevision !== definition.revision) {
    diagnostic(diagnostics, 'macro.state.identity-mismatch',
      'Macro progress belongs to another definition revision.', ['definitionId'], value.definitionId);
    return diagnostics;
  }

  const expectedRoutes = new Set(definition.routes.map(route => route.id));
  if (routeValues.size !== expectedRoutes.size || [...routeValues.keys()].some(id => !expectedRoutes.has(id))) {
    diagnostic(diagnostics, 'macro.state.route-set-mismatch',
      'Macro progress must contain exactly the declared routes.', ['routes']);
  }
  for (const route of definition.routes) {
    const progress = routeValues.get(route.id);
    if (!progress) continue;
    const regionIds = route.regions.map(region => region.id);
    if (progress.completedRegionIds.some(id => !regionIds.includes(id)) ||
      progress.completedRegionIds.some((id, index) => id !== regionIds[index])) {
      diagnostic(diagnostics, 'macro.state.route-order-invalid',
        'Completed route regions must form an ordered prefix.', ['routes', route.id], route.id);
    }
    if (progress.status === 'not-started' &&
      (progress.completedRegionIds.length > 0 || progress.currentRegionId !== undefined)) {
      diagnostic(diagnostics, 'macro.state.route-status-invalid',
        'A not-started route cannot contain progress.', ['routes', route.id], route.id);
    }
    if (progress.status === 'completed' &&
      (progress.completedRegionIds.length !== regionIds.length || progress.currentRegionId !== undefined)) {
      diagnostic(diagnostics, 'macro.state.route-status-invalid',
        'A completed route must contain every region and no current region.', ['routes', route.id], route.id);
    }
    if (progress.currentRegionId && !regionIds.includes(progress.currentRegionId)) {
      diagnostic(diagnostics, 'macro.state.route-current-invalid',
        'Current route region is not declared.', ['routes', route.id, 'currentRegionId'], progress.currentRegionId);
    }
    const milestoneCompleted = (value.completedMilestoneIds as readonly string[])
      .includes(route.completionMilestoneId);
    if ((progress.status === 'completed') !== milestoneCompleted) {
      diagnostic(diagnostics, 'macro.state.route-milestone-mismatch',
        'Route completion and its narrative milestone must agree.', ['routes', route.id], route.id);
    }
  }

  const milestoneIds = new Set(definition.milestones.map(item => item.id));
  (value.completedMilestoneIds as readonly string[]).forEach(id => {
    if (!milestoneIds.has(id)) diagnostic(diagnostics, 'macro.state.milestone-unknown',
      'Completed milestone is not declared.', ['completedMilestoneIds'], id);
  });
  const allRoutesCompleted = definition.routes.every(route =>
    routeValues.get(route.id)?.status === 'completed');
  if (!allRoutesCompleted && value.corrupted.status !== 'locked') diagnostic(diagnostics,
    'macro.state.corrupted-early', 'Corrupted layer unlocked before every route completed.', ['corrupted']);
  if (allRoutesCompleted && value.corrupted.status === 'locked') diagnostic(diagnostics,
    'macro.state.corrupted-stale', 'Corrupted layer must unlock after every route completed.', ['corrupted']);
  const corruptedIds = definition.corruptedLayer.regions.map(region => region.id);
  if ((value.corrupted.completedRegionIds as readonly string[]).some((id, index) =>
    id !== corruptedIds[index])) diagnostic(diagnostics, 'macro.state.corrupted-order-invalid',
    'Completed corrupted regions must form an ordered prefix.', ['corrupted', 'completedRegionIds']);
  const corruptedCompleted = (value.completedMilestoneIds as readonly string[])
    .includes(definition.corruptedLayer.completionMilestoneId);
  if (corruptedCompleted && value.corrupted.status !== 'milestone-completed') diagnostic(diagnostics,
    'macro.state.corrupted-milestone-stale', 'Corrupted milestone status is inconsistent.', ['corrupted']);
  if (!corruptedCompleted && value.finalStatus !== 'locked') diagnostic(diagnostics,
    'macro.state.final-early', 'Final unlocked before the corrupted milestone.', ['finalStatus']);
  if (corruptedCompleted && value.finalStatus === 'locked') diagnostic(diagnostics,
    'macro.state.final-stale', 'Final must unlock after the corrupted milestone.', ['finalStatus']);

  if (location.kind === 'hub' && location.hubId !== definition.hub.id) diagnostic(diagnostics,
    'macro.state.location-reference', 'Hub location is unknown.', ['currentLocation'], location.hubId as string);
  if (location.kind === 'route') {
    const route = definition.routes.find(item => item.id === location.routeId);
    if (!route || !route.regions.some(region => region.id === location.regionId)) diagnostic(diagnostics,
      'macro.state.location-reference', 'Route location is unknown.', ['currentLocation'], location.regionId as string);
    else if (routeValues.get(route.id)?.status !== 'in-progress') diagnostic(diagnostics,
      'macro.state.location-status', 'Current route location must belong to an in-progress route.',
      ['currentLocation'], route.id);
  }
  if (location.kind === 'corrupted' &&
    !definition.corruptedLayer.regions.some(region => region.id === location.regionId)) diagnostic(diagnostics,
    'macro.state.location-reference', 'Corrupted location is unknown.', ['currentLocation'], location.regionId as string);
  else if (location.kind === 'corrupted' && value.corrupted.status !== 'in-progress') diagnostic(diagnostics,
    'macro.state.location-status', 'Current corrupted location requires in-progress status.',
    ['currentLocation'], location.regionId as string);
  if (location.kind === 'final' && location.finalId !== definition.final.id) diagnostic(diagnostics,
    'macro.state.location-reference', 'Final location is unknown.', ['currentLocation'], location.finalId as string);
  else if (location.kind === 'final' && value.finalStatus !== 'entered') diagnostic(diagnostics,
    'macro.state.location-status', 'Current final location requires entered status.',
    ['currentLocation'], location.finalId as string);

  return Object.freeze(diagnostics.sort((left, right) =>
    compare(`${left.path.join('.')}|${left.code}`, `${right.path.join('.')}|${right.code}`)));
}

export function isCampaignContentLoadable(content: CampaignContentReference): boolean {
  return content.kind === 'stage';
}
