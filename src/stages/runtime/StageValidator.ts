import { GENERATION_PRESETS } from '../../procedural';
import type {
  ChapterManifest,
  StageAnchor,
  StageDiagnostic,
  StageId,
  StageModule,
} from '../contracts';

const STABLE_ID = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/;
const PRESET_IDS = new Set<string>(GENERATION_PRESETS.map(preset => preset.id));

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
      this.validateChapter(chapter, moduleById, diagnostics);
    });

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
    });
  }

  private validateChapter(
    chapter: ChapterManifest,
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
