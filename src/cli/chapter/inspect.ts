import type {
  CampaignChapterEntry,
  LoadedStage,
  StageModule,
} from '../../stages';
import { validateChapterEntry } from './validation';
import type {
  ChapterInspection,
  ChapterValidationReport,
  InspectedStage,
} from './types';

function encounterSummary(
  stage: StageModule,
  loaded: LoadedStage | undefined,
): InspectedStage['encounter'] {
  if (loaded?.encounter) {
    const enemies = loaded.encounter.waves.flatMap(wave => wave.enemies);
    return {
      id: loaded.encounter.id,
      waveCount: loaded.encounter.waves.length,
      enemyCount: enemies.length,
      enemyTypes: Object.freeze([...new Set(enemies.map(enemy => enemy.type))].sort()),
    };
  }
  const encounter = stage.encounter;
  if (!encounter) return null;
  if (encounter.source.kind === 'authored-waves') {
    const enemies = encounter.source.waves.flatMap(wave => wave.enemies);
    return {
      id: encounter.id,
      waveCount: encounter.source.waves.length,
      enemyCount: enemies.length,
      enemyTypes: Object.freeze([...new Set(enemies.map(enemy => enemy.type))].sort()),
    };
  }
  return { id: encounter.id, waveCount: 0, enemyCount: 0, enemyTypes: Object.freeze([]) };
}

function presentationSummary(
  stage: StageModule,
  loaded: LoadedStage | undefined,
): InspectedStage['presentation'] {
  const manifest = stage.manifest.presentation;
  if (loaded?.presentation) {
    return {
      themeId: loaded.presentation.themeId,
      tilesetId: loaded.presentation.tilesetId,
      npcPresentationIds: Object.freeze(Object.keys(loaded.presentation.npcSprites).sort()),
      enemyArchetypes: Object.freeze(Object.keys(
        manifest?.enemySprites ?? loaded.presentation.enemySprites,
      ).sort()),
      presentationVariantIds: Object.freeze(Object.keys(
        stage.manifest.presentationVariants ?? {},
      ).sort()),
      ...(manifest?.audioProfileId ? { audioProfileId: manifest.audioProfileId } : {}),
      ...(manifest?.environmentId ? { environmentId: manifest.environmentId } : {}),
    };
  }
  if (!manifest) return null;
  return {
    themeId: manifest.themeId,
    ...(manifest.tilesetId ? { tilesetId: manifest.tilesetId } : {}),
    npcPresentationIds: Object.freeze(Object.keys(manifest.npcSprites ?? {}).sort()),
    enemyArchetypes: Object.freeze(Object.keys(manifest.enemySprites ?? {}).sort()),
    presentationVariantIds: Object.freeze(Object.keys(
      stage.manifest.presentationVariants ?? {},
    ).sort()),
    ...(manifest.audioProfileId ? { audioProfileId: manifest.audioProfileId } : {}),
    ...(manifest.environmentId ? { environmentId: manifest.environmentId } : {}),
  };
}

function inspectStage(
  entry: CampaignChapterEntry,
  stage: StageModule,
  report: ChapterValidationReport,
): InspectedStage {
  const catalogEntry = report.catalogEntries.find(item => item.stageId === stage.manifest.id);
  const loaded = report.loadedStages.find(item => item.manifest.id === stage.manifest.id);
  const runtimeNpcs = loaded?.npcs ?? stage.npcs ?? [];
  const runtimeDialogues = loaded?.dialogues ?? stage.dialogues ?? [];
  const runtimeMissions = loaded?.missions ?? stage.missions ?? [];
  const runtimeEvents = loaded?.events ?? stage.events ?? [];
  const dependencies = catalogEntry?.chapterDependencies ?? entry.chapter.dependencies ?? [];
  return Object.freeze({
    id: stage.manifest.id,
    title: stage.manifest.title,
    revision: stage.manifest.revision,
    order: stage.manifest.order,
    chapterId: stage.manifest.chapterId,
    layoutKind: stage.manifest.layout.kind,
    regions: Object.freeze([...(catalogEntry?.regionIds ?? [])]),
    biomes: Object.freeze([...(catalogEntry?.biomeIds ?? [])]),
    capabilities: Object.freeze([...(catalogEntry?.capabilityRequirements.map(item => item.id) ?? [])]),
    dependencies: Object.freeze(dependencies.map(item => Object.freeze({
      chapterId: item.chapterId,
      minimumRevision: item.minimumRevision,
      optional: item.optional === true,
    }))),
    exits: Object.freeze(stage.manifest.exits.map(exit => Object.freeze({
      id: exit.id,
      targetStageId: exit.targetStageId,
      anchor: exit.anchor,
      conditional: exit.condition !== undefined,
    }))),
    entryDialogueId: stage.manifest.entryDialogueId ?? null,
    completionMissionId: stage.manifest.completionMissionId ?? null,
    npcIds: Object.freeze(runtimeNpcs.map(item => item.id)),
    dialogueIds: Object.freeze(runtimeDialogues.map(item => item.id)),
    missionIds: Object.freeze(runtimeMissions.map(item => item.id)),
    eventIds: Object.freeze(runtimeEvents.map(item => item.id)),
    encounter: encounterSummary(stage, loaded),
    presentation: presentationSummary(stage, loaded),
    eligibility: catalogEntry?.eligibility ?? null,
    loadability: catalogEntry?.loadability ?? null,
  });
}

export function inspectChapterEntry(entry: CampaignChapterEntry): ChapterInspection {
  const report = validateChapterEntry(entry);
  const visual = entry.chapter.visualResources;
  return Object.freeze({
    chapter: Object.freeze({
      id: entry.chapter.id,
      title: entry.chapter.title,
      revision: entry.chapter.revision,
      stageCount: entry.chapter.stageIds.length,
      stageIds: Object.freeze([...entry.chapter.stageIds]),
      tags: Object.freeze([...(entry.chapter.tags ?? [])]),
    }),
    stages: Object.freeze(entry.stages.map(stage => inspectStage(entry, stage, report))),
    visualResources: visual
      ? Object.freeze({
          textureIds: Object.freeze(visual.textures.map(item => item.id)),
          tilesetIds: Object.freeze(visual.tilesets.map(item => item.id)),
          themeIds: Object.freeze(visual.themes.map(item => item.id)),
          decorationIds: Object.freeze((visual.decorations ?? []).map(item => item.id)),
          spriteIds: Object.freeze((visual.sprites ?? []).map(item => item.id)),
          soundIds: Object.freeze((visual.sounds ?? []).map(item => item.id)),
          audioProfileIds: Object.freeze((visual.audioProfiles ?? []).map(item => item.id)),
          environmentIds: Object.freeze((visual.environments ?? []).map(item => item.id)),
        })
      : null,
    campaignCandidate: report.campaignCandidate,
    individualAvailable: report.individualAvailable,
    diagnostics: report.diagnostics,
    runtime: Object.freeze({ phaserAssets: 'not-executed' as const }),
  });
}
