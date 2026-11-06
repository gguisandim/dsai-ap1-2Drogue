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
  WorldLabAssetOrigin,
  WorldLabStageMarker,
  WorldLabStageValidation,
  WorldLabStageView,
  WorldLabArtAssetPresentation,
} from './contracts';
import { fixturePresentation } from './fixtures/fixtureCatalog';
import { PUNY_ASSET_ORIGINS, punyTextureByKey } from '../../presentation/assets/punyAssetCatalog';
import {
  WORLD_ROOT_ASSET_ORIGIN,
  worldRootTextureByKey,
} from '../../presentation/assets/worldRootAssetCatalog';

export interface WorldLabStageProjectionInput {
  readonly node: CampaignNode;
  readonly displayStage: LoadedStage;
  readonly physicalExitResult?: PhysicalExitResult;
  readonly bindingResult?: CampaignExitBindingResult;
  readonly validation?: WorldLabStageValidation;
}

export interface WorldLabProjectionInput {
  readonly seed: string;
  readonly graph: CampaignGraph;
  readonly stages: readonly WorldLabStageProjectionInput[];
  readonly diagnostics: readonly WorldLabDiagnostic[];
  readonly topologyPolicyId?: string;
  readonly currentNodeId?: string;
  readonly stageInstanceIdsByNodeId?: Readonly<Record<string, string>>;
  readonly revisitCounts?: Readonly<Record<string, number>>;
  readonly edgeTraversalCounts?: Readonly<Record<string, number>>;
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

type ArtSource = {
  readonly textureKey: string;
  readonly frame?: number;
  readonly frameWidth?: number;
  readonly frameHeight?: number;
  readonly sourceWidth?: number;
  readonly sourceHeight?: number;
  readonly visibleBounds?: { readonly width: number; readonly height: number };
  readonly perspective?: string;
  readonly originId?: string;
  readonly collision?: { readonly width: number; readonly height: number; readonly offsetX: number; readonly offsetY: number };
};

function artAsset(
  id: string,
  category: WorldLabArtAssetPresentation['category'],
  source: ArtSource,
  scale: number,
  layer: string,
  options: {
    readonly anchor?: { readonly x: number; readonly y: number };
    readonly scaleClass?: WorldLabArtAssetPresentation['scaleClass'];
    readonly renderedTile?: boolean;
  } = {},
): WorldLabArtAssetPresentation {
  const visibleWidth = source.visibleBounds?.width ?? source.frameWidth;
  const visibleHeight = source.visibleBounds?.height ?? source.frameHeight;
  const renderedWidth = options.renderedTile ? 32 : visibleWidth === undefined ? undefined : visibleWidth * scale;
  const renderedHeight = options.renderedTile ? 32 : visibleHeight === undefined ? undefined : visibleHeight * scale;
  const warnings: string[] = [];
  if (source.perspective && !['top-down', 'neutral'].includes(source.perspective)) {
    warnings.push(`perspective:${source.perspective}`);
  }
  if (options.scaleClass === 'character' && renderedHeight !== undefined &&
    (renderedHeight < 24 || renderedHeight > 96)) warnings.push('character-proportion-review');
  if (source.frameWidth === undefined || source.frameHeight === undefined) warnings.push('frame-dimensions-unavailable');
  const compatibility = warnings.some(warning => warning !== 'frame-dimensions-unavailable')
    ? 'review' as const
    : warnings.length > 0 ? 'incomplete' as const : 'compatible' as const;
  return Object.freeze({
    id, category, textureKey: source.textureKey,
    ...(source.frame !== undefined ? { frame: source.frame } : {}),
    ...(source.sourceWidth !== undefined && source.sourceHeight !== undefined
      ? { sourceDimensions: Object.freeze({ width: source.sourceWidth, height: source.sourceHeight }) } : {}),
    ...(source.frameWidth !== undefined && source.frameHeight !== undefined
      ? { frameDimensions: Object.freeze({ width: source.frameWidth, height: source.frameHeight }) } : {}),
    ...(visibleWidth !== undefined && visibleHeight !== undefined
      ? { visibleDimensions: Object.freeze({ width: visibleWidth, height: visibleHeight }) } : {}),
    ...(renderedWidth !== undefined && renderedHeight !== undefined
      ? { renderedDimensions: Object.freeze({ width: renderedWidth, height: renderedHeight }) } : {}),
    scale,
    ...(options.anchor ? { anchor: Object.freeze({ ...options.anchor }) } : {}),
    ...(options.scaleClass ? { scaleClass: options.scaleClass } : {}),
    layer,
    ...(source.originId ? { originId: source.originId } : {}),
    ...(source.perspective ? { perspective: source.perspective } : {}),
    ...(source.collision ? { collision: Object.freeze({ ...source.collision }) } : {}),
    compatibility,
    warnings: Object.freeze(warnings),
  });
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
  const addEnemy = (enemy: { readonly type: string; readonly x: number; readonly y: number }, group: string): void => {
    markers.push({
      id: `${stage.manifest.id}.${group}.${enemy.type}.${enemy.x}.${enemy.y}`,
      kind: 'enemy', x: enemy.x, y: enemy.y, label: enemy.type,
    });
  };
  stage.level.enemies.forEach(enemy => addEnemy(enemy, 'enemy'));
  stage.level.ambush?.forEach(enemy => addEnemy(enemy, 'ambush'));
  const waves = stage.encounter?.waves ?? stage.level.waves;
  waves?.forEach((wave, index) => wave.enemies.forEach(enemy =>
    addEnemy(enemy, `wave-${'id' in wave ? wave.id : `${index}-${wave.delay}`}`)));
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
        ...Object.values(presentation.npcSprites).map(sprite => sprite.textureKey),
        ...Object.values(presentation.enemySprites).map(sprite => sprite.textureKey),
      ])].sort(compare)
    : [];
  const tilePresentations = presentation
    ? Object.entries(presentation.tiles)
      .map(([logicalId, tile]) => Object.freeze({
        logicalId,
        textureId: tile.textureId,
        textureKey: tile.textureKey,
        ...(tile.frame !== undefined ? { frame: tile.frame } : {}),
        ...(tile.tint !== undefined ? { tint: tile.tint } : {}),
        ...(tile.alpha !== undefined ? { alpha: tile.alpha } : {}),
        variants: Object.freeze(tile.variants.map(variant => Object.freeze({
          textureId: variant.textureId,
          textureKey: variant.textureKey,
          ...(variant.frame !== undefined ? { frame: variant.frame } : {}),
          ...(variant.tint !== undefined ? { tint: variant.tint } : {}),
          ...(variant.alpha !== undefined ? { alpha: variant.alpha } : {}),
        }))),
      }))
      .sort((left, right) => compare(left.logicalId, right.logicalId))
    : [];
  const allTexturePresentations = presentation
    ? [
        ...Object.values(presentation.tiles).flatMap(tile => [tile, ...tile.variants]),
        ...Object.values(presentation.decorations),
        ...Object.values(presentation.npcSprites),
        ...Object.values(presentation.enemySprites),
      ]
    : [];
  const spritesheets = presentation
    ? [...new Map(
      allTexturePresentations
        .filter(tile => tile.frameWidth !== undefined || tile.frameHeight !== undefined ||
          tile.frameCount !== undefined)
        .map(tile => [tile.textureKey, Object.freeze({
          textureKey: tile.textureKey,
          ...(tile.frameWidth !== undefined ? { frameWidth: tile.frameWidth } : {}),
          ...(tile.frameHeight !== undefined ? { frameHeight: tile.frameHeight } : {}),
          ...(tile.frameCount !== undefined ? { frameCount: tile.frameCount } : {}),
        })]),
    ).values()].sort((left, right) => compare(left.textureKey, right.textureKey))
    : [];
  const assetOriginEntries: Array<readonly [string, WorldLabAssetOrigin]> = [];
  if (presentation) allTexturePresentations.forEach(tile => {
    const puny = punyTextureByKey(tile.textureKey);
    if (puny) {
      const origin = PUNY_ASSET_ORIGINS[puny.originId];
      assetOriginEntries.push([puny.textureKey, Object.freeze({
        assetId: puny.id, textureKey: puny.textureKey, pack: origin.pack, author: origin.author,
        license: origin.license, sourceUrl: origin.sourceUrl,
        modifications: Object.freeze([...puny.modifications]),
      })]);
      return;
    }
    const original = worldRootTextureByKey(tile.textureKey);
    if (original) assetOriginEntries.push([original.textureKey, Object.freeze({
      assetId: original.id,
      textureKey: original.textureKey,
      pack: WORLD_ROOT_ASSET_ORIGIN.pack,
      author: WORLD_ROOT_ASSET_ORIGIN.author,
      license: WORLD_ROOT_ASSET_ORIGIN.license,
      sourceUrl: WORLD_ROOT_ASSET_ORIGIN.sourceUrl,
      modifications: Object.freeze([...original.modifications]),
    })]);
  });
  const assetOrigins = [...new Map(assetOriginEntries).values()]
    .sort((left, right) => compare(left.assetId, right.assetId));
  const decorationPresentations = presentation
    ? Object.values(presentation.decorations)
      .map(decoration => Object.freeze({
        id: decoration.id,
        textureKey: decoration.textureKey,
        ...(decoration.frame !== undefined ? { frame: decoration.frame } : {}),
        layer: decoration.layer,
        depth: decoration.depth,
        scale: decoration.defaultScale,
      }))
      .sort((left, right) => compare(left.id, right.id))
    : [];
  const artAssets = presentation
    ? [
        ...Object.entries(presentation.tiles).map(([logicalId, tile]) => artAsset(
          logicalId, 'tile', tile, 2, 'terrain', { scaleClass: 'tile', renderedTile: true },
        )),
        ...Object.values(presentation.decorations).map(decoration => artAsset(
          decoration.id, 'decoration', decoration, decoration.defaultScale, decoration.layer,
          { anchor: decoration.anchor, scaleClass: decoration.scaleClass },
        )),
        ...Object.entries(presentation.npcSprites).map(([logicalId, sprite]) => artAsset(
          logicalId, 'npc', sprite, sprite.scale, `depth:${sprite.depth}`,
          { anchor: sprite.anchor, scaleClass: sprite.scaleClass },
        )),
        ...Object.entries(presentation.enemySprites).map(([logicalId, sprite]) => artAsset(
          logicalId, 'enemy', sprite, sprite.scale, `depth:${sprite.depth}`,
          { anchor: sprite.anchor, scaleClass: sprite.scaleClass },
        )),
      ].sort((left, right) => compare(`${left.category}.${left.id}`, `${right.category}.${right.id}`))
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
    manifestRevision: stage.manifest.revision,
    ...(input.validation ? { validation: input.validation } : {}),
    ...(presentation ? { themeRevision: presentation.themeRevision } : {}),
    ...(presentation ? { visualPresentation: Object.freeze({
      themeId: presentation.themeId,
      tilesetId: presentation.tilesetId,
      ...(stage.presentationVariantId ? { variantId: stage.presentationVariantId } : {}),
      textureKeys: Object.freeze(textureKeys),
      decorationIds: Object.freeze(Object.keys(presentation.decorations).sort(compare)),
      missingResourceIds: Object.freeze([]),
      diagnostics: Object.freeze(stage.diagnostics
        .filter(item => item.code.startsWith('stage.visual.')).map(item => item.code).sort(compare)),
      tiles: Object.freeze(tilePresentations),
      spritesheets: Object.freeze(spritesheets),
      assetOrigins: Object.freeze(assetOrigins),
      decorations: Object.freeze(decorationPresentations),
      artAssets: Object.freeze(artAssets),
      ...(presentation.decorationOverrides
        ? { decorationOverrides: Object.freeze({ ...presentation.decorationOverrides }) }
        : {}),
      npcSprites: Object.freeze(Object.entries(presentation.npcSprites).map(([logicalId, sprite]) => Object.freeze({
        logicalId, spriteId: sprite.id, textureKey: sprite.textureKey,
        ...(sprite.frame !== undefined ? { frame: sprite.frame } : {}),
        animations: Object.freeze(Object.values(sprite.animations).sort(compare)),
      })).sort((left, right) => compare(left.logicalId, right.logicalId))),
      enemySprites: Object.freeze(Object.entries(presentation.enemySprites).map(([logicalId, sprite]) => Object.freeze({
        logicalId, spriteId: sprite.id, textureKey: sprite.textureKey,
        ...(sprite.frame !== undefined ? { frame: sprite.frame } : {}),
        animations: Object.freeze(Object.values(sprite.animations).sort(compare)),
      })).sort((left, right) => compare(left.logicalId, right.logicalId))),
      effects: Object.freeze(presentation.effects.map(effect => Object.freeze({
        id: effect.id, kind: effect.kind, color: effect.color,
        alpha: effect.alpha, depth: effect.depth,
        ...(effect.count !== undefined ? { count: effect.count } : {}),
      }))),
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

function projectNodes(
  graph: CampaignGraph,
  input: Pick<WorldLabProjectionInput,
    'currentNodeId' | 'stageInstanceIdsByNodeId' | 'revisitCounts'>,
): readonly WorldLabGraphNodeView[] {
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
        ...(input.stageInstanceIdsByNodeId?.[node.id]
          ? { stageInstanceId: input.stageInstanceIdsByNodeId[node.id] } : {}),
        ...(input.revisitCounts?.[node.id] !== undefined
          ? { visitCount: input.revisitCounts[node.id] } : {}),
        ...(input.currentNodeId ? { current: input.currentNodeId === node.id } : {}),
        ...(presentation ? { presentation: Object.freeze({ ...presentation }) } : {}),
      });
    }));
}

function projectEdges(
  graph: CampaignGraph,
  stages: readonly WorldLabStageProjectionInput[],
  edgeTraversalCounts?: Readonly<Record<string, number>>,
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
        traversalLimit: edge.traversalLimit,
        ...(edgeTraversalCounts?.[edge.id] !== undefined
          ? { traversalCount: edgeTraversalCounts[edge.id] } : {}),
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
      ...(input.topologyPolicyId ? { topologyPolicyId: input.topologyPolicyId } : {}),
      nodes: projectNodes(input.graph, input),
      edges: projectEdges(input.graph, input.stages, input.edgeTraversalCounts),
      stages: Object.freeze([...input.stages]
        .sort((left, right) => compare(left.node.id, right.node.id))
        .map(projectStage)),
      diagnostics: Object.freeze(diagnostics.map(freezeDiagnostic)),
    });
  }
}
