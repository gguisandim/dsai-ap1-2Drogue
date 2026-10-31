import { WorldLabMacroDataService } from '../devtools/world-lab';
import {
  ECO_DAS_AGUAS_NPC_ID,
  IGAPO_DAS_MEMORIAS_STAGE_ID,
} from '../stages';

describe('World Lab POI projection', () => {
  it('shows the Vestígio Submerso NPC marker for the authored Igapó stage', () => {
    const result = new WorldLabMacroDataService().generate('seed.world-lab.poi');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const igapo = result.value.graph.stages.find(
      stage => stage.stageId === IGAPO_DAS_MEMORIAS_STAGE_ID,
    );
    expect(igapo).toBeDefined();
    expect(igapo?.markers).toContainEqual(expect.objectContaining({
      kind: 'npc',
      id: ECO_DAS_AGUAS_NPC_ID,
      label: 'Vestígio Submerso',
      x: 27,
      y: 17,
    }));
    expect(igapo?.markers.filter(marker => marker.kind === 'decoration')).toHaveLength(3);
    expect(igapo?.visualPresentation).toMatchObject({
      themeId: 'theme.aguas.igapo',
      tilesetId: 'tileset.aguas.igapo-technical',
      missingResourceIds: [],
      diagnostics: [],
    });
    expect(igapo?.visualPresentation?.textureKeys).toEqual(expect.arrayContaining([
      'tile_floor', 'tile_pillar', 'tile_water',
    ]));
    expect(igapo?.visualPresentation?.npcSprites).toContainEqual(expect.objectContaining({
      logicalId: 'environment.memory-vestige',
      spriteId: 'sprite.aguas.memory-vestige',
      textureKey: 'enemy_ranged_anim',
      animations: ['enemy_ranged_anim_walk'],
    }));
    expect(igapo?.visualPresentation?.enemySprites).toContainEqual(expect.objectContaining({
      logicalId: 'affinity', spriteId: 'sprite.aguas.affinity-forgotten',
    }));
    expect(igapo?.visualPresentation?.audio).toMatchObject({
      profileId: 'audio-profile.aguas.forgotten-waters',
      musicSoundId: 'sound.aguas.memory-current',
      ambientSoundId: 'sound.aguas.flooded-canopy',
    });
    expect(igapo?.visualPresentation?.environment).toEqual({
      id: 'environment.aguas.forgotten-waters',
      ambientColor: 0x153e39,
      lightIntensity: 0.62,
      fog: { color: 0x123d42, opacity: 0.16, depth: 4 },
    });
    expect(result.value.catalog.entries.find(item =>
      item.stageId === IGAPO_DAS_MEMORIAS_STAGE_ID)).toMatchObject({
      chapterId: 'chapter.aguas',
      manifestRevision: 1,
      chapterRevision: 1,
      loadability: 'loadable',
      eligibility: 'campaign-eligible',
      regionIds: ['region.aguas.igapo'],
    });
    expect(result.value.catalog.eligibleStageIds).toContain(IGAPO_DAS_MEMORIAS_STAGE_ID);
    expect(result.value.catalog.entries.find(item => item.stageId === 'verse_01_atrium')?.eligibility)
      .toBe('individual-only');
  });
});
