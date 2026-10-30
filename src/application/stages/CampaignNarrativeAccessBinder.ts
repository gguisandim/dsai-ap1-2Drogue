import type { CampaignNavigationView, CampaignRouteAccess } from './CampaignNavigation';
import type {
  GameCampaignNavigationPort,
  GameCampaignNavigationResult,
} from './GameMacroCampaignAdapter';
import type { GameNarrativeSession } from './GameStageCompositionRoot';

/**
 * Projects persisted narrative conditions onto the generic campaign router.
 * Condition semantics stay owned by StageDirector; navigation only receives IDs.
 */
export class CampaignNarrativeAccessBinder {
  public synchronize(
    navigation: GameCampaignNavigationPort,
    narrative: GameNarrativeSession,
  ): GameCampaignNavigationResult<CampaignNavigationView> {
    const state = navigation.state();
    const access: CampaignRouteAccess = Object.freeze({
      eligibleEdgeIds: Object.freeze(state.graph.edges
        .filter(edge => edge.sourceNodeId === state.currentNodeId)
        .filter(edge => !edge.condition || narrative.conditionSatisfied(edge.condition))
        .map(edge => edge.id)
        .sort()),
      unlockedStageExitIds: Object.freeze([
        ...narrative.director.snapshot().unlockedExitIds,
      ].sort()),
    });
    navigation.setAccess(access);
    return navigation.inspect();
  }
}
