import type {
  CampaignActId,
  CampaignCompositionActRule,
  CampaignCompositionAssignment,
  CampaignCompositionCatalog,
  CampaignCompositionDiagnostic,
  CampaignCompositionDiagnosticCode,
  CampaignCompositionFailureCode,
  CampaignCompositionMilestoneRequirement,
  CampaignCompositionRequest,
  CampaignCompositionResult,
  CampaignCompositionSnapshot,
  CampaignCompositionValue,
  CampaignNodeKind,
  StageCatalogEntry,
} from '../contracts';
import {
  CAMPAIGN_COMPOSITION_SNAPSHOT_SCHEMA,
  FIXED_NINE_COMPOSITION_POLICY_ID,
} from '../contracts';
import { CampaignCompositionGraphAdapter } from './CampaignCompositionGraphAdapter';

const CAMPAIGN_COMPLETE = 'campaign.complete';

interface CompositionSlot {
  readonly slotId: string;
  readonly actId: CampaignActId;
  readonly depth: number;
  readonly kind: CampaignNodeKind;
  readonly requiredBeatId?: string;
}

export const FIXED_NINE_COMPOSITION_SLOTS: readonly CompositionSlot[] = Object.freeze([
  Object.freeze({ slotId: 'act-1.entry', actId: 'act-1', depth: 0, kind: 'intermediate' }),
  Object.freeze({ slotId: 'act-1.intermediate', actId: 'act-1', depth: 1, kind: 'intermediate' }),
  Object.freeze({
    slotId: 'act-1.milestone', actId: 'act-1', depth: 2, kind: 'milestone',
    requiredBeatId: 'beat.act-1',
  }),
  Object.freeze({ slotId: 'act-2.intermediate', actId: 'act-2', depth: 3, kind: 'intermediate' }),
  Object.freeze({ slotId: 'act-2.rejoin', actId: 'act-2', depth: 4, kind: 'intermediate' }),
  Object.freeze({
    slotId: 'act-2.milestone', actId: 'act-2', depth: 5, kind: 'milestone',
    requiredBeatId: 'beat.act-2',
  }),
  Object.freeze({ slotId: 'act-3.intermediate', actId: 'act-3', depth: 6, kind: 'intermediate' }),
  Object.freeze({ slotId: 'act-3.rejoin', actId: 'act-3', depth: 7, kind: 'intermediate' }),
  Object.freeze({
    slotId: 'act-3.milestone', actId: 'act-3', depth: 8, kind: 'milestone',
    requiredBeatId: 'beat.act-3',
  }),
]);

const STABLE_ID = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/;

function compare(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function stableId(value: unknown): value is string {
  return typeof value === 'string' && STABLE_ID.test(value) && value === value.trim();
}

function positiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
}

function sortedUnique(values: readonly string[] | undefined): readonly string[] {
  return Object.freeze([...new Set(values ?? [])].sort(compare));
}

