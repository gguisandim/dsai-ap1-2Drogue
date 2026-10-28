import { CampaignGraphValidator } from '../../stages';
import type {
  CampaignEdge,
  CampaignGraph,
  CampaignNode,
  PhysicalExitResolution,
  StageResumeState,
} from '../../stages';
import type {
  CampaignRunDiagnostic,
  CampaignRunLoadOutcome,
  CampaignRunSaveEnvelope,
  CampaignRunSaveFailure,
  CampaignRunSaveFailureCode,
  CampaignRunSaveIdentity,
  CampaignRunSaveReceipt,
  CampaignRunSaveResult,
  CampaignRunSaveServiceOptions,
  CampaignRunState,
} from './CampaignNavigation';
import {
  CAMPAIGN_RUN_SAVE_SCHEMA,
  CAMPAIGN_RUN_SAVE_STORAGE_KEY,
} from './CampaignNavigation';

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function nonEmpty(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function integer(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && Number.isFinite(value);
}

function compare(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function cloneFrozen<T>(value: T): T {
  if (Array.isArray(value)) return Object.freeze(value.map(item => cloneFrozen(item))) as T;
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => compare(left, right))
      .map(([key, item]) => [key, cloneFrozen(item)]);
    return Object.freeze(Object.fromEntries(entries)) as T;
  }
  return value;
}

function canonicalGraph(graph: CampaignGraph): CampaignGraph {
  return cloneFrozen({
    ...graph,
    acts: [...graph.acts].sort((left, right) => left.ordinal - right.ordinal),
    nodes: [...graph.nodes].sort((left, right) => compare(left.id, right.id)),
    edges: [...graph.edges].sort((left, right) => compare(left.id, right.id)),
    mandatoryBeatIds: [...graph.mandatoryBeatIds].sort(compare),
  });
}

function canonicalPhysical(value: PhysicalExitResolution): PhysicalExitResolution {
  return cloneFrozen({
    ...value,
    exits: [...value.exits].sort((left, right) => compare(left.edgeId, right.edgeId)),
  });
}

function sortedRecord<T>(
  value: Readonly<Record<string, T>>,
  transform: (item: T) => T = item => cloneFrozen(item),
): Readonly<Record<string, T>> {
  return Object.freeze(Object.fromEntries(Object.entries(value)
    .sort(([left], [right]) => compare(left, right))
    .map(([key, item]) => [key, transform(item)])));
}

export function canonicalCampaignRunState(state: CampaignRunState): CampaignRunState {
  return cloneFrozen({
    version: 1 as const,
    graph: canonicalGraph(state.graph),
    status: state.status,
    currentNodeId: state.currentNodeId,
    visitedNodeIds: [...state.visitedNodeIds].sort(compare),
    traversedEdgeIds: [...state.traversedEdgeIds],
    revealedEdgeIds: [...state.revealedEdgeIds].sort(compare),
    revisitCounts: sortedRecord(state.revisitCounts),
    physicalExits: sortedRecord(state.physicalExits, canonicalPhysical),
    nodeResumes: sortedRecord(state.nodeResumes),
    confirmedTransitionIds: [...state.confirmedTransitionIds],
    rewards: sortedRecord(state.rewards ?? {}),
  });
}

function push(
  diagnostics: CampaignRunDiagnostic[],
  code: string,
  message: string,
  path: readonly (string | number)[],
  referenceId?: string,
): void {
  diagnostics.push({ code, message, path: [...path], ...(referenceId ? { referenceId } : {}) });
}

function validateStringArray(
  value: unknown,
  diagnostics: CampaignRunDiagnostic[],
  path: readonly (string | number)[],
  unique: boolean,
): value is readonly string[] {
  if (!Array.isArray(value) || value.some(item => !nonEmpty(item))) {
    push(diagnostics, 'run.array.invalid', 'Expected an array of stable identifiers.', path);
    return false;
  }
  if (unique && new Set(value).size !== value.length) {
    push(diagnostics, 'run.array.duplicate', 'Stable identifier array contains duplicates.', path);
    return false;
  }
  return true;
}

