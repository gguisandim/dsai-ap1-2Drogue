import type {
  CampaignChapterEntry,
  ChapterManifest,
  LoadedStage,
  StageCatalogEligibility,
  StageCatalogEntry,
  StageCatalogLoadability,
  StageModule,
} from '../../stages';
import type {
  ChapterTemplate,
  ChapterTemplateOptions,
  TemplateGeometryId,
} from '../../examples/chapter-template';

export type ChapterCommandName =
  | 'create'
  | 'validate'
  | 'inspect'
  | 'preview'
  | 'capabilities'
  | 'plan'
  | 'playtest'
  | 'homologate'
  | 'help';

export interface ChapterCliArguments {
  readonly command: ChapterCommandName;
  readonly planAction?: 'validate';
  readonly slug?: string;
  /** Production stage targeted by `homologate --stage`. */
  readonly stageId?: string;
  /** Optional presentation variant for `homologate`. */
  readonly variantId?: string;
  /** Runs the real macro campaign transition homologation. */
  readonly campaign?: boolean;
  readonly macroRunId?: string;
  readonly macroRunSeed?: string;
  readonly title?: string;
  readonly namespace?: string;
  readonly revision?: number;
  readonly template?: TemplateGeometryId;
  /** Geometry seed for `create`, or the single seed reproduced by `playtest`. */
  readonly seed?: number;
  /** Number of consecutive seeds evaluated by `playtest`. */
  readonly seeds?: number;
  readonly width?: number;
  readonly height?: number;
  readonly regionCount?: number;
  readonly json: boolean;
  readonly visual: boolean;
  readonly chaptersDir?: string;
}

export interface ChapterFileSystem {
  exists(target: string): boolean;
  isDirectory(target: string): boolean;
  readFile(target: string): string;
  writeFile(target: string, content: string): void;
  mkdirp(target: string): void;
  makeTempDir(parent: string, prefix: string): string;
  rename(from: string, to: string): void;
  removeTree(target: string): void;
  listDirectories(parent: string): readonly string[];
}

export interface LoadedChapterModule {
  readonly CHAPTER_TEMPLATE?: ChapterTemplate;
  readonly CHAPTER_TEMPLATE_ENTRY?: CampaignChapterEntry;
  /** Present on generated chapters; used to rebuild deterministic seed variants. */
  readonly createChapterTemplate?: (
    namespace: string,
    options?: ChapterTemplateOptions,
  ) => ChapterTemplate;
}

/** Upper bound for a single `playtest --seeds` invocation. */
export const PLAYTEST_MAXIMUM_SEEDS = 25;

export type CliDiagnosticSeverity = 'error' | 'warning' | 'info';

export type CliDiagnosticOrigin =
  | 'args'
  | 'filesystem'
  | 'registration'
  | 'validator'
  | 'catalog'
  | 'loader'
  | 'narrative'
  | 'template'
  | 'plan'
  | 'playtest'
  | 'runtime';

export interface CliDiagnostic {
  readonly code: string;
  readonly severity: CliDiagnosticSeverity;
  readonly message: string;
  readonly path: readonly (string | number)[];
  readonly origin: CliDiagnosticOrigin;
  readonly component?: string;
  readonly stageId?: string;
  readonly chapterId?: string;
  readonly referenceId?: string;
}

export interface ChapterValidationReport {
  readonly entry: CampaignChapterEntry;
  readonly diagnostics: readonly CliDiagnostic[];
  readonly errors: readonly CliDiagnostic[];
  readonly warnings: readonly CliDiagnostic[];
  readonly catalogEntries: readonly StageCatalogEntry[];
  readonly loadedStages: readonly LoadedStage[];
  readonly chapter: ChapterManifest;
  readonly campaignCandidate: boolean;
  readonly individualAvailable: boolean;
  readonly eligibility?: StageCatalogEligibility;
  readonly loadability?: StageCatalogLoadability;
  readonly phaserAssets: 'not-executed';
}

