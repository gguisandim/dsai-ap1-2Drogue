import type {
  CampaignContentReference,
  CampaignMacroDefinition,
  CampaignNarrativeHooks,
  CampaignRegionDefinition,
} from '../../stages';

const planned = (contentId: string): CampaignContentReference => Object.freeze({
  kind: 'planned' as const,
  contentId,
  reason: 'Etapa 9.1 define identidade e progressão; mapa e assets ainda não foram implementados.',
});

const hooks = (beatId: string): CampaignNarrativeHooks => Object.freeze({
  providesBeatIds: Object.freeze([beatId]),
});

function region(
  id: string,
  title: string,
  order: number,
  difficultyLayer: 1 | 2,
): CampaignRegionDefinition {
  return Object.freeze({
    id,
    title,
    order,
    difficultyLayer,
    allowsHubReturn: true,
    content: planned(`content.${id}`),
    narrative: Object.freeze({
      requiredBeatIds: Object.freeze([]),
      providesBeatIds: Object.freeze([`beat.${id}`]),
    }),
  });
}

export const UMBRA_CAMPAIGN_SKELETON: CampaignMacroDefinition = Object.freeze({
  schemaVersion: 1 as const,
  id: 'campaign.umbra-trail.independent-routes',
  revision: 1,
  title: 'Umbra Trail — Rotas Independentes',
  hub: Object.freeze({
    id: 'hub.floresta-das-raizes',
    title: 'Floresta das Raízes',
    difficultyLayer: 0 as const,
    content: planned('content.hub.floresta-das-raizes'),
    narrative: hooks('beat.hub.floresta-das-raizes'),
  }),
  routes: Object.freeze([
    Object.freeze({
      id: 'route.aguas',
      title: 'Rota das Águas',
      regions: Object.freeze([
        region('region.aguas.igapo', 'Igapó', 0, 1),
        region('region.aguas.mangues', 'Mangues', 1, 1),
        region('region.aguas.porto', 'Porto', 2, 1),
      ]),
      completionMilestoneId: 'milestone.route.aguas',
      narrative: hooks('beat.route.aguas'),
    }),
    Object.freeze({
      id: 'route.floresta',
      title: 'Rota da Floresta',
      regions: Object.freeze([
        region('region.floresta.fungos', 'Fungos', 0, 1),
        region('region.floresta.copas', 'Copas', 1, 1),
        region('region.floresta.flores', 'Flores', 2, 1),
      ]),
      completionMilestoneId: 'milestone.route.floresta',
      narrative: hooks('beat.route.floresta'),
    }),
    Object.freeze({
      id: 'route.terra',
      title: 'Rota da Terra',
      regions: Object.freeze([
        region('region.terra.areias', 'Areias', 0, 1),
        region('region.terra.ruinas', 'Ruínas', 1, 1),
        region('region.terra.cicatriz', 'Cicatriz', 2, 1),
      ]),
      completionMilestoneId: 'milestone.route.terra',
      narrative: hooks('beat.route.terra'),
    }),
  ]),
  milestones: Object.freeze([
    Object.freeze({
      id: 'milestone.route.aguas',
      title: 'Memória das Águas',
      scope: Object.freeze({ kind: 'route' as const, routeId: 'route.aguas' }),
      requiredRegionIds: Object.freeze([
        'region.aguas.igapo', 'region.aguas.mangues', 'region.aguas.porto',
      ]),
      completionOperationId: 'macro.complete.route.aguas.v1',
      narrative: hooks('beat.milestone.aguas'),
    }),
    Object.freeze({
      id: 'milestone.route.floresta',
      title: 'Memória da Floresta',
      scope: Object.freeze({ kind: 'route' as const, routeId: 'route.floresta' }),
      requiredRegionIds: Object.freeze([
        'region.floresta.fungos', 'region.floresta.copas', 'region.floresta.flores',
      ]),
      completionOperationId: 'macro.complete.route.floresta.v1',
      narrative: hooks('beat.milestone.floresta'),
    }),
    Object.freeze({
      id: 'milestone.route.terra',
      title: 'Memória da Terra',
      scope: Object.freeze({ kind: 'route' as const, routeId: 'route.terra' }),
      requiredRegionIds: Object.freeze([
        'region.terra.areias', 'region.terra.ruinas', 'region.terra.cicatriz',
      ]),
      completionOperationId: 'macro.complete.route.terra.v1',
      narrative: hooks('beat.milestone.terra'),
    }),
    Object.freeze({
      id: 'milestone.corrupted.primary',
      title: 'Coração da Corrupção',
      scope: Object.freeze({ kind: 'corrupted-layer' as const }),
      requiredRegionIds: Object.freeze([
        'region.corrupted.minas', 'region.corrupted.cinzas',
        'region.corrupted.temporal', 'region.corrupted.complexo-industrial',
      ]),
      completionOperationId: 'macro.complete.corrupted.primary.v1',
      narrative: hooks('beat.milestone.corrupted'),
    }),
  ]),
  corruptedLayer: Object.freeze({
    id: 'layer.corrupted',
    title: 'Regiões Corrompidas',
    difficultyLayer: 2 as const,
    regions: Object.freeze([
      region('region.corrupted.minas', 'Minas', 0, 2),
      region('region.corrupted.cinzas', 'Cinzas', 1, 2),
      region('region.corrupted.temporal', 'Temporal', 2, 2),
      region('region.corrupted.complexo-industrial', 'Complexo Industrial', 3, 2),
    ]),
    completionMilestoneId: 'milestone.corrupted.primary',
    unlockCondition: Object.freeze({
      type: 'routes.completed' as const,
      routeIds: Object.freeze(['route.aguas', 'route.floresta', 'route.terra']),
    }),
    narrative: hooks('beat.layer.corrupted'),
  }),
  final: Object.freeze({
    id: 'final.palacio-do-credor',
    title: 'Palácio do Credor',
    difficultyLayer: 3 as const,
    content: planned('content.final.palacio-do-credor'),
    unlockCondition: Object.freeze({
      type: 'milestone.completed' as const,
      milestoneId: 'milestone.corrupted.primary',
    }),
    narrative: hooks('beat.final.palacio-do-credor'),
  }),
});