function validateResume(
  value: unknown,
  node: CampaignNode,
  graph: CampaignGraph,
  diagnostics: CampaignRunDiagnostic[],
  path: readonly (string | number)[],
): value is StageResumeState {
  if (!isRecord(value) || value.stageId !== node.stageId || !integer(value.manifestRevision) ||
    !isRecord(value.flags) || !isRecord(value.missionStates) ||
    !validateStringArray(value.collectedEntityIds, diagnostics, [...path, 'collectedEntityIds'], true) ||
    !validateStringArray(value.appliedOperationIds, diagnostics, [...path, 'appliedOperationIds'], true)) {
    push(diagnostics, 'run.resume.invalid', 'Stage resume does not match its campaign node.', path, node.id);
    return false;
  }
  if ((value.runId !== undefined && value.runId !== graph.runId) ||
    (value.runSeed !== undefined && String(value.runSeed) !== node.stageSeed)) {
    push(diagnostics, 'run.resume.identity-mismatch', 'Stage resume belongs to another run.', path, node.id);
    return false;
  }
  return true;
}

export function validateCampaignRunState(value: unknown): readonly CampaignRunDiagnostic[] {
  const diagnostics: CampaignRunDiagnostic[] = [];
  if (!isRecord(value) || value.version !== 1 || !isRecord(value.graph)) {
    push(diagnostics, 'run.state.invalid', 'Campaign run state must be a version 1 object.', ['state']);
    return diagnostics;
  }
  const graph = value.graph as unknown as CampaignGraph;
  new CampaignGraphValidator().validate(graph).forEach(item => push(
    diagnostics, item.code, item.message, ['state', 'graph', ...item.path], item.referenceId,
  ));
  if (diagnostics.length > 0) return diagnostics;
  const nodes = new Map(graph.nodes.map(node => [node.id, node]));
  const edges = new Map(graph.edges.map(edge => [edge.id, edge]));
  if (value.status !== 'active' && value.status !== 'completed') {
    push(diagnostics, 'run.status.invalid', 'Run status is invalid.', ['state', 'status']);
  }
  if (!nonEmpty(value.currentNodeId) || !nodes.has(value.currentNodeId)) {
    push(diagnostics, 'run.current-node.invalid', 'Current node is not present in the graph.',
      ['state', 'currentNodeId'], String(value.currentNodeId));
  }
  const visitedValid = validateStringArray(value.visitedNodeIds, diagnostics,
    ['state', 'visitedNodeIds'], true);
  if (visitedValid) {
    const visitedNodeIds = value.visitedNodeIds as readonly string[];
    visitedNodeIds.forEach(nodeId => {
      if (!nodes.has(nodeId)) push(diagnostics, 'run.node-reference.invalid',
        'Visited node is not present in the graph.', ['state', 'visitedNodeIds'], nodeId);
    });
    if (nonEmpty(value.currentNodeId) && !visitedNodeIds.includes(value.currentNodeId)) {
      push(diagnostics, 'run.current-node.unvisited', 'Current node must be visited.',
        ['state', 'visitedNodeIds'], value.currentNodeId);
    }
  }
  const traversedValid = validateStringArray(value.traversedEdgeIds, diagnostics,
    ['state', 'traversedEdgeIds'], false);
  const traversedEdgeIds = traversedValid ? value.traversedEdgeIds as readonly string[] : [];
  if (traversedValid) traversedEdgeIds.forEach(edgeId => {
    if (!edges.has(edgeId)) push(diagnostics, 'run.edge-reference.invalid',
      'Traversed edge is not present in the graph.', ['state', 'traversedEdgeIds'], edgeId);
  });
  const revealedValid = validateStringArray(value.revealedEdgeIds, diagnostics,
    ['state', 'revealedEdgeIds'], true);
  if (revealedValid) (value.revealedEdgeIds as readonly string[]).forEach(edgeId => {
    if (!edges.has(edgeId)) push(diagnostics, 'run.edge-reference.invalid',
      'Revealed edge is not present in the graph.', ['state', 'revealedEdgeIds'], edgeId);
  });
  const confirmedValid = validateStringArray(value.confirmedTransitionIds, diagnostics,
    ['state', 'confirmedTransitionIds'], true);
  const confirmedTransitionIds = new Set(
    confirmedValid ? value.confirmedTransitionIds as readonly string[] : [],
  );
  if (value.rewards !== undefined) {
    if (!isRecord(value.rewards)) {
      push(diagnostics, 'run.rewards.invalid', 'Reward journal must be an object.',
        ['state', 'rewards']);
    } else Object.entries(value.rewards).forEach(([transitionId, reward]) => {
      if (!isRecord(reward) || reward.transitionId !== transitionId ||
        !confirmedTransitionIds.has(transitionId) || !nonEmpty(reward.stageInstanceId) ||
        !nonEmpty(reward.stageId) || !integer(reward.difficulty) || reward.difficulty < 1 ||
        typeof reward.parSeconds !== 'number' || !Number.isFinite(reward.parSeconds) ||
        reward.parSeconds <= 0 ||
        (reward.status !== 'pending' && reward.status !== 'claimed' && reward.status !== 'applied')) {
        push(diagnostics, 'run.reward.invalid', 'Reward record is invalid or unconfirmed.',
          ['state', 'rewards', transitionId], transitionId);
        return;
      }
      const source = nodes.get(reward.stageInstanceId);
      if (!source || source.stageId !== reward.stageId) {
        push(diagnostics, 'run.reward.instance-mismatch',
          'Reward stage instance does not match the graph.', ['state', 'rewards', transitionId],
          transitionId);
      }
    });
  }

  if (!isRecord(value.revisitCounts)) {
    push(diagnostics, 'run.revisit-counts.invalid', 'Revisit counts must be an object.',
      ['state', 'revisitCounts']);
  } else Object.entries(value.revisitCounts).forEach(([nodeId, count]) => {
    if (!nodes.has(nodeId) || !integer(count) || count < 1) push(diagnostics,
      'run.revisit-count.invalid', 'Revisit count is invalid.', ['state', 'revisitCounts', nodeId], nodeId);
  });

  if (!isRecord(value.physicalExits)) {
    push(diagnostics, 'run.physical-exits.invalid', 'Physical exits must be an object.',
      ['state', 'physicalExits']);
  } else Object.entries(value.physicalExits).forEach(([nodeId, resolution]) => {
    const node = nodes.get(nodeId);
    if (!node || !isRecord(resolution) || resolution.nodeId !== nodeId ||
      resolution.stageId !== node.stageId || !nonEmpty(resolution.levelDigest) ||
      !Array.isArray(resolution.exits)) {
      push(diagnostics, 'run.physical-resolution.invalid', 'Physical exit resolution is invalid.',
        ['state', 'physicalExits', nodeId], nodeId);
      return;
    }
    const outgoing = new Map(graph.edges.filter(edge => edge.sourceNodeId === nodeId)
      .map(edge => [edge.id, edge]));
    const physicalIds = new Set<string>();
    resolution.exits.forEach((exit, index) => {
      if (!isRecord(exit) || !nonEmpty(exit.id) || physicalIds.has(exit.id) ||
        !nonEmpty(exit.edgeId) || !outgoing.has(exit.edgeId) ||
        exit.sourceNodeId !== nodeId || exit.targetNodeId !== outgoing.get(exit.edgeId)?.targetNodeId ||
        !nonEmpty(exit.stageExitId) || !isRecord(exit.tile) || !integer(exit.tile.x) ||
        !integer(exit.tile.y) || !integer(exit.placementAttempt)) {
        push(diagnostics, 'run.physical-exit.invalid', 'Physical exit is invalid or inconsistent.',
          ['state', 'physicalExits', nodeId, 'exits', index]);
      } else physicalIds.add(exit.id);
    });
  });

  if (!isRecord(value.nodeResumes)) {
    push(diagnostics, 'run.node-resumes.invalid', 'Node resumes must be an object.',
      ['state', 'nodeResumes']);
  } else Object.entries(value.nodeResumes).forEach(([nodeId, resume]) => {
    const node = nodes.get(nodeId);
    if (!node) push(diagnostics, 'run.node-reference.invalid', 'Resume node is unknown.',
      ['state', 'nodeResumes', nodeId], nodeId);
    else validateResume(resume, node, graph, diagnostics, ['state', 'nodeResumes', nodeId]);
  });
  if (value.status === 'completed') {
    const lastEdge = traversedValid
      ? edges.get(traversedEdgeIds[traversedEdgeIds.length - 1]) : undefined;
    if (!lastEdge || lastEdge.targetNodeId !== 'campaign.complete') push(diagnostics,
      'run.completion.invalid', 'Completed run must end with a campaign.complete edge.',
      ['state', 'status']);
  }
  return diagnostics.sort((left, right) => compare(
    `${left.path.join('.')}|${left.code}|${left.referenceId ?? ''}`,
    `${right.path.join('.')}|${right.code}|${right.referenceId ?? ''}`,
  ));
}

