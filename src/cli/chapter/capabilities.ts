import type { StageAuthoringCapabilitiesReport } from '../../stages';

function list(values: readonly string[], empty = 'none'): string {
  return values.length > 0 ? values.join(', ') : empty;
}

function resourceList(
  values: readonly { readonly id: string; readonly status: string }[],
  withStatus = false,
): string {
  if (values.length === 0) return 'none';
  return values
    .map(value => withStatus ? `${value.id} (${value.status})` : value.id)
    .join(', ');
}

/** Prints either the stable JSON document or a grouped human-readable report. */
export function printCapabilities(
  report: StageAuthoringCapabilitiesReport,
  json: boolean,
  print: (line: string) => void,
): void {
  if (json) {
    print(JSON.stringify(report, null, 2));
    return;
  }

  const { runtimeProfile, authoring } = report;
  print(`Stage authoring capabilities — ${runtimeProfile.id}`);
  print(`Profile revision: ${runtimeProfile.revision} (schema ${runtimeProfile.schemaVersion})`);
  print(`Capabilities: ${runtimeProfile.counts.total} total — ` +
    `${runtimeProfile.counts.supported} supported, ${runtimeProfile.counts.planned} planned`);
  print('');

  print(`Tiles (${authoring.tiles.length}):`);
  authoring.tiles.forEach(tile =>
    print(`  ${tile.id} [${tile.value}] ${tile.name} — ${tile.status}`));
  print(`Enemy archetypes (${authoring.enemies.length}): ${authoring.enemies
    .map(enemy => `${enemy.id} (${enemy.capabilityId}, ${enemy.status})`).join(', ')}`);
  print(`Items (${authoring.items.length}): ${authoring.items
    .map(item => `${item.type} (${item.capabilityId}, ${item.status})`).join(', ')}`);
  print(`Biomes (${authoring.biomes.length}): ${resourceList(authoring.biomes, true)}`);
  print(`Runtime themes (${authoring.themes.length}): ${resourceList(authoring.themes, true)}`);
  print(`Effects (${authoring.visual.effectKinds.length}): ${list(authoring.visual.effectKinds)}`);
  print(`Sound waveforms: ${list(authoring.visual.soundWaveforms)}`);
  print(`Audio events: ${list(authoring.visual.audioEvents)}`);
  print('');

  const { narrative, encounters, transitions, visual, campaignCatalog } = authoring;
  print('Narrative and gameplay:');
  print(`  Conditions: ${list(narrative.conditionTypes)}`);
  print(`  Mission statuses: ${list(narrative.missionStatuses)}`);
  print(`  Mission scopes: ${list(narrative.missionScopes)}`);
  print(`  Mission start modes: ${list(narrative.missionStartModes)}`);
  print(`  NPC roles: ${list(narrative.npcRoles)}`);
  print(`  Dialogue built-in speakers: ${list(narrative.dialogueBuiltinSpeakers)}`);
  print(`  Signals: ${list(narrative.signalTypes)}`);
  print(`  Signal filters: ${list(narrative.signalFilterFields)}`);
  print(`  Commands: ${list(narrative.commandTypes)}`);
  print(`  Rewards: ${list(narrative.rewardTypes)}`);
  print(`  Flags: declared in ${narrative.flags.declaredIn} with ` +
    `${list(narrative.flags.valueTypes)} values`);
  print(`  Encounter start: ${list(encounters.startModes)}`);
  print(`  Encounter completion: ${list(encounters.completionModes)}`);
  print(`  Encounter scaling: ${list(encounters.scalingModes)}`);
  print(`  Encounter sources: ${list(encounters.sourceKinds)}`);
  print(`  Encounter limits: ${encounters.maximumEnemiesPerWave} enemies per wave, levels ` +
    `${encounters.enemyLevelRange.minimum}..${encounters.enemyLevelRange.maximum}`);
  print(`  Layouts: ${list(transitions.layoutKinds)}`);
  print(`  Exit anchors: ${list(transitions.anchorKinds)}`);
  print(`  Exit targets: ${list(transitions.exitTargetKinds)}`);
  print(`  Presentation variants: ${visual.presentationVariants.field} (supported)`);
  print(`  Catalog participation: ${list(campaignCatalog.participations)}; roles: ` +
    `${list(campaignCatalog.roles)}; revisit: ${list(campaignCatalog.revisits)}`);
  print(`  Catalog limits: difficulty >= ${campaignCatalog.minimumDifficulty}; physical exits ` +
    `${list(campaignCatalog.maximumPhysicalExits.map(String))}`);
  print('');

  print(`Procedural presets (${authoring.proceduralPresets.length}):`);
  authoring.proceduralPresets.forEach(preset =>
    print(`  ${preset.id} — biome ${preset.biome}, algorithm ${preset.algorithm}`));
  print('');

  const categories = new Map<string, { supported: string[]; planned: string[] }>();
  runtimeProfile.capabilities.forEach(capability => {
    const group = categories.get(capability.category)
      ?? { supported: [], planned: [] };
    group[capability.status].push(capability.id);
    categories.set(capability.category, group);
  });
  print(`Runtime capabilities by category (${categories.size}):`);
  categories.forEach((group, category) => {
    print(`  ${category} (${group.supported.length} supported` +
      `${group.planned.length > 0 ? `, ${group.planned.length} planned` : ''}): ` +
      `${list(group.supported)}`);
    if (group.planned.length > 0) print(`    planned: ${group.planned.join(', ')}`);
  });
  print('');

  print('Dynamic resources (owned by chapter manifests):');
  report.dynamicResources.forEach(resource =>
    print(`  ${resource.id} [${resource.kind}] — ${resource.note}`));
  print('');

  print('Rules:');
  report.rules.forEach(rule => print(`  ${rule.severity.toUpperCase()} ${rule.id} — ${rule.message}`));
  print('');

  print('Limitations:');
  report.limitations.forEach(item => {
    const related = item.relatedCapabilityIds.length > 0
      ? ` (${item.relatedCapabilityIds.join(', ')})`
      : '';
    print(`  ${item.severity.toUpperCase()} ${item.id}${related} — ${item.message}`);
  });
  print('');

  print(`Discovery automatic: ${list(report.discovery.automatic)}`);
  print(`Discovery dynamic: ${list(report.discovery.dynamic)}`);
  print(`Not discoverable: ${list(report.discovery.unavailable)}`);
  print('');
  print('Use `npm run chapter -- capabilities --json` for the stable machine-readable document.');
}
