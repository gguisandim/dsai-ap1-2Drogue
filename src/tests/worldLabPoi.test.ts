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
  });
});
