import {
  CHAPTER_CLI_HELP,
  ChapterCliError,
  parseChapterCliArguments,
  runChapterCli,
} from '../cli/chapter';
import { createChapterTemplate } from '../examples/chapter-template';
import {
  CAMPAIGN_CHAPTER_CATALOG,
  DEFAULT_STAGE_RUNTIME_CAPABILITIES,
  StageRegistry,
  StageValidator,
  createStageAuthoringCapabilities,
  registerCampaignChapters,
  registerLegacyStages,
  type StageAuthoringCapabilitiesReport,
  type StageModule,
} from '../stages';
import {
  STAGE_AUDIO_EVENTS,
  STAGE_COMMAND_TYPES,
  STAGE_CONDITION_TYPES,
  STAGE_EFFECT_KINDS,
  STAGE_ENCOUNTER_COMPLETION_MODES,
  STAGE_ENCOUNTER_SCALING_MODES,
  STAGE_ENCOUNTER_SOURCE_KINDS,
  STAGE_ENCOUNTER_START_MODES,
  STAGE_MISSION_SCOPES,
  STAGE_MISSION_START_MODES,
  STAGE_MISSION_STATUSES,
  STAGE_REWARD_TYPES,
  STAGE_SIGNAL_FILTER_FIELDS,
  STAGE_SIGNAL_TYPES,
  STAGE_SOUND_WAVEFORMS,
  STAGE_VISUAL_LAYERS,
  STAGE_VISUAL_PERSPECTIVES,
  STAGE_VISUAL_SCALE_CLASSES,
} from '../stages/runtime/StageAuthoringVocabulary';
import type {
  StageAudioEvent,
  StageCommand,
  StageCondition,
  StageEffectKind,
  StageEncounterCompletion,
  StageEncounterScaling,
  StageEncounterSource,
  StageEncounterStart,
  StageMissionStatus,
  StageReward,
  StageSignal,
  StageSignalFilter,
  StageSoundWaveform,
  StageVisualLayer,
  StageVisualPerspective,
  StageVisualScaleClass,
} from '../stages/contracts';

const STABLE_ID = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/;

function runRaw(argv: readonly string[]): {
  readonly code: number;
  readonly output: string;
  readonly errors: string;
} {
  const output: string[] = [];
  const errors: string[] = [];
  const code = runChapterCli(argv, {
    print: line => output.push(line),
    printError: line => errors.push(line),
  });
  return { code, output: output.join('\n'), errors: errors.join('\n') };
}

type Exhaustive<T extends string, U extends readonly T[]> =
  Exclude<T, U[number]> extends never ? true : false;

/**
 * Compile-time proof that the runtime vocabulary covers every closed union.
 * If a contract gains a member, one of these assignments stops compiling.
 */
const VOCABULARY_IS_EXHAUSTIVE: readonly boolean[] = [
  true as Exhaustive<StageCondition['type'], typeof STAGE_CONDITION_TYPES>,
  true as Exhaustive<StageSignal['type'], typeof STAGE_SIGNAL_TYPES>,
  true as Exhaustive<StageSignalFilter['field'], typeof STAGE_SIGNAL_FILTER_FIELDS>,
  true as Exhaustive<StageCommand['type'], typeof STAGE_COMMAND_TYPES>,
  true as Exhaustive<StageReward['type'], typeof STAGE_REWARD_TYPES>,
  true as Exhaustive<StageMissionStatus, typeof STAGE_MISSION_STATUSES>,
  true as Exhaustive<'stage' | 'chapter' | 'campaign', typeof STAGE_MISSION_SCOPES>,
  true as Exhaustive<'stage-enter' | 'dialogue' | 'event', typeof STAGE_MISSION_START_MODES>,
  true as Exhaustive<StageEncounterStart, typeof STAGE_ENCOUNTER_START_MODES>,
  true as Exhaustive<StageEncounterCompletion, typeof STAGE_ENCOUNTER_COMPLETION_MODES>,
  true as Exhaustive<StageEncounterScaling, typeof STAGE_ENCOUNTER_SCALING_MODES>,
  true as Exhaustive<StageEncounterSource['kind'], typeof STAGE_ENCOUNTER_SOURCE_KINDS>,
  true as Exhaustive<StageEffectKind, typeof STAGE_EFFECT_KINDS>,
  true as Exhaustive<StageAudioEvent, typeof STAGE_AUDIO_EVENTS>,
  true as Exhaustive<StageSoundWaveform, typeof STAGE_SOUND_WAVEFORMS>,
  true as Exhaustive<StageVisualLayer, typeof STAGE_VISUAL_LAYERS>,
  true as Exhaustive<StageVisualPerspective, typeof STAGE_VISUAL_PERSPECTIVES>,
  true as Exhaustive<StageVisualScaleClass, typeof STAGE_VISUAL_SCALE_CLASSES>,
];

