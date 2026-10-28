import type {
  DialogueDefinition,
  MissionDefinition,
  NarrativeContent,
  NarrativeDefinition,
  NarrativeDiagnostic,
  NarrativeRegistryFailure,
  NarrativeResult,
  NpcDefinition,
  StageCommand,
  StageCondition,
  StageEventRule,
  StageReward,
  StageSignal,
} from '../contracts';
import { cloneFrozen, compareStrings, failure, isScalar, isStableId, success } from './data';

const SIGNAL_FIELDS: Readonly<Record<StageSignal['type'], readonly string[]>> = Object.freeze({
  'stage.entered': ['stageId'],
  'enemy.defeated': ['enemyId', 'archetype'],
  'item.collected': ['itemId', 'itemType'],
  'encounter.completed': ['encounterId'],
  'npc.interacted': ['npcId'],
  'dialogue.completed': ['dialogueId'],
  'mission.completed': ['missionId'],
  'stage.exit.requested': ['exitId'],
});

function sortDiagnostics(diagnostics: NarrativeDiagnostic[]): readonly NarrativeDiagnostic[] {
  return cloneFrozen(diagnostics.sort((left, right) => {
    const leftKey = `${left.path.join('.')}|${left.code}|${left.referenceId ?? ''}`;
    const rightKey = `${right.path.join('.')}|${right.code}|${right.referenceId ?? ''}`;
    return compareStrings(leftKey, rightKey);
  }));
}

interface CandidateMaps {
  readonly npcs: ReadonlyMap<string, NpcDefinition>;
  readonly dialogues: ReadonlyMap<string, DialogueDefinition>;
  readonly missions: ReadonlyMap<string, MissionDefinition>;
  readonly events: ReadonlyMap<string, StageEventRule>;
  readonly exits: ReadonlySet<string>;
}

export class NarrativeRegistry {
  private readonly definitions = new Map<string, NarrativeDefinition>();
  private readonly stageChapters = new Map<string, string>();
  private readonly npcs = new Map<string, NpcDefinition>();
  private readonly dialogues = new Map<string, DialogueDefinition>();
  private readonly missions = new Map<string, MissionDefinition>();
  private readonly events = new Map<string, StageEventRule>();
  private readonly stageNpcs = new Map<string, readonly string[]>();
  private readonly stageDialogues = new Map<string, readonly string[]>();
  private readonly stageMissions = new Map<string, readonly string[]>();
  private readonly stageEvents = new Map<string, readonly string[]>();
  private readonly stageExits = new Map<string, readonly string[]>();

