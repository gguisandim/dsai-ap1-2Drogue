import type {
  CampaignExitBindingResult,
  CampaignGraph,
  CampaignNode,
  LoadedStage,
  PhysicalExitResult,
} from '../../stages';
import type {
  WorldLabDiagnostic,
  WorldLabDocument,
  WorldLabGraphEdgeView,
  WorldLabGraphNodeView,
  WorldLabStageMarker,
  WorldLabStageView,
} from './contracts';
import { fixturePresentation } from './fixtures/fixtureCatalog';

export interface WorldLabStageProjectionInput {
  readonly node: CampaignNode;
  readonly displayStage: LoadedStage;
  readonly physicalExitResult?: PhysicalExitResult;
  readonly bindingResult?: CampaignExitBindingResult;
}

export interface WorldLabProjectionInput {
  readonly seed: string;
  readonly graph: CampaignGraph;
  readonly stages: readonly WorldLabStageProjectionInput[];
  readonly diagnostics: readonly WorldLabDiagnostic[];
}

function compare(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function markerKey(marker: WorldLabStageMarker): string {
  return `${marker.kind}|${marker.id}|${marker.y}|${marker.x}`;
}

function freezeMarker(marker: WorldLabStageMarker): WorldLabStageMarker {
  return Object.freeze({ ...marker });
}

function tileMarkers(stage: LoadedStage): WorldLabStageMarker[] {
  const markers: WorldLabStageMarker[] = [];
  stage.level.tileMap.forEach((row, y) => row.forEach((tile, x) => {
    if (tile === 8) markers.push({
      id: `${stage.manifest.id}.spawn.${x}.${y}`,
      kind: 'spawn', x, y, label: 'Player spawn',
    });
    if (tile === 9) markers.push({
      id: `${stage.manifest.id}.boss.${x}.${y}`,
      kind: 'boss', x, y, label: stage.level.bossId ?? 'Boss spawn',
    });
  }));
  return markers;
}

function entityMarkers(stage: LoadedStage): WorldLabStageMarker[] {
  const markers: WorldLabStageMarker[] = [];
  const addEnemy = (enemy: LoadedStage['level']['enemies'][number], group: string): void => {
    markers.push({
      id: `${stage.manifest.id}.${group}.${enemy.type}.${enemy.x}.${enemy.y}`,
      kind: 'enemy', x: enemy.x, y: enemy.y, label: enemy.type,
    });
  };
  stage.level.enemies.forEach(enemy => addEnemy(enemy, 'enemy'));
  stage.level.ambush?.forEach(enemy => addEnemy(enemy, 'ambush'));
  stage.level.waves?.forEach(wave => wave.enemies.forEach(enemy =>
    addEnemy(enemy, `wave-${wave.delay}`)));
  stage.level.items.forEach(item => markers.push({
    id: `${stage.manifest.id}.item.${item.type}.${item.x}.${item.y}`,
    kind: 'item', x: item.x, y: item.y, label: item.type,
  }));
  stage.level.decorations.forEach((decoration, index) => markers.push({
    id: `${stage.manifest.id}.decoration.${decoration.type}.${index}`,
    kind: 'decoration', x: decoration.x, y: decoration.y, label: decoration.type,
  }));
  stage.npcs.forEach(npc => {
    if (npc.spawn.kind !== 'tile') return;
    markers.push({
      id: npc.id,
      kind: 'npc', x: npc.spawn.x, y: npc.spawn.y, label: npc.displayName,
    });
  });
  return markers;
}

function exitMarkers(
  stage: LoadedStage,
  physicalExitResult?: PhysicalExitResult,
): WorldLabStageMarker[] {
  const markers: WorldLabStageMarker[] = [];
  stage.manifest.exits.forEach(exit => {
    if (exit.anchor.kind !== 'tile') return;
    markers.push({
      id: exit.id,
      kind: 'anchor', x: exit.anchor.x, y: exit.anchor.y, label: exit.id,
    });
  });
  stage.level.exits?.forEach(exit => markers.push({
    id: `${stage.manifest.id}.section.${exit.x}.${exit.y}.to-${exit.to}`,
    kind: 'section-exit', x: exit.x, y: exit.y, label: `Section ${exit.to}`,
  }));
  if (physicalExitResult?.ok) {
    physicalExitResult.value.exits.forEach(exit => markers.push({
      id: exit.id,
      kind: 'physical-exit',
      x: exit.tile.x,
      y: exit.tile.y,
      label: exit.stageExitId,
      edgeId: exit.edgeId,
      physicalExitId: exit.id,
    }));
  }
  return markers;
}

function projectStage(input: WorldLabStageProjectionInput): WorldLabStageView {
  const stage = input.displayStage;
  const markers = [
    ...tileMarkers(stage),
    ...entityMarkers(stage),
    ...exitMarkers(stage, input.physicalExitResult),
  ].sort((left, right) => compare(markerKey(left), markerKey(right)));
  const physicalExitIds = input.physicalExitResult?.ok
    ? input.physicalExitResult.value.exits.map(exit => exit.id).sort(compare)
    : [];
  const presentation = stage.presentation;
  const textureKeys = presentation
    ? [...new Set([
        ...Object.values(presentation.tiles).flatMap(tile => [
          tile.textureKey, ...tile.variants.map(variant => variant.textureKey),
        ]),
        ...Object.values(presentation.decorations).map(decoration => decoration.textureKey),
      ])].sort(compare)
    : [];
  return Object.freeze({
    nodeId: input.node.id,
    stageId: stage.manifest.id,
    title: stage.manifest.title,
    theme: stage.level.theme,
    width: stage.level.tileMap[0]?.length ?? 0,
    height: stage.level.tileMap.length,
    tiles: Object.freeze(stage.level.tileMap.map(row => Object.freeze([...row]))),
    markers: Object.freeze(markers.map(freezeMarker)),
    physicalExitIds: Object.freeze(physicalExitIds),
    ...(presentation ? { visualPresentation: Object.freeze({
      themeId: presentation.themeId,
      tilesetId: presentation.tilesetId,
      textureKeys: Object.freeze(textureKeys),
      decorationIds: Object.freeze(Object.keys(presentation.decorations).sort(compare)),
      missingResourceIds: Object.freeze([]),
      diagnostics: Object.freeze(stage.diagnostics
        .filter(item => item.code.startsWith('stage.visual.')).map(item => item.code).sort(compare)),
      npcSprites: Object.freeze(Object.entries(presentation.npcSprites).map(([logicalId, sprite]) => Object.freeze({
        logicalId, spriteId: sprite.id, textureKey: sprite.textureKey,
        animations: Object.freeze(Object.values(sprite.animations).sort(compare)),
      })).sort((left, right) => compare(left.logicalId, right.logicalId))),
      enemySprites: Object.freeze(Object.entries(presentation.enemySprites).map(([logicalId, sprite]) => Object.freeze({
        logicalId, spriteId: sprite.id, textureKey: sprite.textureKey,
        animations: Object.freeze(Object.values(sprite.animations).sort(compare)),
      })).sort((left, right) => compare(left.logicalId, right.logicalId))),
      ...(presentation.audio ? { audio: Object.freeze({
        profileId: presentation.audio.id,
        ...(presentation.audio.music ? { musicSoundId: presentation.audio.music.id } : {}),
        ...(presentation.audio.ambient ? { ambientSoundId: presentation.audio.ambient.id } : {}),
        eventSoundIds: Object.freeze(Object.fromEntries(Object.entries(presentation.audio.eventSounds)
          .map(([event, sound]) => [event, sound.id]))),
      }) } : {}),
      ...(presentation.environment ? { environment: Object.freeze({
        id: presentation.environment.id,
        ambientColor: presentation.environment.ambientColor,
        lightIntensity: presentation.environment.lightIntensity,
        ...(presentation.environment.fog ? { fog: Object.freeze({ ...presentation.environment.fog }) } : {}),
      }) } : {}),
    }) } : {}),
  });
}

function projectNodes(graph: CampaignGraph): readonly WorldLabGraphNodeView[] {
  return Object.freeze([...graph.nodes]
    .sort((left, right) => left.depth - right.depth ||
      compare(left.branchId, right.branchId) || compare(left.id, right.id))
    .map(node => {
      const presentation = fixturePresentation(node.templateId);
      return Object.freeze({
        id: node.id,
        stageId: node.stageId,
        templateId: node.templateId,
        actId: node.actId,
        depth: node.depth,
        branchId: node.branchId,
        kind: node.kind,
        biomeId: node.biomeId,
        difficulty: node.difficulty,
        maximumPhysicalExits: node.maximumPhysicalExits,
        incomingCount: graph.edges.filter(edge => edge.targetNodeId === node.id).length,
        outgoingCount: graph.edges.filter(edge => edge.sourceNodeId === node.id).length,
        entry: graph.entryNodeId === node.id,
        ...(presentation ? { presentation: Object.freeze({ ...presentation }) } : {}),
      });
    }));
}

function projectEdges(
  graph: CampaignGraph,
  stages: readonly WorldLabStageProjectionInput[],
): readonly WorldLabGraphEdgeView[] {
  const bindings = new Map<string, {
    readonly stageExitId: string;
    readonly association: 'manifest-exit' | 'synthetic-slot';
    readonly tile: { readonly x: number; readonly y: number };
  }>();
  const failedSources = new Set<string>();
  stages.forEach(stage => {
    if (!stage.bindingResult) return;
    if (!stage.bindingResult.ok) {
      failedSources.add(stage.node.id);
      return;
    }
    stage.bindingResult.value.bindings.forEach(binding => bindings.set(binding.edgeId, {
      stageExitId: binding.stageExitId,
      association: binding.association,
      tile: Object.freeze({ ...binding.physicalExit.tile }),
    }));
  });
  return Object.freeze([...graph.edges]
    .sort((left, right) => compare(left.id, right.id))
    .map(edge => {
      const binding = bindings.get(edge.id);
      return Object.freeze({
        id: edge.id,
        sourceNodeId: edge.sourceNodeId,
        targetNodeId: edge.targetNodeId,
        kind: edge.kind,
        exitSlotId: edge.exitSlotId,
        physicalExitId: edge.physicalExitId,
        bindingStatus: binding ? 'bound' as const
          : failedSources.has(edge.sourceNodeId) ? 'failed' as const : 'unavailable' as const,
        ...(binding ? {
          stageExitId: binding.stageExitId,
          association: binding.association,
          tile: binding.tile,
        } : {}),
      });
    }));
}

function freezeDiagnostic(diagnostic: WorldLabDiagnostic): WorldLabDiagnostic {
  return Object.freeze({
    ...diagnostic,
    ...(diagnostic.path ? { path: Object.freeze([...diagnostic.path]) } : {}),
  });
}

export class WorldLabProjector {
  public project(input: WorldLabProjectionInput): WorldLabDocument {
    const diagnostics = [...input.diagnostics].sort((left, right) =>
      compare(left.origin, right.origin) || compare(left.code, right.code) ||
      compare(left.nodeId ?? '', right.nodeId ?? '') || compare(left.edgeId ?? '', right.edgeId ?? ''));
    return Object.freeze({
      seed: input.seed,
      source: 'fixture-real-headless-pipeline' as const,
      graphId: input.graph.id,
      nodes: projectNodes(input.graph),
      edges: projectEdges(input.graph, input.stages),
      stages: Object.freeze([...input.stages]
        .sort((left, right) => compare(left.node.id, right.node.id))
        .map(projectStage)),
      diagnostics: Object.freeze(diagnostics.map(freezeDiagnostic)),
    });
  }
}
