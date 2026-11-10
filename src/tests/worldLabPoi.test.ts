import { WorldLabMacroDataService } from '../devtools/world-lab';
import {
  ECO_DAS_AGUAS_NPC_ID,
  IGAPO_DAS_MEMORIAS_STAGE,
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
      x: 28,
      y: 16,
    }));
    const decorationMarkers = igapo?.markers.filter(marker => marker.kind === 'decoration') ?? [];
    const authoredDecorations = IGAPO_DAS_MEMORIAS_STAGE.authoredLevel?.decorations ?? [];
    expect(decorationMarkers).toHaveLength(authoredDecorations.length);
    expect(decorationMarkers.length).toBeGreaterThan(100);
    expect([...new Set(authoredDecorations.map(decoration => decoration.type))])
      .toEqual(expect.arrayContaining([
        'igapo_flooded_emergent_tree',
        'igapo_flooded_palm_cluster',
        'igapo_flooded_root_tangle',
        'igapo_flooded_shore_0',
        'igapo_reeds',
      ]));
    expect(igapo?.visualPresentation).toMatchObject({
      themeId: 'theme.aguas.igapo',
      tilesetId: 'tileset.aguas.igapo-technical',
      missingResourceIds: [],
      diagnostics: [],
    });
    expect(igapo?.visualPresentation?.textureKeys).toEqual(expect.arrayContaining([
      'puny_world', 'puny_mage', 'puny_warrior_128', 'puny_archer_128',
    ]));
    expect(igapo?.visualPresentation?.npcSprites).toContainEqual(expect.objectContaining({
      logicalId: 'environment.memory-vestige',
      spriteId: 'sprite.aguas.memory-vestige',
      textureKey: 'puny_mage',
      animations: ['puny_mage_idle'],
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
      ambientColor: 0x1d4a3f,
      lightIntensity: 0.64,
      fog: { color: 0x173f3c, opacity: 0.14, depth: 4 },
    });
    expect(result.value.catalog.entries.find(item =>
      item.stageId === IGAPO_DAS_MEMORIAS_STAGE_ID)).toMatchObject({
      chapterId: 'chapter.aguas',
      manifestRevision: 2,
      chapterRevision: 2,
      loadability: 'loadable',
      eligibility: 'campaign-eligible',
      regionIds: ['region.aguas.igapo'],
    });
    expect(result.value.catalog.eligibleStageIds).toContain(IGAPO_DAS_MEMORIAS_STAGE_ID);
    expect(result.value.catalog.entries.find(item => item.stageId === 'verse_01_atrium')?.eligibility)
      .toBe('individual-only');
  });
});
