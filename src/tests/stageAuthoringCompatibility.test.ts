import type { LevelDefinition } from '../data/LevelData';
import {
  CAMPAIGN_SAVE_STORAGE_KEY,
  CampaignSaveService,
  MemorySaveStorage,
  NarrativeState,
  type CampaignSaveIdentity,
} from '../narrative';
import { UMBRA_CAMPAIGN_SKELETON } from '../application/stages';
import {
  CampaignChapterCatalogError,
  StageLoader,
  StageRegistry,
  StageValidator,
  applyCampaignRegionBindings,
  registerLegacyStages,
  validateCampaignChapterCatalog,
  type CampaignChapterEntry,
  type ChapterManifest,
  type StageModule,
} from '../stages';

function level(id = 'stage.authoring.test', overrides: Partial<LevelDefinition> = {}): LevelDefinition {
  return {
    id,
    name: 'Authoring test',
    description: 'Compatibility boundary fixture.',
    theme: 'gothic_cathedral',
    music: 'none',
    ambientColor: 0,
    fogColor: 0,
    fogDensity: 0,
    lightIntensity: 1,
    tileMap: [
      [1, 1, 1, 1, 1],
      [1, 8, 0, 0, 1],
      [1, 0, 0, 0, 1],
      [1, 0, 0, 5, 1],
      [1, 1, 1, 1, 1],
    ],
    enemies: [],
    items: [],
    decorations: [],
    parTime: 30,
    difficulty: 1,
    ...overrides,
  };
}

function stage(
  id = 'stage.authoring.test',
  chapterId = 'chapter.authoring.test',
  overrides: Partial<StageModule> = {},
): StageModule {
  return {
    manifest: {
      schemaVersion: 1,
      id,
      revision: 1,
      chapterId,
      order: 0,
      title: 'Authoring test',
      summary: 'Compatibility boundary fixture.',
      layout: { kind: 'authored' },
      exits: [{ id: `exit.${id}`, anchor: { kind: 'map-exit' }, targetStageId: 'campaign.complete' }],
    },
    authoredLevel: level(id),
    ...overrides,
  };
}

function chapter(module: StageModule, overrides: Partial<ChapterManifest> = {}): ChapterManifest {
  return {
    schemaVersion: 1,
    id: module.manifest.chapterId,
    revision: 1,
    title: 'Authoring chapter',
    stageIds: [module.manifest.id],
    entryStageId: module.manifest.id,
    ...overrides,
  };
}

function entry(module: StageModule, chapterManifest = chapter(module)): CampaignChapterEntry {
  return { chapter: chapterManifest, stages: [module], regions: [] };
}

function identity(chapterRevision?: number): CampaignSaveIdentity {
  return {
    campaignId: 'campaign.authoring.test',
    runId: 'run.authoring.test',
    runSeed: 'seed.authoring.test',
    chapterId: 'chapter.authoring.test',
    ...(chapterRevision === undefined ? {} : { chapterRevision }),
    stageId: 'stage.authoring.test',
    manifestRevision: 1,
  };
}

