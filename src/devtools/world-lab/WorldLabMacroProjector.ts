import type {
  CampaignContentReference,
  CampaignMacroDefinition,
  CampaignMacroLocation,
  CampaignMacroProgressState,
} from '../../stages';
import type { CampaignMacroRouteInspection } from '../../application/stages';
import type {
  WorldLabDocument,
  WorldLabMacroConnectionView,
  WorldLabMacroContentState,
  WorldLabMacroEdgeView,
  WorldLabMacroNodeView,
  WorldLabMacroProgressState,
  WorldLabMacroProgressView,
} from './contracts';

export interface WorldLabMacroProjectionInput {
  readonly definition: CampaignMacroDefinition;
  readonly inspection: CampaignMacroRouteInspection;
  readonly progress: CampaignMacroProgressState;
  readonly graph: WorldLabDocument;
  readonly connections: readonly WorldLabMacroConnectionView[];
}

interface NodeDraft extends Omit<WorldLabMacroNodeView, 'incomingConnectionIds' | 'outgoingConnectionIds'> {}

function compare(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function locationId(location: CampaignMacroLocation): string {
  if (location.kind === 'hub') return location.hubId;
  if (location.kind === 'route' || location.kind === 'corrupted') return location.regionId;
  return location.finalId;
}

function targetId(location: CampaignMacroLocation): string {
  return locationId(location);
}

function contentState(content?: CampaignContentReference): WorldLabMacroContentState {
  if (!content) return 'none';
  return content.kind === 'stage' ? 'loadable' : 'planned';
}

function nodeState(
  id: string,
  currentId: string,
  completedIds: ReadonlySet<string>,
  availableIds: ReadonlySet<string>,
): WorldLabMacroProgressState {
  if (id === currentId) return 'current';
  if (completedIds.has(id)) return 'completed';
  if (availableIds.has(id)) return 'available';
  return 'blocked';
}

function edgeState(
  edge: Pick<WorldLabMacroEdgeView, 'kind'>,
  source: WorldLabMacroNodeView,
  target: WorldLabMacroNodeView,
  connection?: WorldLabMacroConnectionView,
): WorldLabMacroEdgeView['state'] {
  if (edge.kind === 'return') {
    if (source.progressState === 'completed') return 'completed';
    return connection?.status === 'bound' ? 'available' : 'blocked';
  }
  if (target.progressState === 'completed' || target.progressState === 'current') return 'completed';
  if (connection?.status === 'bound' || target.progressState === 'available') return 'available';
  return 'blocked';
}

function edge(
  sourceNodeId: string,
  targetNodeId: string,
  kind: WorldLabMacroEdgeView['kind'],
  connectionId?: string,
): Omit<WorldLabMacroEdgeView, 'state' | 'navigationStatus'> {
  return Object.freeze({
    id: `macro-edge.${sourceNodeId}.${targetNodeId}.${kind}`,
    sourceNodeId,
    targetNodeId,
    kind,
    ...(connectionId ? { connectionId } : {}),
  });
}

export class WorldLabMacroProjector {
  public project(input: WorldLabMacroProjectionInput): {
    readonly nodes: readonly WorldLabMacroNodeView[];
    readonly edges: readonly WorldLabMacroEdgeView[];
    readonly progress: WorldLabMacroProgressView;
  } {
    const currentId = locationId(input.inspection.macro.currentLocation);
    const availableIds = new Set(input.inspection.macro.choices
      .filter(choice => choice.unlocked)
      .map(choice => targetId(choice.target)));
    const completedIds = new Set<string>(input.progress.completedMilestoneIds);
    Object.values(input.progress.routes).forEach(route =>
      route.completedRegionIds.forEach(id => completedIds.add(id)));
    input.progress.corrupted.completedRegionIds.forEach(id => completedIds.add(id));

    const bindingByTarget = new Map(input.inspection.choices.map(item => [
      targetId(item.choice.target), item,
    ]));
    const connectionById = new Map(input.connections.map(item => [item.connectionId, item]));
    const graphNodeById = new Map(input.graph.nodes.map(item => [item.id, item]));
    const stageNodeByMacroId = new Map<string, string>();
    stageNodeByMacroId.set(currentId, input.inspection.navigation.currentNode.id);
    input.inspection.choices.forEach(item => {
      if (!item.edgeId) return;
      const graphEdge = input.graph.edges.find(candidate => candidate.id === item.edgeId);
      if (graphEdge && graphEdge.targetNodeId !== 'campaign.complete') {
        stageNodeByMacroId.set(targetId(item.choice.target), graphEdge.targetNodeId);
      }
    });

    const drafts: NodeDraft[] = [];
    const add = (
      id: string,
      title: string,
      kind: WorldLabMacroNodeView['kind'],
      layer: WorldLabMacroNodeView['layer'],
      requirements: readonly string[],
      content?: CampaignContentReference,
      context: Pick<NodeDraft, 'routeId' | 'routeTitle' | 'order'> = {},
    ): void => {
      const stageNodeId = stageNodeByMacroId.get(id);
      const graphNode = stageNodeId ? graphNodeById.get(stageNodeId) : undefined;
      const choice = bindingByTarget.get(id);
      const state = nodeState(id, currentId, completedIds, availableIds);
      drafts.push(Object.freeze({
        id,
        title,
        kind,
        layer,
        ...context,
        progressState: state,
        contentState: contentState(content),
        ...(choice ? { navigationStatus: choice.status } : {}),
        ...(content?.kind === 'stage' ? { stageId: content.stageId } : {}),
        ...(stageNodeId ? { stageNodeId } : {}),
        ...(graphNode ? { templateId: graphNode.templateId } : {}),
        legacyPlaceholder: content?.kind === 'stage' && content.placeholder?.kind === 'legacy-map',
        ...(content?.kind === 'planned' ? { mapMessage: 'Mapa ainda não implementado' } : {}),
        accessRequirementIds: Object.freeze([...requirements]),
      }));
    };

    add(input.definition.hub.id, input.definition.hub.title, 'hub', 0, [], input.definition.hub.content);
    input.definition.routes.forEach(route => {
      route.regions.forEach((region, index) => add(
        region.id,
        region.title,
        'region',
        1,
        index === 0 ? [input.definition.hub.id] : [route.regions[index - 1].id],
        region.content,
        { routeId: route.id, routeTitle: route.title, order: region.order },
      ));
      const milestone = input.definition.milestones.find(item => item.id === route.completionMilestoneId);
      if (milestone) {
        const ready = milestone.requiredRegionIds.every(id => completedIds.has(id));
        if (ready) availableIds.add(milestone.id);
        add(milestone.id, milestone.title, 'milestone', 1, milestone.requiredRegionIds, undefined, {
          routeId: route.id,
          routeTitle: route.title,
          order: route.regions.length,
        });
      }
    });
    input.definition.corruptedLayer.regions.forEach((region, index) => add(
      region.id,
      region.title,
      'region',
      2,
      index === 0
        ? input.definition.corruptedLayer.unlockCondition.type === 'routes.completed'
          ? input.definition.corruptedLayer.unlockCondition.routeIds
          : []
        : [input.definition.corruptedLayer.regions[index - 1].id],
      region.content,
      {
        routeId: input.definition.corruptedLayer.id,
        routeTitle: input.definition.corruptedLayer.title,
        order: region.order,
      },
    ));
    const corruptedMilestone = input.definition.milestones.find(item =>
      item.id === input.definition.corruptedLayer.completionMilestoneId);
    if (corruptedMilestone) {
      const ready = corruptedMilestone.requiredRegionIds.every(id => completedIds.has(id));
      if (ready) availableIds.add(corruptedMilestone.id);
      add(corruptedMilestone.id, corruptedMilestone.title, 'milestone', 2,
        corruptedMilestone.requiredRegionIds, undefined, {
          routeId: input.definition.corruptedLayer.id,
          routeTitle: input.definition.corruptedLayer.title,
          order: input.definition.corruptedLayer.regions.length,
        });
    }
    add(
      input.definition.final.id,
      input.definition.final.title,
      'final',
      3,
      input.definition.final.unlockCondition.type === 'milestone.completed'
        ? [input.definition.final.unlockCondition.milestoneId] : [],
      input.definition.final.content,
    );

    const edgeDrafts: ReturnType<typeof edge>[] = [];
    input.definition.routes.forEach(route => {
      const first = route.regions[0];
      if (!first) return;
      edgeDrafts.push(edge(input.definition.hub.id, first.id, 'unlock',
        `connection.${input.definition.hub.id}.${route.id}`));
      route.regions.forEach((region, index) => {
        const next = route.regions[index + 1];
        if (next) edgeDrafts.push(edge(region.id, next.id, 'progression',
          `connection.${region.id}.${next.id}`));
        if (region.allowsHubReturn) edgeDrafts.push(edge(region.id, input.definition.hub.id, 'return',
          `connection.${region.id}.${input.definition.hub.id}`));
      });
      edgeDrafts.push(edge(route.regions.at(-1)?.id as string, route.completionMilestoneId, 'progression'));
      edgeDrafts.push(edge(route.completionMilestoneId, input.definition.hub.id, 'return'));
    });
    const corrupted = input.definition.corruptedLayer;
    const firstCorrupted = corrupted.regions[0];
    if (firstCorrupted) {
      edgeDrafts.push(edge(input.definition.hub.id, firstCorrupted.id, 'unlock',
        `connection.${input.definition.hub.id}.${corrupted.id}`));
      corrupted.regions.forEach((region, index) => {
        const next = corrupted.regions[index + 1];
        if (next) edgeDrafts.push(edge(region.id, next.id, 'progression',
          `connection.${region.id}.${next.id}`));
        if (region.allowsHubReturn) edgeDrafts.push(edge(region.id, input.definition.hub.id, 'return',
          `connection.${region.id}.${input.definition.hub.id}`));
      });
      edgeDrafts.push(edge(corrupted.regions.at(-1)?.id as string,
        corrupted.completionMilestoneId, 'progression'));
      edgeDrafts.push(edge(corrupted.completionMilestoneId, input.definition.hub.id, 'return'));
    }
    edgeDrafts.push(edge(input.definition.hub.id, input.definition.final.id, 'unlock',
      `connection.${input.definition.hub.id}.${input.definition.final.id}`));

    const draftById = new Map(drafts.map(item => [item.id, item]));
    const edges = edgeDrafts.map(item => {
      const target = draftById.get(item.targetNodeId) as NodeDraft;
      const source = draftById.get(item.sourceNodeId) as NodeDraft;
      const connection = item.connectionId ? connectionById.get(item.connectionId) : undefined;
      return Object.freeze({
        ...item,
        state: edgeState(item, source as WorldLabMacroNodeView,
          target as WorldLabMacroNodeView, connection),
        ...(connection ? { navigationStatus: connection.status } : {}),
      });
    }).sort((left, right) => compare(left.id, right.id));
    const nodes = drafts.map(item => Object.freeze({
      ...item,
      incomingConnectionIds: Object.freeze(edges.filter(edge => edge.targetNodeId === item.id)
        .map(edge => edge.id).sort(compare)),
      outgoingConnectionIds: Object.freeze(edges.filter(edge => edge.sourceNodeId === item.id)
        .map(edge => edge.id).sort(compare)),
    })).sort((left, right) => left.layer - right.layer ||
      compare(left.routeId ?? '', right.routeId ?? '') || (left.order ?? 0) - (right.order ?? 0) ||
      compare(left.id, right.id));

    return Object.freeze({
      nodes: Object.freeze(nodes),
      edges: Object.freeze(edges),
      progress: Object.freeze({
        fixture: true as const,
        currentLocationId: currentId,
        routes: Object.freeze(input.definition.routes.map(route => Object.freeze({
          id: route.id,
          title: route.title,
          status: input.progress.routes[route.id].status,
          completedRegionIds: Object.freeze([...input.progress.routes[route.id].completedRegionIds]),
        }))),
        completedMilestoneIds: Object.freeze([...input.progress.completedMilestoneIds]),
        corruptedStatus: input.progress.corrupted.status,
        finalStatus: input.progress.finalStatus,
      }),
    });
  }
}