function identityMatches(state: CampaignRunState, expected: CampaignRunSaveIdentity): boolean {
  return state.graph.campaignId === expected.campaignId &&
    state.graph.campaignRevision === expected.campaignRevision &&
    state.graph.runId === expected.runId && state.graph.runSeed === expected.runSeed &&
    (!expected.graphId || state.graph.id === expected.graphId);
}

export class CampaignRunSaveService {
  public readonly storageKey: string;

  public constructor(private readonly options: CampaignRunSaveServiceOptions) {
    this.storageKey = options.storageKey ?? CAMPAIGN_RUN_SAVE_STORAGE_KEY;
  }

  public createEnvelope(state: CampaignRunState): CampaignRunSaveResult<CampaignRunSaveEnvelope> {
    const diagnostics = validateCampaignRunState(state);
    if (diagnostics.length > 0) return this.failure(
      'invalid-state', 'Campaign run state validation failed.', diagnostics, 'previous-preserved',
    );
    return this.success(cloneFrozen({
      schema: CAMPAIGN_RUN_SAVE_SCHEMA,
      version: 1 as const,
      state: canonicalCampaignRunState(state),
    }));
  }

  public serialize(state: CampaignRunState): CampaignRunSaveResult<string> {
    const envelope = this.createEnvelope(state);
    return envelope.ok ? this.success(JSON.stringify(envelope.value)) : envelope;
  }

