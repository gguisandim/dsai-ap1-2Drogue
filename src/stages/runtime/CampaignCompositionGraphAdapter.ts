import type {
  CampaignCompositionAssignment,
  CampaignCompositionSnapshot,
  CampaignGraphGenerationContext,
  CampaignGraphResult,
  RegionTemplate,
} from '../contracts';
import { CampaignGraphGenerator } from './CampaignGraphGenerator';

function template(assignment: CampaignCompositionAssignment): RegionTemplate {
  return Object.freeze({
    id: `composition-template.${assignment.stageInstanceId}`,
    revision: assignment.manifestRevision,
    stageId: assignment.stageId,
    allowedActIds: Object.freeze([assignment.actId]),
    allowedBiomeIds: Object.freeze([assignment.biomeId]) as RegionTemplate['allowedBiomeIds'],
    difficulty: Object.freeze({
      minimum: assignment.difficulty,
      maximum: assignment.difficulty,
    }),
    weight: 1,
    maximumPhysicalExits: assignment.maximumPhysicalExits,
    tags: Object.freeze([`slot.${assignment.slotId}`, 'campaign-composition']),
    providesBeatIds: assignment.providesBeatIds,
    revisit: assignment.revisit,
  });
}

/** Adapts selected definitions to the existing fixed-topology graph generator. */
export class CampaignCompositionGraphAdapter {
  public constructor(private readonly generator = new CampaignGraphGenerator()) {}

  public generate(
    snapshot: CampaignCompositionSnapshot,
    context: CampaignGraphGenerationContext = snapshot.context,
  ): CampaignGraphResult {
    return this.generator.generate({
      campaignId: snapshot.campaignId,
      campaignRevision: snapshot.campaignRevision,
      catalogRevision: Math.max(1, Number.parseInt(snapshot.catalogDigest.slice(-8), 16)),
      runId: snapshot.runId,
      runSeed: snapshot.seed,
      templates: Object.freeze(snapshot.assignments.map(template)),
      context,
    });
  }
}
