import type { StagePlanValidationReport } from './plan';
import type { PlaytestChapterReport } from './playtest';
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
  print(`Geometry: ${created.template.geometry.template} (seed ${created.template.geometry.seed}, ` +
    `${created.template.geometry.width}x${created.template.geometry.height}, ` +
    `${created.template.geometry.regionCount} regions)`);
  print(`Files (${created.files.length}): ${created.files.join(', ')}`);
  print('Next steps:');
  print(`  npm run chapter -- plan validate ${slug}`);
  print(`  npm run chapter -- validate ${slug}`);
  print(`  npm run chapter -- inspect ${slug}`);
  print(`  npm run chapter -- preview ${slug}`);
  print(`  npm run chapter -- preview ${slug} --visual`);
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
      ? `theme ${stage.presentation.themeId}, tileset ${stage.presentation.tilesetId ?? 'inherit'}, variants ${list(stage.presentation.presentationVariantIds)}, NPC ${list(stage.presentation.npcPresentationIds)}, enemies ${list(stage.presentation.enemyArchetypes)}, audio ${stage.presentation.audioProfileId ?? 'none'}, environment ${stage.presentation.environmentId ?? 'none'}`
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

export function printPlanValidationReport(
  report: StagePlanValidationReport,
  json: boolean,
  print: (line: string) => void,
): void {
  if (json) {
    print(JSON.stringify(report, null, 2));
    return;
  }
  const { summary } = report;
  print(`Plan: ${summary.planId ?? 'unknown'} — ${report.planPath}`);
  print(`Stage: ${summary.stageId ?? 'not declared'}  Progression: ${summary.progression ?? 'unknown'}`);
  print(`Regions: ${summary.regions}  Objectives: ${summary.objectives}  ` +
    `Encounters: ${summary.encounters}  Interactions: ${summary.interactions}  ` +
    `Exit conditions: ${summary.exitConditions}`);
  print(`Errors: ${report.errors.length}  Warnings: ${report.warnings.length}  ` +
    `Infos: ${report.infos.length}`);
  if (report.diagnostics.length > 0) {
    print('Diagnostics:');
    printDiagnostics(report.diagnostics, print);
  }
  print('Phaser assets: not executed (logical plan validation only).');
  print(`Result: ${report.ok ? report.warnings.length > 0 ? 'OK (warnings)' : 'OK' : 'FAILED'}`);
}

export function printPlaytestReport(
  report: PlaytestChapterReport,
  json: boolean,
  print: (line: string) => void,
): void {
  if (json) {
    print(JSON.stringify(report, null, 2));
    return;
  }
  print(`Playtest: ${report.chapterId} — ${report.title}`);
  print(`Stage: ${report.stageId}  Template: ${report.template ?? 'none'}`);
  print(`Seeds: ${report.summary.seeds}  Pass: ${report.summary.passed}  ` +
    `Fail: ${report.summary.failed}  Unknown: ${report.summary.unknown}`);
  print(`Checks: ${report.summary.checks} total, ${report.summary.failedChecks} failed, ` +
    `${report.summary.unknownChecks} unknown`);
  report.seeds.forEach(seed => {
    print('');
    print(`Seed ${seed.seed ?? 'authored'} (${seed.source}): ${seed.result}  ` +
      `plan=${seed.plan.source}  checks ${seed.checks.length}, ` +
      `${seed.checks.filter(check => check.status === 'FAIL').length} failed, ` +
      `${seed.checks.filter(check => check.status === 'UNKNOWN').length} unknown`);
    if (report.seeds.length === 1) {
      print(`  Player body: ${seed.character.bodyWidth}x${seed.character.bodyHeight} px ` +
        `(clearance grid ${seed.character.sampleStep} px)`);
      print('  Regions:');
      if (seed.regions.length === 0) print('    none');
      seed.regions.forEach(region => print(
        `    ${region.status.padEnd(7)} ${region.id} (${region.role}) ` +
        `${region.anchor ? `@${region.anchor.x},${region.anchor.y}` : '@no-anchor'}` +
        `${region.distance !== null ? ` distance=${region.distance}` : ''} — ${region.message}`,
      ));
    } else {
      const passedRegions = seed.regions.filter(region => region.status === 'PASS').length;
      print(`  Regions: ${seed.regions.length} checked, ${passedRegions} PASS`);
    }
    const problems = seed.checks.filter(check => check.status !== 'PASS');
    if (problems.length > 0) {
      print('  Problems and unverified checks:');
      problems.forEach(check => {
        const location = check.location ? ` @${check.location.x},${check.location.y}` : '';
        const blocking = check.required ? '' : ' (non-blocking)';
        print(`    ${check.status.padEnd(7)} [${check.code}] ${check.id}${location}${blocking} — ${check.message}`);
        if (check.suggestion) print(`      suggestion: ${check.suggestion}`);
      });
    }
    if (report.seeds.length === 1) {
      print('  Passed checks:');
      seed.checks.filter(check => check.status === 'PASS').forEach(check => print(
        `    ${check.code} (${check.id})${check.referenceId ? ` ref=${check.referenceId}` : ''}`,
      ));
    }
    if (seed.plan.diagnostics.length > 0) {
      print('  Plan diagnostics:');
      printDiagnostics(seed.plan.diagnostics, line => print(`    ${line}`));
    }
    if (report.seeds.length > 1) {
      print(`  Chapter validation: ${seed.validation.errors} errors, ${seed.validation.warnings} warnings`);
    }
    print(`  Camera: ${seed.camera.status} — ${seed.camera.message}`);
    print(`  Live execution: ${seed.liveExecution}`);
  });
  print('');
  print(`Chapter validation: ${report.validation.errors} errors, ${report.validation.warnings} warnings`);
  if (report.validation.diagnostics.length > 0) printDiagnostics(report.validation.diagnostics, print);
  print('Phaser execution: not executed (static geometry and narrative satisfiability only).');
  print(`Result: ${report.result === 'UNKNOWN' ? 'INCONCLUSIVE' : report.result} ` +
    '(static playtest; live Phaser execution UNKNOWN)');
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
  if (preview.visual) {
    print('Phaser rendering: prepared, not executed by the CLI.');
    print(`Visual preview URL: ${preview.visual.url}`);
    print(`Authoring root: ${preview.visual.authoringRoot} (static Vite discovery).`);
    print(preview.visual.note);
    print('The preview never writes the main campaign save or the production catalog.');
  } else {
    print('Phaser rendering: not executed.');
    print('Access: use GameSessionService or WorldLabDataService with the isolated registry described in the chapter README.');
  }
}