  public register(content: NarrativeContent): NarrativeResult<void, NarrativeRegistryFailure> {
    const diagnostics: NarrativeDiagnostic[] = [];
    const add = (code: string, message: string, path: readonly (string | number)[], referenceId?: string): void => {
      diagnostics.push({ code, message, path, ...(referenceId ? { referenceId } : {}) });
    };
    if (!isStableId(content.stageId)) {
      add('narrative.stage-id.invalid', 'stageId must be a stable lowercase identifier.', ['stageId']);
    }
    if (!isStableId(content.chapterId)) {
      add('narrative.chapter-id.invalid', 'chapterId must be a stable lowercase identifier.', ['chapterId']);
    }
    if (this.definitions.has(content.stageId)) {
      add('narrative.stage.duplicate', `Narrative stage is already registered: ${content.stageId}.`,
        ['stageId'], content.stageId);
    }
    this.findNonDeclarativeValue(content, [], diagnostics, new Set<object>());

    const localNpcs = this.collect(content.npcs ?? [], this.npcs, 'npcs', diagnostics);
    const localDialogues = this.collect(content.dialogues ?? [], this.dialogues, 'dialogues', diagnostics);
    const localMissions = this.collect(content.missions ?? [], this.missions, 'missions', diagnostics);
    const localEvents = this.collect(content.events ?? [], this.events, 'events', diagnostics);
    const exits = new Set<string>();
    (content.exitIds ?? []).forEach((exitId, index) => {
      if (!isStableId(exitId)) add('narrative.exit-id.invalid', 'Exit id must be stable.', ['exitIds', index]);
      if (exits.has(exitId)) add('narrative.exit-id.duplicate', `Duplicate exit id: ${exitId}.`, ['exitIds', index], exitId);
      exits.add(exitId);
    });

    const candidate: CandidateMaps = {
      npcs: new Map([...this.npcs, ...localNpcs]),
      dialogues: new Map([...this.dialogues, ...localDialogues]),
      missions: new Map([...this.missions, ...localMissions]),
      events: new Map([...this.events, ...localEvents]),
      exits,
    };

    this.validateDefinition(content.definition ?? {}, candidate, diagnostics);
    (content.npcs ?? []).forEach((npc, index) => this.validateNpc(npc, candidate, diagnostics, index));
    (content.dialogues ?? []).forEach((dialogue, index) =>
      this.validateDialogue(dialogue, candidate, diagnostics, index));
    (content.missions ?? []).forEach((mission, index) =>
      this.validateMission(mission, candidate, diagnostics, index));
    (content.events ?? []).forEach((event, index) =>
      this.validateEvent(event, candidate, diagnostics, index));

    if (diagnostics.length > 0) {
      const sorted = sortDiagnostics(diagnostics);
      const duplicate = sorted.some(item => item.code.includes('duplicate'));
      return failure(cloneFrozen({
        code: duplicate ? 'duplicate-id' as const : 'invalid-content' as const,
        diagnostics: sorted,
      }));
    }

    this.definitions.set(content.stageId, cloneFrozen(content.definition ?? {}));
    this.stageChapters.set(content.stageId, content.chapterId);
    this.commit(localNpcs, this.npcs);
    this.commit(localDialogues, this.dialogues);
    this.commit(localMissions, this.missions);
    this.commit(localEvents, this.events);
    this.stageNpcs.set(content.stageId, cloneFrozen([...localNpcs.keys()].sort(compareStrings)));
    this.stageDialogues.set(content.stageId, cloneFrozen([...localDialogues.keys()].sort(compareStrings)));
    this.stageMissions.set(content.stageId, cloneFrozen([...localMissions.keys()].sort(compareStrings)));
    this.stageEvents.set(content.stageId, cloneFrozen([...localEvents.keys()].sort(compareStrings)));
    this.stageExits.set(content.stageId, cloneFrozen([...exits].sort(compareStrings)));
    return success(undefined);
  }

  public getDefinition(stageId: string): NarrativeDefinition | undefined {
    return this.definitions.get(stageId);
  }

  public getChapterId(stageId: string): string | undefined {
    return this.stageChapters.get(stageId);
  }

  public getNpc(id: string): NpcDefinition | undefined {
    return this.npcs.get(id);
  }

  public getDialogue(id: string): DialogueDefinition | undefined {
    return this.dialogues.get(id);
  }

  public getMission(id: string): MissionDefinition | undefined {
    return this.missions.get(id);
  }

  public getEventRule(id: string): StageEventRule | undefined {
    return this.events.get(id);
  }

  public listNpcs(stageId?: string): readonly NpcDefinition[] {
    return this.list(stageId ? this.stageNpcs.get(stageId) ?? [] : [...this.npcs.keys()], this.npcs);
  }

  public listDialogues(stageId?: string): readonly DialogueDefinition[] {
    return this.list(stageId ? this.stageDialogues.get(stageId) ?? [] : [...this.dialogues.keys()], this.dialogues);
  }

  public listMissions(stageId?: string): readonly MissionDefinition[] {
    return this.list(stageId ? this.stageMissions.get(stageId) ?? [] : [...this.missions.keys()], this.missions);
  }

  public listEventRules(stageId?: string): readonly StageEventRule[] {
    return this.list(stageId ? this.stageEvents.get(stageId) ?? [] : [...this.events.keys()], this.events);
  }

  public listExitIds(stageId: string): readonly string[] {
    return this.stageExits.get(stageId) ?? Object.freeze([]);
  }

