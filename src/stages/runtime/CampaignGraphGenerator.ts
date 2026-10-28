import type {
  CampaignAct,
  CampaignActId,
  CampaignBranchId,
  CampaignEdge,
  CampaignEdgeKind,
  CampaignGraph,
  CampaignGraphFailureCode,
  CampaignGraphGenerationContext,
  CampaignGraphRequest,
  CampaignGraphResult,
  CampaignNode,
  CampaignNodeKind,
  NarrativeBeatId,
  RegionTemplate,
  StageCondition,
  StageDiagnostic,
} from '../contracts';
import { CampaignGraphValidator } from './CampaignGraphValidator';

const COMPLETE = 'campaign.complete';
const STABLE_ID = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/;
const EMPTY_EXCLUSIONS: ReadonlySet<string> = new Set<string>();

interface SlotPlan {
  readonly actId: CampaignActId;
  readonly depth: number;
  readonly slotId: string;
  readonly branchId: CampaignBranchId;
  readonly kind: CampaignNodeKind;
  readonly requiredBeatIds: readonly NarrativeBeatId[];
}

type Path = readonly (string | number)[];

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isStableId(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value === value.trim() && STABLE_ID.test(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value === value.trim();
}

function isScalar(value: unknown): value is boolean | number | string {
  return typeof value === 'boolean' ||
    (typeof value === 'number' && Number.isFinite(value)) ||
    typeof value === 'string';
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 1;
}

function compareStrings(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function hashParts(...parts: readonly (string | number)[]): number {
  const text = parts.map(part => {
    const value = String(part);
    return `${value.length}:${value}`;
  }).join('|');
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function hashHex(...parts: readonly (string | number)[]): string {
  return hashParts(...parts).toString(16).padStart(8, '0');
}

function contextDigest(context: CampaignGraphGenerationContext): string {
  const flags = Object.keys(context.flags).sort()
    .map(key => `${key}=${JSON.stringify(context.flags[key])}`)
    .join('|');
  const events = [...new Set(context.completedEventIds)].sort(compareStrings).join('|');
  const beats = [...new Set(context.revealedBeatIds)].sort(compareStrings).join('|');
  return `context.${hashHex('context', flags, events, beats)}`;
}

function nodeIdOf(
  campaignId: string,
  runId: string,
  slotId: string,
  branchId: CampaignBranchId,
): string {
  return `node.${campaignId}.${runId}.${slotId}.${branchId}`;
}

function conditionSatisfied(
  condition: StageCondition,
  flags: Readonly<Record<string, boolean | number | string>>,
): boolean {
  switch (condition.type) {
    case 'flag.equals':
      return flags[condition.flag] === condition.value;
    case 'all':
      return condition.conditions.every(item => conditionSatisfied(item, flags));
    case 'any':
      return condition.conditions.some(item => conditionSatisfied(item, flags));
    case 'not':
      return !conditionSatisfied(condition.condition, flags);
    case 'mission.status':
    case 'progression.unlocked':
      return false;
    default:
      return false;
  }
}

function isCondition(value: unknown): value is StageCondition {
  if (!isRecord(value) || typeof value.type !== 'string') return false;
  switch (value.type) {
    case 'flag.equals':
      return isNonEmptyString(value.flag) && isScalar(value.value);
    case 'mission.status':
      return isNonEmptyString(value.missionId) &&
        ['locked', 'available', 'active', 'completed', 'failed'].includes(String(value.status));
    case 'progression.unlocked':
      return isNonEmptyString(value.contentId);
    case 'all':
    case 'any':
      return Array.isArray(value.conditions) && value.conditions.every(isCondition);
    case 'not':
      return isCondition(value.condition);
    default:
      return false;
  }
}

function weightedPick(candidates: readonly RegionTemplate[], salt: string): RegionTemplate {
  const sorted = [...candidates].sort((left, right) => compareStrings(left.id, right.id));
  const total = sorted.reduce((sum, template) => sum + template.weight, 0);
  let ticket = hashParts(salt, sorted.length) % total;
  for (const template of sorted) {
    ticket -= template.weight;
    if (ticket < 0) return template;
  }
  return sorted[sorted.length - 1];
}

function pushDiagnostic(
  diagnostics: StageDiagnostic[],
  code: string,
  message: string,
  path: Path,
  referenceId?: string,
): void {
  diagnostics.push({
    code,
    severity: 'error',
    message,
    path,
    ...(referenceId ? { referenceId } : {}),
  });
}

function failure(
  code: CampaignGraphFailureCode,
  diagnostics: readonly StageDiagnostic[],
): CampaignGraphResult {
  return { ok: false, error: { code, diagnostics } };
}

/**
 * Headless, pure campaign graph generator. It selects region descriptors and
 * never creates maps, touches Phaser, reads storage or advances a clock.
 */
export class CampaignGraphGenerator {
  public generate(request: CampaignGraphRequest): CampaignGraphResult {
    const diagnostics: StageDiagnostic[] = [];
    if (!this.validateRequest(request, diagnostics)) {
      return failure('invalid-request', diagnostics);
    }
    const templates = this.validateTemplates(request.templates, diagnostics);
    if (!templates) return failure('invalid-template', diagnostics);
    if (this.hasDuplicateTemplateIds(templates, diagnostics)) {
      return failure('duplicate-id', diagnostics);
    }

    const digest = contextDigest(request.context);
    const graphSeed = hashHex(
      'graph',
      String(request.runSeed),
      request.campaignRevision,
      request.catalogRevision,
      digest,
    );
    const completedEventIds = new Set(request.context.completedEventIds);
    const revealedBeatIds = new Set(request.context.revealedBeatIds);

    const used = new Set<string>();
    const nodes: CampaignNode[] = [];
    const edges: CampaignEdge[] = [];
    const layers = new Map<number, CampaignNode[]>();
    let failureCode: CampaignGraphFailureCode | undefined;

    const previousTemplates = (depth: number): readonly string[] =>
      (layers.get(depth) ?? []).map(node => node.templateId);

    const candidatesFor = (
      slot: SlotPlan,
      previous: readonly string[],
      minimumExits: 1 | 2 | 3,
      excluded: ReadonlySet<string> = EMPTY_EXCLUSIONS,
    ): RegionTemplate[] => templates.filter(template => this.isEligible(
      template,
      slot,
      minimumExits,
      request.context,
      completedEventIds,
      revealedBeatIds,
      used,
      previous,
      excluded,
    ));

    const pickTemplate = (
      slot: SlotPlan,
      previous: readonly string[],
      minimumExits: 1 | 2 | 3,
      excluded: ReadonlySet<string> = EMPTY_EXCLUSIONS,
    ): RegionTemplate | undefined => {
      const candidates = candidatesFor(slot, previous, minimumExits, excluded);
      if (candidates.length === 0) return undefined;
      return weightedPick(candidates, hashHex(
        'pick', graphSeed, slot.actId, slot.slotId, slot.branchId,
      ));
    };

    const reject = (
      slot: SlotPlan,
      code: CampaignGraphFailureCode,
      diagnosticCode: string,
      message: string,
    ): false => {
      if (failureCode === undefined) failureCode = code;
      pushDiagnostic(diagnostics, diagnosticCode, message, ['slots', slot.slotId], slot.slotId);
      return false;
    };

    const addNode = (template: RegionTemplate, slot: SlotPlan): CampaignNode => {
      const id = nodeIdOf(request.campaignId, request.runId, slot.slotId, slot.branchId);
      const biomes = [...template.allowedBiomeIds].sort(compareStrings);
      const biomeId = biomes[hashParts('biome', id) % biomes.length];
      const node: CampaignNode = {
        id,
        slotId: slot.slotId,
        templateId: template.id,
        templateRevision: template.revision,
        stageId: template.stageId,
        stageSeed: `stage.${hashHex('stage', graphSeed, id, template.id, template.revision)}`,
        actId: slot.actId,
        depth: slot.depth as CampaignNode['depth'],
        branchId: slot.branchId,
        kind: slot.kind,
        biomeId,
        difficulty: slot.depth + 1,
        providesBeatIds: [...(template.providesBeatIds ?? [])].sort(compareStrings),
        maximumPhysicalExits: template.maximumPhysicalExits,
      };
      nodes.push(node);
      used.add(template.id);
      const layer = layers.get(slot.depth) ?? [];
      layer.push(node);
      layers.set(slot.depth, layer);
      return node;
    };

    const addEdge = (source: CampaignNode, targetNodeId: string, kind: CampaignEdgeKind): void => {
      const exitSlotId = `exit.${targetNodeId}`;
      const id = `edge.${source.id}.${targetNodeId}`;
      edges.push({
        id,
        sourceNodeId: source.id,
        targetNodeId,
        exitSlotId,
        physicalExitId: `physical.${source.id}.${id}`,
        kind,
        traversalLimit: 1,
      });
    };

    const link = (fromDepth: number, toDepth: number): void => {
      const sources = layers.get(fromDepth) ?? [];
      const targets = layers.get(toDepth) ?? [];
      const kind: CampaignEdgeKind =
        sources.length === 1 && targets.length === 2 ? 'branch'
          : sources.length === 2 && targets.length === 1 ? 'rejoin'
            : 'forward';
      for (const source of sources) {
        for (const target of targets) addEdge(source, target.id, kind);
      }
    };

    const canFork = (slot: SlotPlan, previous: readonly string[]): boolean =>
      candidatesFor(slot, previous, 1).length >= 2;

    const selectIntermediateLayer = (
      actId: CampaignActId,
      depth: number,
      fork: boolean,
      previousDepth: number,
    ): boolean => {
      const previous = previousTemplates(previousDepth);
      if (!fork) {
        const slot: SlotPlan = {
          actId,
          depth,
          slotId: `${actId}.intermediate`,
          branchId: 'main',
          kind: 'intermediate',
          requiredBeatIds: [],
        };
        const template = pickTemplate(slot, previous, 1);
        if (!template) {
          return reject(slot, 'insufficient-eligible-regions',
            'generator.insufficient-eligible-regions',
            `No region template is eligible for ${slot.slotId}.`);
        }
        addNode(template, slot);
        return true;
      }

      const slotA: SlotPlan = {
        actId,
        depth,
        slotId: `${actId}.intermediate-a`,
        branchId: 'route-a',
        kind: 'intermediate',
        requiredBeatIds: [],
      };
      const slotB: SlotPlan = {
        actId,
        depth,
        slotId: `${actId}.intermediate-b`,
        branchId: 'route-b',
        kind: 'intermediate',
        requiredBeatIds: [],
      };
      const first = pickTemplate(slotA, previous, 1);
      if (!first) {
        return reject(slotA, 'insufficient-eligible-regions',
          'generator.insufficient-eligible-regions',
          `No region template is eligible for ${slotA.slotId}.`);
      }
      const second = pickTemplate(slotB, previous, 1, new Set([first.id]));
      if (!second) {
        return reject(slotB, 'insufficient-eligible-regions',
          'generator.insufficient-eligible-regions',
          `The fork at ${slotA.slotId} needs two distinct eligible templates.`);
      }
      addNode(first, slotA);
      addNode(second, slotB);
      return true;
    };

    const selectMilestone = (
      slot: SlotPlan,
      previousDepth: number,
      forkNext: boolean,
    ): CampaignNode | undefined => {
      const previous = previousTemplates(previousDepth);
      let template = forkNext ? pickTemplate(slot, previous, 2) : undefined;
      if (!template) template = pickTemplate(slot, previous, 1);
      if (!template) {
        reject(slot, 'milestone-unavailable', 'generator.milestone-unavailable',
          `No region template is eligible for milestone ${slot.slotId}.`);
        return undefined;
      }
      return addNode(template, slot);
    };

    const entrySlot: SlotPlan = {
      actId: 'act-1',
      depth: 0,
      slotId: 'act-1.entry',
      branchId: 'main',
      kind: 'intermediate',
      requiredBeatIds: [],
    };
    const act1Alternative = (branchId: CampaignBranchId): SlotPlan => ({
      actId: 'act-1',
      depth: 1,
      slotId: `act-1.intermediate-${branchId === 'route-a' ? 'a' : 'b'}`,
      branchId,
      kind: 'intermediate',
      requiredBeatIds: [],
    });

    const wantForkAct1 = canFork(act1Alternative('route-a'), []);
    let entryTemplate = wantForkAct1 ? pickTemplate(entrySlot, [], 2) : undefined;
    if (!entryTemplate) entryTemplate = pickTemplate(entrySlot, [], 1);
    if (!entryTemplate) {
      reject(entrySlot, 'insufficient-eligible-regions', 'generator.insufficient-eligible-regions',
        'No region template is eligible for the campaign entry.');
      return failure(failureCode ?? 'insufficient-eligible-regions', diagnostics);
    }
    const entryNode = addNode(entryTemplate, entrySlot);
    const forkAct1 = entryTemplate.maximumPhysicalExits >= 2 &&
      canFork(act1Alternative('route-a'), previousTemplates(0));
    if (!selectIntermediateLayer('act-1', 1, forkAct1, 0)) {
      return failure(failureCode ?? 'insufficient-eligible-regions', diagnostics);
    }
    link(0, 1);

    const act2Alternative = (branchId: CampaignBranchId): SlotPlan => ({
      actId: 'act-2',
      depth: 3,
      slotId: `act-2.intermediate-${branchId === 'route-a' ? 'a' : 'b'}`,
      branchId,
      kind: 'intermediate',
      requiredBeatIds: [],
    });
    const milestoneAct1: SlotPlan = {
      actId: 'act-1',
      depth: 2,
      slotId: 'act-1.milestone',
      branchId: 'main',
      kind: 'milestone',
      requiredBeatIds: ['beat.act-1'],
    };

    const wantForkAct2 = canFork(act2Alternative('route-a'), previousTemplates(1));
    const milestone1 = selectMilestone(milestoneAct1, 1, wantForkAct2);
    if (!milestone1) return failure(failureCode ?? 'milestone-unavailable', diagnostics);
    link(1, 2);

    const forkAct2 = milestone1.maximumPhysicalExits >= 2 &&
      canFork(act2Alternative('route-a'), previousTemplates(2));
    if (!selectIntermediateLayer('act-2', 3, forkAct2, 2)) {
      return failure(failureCode ?? 'insufficient-eligible-regions', diagnostics);
    }
    link(2, 3);

    const rejoinAct2: SlotPlan = {
      actId: 'act-2',
      depth: 4,
      slotId: 'act-2.rejoin',
      branchId: 'main',
      kind: 'intermediate',
      requiredBeatIds: [],
    };
    const rejoin2Template = pickTemplate(rejoinAct2, previousTemplates(3), 1);
    if (!rejoin2Template) {
      reject(rejoinAct2, 'insufficient-eligible-regions', 'generator.insufficient-eligible-regions',
        `No region template is eligible for ${rejoinAct2.slotId}.`);
      return failure(failureCode ?? 'insufficient-eligible-regions', diagnostics);
    }
    addNode(rejoin2Template, rejoinAct2);
    link(3, 4);

    const act3Alternative = (branchId: CampaignBranchId): SlotPlan => ({
      actId: 'act-3',
      depth: 6,
      slotId: `act-3.intermediate-${branchId === 'route-a' ? 'a' : 'b'}`,
      branchId,
      kind: 'intermediate',
      requiredBeatIds: [],
    });
    const milestoneAct2: SlotPlan = {
      actId: 'act-2',
      depth: 5,
      slotId: 'act-2.milestone',
      branchId: 'main',
      kind: 'milestone',
      requiredBeatIds: ['beat.act-2'],
    };

    const wantForkAct3 = canFork(act3Alternative('route-a'), previousTemplates(4));
    const milestone2 = selectMilestone(milestoneAct2, 4, wantForkAct3);
    if (!milestone2) return failure(failureCode ?? 'milestone-unavailable', diagnostics);
    link(4, 5);

    const forkAct3 = milestone2.maximumPhysicalExits >= 2 &&
      canFork(act3Alternative('route-a'), previousTemplates(5));
    if (!selectIntermediateLayer('act-3', 6, forkAct3, 5)) {
      return failure(failureCode ?? 'insufficient-eligible-regions', diagnostics);
    }
    link(5, 6);

    const rejoinAct3: SlotPlan = {
      actId: 'act-3',
      depth: 7,
      slotId: 'act-3.rejoin',
      branchId: 'main',
      kind: 'intermediate',
      requiredBeatIds: [],
    };
    const rejoin3Template = pickTemplate(rejoinAct3, previousTemplates(6), 1);
    if (!rejoin3Template) {
      reject(rejoinAct3, 'insufficient-eligible-regions', 'generator.insufficient-eligible-regions',
        `No region template is eligible for ${rejoinAct3.slotId}.`);
      return failure(failureCode ?? 'insufficient-eligible-regions', diagnostics);
    }
    addNode(rejoin3Template, rejoinAct3);
    link(6, 7);

    const milestoneAct3: SlotPlan = {
      actId: 'act-3',
      depth: 8,
      slotId: 'act-3.milestone',
      branchId: 'main',
      kind: 'milestone',
      requiredBeatIds: ['beat.act-3'],
    };
    const milestone3 = selectMilestone(milestoneAct3, 7, false);
    if (!milestone3) return failure(failureCode ?? 'milestone-unavailable', diagnostics);
    link(7, 8);
    addEdge(milestone3, COMPLETE, 'forward');

    const acts: readonly CampaignAct[] = [
      {
        id: 'act-1',
        ordinal: 1,
        depthRange: [0, 2],
        milestoneNodeId: nodeIdOf(request.campaignId, request.runId, 'act-1.milestone', 'main'),
        requiredBeatIds: ['beat.act-1'],
      },
      {
        id: 'act-2',
        ordinal: 2,
        depthRange: [3, 5],
        milestoneNodeId: nodeIdOf(request.campaignId, request.runId, 'act-2.milestone', 'main'),
        requiredBeatIds: ['beat.act-2'],
      },
      {
        id: 'act-3',
        ordinal: 3,
        depthRange: [6, 8],
        milestoneNodeId: nodeIdOf(request.campaignId, request.runId, 'act-3.milestone', 'main'),
        requiredBeatIds: ['beat.act-3'],
      },
    ];

    const graph: CampaignGraph = {
      schemaVersion: 1,
      generatorVersion: 1,
      id: `graph.${request.campaignId}.${request.runId}`,
      campaignId: request.campaignId,
      campaignRevision: request.campaignRevision,
      catalogRevision: request.catalogRevision,
      runId: request.runId,
      runSeed: String(request.runSeed),
      generationContextDigest: digest,
      entryNodeId: entryNode.id,
      acts,
      nodes: [...nodes].sort((left, right) => compareStrings(left.id, right.id)),
      edges: [...edges].sort((left, right) => compareStrings(left.id, right.id)),
      mandatoryBeatIds: ['beat.act-1', 'beat.act-2', 'beat.act-3'],
    };

    const issues = new CampaignGraphValidator().validate(graph);
    if (issues.length > 0) {
      const code: CampaignGraphFailureCode = issues.some(issue =>
        issue.code === 'campaign.graph.beat-unreachable' ||
        issue.code === 'campaign.graph.milestone-beat')
        ? 'narrative-beat-unreachable'
        : 'invalid-topology';
      return failure(code, issues);
    }
    return { ok: true, value: graph };
  }

  private validateRequest(
    request: CampaignGraphRequest,
    diagnostics: StageDiagnostic[],
  ): boolean {
    if (!isRecord(request)) {
      pushDiagnostic(diagnostics, 'generator.request.invalid',
        'Campaign graph request must be an object.', []);
      return false;
    }
    let valid = true;
    const reject = (code: string, message: string, path: Path): void => {
      valid = false;
      pushDiagnostic(diagnostics, code, message, path);
    };

    if (!isStableId(request.campaignId)) {
      reject('generator.request.invalid',
        'campaignId must be a stable lowercase identifier.', ['campaignId']);
    }
    if (!isStableId(request.runId)) {
      reject('generator.request.invalid',
        'runId must be a stable lowercase identifier.', ['runId']);
    }
    if (!isPositiveInteger(request.campaignRevision)) {
      reject('generator.request.invalid',
        'campaignRevision must be a positive safe integer.', ['campaignRevision']);
    }
    if (!isPositiveInteger(request.catalogRevision)) {
      reject('generator.request.invalid',
        'catalogRevision must be a positive safe integer.', ['catalogRevision']);
    }
    const runSeed = request.runSeed as unknown;
    if (!((typeof runSeed === 'string' && isNonEmptyString(runSeed)) ||
      (typeof runSeed === 'number' && Number.isFinite(runSeed)))) {
      reject('generator.request.invalid',
        'runSeed must be a non-empty string or a finite number.', ['runSeed']);
    }
    if (!Array.isArray(request.templates)) {
      reject('generator.request.invalid',
        'templates must be an array.', ['templates']);
    }

    const context = request.context as unknown;
    if (!isRecord(context)) {
      reject('generator.request.invalid',
        'context must be a frozen generation context.', ['context']);
    } else {
      if (!isRecord(context.flags)) {
        reject('generator.request.invalid', 'context.flags must be an object.', ['context', 'flags']);
      } else {
        for (const [key, value] of Object.entries(context.flags)) {
          if (!isNonEmptyString(key) || !isScalar(value)) {
            reject('generator.request.invalid',
              `context.flags.${key} must be a scalar value.`, ['context', 'flags', key]);
          }
        }
      }
      if (!Array.isArray(context.completedEventIds) ||
        !context.completedEventIds.every(isNonEmptyString)) {
        reject('generator.request.invalid',
          'context.completedEventIds must list non-empty identifiers.',
          ['context', 'completedEventIds']);
      }
      if (!Array.isArray(context.revealedBeatIds) ||
        !context.revealedBeatIds.every(isStableId)) {
        reject('generator.request.invalid',
          'context.revealedBeatIds must list stable beat identifiers.',
          ['context', 'revealedBeatIds']);
      }
    }
    return valid;
  }

  private validateTemplates(
    values: readonly RegionTemplate[],
    diagnostics: StageDiagnostic[],
  ): RegionTemplate[] | undefined {
    if (!Array.isArray(values)) return undefined;
    let valid = true;
    const templates: RegionTemplate[] = [];
    values.forEach((value, index) => {
      if (!this.validateTemplate(value, index, diagnostics)) {
        valid = false;
        return;
      }
      templates.push(value);
    });
    return valid ? templates : undefined;
  }

  private validateTemplate(
    value: unknown,
    index: number,
    diagnostics: StageDiagnostic[],
  ): value is RegionTemplate {
    const path = (field: string): Path => ['templates', index, field];
    if (!isRecord(value)) {
      pushDiagnostic(diagnostics, 'generator.template.invalid',
        'Region template must be an object.', ['templates', index]);
      return false;
    }
    let valid = true;
    const reject = (field: string, message: string): void => {
      valid = false;
      pushDiagnostic(diagnostics, 'generator.template.invalid', message, path(field));
    };

    if (!isStableId(value.id)) {
      reject('id', 'Template id must be a stable lowercase identifier.');
    }
    if (!isPositiveInteger(value.revision)) {
      reject('revision', 'Template revision must be a positive safe integer.');
    }
    if (!isStableId(value.stageId)) {
      reject('stageId', 'Template stageId must be a stable lowercase identifier.');
    }
    if (!Array.isArray(value.allowedActIds) || value.allowedActIds.length === 0 ||
      !value.allowedActIds.every(actId => actId === 'act-1' || actId === 'act-2' || actId === 'act-3')) {
      reject('allowedActIds', 'allowedActIds must list act-1, act-2 and/or act-3.');
    }
    if (!Array.isArray(value.allowedBiomeIds) || value.allowedBiomeIds.length === 0 ||
      !value.allowedBiomeIds.every(isNonEmptyString)) {
      reject('allowedBiomeIds', 'allowedBiomeIds must list at least one biome identifier.');
    }
    if (value.presetIds !== undefined &&
      (!Array.isArray(value.presetIds) || !value.presetIds.every(isNonEmptyString))) {
      reject('presetIds', 'presetIds must list non-empty identifiers when present.');
    }
    if (!isRecord(value.difficulty) ||
      typeof value.difficulty.minimum !== 'number' || !Number.isFinite(value.difficulty.minimum) ||
      typeof value.difficulty.maximum !== 'number' || !Number.isFinite(value.difficulty.maximum) ||
      value.difficulty.minimum < 0 || value.difficulty.maximum < value.difficulty.minimum) {
      reject('difficulty', 'difficulty must span finite values with 0 <= minimum <= maximum.');
    }
    if (!isPositiveInteger(value.weight)) {
      reject('weight', 'weight must be a positive safe integer.');
    }
    if (value.maximumPhysicalExits !== 1 && value.maximumPhysicalExits !== 2 &&
      value.maximumPhysicalExits !== 3) {
      reject('maximumPhysicalExits', 'maximumPhysicalExits must be 1, 2 or 3.');
    }
    if (!Array.isArray(value.tags) || !value.tags.every(isNonEmptyString)) {
      reject('tags', 'tags must list non-empty strings.');
    }
    if (value.requiredFlags !== undefined &&
      (!Array.isArray(value.requiredFlags) || !value.requiredFlags.every(isCondition))) {
      reject('requiredFlags', 'requiredFlags must list valid stage conditions.');
    }
    if (value.requiredEventIds !== undefined &&
      (!Array.isArray(value.requiredEventIds) || !value.requiredEventIds.every(isNonEmptyString))) {
      reject('requiredEventIds', 'requiredEventIds must list non-empty identifiers.');
    }
    for (const field of ['requiredBeatIds', 'providesBeatIds'] as const) {
      if (value[field] !== undefined &&
        (!Array.isArray(value[field]) || !value[field].every(isStableId))) {
        reject(field, `${field} must list stable narrative beat identifiers.`);
      }
    }
    if (value.revisit !== 'forbidden' && value.revisit !== 'checkpoint' &&
      value.revisit !== 'repeatable') {
      reject('revisit', 'revisit must be forbidden, checkpoint or repeatable.');
    }
    return valid;
  }

  private hasDuplicateTemplateIds(
    templates: readonly RegionTemplate[],
    diagnostics: StageDiagnostic[],
  ): boolean {
    const seen = new Set<string>();
    let duplicate = false;
    for (const template of [...templates].sort((left, right) => compareStrings(left.id, right.id))) {
      if (seen.has(template.id)) {
        duplicate = true;
        pushDiagnostic(diagnostics, 'generator.template.duplicate',
          `Template id is declared more than once: ${template.id}.`,
          ['templates'], template.id);
      } else {
        seen.add(template.id);
      }
    }
    return duplicate;
  }

  private isEligible(
    template: RegionTemplate,
    slot: SlotPlan,
    minimumExits: 1 | 2 | 3,
    context: CampaignGraphGenerationContext,
    completedEventIds: ReadonlySet<string>,
    revealedBeatIds: ReadonlySet<string>,
    used: ReadonlySet<string>,
    previous: readonly string[],
    excluded: ReadonlySet<string>,
  ): boolean {
    if (excluded.has(template.id)) return false;
    if (!template.allowedActIds.includes(slot.actId)) return false;

    const slotTags = template.tags.filter(tag => tag.startsWith('slot.'));
    if (slotTags.length > 0 && !slotTags.includes(`slot.${slot.slotId}`)) return false;

    const difficulty = slot.depth + 1;
    if (difficulty < template.difficulty.minimum ||
      difficulty > template.difficulty.maximum) return false;
    if (template.maximumPhysicalExits < minimumExits) return false;
    if (template.revisit !== 'repeatable' && used.has(template.id)) return false;
    if (previous.includes(template.id)) return false;

    for (const condition of template.requiredFlags ?? []) {
      if (!conditionSatisfied(condition, context.flags)) return false;
    }
    for (const eventId of template.requiredEventIds ?? []) {
      if (!completedEventIds.has(eventId)) return false;
    }
    for (const beat of template.requiredBeatIds ?? []) {
      if (!revealedBeatIds.has(beat)) return false;
    }
    if (slot.kind === 'milestone') {
      const provided = template.providesBeatIds ?? [];
      if (!slot.requiredBeatIds.every(beat => provided.includes(beat))) return false;
    }
    return true;
  }
}
