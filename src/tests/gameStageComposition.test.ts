import {
  BrowserCampaignSaveStorage,
  GameStageCompositionRoot,
} from '../application/stages';
import {
  CAMPAIGN_SAVE_STORAGE_KEY,
  MemorySaveStorage,
} from '../narrative';
import type { LoadedStage } from '../stages';
import { VERSE_SECTIONS } from '../data/VerseLevelData';

class FakeBrowserStorage {
  private readonly values = new Map<string, string>();
  public getItem(key: string): string | null { return this.values.get(key) ?? null; }
  public setItem(key: string, value: string): void { this.values.set(key, value); }
  public snapshot(): Readonly<Record<string, string>> { return Object.fromEntries(this.values); }
}

function resolvePilot(root: GameStageCompositionRoot): LoadedStage {
  const resolution = root.resolveStage({
    enabled: true,
    legacyLevel: VERSE_SECTIONS[0],
    runId: 'test.run',
    runSeed: 'seed-731',
  });
  if (resolution.source !== 'modular') throw new Error('pilot did not load');
  return resolution.loadedStage;
}

describe('GameStageCompositionRoot', () => {
  it('assembles the real legacy registry and resolves an equivalent defensive level copy', () => {
    const loaded = resolvePilot(new GameStageCompositionRoot());
    expect(loaded.level).toEqual(VERSE_SECTIONS[0]);
    expect(loaded.level).not.toBe(VERSE_SECTIONS[0]);
    expect(loaded.manifest).toMatchObject({
      id: 'verse_01_atrium', chapterId: 'legacy.verse', revision: 1,
    });
  });

  it('creates the director lazily and skips persistence without a storage port', () => {
    const root = new GameStageCompositionRoot();
    const created = root.createNarrativeSession(resolvePilot(root), {
      campaignId: 'legacy.verse', runId: 'test.run', runSeed: 'seed-731',
    }, { level: 1, unlockedContent: [] });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(created.session.enterStage()).toEqual({ ok: true, persistence: 'skipped' });
    expect(created.session.director.snapshot().processedEventIds).toHaveLength(1);
  });

  it('persists the modular narrative without changing legacy keys or creating a run key', () => {
    const legacy = {
      'umbra-trail-profile': 'profile',
      'umbra-trail-settings': 'settings',
      'vigrid-progression-v1': 'progression',
    };
    const storage = new MemorySaveStorage(legacy);
    const root = new GameStageCompositionRoot({ campaignStorage: storage });
    const created = root.createNarrativeSession(resolvePilot(root), {
      campaignId: 'legacy.verse', runId: 'test.run', runSeed: 'seed-731',
    }, { level: 3, unlockedContent: ['chapter-1'] });
    if (!created.ok) throw created.error;

    expect(created.session.enterStage()).toEqual({ ok: true, persistence: 'saved' });
    expect(storage.snapshot()).toMatchObject(legacy);
    expect(storage.read(CAMPAIGN_SAVE_STORAGE_KEY)).toEqual(expect.any(String));
    expect(storage.read('umbra-trail-run-v1')).toBeUndefined();
  });

  it('journals pending rewards and persists confirmation only after caller success', () => {
    const storage = new MemorySaveStorage();
    const root = new GameStageCompositionRoot({ campaignStorage: storage });
    const loaded = resolvePilot(root);
    const withReward: LoadedStage = {
      ...loaded,
      events: [{
        id: 'test.enter-reward',
        once: true,
        when: 'stage.entered',
        commands: [{
          type: 'reward.grant',
          operationId: 'test.enter-reward',
          reward: { type: 'progression.currency', amount: 5 },
        }],
      }],
    };
    const created = root.createNarrativeSession(withReward, {
      campaignId: 'legacy.verse', runId: 'test.run', runSeed: 'seed-731',
    }, { level: 1, unlockedContent: [] });
    if (!created.ok) throw created.error;
    expect(created.session.enterStage()).toEqual({ ok: true, persistence: 'saved' });
    const pending = created.session.pendingRewardCommands();
    expect(pending).toHaveLength(1);
    const operationId = pending[0].type === 'reward.grant' ? pending[0].operationId : '';

    expect(created.session.confirmOperation(operationId)).toEqual({ ok: true, persistence: 'saved' });
    expect(created.session.pendingRewardCommands()).toEqual([]);
    expect(created.session.confirmOperation(operationId)).toMatchObject({
      ok: false, error: { code: 'operation-not-pending' },
    });
  });

  it('keeps browser storage access behind the application adapter', () => {
    const browser = new FakeBrowserStorage();
    const adapter = new BrowserCampaignSaveStorage(browser);
    adapter.write('umbra-trail-campaign-v1', 'value');
    expect(adapter.read('umbra-trail-campaign-v1')).toBe('value');
    expect(adapter.read('missing')).toBeUndefined();
    expect(browser.snapshot()).toEqual({ 'umbra-trail-campaign-v1': 'value' });
  });
});