  private collect<T extends { readonly id: string }>(
    values: readonly T[],
    existing: ReadonlyMap<string, T>,
    path: string,
    diagnostics: NarrativeDiagnostic[],
  ): Map<string, T> {
    const result = new Map<string, T>();
    values.forEach((value, index) => {
      if (!isStableId(value?.id)) {
        diagnostics.push({ code: `narrative.${path}.id.invalid`, message: `${path} id must be stable.`, path: [path, index, 'id'] });
      } else if (existing.has(value.id) || result.has(value.id)) {
        diagnostics.push({ code: `narrative.${path}.id.duplicate`, message: `Duplicate ${path} id: ${value.id}.`,
          path: [path, index, 'id'], referenceId: value.id });
      } else {
        result.set(value.id, value);
      }
    });
    return result;
  }

  private findNonDeclarativeValue(
    value: unknown,
    path: readonly (string | number)[],
    diagnostics: NarrativeDiagnostic[],
    visited: Set<object>,
  ): void {
    if (typeof value === 'function' || typeof value === 'symbol' || typeof value === 'bigint') {
      diagnostics.push({
        code: 'narrative.value.non-declarative',
        message: 'Narrative content may contain only declarative serializable values.',
        path,
      });
      return;
    }
    if (value === null || typeof value !== 'object' || visited.has(value)) return;
    visited.add(value);
    if (Array.isArray(value)) {
      value.forEach((entry, index) => this.findNonDeclarativeValue(entry, [...path, index], diagnostics, visited));
      return;
    }
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      this.findNonDeclarativeValue(entry, [...path, key], diagnostics, visited);
    }
  }

  private validateDefinition(
    definition: NarrativeDefinition,
    candidate: CandidateMaps,
    diagnostics: NarrativeDiagnostic[],
  ): void {
    if (definition.entryDialogueId && !candidate.dialogues.has(definition.entryDialogueId)) {
      diagnostics.push({ code: 'narrative.entry-dialogue.missing', message: 'Entry dialogue is not registered.',
        path: ['definition', 'entryDialogueId'], referenceId: definition.entryDialogueId });
    }
    for (const [flag, value] of Object.entries(definition.flags ?? {})) {
      if (!isStableId(flag) || !isScalar(value)) {
        diagnostics.push({ code: 'narrative.flag.invalid', message: 'Initial flag and value must be serializable.',
          path: ['definition', 'flags', flag], referenceId: flag });
      }
    }
  }

  private validateNpc(
    npc: NpcDefinition,
    candidate: CandidateMaps,
    diagnostics: NarrativeDiagnostic[],
    index: number,
  ): void {
    if (typeof npc.displayName !== 'string' || npc.displayName.trim() === '') {
      diagnostics.push({ code: 'narrative.npc.name.required', message: 'NPC displayName is required.', path: ['npcs', index, 'displayName'] });
    }
    if (npc.interactionDialogueId && !candidate.dialogues.has(npc.interactionDialogueId)) {
      diagnostics.push({ code: 'narrative.npc.dialogue.missing', message: 'NPC dialogue is not registered.',
        path: ['npcs', index, 'interactionDialogueId'], referenceId: npc.interactionDialogueId });
    }
    if (npc.condition) this.validateCondition(npc.condition, candidate, diagnostics, ['npcs', index, 'condition']);
  }

  private validateDialogue(
    dialogue: DialogueDefinition,
    candidate: CandidateMaps,
    diagnostics: NarrativeDiagnostic[],
    dialogueIndex: number,
  ): void {
    const base: readonly (string | number)[] = ['dialogues', dialogueIndex];
    const nodes = new Map<string, typeof dialogue.nodes[number]>();
    dialogue.nodes.forEach((node, nodeIndex) => {
      if (!isStableId(node.id)) {
        diagnostics.push({ code: 'narrative.dialogue.node-id.invalid', message: 'Dialogue node id must be stable.', path: [...base, 'nodes', nodeIndex, 'id'] });
      } else if (nodes.has(node.id)) {
        diagnostics.push({ code: 'narrative.dialogue.node-id.duplicate', message: `Duplicate node id: ${node.id}.`,
          path: [...base, 'nodes', nodeIndex, 'id'], referenceId: node.id });
      } else nodes.set(node.id, node);
    });
    if (!nodes.has(dialogue.startNodeId)) {
      diagnostics.push({ code: 'narrative.dialogue.start.missing', message: 'Dialogue start node is missing.',
        path: [...base, 'startNodeId'], referenceId: dialogue.startNodeId });
    }
    dialogue.nodes.forEach((node, nodeIndex) => {
      const path = [...base, 'nodes', nodeIndex] as const;
      if (node.speakerId !== 'player' && node.speakerId !== 'narrator' && !candidate.npcs.has(node.speakerId)) {
        diagnostics.push({ code: 'narrative.dialogue.speaker.missing', message: 'Dialogue speaker is not registered.',
          path: [...path, 'speakerId'], referenceId: node.speakerId });
      }
      if (typeof node.text !== 'string' || node.text.trim() === '') {
        diagnostics.push({ code: 'narrative.dialogue.text.required', message: 'Dialogue node text is required.', path: [...path, 'text'] });
      }
      if (node.nextNodeId && !nodes.has(node.nextNodeId)) {
        diagnostics.push({ code: 'narrative.dialogue.next.missing', message: 'Dialogue next node is missing.',
          path: [...path, 'nextNodeId'], referenceId: node.nextNodeId });
      }
      if (node.nextNodeId && node.choices && node.choices.length > 0) {
        diagnostics.push({ code: 'narrative.dialogue.transition.ambiguous', message: 'Node cannot have choices and nextNodeId.', path });
      }
      const choiceIds = new Set<string>();
      node.choices?.forEach((choice, choiceIndex) => {
        if (!isStableId(choice.id)) {
          diagnostics.push({ code: 'narrative.dialogue.choice-id.invalid', message: 'Choice id must be stable.', path: [...path, 'choices', choiceIndex, 'id'] });
        } else if (choiceIds.has(choice.id)) {
          diagnostics.push({ code: 'narrative.dialogue.choice-id.duplicate', message: `Duplicate choice id: ${choice.id}.`,
            path: [...path, 'choices', choiceIndex, 'id'], referenceId: choice.id });
        }
        choiceIds.add(choice.id);
        if (!nodes.has(choice.nextNodeId)) {
          diagnostics.push({ code: 'narrative.dialogue.choice-target.missing', message: 'Choice target is missing.',
            path: [...path, 'choices', choiceIndex, 'nextNodeId'], referenceId: choice.nextNodeId });
        }
        if (choice.condition) this.validateCondition(choice.condition, candidate, diagnostics, [...path, 'choices', choiceIndex, 'condition']);
        choice.commands?.forEach((command, commandIndex) =>
          this.validateCommand(command, candidate, diagnostics, [...path, 'choices', choiceIndex, 'commands', commandIndex]));
      });
      node.onEnter?.forEach((command, commandIndex) =>
        this.validateCommand(command, candidate, diagnostics, [...path, 'onEnter', commandIndex]));
    });
    this.validateDialogueGraph(dialogue, nodes, diagnostics, base);
  }

  private validateDialogueGraph(
    dialogue: DialogueDefinition,
    nodes: ReadonlyMap<string, DialogueDefinition['nodes'][number]>,
    diagnostics: NarrativeDiagnostic[],
    base: readonly (string | number)[],
  ): void {
    if (!nodes.has(dialogue.startNodeId)) return;
    const reachable = new Set<string>();
    const visit = (id: string): void => {
      if (reachable.has(id)) return;
      const node = nodes.get(id);
      if (!node) return;
      reachable.add(id);
      if (node.nextNodeId) visit(node.nextNodeId);
      node.choices?.forEach(choice => visit(choice.nextNodeId));
    };
    visit(dialogue.startNodeId);
    for (const node of dialogue.nodes) {
      if (!reachable.has(node.id)) diagnostics.push({ code: 'narrative.dialogue.node.unreachable', message: 'Dialogue node is unreachable.',
        path: [...base, 'nodes'], referenceId: node.id });
    }
    const terminals = [...reachable].filter(id => {
      const node = nodes.get(id)!;
      return !node.nextNodeId && (!node.choices || node.choices.length === 0);
    });
    if (terminals.length === 0) diagnostics.push({ code: 'narrative.dialogue.termination.missing', message: 'Dialogue has no reachable terminal node.', path: base, referenceId: dialogue.id });
    const reverse = new Map<string, string[]>();
    for (const id of reachable) reverse.set(id, []);
    for (const id of reachable) {
      const node = nodes.get(id)!;
      const targets = [node.nextNodeId, ...(node.choices ?? []).map(choice => choice.nextNodeId)]
        .filter((target): target is string => target !== undefined && reachable.has(target));
      targets.forEach(target => reverse.get(target)!.push(id));
    }
    const canTerminate = new Set(terminals);
    const terminalQueue = [...terminals];
    while (terminalQueue.length > 0) {
      const target = terminalQueue.shift()!;
      for (const predecessor of reverse.get(target) ?? []) {
        if (canTerminate.has(predecessor)) continue;
        canTerminate.add(predecessor);
        terminalQueue.push(predecessor);
      }
    }
    for (const id of reachable) {
      if (!canTerminate.has(id)) diagnostics.push({
        code: 'narrative.dialogue.trap-cycle',
        message: 'Dialogue branch cannot reach a terminal node.',
        path: base,
        referenceId: id,
      });
    }

    const visiting = new Set<string>();
    const visited = new Set<string>();
    const walkAutomatic = (id: string): void => {
      if (visiting.has(id)) {
        diagnostics.push({ code: 'narrative.dialogue.automatic-cycle', message: 'Dialogue contains an automatic cycle.', path: base, referenceId: id });
        return;
      }
      if (visited.has(id)) return;
      visited.add(id);
      const node = nodes.get(id);
      if (!node?.nextNodeId || (node.choices?.length ?? 0) > 0) return;
      visiting.add(id);
      walkAutomatic(node.nextNodeId);
      visiting.delete(id);
    };
    reachable.forEach(walkAutomatic);
  }

  private validateMission(
    mission: MissionDefinition,
    candidate: CandidateMaps,
    diagnostics: NarrativeDiagnostic[],
    missionIndex: number,
  ): void {
    const base: readonly (string | number)[] = ['missions', missionIndex];
    if (!Array.isArray(mission.objectives) || mission.objectives.length === 0) {
      diagnostics.push({ code: 'narrative.mission.objective.required', message: 'Mission requires at least one objective.', path: [...base, 'objectives'] });
      return;
    }
    const ids = new Set<string>();
    let required = 0;
    mission.objectives.forEach((objective, index) => {
      const path = [...base, 'objectives', index] as const;
      if (!isStableId(objective.id)) diagnostics.push({ code: 'narrative.mission.objective-id.invalid', message: 'Objective id must be stable.', path: [...path, 'id'] });
      else if (ids.has(objective.id)) diagnostics.push({ code: 'narrative.mission.objective-id.duplicate', message: `Duplicate objective id: ${objective.id}.`, path: [...path, 'id'], referenceId: objective.id });
      ids.add(objective.id);
      if (!Number.isSafeInteger(objective.target) || objective.target <= 0) diagnostics.push({ code: 'narrative.mission.target.invalid', message: 'Objective target must be a positive safe integer.', path: [...path, 'target'] });
      if (!objective.optional) required += 1;
      if (!(objective.signal in SIGNAL_FIELDS)) diagnostics.push({ code: 'narrative.signal.unknown', message: 'Objective signal is unknown.', path: [...path, 'signal'] });
      if (objective.filter) this.validateFilter(objective.signal, objective.filter, diagnostics, [...path, 'filter']);
    });
    if (required === 0) diagnostics.push({ code: 'narrative.mission.required-objective.missing', message: 'Mission requires at least one non-optional objective.', path: [...base, 'objectives'] });
    mission.rewards?.forEach((reward, index) =>
      this.validateReward(reward, diagnostics, [...base, 'rewards', index]));
  }

  private validateEvent(
    event: StageEventRule,
    candidate: CandidateMaps,
    diagnostics: NarrativeDiagnostic[],
    eventIndex: number,
  ): void {
    const base: readonly (string | number)[] = ['events', eventIndex];
    if (!(event.when in SIGNAL_FIELDS)) diagnostics.push({ code: 'narrative.signal.unknown', message: 'Event signal is unknown.', path: [...base, 'when'] });
    if (event.filter) this.validateFilter(event.when, event.filter, diagnostics, [...base, 'filter']);
    if (event.condition) this.validateCondition(event.condition, candidate, diagnostics, [...base, 'condition']);
    if (!Array.isArray(event.commands) || event.commands.length === 0) diagnostics.push({ code: 'narrative.event.command.required', message: 'Event rule requires at least one command.', path: [...base, 'commands'] });
    event.commands?.forEach((command, index) => this.validateCommand(command, candidate, diagnostics, [...base, 'commands', index]));
  }

  private validateFilter(signal: StageSignal['type'], filter: { readonly field: string; readonly equals: string }, diagnostics: NarrativeDiagnostic[], path: readonly (string | number)[]): void {
    if (!SIGNAL_FIELDS[signal]?.includes(filter.field)) diagnostics.push({ code: 'narrative.filter.field.invalid', message: `Field ${filter.field} does not exist on ${signal}.`, path: [...path, 'field'], referenceId: filter.field });
    if (typeof filter.equals !== 'string' || filter.equals.length === 0) diagnostics.push({ code: 'narrative.filter.value.invalid', message: 'Filter equals must be a non-empty string.', path: [...path, 'equals'] });
  }

  private validateCondition(condition: StageCondition, candidate: CandidateMaps, diagnostics: NarrativeDiagnostic[], path: readonly (string | number)[], depth = 0): void {
    if (depth > 32) {
      diagnostics.push({ code: 'narrative.condition.depth', message: 'Condition nesting exceeds 32 levels.', path });
      return;
    }
    if (!condition || typeof condition !== 'object' || !['mission.status', 'flag.equals', 'progression.unlocked', 'all', 'any', 'not'].includes((condition as { type?: string }).type ?? '')) {
      diagnostics.push({ code: 'narrative.condition.unknown', message: 'Unknown narrative condition.', path });
      return;
    }
    if (condition.type === 'mission.status' && !candidate.missions.has(condition.missionId)) diagnostics.push({ code: 'narrative.condition.mission.missing', message: 'Condition mission is not registered.', path, referenceId: condition.missionId });
    else if (condition.type === 'flag.equals' && (!isStableId(condition.flag) || !isScalar(condition.value))) diagnostics.push({ code: 'narrative.condition.flag.invalid', message: 'Flag condition is invalid.', path, referenceId: condition.flag });
    else if (condition.type === 'progression.unlocked' && !isStableId(condition.contentId)) diagnostics.push({ code: 'narrative.condition.content-id.invalid', message: 'Progression contentId is invalid.', path, referenceId: condition.contentId });
    else if (condition.type === 'all' || condition.type === 'any') {
      if (condition.conditions.length === 0) diagnostics.push({ code: 'narrative.condition.empty', message: 'Composite condition cannot be empty.', path });
      condition.conditions.forEach((child, index) => this.validateCondition(child, candidate, diagnostics, [...path, 'conditions', index], depth + 1));
    } else if (condition.type === 'not') this.validateCondition(condition.condition, candidate, diagnostics, [...path, 'condition'], depth + 1);
  }

  private validateCommand(command: StageCommand, candidate: CandidateMaps, diagnostics: NarrativeDiagnostic[], path: readonly (string | number)[]): void {
    if (!command || typeof command !== 'object' || typeof (command as { type?: unknown }).type !== 'string') {
      diagnostics.push({ code: 'narrative.command.invalid', message: 'Command must be a discriminated object.', path });
      return;
    }
    const allowedFields: Readonly<Record<StageCommand['type'], readonly string[]>> = {
      'dialogue.start': ['type', 'dialogueId'],
      'mission.start': ['type', 'missionId'],
      'mission.advance': ['type', 'missionId', 'objectiveId', 'amount'],
      'flag.set': ['type', 'flag', 'value'],
      'exit.unlock': ['type', 'exitId'],
      'stage.complete': ['type', 'exitId'],
      'reward.grant': ['type', 'reward', 'operationId'],
    };
    const knownFields = allowedFields[command.type];
    if (knownFields) {
      for (const field of Object.keys(command)) {
        if (!knownFields.includes(field)) diagnostics.push({
          code: 'narrative.command.field.unknown',
          message: `Command field is not part of ${command.type}: ${field}.`,
          path: [...path, field],
          referenceId: field,
        });
      }
    }
    switch (command.type) {
      case 'dialogue.start':
        if (!candidate.dialogues.has(command.dialogueId)) diagnostics.push({ code: 'narrative.command.dialogue.missing', message: 'Command dialogue is not registered.', path, referenceId: command.dialogueId });
        break;
      case 'mission.start':
        if (!candidate.missions.has(command.missionId)) diagnostics.push({ code: 'narrative.command.mission.missing', message: 'Command mission is not registered.', path, referenceId: command.missionId });
        break;
      case 'mission.advance': {
        const mission = candidate.missions.get(command.missionId);
        if (!mission) diagnostics.push({ code: 'narrative.command.mission.missing', message: 'Command mission is not registered.', path, referenceId: command.missionId });
        else if (!mission.objectives.some(objective => objective.id === command.objectiveId)) diagnostics.push({ code: 'narrative.command.objective.missing', message: 'Command objective is not registered.', path, referenceId: command.objectiveId });
        if (!Number.isSafeInteger(command.amount) || command.amount <= 0) diagnostics.push({ code: 'narrative.command.amount.invalid', message: 'Mission advance amount must be positive.', path });
        break;
      }
      case 'flag.set':
        if (!isStableId(command.flag) || !isScalar(command.value)) diagnostics.push({ code: 'narrative.command.flag.invalid', message: 'Flag command is invalid.', path });
        break;
      case 'exit.unlock':
      case 'stage.complete':
        if (!candidate.exits.has(command.exitId)) diagnostics.push({ code: 'narrative.command.exit.missing', message: 'Command exit is not registered.', path, referenceId: command.exitId });
        break;
      case 'reward.grant':
        if (!isStableId(command.operationId)) diagnostics.push({ code: 'narrative.command.operation-id.invalid', message: 'Reward operationId must be stable.', path, referenceId: command.operationId });
        this.validateReward(command.reward, diagnostics, [...path, 'reward']);
        break;
      default:
        diagnostics.push({ code: 'narrative.command.unknown', message: 'Unknown narrative command.', path, referenceId: (command as { type: string }).type });
    }
  }

  private validateReward(
    reward: StageReward,
    diagnostics: NarrativeDiagnostic[],
    path: readonly (string | number)[],
  ): void {
    if (reward.type === 'progression.currency' && (!Number.isSafeInteger(reward.amount) || reward.amount <= 0)) {
      diagnostics.push({ code: 'narrative.reward.amount.invalid', message: 'Currency reward must be a positive safe integer.', path: [...path, 'amount'] });
    } else if (reward.type === 'stage.flag' && (!isStableId(reward.flag) || !isScalar(reward.value))) {
      diagnostics.push({ code: 'narrative.reward.flag.invalid', message: 'Flag reward must use a stable id and scalar value.', path });
    } else if (reward.type === 'progression.unlock' && !isStableId(reward.contentId)) {
      diagnostics.push({ code: 'narrative.reward.content-id.invalid', message: 'Unlock reward requires a stable contentId.', path: [...path, 'contentId'] });
    }
  }

  private commit<T>(source: ReadonlyMap<string, T>, target: Map<string, T>): void {
    source.forEach((value, id) => target.set(id, cloneFrozen(value)));
  }

  private list<T>(ids: readonly string[], values: ReadonlyMap<string, T>): readonly T[] {
    return Object.freeze([...ids].sort(compareStrings).map(id => values.get(id)).filter((value): value is T => value !== undefined));
  }
}