  public save(
    state: CampaignRunState,
    expectedPrevious?: CampaignRunState,
  ): CampaignRunSaveResult<CampaignRunSaveReceipt> {
    const candidateEnvelope = this.createEnvelope(state);
    if (!candidateEnvelope.ok) return candidateEnvelope;
    const candidateBytes = JSON.stringify(candidateEnvelope.value);
    let existing: string | undefined;
    try {
      existing = this.options.storage.read(this.storageKey);
    } catch (error) {
      return this.failure('storage-read-failed', `Run save preflight failed: ${this.message(error)}.`,
        [{ code: 'run.storage.read-failed', message: 'Storage rejected the preflight read.', path: ['storage'] }],
        'previous-preserved');
    }
    if (existing !== undefined) {
      const normalizedExisting = this.normalizeStored(existing);
      if (!normalizedExisting.ok) return this.failure('storage-conflict',
        'Existing run save is unknown or invalid and was preserved.', normalizedExisting.error.diagnostics,
        'previous-preserved');
      if (expectedPrevious) {
        const expected = this.serialize(expectedPrevious);
        if (!expected.ok) return expected;
        if (normalizedExisting.value !== expected.value) return this.failure('storage-conflict',
          'Run save changed since preparation and was preserved.', [{
            code: 'run.storage.conflict', message: 'Optimistic preflight bytes do not match.', path: ['storage'],
          }], 'previous-preserved');
      } else if (normalizedExisting.value !== candidateBytes) {
        return this.failure('storage-conflict', 'Existing run save cannot be overwritten without an expected state.',
          [{ code: 'run.storage.conflict', message: 'Expected previous state was not supplied.', path: ['storage'] }],
          'previous-preserved');
      }
    }
    try {
      this.options.storage.write(this.storageKey, candidateBytes);
      return this.success(cloneFrozen({ envelope: candidateEnvelope.value, persistence: 'written' as const }));
    } catch (error) {
      return this.recoverAfterWriteFailure(candidateEnvelope.value, candidateBytes, existing, error);
    }
  }

