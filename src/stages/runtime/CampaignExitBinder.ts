import type {
  CampaignEdge,
  CampaignExitAssociation,
  CampaignExitBinding,
  CampaignExitBindingDiagnostic,
  CampaignExitBindingDiagnosticCode,
  CampaignExitBindingFailure,
  CampaignExitBindingFailureCode,
  CampaignExitBindingRequest,
  CampaignExitBindingResult,
  CampaignNode,
  PhysicalExit,
  StageExitDefinition,
} from '../contracts';

type Path = readonly (string | number)[];

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value === value.trim();
}

function compareStrings(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function pathKey(path: Path): string {
  return path.map(part => String(part)).join('.');
}

function pointKey(exit: PhysicalExit): string {
  return `${exit.tile.x},${exit.tile.y}`;
}

function pushDiagnostic(
  diagnostics: CampaignExitBindingDiagnostic[],
  code: CampaignExitBindingDiagnosticCode,
  message: string,
  path: Path,
  stageId?: string,
  referenceId?: string,
): void {
  diagnostics.push(Object.freeze({
    code,
    severity: 'error' as const,
    message,
    path: Object.freeze([...path]),
    ...(stageId ? { stageId } : {}),
    ...(referenceId ? { referenceId } : {}),
  }));
}

function canonicalDiagnostics(
  diagnostics: readonly CampaignExitBindingDiagnostic[],
): readonly CampaignExitBindingDiagnostic[] {
  return Object.freeze([...diagnostics].sort((left, right) =>
    compareStrings(left.code, right.code) ||
    compareStrings(pathKey(left.path), pathKey(right.path)) ||
    compareStrings(left.referenceId ?? '', right.referenceId ?? '') ||
    compareStrings(left.message, right.message)));
}

function cloneEdge(edge: CampaignEdge): CampaignEdge {
  return Object.freeze({ ...edge });
}

function cloneManifestExit(exit: StageExitDefinition): StageExitDefinition {
  return Object.freeze({ ...exit, anchor: Object.freeze({ ...exit.anchor }) });
}

function clonePhysicalExit(exit: PhysicalExit): PhysicalExit {
  return Object.freeze({ ...exit, tile: Object.freeze({ ...exit.tile }) });
}

function failureCode(
  diagnostics: readonly CampaignExitBindingDiagnostic[],
): CampaignExitBindingFailureCode {
  const codes = new Set(diagnostics.map(diagnostic => diagnostic.code));
  if (codes.has('campaign-exit.request-invalid')) return 'invalid-request';
  if (codes.has('campaign-exit.physical-resolution-failed')) return 'physical-resolution-failed';
  if (codes.has('campaign-exit.destination-mismatch')) return 'destination-mismatch';
  if ([...codes].some(code => code.startsWith('campaign-exit.manifest-'))) {
    return 'manifest-exit-mismatch';
  }
  if ([...codes].some(code =>
    code === 'campaign-exit.source-node-invalid' ||
    code === 'campaign-exit.source-stage-mismatch' ||
    code === 'campaign-exit.edge-duplicate' ||
    code === 'campaign-exit.edge-reference-invalid' ||
    code === 'campaign-exit.destination-invalid')) {
    return 'graph-reference-invalid';
  }
  return 'physical-exit-mismatch';
}

/**
 * Canonically binds outgoing campaign edges to already-resolved physical exits.
 * It validates identity only; placement and topology remain owned by their
 * existing components.
 */
export class CampaignExitBinder {
  public bind(request: CampaignExitBindingRequest): CampaignExitBindingResult {
    try {
      return this.bindValidated(request);
    } catch (error) {
      const diagnostics: CampaignExitBindingDiagnostic[] = [];
      pushDiagnostic(
        diagnostics,
        'campaign-exit.request-invalid',
        `Campaign exit binding failed unexpectedly: ${error instanceof Error ? error.message : 'unknown error'}.`,
        ['request'],
      );
      return this.failure('invalid-request', diagnostics);
    }
  }

  private bindValidated(request: CampaignExitBindingRequest): CampaignExitBindingResult {
    const diagnostics: CampaignExitBindingDiagnostic[] = [];
    if (!isRecord(request) || !isRecord(request.graph) ||
      !isNonEmptyString(request.sourceNodeId) || !isRecord(request.stage) ||
      !isRecord(request.stage.manifest) || !Array.isArray(request.stage.manifest.exits) ||
      !isRecord(request.physicalExitResult) ||
      typeof request.physicalExitResult.ok !== 'boolean') {
      pushDiagnostic(
        diagnostics,
        'campaign-exit.request-invalid',
        'Binding request must contain graph, sourceNodeId, LoadedStage and PhysicalExitResult.',
        ['request'],
      );
      return this.failure('invalid-request', diagnostics);
    }

    if (!request.physicalExitResult.ok) {
      pushDiagnostic(
        diagnostics,
        'campaign-exit.physical-resolution-failed',
        `Physical exit resolution failed with ${request.physicalExitResult.error.code}.`,
        ['physicalExitResult'],
        request.stage.manifest.id,
      );
      return this.failure(
        'physical-resolution-failed',
        diagnostics,
        request.physicalExitResult.error,
      );
    }

    if (!Array.isArray(request.graph.nodes) || !Array.isArray(request.graph.edges)) {
      pushDiagnostic(
        diagnostics,
        'campaign-exit.request-invalid',
        'Campaign graph must expose node and edge arrays.',
        ['graph'],
        request.stage.manifest.id,
      );
      return this.failure('invalid-request', diagnostics);
    }

    const stageId = request.stage.manifest.id;
    const sourceMatches = request.graph.nodes.filter(node => node.id === request.sourceNodeId);
    if (sourceMatches.length !== 1) {
      pushDiagnostic(
        diagnostics,
        'campaign-exit.source-node-invalid',
        `Expected exactly one source node ${request.sourceNodeId}; found ${sourceMatches.length}.`,
        ['graph', 'nodes'],
        stageId,
        request.sourceNodeId,
      );
    }
    const sourceNode = sourceMatches[0];
    if (sourceNode && sourceNode.stageId !== stageId) {
      pushDiagnostic(
        diagnostics,
        'campaign-exit.source-stage-mismatch',
        `Source node stage ${sourceNode.stageId} does not match loaded stage ${stageId}.`,
        ['stage', 'manifest', 'id'],
        stageId,
        sourceNode.id,
      );
    }

    const resolution = request.physicalExitResult.value;
    if (resolution.nodeId !== request.sourceNodeId || resolution.stageId !== stageId ||
      !isNonEmptyString(resolution.levelDigest) || !Array.isArray(resolution.exits)) {
      pushDiagnostic(
        diagnostics,
        'campaign-exit.physical-exit-incompatible',
        'Physical exit resolution identity does not match the source node and loaded stage.',
        ['physicalExitResult', 'value'],
        stageId,
        request.sourceNodeId,
      );
      return this.failure('physical-exit-mismatch', diagnostics);
    }

    const outgoing = request.graph.edges
      .filter(edge => edge.sourceNodeId === request.sourceNodeId)
      .sort((left, right) => compareStrings(left.id, right.id));
    this.validateEdges(outgoing, request.graph.nodes, diagnostics, stageId);

    const manifestExits = [...request.stage.manifest.exits]
      .sort((left, right) => compareStrings(left.id, right.id));
    const manifestById = this.validateManifestExits(manifestExits, diagnostics, stageId);

    const physicalExits = [...resolution.exits]
      .sort((left, right) => compareStrings(left.edgeId, right.edgeId) || compareStrings(left.id, right.id));
    this.validatePhysicalSet(physicalExits, outgoing, diagnostics, stageId);

    const bindings: CampaignExitBinding[] = [];
    const usedManifestIds = new Set<string>();
    for (const edge of outgoing) {
      const matchingPhysical = physicalExits.filter(exit => exit.edgeId === edge.id);
      if (matchingPhysical.length !== 1) {
        if (matchingPhysical.length === 0) {
          pushDiagnostic(
            diagnostics,
            'campaign-exit.physical-exit-missing',
            `No physical exit was resolved for edge ${edge.id}.`,
            ['physicalExitResult', 'value', 'exits'],
            stageId,
            edge.id,
          );
        }
        continue;
      }

      const physical = matchingPhysical[0];
      const target = this.targetFor(edge, request.graph.nodes, diagnostics, stageId);
      let edgeValid = target !== undefined;
      if (physical.id !== edge.physicalExitId ||
        physical.sourceNodeId !== edge.sourceNodeId ||
        physical.targetNodeId !== edge.targetNodeId) {
        pushDiagnostic(
          diagnostics,
          'campaign-exit.physical-exit-incompatible',
          `Physical exit identity is incompatible with edge ${edge.id}.`,
          ['physicalExitResult', 'value', 'exits', physical.edgeId],
          stageId,
          edge.id,
        );
        edgeValid = false;
      }

      const manifestExit = manifestById.get(physical.stageExitId);
      let association: CampaignExitAssociation | undefined;
      if (manifestExit) {
        association = 'manifest-exit';
        if (usedManifestIds.has(manifestExit.id)) {
          pushDiagnostic(
            diagnostics,
            'campaign-exit.manifest-exit-reused',
            `Manifest exit ${manifestExit.id} is bound more than once.`,
            ['stage', 'manifest', 'exits', manifestExit.id],
            stageId,
            manifestExit.id,
          );
          edgeValid = false;
        }
        usedManifestIds.add(manifestExit.id);
        if (target && manifestExit.targetStageId !== target.stageId) {
          pushDiagnostic(
            diagnostics,
            'campaign-exit.destination-mismatch',
            `Manifest exit ${manifestExit.id} targets ${manifestExit.targetStageId}, expected ${target.stageId}.`,
            ['stage', 'manifest', 'exits', manifestExit.id, 'targetStageId'],
            stageId,
            edge.id,
          );
          edgeValid = false;
        }
        if (manifestExit.anchor.kind === 'tile' &&
          (manifestExit.anchor.x !== physical.tile.x || manifestExit.anchor.y !== physical.tile.y)) {
          pushDiagnostic(
            diagnostics,
            'campaign-exit.manifest-anchor-mismatch',
            `Physical exit ${physical.id} does not preserve tile anchor ${manifestExit.id}.`,
            ['physicalExitResult', 'value', 'exits', physical.edgeId, 'tile'],
            stageId,
            manifestExit.id,
          );
          edgeValid = false;
        }
      } else if (physical.stageExitId === edge.exitSlotId) {
        association = 'synthetic-slot';
      } else {
        pushDiagnostic(
          diagnostics,
          'campaign-exit.manifest-exit-missing',
          `Stage exit ${physical.stageExitId} is not declared and does not match slot ${edge.exitSlotId}.`,
          ['physicalExitResult', 'value', 'exits', physical.edgeId, 'stageExitId'],
          stageId,
          edge.id,
        );
        edgeValid = false;
      }

      if (!edgeValid || !target || !association) continue;
      bindings.push(Object.freeze({
        edgeId: edge.id,
        sourceNodeId: edge.sourceNodeId,
        targetNodeId: edge.targetNodeId,
        targetStageId: target.stageId,
        exitSlotId: edge.exitSlotId,
        stageExitId: physical.stageExitId,
        physicalExitId: physical.id,
        association,
        edge: cloneEdge(edge),
        ...(manifestExit ? { manifestExit: cloneManifestExit(manifestExit) } : {}),
        physicalExit: clonePhysicalExit(physical),
      }));
    }

    if (bindings.length !== outgoing.length) {
      pushDiagnostic(
        diagnostics,
        'campaign-exit.binding-cardinality',
        `Resolved ${bindings.length} bindings for ${outgoing.length} outgoing edges.`,
        ['bindings'],
        stageId,
        request.sourceNodeId,
      );
    }

    if (diagnostics.length > 0) return this.failure(failureCode(diagnostics), diagnostics);
    return Object.freeze({
      ok: true as const,
      value: Object.freeze({
        sourceNodeId: request.sourceNodeId,
        stageId,
        levelDigest: resolution.levelDigest,
        bindings: Object.freeze(bindings.sort((left, right) => compareStrings(left.edgeId, right.edgeId))),
      }),
    });
  }

  private validateEdges(
    edges: readonly CampaignEdge[],
    nodes: readonly CampaignNode[],
    diagnostics: CampaignExitBindingDiagnostic[],
    stageId: string,
  ): void {
    const ids = new Set<string>();
    const exitSlotIds = new Set<string>();
    const physicalExitIds = new Set<string>();
    for (const edge of edges) {
      if (!isNonEmptyString(edge.id) || !isNonEmptyString(edge.exitSlotId) ||
        !isNonEmptyString(edge.physicalExitId)) {
        pushDiagnostic(diagnostics, 'campaign-exit.edge-reference-invalid',
          'Outgoing edge identifiers must be non-empty.', ['graph', 'edges'], stageId);
      }
      if (ids.has(edge.id) || exitSlotIds.has(edge.exitSlotId) ||
        physicalExitIds.has(edge.physicalExitId)) {
        pushDiagnostic(diagnostics, 'campaign-exit.edge-duplicate',
          `Outgoing edge ${edge.id} reuses an edge, slot or physical exit identifier.`,
          ['graph', 'edges'], stageId, edge.id);
      }
      ids.add(edge.id);
      exitSlotIds.add(edge.exitSlotId);
      physicalExitIds.add(edge.physicalExitId);
      if (edge.targetNodeId !== 'campaign.complete' &&
        nodes.filter(node => node.id === edge.targetNodeId).length !== 1) {
        pushDiagnostic(diagnostics, 'campaign-exit.destination-invalid',
          `Edge ${edge.id} must reference exactly one destination node.`,
          ['graph', 'edges', edge.id, 'targetNodeId'], stageId, edge.targetNodeId);
      }
    }
  }

  private validateManifestExits(
    exits: readonly StageExitDefinition[],
    diagnostics: CampaignExitBindingDiagnostic[],
    stageId: string,
  ): ReadonlyMap<string, StageExitDefinition> {
    const result = new Map<string, StageExitDefinition>();
    for (const exit of exits) {
      if (result.has(exit.id)) {
        pushDiagnostic(diagnostics, 'campaign-exit.manifest-exit-duplicate',
          `Duplicate manifest exit id: ${exit.id}.`,
          ['stage', 'manifest', 'exits'], stageId, exit.id);
      } else {
        result.set(exit.id, exit);
      }
    }
    return result;
  }

  private validatePhysicalSet(
    exits: readonly PhysicalExit[],
    edges: readonly CampaignEdge[],
    diagnostics: CampaignExitBindingDiagnostic[],
    stageId: string,
  ): void {
    const expectedEdges = new Set(edges.map(edge => edge.id));
    const ids = new Set<string>();
    const edgeIds = new Set<string>();
    const stageExitIds = new Set<string>();
    const tiles = new Set<string>();
    for (const exit of exits) {
      if (!expectedEdges.has(exit.edgeId)) {
        pushDiagnostic(diagnostics, 'campaign-exit.physical-exit-unexpected',
          `Physical exit ${exit.id} references non-outgoing edge ${exit.edgeId}.`,
          ['physicalExitResult', 'value', 'exits'], stageId, exit.edgeId);
      }
      if (ids.has(exit.id) || edgeIds.has(exit.edgeId) || stageExitIds.has(exit.stageExitId)) {
        pushDiagnostic(diagnostics, 'campaign-exit.physical-exit-duplicate',
          `Physical exit identity is reused by ${exit.id}.`,
          ['physicalExitResult', 'value', 'exits'], stageId, exit.id);
      }
      ids.add(exit.id);
      edgeIds.add(exit.edgeId);
      stageExitIds.add(exit.stageExitId);
      const tile = pointKey(exit);
      if (tiles.has(tile)) {
        pushDiagnostic(diagnostics, 'campaign-exit.physical-tile-duplicate',
          `Physical tile ${tile} is reused.`,
          ['physicalExitResult', 'value', 'exits'], stageId, tile);
      }
      tiles.add(tile);
    }
  }

  private targetFor(
    edge: CampaignEdge,
    nodes: readonly CampaignNode[],
    diagnostics: CampaignExitBindingDiagnostic[],
    stageId: string,
  ): { readonly stageId: string } | undefined {
    if (edge.targetNodeId === 'campaign.complete') return { stageId: 'campaign.complete' };
    const targets = nodes.filter(node => node.id === edge.targetNodeId);
    if (targets.length === 1) return { stageId: targets[0].stageId };
    pushDiagnostic(diagnostics, 'campaign-exit.destination-invalid',
      `Edge ${edge.id} destination ${edge.targetNodeId} is not uniquely defined.`,
      ['graph', 'nodes'], stageId, edge.targetNodeId);
    return undefined;
  }

  private failure(
    code: CampaignExitBindingFailureCode,
    diagnostics: readonly CampaignExitBindingDiagnostic[],
    physicalExitFailure?: CampaignExitBindingFailure['physicalExitFailure'],
  ): CampaignExitBindingResult {
    return Object.freeze({
      ok: false as const,
      error: Object.freeze({
        code,
        diagnostics: canonicalDiagnostics(diagnostics),
        ...(physicalExitFailure ? { physicalExitFailure } : {}),
      }),
    });
  }
}