describe('Etapa 9.5 authoring compatibility contracts', () => {
  it('keeps valid legacy chapters and stages loadable without capability declarations', () => {
    const registry = new StageRegistry();
    registerLegacyStages(registry);
    expect(registry.validate()).toEqual([]);
    const loaded = new StageLoader(registry).load({
      stageId: 'verse_01_atrium', runId: 'run.legacy.compatibility', runSeed: 'seed.legacy.compatibility',
    });
    expect(loaded.ok).toBe(true);
  });

  it('accepts compatible chapter/stage capabilities and reports optional planned support as a warning', () => {
    const module = stage();
    const compatible: StageModule = {
      ...module,
      manifest: {
        ...module.manifest,
        capabilities: [{
          id: 'navigation.authored-map', category: 'navigation', minimumVersion: 1, requirement: 'required',
        }, {
          id: 'audio.level-music', category: 'audio', minimumVersion: 1, requirement: 'optional',
        }],
      },
    };
    const diagnostics = new StageValidator().validate([
      chapter(compatible, { capabilities: [{
        id: 'narrative.condition', category: 'narrative', minimumVersion: 1, requirement: 'required',
      }] }),
    ], [compatible]);
    expect(diagnostics.filter(item => item.severity === 'error')).toEqual([]);
    expect(diagnostics).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'capability.unavailable', severity: 'warning', referenceId: 'audio.level-music' }),
    ]));
  });

  it.each([
    ['required planned capability', {
      id: 'lighting.level-ambience', category: 'lighting', minimumVersion: 1, requirement: 'required',
    }, 'capability.unavailable'],
    ['unknown capability', {
      id: 'audio.external-orchestra', category: 'audio', minimumVersion: 1, requirement: 'optional',
    }, 'capability.unknown'],
  ] as const)('rejects %s', (_label, requirement, code) => {
    const module = stage();
    const invalid = {
      ...module,
      manifest: { ...module.manifest, capabilities: [requirement] },
    } as StageModule;
    expect(new StageValidator().validateModule(invalid)).toEqual(expect.arrayContaining([
      expect.objectContaining({ code, severity: 'error' }),
    ]));
  });

  it('does not load a stage from a chapter with an unavailable required capability', () => {
    const module = stage();
    const registry = new StageRegistry();
    registry.registerChapter(chapter(module, { capabilities: [{
      id: 'effect.level-decoration', category: 'effect', minimumVersion: 1, requirement: 'required',
    }] }), [module]);
    const result = new StageLoader(registry).load({
      stageId: module.manifest.id, runId: 'run.chapter-capability', runSeed: 'seed.chapter-capability',
    });
    expect(result).toMatchObject({
      ok: false,
      error: {
        code: 'invalid-manifest',
        diagnostics: [expect.objectContaining({ code: 'capability.unavailable' })],
      },
    });
  });

  it('rejects unsupported authored tiles, enemies and items before silent runtime fallbacks', () => {
    const module = stage('stage.authoring.unsupported', 'chapter.authoring.unsupported', {
      authoredLevel: level('stage.authoring.unsupported', {
        tileMap: [[1, 1, 1], [1, 8, 99], [1, 5, 1]],
        enemies: [{ type: 'unknown-enemy', x: 1, y: 1, level: 1 }],
        items: [{ type: 'unknown_item', x: 1, y: 1 }],
      }),
    });
    const registry = new StageRegistry();
    registry.registerChapter(chapter(module), [module]);
    const loaded = new StageLoader(registry).load({
      stageId: module.manifest.id, runId: 'run.unsupported', runSeed: 'seed.unsupported',
    });
    expect(loaded).toMatchObject({ ok: false, error: { code: 'invalid-manifest' } });
    if (loaded.ok) throw new Error('unsupported authored stage loaded');
    expect(loaded.error.diagnostics.map(item => item.code)).toEqual(expect.arrayContaining([
      'stage.content.tile.unsupported',
      'stage.content.enemy.unsupported',
      'stage.content.item.unsupported',
    ]));
  });

  it('validates cross-chapter dependencies and condition references deterministically', () => {
    const target = stage('stage.authoring.target', 'chapter.authoring.target');
    const sourceBase = stage('stage.authoring.source', 'chapter.authoring.source');
    const source: StageModule = {
      ...sourceBase,
      manifest: {
        ...sourceBase.manifest,
        exits: [{
          id: 'exit.authoring.cross', anchor: { kind: 'map-exit' }, targetStageId: target.manifest.id,
          condition: { type: 'mission.status', missionId: 'mission.authoring.missing', status: 'completed' },
        }],
      },
    };
    const validator = new StageValidator();
    const first = validator.validate([chapter(source), chapter(target)], [source, target]);
    const second = validator.validate([chapter(source), chapter(target)], [source, target]);
    expect(second).toEqual(first);
    expect(first).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'stage.exit.chapter-dependency-missing' }),
      expect.objectContaining({
        code: 'stage.condition.mission.missing', referenceId: 'mission.authoring.missing',
        path: ['manifest', 'exits', 0, 'condition', 'missionId'],
      }),
    ]));
  });

  it('accepts a valid exit condition and rejects unknown condition discriminants', () => {
    const module = stage();
    const valid: StageModule = {
      ...module,
      manifest: {
        ...module.manifest,
        exits: [{
          ...module.manifest.exits[0],
          condition: { type: 'flag.equals', flag: 'flag.authoring.open', value: true },
        }],
      },
      narrative: { flags: { 'flag.authoring.open': false } },
    };
    expect(new StageValidator().validateModule(valid)).toEqual([]);
    const invalid = structuredClone(valid) as unknown as { manifest: { exits: Array<Record<string, unknown>> } };
    invalid.manifest.exits[0].condition = { type: 'script.execute', source: 'open()' };
    expect(new StageValidator().validateModule(invalid as unknown as StageModule)).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'stage.condition.unknown', referenceId: 'script.execute' }),
    ]));
  });

  it('rejects missing and duplicate region bindings while preserving unbound planned regions', () => {
    const module = stage();
    const missingRegion: CampaignChapterEntry = {
      ...entry(module),
      regions: [{
        regionId: 'region.missing.external', stageId: module.manifest.id,
        minimumManifestRevision: 1, dialogueIds: [], eventIds: [],
      }],
    };
    expect(validateCampaignChapterCatalog([missingRegion], UMBRA_CAMPAIGN_SKELETON)).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: 'catalog.region-binding.region-missing' })]),
    );

    const duplicate: CampaignChapterEntry = {
      ...entry(module),
      regions: [
        { regionId: 'region.aguas.igapo', stageId: module.manifest.id, minimumManifestRevision: 1, dialogueIds: [], eventIds: [] },
        { regionId: 'region.aguas.igapo', stageId: module.manifest.id, minimumManifestRevision: 1, dialogueIds: [], eventIds: [] },
      ],
    };
    expect(() => applyCampaignRegionBindings(UMBRA_CAMPAIGN_SKELETON, [duplicate]))
      .toThrow(CampaignChapterCatalogError);

    const unchanged = applyCampaignRegionBindings(UMBRA_CAMPAIGN_SKELETON, []);
    expect(unchanged).toBe(UMBRA_CAMPAIGN_SKELETON);
    expect(unchanged.routes.flatMap(route => route.regions).every(region => region.content.kind === 'planned'))
      .toBe(true);
  });

  it('restores compatible and fieldless legacy identities but rejects chapter revisions without rewriting bytes', () => {
    const state = new NarrativeState({ flags: { 'flag.authoring.saved': true } });
    const currentStorage = new MemorySaveStorage();
    const current = new CampaignSaveService(currentStorage);
    expect(current.save(identity(2), state).ok).toBe(true);
    expect(current.load(identity(2))).toMatchObject({ ok: true, value: { status: 'loaded' } });

    const legacyService = new CampaignSaveService(new MemorySaveStorage());
    const legacySerialized = legacyService.serialize(identity(), state);
    if (!legacySerialized.ok) throw legacySerialized.error;
    const legacyStorage = new MemorySaveStorage({ [CAMPAIGN_SAVE_STORAGE_KEY]: legacySerialized.value });
    expect(new CampaignSaveService(legacyStorage).load(identity(2)))
      .toMatchObject({ ok: true, value: { status: 'loaded' } });

    const incompatibleStorage = new MemorySaveStorage({
      [CAMPAIGN_SAVE_STORAGE_KEY]: currentStorage.read(CAMPAIGN_SAVE_STORAGE_KEY)!,
    });
    const before = incompatibleStorage.snapshot();
    const incompatible = new CampaignSaveService(incompatibleStorage).save(identity(3), state);
    expect(incompatible).toMatchObject({
      ok: false,
      error: {
        code: 'storage-conflict',
        diagnostics: [expect.objectContaining({ code: 'save.identity.chapter-revision-mismatch' })],
      },
    });
    expect(incompatibleStorage.snapshot()).toEqual(before);
  });

  it('accepts legacy StageResumeState and rejects an explicit incompatible chapter revision', () => {
    const module = stage();
    const registry = new StageRegistry();
    registry.registerChapter(chapter(module, { revision: 2 }), [module]);
    const loader = new StageLoader(registry);
    const base = {
      stageId: module.manifest.id,
      manifestRevision: 1,
      flags: {}, missionStates: {}, collectedEntityIds: [], appliedOperationIds: [],
    } as const;
    expect(loader.load({ stageId: module.manifest.id, runId: 'run.resume', runSeed: 'seed.resume', resume: base }).ok)
      .toBe(true);
    const incompatible = loader.load({
      stageId: module.manifest.id, runId: 'run.resume', runSeed: 'seed.resume',
      resume: { ...base, chapterRevision: 1 },
    });
    expect(incompatible).toMatchObject({
      ok: false,
      error: {
        code: 'incompatible-save',
        diagnostics: [expect.objectContaining({ code: 'stage.load.resume-chapter-revision-mismatch' })],
      },
    });
  });
});