  public load(expected?: CampaignRunSaveIdentity): CampaignRunSaveResult<CampaignRunLoadOutcome> {
    let raw: string | undefined;
    try {
      raw = this.options.storage.read(this.storageKey);
    } catch (error) {
      return this.failure('storage-read-failed', `Run save read failed: ${this.message(error)}.`,
        [{ code: 'run.storage.read-failed', message: 'Storage rejected the read.', path: ['storage'] }],
        'storage-state-unknown');
    }
    if (raw === undefined) return this.success(cloneFrozen({ status: 'empty' as const }));
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw) as unknown;
    } catch {
      return this.failure('invalid-json', 'Stored run save is not valid JSON.',
        [{ code: 'run.json.invalid', message: 'Stored bytes could not be parsed.', path: [] }],
        'storage-state-unknown');
    }
    const envelope = this.validateEnvelope(parsed);
    if (!envelope.ok) return envelope;
    if (expected && !identityMatches(envelope.value.state, expected)) return this.failure(
      'identity-mismatch', 'Stored run belongs to another identity.', [{
        code: 'run.identity.mismatch', message: 'Expected identity does not match stored run.', path: ['state', 'graph'],
      }], 'previous-preserved');
    return this.success(cloneFrozen({ status: 'loaded' as const, envelope: envelope.value }));
  }

  private validateEnvelope(value: unknown): CampaignRunSaveResult<CampaignRunSaveEnvelope> {
    if (!isRecord(value) || value.schema !== CAMPAIGN_RUN_SAVE_SCHEMA) return this.failure(
      'invalid-envelope', 'Stored run envelope schema is invalid.', [{
        code: 'run.envelope.invalid', message: 'Expected a run save envelope.', path: [],
      }], 'storage-state-unknown');
    if (value.version !== 1) return this.failure('unsupported-version', 'Run save version is unsupported.', [{
      code: 'run.version.unsupported', message: 'Only run save version 1 is supported.', path: ['version'],
    }], 'storage-state-unknown');
    const diagnostics = validateCampaignRunState(value.state);
    if (diagnostics.length > 0) return this.failure(
      'invalid-state', 'Stored run state is invalid.', diagnostics, 'storage-state-unknown',
    );
    return this.success(cloneFrozen({
      schema: CAMPAIGN_RUN_SAVE_SCHEMA,
      version: 1 as const,
      state: canonicalCampaignRunState(value.state as CampaignRunState),
    }));
  }

  private normalizeStored(raw: string): CampaignRunSaveResult<string> {
    let parsed: unknown;
    try { parsed = JSON.parse(raw) as unknown; } catch {
      return this.failure('invalid-json', 'Stored run save is not valid JSON.', [{
        code: 'run.json.invalid', message: 'Stored bytes could not be parsed.', path: [],
      }], 'storage-state-unknown');
    }
    const envelope = this.validateEnvelope(parsed);
    return envelope.ok ? this.success(JSON.stringify(envelope.value)) : envelope;
  }

  private recoverAfterWriteFailure(
    envelope: CampaignRunSaveEnvelope,
    candidateBytes: string,
    previousBytes: string | undefined,
    error: unknown,
  ): CampaignRunSaveResult<CampaignRunSaveReceipt> {
    let observed: string | undefined;
    try { observed = this.options.storage.read(this.storageKey); } catch {
      return this.failure('storage-state-unknown', `Run save write and recovery read failed: ${this.message(error)}.`,
        [{ code: 'run.storage.state-unknown', message: 'Storage state could not be reconciled.', path: ['storage'] }],
        'storage-state-unknown');
    }
    if (observed === candidateBytes) return this.success(cloneFrozen({
      envelope,
      persistence: 'verified-after-error' as const,
    }));
    if (observed === previousBytes) return this.failure('storage-write-failed',
      `Run save write failed and previous bytes were preserved: ${this.message(error)}.`, [{
        code: 'run.storage.write-failed', message: 'Previous run save remains authoritative.', path: ['storage'],
      }], 'previous-preserved');
    return this.failure('storage-state-unknown',
      `Run save write left unrecognized bytes: ${this.message(error)}.`, [{
        code: 'run.storage.state-unknown', message: 'Storage requires external reconciliation.', path: ['storage'],
      }], 'storage-state-unknown');
  }

  private success<T>(value: T): CampaignRunSaveResult<T> {
    return Object.freeze({ ok: true as const, value });
  }

  private failure<T = never>(
    code: CampaignRunSaveFailureCode,
    message: string,
    diagnostics: readonly CampaignRunDiagnostic[],
    recovery: CampaignRunSaveFailure['recovery'],
  ): CampaignRunSaveResult<T> {
    return Object.freeze({ ok: false as const, error: cloneFrozen({ code, message, diagnostics, recovery }) });
  }

  private message(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}

