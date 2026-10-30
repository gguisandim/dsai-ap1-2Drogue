import type {
  ChapterId,
  ChapterManifest,
  StageCondition,
  StageDiagnostic,
  StageId,
  StageManifest,
  StageModule,
} from '../contracts';
import { StageValidator } from './StageValidator';

export type StageRegistryErrorCode =
  | 'duplicate-stage'
  | 'duplicate-chapter'
  | 'chapter-mismatch'
  | 'chapter-stage-list-mismatch'
  | 'missing-stage';

export class StageRegistryError extends Error {
  public constructor(
    public readonly code: StageRegistryErrorCode,
    message: string,
    public readonly referenceId: string,
  ) {
    super(message);
    this.name = 'StageRegistryError';
  }
}

function cloneCondition(condition: StageCondition): StageCondition {
  if (condition.type === 'all' || condition.type === 'any') {
    return Object.freeze({
      ...condition,
      conditions: Object.freeze(condition.conditions.map(cloneCondition)),
    });
  }
  if (condition.type === 'not') {
    return Object.freeze({ ...condition, condition: cloneCondition(condition.condition) });
  }
  return Object.freeze({ ...condition });
}

function cloneManifest(manifest: StageManifest): StageManifest {
  const layout = manifest.layout.kind === 'procedural'
    ? Object.freeze({
        ...manifest.layout,
        ...(manifest.layout.overrides
          ? { overrides: Object.freeze({ ...manifest.layout.overrides }) }
          : {}),
      })
    : Object.freeze({ ...manifest.layout });
  const exits = Object.freeze(manifest.exits.map(exit => Object.freeze({
    ...exit,
    anchor: Object.freeze({ ...exit.anchor }),
    ...(exit.condition ? { condition: cloneCondition(exit.condition) } : {}),
  })));
  return Object.freeze({
    ...manifest,
    layout,
    exits,
    ...(manifest.capabilities ? {
      capabilities: Object.freeze(manifest.capabilities.map(capability => Object.freeze({ ...capability }))),
    } : {}),
    ...(manifest.tags ? { tags: Object.freeze([...manifest.tags]) } : {}),
  });
}

function cloneModule(module: StageModule): StageModule {
  return Object.freeze({
    ...module,
    manifest: cloneManifest(module.manifest),
    ...(module.npcs ? { npcs: Object.freeze([...module.npcs]) } : {}),
    ...(module.dialogues ? { dialogues: Object.freeze([...module.dialogues]) } : {}),
    ...(module.missions ? { missions: Object.freeze([...module.missions]) } : {}),
    ...(module.events ? { events: Object.freeze([...module.events]) } : {}),
  });
}

function cloneChapter(chapter: ChapterManifest): ChapterManifest {
  return Object.freeze({
    ...chapter,
    stageIds: Object.freeze([...chapter.stageIds]),
    ...(chapter.dependencies ? {
      dependencies: Object.freeze(chapter.dependencies.map(dependency => Object.freeze({ ...dependency }))),
    } : {}),
    ...(chapter.capabilities ? {
      capabilities: Object.freeze(chapter.capabilities.map(capability => Object.freeze({ ...capability }))),
    } : {}),
    ...(chapter.tags ? { tags: Object.freeze([...chapter.tags]) } : {}),
  });
}

function compareIds(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

export class StageRegistry {
  private readonly stages = new Map<StageId, StageModule>();
  private readonly chapters = new Map<ChapterId, ChapterManifest>();

  public constructor(private readonly validator = new StageValidator()) {}

  public register(module: StageModule): void {
    const stageId = module.manifest.id;
    if (this.stages.has(stageId)) {
      throw new StageRegistryError(
        'duplicate-stage',
        `Stage is already registered: ${stageId}`,
        stageId,
      );
    }
    this.stages.set(stageId, cloneModule(module));
  }

  public registerChapter(chapter: ChapterManifest, stages: readonly StageModule[]): void {
    if (this.chapters.has(chapter.id)) {
      throw new StageRegistryError(
        'duplicate-chapter',
        `Chapter is already registered: ${chapter.id}`,
        chapter.id,
      );
    }

    const providedIds = stages.map(module => module.manifest.id);
    const providedSet = new Set(providedIds);
    const declaredSet = new Set(chapter.stageIds);
    if (providedSet.size !== providedIds.length || declaredSet.size !== chapter.stageIds.length ||
      providedSet.size !== declaredSet.size || [...providedSet].some(stageId => !declaredSet.has(stageId))) {
      throw new StageRegistryError(
        'chapter-stage-list-mismatch',
        `Chapter ${chapter.id} stageIds do not match the supplied modules.`,
        chapter.id,
      );
    }

    for (const module of stages) {
      if (module.manifest.chapterId !== chapter.id) {
        throw new StageRegistryError(
          'chapter-mismatch',
          `Stage ${module.manifest.id} belongs to ${module.manifest.chapterId}, not ${chapter.id}.`,
          module.manifest.id,
        );
      }
      if (this.stages.has(module.manifest.id)) {
        throw new StageRegistryError(
          'duplicate-stage',
          `Stage is already registered: ${module.manifest.id}`,
          module.manifest.id,
        );
      }
    }

    const chapterCopy = cloneChapter(chapter);
    const moduleCopies = stages.map(cloneModule);
    this.chapters.set(chapterCopy.id, chapterCopy);
    moduleCopies.forEach(module => this.stages.set(module.manifest.id, module));
  }

  public get(stageId: StageId): StageModule | undefined {
    return this.stages.get(stageId);
  }

  public require(stageId: StageId): StageModule {
    const module = this.get(stageId);
    if (!module) {
      throw new StageRegistryError('missing-stage', `Stage is not registered: ${stageId}`, stageId);
    }
    return module;
  }

  public getChapter(chapterId: ChapterId): ChapterManifest | undefined {
    return this.chapters.get(chapterId);
  }

  public listChapter(chapterId: ChapterId): readonly StageManifest[] {
    const manifests = [...this.stages.values()]
      .filter(module => module.manifest.chapterId === chapterId)
      .map(module => module.manifest)
      .sort((left, right) => left.order - right.order || compareIds(left.id, right.id));
    return Object.freeze(manifests);
  }

  /** Immutable snapshots used by composition-time compatibility validation. */
  public listChapters(): readonly ChapterManifest[] {
    return Object.freeze([...this.chapters.values()].map(cloneChapter).sort((left, right) => compareIds(left.id, right.id)));
  }

  public listModules(): readonly StageModule[] {
    return Object.freeze([...this.stages.values()].map(cloneModule).sort((left, right) =>
      compareIds(left.manifest.id, right.manifest.id)));
  }

  public validate(): readonly StageDiagnostic[] {
    return this.validator.validate([...this.chapters.values()], [...this.stages.values()]);
  }
}
