import type {
  ChapterInspection,
  ChapterPreview,
  ChapterValidationReport,
  CliDiagnostic,
  CreatedChapter,
} from './types';

function list(values: readonly string[], empty = 'none'): string {
  return values.length > 0 ? values.join(', ') : empty;
}

export function formatDiagnostic(value: CliDiagnostic): string {
  const location = value.path.length > 0 ? value.path.map(String).join('.') : '-';
  const context = [
    value.stageId ? `stage=${value.stageId}` : '',
    value.chapterId ? `chapter=${value.chapterId}` : '',
    value.referenceId ? `ref=${value.referenceId}` : '',
  ].filter(Boolean).join(' ');
  return `${value.severity.toUpperCase().padEnd(7)} [${value.code}] (${value.origin}/${value.component ?? 'cli'}) ${location}${context ? ` ${context}` : ''} — ${value.message}`;
}

export function printDiagnostics(
  diagnostics: readonly CliDiagnostic[],
  print: (line: string) => void,
): void {
  diagnostics.forEach(item => print(formatDiagnostic(item)));
}

export function printValidationReport(
  report: ChapterValidationReport,
  print: (line: string) => void,
): void {
  print(`Chapter: ${report.chapter.id} — ${report.chapter.title} (revision ${report.chapter.revision})`);
  print(`Stages: ${report.chapter.stageIds.length}`);
  print(`Eligibility: ${report.eligibility ?? 'unknown'}  Campaign candidate: ${report.campaignCandidate ? 'yes' : 'no'}`);
  print(`Individual: ${report.loadability ?? 'unknown'}  available: ${report.individualAvailable ? 'yes' : 'no'}`);
  print(`Errors: ${report.errors.length}  Warnings: ${report.warnings.length}`);
  if (report.diagnostics.length > 0) {
    print('Diagnostics:');
    printDiagnostics(report.diagnostics, print);
  }
  print('Phaser assets: not executed (headless validation only).');
  print(`Result: ${report.errors.length > 0 ? 'FAILED' : report.warnings.length > 0 ? 'OK (warnings)' : 'OK'}`);
}

export function printCreateResult(
  created: CreatedChapter,
  slug: string,
  print: (line: string) => void,
): void {
  print(`Created chapter ${created.template.ids.chapterId} at ${created.relativeDir}`);
  print(`Stage: ${created.template.ids.stageId}`);
  print(`Namespace: ${created.template.namespace}`);
  print(`Revision: ${created.template.chapter.revision}`);
  print(`Files (${created.files.length}): ${created.files.join(', ')}`);
  print('Next steps:');
  print(`  npm run chapter -- validate ${slug}`);
  print(`  npm run chapter -- inspect ${slug}`);
  print(`  npm run chapter -- preview ${slug}`);
  print('The generated chapter is NOT registered in the production catalog.');
}

