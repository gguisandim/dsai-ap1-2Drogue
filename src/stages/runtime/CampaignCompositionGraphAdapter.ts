import type {
  CampaignEdge,
  CampaignCompositionAssignment,
  CampaignCompositionSnapshot,
  CampaignGraphGenerationContext,
  CampaignGraphResult,
  RegionTemplate,
} from '../contracts';
import { BRANCHING_NINE_COMPOSITION_POLICY_ID } from '../contracts';
import { CampaignGraphGenerator } from './CampaignGraphGenerator';
import { CampaignGraphValidator } from './CampaignGraphValidator';

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

function compare(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

/** Adapts selected definitions to the existing graph generator. */
export class CampaignCompositionGraphAdapter {
  public constructor(private readonly generator = new CampaignGraphGenerator()) {}

  public generate(
    snapshot: CampaignCompositionSnapshot,
    context: CampaignGraphGenerationContext = snapshot.context,
  ): CampaignGraphResult {
    const generated = this.generator.generate({
      campaignId: snapshot.campaignId,
      campaignRevision: snapshot.campaignRevision,
      catalogRevision: Math.max(1, Number.parseInt(snapshot.catalogDigest.slice(-8), 16)),
      runId: snapshot.runId,
      runSeed: snapshot.seed,
      templates: Object.freeze(snapshot.assignments.map(template)),
      context,
    });
    if (!generated.ok || snapshot.policyId !== BRANCHING_NINE_COMPOSITION_POLICY_ID) {
      return generated;
    }

    const graph = generated.value;
    const source = graph.nodes.find(node => node.slotId === 'act-1.milestone');
    const candidates = graph.nodes
      .filter(node => node.depth === 1)
      .filter(node => snapshot.assignments.find(item => item.slotId === node.slotId)?.revisit !== 'forbidden')
      .sort((left, right) => compare(left.id, right.id));
    const target = candidates[0];
    if (!source || !target) {
      return Object.freeze({
        ok: false as const,
        error: Object.freeze({
          code: 'invalid-topology' as const,
          diagnostics: Object.freeze([Object.freeze({
            code: 'campaign.graph.edge-return' as const,
            severity: 'error' as const,
            message: 'Branching policy requires a revisitable act-1 alternative.',
            path: Object.freeze(['nodes']),
          })]),
        }),
      });
    }
    const rejoin = graph.edges.find(edge =>
      edge.sourceNodeId === target.id && edge.targetNodeId === source.id && edge.kind === 'rejoin');
    if (!rejoin) return Object.freeze({
      ok: false as const,
      error: Object.freeze({
        code: 'invalid-topology' as const,
        diagnostics: Object.freeze([Object.freeze({
          code: 'campaign.graph.edge-return' as const,
          severity: 'error' as const,
          message: 'Branching policy could not identify the revisitable rejoin edge.',
          path: Object.freeze(['edges']),
        })]),
      }),
    });

    const returnId = `edge.${source.id}.${target.id}.return`;
    const returnEdge: CampaignEdge = Object.freeze({
      id: returnId,
      sourceNodeId: source.id,
      targetNodeId: target.id,
      exitSlotId: `exit.${target.id}.return`,
      physicalExitId: `physical.${source.id}.${returnId}`,
      kind: 'return',
      traversalLimit: 2,
    });
    const edges = Object.freeze([
      ...graph.edges.map(edge => edge.id === rejoin.id
        ? Object.freeze({ ...edge, traversalLimit: 2 as const })
        : edge),
      returnEdge,
    ].sort((left, right) => compare(left.id, right.id)));
    const branched = Object.freeze({ ...graph, edges });
    const issues = new CampaignGraphValidator().validate(branched);
    if (issues.length > 0) return Object.freeze({
      ok: false as const,
      error: Object.freeze({ code: 'invalid-topology' as const, diagnostics: issues }),
    });
    return Object.freeze({ ok: true as const, value: branched });
  }
}