export interface InspectedStage {
  readonly id: string;
  readonly title: string;
  readonly revision: number;
  readonly order: number;
  readonly chapterId: string;
  readonly layoutKind: StageModule['manifest']['layout']['kind'];
  readonly regions: readonly string[];
  readonly biomes: readonly string[];
  readonly capabilities: readonly string[];
  readonly dependencies: readonly {
    readonly chapterId: string;
    readonly minimumRevision: number;
    readonly optional: boolean;
  }[];
  readonly exits: readonly {
    readonly id: string;
    readonly targetStageId: string;
    readonly anchor: StageModule['manifest']['exits'][number]['anchor'];
    readonly conditional: boolean;
  }[];
  readonly entryDialogueId: string | null;
  readonly completionMissionId: string | null;
  readonly npcIds: readonly string[];
  readonly dialogueIds: readonly string[];
  readonly missionIds: readonly string[];
  readonly eventIds: readonly string[];
  readonly encounter: {
    readonly id: string;
    readonly waveCount: number;
    readonly enemyCount: number;
    readonly enemyTypes: readonly string[];
  } | null;
  readonly presentation: {
    readonly themeId: string;
    readonly tilesetId?: string;
    readonly npcPresentationIds: readonly string[];
    readonly enemyArchetypes: readonly string[];
    readonly presentationVariantIds: readonly string[];
    readonly audioProfileId?: string;
    readonly environmentId?: string;
  } | null;
  readonly eligibility: StageCatalogEligibility | null;
  readonly loadability: StageCatalogLoadability | null;
}

export interface ChapterInspection {
  readonly chapter: {
    readonly id: string;
    readonly title: string;
    readonly revision: number;
    readonly stageCount: number;
    readonly stageIds: readonly string[];
    readonly tags: readonly string[];
  };
  readonly stages: readonly InspectedStage[];
  readonly visualResources: {
    readonly textureIds: readonly string[];
    readonly tilesetIds: readonly string[];
    readonly themeIds: readonly string[];
    readonly decorationIds: readonly string[];
    readonly spriteIds: readonly string[];
    readonly soundIds: readonly string[];
    readonly audioProfileIds: readonly string[];
    readonly environmentIds: readonly string[];
  } | null;
  readonly campaignCandidate: boolean;
  readonly individualAvailable: boolean;
  readonly diagnostics: readonly CliDiagnostic[];
  readonly runtime: {
    readonly phaserAssets: 'not-executed';
  };
}

export interface IndividualPreview {
  readonly stageId: string;
  readonly ok: boolean;
  readonly levelId?: string;
  readonly encounterWaves?: number;
  readonly themeId?: string;
  readonly error?: string;
}

export interface WorldLabPreview {
  readonly ok: boolean;
  readonly projected: boolean;
  readonly nodeId?: string;
  readonly stageId?: string;
  readonly diagnostics: readonly CliDiagnostic[];
  readonly error?: string;
}

export interface ChapterVisualPreview {
  readonly url: string;
  readonly authoringRoot: string;
  readonly bootstrap: 'chapterPreview';
  readonly note: string;
}

export interface ChapterPreview {
  readonly report: ChapterValidationReport;
  readonly individual: readonly IndividualPreview[];
  readonly worldLab: WorldLabPreview;
  readonly rendering: 'not-executed' | 'prepared';
  readonly visual?: ChapterVisualPreview;
}

export interface CreatedChapter {
  readonly targetDir: string;
  readonly relativeDir: string;
  readonly template: ChapterTemplate;
  readonly files: readonly string[];
  readonly report: ChapterValidationReport;
}

export interface ChapterCliOptions {
  readonly repoRoot?: string;
  readonly chaptersRoot?: string;
  readonly fileSystem?: ChapterFileSystem;
  readonly loadGenerated?: (chapterDir: string) => LoadedChapterModule;
  readonly print?: (line: string) => void;
  readonly printError?: (line: string) => void;
}

export interface CreateChapterRequest {
  readonly repoRoot: string;
  readonly chaptersRoot: string;
  readonly templateDir: string;
  readonly slug: string;
  readonly namespace: string;
  readonly title: string;
  readonly stageTitle: string;
  readonly summary: string;
  readonly revision: number;
  readonly template?: TemplateGeometryId;
  readonly seed?: number;
  readonly width?: number;
  readonly height?: number;
  readonly regionCount?: number;
  readonly fileSystem: ChapterFileSystem;
  readonly loadGenerated?: (chapterDir: string) => LoadedChapterModule;
}
