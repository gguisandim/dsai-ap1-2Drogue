import {
  WORLD_LAB_SNAPSHOT_SCHEMA,
  type WorldLabDiagnostic,
  type WorldLabDocument,
  type WorldLabGraphEdgeView,
  type WorldLabGraphNodeView,
  type WorldLabSnapshot,
  type WorldLabSnapshotFailureCode,
  type WorldLabSnapshotResult,
  type WorldLabStageMarker,
  type WorldLabStageView,
} from './contracts';

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function text(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function finite(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function integer(value: unknown): value is number {
  return finite(value) && Number.isInteger(value);
}

function compare(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function diagnostic(
  code: string,
  message: string,
  path: readonly (string | number)[],
): WorldLabDiagnostic {
  return Object.freeze({
    code,
    severity: 'error',
    origin: 'snapshot',
    message,
    path: Object.freeze([...path]),
  });
}

function validNode(value: unknown): value is WorldLabGraphNodeView {
  const presentationValid = isRecord(value) && (value.presentation === undefined ||
    (isRecord(value.presentation) && text(value.presentation.id) && text(value.presentation.label) &&
      text(value.presentation.accent) && text(value.presentation.surface)));
  return presentationValid && isRecord(value) && text(value.id) && text(value.stageId) && text(value.templateId) &&
    text(value.actId) && integer(value.depth) && text(value.branchId) &&
    (value.kind === 'intermediate' || value.kind === 'milestone') && text(value.biomeId) &&
    finite(value.difficulty) && integer(value.maximumPhysicalExits) &&
    integer(value.incomingCount) && integer(value.outgoingCount) && typeof value.entry === 'boolean';
}

function validEdge(value: unknown): value is WorldLabGraphEdgeView {
  if (!isRecord(value) || !text(value.id) || !text(value.sourceNodeId) || !text(value.targetNodeId) ||
    !['forward', 'branch', 'rejoin', 'return'].includes(String(value.kind)) ||
    !text(value.exitSlotId) || !text(value.physicalExitId) ||
    !['bound', 'unavailable', 'failed'].includes(String(value.bindingStatus)) ||
    (value.stageExitId !== undefined && !text(value.stageExitId)) ||
    (value.association !== undefined && value.association !== 'manifest-exit' &&
      value.association !== 'synthetic-slot') ||
    (value.tile !== undefined && (!isRecord(value.tile) || !integer(value.tile.x) || !integer(value.tile.y)))) {
    return false;
  }
  return value.bindingStatus !== 'bound' ||
    (text(value.stageExitId) &&
      (value.association === 'manifest-exit' || value.association === 'synthetic-slot') &&
      isRecord(value.tile) && integer(value.tile.x) && integer(value.tile.y));
}

function validMarker(value: unknown): value is WorldLabStageMarker {
  return isRecord(value) && text(value.id) &&
    ['spawn', 'enemy', 'boss', 'item', 'npc', 'anchor', 'section-exit', 'physical-exit']
      .includes(String(value.kind)) && integer(value.x) && integer(value.y) && text(value.label) &&
    (value.edgeId === undefined || text(value.edgeId)) &&
    (value.physicalExitId === undefined || text(value.physicalExitId));
}

function validStage(value: unknown): value is WorldLabStageView {
  if (!isRecord(value) || !text(value.nodeId) || !text(value.stageId) || !text(value.title) ||
    !text(value.theme) || !integer(value.width) || !integer(value.height) ||
    !Array.isArray(value.tiles) || !Array.isArray(value.markers) ||
    !Array.isArray(value.physicalExitIds)) return false;
  const width = value.width as number;
  const height = value.height as number;
  if (height !== value.tiles.length || width < 1 || height < 1) return false;
  if (!value.tiles.every(row => Array.isArray(row) && row.length === width &&
    row.every(tile => integer(tile)))) return false;
  if (!value.markers.every(validMarker) || !value.physicalExitIds.every(text)) return false;
  return value.markers.every(marker => marker.x >= 0 && marker.y >= 0 &&
    marker.x < width && marker.y < height);
}

function validDiagnostic(value: unknown): value is WorldLabDiagnostic {
  return isRecord(value) && text(value.code) &&
    ['info', 'warning', 'error'].includes(String(value.severity)) &&
    ['campaign-generator', 'stage-loader', 'physical-exit-resolver', 'campaign-exit-binder',
      'integration', 'snapshot'].includes(String(value.origin)) && text(value.message) &&
    (value.nodeId === undefined || text(value.nodeId)) &&
    (value.edgeId === undefined || text(value.edgeId)) &&
    (value.stageId === undefined || text(value.stageId)) &&
    (value.path === undefined || (Array.isArray(value.path) &&
      value.path.every(part => typeof part === 'string' || integer(part))));
}

function cloneNode(node: WorldLabGraphNodeView): WorldLabGraphNodeView {
  return Object.freeze({
    ...node,
    ...(node.presentation ? { presentation: Object.freeze({ ...node.presentation }) } : {}),
  });
}

function cloneEdge(edge: WorldLabGraphEdgeView): WorldLabGraphEdgeView {
  return Object.freeze({ ...edge, ...(edge.tile ? { tile: Object.freeze({ ...edge.tile }) } : {}) });
}

function cloneMarker(marker: WorldLabStageMarker): WorldLabStageMarker {
  return Object.freeze({ ...marker });
}

function cloneStage(stage: WorldLabStageView): WorldLabStageView {
  return Object.freeze({
    ...stage,
    tiles: Object.freeze(stage.tiles.map(row => Object.freeze([...row]))),
    markers: Object.freeze([...stage.markers]
      .sort((left, right) => compare(left.id, right.id) || compare(left.kind, right.kind))
      .map(cloneMarker)),
    physicalExitIds: Object.freeze([...stage.physicalExitIds].sort(compare)),
  });
}

function cloneDiagnostic(value: WorldLabDiagnostic): WorldLabDiagnostic {
  return Object.freeze({
    ...value,
    ...(value.path ? { path: Object.freeze([...value.path]) } : {}),
  });
}

export function canonicalWorldLabDocument(document: WorldLabDocument): WorldLabDocument {
  return Object.freeze({
    seed: document.seed,
    source: document.source,
    graphId: document.graphId,
    nodes: Object.freeze([...document.nodes]
      .sort((left, right) => left.depth - right.depth || compare(left.id, right.id))
      .map(cloneNode)),
    edges: Object.freeze([...document.edges].sort((left, right) => compare(left.id, right.id)).map(cloneEdge)),
    stages: Object.freeze([...document.stages]
      .sort((left, right) => compare(left.nodeId, right.nodeId)).map(cloneStage)),
    diagnostics: Object.freeze([...document.diagnostics]
      .sort((left, right) => compare(left.origin, right.origin) || compare(left.code, right.code) ||
        compare(left.nodeId ?? '', right.nodeId ?? '') || compare(left.edgeId ?? '', right.edgeId ?? '') ||
        compare(left.stageId ?? '', right.stageId ?? '') ||
        compare(left.path?.map(String).join('.') ?? '', right.path?.map(String).join('.') ?? '') ||
        compare(left.message, right.message))
      .map(cloneDiagnostic)),
  });
}

function failure(
  code: WorldLabSnapshotFailureCode,
  diagnostics: readonly WorldLabDiagnostic[],
): WorldLabSnapshotResult {
  return Object.freeze({
    ok: false as const,
    error: Object.freeze({ code, diagnostics: Object.freeze([...diagnostics]) }),
  });
}

function duplicate(values: readonly string[]): boolean {
  return new Set(values).size !== values.length;
}

export class WorldLabSnapshotCodec {
  public export(document: WorldLabDocument): string {
    const snapshot: WorldLabSnapshot = Object.freeze({
      schema: WORLD_LAB_SNAPSHOT_SCHEMA,
      document: canonicalWorldLabDocument(document),
    });
    return `${JSON.stringify(snapshot, null, 2)}\n`;
  }

  public import(serialized: string): WorldLabSnapshotResult {
    let parsed: unknown;
    try {
      parsed = JSON.parse(serialized);
    } catch {
      return failure('invalid-json', [diagnostic(
        'world-lab.snapshot.invalid-json', 'Snapshot is not valid JSON.', ['snapshot'],
      )]);
    }
    if (!isRecord(parsed) || parsed.schema !== WORLD_LAB_SNAPSHOT_SCHEMA) {
      return failure('unsupported-version', [diagnostic(
        'world-lab.snapshot.unsupported-version', 'Snapshot schema is not supported.', ['schema'],
      )]);
    }
    const value = parsed.document;
    if (!isRecord(value) || !text(value.seed) ||
      (value.source !== 'fixture-real-headless-pipeline' && value.source !== 'snapshot') ||
      !text(value.graphId) || !Array.isArray(value.nodes) || !value.nodes.every(validNode) ||
      !Array.isArray(value.edges) || !value.edges.every(validEdge) ||
      !Array.isArray(value.stages) || !value.stages.every(validStage) ||
      !Array.isArray(value.diagnostics) || !value.diagnostics.every(validDiagnostic)) {
      return failure('invalid-structure', [diagnostic(
        'world-lab.snapshot.invalid-structure', 'Snapshot document is structurally invalid.', ['document'],
      )]);
    }

    const document = value as unknown as WorldLabDocument;
    if (duplicate(document.nodes.map(node => node.id)) ||
      duplicate(document.edges.map(edge => edge.id)) ||
      duplicate(document.edges.map(edge => edge.physicalExitId)) ||
      duplicate(document.stages.map(stage => stage.nodeId)) ||
      document.stages.some(stage => duplicate(stage.markers.map(marker => marker.id)) ||
        duplicate(stage.physicalExitIds))) {
      return failure('duplicate-id', [diagnostic(
        'world-lab.snapshot.duplicate-id', 'Snapshot contains a duplicated stable identifier.', ['document'],
      )]);
    }
    const nodeIds = new Set(document.nodes.map(node => node.id));
    const edgeIds = new Set(document.edges.map(edge => edge.id));
    const edgeByPhysicalExit = new Map(document.edges.map(edge => [edge.physicalExitId, edge]));
    const referencesValid = document.edges.every(edge => nodeIds.has(edge.sourceNodeId) &&
      (edge.targetNodeId === 'campaign.complete' || nodeIds.has(edge.targetNodeId))) &&
      document.stages.every(stage => {
        const node = document.nodes.find(candidate => candidate.id === stage.nodeId);
        return Boolean(node && node.stageId === stage.stageId && stage.markers.every(marker => {
          if (marker.edgeId && !edgeIds.has(marker.edgeId)) return false;
          if (!marker.physicalExitId) return true;
          const edge = edgeByPhysicalExit.get(marker.physicalExitId);
          return Boolean(edge && edge.id === marker.edgeId && edge.sourceNodeId === stage.nodeId &&
            stage.physicalExitIds.includes(marker.physicalExitId));
        }));
      }) && document.diagnostics.every(item =>
        (!item.nodeId || nodeIds.has(item.nodeId)) && (!item.edgeId || edgeIds.has(item.edgeId)));
    if (!referencesValid) {
      return failure('invalid-reference', [diagnostic(
        'world-lab.snapshot.invalid-reference', 'Snapshot contains an unknown node or edge reference.',
        ['document'],
      )]);
    }

    return Object.freeze({
      ok: true as const,
      value: Object.freeze({
        schema: WORLD_LAB_SNAPSHOT_SCHEMA,
        document: canonicalWorldLabDocument(document),
      }),
    });
  }
}