export function printInspection(
  inspection: ChapterInspection,
  print: (line: string) => void,
): void {
  print(`Chapter: ${inspection.chapter.title} (${inspection.chapter.id}) revision ${inspection.chapter.revision}`);
  print(`Stages: ${inspection.chapter.stageCount}`);
  inspection.stages.forEach(stage => {
    print('');
    print(`Stage: ${stage.id} — ${stage.title} (revision ${stage.revision}, order ${stage.order}, ${stage.layoutKind})`);
    print(`  Regions: ${list(stage.regions)}`);
    print(`  Biomes: ${list(stage.biomes)}`);
    print(`  Capabilities: ${list(stage.capabilities)}`);
    print(`  Dependencies: ${stage.dependencies.length === 0 ? 'none' : stage.dependencies.map(item =>
      `${item.chapterId}@${item.minimumRevision}${item.optional ? ' (optional)' : ''}`).join(', ')}`);
    print(`  Exits: ${stage.exits.length === 0 ? 'none' : stage.exits.map(item =>
      `${item.id} -> ${item.targetStageId}${item.conditional ? ' (conditional)' : ''}`).join(', ')}`);
    print(`  Entry dialogue: ${stage.entryDialogueId ?? 'none'}`);
    print(`  Completion mission: ${stage.completionMissionId ?? 'none'}`);
    print(`  NPCs: ${list(stage.npcIds)}`);
    print(`  Dialogues: ${list(stage.dialogueIds)}`);
    print(`  Missions: ${list(stage.missionIds)}`);
    print(`  Events: ${list(stage.eventIds)}`);
    print(`  Encounter: ${stage.encounter
      ? `${stage.encounter.id} (${stage.encounter.waveCount} waves, ${stage.encounter.enemyCount} enemies: ${list(stage.encounter.enemyTypes)})`
      : 'none'}`);
    print(`  Presentation: ${stage.presentation
      ? `theme ${stage.presentation.themeId}, tileset ${stage.presentation.tilesetId ?? 'inherit'}, NPC ${list(stage.presentation.npcPresentationIds)}, enemies ${list(stage.presentation.enemyArchetypes)}, audio ${stage.presentation.audioProfileId ?? 'none'}, environment ${stage.presentation.environmentId ?? 'none'}`
      : 'none'}`);
    print(`  Catalog: ${stage.eligibility ?? 'unknown'} / ${stage.loadability ?? 'unknown'}`);
  });
  print('');
  if (inspection.visualResources) {
    const visual = inspection.visualResources;
    print(`Visual resources: ${visual.textureIds.length} textures, ${visual.tilesetIds.length} tilesets, ${visual.themeIds.length} themes`);
    print(`  Tilesets: ${list(visual.tilesetIds)}`);
    print(`  Themes: ${list(visual.themeIds)}`);
    print(`  Decorations: ${list(visual.decorationIds)}`);
    print(`  Sprites: ${list(visual.spriteIds)}`);
    print(`  Sounds: ${list(visual.soundIds)}`);
    print(`  Audio profiles: ${list(visual.audioProfileIds)}`);
    print(`  Environments: ${list(visual.environmentIds)}`);
  } else {
    print('Visual resources: none');
  }
  print('');
  print(`Campaign candidate: ${inspection.campaignCandidate ? 'yes' : 'no'}`);
  print(`Individual available: ${inspection.individualAvailable ? 'yes' : 'no'}`);
  print(`Diagnostics: ${inspection.diagnostics.length === 0 ? 'none' : ''}`);
  if (inspection.diagnostics.length > 0) printDiagnostics(inspection.diagnostics, print);
  print('Phaser assets: not executed (headless inspection only).');
}

export function printPreview(
  preview: ChapterPreview,
  print: (line: string) => void,
): void {
  print('Preview: headless. No rendering was executed.');
  print(`Chapter: ${preview.report.chapter.id} — ${preview.report.chapter.title}`);
  print(`Validation: ${preview.report.errors.length > 0 ? 'FAILED' : 'OK'} (${preview.report.errors.length} errors, ${preview.report.warnings.length} warnings)`);
  preview.individual.forEach(item => {
    print(item.ok
      ? `Individual ${item.stageId}: ready (level ${item.levelId ?? 'unknown'}, ${item.encounterWaves ?? 0} waves, theme ${item.themeId ?? 'unknown'})`
      : `Individual ${item.stageId}: failed (${item.error ?? 'unknown error'})`);
  });
  print(preview.worldLab.ok
    ? `World Lab: projected node ${preview.worldLab.nodeId ?? 'unknown'} as ${preview.worldLab.stageId ?? 'unknown'} (headless)`
    : `World Lab: not projected (${preview.worldLab.error ?? 'unknown error'})`);
  if (preview.worldLab.diagnostics.length > 0) {
    print('World Lab diagnostics:');
    printDiagnostics(preview.worldLab.diagnostics, print);
  }
  print('Phaser rendering: not executed.');
  print('Access: use GameSessionService or WorldLabDataService with the isolated registry described in the chapter README.');
}