function hashParts(...parts: readonly (string | number)[]): number {
  const text = parts.map(part => `${String(part).length}:${String(part)}`).join('|');
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function hashHex(...parts: readonly (string | number)[]): string {
  return hashParts(...parts).toString(16).padStart(8, '0');
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (isRecord(value)) return `{${Object.keys(value).sort(compare)
    .map(key => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}

function freezeDeep<T>(value: T): T {
  if (Array.isArray(value)) return Object.freeze(value.map(freezeDeep)) as T;
  if (value && typeof value === 'object') {
    return Object.freeze(Object.fromEntries(Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => compare(left, right))
      .map(([key, item]) => [key, freezeDeep(item)]))) as T;
  }
  return value;
}

function diagnosticKey(value: CampaignCompositionDiagnostic): string {
  return `${value.path.map(String).join('.')}|${value.code}|${value.stageId ?? ''}|${value.slotId ?? ''}`;
}

function diagnostics(values: readonly CampaignCompositionDiagnostic[]): readonly CampaignCompositionDiagnostic[] {
  return Object.freeze([...values].sort((left, right) => compare(diagnosticKey(left), diagnosticKey(right)))
    .map(value => Object.freeze({ ...value, path: Object.freeze([...value.path]) })));
}

function issue(
  code: CampaignCompositionDiagnosticCode,
  message: string,
  path: readonly (string | number)[],
  options: Partial<Pick<CampaignCompositionDiagnostic, 'severity' | 'stageId' | 'slotId' | 'referenceId'>> = {},
): CampaignCompositionDiagnostic {
  return {
    code,
    severity: options.severity ?? 'error',
    message,
    path,
    ...(options.stageId ? { stageId: options.stageId } : {}),
    ...(options.slotId ? { slotId: options.slotId } : {}),
    ...(options.referenceId ? { referenceId: options.referenceId } : {}),
  };
}

function failure(
  code: CampaignCompositionFailureCode,
  values: readonly CampaignCompositionDiagnostic[],
): CampaignCompositionResult {
  return Object.freeze({
    ok: false as const,
    error: Object.freeze({ code, diagnostics: diagnostics(values) }),
  });
}

function intersects(values: readonly string[], allowed: readonly string[] | undefined): boolean {
  return allowed === undefined || values.some(value => allowed.includes(value));
}

/**
 * A definition without declared exits uses synthetic slots and is placement
 * agnostic. Otherwise the position's successor must be one of the destinations
 * its manifest declares. `targetStageId` names a stage definition (or
 * `campaign.complete`), never a node id or a stage instance id.
 */
function destinationCompatible(entry: StageCatalogEntry, successorStageId: string): boolean {
  return entry.exits.length === 0 ||
    entry.exits.some(exit => exit.targetStageId === successorStageId);
}

function declaredExitsMatch(
  assignment: CampaignCompositionAssignment,
  entry: StageCatalogEntry,
): boolean {
  if (assignment.declaredExits.length !== entry.exits.length) return false;
  return assignment.declaredExits.every((exit, index) =>
    exit.id === entry.exits[index].id && exit.targetStageId === entry.exits[index].targetStageId);
}

function combinedAllowed(
  globalValues: readonly string[] | undefined,
  localValues: readonly string[] | undefined,
): readonly string[] | undefined {
  const global = sortedUnique(globalValues);
  const local = sortedUnique(localValues);
  if (global.length === 0 && local.length === 0) return undefined;
  if (global.length === 0) return local;
  if (local.length === 0) return global;
  return Object.freeze(global.filter(value => local.includes(value)));
}

function selectValue(
  values: readonly string[],
  allowed: readonly string[] | undefined,
  salt: string,
): string | undefined {
  const filtered = [...values].filter(value => allowed === undefined || allowed.includes(value)).sort(compare);
  return filtered.length > 0 ? filtered[hashParts(salt) % filtered.length] : undefined;
}

function actRule(request: CampaignCompositionRequest, actId: CampaignActId): CampaignCompositionActRule {
  return request.acts.find(rule => rule.actId === actId) as CampaignCompositionActRule;
}

function milestone(
  request: CampaignCompositionRequest,
  slotId: string,
): CampaignCompositionMilestoneRequirement | undefined {
  return request.mandatoryMilestones.find(value => value.slotId === slotId);
}

function candidateDigest(entries: readonly StageCatalogEntry[]): string {
  return `catalog.${hashHex('catalog', canonicalJson(entries.map(entry => ({
    stageId: entry.stageId,
    chapterId: entry.chapterId,
    manifestRevision: entry.manifestRevision,
    chapterRevision: entry.chapterRevision,
    eligibility: entry.eligibility,
    role: entry.role,
  }))))}`;
}

function assignmentIdentityInput(assignments: readonly Omit<CampaignCompositionAssignment, 'stageInstanceId'>[]): string {
  return canonicalJson(assignments.map(value => ({
    slotId: value.slotId,
    stageId: value.stageId,
    manifestRevision: value.manifestRevision,
    chapterRevision: value.chapterRevision,
  })));
}

function graphMatches(snapshot: CampaignCompositionSnapshot, graph: CampaignCompositionValue['graph']): boolean {
  if (graph.nodes.length !== snapshot.assignments.length) return false;
  return snapshot.assignments.every(assignment => graph.nodes.some(node =>
    node.slotId === assignment.slotId &&
    node.stageId === assignment.stageId &&
    node.actId === assignment.actId &&
    node.depth === assignment.depth));
}

function requestDiagnostics(request: CampaignCompositionRequest): readonly CampaignCompositionDiagnostic[] {
  const values: CampaignCompositionDiagnostic[] = [];
  if (!isRecord(request)) return [issue(
    'composition.request.invalid', 'Composition request must be an object.', [],
  )];
  if (request.policyId !== FIXED_NINE_COMPOSITION_POLICY_ID) values.push(issue(
    'composition.policy.unsupported', `Unsupported composition policy: ${String(request.policyId)}.`,
    ['policyId'], { referenceId: String(request.policyId) },
  ));
  if (!stableId(request.campaignId)) values.push(issue(
    'composition.request.invalid', 'campaignId must be a stable ID.', ['campaignId'],
  ));
  if (!stableId(request.runId)) values.push(issue(
    'composition.request.invalid', 'runId must be a stable ID.', ['runId'],
  ));
  if (!positiveInteger(request.campaignRevision)) values.push(issue(
    'composition.request.invalid', 'campaignRevision must be a positive integer.', ['campaignRevision'],
  ));
  if (!((typeof request.seed === 'string' && request.seed.trim().length > 0) ||
    (typeof request.seed === 'number' && Number.isFinite(request.seed)))) values.push(issue(
    'composition.request.invalid', 'seed must be a non-empty string or finite number.', ['seed'],
  ));
  if (!positiveInteger(request.desiredStageCount)) values.push(issue(
    'composition.quantity.invalid', 'desiredStageCount must be a positive integer.', ['desiredStageCount'],
  ));
  if (request.desiredStageCount !== FIXED_NINE_COMPOSITION_SLOTS.length) values.push(issue(
    'composition.topology.incompatible',
    `Policy ${FIXED_NINE_COMPOSITION_POLICY_ID} supports exactly nine selected definitions.`,
    ['desiredStageCount'],
  ));
  if (request.repetitionPolicy !== 'forbid' && request.repetitionPolicy !== 'allow-repeatable') {
    values.push(issue('composition.request.invalid', 'repetitionPolicy is invalid.', ['repetitionPolicy']));
  }
  if (!Array.isArray(request.acts)) values.push(issue(
    'composition.request.invalid', 'acts must be an array.', ['acts'],
  ));
  else {
    const expected = ['act-1', 'act-2', 'act-3'];
    const ids = request.acts.map(value => value.actId);
    if (ids.length !== 3 || new Set(ids).size !== 3 || !expected.every(id => ids.includes(id))) {
      values.push(issue('composition.topology.incompatible',
        'Fixed-nine policy requires exactly act-1, act-2 and act-3.', ['acts']));
    }
    request.acts.forEach((value, index) => {
      if (value.stageCount !== 3) values.push(issue(
        'composition.topology.incompatible', 'Each fixed-nine act must contain three definitions.',
        ['acts', index, 'stageCount'], { referenceId: value.actId },
      ));
      if (!isRecord(value.difficulty) || !Number.isFinite(value.difficulty.minimum) ||
        !Number.isFinite(value.difficulty.maximum) || value.difficulty.minimum < 1 ||
        value.difficulty.maximum < value.difficulty.minimum) values.push(issue(
        'composition.request.invalid', 'Act difficulty range is invalid.', ['acts', index, 'difficulty'],
      ));
    });
  }
  const milestoneSlots = FIXED_NINE_COMPOSITION_SLOTS.filter(slot => slot.kind === 'milestone');
  if (!Array.isArray(request.mandatoryMilestones) || request.mandatoryMilestones.length !== 3 ||
    new Set(request.mandatoryMilestones.map(value => value.slotId)).size !== 3 ||
    !milestoneSlots.every(slot => request.mandatoryMilestones.some(value =>
      value.slotId === slot.slotId && !!slot.requiredBeatId && value.requiredBeatIds.includes(slot.requiredBeatId)))) {
    values.push(issue('composition.topology.incompatible',
      'Fixed-nine policy requires one milestone per act with its canonical beat.',
      ['mandatoryMilestones']));
  }
  const validateIds = (items: readonly string[] | undefined, path: string): void => {
    if (items !== undefined && (!Array.isArray(items) || items.some(item => !stableId(item)) ||
      new Set(items).size !== items.length)) values.push(issue(
      'composition.request.invalid', `${path} must contain unique stable IDs.`, [path],
    ));
  };
  validateIds(request.candidateStageIds, 'candidateStageIds');
  validateIds(request.requiredStageIds, 'requiredStageIds');
  validateIds(request.allowedRegionIds, 'allowedRegionIds');
  validateIds(request.allowedBiomeIds, 'allowedBiomeIds');
  if (!isRecord(request.context) || !isRecord(request.context.flags) ||
    !Array.isArray(request.context.completedEventIds) || !Array.isArray(request.context.revealedBeatIds)) {
    values.push(issue('composition.request.invalid', 'context is invalid.', ['context']));
  }
  return diagnostics(values);
}

export function validateCampaignCompositionSnapshot(
  value: unknown,
): readonly CampaignCompositionDiagnostic[] {
  const values: CampaignCompositionDiagnostic[] = [];
  if (!isRecord(value) || value.schema !== CAMPAIGN_COMPOSITION_SNAPSHOT_SCHEMA || value.version !== 1) {
    return diagnostics([issue('composition.snapshot.invalid',
      'Composition snapshot must use the supported schema and version.', ['composition'])]);
  }
  if (value.policyId !== FIXED_NINE_COMPOSITION_POLICY_ID || value.policyVersion !== 1 ||
    !stableId(value.compositionId) || !stableId(value.catalogDigest) ||
    !stableId(value.campaignId) || !stableId(value.runId) || !positiveInteger(value.campaignRevision) ||
    typeof value.seed !== 'string' || value.seed.length === 0 || value.desiredStageCount !== 9 ||
    !Array.isArray(value.assignments) || value.assignments.length !== 9) {
    values.push(issue('composition.snapshot.invalid',
      'Composition snapshot header or assignment count is invalid.', ['composition']));
    return diagnostics(values);
  }
  if (!Array.isArray(value.acts) || value.acts.length !== 3 ||
    !Array.isArray(value.mandatoryMilestones) || value.mandatoryMilestones.length !== 3 ||
    !Array.isArray(value.requiredStageIds) || !Array.isArray(value.allowedRegionIds) ||
    !Array.isArray(value.allowedBiomeIds) || !isRecord(value.minimumPhysicalExitsBySlot) ||
    !isRecord(value.context) || !isRecord(value.context.flags) ||
    !Array.isArray(value.context.completedEventIds) || !Array.isArray(value.context.revealedBeatIds) ||
    (value.repetitionPolicy !== 'forbid' && value.repetitionPolicy !== 'allow-repeatable')) {
    values.push(issue('composition.snapshot.invalid',
      'Composition snapshot constraints or narrative context are invalid.', ['composition']));
    return diagnostics(values);
  }
  const slotIds = new Set<string>();
  const instanceIds = new Set<string>();
  value.assignments.forEach((raw, index) => {
    if (!isRecord(raw) || !stableId(raw.slotId) || !stableId(raw.stageId) ||
      !stableId(raw.chapterId) || !stableId(raw.stageInstanceId) ||
      !positiveInteger(raw.manifestRevision) || !positiveInteger(raw.chapterRevision) ||
      typeof raw.depth !== 'number' || !Number.isInteger(raw.depth) ||
      !stableId(raw.regionId) || !stableId(raw.biomeId) ||
      (raw.maximumPhysicalExits !== 1 && raw.maximumPhysicalExits !== 2 && raw.maximumPhysicalExits !== 3) ||
      !Array.isArray(raw.requiredEventIds) || !raw.requiredEventIds.every(stableId) ||
      !Array.isArray(raw.requiredBeatIds) || !raw.requiredBeatIds.every(stableId) ||
      !Array.isArray(raw.providesBeatIds) || !raw.providesBeatIds.every(stableId) ||
      !Array.isArray(raw.declaredExits) || !raw.declaredExits.every((item: unknown) =>
        isRecord(item) && stableId(item.id) &&
        (item.targetStageId === CAMPAIGN_COMPLETE || stableId(item.targetStageId))) ||
      new Set(raw.declaredExits.map((item: { readonly id: string }) => item.id)).size !==
        raw.declaredExits.length) {
      values.push(issue('composition.snapshot.invalid', 'Composition assignment is invalid.',
        ['composition', 'assignments', index]));
      return;
    }
    if (slotIds.has(raw.slotId) || instanceIds.has(raw.stageInstanceId)) values.push(issue(
      'composition.snapshot.invalid', 'Composition assignment identities must be unique.',
      ['composition', 'assignments', index], { stageId: raw.stageId, slotId: raw.slotId },
    ));
    slotIds.add(raw.slotId);
    instanceIds.add(raw.stageInstanceId);
    const slot = FIXED_NINE_COMPOSITION_SLOTS.find(item => item.slotId === raw.slotId);
    if (!slot || raw.actId !== slot.actId || raw.depth !== slot.depth || raw.kind !== slot.kind ||
      raw.stageInstanceId !== `instance.${value.compositionId}.${raw.slotId}`) values.push(issue(
      'composition.snapshot.invalid', 'Assignment does not match the fixed topology.',
      ['composition', 'assignments', index], { stageId: raw.stageId, slotId: raw.slotId },
    ));
  });
  if (values.length === 0) {
    const persistedAssignments = value.assignments as unknown as readonly CampaignCompositionAssignment[];
    const expectedId = `composition.${hashHex(
      FIXED_NINE_COMPOSITION_POLICY_ID,
      value.seed as string,
      value.campaignId as string,
      value.runId as string,
      assignmentIdentityInput(persistedAssignments.map(({ stageInstanceId: _ignored, ...assignment }) => assignment)),
    )}`;
    if (value.compositionId !== expectedId) values.push(issue(
      'composition.snapshot.invalid', 'Composition identity does not match its persisted assignments.',
      ['composition', 'compositionId'], { referenceId: String(value.compositionId) },
    ));
  }
  return diagnostics(values);
}

export function canonicalCampaignCompositionSnapshot(
  value: CampaignCompositionSnapshot,
): CampaignCompositionSnapshot {
  return freezeDeep({
    ...value,
    acts: [...value.acts].sort((left, right) => compare(left.actId, right.actId)),
    mandatoryMilestones: [...value.mandatoryMilestones]
      .sort((left, right) => compare(left.slotId, right.slotId)),
    requiredStageIds: sortedUnique(value.requiredStageIds),
    allowedRegionIds: sortedUnique(value.allowedRegionIds),
    allowedBiomeIds: sortedUnique(value.allowedBiomeIds),
    minimumPhysicalExitsBySlot: Object.fromEntries(
      Object.entries(value.minimumPhysicalExitsBySlot).sort(([left], [right]) => compare(left, right)),
    ),
    context: {
      flags: Object.fromEntries(Object.entries(value.context.flags).sort(([left], [right]) => compare(left, right))),
      completedEventIds: sortedUnique(value.context.completedEventIds),
      revealedBeatIds: sortedUnique(value.context.revealedBeatIds),
    },
    assignments: [...value.assignments]
      .sort((left, right) => left.depth - right.depth)
      .map(assignment => ({
        ...assignment,
        requiredEventIds: sortedUnique(assignment.requiredEventIds),
        requiredBeatIds: sortedUnique(assignment.requiredBeatIds),
        providesBeatIds: sortedUnique(assignment.providesBeatIds),
        declaredExits: [...assignment.declaredExits]
          .sort((left, right) => compare(left.id, right.id))
          .map(exit => ({ id: exit.id, targetStageId: exit.targetStageId })),
      })),
  });
}

export function createFixedNineCompositionRequest(
  values: Pick<CampaignCompositionRequest, 'campaignId' | 'campaignRevision' | 'runId' | 'seed'> &
    Partial<Omit<CampaignCompositionRequest, 'campaignId' | 'campaignRevision' | 'runId' | 'seed'>>,
): CampaignCompositionRequest {
  const { campaignId, campaignRevision, runId, seed, ...overrides } = values;
  return freezeDeep({
    desiredStageCount: 9,
    acts: [
      { actId: 'act-1', stageCount: 3, difficulty: { minimum: 1, maximum: 3 } },
      { actId: 'act-2', stageCount: 3, difficulty: { minimum: 4, maximum: 6 } },
      { actId: 'act-3', stageCount: 3, difficulty: { minimum: 7, maximum: 9 } },
    ],
    mandatoryMilestones: [
      { slotId: 'act-1.milestone', requiredBeatIds: ['beat.act-1'] },
      { slotId: 'act-2.milestone', requiredBeatIds: ['beat.act-2'] },
      { slotId: 'act-3.milestone', requiredBeatIds: ['beat.act-3'] },
    ],
    repetitionPolicy: 'forbid',
    context: { flags: {}, completedEventIds: [], revealedBeatIds: [] },
    ...overrides,
    policyId: FIXED_NINE_COMPOSITION_POLICY_ID,
    campaignId,
    campaignRevision,
    runId,
    seed,
  } as CampaignCompositionRequest);
}

/** Deterministic selector over the immutable StageCatalogService projection. */
export class CampaignCompositionService {
  public constructor(
    private readonly catalog: CampaignCompositionCatalog,
    private readonly graphAdapter = new CampaignCompositionGraphAdapter(),
  ) {}

  public compose(request: CampaignCompositionRequest): CampaignCompositionResult {
    const requestIssues = requestDiagnostics(request);
    if (requestIssues.length > 0) {
      const first = requestIssues[0].code;
      const code: CampaignCompositionFailureCode = first === 'composition.policy.unsupported'
        ? 'unsupported-policy'
        : first === 'composition.quantity.invalid' ? 'invalid-quantity'
          : first === 'composition.topology.incompatible' ? 'topology-incompatible'
            : 'invalid-request';
      return failure(code, requestIssues);
    }

    const all = [...this.catalog.list()].sort((left, right) => compare(left.stageId, right.stageId));
    const byId = new Map(all.map(entry => [entry.stageId, entry]));
    const requestedIds = sortedUnique(request.candidateStageIds);
    const unknown = requestedIds.filter(id => !byId.has(id));
    if (unknown.length > 0) return failure('stage-reference-missing', unknown.map(id => issue(
      'composition.candidate.reference-missing', `Candidate stage is absent from the catalog: ${id}.`,
      ['candidateStageIds'], { stageId: id, referenceId: id },
    )));

    const milestoneStageIds = new Set(request.mandatoryMilestones
      .map(item => item.stageId).filter((id): id is string => !!id));
    const allowList = new Set(requestedIds);
    const candidates = all.filter(entry =>
      (allowList.size === 0 || allowList.has(entry.stageId)) &&
      (entry.eligibility === 'campaign-eligible' ||
        (entry.eligibility === 'narrative-reserved' && milestoneStageIds.has(entry.stageId))));
    const requiredStageIds = sortedUnique([
      ...(request.requiredStageIds ?? []),
      ...(request.entryStageId ? [request.entryStageId] : []),
      ...milestoneStageIds,
    ]);
    const missingRequired = requiredStageIds.filter(id => !candidates.some(entry => entry.stageId === id));
    if (missingRequired.length > 0) return failure(
      missingRequired.some(id => milestoneStageIds.has(id)) ? 'milestone-unavailable' : 'stage-reference-missing',
      missingRequired.map(id => issue(
        milestoneStageIds.has(id) ? 'composition.milestone.unavailable' : 'composition.candidate.ineligible',
        `Required stage is unavailable or ineligible: ${id}.`, ['requiredStageIds'],
        { stageId: id, referenceId: id },
      )),
    );
    if (request.repetitionPolicy === 'forbid' && candidates.length < request.desiredStageCount) {
      return failure('candidates-insufficient', [issue(
        'composition.candidates.insufficient',
        `Composition needs ${request.desiredStageCount} distinct definitions but only ${candidates.length} are eligible.`,
        ['candidateStageIds'],
      )]);
    }

    for (const slot of FIXED_NINE_COMPOSITION_SLOTS) {
      const rule = actRule(request, slot.actId);
      const milestoneRule = milestone(request, slot.slotId);
      const positioned = candidates.filter(entry =>
        (!request.entryStageId || slot.slotId !== 'act-1.entry' || entry.stageId === request.entryStageId) &&
        (!milestoneRule?.stageId || entry.stageId === milestoneRule.stageId) &&
        (entry.eligibility !== 'narrative-reserved' || milestoneRule?.stageId === entry.stageId) &&
        (entry.role !== 'milestone' || slot.kind === 'milestone'));
      if (positioned.length === 0) return failure(
        slot.kind === 'milestone' ? 'milestone-unavailable' : 'composition-impossible',
        [issue(slot.kind === 'milestone' ? 'composition.milestone.unavailable' : 'composition.assignment.impossible',
          `No candidate can occupy ${slot.slotId}.`, ['slots', slot.slotId], { slotId: slot.slotId })],
      );
      const byAct = positioned.filter(entry =>
        entry.allowedActIds.length === 0 || entry.allowedActIds.includes(slot.actId));
      if (byAct.length === 0) return failure('act-incompatible', [issue(
        'composition.act.incompatible', `No candidate supports ${slot.actId} at ${slot.slotId}.`,
        ['slots', slot.slotId], { slotId: slot.slotId, referenceId: slot.actId },
      )]);
      const difficulty = slot.depth + 1;
      const byDifficulty = byAct.filter(entry => entry.difficulty &&
        difficulty >= rule.difficulty.minimum && difficulty <= rule.difficulty.maximum &&
        difficulty >= entry.difficulty.minimum && difficulty <= entry.difficulty.maximum);
      if (byDifficulty.length === 0) return failure('difficulty-incompatible', [issue(
        'composition.difficulty.incompatible',
        `No candidate supports difficulty ${difficulty} at ${slot.slotId}.`,
        ['slots', slot.slotId], { slotId: slot.slotId },
      )]);
      const regions = combinedAllowed(request.allowedRegionIds, rule.allowedRegionIds);
      const biomes = combinedAllowed(request.allowedBiomeIds, rule.allowedBiomeIds);
      const byPlace = byDifficulty.filter(entry =>
        intersects(entry.regionIds, regions) && intersects(entry.biomeIds, biomes));
      if (byPlace.length === 0) return failure('composition-impossible', [issue(
        'composition.assignment.impossible',
        `No candidate satisfies region and biome restrictions at ${slot.slotId}.`,
        ['slots', slot.slotId], { slotId: slot.slotId },
      )]);
      const minimumExits = request.minimumPhysicalExitsBySlot?.[slot.slotId] ?? 1;
      const byCapacity = byPlace.filter(entry => entry.maximumPhysicalExits >= minimumExits);
      if (byCapacity.length === 0) return failure('exit-capacity-insufficient', [issue(
        'composition.exit-capacity.insufficient',
        `No candidate exposes ${minimumExits} physical exits for ${slot.slotId}.`,
        ['slots', slot.slotId], { slotId: slot.slotId },
      )]);
      if (!byCapacity.some(entry => entry.requiredEventIds.every(id =>
        request.context.completedEventIds.includes(id)))) return failure(
        'narrative-dependency-impossible', [issue(
          'composition.narrative-dependency.impossible',
          `No candidate has satisfiable event dependencies at ${slot.slotId}.`,
          ['slots', slot.slotId], { slotId: slot.slotId },
        )],
      );
      if (slot.requiredBeatId && !byCapacity.some(entry =>
        entry.providesBeatIds.includes(slot.requiredBeatId as string))) return failure(
        'milestone-unavailable', [issue(
          'composition.milestone.unavailable',
          `No candidate provides ${slot.requiredBeatId} at ${slot.slotId}.`,
          ['slots', slot.slotId], { slotId: slot.slotId, referenceId: slot.requiredBeatId },
        )],
      );
    }

    const selected: Array<{ slot: CompositionSlot; entry: StageCatalogEntry; regionId: string; biomeId: string }> = [];
    const used = new Set<string>();
    const initialBeats = new Set(request.context.revealedBeatIds);
    const completedEvents = new Set(request.context.completedEventIds);
    let destinationRejected = false;

    const fits = (
      entry: StageCatalogEntry,
      slot: CompositionSlot,
      availableBeats: ReadonlySet<string>,
    ): boolean => {
      const rule = actRule(request, slot.actId);
      const milestoneRule = milestone(request, slot.slotId);
      const previous = selected[selected.length - 1]?.entry;
      if (previous && !destinationCompatible(previous, entry.stageId)) {
        destinationRejected = true;
        return false;
      }
      if (request.entryStageId && slot.slotId === 'act-1.entry' && entry.stageId !== request.entryStageId) return false;
      if (milestoneRule?.stageId && entry.stageId !== milestoneRule.stageId) return false;
      if (entry.eligibility === 'narrative-reserved' && milestoneRule?.stageId !== entry.stageId) return false;
      if (entry.role === 'milestone' && slot.kind !== 'milestone') return false;
      if (entry.allowedActIds.length > 0 && !entry.allowedActIds.includes(slot.actId)) return false;
      const difficulty = slot.depth + 1;
      if (difficulty < rule.difficulty.minimum || difficulty > rule.difficulty.maximum ||
        !entry.difficulty || difficulty < entry.difficulty.minimum || difficulty > entry.difficulty.maximum) return false;
      const regions = combinedAllowed(request.allowedRegionIds, rule.allowedRegionIds);
      const biomes = combinedAllowed(request.allowedBiomeIds, rule.allowedBiomeIds);
      if (!intersects(entry.regionIds, regions) || !intersects(entry.biomeIds, biomes)) return false;
      const minimumExits = request.minimumPhysicalExitsBySlot?.[slot.slotId] ?? 1;
      if (entry.maximumPhysicalExits < minimumExits) return false;
      if (!entry.requiredEventIds.every(id => completedEvents.has(id))) return false;
      if (!entry.requiredBeatIds.every(id => availableBeats.has(id))) return false;
      if (slot.requiredBeatId && !entry.providesBeatIds.includes(slot.requiredBeatId)) return false;
      if (milestoneRule && !milestoneRule.requiredBeatIds.every(id => entry.providesBeatIds.includes(id))) return false;
      if (used.has(entry.stageId) &&
        (request.repetitionPolicy === 'forbid' || entry.revisit !== 'repeatable')) return false;
      return true;
    };

    const search = (index: number, availableBeats: ReadonlySet<string>): boolean => {
      if (index === FIXED_NINE_COMPOSITION_SLOTS.length) {
        const last = selected[selected.length - 1]?.entry;
        if (last && !destinationCompatible(last, CAMPAIGN_COMPLETE)) {
          destinationRejected = true;
          return false;
        }
        return requiredStageIds.every(id => selected.some(item => item.entry.stageId === id));
      }
      const slot = FIXED_NINE_COMPOSITION_SLOTS[index];
      const missing = requiredStageIds.filter(id => !selected.some(item => item.entry.stageId === id));
      if (missing.length > FIXED_NINE_COMPOSITION_SLOTS.length - index) return false;
      const ordered = candidates.filter(entry => fits(entry, slot, availableBeats))
        .sort((left, right) => {
          const leftRequired = missing.includes(left.stageId) ? 0 : 1;
          const rightRequired = missing.includes(right.stageId) ? 0 : 1;
          if (leftRequired !== rightRequired) return leftRequired - rightRequired;
          const leftScore = hashParts(String(request.seed), request.policyId, slot.slotId, left.stageId);
          const rightScore = hashParts(String(request.seed), request.policyId, slot.slotId, right.stageId);
          return leftScore - rightScore || compare(left.stageId, right.stageId);
        });
      for (const entry of ordered) {
        const rule = actRule(request, slot.actId);
        const regions = combinedAllowed(request.allowedRegionIds, rule.allowedRegionIds);
        const biomes = combinedAllowed(request.allowedBiomeIds, rule.allowedBiomeIds);
        const regionId = selectValue(entry.regionIds, regions, `${request.seed}|${slot.slotId}|region`);
        const biomeId = selectValue(entry.biomeIds, biomes, `${request.seed}|${slot.slotId}|biome`);
        if (!regionId || !biomeId) continue;
        selected.push({ slot, entry, regionId, biomeId });
        const wasUsed = used.has(entry.stageId);
        used.add(entry.stageId);
        const nextBeats = new Set(availableBeats);
        entry.providesBeatIds.forEach(id => nextBeats.add(id));
        if (search(index + 1, nextBeats)) return true;
        selected.pop();
        if (!wasUsed) used.delete(entry.stageId);
      }
      return false;
    };

    if (!search(0, initialBeats)) {
      // Structural per-slot impossibilities (milestone, capacity, act,
      // difficulty, narrative) already fail before the search. A failure here
      // is either an explicit-destination contradiction or an interaction
      // between constraints, so it is reported as such.
      const code: CampaignCompositionFailureCode = destinationRejected
        ? 'destination-incompatible' : 'composition-impossible';
      const diagnosticCode: CampaignCompositionDiagnosticCode = destinationRejected
        ? 'composition.destination.incompatible' : 'composition.assignment.impossible';
      return failure(code, [issue(diagnosticCode,
        destinationRejected
          ? 'Declared stage exits contradict the composed successor.'
          : 'No complete assignment satisfies all fixed-nine composition constraints.',
        ['assignments'])]);
    }

    const draftAssignments = selected.map(({ slot, entry, regionId, biomeId }) => ({
      slotId: slot.slotId,
      actId: slot.actId,
      depth: slot.depth,
      kind: slot.kind,
      stageId: entry.stageId,
      chapterId: entry.chapterId,
      manifestRevision: entry.manifestRevision,
      chapterRevision: entry.chapterRevision,
      role: entry.role,
      regionId,
      biomeId,
      difficulty: slot.depth + 1,
      maximumPhysicalExits: entry.maximumPhysicalExits,
      revisit: entry.revisit,
      requiredEventIds: entry.requiredEventIds,
      requiredBeatIds: entry.requiredBeatIds,
      providesBeatIds: entry.providesBeatIds,
      declaredExits: entry.exits.map(exit => Object.freeze({
        id: exit.id,
        targetStageId: exit.targetStageId,
      })),
    }));
    const catalogDigest = candidateDigest(candidates);
    const compositionId = `composition.${hashHex(
      FIXED_NINE_COMPOSITION_POLICY_ID,
      String(request.seed),
      request.campaignId,
      request.runId,
      assignmentIdentityInput(draftAssignments),
    )}`;
    const assignments: readonly CampaignCompositionAssignment[] = Object.freeze(draftAssignments.map(value =>
      Object.freeze({ ...value, stageInstanceId: `instance.${compositionId}.${value.slotId}` })));
    const snapshot = canonicalCampaignCompositionSnapshot({
      schema: CAMPAIGN_COMPOSITION_SNAPSHOT_SCHEMA,
      version: 1,
      policyId: FIXED_NINE_COMPOSITION_POLICY_ID,
      policyVersion: 1,
      compositionId,
      catalogDigest,
      campaignId: request.campaignId,
      campaignRevision: request.campaignRevision,
      runId: request.runId,
      seed: String(request.seed),
      desiredStageCount: request.desiredStageCount,
      repetitionPolicy: request.repetitionPolicy,
      acts: request.acts,
      mandatoryMilestones: request.mandatoryMilestones,
      requiredStageIds,
      allowedRegionIds: sortedUnique(request.allowedRegionIds),
      allowedBiomeIds: sortedUnique(request.allowedBiomeIds),
      minimumPhysicalExitsBySlot: Object.freeze({ ...(request.minimumPhysicalExitsBySlot ?? {}) }),
      context: request.context,
      assignments,
    });
    const generated = this.graphAdapter.generate(snapshot);
    if (!generated.ok) return failure('graph-generation-failed', generated.error.diagnostics.map(value => issue(
      'composition.graph.generation-failed', value.message, value.path,
      { referenceId: value.referenceId },
    )));
    if (!graphMatches(snapshot, generated.value)) return failure('graph-generation-failed', [issue(
      'composition.graph.incompatible', 'Generated graph does not preserve composition assignments.', ['graph'],
    )]);
    const selectedIds = new Set(assignments.map(value => value.stageId));
    const informational = [
      ...candidates.filter(entry => !selectedIds.has(entry.stageId)).map(entry => issue(
        'composition.candidate.not-selected', 'Eligible definition was not selected by this composition.',
        ['candidates', entry.stageId], { severity: 'info', stageId: entry.stageId, referenceId: entry.stageId },
      )),
      ...all.filter(entry => (allowList.size === 0 || allowList.has(entry.stageId)) &&
        !candidates.some(candidate => candidate.stageId === entry.stageId)).map(entry => issue(
        'composition.candidate.ineligible',
        `Definition is not eligible for composition: ${entry.eligibility}.`,
        ['candidates', entry.stageId], { severity: 'warning', stageId: entry.stageId, referenceId: entry.stageId },
      )),
    ];
    return Object.freeze({
      ok: true as const,
      value: Object.freeze({ snapshot, graph: generated.value, diagnostics: diagnostics(informational) }),
    });
  }

  public restore(value: unknown): CampaignCompositionResult {
    const invalid = validateCampaignCompositionSnapshot(value);
    if (invalid.length > 0) return failure('persisted-composition-invalid', invalid);
    const snapshot = canonicalCampaignCompositionSnapshot(value as CampaignCompositionSnapshot);
    const catalogById = new Map(this.catalog.list().map(entry => [entry.stageId, entry]));
    const restorationIssues: CampaignCompositionDiagnostic[] = [];
    for (const assignment of snapshot.assignments) {
      const entry = catalogById.get(assignment.stageId);
      if (!entry) restorationIssues.push(issue(
        'composition.stage.missing', `Persisted stage is absent: ${assignment.stageId}.`,
        ['assignments', assignment.slotId], { stageId: assignment.stageId, slotId: assignment.slotId },
      ));
      else if (entry.manifestRevision !== assignment.manifestRevision ||
        entry.chapterRevision !== assignment.chapterRevision || entry.loadability !== 'loadable' ||
        !declaredExitsMatch(assignment, entry)) {
        restorationIssues.push(issue(
          'composition.revision.incompatible',
          `Persisted revisions or declared exits are unavailable for ${assignment.stageId}.`,
          ['assignments', assignment.slotId], { stageId: assignment.stageId, slotId: assignment.slotId },
        ));
      }
    }
    if (restorationIssues.length === 0) {
      snapshot.assignments.forEach((assignment, index) => {
        const entry = catalogById.get(assignment.stageId);
        const target = snapshot.assignments[index + 1]?.stageId ?? CAMPAIGN_COMPLETE;
        if (entry && !destinationCompatible(entry, target)) {
          restorationIssues.push(issue(
            'composition.destination.incompatible',
            `Persisted stage exits no longer match the selected successor: ${assignment.stageId}.`,
            ['assignments', assignment.slotId], { stageId: assignment.stageId, slotId: assignment.slotId },
          ));
        }
      });
    }
    if (restorationIssues.length > 0) return failure(
      restorationIssues.some(item => item.code === 'composition.revision.incompatible')
        ? 'stage-revision-incompatible'
        : restorationIssues.some(item => item.code === 'composition.destination.incompatible')
          ? 'destination-incompatible' : 'stage-reference-missing',
      restorationIssues,
    );
    const generated = this.graphAdapter.generate(snapshot);
    if (!generated.ok || !graphMatches(snapshot, generated.value)) return failure('restore-failed', [issue(
      'composition.restore.failed', 'Persisted composition could not reproduce a compatible graph.', ['graph'],
    )]);
    return Object.freeze({
      ok: true as const,
      value: Object.freeze({ snapshot, graph: generated.value, diagnostics: Object.freeze([]) }),
    });
  }
}
