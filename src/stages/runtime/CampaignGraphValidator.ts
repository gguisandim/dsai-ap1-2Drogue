import type {
  CampaignAct,
  CampaignEdge,
  CampaignGraph,
  CampaignGraphDiagnostic,
  CampaignGraphDiagnosticCode,
  CampaignNode,
} from '../contracts';

const COMPLETE = 'campaign.complete';
const STABLE_ID = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/;
const ACT_DEPTH_RANGES: readonly (readonly [number, number])[] = [[0, 2], [3, 5], [6, 8]];
const MILESTONE_DEPTHS = new Set([2, 5, 8]);
const MINIMUM_NODES = 9;
const MAXIMUM_NODES = 12;

type Path = readonly (string | number)[];

interface DiagnosticTarget {
  readonly nodeId?: string;
  readonly edgeId?: string;
  readonly referenceId?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isStableId(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value === value.trim() && STABLE_ID.test(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value === value.trim();
}

function isDepth(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 8;
}

function isPositiveRevision(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1;
}

function isBranchId(value: unknown): boolean {
  return value === 'main' || value === 'route-a' || value === 'route-b';
}

function isNodeKind(value: unknown): boolean {
  return value === 'intermediate' || value === 'milestone';
}

function isEdgeKind(value: unknown): boolean {
  return value === 'forward' || value === 'branch' || value === 'rejoin' || value === 'return';
}

function isExitCapacity(value: unknown): boolean {
  return value === 1 || value === 2 || value === 3;
}

function isTraversalLimit(value: unknown): boolean {
  return value === 1 || value === 2;
}

function isStableIdArray(value: unknown): value is readonly string[] {
  return Array.isArray(value) && value.every(isStableId);
}

function add(
  diagnostics: CampaignGraphDiagnostic[],
  code: CampaignGraphDiagnosticCode,
  message: string,
  path: Path,
  target: DiagnosticTarget = {},
): void {
  diagnostics.push({
    code,
    severity: 'error',
    message,
    path,
    ...(target.nodeId ? { nodeId: target.nodeId } : {}),
    ...(target.edgeId ? { edgeId: target.edgeId } : {}),
    ...(target.referenceId ? { referenceId: target.referenceId } : {}),
  });
}

function diagnosticKey(diagnostic: CampaignGraphDiagnostic): string {
  return [
    diagnostic.path.map(String).join('.'),
    diagnostic.code,
    diagnostic.nodeId ?? '',
    diagnostic.edgeId ?? '',
    diagnostic.referenceId ?? '',
    diagnostic.message,
  ].join('|');
}

function sortDiagnostics(diagnostics: CampaignGraphDiagnostic[]): readonly CampaignGraphDiagnostic[] {
  diagnostics.sort((left, right) => {
    const leftKey = diagnosticKey(left);
    const rightKey = diagnosticKey(right);
    return leftKey < rightKey ? -1 : leftKey > rightKey ? 1 : 0;
  });
  return Object.freeze(diagnostics.map(diagnostic => Object.freeze({ ...diagnostic })));
}

function compareIds(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function distinctTargets(edges: readonly CampaignEdge[]): string[] {
  return [...new Set(edges.map(edge => edge.targetNodeId).filter(target => target !== COMPLETE))]
    .sort(compareIds);
}

/**
 * Validates a generated or persisted campaign graph without touching Phaser,
 * storage, the clock or any map generator.
 */
export class CampaignGraphValidator {
  public validate(graph: CampaignGraph): readonly CampaignGraphDiagnostic[] {
    const diagnostics: CampaignGraphDiagnostic[] = [];
    if (!isRecord(graph)) {
      add(diagnostics, 'campaign.graph.header-invalid',
        'Campaign graph must be an object.', []);
      return sortDiagnostics(diagnostics);
    }

    this.validateHeader(graph, diagnostics);
    const acts = this.validateActs(graph, diagnostics);
    const actById = new Map(acts.map(act => [act.id, act]));
    const nodes = this.validateNodes(graph, actById, diagnostics);
    const nodeById = new Map(nodes.map(node => [node.id, node]));
    this.validateMilestones(acts, nodeById, diagnostics);
    this.validateMandatoryBeats(graph, nodes, diagnostics);
    const lastAct = acts.find(act => act.ordinal === 3);
    const lastMilestoneId = lastAct?.milestoneNodeId;
    const edges = this.validateEdges(graph, nodeById, lastMilestoneId, diagnostics);
    this.validateTopology(graph, acts, nodes, nodeById, edges, diagnostics);
    return sortDiagnostics(diagnostics);
  }

  private validateHeader(
    graph: CampaignGraph,
    diagnostics: CampaignGraphDiagnostic[],
  ): void {
    if (graph.schemaVersion !== 1) {
      add(diagnostics, 'campaign.graph.header-invalid',
        'Campaign graph schemaVersion must be 1.', ['schemaVersion']);
    }
    if (graph.generatorVersion !== 1) {
      add(diagnostics, 'campaign.graph.header-invalid',
        'Campaign graph generatorVersion must be 1.', ['generatorVersion']);
    }
    for (const field of ['id', 'campaignId', 'runId', 'entryNodeId'] as const) {
      if (!isStableId(graph[field])) {
        add(diagnostics, 'campaign.graph.header-invalid',
          `${field} must be a stable lowercase identifier.`, [field]);
      }
    }
    for (const field of ['runSeed', 'generationContextDigest'] as const) {
      if (!isNonEmptyString(graph[field])) {
        add(diagnostics, 'campaign.graph.header-invalid',
          `${field} must be a non-empty normalized string.`, [field]);
      }
    }
    for (const field of ['campaignRevision', 'catalogRevision'] as const) {
      if (!isPositiveRevision(graph[field])) {
        add(diagnostics, 'campaign.graph.header-invalid',
          `${field} must be a positive safe integer.`, [field]);
      }
    }
    if (!isStableIdArray(graph.mandatoryBeatIds)) {
      add(diagnostics, 'campaign.graph.header-invalid',
        'mandatoryBeatIds must list stable narrative beat identifiers.',
        ['mandatoryBeatIds']);
    }
  }

  private validateActs(
    graph: CampaignGraph,
    diagnostics: CampaignGraphDiagnostic[],
  ): readonly CampaignAct[] {
    if (!Array.isArray(graph.acts)) {
      add(diagnostics, 'campaign.graph.act-set-invalid',
        'Campaign acts must be an array.', ['acts']);
      return [];
    }
    if (graph.acts.length !== 3) {
      add(diagnostics, 'campaign.graph.act-set-invalid',
        'Campaign graph must declare exactly three acts.', ['acts'],
        { referenceId: String(graph.acts.length) });
    }

    const acts: CampaignAct[] = [];
    const seenIds = new Set<string>();
    const seenOrdinals = new Set<number>();
    graph.acts.forEach((value, index) => {
      if (!isRecord(value)) {
        add(diagnostics, 'campaign.graph.act-invalid',
          'Campaign act must be an object.', ['acts', index]);
        return;
      }
      const act = value as unknown as CampaignAct;
      const path = (field: string): Path => ['acts', index, field];
      let valid = true;

      if (!isStableId(act.id)) {
        add(diagnostics, 'campaign.graph.act-invalid',
          'Act id must be a stable lowercase identifier.', path('id'));
        valid = false;
      } else if (seenIds.has(act.id)) {
        add(diagnostics, 'campaign.graph.act-duplicate',
          `Act id is declared more than once: ${act.id}.`, path('id'),
          { referenceId: act.id });
        valid = false;
      } else {
        seenIds.add(act.id);
      }

      const ordinal = act.ordinal as number;
      if (ordinal !== 1 && ordinal !== 2 && ordinal !== 3) {
        add(diagnostics, 'campaign.graph.act-invalid',
          'Act ordinal must be 1, 2 or 3.', path('ordinal'));
        valid = false;
      } else if (seenOrdinals.has(ordinal)) {
        add(diagnostics, 'campaign.graph.act-duplicate',
          `Act ordinal is declared more than once: ${ordinal}.`,
          path('ordinal'), { referenceId: `ordinal.${ordinal}` });
        valid = false;
      } else {
        seenOrdinals.add(ordinal);
      }

      const expectedRange = ordinal >= 1 && ordinal <= 3 ? ACT_DEPTH_RANGES[ordinal - 1] : undefined;
      const range = act.depthRange;
      const rangeValid = expectedRange !== undefined && Array.isArray(range) && range.length === 2 &&
        isDepth(range[0]) && isDepth(range[1]) &&
        range[0] === expectedRange[0] && range[1] === expectedRange[1];
      if (!rangeValid) {
        add(diagnostics, 'campaign.graph.act-invalid',
          expectedRange
            ? `Act ${ordinal} depthRange must be [${expectedRange[0]}, ${expectedRange[1]}].`
            : 'Act depthRange must span two depths from 0 to 8.',
          path('depthRange'));
        valid = false;
      }

      if (!isStableId(act.milestoneNodeId)) {
        add(diagnostics, 'campaign.graph.act-invalid',
          'Act milestoneNodeId must be a stable lowercase identifier.',
          path('milestoneNodeId'));
        valid = false;
      }

      if (!isStableIdArray(act.requiredBeatIds) || act.requiredBeatIds.length === 0) {
        add(diagnostics, 'campaign.graph.act-invalid',
          'Act must require at least one stable narrative beat.',
          path('requiredBeatIds'));
        valid = false;
      } else if (new Set(act.requiredBeatIds).size !== act.requiredBeatIds.length) {
        add(diagnostics, 'campaign.graph.act-invalid',
          'Act requiredBeatIds must not contain duplicates.',
          path('requiredBeatIds'));
        valid = false;
      }

      if (valid) acts.push(act);
    });
    return acts.sort((left, right) => left.ordinal - right.ordinal);
  }

  private validateNodes(
    graph: CampaignGraph,
    actById: ReadonlyMap<string, CampaignAct>,
    diagnostics: CampaignGraphDiagnostic[],
  ): readonly CampaignNode[] {
    if (!Array.isArray(graph.nodes)) {
      add(diagnostics, 'campaign.graph.node-invalid',
        'Campaign nodes must be an array.', ['nodes']);
      return [];
    }

    const nodes: CampaignNode[] = [];
    const seenIds = new Set<string>();
    const seenInstances = new Set<string>();
    graph.nodes.forEach((value, index) => {
      if (!isRecord(value)) {
        add(diagnostics, 'campaign.graph.node-invalid',
          'Campaign node must be an object.', ['nodes', index]);
        return;
      }
      const node = value as unknown as CampaignNode;
      const path = (field: string): Path => ['nodes', index, field];
      let identityValid = true;

      if (!isStableId(node.id)) {
        add(diagnostics, 'campaign.graph.node-invalid',
          'Node id must be a stable lowercase identifier.', path('id'));
        identityValid = false;
      } else if (seenIds.has(node.id)) {
        add(diagnostics, 'campaign.graph.node-duplicate',
          `Node id is declared more than once: ${node.id}.`, path('id'),
          { nodeId: node.id, referenceId: node.id });
        identityValid = false;
      } else {
        seenIds.add(node.id);
      }

      for (const field of ['slotId', 'templateId', 'stageId'] as const) {
        if (!isStableId(node[field])) {
          add(diagnostics, 'campaign.graph.node-invalid',
            `${field} must be a stable lowercase identifier.`, path(field),
            { nodeId: node.id });
        }
      }
      if (!isPositiveRevision(node.templateRevision)) {
        add(diagnostics, 'campaign.graph.node-invalid',
          'templateRevision must be a positive safe integer.', path('templateRevision'),
          { nodeId: node.id });
      }
      if (!isNonEmptyString(node.stageSeed)) {
        add(diagnostics, 'campaign.graph.node-invalid',
          'stageSeed must be a non-empty normalized string.', path('stageSeed'),
          { nodeId: node.id });
      }
      if (!isNonEmptyString(node.biomeId)) {
        add(diagnostics, 'campaign.graph.node-invalid',
          'biomeId must be a non-empty identifier.', path('biomeId'),
          { nodeId: node.id });
      }
      if (typeof node.difficulty !== 'number' || !Number.isFinite(node.difficulty) || node.difficulty < 0) {
        add(diagnostics, 'campaign.graph.node-invalid',
          'difficulty must be a finite non-negative number.', path('difficulty'),
          { nodeId: node.id });
      }
      if (!isStableIdArray(node.providesBeatIds)) {
        add(diagnostics, 'campaign.graph.node-invalid',
          'providesBeatIds must list stable narrative beat identifiers.',
          path('providesBeatIds'), { nodeId: node.id });
      }
      if (!isExitCapacity(node.maximumPhysicalExits)) {
        add(diagnostics, 'campaign.graph.node-invalid',
          'maximumPhysicalExits must be 1, 2 or 3.', path('maximumPhysicalExits'),
          { nodeId: node.id });
      }
      if (!isBranchId(node.branchId)) {
        add(diagnostics, 'campaign.graph.node-invalid',
          'branchId must be main, route-a or route-b.', path('branchId'),
          { nodeId: node.id });
      }
      if (!isNodeKind(node.kind)) {
        add(diagnostics, 'campaign.graph.node-invalid',
          'kind must be intermediate or milestone.', path('kind'),
          { nodeId: node.id });
      }
      if (!isDepth(node.depth)) {
        add(diagnostics, 'campaign.graph.node-depth',
          'depth must be an integer from 0 to 8.', path('depth'),
          { nodeId: node.id });
      } else if (isNodeKind(node.kind)) {
        const expectedKind = MILESTONE_DEPTHS.has(node.depth) ? 'milestone' : 'intermediate';
        if (node.kind !== expectedKind) {
          add(diagnostics, 'campaign.graph.node-milestone',
            `Depth ${node.depth} must hold a ${expectedKind} node.`, path('kind'),
            { nodeId: node.id });
        }
        if ((node.depth === 0 || MILESTONE_DEPTHS.has(node.depth)) && node.branchId !== 'main') {
          add(diagnostics, 'campaign.graph.node-branch',
            `Depth ${node.depth} must use the main branch.`, path('branchId'),
            { nodeId: node.id });
        }
      }

      const act = actById.get(node.actId);
      if (!act) {
        add(diagnostics, 'campaign.graph.node-act-mismatch',
          `Node references an unknown act: ${String(node.actId)}.`, path('actId'),
          { nodeId: node.id, referenceId: String(node.actId) });
      } else if (isDepth(node.depth) &&
        (node.depth < act.depthRange[0] || node.depth > act.depthRange[1])) {
        add(diagnostics, 'campaign.graph.node-act-mismatch',
          `Node depth ${node.depth} is outside act ${act.id} range.`, path('actId'),
          { nodeId: node.id, referenceId: act.id });
      }

      if (identityValid && isStableId(node.templateId) && isNonEmptyString(node.stageSeed)) {
        const instanceKey = `${node.templateId}|${node.stageSeed}`;
        if (seenInstances.has(instanceKey)) {
          add(diagnostics, 'campaign.graph.instance-collision',
            `Template ${node.templateId} reuses a stageSeed in more than one node.`,
            path('stageSeed'), { nodeId: node.id, referenceId: node.templateId });
        } else {
          seenInstances.add(instanceKey);
        }
      }

      if (identityValid) nodes.push(node);
    });
    return nodes.sort((left, right) => compareIds(left.id, right.id));
  }

  private validateMilestones(
    acts: readonly CampaignAct[],
    nodeById: ReadonlyMap<string, CampaignNode>,
    diagnostics: CampaignGraphDiagnostic[],
  ): void {
    for (const act of acts) {
      const milestone = nodeById.get(act.milestoneNodeId);
      if (!milestone) {
        add(diagnostics, 'campaign.graph.milestone-invalid',
          `Act ${act.id} references an unknown milestone node: ${act.milestoneNodeId}.`,
          ['acts', act.id, 'milestoneNodeId'], { referenceId: act.milestoneNodeId });
        continue;
      }
      if (milestone.depth !== act.depthRange[1] || milestone.kind !== 'milestone' ||
        milestone.actId !== act.id) {
        add(diagnostics, 'campaign.graph.milestone-invalid',
          `Milestone ${milestone.id} must close act ${act.id} at depth ${act.depthRange[1]}.`,
          ['acts', act.id, 'milestoneNodeId'], { nodeId: milestone.id, referenceId: act.id });
      }
      for (const beat of act.requiredBeatIds) {
        if (!milestone.providesBeatIds.includes(beat)) {
          add(diagnostics, 'campaign.graph.milestone-beat',
            `Milestone ${milestone.id} must provide required beat ${beat}.`,
            ['acts', act.id, 'requiredBeatIds'], { nodeId: milestone.id, referenceId: beat });
        }
      }
    }
  }

  private validateMandatoryBeats(
    graph: CampaignGraph,
    nodes: readonly CampaignNode[],
    diagnostics: CampaignGraphDiagnostic[],
  ): void {
    if (!isStableIdArray(graph.mandatoryBeatIds)) return;
    if (new Set(graph.mandatoryBeatIds).size !== graph.mandatoryBeatIds.length) {
      add(diagnostics, 'campaign.graph.beat-unreachable',
        'mandatoryBeatIds must not contain duplicates.', ['mandatoryBeatIds']);
    }
    const provided = new Set(nodes.flatMap(node => node.providesBeatIds));
    for (const beat of graph.mandatoryBeatIds) {
      if (!provided.has(beat)) {
        add(diagnostics, 'campaign.graph.beat-unreachable',
          `Mandatory beat ${beat} is not provided by any node.`,
          ['mandatoryBeatIds'], { referenceId: beat });
      }
    }
  }

  private validateEdges(
    graph: CampaignGraph,
    nodeById: ReadonlyMap<string, CampaignNode>,
    lastMilestoneId: string | undefined,
    diagnostics: CampaignGraphDiagnostic[],
  ): readonly CampaignEdge[] {
    if (!Array.isArray(graph.edges)) {
      add(diagnostics, 'campaign.graph.edge-invalid',
        'Campaign edges must be an array.', ['edges']);
      return [];
    }

    const edges: CampaignEdge[] = [];
    const seenIds = new Set<string>();
    const seenExitSlots = new Set<string>();
    const seenPhysicalExits = new Set<string>();
    let completionCount = 0;

    graph.edges.forEach((value, index) => {
      if (!isRecord(value)) {
        add(diagnostics, 'campaign.graph.edge-invalid',
          'Campaign edge must be an object.', ['edges', index]);
        return;
      }
      const edge = value as unknown as CampaignEdge;
      const path = (field: string): Path => ['edges', index, field];
      let identityValid = true;

      if (!isStableId(edge.id)) {
        add(diagnostics, 'campaign.graph.edge-invalid',
          'Edge id must be a stable lowercase identifier.', path('id'));
        identityValid = false;
      } else if (seenIds.has(edge.id)) {
        add(diagnostics, 'campaign.graph.edge-duplicate',
          `Edge id is declared more than once: ${edge.id}.`, path('id'),
          { edgeId: edge.id, referenceId: edge.id });
        identityValid = false;
      } else {
        seenIds.add(edge.id);
      }

      if (!isStableId(edge.sourceNodeId)) {
        add(diagnostics, 'campaign.graph.edge-invalid',
          'sourceNodeId must be a stable lowercase identifier.', path('sourceNodeId'),
          { edgeId: edge.id });
      }
      if (edge.targetNodeId !== COMPLETE && !isStableId(edge.targetNodeId)) {
        add(diagnostics, 'campaign.graph.edge-invalid',
          'targetNodeId must be a stable identifier or campaign.complete.',
          path('targetNodeId'), { edgeId: edge.id });
      }
      if (!isStableId(edge.exitSlotId)) {
        add(diagnostics, 'campaign.graph.edge-invalid',
          'exitSlotId must be a stable lowercase identifier.', path('exitSlotId'),
          { edgeId: edge.id });
      }
      if (!isStableId(edge.physicalExitId)) {
        add(diagnostics, 'campaign.graph.edge-invalid',
          'physicalExitId must be a stable lowercase identifier.', path('physicalExitId'),
          { edgeId: edge.id });
      }
      if (!isEdgeKind(edge.kind)) {
        add(diagnostics, 'campaign.graph.edge-kind',
          'kind must be forward, branch, rejoin or return.', path('kind'),
          { edgeId: edge.id });
      }
      if (!isTraversalLimit(edge.traversalLimit)) {
        add(diagnostics, 'campaign.graph.edge-invalid',
          'traversalLimit must be 1 or 2.', path('traversalLimit'),
          { edgeId: edge.id });
      }
      if (isStableId(edge.sourceNodeId) && isStableId(edge.exitSlotId)) {
        const exitKey = `${edge.sourceNodeId}|${edge.exitSlotId}`;
        if (seenExitSlots.has(exitKey)) {
          add(diagnostics, 'campaign.graph.edge-duplicate',
            `Exit slot ${edge.exitSlotId} is reused by node ${edge.sourceNodeId}.`,
            path('exitSlotId'), { edgeId: edge.id, referenceId: edge.exitSlotId });
        } else {
          seenExitSlots.add(exitKey);
        }
      }
      if (isStableId(edge.physicalExitId)) {
        if (seenPhysicalExits.has(edge.physicalExitId)) {
          add(diagnostics, 'campaign.graph.edge-duplicate',
            `Physical exit ${edge.physicalExitId} is declared more than once.`,
            path('physicalExitId'), { edgeId: edge.id, referenceId: edge.physicalExitId });
        } else {
          seenPhysicalExits.add(edge.physicalExitId);
        }
      }

      const isComplete = edge.targetNodeId === COMPLETE;
      if (isComplete) completionCount += 1;
      const source = isStableId(edge.sourceNodeId) ? nodeById.get(edge.sourceNodeId) : undefined;
      if (isStableId(edge.sourceNodeId) && !source) {
        add(diagnostics, 'campaign.graph.edge-reference',
          `Edge references an unknown source node: ${edge.sourceNodeId}.`,
          path('sourceNodeId'), { edgeId: edge.id, referenceId: edge.sourceNodeId });
      }
      const target = !isComplete && isStableId(edge.targetNodeId)
        ? nodeById.get(edge.targetNodeId)
        : undefined;
      if (!isComplete && isStableId(edge.targetNodeId) && !target) {
        add(diagnostics, 'campaign.graph.edge-reference',
          `Edge references an unknown target node: ${edge.targetNodeId}.`,
          path('targetNodeId'), { edgeId: edge.id, referenceId: edge.targetNodeId });
      }
      if (!isComplete && edge.targetNodeId === edge.sourceNodeId) {
        add(diagnostics, 'campaign.graph.edge-reference',
          'Edge cannot point to its own source node.', path('targetNodeId'),
          { edgeId: edge.id, nodeId: edge.sourceNodeId });
      }

      if (edge.kind === 'return') {
        this.validateReturnEdge(edge, source, target, isComplete, diagnostics);
      } else if (isComplete) {
        if (edge.kind !== 'forward') {
          add(diagnostics, 'campaign.graph.edge-kind',
            'Only forward edges may reach campaign.complete.', path('kind'),
            { edgeId: edge.id });
        }
        if (source && (source.depth !== 8 || source.kind !== 'milestone')) {
          add(diagnostics, 'campaign.graph.edge-completion',
            'Only the last milestone may precede campaign.complete.', path('sourceNodeId'),
            { edgeId: edge.id, nodeId: source.id });
        }
        if (source && lastMilestoneId !== undefined && source.id !== lastMilestoneId) {
          add(diagnostics, 'campaign.graph.edge-completion',
            `Campaign completion must follow ${lastMilestoneId}, not ${source.id}.`,
            path('sourceNodeId'), { edgeId: edge.id, nodeId: source.id });
        }
      } else if (source && target && target.depth !== source.depth + 1) {
        add(diagnostics, 'campaign.graph.edge-depth',
          `Edge must advance exactly one depth: ${source.id} -> ${target.id}.`,
          path('targetNodeId'), { edgeId: edge.id, nodeId: source.id });
      }

      if (identityValid && source && (isComplete || target)) edges.push(edge);
    });

    if (completionCount !== 1) {
      add(diagnostics, 'campaign.graph.edge-completion',
        'Campaign graph must contain exactly one edge to campaign.complete.',
        ['edges'], { referenceId: COMPLETE });
    }
    return edges.sort((left, right) => compareIds(left.id, right.id));
  }

  private validateReturnEdge(
    edge: CampaignEdge,
    source: CampaignNode | undefined,
    target: CampaignNode | undefined,
    isComplete: boolean,
    diagnostics: CampaignGraphDiagnostic[],
  ): void {
    if (isComplete) {
      add(diagnostics, 'campaign.graph.edge-return',
        'Return edges cannot target campaign.complete.', ['targetNodeId'],
        { edgeId: edge.id });
      return;
    }
    if (!source || !target) return;
    if (source.depth === 0) {
      add(diagnostics, 'campaign.graph.edge-return',
        'The entry node cannot declare a return edge.', ['sourceNodeId'],
        { edgeId: edge.id, nodeId: source.id });
    }
    if (target.depth !== source.depth - 1) {
      add(diagnostics, 'campaign.graph.edge-return',
        'Return edges must point to the previous depth.', ['targetNodeId'],
        { edgeId: edge.id, nodeId: source.id, referenceId: target.id });
    }
    if (source.actId !== target.actId) {
      add(diagnostics, 'campaign.graph.edge-return',
        'Return edges must stay inside the same act.', ['targetNodeId'],
        { edgeId: edge.id, nodeId: source.id, referenceId: target.id });
    }
    if (edge.traversalLimit !== 2) {
      add(diagnostics, 'campaign.graph.edge-return',
        'Return edges must use traversalLimit 2.', ['traversalLimit'],
        { edgeId: edge.id });
    }
  }

  private validateTopology(
    graph: CampaignGraph,
    acts: readonly CampaignAct[],
    nodes: readonly CampaignNode[],
    nodeById: ReadonlyMap<string, CampaignNode>,
    edges: readonly CampaignEdge[],
    diagnostics: CampaignGraphDiagnostic[],
  ): void {
    const entry = nodeById.get(graph.entryNodeId);
    if (!entry) {
      add(diagnostics, 'campaign.graph.entry-invalid',
        `Entry node is not declared: ${graph.entryNodeId}.`, ['entryNodeId'],
        { referenceId: graph.entryNodeId });
      return;
    }
    if (entry.depth !== 0 || entry.kind !== 'intermediate' || entry.branchId !== 'main') {
      add(diagnostics, 'campaign.graph.entry-invalid',
        'Entry node must be a main intermediate node at depth 0.', ['entryNodeId'],
        { nodeId: entry.id });
    }
    if (nodes.length < MINIMUM_NODES || nodes.length > MAXIMUM_NODES) {
      add(diagnostics, 'campaign.graph.topology-invalid',
        `Campaign graph must declare ${MINIMUM_NODES} to ${MAXIMUM_NODES} nodes.`,
        ['nodes'], { referenceId: String(nodes.length) });
    }

    const byDepth = new Map<number, CampaignNode[]>();
    for (let depth = 0; depth <= 8; depth += 1) byDepth.set(depth, []);
    for (const node of nodes) byDepth.get(node.depth)?.push(node);

    for (let depth = 0; depth <= 8; depth += 1) {
      const group = (byDepth.get(depth) ?? []).sort((left, right) => compareIds(left.id, right.id));
      if (group.length === 0) {
        add(diagnostics, 'campaign.graph.topology-invalid',
          `Depth ${depth} has no campaign node.`, ['nodes'],
          { referenceId: `depth.${depth}` });
        continue;
      }
      if (group.length > 2) {
        add(diagnostics, 'campaign.graph.fork-width',
          `Depth ${depth} has ${group.length} nodes; maximum fork width is 2.`,
          ['nodes'], { referenceId: `depth.${depth}` });
      }
      if (MILESTONE_DEPTHS.has(depth) && group.length !== 1) {
        add(diagnostics, 'campaign.graph.milestone-invalid',
          `Depth ${depth} must hold exactly one milestone node.`, ['nodes'],
          { referenceId: `depth.${depth}` });
      }
      if (group.length === 1) {
        if (group[0].branchId !== 'main') {
          add(diagnostics, 'campaign.graph.node-branch',
            `Lone node at depth ${depth} must use the main branch.`,
            ['nodes'], { nodeId: group[0].id });
        }
        continue;
      }
      const branches = new Set(group.map(node => node.branchId));
      if (branches.size !== group.length || branches.has('main')) {
        add(diagnostics, 'campaign.graph.node-branch',
          `Fork at depth ${depth} must use two distinct alternative branches.`,
          ['nodes'], { referenceId: `depth.${depth}` });
      }
    }

    if ((byDepth.get(0) ?? []).length !== 1) {
      add(diagnostics, 'campaign.graph.entry-invalid',
        'Depth 0 must contain exactly the entry node.', ['entryNodeId'],
        { referenceId: graph.entryNodeId });
    }

    const forwardEdges = edges.filter(edge => edge.kind !== 'return');
    const outgoing = new Map<string, CampaignEdge[]>();
    for (const edge of forwardEdges) {
      const list = outgoing.get(edge.sourceNodeId) ?? [];
      list.push(edge);
      outgoing.set(edge.sourceNodeId, list);
    }

    const branchBySource = new Map<string, CampaignEdge[]>();
    for (const edge of forwardEdges) {
      if (edge.kind !== 'branch') continue;
      const list = branchBySource.get(edge.sourceNodeId) ?? [];
      list.push(edge);
      branchBySource.set(edge.sourceNodeId, list);
    }
    for (const [sourceId, branchEdges] of branchBySource) {
      if (branchEdges.length !== 2 || distinctTargets(branchEdges).length !== 2) {
        add(diagnostics, 'campaign.graph.fork-width',
          `Node ${sourceId} must branch into exactly two distinct targets.`,
          ['edges'], { nodeId: sourceId });
      }
    }

    for (const node of nodes) {
      const outs = outgoing.get(node.id) ?? [];
      if (outs.length > node.maximumPhysicalExits) {
        add(diagnostics, 'campaign.graph.topology-invalid',
          `Node ${node.id} exceeds its ${node.maximumPhysicalExits} physical exit capacity.`,
          ['nodes'], { nodeId: node.id });
      }
      if (outs.length > 2) {
        add(diagnostics, 'campaign.graph.fork-width',
          `Node ${node.id} has ${outs.length} forward exits; maximum is 2.`,
          ['edges'], { nodeId: node.id });
      }
    }

    for (let depth = 0; depth <= 8; depth += 1) {
      const group = byDepth.get(depth) ?? [];
      if (group.length !== 2) continue;
      const successors = group.map(node =>
        distinctTargets(outgoing.get(node.id) ?? []));
      const [left, right] = successors;
      if (left.length !== 1 || right.length !== 1 || left[0] !== right[0]) {
        add(diagnostics, 'campaign.graph.fork-rejoin',
          `Fork at depth ${depth} must rejoin at one node in depth ${depth + 1}.`,
          ['nodes'], { referenceId: `depth.${depth}` });
      }
    }

    this.validateReachability(entry, nodes, nodeById, forwardEdges, diagnostics);
    this.validateCycles(nodes, outgoing, diagnostics);
    this.validateCompletion(acts, nodeById, edges, diagnostics);
  }

  private validateReachability(
    entry: CampaignNode,
    nodes: readonly CampaignNode[],
    nodeById: ReadonlyMap<string, CampaignNode>,
    forwardEdges: readonly CampaignEdge[],
    diagnostics: CampaignGraphDiagnostic[],
  ): void {
    const outgoing = new Map<string, string[]>();
    const incoming = new Map<string, string[]>();
    const completionSources = new Set<string>();
    for (const edge of forwardEdges) {
      if (edge.targetNodeId === COMPLETE) {
        completionSources.add(edge.sourceNodeId);
        continue;
      }
      if (!nodeById.has(edge.sourceNodeId) || !nodeById.has(edge.targetNodeId)) continue;
      const targets = outgoing.get(edge.sourceNodeId) ?? [];
      targets.push(edge.targetNodeId);
      outgoing.set(edge.sourceNodeId, targets);
      const sources = incoming.get(edge.targetNodeId) ?? [];
      sources.push(edge.sourceNodeId);
      incoming.set(edge.targetNodeId, sources);
    }

    const reachable = new Set<string>();
    const stack = [entry.id];
    while (stack.length > 0) {
      const current = stack.pop() as string;
      if (reachable.has(current)) continue;
      reachable.add(current);
      for (const next of outgoing.get(current) ?? []) stack.push(next);
    }
    for (const node of nodes) {
      if (!reachable.has(node.id)) {
        add(diagnostics, 'campaign.graph.unreachable',
          `Node ${node.id} is unreachable from the entry node.`,
          ['nodes'], { nodeId: node.id });
      }
    }

    const reachesCompletion = new Set<string>(completionSources);
    const reverseStack = [...completionSources];
    while (reverseStack.length > 0) {
      const current = reverseStack.pop() as string;
      for (const previous of incoming.get(current) ?? []) {
        if (reachesCompletion.has(previous)) continue;
        reachesCompletion.add(previous);
        reverseStack.push(previous);
      }
    }
    for (const node of nodes) {
      if (!reachesCompletion.has(node.id)) {
        add(diagnostics, 'campaign.graph.softlock',
          `Node ${node.id} has no forward path to campaign.complete.`,
          ['nodes'], { nodeId: node.id });
      }
    }
  }

  private validateCycles(
    nodes: readonly CampaignNode[],
    outgoing: ReadonlyMap<string, readonly CampaignEdge[]>,
    diagnostics: CampaignGraphDiagnostic[],
  ): void {
    const state = new Map<string, 'visiting' | 'visited'>();
    const visit = (nodeId: string): void => {
      state.set(nodeId, 'visiting');
      for (const edge of outgoing.get(nodeId) ?? []) {
        if (edge.targetNodeId === COMPLETE) continue;
        const targetState = state.get(edge.targetNodeId);
        if (targetState === 'visiting') {
          add(diagnostics, 'campaign.graph.cycle',
            `Forward edges form a cycle through ${edge.targetNodeId}.`,
            ['edges'], { edgeId: edge.id, nodeId: edge.targetNodeId });
        } else if (!targetState) {
          visit(edge.targetNodeId);
        }
      }
      state.set(nodeId, 'visited');
    };
    for (const node of nodes) {
      if (!state.has(node.id)) visit(node.id);
    }
  }

  private validateCompletion(
    acts: readonly CampaignAct[],
    nodeById: ReadonlyMap<string, CampaignNode>,
    edges: readonly CampaignEdge[],
    diagnostics: CampaignGraphDiagnostic[],
  ): void {
    const lastAct = acts.find(act => act.ordinal === 3);
    const lastMilestone = lastAct ? nodeById.get(lastAct.milestoneNodeId) : undefined;
    const completionEdges = edges.filter(edge => edge.targetNodeId === COMPLETE);
    if (completionEdges.length === 0) {
      add(diagnostics, 'campaign.graph.edge-completion',
        'Campaign graph has no edge to campaign.complete.', ['edges'],
        { referenceId: COMPLETE });
      return;
    }
    for (const edge of completionEdges) {
      const source = nodeById.get(edge.sourceNodeId);
      if (!lastMilestone || !source || source.id !== lastMilestone.id || source.depth !== 8) {
        add(diagnostics, 'campaign.graph.edge-completion',
          `Campaign completion must follow the depth 8 milestone ${lastMilestone?.id ?? '<missing>'}.`,
          ['edges'], { edgeId: edge.id, referenceId: COMPLETE });
      }
    }
  }
}
