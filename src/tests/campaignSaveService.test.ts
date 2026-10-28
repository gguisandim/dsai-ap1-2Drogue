import {
  CAMPAIGN_SAVE_STORAGE_KEY,
  CampaignSaveService,
  MemorySaveStorage,
  NarrativeState,
  StageDirector,
} from '../narrative';
import type {
  SaveStoragePort,
} from '../narrative';
import { narrativeContent, progression, saveIdentity } from './narrativeTestFixture';

function stateWithScopedHistory(identity = saveIdentity()): NarrativeState {
  const created = StageDirector.create(narrativeContent(), undefined, progression, { identity });
  if (!created.ok) throw created.error;
  const director = created.value;
  director.process({ id: 'event.enter', signal: { type: 'stage.entered', stageId: 'test.stage' } });
  director.process({ id: 'event.npc', signal: { type: 'npc.interacted', npcId: 'test.guide' } });
  director.process({ id: 'event.enemy-1', signal: { type: 'enemy.defeated', enemyId: 'one', archetype: 'shade' } });
  return director.state;
}

describe('CampaignSaveService', () => {
  it('serializes deterministically and round-trips an immutable envelope', () => {
    const identity = saveIdentity();
    const state = stateWithScopedHistory(identity);
    const storage = new MemorySaveStorage();
    const service = new CampaignSaveService(storage);

    const first = service.serialize(identity, state);
    const second = service.serialize(identity, state);
    expect(second).toEqual(first);
    expect(first.ok).toBe(true);
    if (!first.ok) return;

    storage.write(CAMPAIGN_SAVE_STORAGE_KEY, first.value);
    const loaded = service.load(identity);
    expect(loaded).toMatchObject({ ok: true, value: { status: 'loaded' } });
    if (!loaded.ok || loaded.value.status !== 'loaded') return;
    expect(loaded.value.envelope.narrative).toEqual(state.snapshot());
    expect(Object.isFrozen(loaded.value.envelope)).toBe(true);
  });

  it('saves and restores without touching legacy storage keys', () => {
    const legacy = {
      'umbra-trail-profile': '{"skin":2}',
      'umbra-trail-settings': '{"sound":false}',
      'vigrid-progression-v1': '{"version":1,"currency":99}',
      'unknown-save': 'do-not-touch',
    };
    const storage = new MemorySaveStorage(legacy);
    const service = new CampaignSaveService(storage);
    const identity = saveIdentity();
    const source = stateWithScopedHistory(identity);

    expect(service.save(identity, source).ok).toBe(true);
    expect(storage.snapshot()).toMatchObject(legacy);

    const target = new NarrativeState({ flags: { 'test.original': true } });
    const restored = service.loadAndRestore(identity, target);
    expect(restored).toMatchObject({ ok: true, value: { status: 'loaded' } });
    expect(target.snapshot()).toEqual(source.snapshot());
  });

  it('treats an absent campaign save as a successful empty load', () => {
    expect(new CampaignSaveService(new MemorySaveStorage()).load(saveIdentity())).toEqual({
      ok: true,
      value: { status: 'empty' },
    });
  });

  it('rejects invalid expected identities before reading or writing storage', () => {
    const storage = new MemorySaveStorage();
    const service = new CampaignSaveService(storage);
    const invalid = saveIdentity({ runId: 'Invalid Run' });
    expect(service.load(invalid)).toMatchObject({
      ok: false, error: { code: 'invalid-identity' },
    });
    expect(service.save(invalid, new NarrativeState())).toMatchObject({
      ok: false, error: { code: 'invalid-identity' },
    });
    expect(storage.snapshot()).toEqual({});
  });

  it('rejects corrupt JSON and preserves both storage and target state', () => {
    const storage = new MemorySaveStorage({ [CAMPAIGN_SAVE_STORAGE_KEY]: '{broken' });
    const service = new CampaignSaveService(storage);
    const beforeStorage = storage.snapshot();
    const target = new NarrativeState({ flags: { 'test.original': true } });
    const beforeState = target.snapshot();

    expect(service.loadAndRestore(saveIdentity(), target)).toMatchObject({
      ok: false,
      error: { code: 'invalid-json' },
    });
    expect(storage.snapshot()).toEqual(beforeStorage);
    expect(target.snapshot()).toEqual(beforeState);
  });

  it('rejects unsupported versions and incompatible identities', () => {
    const identity = saveIdentity();
    const service = new CampaignSaveService(new MemorySaveStorage());
    const envelope = service.createEnvelope(identity, stateWithScopedHistory(identity));
    if (!envelope.ok) throw envelope.error;

    const versionStorage = new MemorySaveStorage({
      [CAMPAIGN_SAVE_STORAGE_KEY]: JSON.stringify({ ...envelope.value, version: 2 }),
    });
    expect(new CampaignSaveService(versionStorage).load(identity)).toMatchObject({
      ok: false, error: { code: 'unsupported-version' },
    });

    const identityStorage = new MemorySaveStorage({
      [CAMPAIGN_SAVE_STORAGE_KEY]: JSON.stringify(envelope.value),
    });
    expect(new CampaignSaveService(identityStorage).load(saveIdentity({ runSeed: 'another-seed' })))
      .toMatchObject({ ok: false, error: { code: 'identity-mismatch' } });
  });

  it('refuses to overwrite a valid save belonging to another run', () => {
    const firstIdentity = saveIdentity({ runId: 'test.run-1' });
    const secondIdentity = saveIdentity({ runId: 'test.run-2' });
    const storage = new MemorySaveStorage();
    const service = new CampaignSaveService(storage);
    expect(service.save(firstIdentity, stateWithScopedHistory(firstIdentity)).ok).toBe(true);
    const before = storage.snapshot();

    expect(service.save(secondIdentity, stateWithScopedHistory(secondIdentity))).toMatchObject({
      ok: false, error: { code: 'storage-conflict' },
    });
    expect(storage.snapshot()).toEqual(before);
  });

  it('validates nested snapshot data and never partially restores it', () => {
    const identity = saveIdentity();
    const state = stateWithScopedHistory(identity);
    const service = new CampaignSaveService(new MemorySaveStorage());
    const serialized = service.serialize(identity, state);
    if (!serialized.ok) throw serialized.error;
    const corrupt = JSON.parse(serialized.value) as Record<string, any>;
    corrupt.narrative.missionStates['test.hunt'].objectives['defeat.shades'] = -1;
    const storage = new MemorySaveStorage({
      [CAMPAIGN_SAVE_STORAGE_KEY]: JSON.stringify(corrupt),
    });
    const target = new NarrativeState({ flags: { 'test.original': true } });
    const before = target.snapshot();

    const result = new CampaignSaveService(storage).loadAndRestore(identity, target);
    expect(result).toMatchObject({ ok: false, error: { code: 'invalid-snapshot' } });
    if (result.ok) return;
    expect(result.error.diagnostics).toContainEqual(expect.objectContaining({
      code: 'save.objective.invalid',
      path: ['narrative', 'missionStates', 'test.hunt', 'objectives', 'defeat.shades'],
    }));
    expect(target.snapshot()).toEqual(before);
  });

  it('returns typed failures when the storage port throws', () => {
    const readFailure: SaveStoragePort = {
      read: () => { throw new Error('read denied'); },
      write: () => undefined,
    };
    expect(new CampaignSaveService(readFailure).load()).toMatchObject({
      ok: false, error: { code: 'storage-read-failed' },
    });

    const writeFailure: SaveStoragePort = {
      read: () => undefined,
      write: () => { throw new Error('write denied'); },
    };
    expect(new CampaignSaveService(writeFailure).save(saveIdentity(), stateWithScopedHistory()))
      .toMatchObject({ ok: false, error: { code: 'storage-write-failed' } });
  });
});
