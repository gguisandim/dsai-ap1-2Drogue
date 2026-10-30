import { GENERATION_PRESETS } from '../../procedural';
import type {
  ChapterManifest,
  StageCapabilityCategory,
  StageCapabilityRequirement,
  StageAnchor,
  StageCondition,
  StageDiagnostic,
  StageId,
  StageModule,
  StageRuntimeCapabilityProfile,
} from '../contracts';
import {
  DEFAULT_STAGE_RUNTIME_CAPABILITIES,
  enemyCapabilityId,
  itemCapabilityId,
  tileCapabilityId,
} from './StageRuntimeCapabilities';
import { StageVisualRegistry } from './StageVisualRegistry';

const STABLE_ID = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/;
const PRESET_IDS = new Set<string>(GENERATION_PRESETS.map(preset => preset.id));
const CAPABILITY_CATEGORIES = new Set<StageCapabilityCategory>([
  'tile', 'theme', 'biome', 'enemy', 'item', 'audio', 'lighting',
  'effect', 'npc', 'interaction', 'narrative', 'navigation',
]);
const CONDITION_TYPES = new Set([
  'flag.equals', 'mission.status', 'progression.unlocked', 'all', 'any', 'not',
]);
const MISSION_STATUSES = new Set(['locked', 'available', 'active', 'completed', 'failed']);

function isStableId(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value === value.trim() && STABLE_ID.test(value);
}

function isPositiveRevision(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1;
}

