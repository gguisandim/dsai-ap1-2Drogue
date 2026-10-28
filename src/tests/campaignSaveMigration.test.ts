import {
  CAMPAIGN_SAVE_STORAGE_KEY,
  CampaignSaveService,
  MemorySaveStorage,
  NarrativeState,
} from '../narrative';
import type { StageResumeState } from '../stages';
import { saveIdentity } from './narrativeTestFixture';

function legacyResume(overrides: Partial<StageResumeState> = {}): StageResumeState {
  return {
    stageId: 'test.stage',
    manifestRevision: 3,
    flags: { 'test.legacy': true },
    missionStates: {
      'test.hunt': {
        status: 'active',
        objectives: { 'defeat.shades': 1 },
      },
    },
    collectedEntityIds: ['test.relic-1'],
    appliedOperationIds: ['test.legacy-reward'],
    ...overrides,
  };
}

describe('campaign save migration', () => {
  it('migrates an unbound StageResumeState without copying map-owned collections', () => {
    const service = new CampaignSaveService(new MemorySaveStorage());
    const identity = saveIdentity();
    const result = service.migrateStageResume({ identity, resume: legacyResume() });
    const repeated = service.migrateStageResume({ identity, resume: legacyResume() });
    expect(repeated).toEqual(result);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toMatchObject({
      migration: { source: 'stage-resume', sourceVersion: 0 },
      identity,
      narrative: {
        flags: { 'test.legacy': true },
        missionStates: { 'test.hunt': { status: 'active' } },
        choices: {},
        pendingOperations: [],
      },
    });
    expect(result.value.narrative.appliedOperationIds[0]).toContain(
      '.operation.test.legacy-reward',
    );
    expect(JSON.stringify(result.value)).not.toContain('collectedEntityIds');
  });

  it('accepts an equivalent bound resume and rejects divergent or partial bindings', () => {
    const service = new CampaignSaveService(new MemorySaveStorage());
    const identity = saveIdentity();
    expect(service.migrateStageResume({
      identity,
      resume: legacyResume({ runId: identity.runId, runSeed: identity.runSeed }),
    }).ok).toBe(true);
    expect(service.migrateStageResume({
      identity,
      resume: legacyResume({ runId: identity.runId, runSeed: 'wrong-seed' }),
    })).toMatchObject({ ok: false, error: { code: 'migration-failed' } });
    expect(service.migrateStageResume({
      identity,
      resume: legacyResume({ runId: identity.runId }),
    })).toMatchObject({ ok: false, error: { code: 'migration-failed' } });
  });

  it('loads a recognized legacy resume as migrated without overwriting its bytes', () => {
    const raw = JSON.stringify(legacyResume());
    const storage = new MemorySaveStorage({ [CAMPAIGN_SAVE_STORAGE_KEY]: raw });
    const service = new CampaignSaveService(storage);
    const before = storage.snapshot();

    const loaded = service.load(saveIdentity());
    expect(loaded).toMatchObject({ ok: true, value: { status: 'migrated' } });
    const target = new NarrativeState();
    expect(service.loadAndRestore(saveIdentity(), target)).toMatchObject({
      ok: true, value: { status: 'migrated' },
    });
    expect(target.snapshot()).toMatchObject({
      flags: { 'test.legacy': true },
      missionStates: { 'test.hunt': { status: 'active' } },
    });
    expect(storage.snapshot()).toEqual(before);
    expect(storage.read(CAMPAIGN_SAVE_STORAGE_KEY)).toBe(raw);
  });

  it('rejects corrupt legacy state and leaves the restore target unchanged', () => {
    const corrupt = legacyResume({
      missionStates: {
        'test.hunt': { status: 'active', objectives: { 'defeat.shades': -1 } },
      },
    });
    const storage = new MemorySaveStorage({
      [CAMPAIGN_SAVE_STORAGE_KEY]: JSON.stringify(corrupt),
    });
    const target = new NarrativeState({ flags: { 'test.original': true } });
    const before = target.snapshot();

    expect(new CampaignSaveService(storage).loadAndRestore(saveIdentity(), target)).toMatchObject({
      ok: false, error: { code: 'migration-failed' },
    });
    expect(target.snapshot()).toEqual(before);
  });

  it('preserves unknown save payloads instead of guessing or rewriting them', () => {
    const raw = JSON.stringify({ ...legacyResume(), version: 77, data: { stage: 2 } });
    const storage = new MemorySaveStorage({ [CAMPAIGN_SAVE_STORAGE_KEY]: raw });
    const before = storage.snapshot();
    const loaded = new CampaignSaveService(storage).load(saveIdentity());
    expect(loaded).toMatchObject({ ok: false, error: { code: 'invalid-envelope' } });
    expect(new CampaignSaveService(storage).save(saveIdentity(), new NarrativeState())).toMatchObject({
      ok: false, error: { code: 'storage-conflict' },
    });
    expect(storage.snapshot()).toEqual(before);
  });
});
