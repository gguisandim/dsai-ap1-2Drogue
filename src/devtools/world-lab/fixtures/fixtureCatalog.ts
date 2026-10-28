import type { RegionTemplate } from '../../../stages';
import type { WorldLabThemePresentation } from '../contracts';

const ACTS = Object.freeze(['act-1', 'act-2', 'act-3']);
const BEATS = Object.freeze(['beat.act-1', 'beat.act-2', 'beat.act-3']);

interface FixtureRegion {
  readonly id: string;
  readonly stageId: string;
  readonly biomeId: RegionTemplate['allowedBiomeIds'][number];
  readonly presentation: WorldLabThemePresentation;
}

const PRESENTATIONS = Object.freeze({
  roots: Object.freeze({
    id: 'forest-roots', label: 'Floresta das Raízes', accent: '#4ade80', surface: '#183c2b',
  }),
  igapo: Object.freeze({
    id: 'forgotten-igapo', label: 'Igapó dos Esquecidos', accent: '#38bdf8', surface: '#123448',
  }),
  fungi: Object.freeze({
    id: 'fungal-garden', label: 'Jardim dos Fungos', accent: '#c084fc', surface: '#38204d',
  }),
  mines: Object.freeze({
    id: 'dead-sun-mines', label: 'Minas do Sol Morto', accent: '#fbbf24', surface: '#46351b',
  }),
  port: Object.freeze({
    id: 'stilt-port', label: 'Porto das Palafitas', accent: '#2dd4bf', surface: '#153d3a',
  }),
  palace: Object.freeze({
    id: 'creditor-palace', label: 'Palácio do Credor', accent: '#fb7185', surface: '#47222d',
  }),
});

const FIXTURE_REGIONS: readonly FixtureRegion[] = Object.freeze([
  { id: 'fixture.roots', stageId: 'level_01_vestibule', biomeId: 'cathedral', presentation: PRESENTATIONS.roots },
  { id: 'fixture.igapo', stageId: 'level_02_nave', biomeId: 'ruins', presentation: PRESENTATIONS.igapo },
  { id: 'fixture.fungi', stageId: 'level_03_vigrid_streets', biomeId: 'streets', presentation: PRESENTATIONS.fungi },
  { id: 'fixture.mines', stageId: 'level_04_colosseum', biomeId: 'colosseum', presentation: PRESENTATIONS.mines },
  { id: 'fixture.port', stageId: 'level_05_clocktower', biomeId: 'clocktower', presentation: PRESENTATIONS.port },
  { id: 'fixture.palace', stageId: 'level_06_inferno', biomeId: 'inferno', presentation: PRESENTATIONS.palace },
  { id: 'fixture.roots-deep', stageId: 'level_07_witches_crypt', biomeId: 'crypt', presentation: PRESENTATIONS.roots },
  { id: 'fixture.igapo-light', stageId: 'level_08_paradiso', biomeId: 'garden', presentation: PRESENTATIONS.igapo },
  { id: 'fixture.fungi-void', stageId: 'level_09_limbo', biomeId: 'void', presentation: PRESENTATIONS.fungi },
  { id: 'fixture.palace-summit', stageId: 'level_10_ithavoll', biomeId: 'celestial', presentation: PRESENTATIONS.palace },
]);

export const WORLD_LAB_FIXTURE_CATALOG: readonly RegionTemplate[] = Object.freeze(
  FIXTURE_REGIONS.map((region): RegionTemplate => Object.freeze({
    id: region.id,
    revision: 1,
    stageId: region.stageId,
    allowedActIds: ACTS,
    allowedBiomeIds: Object.freeze([region.biomeId]),
    difficulty: Object.freeze({ minimum: 1, maximum: 9 }),
    weight: 1,
    maximumPhysicalExits: 3,
    tags: Object.freeze([]),
    providesBeatIds: BEATS,
    revisit: 'repeatable',
  })),
);

const PRESENTATION_BY_TEMPLATE = new Map(
  FIXTURE_REGIONS.map(region => [region.id, region.presentation]),
);

export function fixturePresentation(templateId: string): WorldLabThemePresentation | undefined {
  return PRESENTATION_BY_TEMPLATE.get(templateId);
}