function isOrder(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

function isFiniteOffset(value: unknown): value is number | undefined {
  return value === undefined || (typeof value === 'number' && Number.isFinite(value));
}

function anchorIsValid(anchor: StageAnchor): boolean {
  if (!anchor || typeof anchor !== 'object') return false;
  if (anchor.kind === 'map-exit') return true;
  if (anchor.kind === 'player-spawn') {
    return isFiniteOffset(anchor.offsetX) && isFiniteOffset(anchor.offsetY);
  }
  return anchor.kind === 'tile' && Number.isInteger(anchor.x) && anchor.x >= 0 &&
    Number.isInteger(anchor.y) && anchor.y >= 0;
}

function diagnosticKey(diagnostic: StageDiagnostic): string {
  return [
    diagnostic.path.map(String).join('.'),
    diagnostic.code,
    diagnostic.stageId ?? '',
    diagnostic.referenceId ?? '',
    diagnostic.message,
  ].join('|');
}

function compareIds(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function sortDiagnostics(diagnostics: StageDiagnostic[]): readonly StageDiagnostic[] {
  diagnostics.sort((left, right) => {
    const leftKey = diagnosticKey(left);
    const rightKey = diagnosticKey(right);
    return leftKey < rightKey ? -1 : leftKey > rightKey ? 1 : 0;
  });
  return Object.freeze(diagnostics.map(diagnostic => Object.freeze({ ...diagnostic })));
}

export class StageValidator {
  private readonly runtimeCapabilities: ReadonlyMap<string, StageRuntimeCapabilityProfile['capabilities'][number]>;

  public constructor(
    capabilityProfile: StageRuntimeCapabilityProfile = DEFAULT_STAGE_RUNTIME_CAPABILITIES,
  ) {
    this.runtimeCapabilities = new Map(capabilityProfile.capabilities.map(capability => [capability.id, capability]));
  }

  public validateModule(module: StageModule): readonly StageDiagnostic[] {
    const diagnostics: StageDiagnostic[] = [];
    this.validateStageModule(module, diagnostics);
    return sortDiagnostics(diagnostics);
  }

  public validate(
    chapters: readonly ChapterManifest[],
    modules: readonly StageModule[],
  ): readonly StageDiagnostic[] {
    const diagnostics: StageDiagnostic[] = [];
    const moduleById = new Map<StageId, StageModule>();
    const chapterById = new Map<string, ChapterManifest>();

    modules.forEach((module, index) => {
      this.validateStageModule(module, diagnostics);
      if (moduleById.has(module.manifest.id)) {
        diagnostics.push({
          code: 'registry.stage.duplicate',
          severity: 'error',
          message: `Stage id is registered more than once: ${module.manifest.id}`,
          path: ['stages', index, 'manifest', 'id'],
          stageId: module.manifest.id,
        });
      } else {
        moduleById.set(module.manifest.id, module);
      }
    });

    chapters.forEach((chapter, index) => {
      if (chapterById.has(chapter.id)) {
        diagnostics.push({
          code: 'registry.chapter.duplicate',
          severity: 'error',
          message: `Chapter id is registered more than once: ${chapter.id}`,
          path: ['chapters', index, 'id'],
          referenceId: chapter.id,
        });
      } else {
        chapterById.set(chapter.id, chapter);
      }
    });
    chapters.forEach(chapter => this.validateChapter(chapter, chapterById, moduleById, diagnostics));

    const visuals = new StageVisualRegistry();
    chapters.forEach(chapter => visuals.registerChapter(chapter));
    diagnostics.push(...visuals.diagnostics());
    modules.forEach(module => diagnostics.push(...visuals.validateManifest(module.manifest)));

    for (const module of moduleById.values()) {
      if (!chapterById.has(module.manifest.chapterId)) {
        diagnostics.push({
          code: 'stage.chapter.missing',
          severity: 'error',
          message: `Stage references an unregistered chapter: ${module.manifest.chapterId}`,
          path: ['stages', module.manifest.id, 'manifest', 'chapterId'],
          stageId: module.manifest.id,
          referenceId: module.manifest.chapterId,
        });
      }
      module.manifest.exits.forEach((exit, exitIndex) => {
        if (exit.targetStageId !== 'campaign.complete' && !moduleById.has(exit.targetStageId)) {
          diagnostics.push({
            code: 'stage.exit.target-missing',
            severity: 'error',
            message: `Exit references an unregistered stage: ${exit.targetStageId}`,
            path: ['stages', module.manifest.id, 'manifest', 'exits', exitIndex, 'targetStageId'],
            stageId: module.manifest.id,
            referenceId: exit.targetStageId,
          });
        } else if (exit.targetStageId !== 'campaign.complete') {
          const target = moduleById.get(exit.targetStageId);
          if (target && target.manifest.chapterId !== module.manifest.chapterId) {
            const sourceChapter = chapterById.get(module.manifest.chapterId);
            const dependency = sourceChapter?.dependencies?.find(item =>
              item.chapterId === target.manifest.chapterId && !item.optional);
            if (!dependency) diagnostics.push({
              code: 'stage.exit.chapter-dependency-missing',
              severity: 'error',
              message: `Cross-chapter exit requires an explicit dependency on ${target.manifest.chapterId}.`,
              path: ['stages', module.manifest.id, 'manifest', 'exits', exitIndex, 'targetStageId'],
              stageId: module.manifest.id,
              referenceId: target.manifest.chapterId,
            });
          }
        }
      });
    }

    return sortDiagnostics(diagnostics);
  }

  private validateStageModule(module: StageModule, diagnostics: StageDiagnostic[]): void {
    const manifest = module.manifest;
    const stageId = manifest.id;
    const schemaVersion = (manifest as unknown as { schemaVersion?: unknown }).schemaVersion;

    if (schemaVersion !== 1) {
      diagnostics.push({
        code: 'stage.schema-version.unsupported',
        severity: 'error',
        message: 'Stage schemaVersion must be 1.',
        path: ['manifest', 'schemaVersion'],
        stageId,
      });
    }
    if (!isStableId(stageId)) {
      diagnostics.push({
        code: 'stage.id.invalid',
        severity: 'error',
        message: 'Stage id must be a stable lowercase identifier.',
        path: ['manifest', 'id'],
        stageId,
      });
    }
    if (!isPositiveRevision(manifest.revision)) {
      diagnostics.push({
        code: 'stage.revision.invalid',
        severity: 'error',
        message: 'Stage revision must be an integer greater than zero.',
        path: ['manifest', 'revision'],
        stageId,
      });
    }
    if (!isStableId(manifest.chapterId)) {
      diagnostics.push({
        code: 'stage.chapter-id.invalid',
        severity: 'error',
        message: 'Stage chapterId must be a stable lowercase identifier.',
        path: ['manifest', 'chapterId'],
        stageId,
      });
    }
    if (!isOrder(manifest.order)) {
      diagnostics.push({
        code: 'stage.order.invalid',
        severity: 'error',
        message: 'Stage order must be a non-negative integer.',
        path: ['manifest', 'order'],
        stageId,
      });
    }
    if (typeof manifest.title !== 'string' || manifest.title.trim().length === 0) {
      diagnostics.push({
        code: 'stage.title.required',
        severity: 'error',
        message: 'Stage title is required.',
        path: ['manifest', 'title'],
        stageId,
      });
    }
    if (typeof manifest.summary !== 'string' || manifest.summary.trim().length === 0) {
      diagnostics.push({
        code: 'stage.summary.required',
        severity: 'error',
        message: 'Stage summary is required.',
        path: ['manifest', 'summary'],
        stageId,
      });
    }

    this.validateCapabilities(manifest.capabilities, ['manifest', 'capabilities'], stageId, diagnostics);

    if (manifest.layout.kind === 'authored') {
      if (!module.authoredLevel) {
        diagnostics.push({
          code: 'stage.layout.authored-level-required',
          severity: 'error',
          message: 'Authored stages require authoredLevel on the StageModule.',
          path: ['authoredLevel'],
          stageId,
        });
      }
      if (module.authoredLevel) this.validateAuthoredCapabilities(module, diagnostics);
    } else if (module.authoredLevel) {
      diagnostics.push({
        code: 'stage.layout.authored-level-unexpected',
        severity: 'error',
        message: 'Only authored layouts may provide authoredLevel.',
        path: ['authoredLevel'],
        stageId,
      });
    }

    if (manifest.layout.kind === 'legacy' && !isStableId(manifest.layout.levelId)) {
      diagnostics.push({
        code: 'stage.layout.legacy-level-id-invalid',
        severity: 'error',
        message: 'Legacy layouts require a stable levelId.',
        path: ['manifest', 'layout', 'levelId'],
        stageId,
      });
    }
    if (manifest.layout.kind === 'procedural') {
      if (!PRESET_IDS.has(manifest.layout.preset)) {
        diagnostics.push({
          code: 'stage.layout.procedural-preset-unknown',
          severity: 'error',
          message: `Unknown procedural preset: ${manifest.layout.preset}`,
          path: ['manifest', 'layout', 'preset'],
          stageId,
          referenceId: manifest.layout.preset,
        });
      }
      if (manifest.layout.seed !== 'run') {
        diagnostics.push({
          code: 'stage.layout.procedural-seed-invalid',
          severity: 'error',
          message: 'Procedural stage manifests must use the run seed.',
          path: ['manifest', 'layout', 'seed'],
          stageId,
        });
      }
      if (manifest.layout.overrides && 'seed' in manifest.layout.overrides) {
        diagnostics.push({
          code: 'stage.layout.procedural-seed-override',
          severity: 'error',
          message: 'Procedural overrides cannot replace the run seed.',
          path: ['manifest', 'layout', 'overrides', 'seed'],
          stageId,
        });
      }
    }

    if (!Array.isArray(manifest.exits) || manifest.exits.length === 0) {
      diagnostics.push({
        code: 'stage.exit.required',
        severity: 'error',
        message: 'Every stage requires at least one exit route.',
        path: ['manifest', 'exits'],
        stageId,
      });
      return;
    }

    const exitIds = new Set<string>();
    const flags = new Set(Object.keys(module.narrative?.flags ?? {}));
    const missions = new Set((module.missions ?? []).map(mission => mission.id));
    manifest.exits.forEach((exit, index) => {
      if (!isStableId(exit.id)) {
        diagnostics.push({
          code: 'stage.exit.id.invalid',
          severity: 'error',
          message: 'Exit id must be a stable lowercase identifier.',
          path: ['manifest', 'exits', index, 'id'],
          stageId,
        });
      } else if (exitIds.has(exit.id)) {
        diagnostics.push({
          code: 'stage.exit.id.duplicate',
          severity: 'error',
          message: `Exit id is duplicated inside the stage: ${exit.id}`,
          path: ['manifest', 'exits', index, 'id'],
          stageId,
          referenceId: exit.id,
        });
      }
      exitIds.add(exit.id);

      if (!anchorIsValid(exit.anchor)) {
        diagnostics.push({
          code: 'stage.exit.anchor.invalid',
          severity: 'error',
          message: 'Exit anchor is invalid.',
          path: ['manifest', 'exits', index, 'anchor'],
          stageId,
          referenceId: exit.id,
        });
      }
      if (exit.targetStageId !== 'campaign.complete' && !isStableId(exit.targetStageId)) {
        diagnostics.push({
          code: 'stage.exit.target-id.invalid',
          severity: 'error',
          message: 'Exit target must be a stable stage id or campaign.complete.',
          path: ['manifest', 'exits', index, 'targetStageId'],
          stageId,
          referenceId: exit.targetStageId,
        });
      }
      if (exit.condition !== undefined) this.validateCondition(
        exit.condition,
        flags,
        missions,
        diagnostics,
        ['manifest', 'exits', index, 'condition'],
        stageId,
        exit.id,
      );
    });

    this.validateLocalConditionReferences(module, flags, missions, diagnostics);
    if (manifest.entryDialogueId && !(module.dialogues ?? []).some(item => item.id === manifest.entryDialogueId)) {
      diagnostics.push({
        code: 'stage.entry-dialogue.missing', severity: 'error',
        message: 'Stage entryDialogueId is not declared by the module.',
        path: ['manifest', 'entryDialogueId'], stageId, referenceId: manifest.entryDialogueId,
      });
    }
    if (manifest.completionMissionId && !missions.has(manifest.completionMissionId)) {
      diagnostics.push({
        code: 'stage.completion-mission.missing', severity: 'error',
        message: 'Stage completionMissionId is not declared by the module.',
        path: ['manifest', 'completionMissionId'], stageId, referenceId: manifest.completionMissionId,
      });
    }
  }

  private validateCapabilities(
    requirements: readonly StageCapabilityRequirement[] | undefined,
    path: readonly (string | number)[],
    stageId: StageId | undefined,
    diagnostics: StageDiagnostic[],
  ): void {
    if (requirements === undefined) return;
    if (!Array.isArray(requirements)) {
      diagnostics.push({
        code: 'capability.requirements.invalid', severity: 'error',
        message: 'Capabilities must be an array.', path, ...(stageId ? { stageId } : {}),
      });
      return;
    }
    const seen = new Set<string>();
    requirements.forEach((requirement, index) => {
      const itemPath = [...path, index];
      if (!requirement || typeof requirement !== 'object') {
        diagnostics.push({
          code: 'capability.requirement.invalid', severity: 'error',
          message: 'Capability requirement must be an object.', path: itemPath,
          ...(stageId ? { stageId } : {}),
        });
        return;
      }
      const id = (requirement as { id?: unknown }).id;
      const category = (requirement as { category?: unknown }).category;
      const minimumVersion = (requirement as { minimumVersion?: unknown }).minimumVersion;
      const kind = (requirement as { requirement?: unknown }).requirement;
      if (!isStableId(id)) diagnostics.push({
        code: 'capability.id.invalid', severity: 'error', message: 'Capability id must be stable.',
        path: [...itemPath, 'id'], ...(stageId ? { stageId } : {}),
      });
      if (!CAPABILITY_CATEGORIES.has(category as StageCapabilityCategory)) diagnostics.push({
        code: 'capability.category.unknown', severity: 'error', message: 'Capability category is unknown.',
        path: [...itemPath, 'category'], ...(stageId ? { stageId } : {}), referenceId: String(category),
      });
      if (!isPositiveRevision(minimumVersion)) diagnostics.push({
        code: 'capability.version.invalid', severity: 'error', message: 'Capability minimumVersion must be positive.',
        path: [...itemPath, 'minimumVersion'], ...(stageId ? { stageId } : {}),
      });
      if (kind !== 'required' && kind !== 'optional') diagnostics.push({
        code: 'capability.requirement-kind.invalid', severity: 'error',
        message: 'Capability requirement must be required or optional.',
        path: [...itemPath, 'requirement'], ...(stageId ? { stageId } : {}),
      });
      if (!isStableId(id)) return;
      if (seen.has(id)) diagnostics.push({
        code: 'capability.id.duplicate', severity: 'error', message: `Capability is declared twice: ${id}.`,
        path: [...itemPath, 'id'], ...(stageId ? { stageId } : {}), referenceId: id,
      });
      seen.add(id);
      const runtime = this.runtimeCapabilities.get(id);
      if (!runtime) {
        diagnostics.push({
          code: 'capability.unknown', severity: 'error', message: `Runtime does not recognize capability ${id}.`,
          path: itemPath, ...(stageId ? { stageId } : {}), referenceId: id,
        });
        return;
      }
      if (runtime.category !== category) diagnostics.push({
        code: 'capability.category.mismatch', severity: 'error',
        message: `Capability ${id} belongs to ${runtime.category}, not ${String(category)}.`,
        path: [...itemPath, 'category'], ...(stageId ? { stageId } : {}), referenceId: id,
      });
      if (!isPositiveRevision(minimumVersion) || (kind !== 'required' && kind !== 'optional')) return;
      if (runtime.status !== 'supported') diagnostics.push({
        code: 'capability.unavailable', severity: kind === 'optional' ? 'warning' : 'error',
        message: `Capability ${id} is planned but not implemented.`, path: itemPath,
        ...(stageId ? { stageId } : {}), referenceId: id,
      });
      else if (runtime.version < minimumVersion) diagnostics.push({
        code: 'capability.version.unsupported', severity: kind === 'optional' ? 'warning' : 'error',
        message: `Capability ${id} supports version ${runtime.version}, below ${minimumVersion}.`,
        path: [...itemPath, 'minimumVersion'], ...(stageId ? { stageId } : {}), referenceId: id,
      });
    });
  }

  private validateAuthoredCapabilities(module: StageModule, diagnostics: StageDiagnostic[]): void {
    const level = module.authoredLevel!;
    const stageId = module.manifest.id;
    level.tileMap?.forEach((row, y) => row.forEach((tile, x) => {
      const id = tileCapabilityId(tile);
      if (!id || this.runtimeCapabilities.get(id)?.status !== 'supported') diagnostics.push({
        code: 'stage.content.tile.unsupported', severity: 'error',
        message: `Authored tile is not supported by the runtime: ${tile}.`,
        path: ['authoredLevel', 'tileMap', y, x], stageId, referenceId: String(tile),
      });
    }));
    const enemyGroups = [
      { enemies: level.enemies ?? [], path: ['authoredLevel', 'enemies'] as const },
      { enemies: level.ambush ?? [], path: ['authoredLevel', 'ambush'] as const },
      ...(level.waves ?? []).map((wave, index) => ({
        enemies: wave.enemies ?? [], path: ['authoredLevel', 'waves', index, 'enemies'] as const,
      })),
    ];
    enemyGroups.forEach(group => group.enemies.forEach((enemy, index) => {
      const id = enemyCapabilityId(enemy.type);
      if (this.runtimeCapabilities.get(id)?.status !== 'supported') diagnostics.push({
        code: 'stage.content.enemy.unsupported', severity: 'error',
        message: `Enemy archetype has no explicit runtime implementation: ${enemy.type}.`,
        path: [...group.path, index, 'type'], stageId, referenceId: enemy.type,
      });
    }));
    (level.items ?? []).forEach((item, index) => {
      const id = itemCapabilityId(item.type);
      if (this.runtimeCapabilities.get(id)?.status !== 'supported') diagnostics.push({
        code: 'stage.content.item.unsupported', severity: 'error',
        message: `Item type has no explicit runtime implementation: ${item.type}.`,
        path: ['authoredLevel', 'items', index, 'type'], stageId, referenceId: item.type,
      });
    });
  }

  private validateCondition(
    condition: unknown,
    flags: ReadonlySet<string>,
    missions: ReadonlySet<string>,
    diagnostics: StageDiagnostic[],
    path: readonly (string | number)[],
    stageId: StageId,
    ownerId?: string,
    depth = 0,
  ): void {
    const add = (code: string, message: string, referenceId?: string, suffix: readonly (string | number)[] = []): void => {
      diagnostics.push({ code, severity: 'error', message, path: [...path, ...suffix], stageId,
        ...(referenceId ? { referenceId } : ownerId ? { referenceId: ownerId } : {}) });
    };
    if (depth > 32) {
      add('stage.condition.depth-exceeded', 'Condition nesting exceeds 32 levels.');
      return;
    }
    if (!condition || typeof condition !== 'object' || Array.isArray(condition)) {
      add('stage.condition.invalid', 'Condition must be a discriminated object.');
      return;
    }
    const value = condition as Record<string, unknown>;
    if (typeof value.type !== 'string' || !CONDITION_TYPES.has(value.type)) {
      add('stage.condition.unknown', 'Condition type is unknown.', String(value.type), ['type']);
      return;
    }
    if (value.type === 'flag.equals') {
      if (!isStableId(value.flag) || !['boolean', 'number', 'string'].includes(typeof value.value)) {
        add('stage.condition.flag.invalid', 'Flag condition requires a stable flag and scalar value.', String(value.flag));
      } else if (!flags.has(value.flag)) {
        add('stage.condition.flag.missing', 'Condition references an undeclared stage flag.', value.flag, ['flag']);
      }
    } else if (value.type === 'mission.status') {
      if (!isStableId(value.missionId) || !MISSION_STATUSES.has(String(value.status))) {
        add('stage.condition.mission.invalid', 'Mission condition is invalid.', String(value.missionId));
      } else if (!missions.has(value.missionId)) {
        add('stage.condition.mission.missing', 'Condition references an undeclared mission.', value.missionId, ['missionId']);
      }
    } else if (value.type === 'progression.unlocked') {
      if (!isStableId(value.contentId)) add(
        'stage.condition.content-id.invalid', 'Progression condition requires a stable contentId.',
        String(value.contentId), ['contentId'],
      );
    } else if (value.type === 'all' || value.type === 'any') {
      if (!Array.isArray(value.conditions) || value.conditions.length === 0) {
        add('stage.condition.composite.empty', 'Composite condition requires at least one child.', ownerId, ['conditions']);
      } else value.conditions.forEach((child, index) => this.validateCondition(
        child, flags, missions, diagnostics, [...path, 'conditions', index], stageId, ownerId, depth + 1,
      ));
    } else if (value.type === 'not') {
      this.validateCondition(value.condition, flags, missions, diagnostics, [...path, 'condition'], stageId, ownerId, depth + 1);
    }
  }

  private validateLocalConditionReferences(
    module: StageModule,
    flags: ReadonlySet<string>,
    missions: ReadonlySet<string>,
    diagnostics: StageDiagnostic[],
  ): void {
    const stageId = module.manifest.id;
    (module.npcs ?? []).forEach((npc, index) => {
      if (npc.condition) this.validateCondition(npc.condition, flags, missions, diagnostics,
        ['npcs', index, 'condition'], stageId, npc.id);
    });
    (module.dialogues ?? []).forEach((dialogue, dialogueIndex) => dialogue.nodes.forEach((node, nodeIndex) =>
      (node.choices ?? []).forEach((choice, choiceIndex) => {
        if (choice.condition) this.validateCondition(choice.condition, flags, missions, diagnostics,
          ['dialogues', dialogueIndex, 'nodes', nodeIndex, 'choices', choiceIndex, 'condition'], stageId, choice.id);
      })));
    (module.events ?? []).forEach((event, index) => {
      if (event.condition) this.validateCondition(event.condition, flags, missions, diagnostics,
        ['events', index, 'condition'], stageId, event.id);
    });
  }

  private validateDependencies(
    chapter: ChapterManifest,
    chapterById: ReadonlyMap<string, ChapterManifest>,
    diagnostics: StageDiagnostic[],
  ): void {
    if (chapter.dependencies === undefined) return;
    if (!Array.isArray(chapter.dependencies)) {
      diagnostics.push({ code: 'chapter.dependencies.invalid', severity: 'error',
        message: 'Chapter dependencies must be an array.', path: ['chapters', chapter.id, 'dependencies'],
        referenceId: chapter.id });
      return;
    }
    const seen = new Set<string>();
    chapter.dependencies.forEach((dependency, index) => {
      const path = ['chapters', chapter.id, 'dependencies', index] as const;
      if (!isStableId(dependency.chapterId)) diagnostics.push({
        code: 'chapter.dependency.id.invalid', severity: 'error', message: 'Dependency chapterId must be stable.',
        path: [...path, 'chapterId'], referenceId: String(dependency.chapterId),
      });
      if (!isPositiveRevision(dependency.minimumRevision)) diagnostics.push({
        code: 'chapter.dependency.revision.invalid', severity: 'error',
        message: 'Dependency minimumRevision must be positive.', path: [...path, 'minimumRevision'],
        referenceId: dependency.chapterId,
      });
      if (seen.has(dependency.chapterId)) diagnostics.push({
        code: 'chapter.dependency.duplicate', severity: 'error', message: 'Chapter dependency is duplicated.',
        path: [...path, 'chapterId'], referenceId: dependency.chapterId,
      });
      seen.add(dependency.chapterId);
      if (dependency.chapterId === chapter.id) diagnostics.push({
        code: 'chapter.dependency.self', severity: 'error', message: 'Chapter cannot depend on itself.',
        path: [...path, 'chapterId'], referenceId: dependency.chapterId,
      });
      const target = chapterById.get(dependency.chapterId);
      if (!target && !dependency.optional) diagnostics.push({
        code: 'chapter.dependency.missing', severity: 'error', message: 'Required chapter dependency is not registered.',
        path: [...path, 'chapterId'], referenceId: dependency.chapterId,
      });
      else if (target && isPositiveRevision(dependency.minimumRevision) && target.revision < dependency.minimumRevision) {
        diagnostics.push({
          code: 'chapter.dependency.revision.unsupported', severity: dependency.optional ? 'warning' : 'error',
          message: `Chapter ${dependency.chapterId} revision ${target.revision} is below ${dependency.minimumRevision}.`,
          path: [...path, 'minimumRevision'], referenceId: dependency.chapterId,
        });
      }
    });
  }

  private validateChapter(
    chapter: ChapterManifest,
    chapterById: ReadonlyMap<string, ChapterManifest>,
    moduleById: ReadonlyMap<StageId, StageModule>,
    diagnostics: StageDiagnostic[],
  ): void {
    const schemaVersion = (chapter as unknown as { schemaVersion?: unknown }).schemaVersion;
    if (schemaVersion !== 1) {
      diagnostics.push({
        code: 'chapter.schema-version.unsupported',
        severity: 'error',
        message: 'Chapter schemaVersion must be 1.',
        path: ['chapters', chapter.id, 'schemaVersion'],
        referenceId: chapter.id,
      });
    }
    if (!isStableId(chapter.id)) {
      diagnostics.push({
        code: 'chapter.id.invalid',
        severity: 'error',
        message: 'Chapter id must be a stable lowercase identifier.',
        path: ['chapters', chapter.id, 'id'],
        referenceId: chapter.id,
      });
    }
    if (!isPositiveRevision(chapter.revision)) {
      diagnostics.push({
        code: 'chapter.revision.invalid',
        severity: 'error',
        message: 'Chapter revision must be an integer greater than zero.',
        path: ['chapters', chapter.id, 'revision'],
        referenceId: chapter.id,
      });
    }
    if (typeof chapter.title !== 'string' || chapter.title.trim().length === 0) {
      diagnostics.push({
        code: 'chapter.title.required',
        severity: 'error',
        message: 'Chapter title is required.',
        path: ['chapters', chapter.id, 'title'],
        referenceId: chapter.id,
      });
    }
    this.validateCapabilities(chapter.capabilities, ['chapters', chapter.id, 'capabilities'], undefined, diagnostics);
    this.validateDependencies(chapter, chapterById, diagnostics);
    if (!Array.isArray(chapter.stageIds) || chapter.stageIds.length === 0) {
      diagnostics.push({
        code: 'chapter.stage.required',
        severity: 'error',
        message: 'Chapter must list at least one stage.',
        path: ['chapters', chapter.id, 'stageIds'],
        referenceId: chapter.id,
      });
      return;
    }

    const listed = new Set<StageId>();
    chapter.stageIds.forEach((stageId, index) => {
      if (!isStableId(stageId)) {
        diagnostics.push({
          code: 'chapter.stage-id.invalid',
          severity: 'error',
          message: 'Chapter stage id must be a stable lowercase identifier.',
          path: ['chapters', chapter.id, 'stageIds', index],
          referenceId: stageId,
        });
      } else if (listed.has(stageId)) {
        diagnostics.push({
          code: 'chapter.stage-id.duplicate',
          severity: 'error',
          message: `Chapter lists the same stage more than once: ${stageId}`,
          path: ['chapters', chapter.id, 'stageIds', index],
          referenceId: stageId,
        });
      }
      listed.add(stageId);

      const module = moduleById.get(stageId);
      if (!module) {
        diagnostics.push({
          code: 'chapter.stage.missing',
          severity: 'error',
          message: `Chapter references an unregistered stage: ${stageId}`,
          path: ['chapters', chapter.id, 'stageIds', index],
          referenceId: stageId,
        });
      } else if (module.manifest.chapterId !== chapter.id) {
        diagnostics.push({
          code: 'chapter.stage.chapter-mismatch',
          severity: 'error',
          message: `Stage ${stageId} belongs to chapter ${module.manifest.chapterId}, not ${chapter.id}.`,
          path: ['chapters', chapter.id, 'stageIds', index],
          stageId,
          referenceId: module.manifest.chapterId,
        });
      }
    });

    if (!listed.has(chapter.entryStageId)) {
      diagnostics.push({
        code: 'chapter.entry.not-listed',
        severity: 'error',
        message: `Chapter entry stage is not listed: ${chapter.entryStageId}`,
        path: ['chapters', chapter.id, 'entryStageId'],
        referenceId: chapter.entryStageId,
      });
    } else if (!moduleById.has(chapter.entryStageId)) {
      diagnostics.push({
        code: 'chapter.entry.missing',
        severity: 'error',
        message: `Chapter entry stage is not registered: ${chapter.entryStageId}`,
        path: ['chapters', chapter.id, 'entryStageId'],
        referenceId: chapter.entryStageId,
      });
    }

    const chapterModules = [...moduleById.values()].filter(module => module.manifest.chapterId === chapter.id);
    chapterModules.forEach(module => {
      if (!listed.has(module.manifest.id)) {
        diagnostics.push({
          code: 'chapter.stage.unlisted',
          severity: 'error',
          message: `Registered stage is absent from its chapter manifest: ${module.manifest.id}`,
          path: ['chapters', chapter.id, 'stageIds'],
          stageId: module.manifest.id,
          referenceId: module.manifest.id,
        });
      }
    });

    const orderOwner = new Map<number, StageId>();
    chapterModules.forEach(module => {
      const previous = orderOwner.get(module.manifest.order);
      if (previous) {
        diagnostics.push({
          code: 'chapter.stage-order.duplicate',
          severity: 'error',
          message: `Stages ${previous} and ${module.manifest.id} share order ${module.manifest.order}.`,
          path: ['chapters', chapter.id, 'stageIds'],
          stageId: module.manifest.id,
          referenceId: previous,
        });
      } else {
        orderOwner.set(module.manifest.order, module.manifest.id);
      }
    });

    const registeredListed = chapter.stageIds
      .map(stageId => moduleById.get(stageId))
      .filter((module): module is StageModule => module !== undefined && module.manifest.chapterId === chapter.id);
    if (registeredListed.length === chapter.stageIds.length) {
      const orderedIds = [...registeredListed]
        .sort((left, right) => left.manifest.order - right.manifest.order ||
          compareIds(left.manifest.id, right.manifest.id))
        .map(module => module.manifest.id);
      if (orderedIds.some((stageId, index) => stageId !== chapter.stageIds[index])) {
        diagnostics.push({
          code: 'chapter.stage-order.mismatch',
          severity: 'error',
          message: 'Chapter stageIds must follow the deterministic manifest order.',
          path: ['chapters', chapter.id, 'stageIds'],
          referenceId: chapter.id,
        });
      }
    }

    this.validateChapterGraph(chapter, listed, moduleById, diagnostics);
  }

  private validateChapterGraph(
    chapter: ChapterManifest,
    listed: ReadonlySet<StageId>,
    moduleById: ReadonlyMap<StageId, StageModule>,
    diagnostics: StageDiagnostic[],
  ): void {
    if (!listed.has(chapter.entryStageId) || !moduleById.has(chapter.entryStageId)) return;

    const reachable = new Set<StageId>();
    const pending: StageId[] = [chapter.entryStageId];
    while (pending.length > 0) {
      const stageId = pending.shift()!;
      if (reachable.has(stageId)) continue;
      reachable.add(stageId);
      const module = moduleById.get(stageId);
      if (!module) continue;
      module.manifest.exits.forEach(exit => {
        if (listed.has(exit.targetStageId) && !reachable.has(exit.targetStageId)) {
          pending.push(exit.targetStageId);
        }
      });
    }

    for (const stageId of listed) {
      if (moduleById.has(stageId) && !reachable.has(stageId)) {
        diagnostics.push({
          code: 'chapter.graph.unreachable',
          severity: 'error',
          message: `Stage is unreachable from chapter entry: ${stageId}`,
          path: ['chapters', chapter.id, 'stageIds'],
          stageId,
          referenceId: chapter.entryStageId,
        });
      }
    }

    const reverse = new Map<StageId, StageId[]>();
    const terminalRoutes = new Set<StageId>();
    for (const stageId of listed) reverse.set(stageId, []);
    for (const stageId of listed) {
      const module = moduleById.get(stageId);
      if (!module) continue;
      module.manifest.exits.forEach(exit => {
        if (listed.has(exit.targetStageId)) {
          reverse.get(exit.targetStageId)?.push(stageId);
        } else if (exit.targetStageId === 'campaign.complete' || moduleById.has(exit.targetStageId)) {
          terminalRoutes.add(stageId);
        }
      });
    }

    const canReachTerminal = new Set<StageId>();
    const reversePending = [...terminalRoutes];
    while (reversePending.length > 0) {
      const stageId = reversePending.shift()!;
      if (canReachTerminal.has(stageId)) continue;
      canReachTerminal.add(stageId);
      reverse.get(stageId)?.forEach(previous => reversePending.push(previous));
    }

    for (const stageId of listed) {
      if (moduleById.has(stageId) && !canReachTerminal.has(stageId)) {
        diagnostics.push({
          code: 'chapter.graph.no-terminal-route',
          severity: 'error',
          message: `Stage cannot reach campaign completion or another chapter: ${stageId}`,
          path: ['chapters', chapter.id, 'stageIds'],
          stageId,
          referenceId: chapter.id,
        });
      }
    }
  }
}