function reportFromCli(): StageAuthoringCapabilitiesReport {
  const result = runRaw(['capabilities', '--json']);
  expect(result.code).toBe(0);
  expect(result.errors).toBe('');
  return JSON.parse(result.output) as StageAuthoringCapabilitiesReport;
}

function capabilityStatus(
  report: StageAuthoringCapabilitiesReport,
  id: string,
): string | undefined {
  return report.runtimeProfile.capabilities.find(capability => capability.id === id)?.status;
}

describe('Etapa 9.9 stage authoring capabilities', () => {
  it('parses capabilities usage and keeps existing commands intact', () => {
    expect(parseChapterCliArguments(['capabilities'])).toMatchObject({
      command: 'capabilities',
      json: false,
      visual: false,
    });
    expect(parseChapterCliArguments(['capabilities', '--json'])).toMatchObject({
      command: 'capabilities',
      json: true,
    });
    expect(parseChapterCliArguments(['inspect', 'floresta', '--json'])).toMatchObject({
      command: 'inspect',
      slug: 'floresta',
      json: true,
    });
    expect(parseChapterCliArguments(['create', 'floresta']).command).toBe('create');
    expect(CHAPTER_CLI_HELP).toContain('npm run chapter -- capabilities [--json]');
  });

  it('rejects chapter slugs and unsupported options for capabilities', () => {
    for (const argv of [
      ['capabilities', 'floresta'],
      ['capabilities', '--visual'],
      ['capabilities', '--title', 'x'],
    ]) {
      expect(() => parseChapterCliArguments(argv)).toThrow(ChapterCliError);
      const result = runRaw(argv);
      expect(result.code).toBe(2);
      expect(result.errors).toMatch(/usage\./);
    }
  });

  it('prints a grouped report that names supported and planned resources', () => {
    const result = runRaw(['capabilities']);
    expect(result.code).toBe(0);
    expect(result.errors).toBe('');
    expect(result.output).toContain('Stage authoring capabilities');
    expect(result.output).toContain('Capabilities: 62 total — 52 supported, 10 planned');
    expect(result.output).toContain('tile.floor [0] floor — supported');
    expect(result.output).toContain('affinity (enemy.affinity, supported)');
    expect(result.output).toContain('health_herb (item.health-herb, supported)');
    expect(result.output).toContain('Encounter limits: 64 enemies per wave, levels 1..10');
    expect(result.output).toContain('theme.gothic-cathedral (planned)');
    expect(result.output).toContain('runtime.planned-capabilities');
    expect(result.output).toContain('npm run chapter -- capabilities --json');
  });

  it('emits a stable JSON document with no surrounding text', () => {
    const first = runRaw(['capabilities', '--json']);
    const second = runRaw(['capabilities', '--json']);
    expect(first.code).toBe(0);
    expect(first.output.startsWith('{')).toBe(true);
    expect(first.output.trimEnd().endsWith('}')).toBe(true);
    const report = JSON.parse(first.output) as StageAuthoringCapabilitiesReport;
    expect(report).toMatchObject({
      schemaVersion: 1,
      kind: 'umbra.stage-authoring.capabilities',
      revision: 1,
      runtimeProfile: {
        id: DEFAULT_STAGE_RUNTIME_CAPABILITIES.id,
        revision: DEFAULT_STAGE_RUNTIME_CAPABILITIES.revision,
        schemaVersion: 1,
      },
    });
    expect(second.output).toBe(first.output);
    expect(reportFromCli()).toEqual(report);
  });

  it('publishes exactly the runtime profile, with unique stable ids and matching categories', () => {
    const report = reportFromCli();
    const expected = [...DEFAULT_STAGE_RUNTIME_CAPABILITIES.capabilities]
      .sort((left, right) => (left.id < right.id ? -1 : left.id > right.id ? 1 : 0));
    expect(report.runtimeProfile.capabilities).toEqual(expected);

    const profile = new Map(expected.map(capability => [capability.id, capability]));
    const seen = new Set<string>();
    for (const capability of report.runtimeProfile.capabilities) {
      expect(capability.id).toMatch(STABLE_ID);
      expect(seen.has(capability.id)).toBe(false);
      seen.add(capability.id);
      expect(profile.get(capability.id)).toMatchObject({
        category: capability.category,
        version: capability.version,
        status: capability.status,
      });
    }
    expect(report.runtimeProfile.counts).toEqual({
      total: expected.length,
      supported: expected.filter(capability => capability.status === 'supported').length,
      planned: expected.filter(capability => capability.status === 'planned').length,
    });
  });

  it('derives tiles, enemies, items, biomes and themes from real capability ids', () => {
    const report = reportFromCli();
    expect(report.authoring.tiles).toHaveLength(10);
    report.authoring.tiles.forEach((tile, index) => {
      expect(tile.value).toBe(index);
      expect(tile.id).toBe(`tile.${tile.name}`);
      expect(tile.status).toBe(capabilityStatus(report, tile.id));
    });

    expect(report.authoring.enemies.map(enemy => enemy.id).sort()).toEqual([
      'affinity', 'applaud', 'boss', 'fortitudo', 'miniboss', 'ranged',
    ]);
    report.authoring.enemies.forEach(enemy => {
      expect(enemy.capabilityId).toBe(`enemy.${enemy.id}`);
      expect(enemy.status).toBe(capabilityStatus(report, enemy.capabilityId));
    });

    report.authoring.items.forEach(item => {
      expect(item.capabilityId).toBe(`item.${item.type.replace(/_/g, '-')}`);
      expect(item.status).toBe(capabilityStatus(report, item.capabilityId));
    });

    for (const entry of [...report.authoring.biomes, ...report.authoring.themes]) {
      expect(entry.capabilityId).toMatch(STABLE_ID);
      expect(entry.status).toBe(capabilityStatus(report, entry.capabilityId));
    }
  });

  it('reports planned capabilities as unavailable instead of supported', () => {
    const report = reportFromCli();
    const planned = report.runtimeProfile.capabilities
      .filter(capability => capability.status === 'planned')
      .map(capability => capability.id);
    expect(planned).toContain('theme.gothic-cathedral');
    expect(report.authoring.themes
      .filter(theme => theme.status === 'planned')
      .map(theme => theme.capabilityId))
      .toEqual(expect.arrayContaining(planned));

    const limitation = report.limitations.find(item => item.id === 'runtime.planned-capabilities');
    expect(limitation).toBeDefined();
    expect(limitation?.severity).toBe('warning');
    expect(limitation?.relatedCapabilityIds).toEqual(planned);

    const template = createChapterTemplate('capabilities.probe');
    const stage: StageModule = template.stage;
    const required = new StageValidator().validateModule({
      ...stage,
      manifest: {
        ...stage.manifest,
        capabilities: [{
          id: 'theme.gothic-cathedral',
          category: 'theme',
          minimumVersion: 1,
          requirement: 'required',
        }],
      },
    });
    expect(required).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'capability.unavailable', severity: 'error' }),
    ]));
    const optional = new StageValidator().validateModule({
      ...stage,
      manifest: {
        ...stage.manifest,
        capabilities: [{
          id: 'theme.gothic-cathedral',
          category: 'theme',
          minimumVersion: 1,
          requirement: 'optional',
        }],
      },
    });
    expect(optional).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'capability.unavailable', severity: 'warning' }),
    ]));
  });

  it('keeps the production catalog compatible and only uses supported resources', () => {
    const registry = new StageRegistry();
    registerLegacyStages(registry);
    expect(() => registerCampaignChapters(registry)).not.toThrow();
    expect(registry.validate()).toEqual([]);

    const report = reportFromCli();
    const tileByValue = new Map(report.authoring.tiles.map(tile => [tile.value, tile]));
    const enemyById = new Map(report.authoring.enemies.map(enemy => [enemy.id, enemy]));
    const itemByType = new Map(report.authoring.items.map(item => [item.type, item]));

    for (const entry of CAMPAIGN_CHAPTER_CATALOG) {
      for (const stage of entry.stages) {
        const level = stage.authoredLevel;
        if (!level) continue;
        level.tileMap.forEach(row => row.forEach(tile => {
          const published = tileByValue.get(tile);
          expect(published?.status).toBe('supported');
        }));
        [...(level.enemies ?? []), ...(level.ambush ?? []),
          ...(level.waves ?? []).flatMap(wave => wave.enemies ?? [])].forEach(enemy => {
          expect(enemyById.get(enemy.type)?.status).toBe('supported');
        });
        (level.items ?? []).forEach(item => {
          expect(itemByType.get(item.type)?.status).toBe('supported');
        });
      }
    }
  });

  it('keeps runtime vocabulary exhaustive and reports only real ids', () => {
    expect(VOCABULARY_IS_EXHAUSTIVE.every(Boolean)).toBe(true);
    const report = reportFromCli();
    const profileIds = new Set(report.runtimeProfile.capabilities.map(capability => capability.id));
    for (const enemy of report.authoring.enemies) expect(profileIds.has(enemy.capabilityId)).toBe(true);
    for (const item of report.authoring.items) expect(profileIds.has(item.capabilityId)).toBe(true);
    for (const biome of report.authoring.biomes) expect(profileIds.has(biome.capabilityId)).toBe(true);
    for (const theme of report.authoring.themes) expect(profileIds.has(theme.capabilityId)).toBe(true);
    for (const tile of report.authoring.tiles) expect(profileIds.has(tile.id)).toBe(true);
    expect(report.dynamicResources.map(resource => resource.id)).toEqual([
      'visualResources.textures',
      'visualResources.tilesets',
      'visualResources.themes',
      'visualResources.decorations',
      'visualResources.sprites',
      'visualResources.sounds',
      'visualResources.audioProfiles',
      'visualResources.environments',
    ]);
    expect(report.discovery.unavailable).toEqual(expect.arrayContaining([
      'Phaser texture and animation existence',
    ]));
    expect(createStageAuthoringCapabilities()).toEqual(report);
  });
});
