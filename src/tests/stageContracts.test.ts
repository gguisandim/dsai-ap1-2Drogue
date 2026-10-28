import { LevelDefinition } from '../data/LevelData';
import {
  StageModule,
  StageValidator,
} from '../stages';

function authoredLevel(id = 'test.stage'): LevelDefinition {
  return {
    id,
    name: 'Test Stage',
    description: 'A headless contract fixture.',
    theme: 'gothic_cathedral',
    music: 'none',
    ambientColor: 0,
    fogColor: 0,
    fogDensity: 0,
    lightIntensity: 1,
    tileMap: [
      [1, 1, 1],
      [1, 8, 5],
      [1, 1, 1],
    ],
    enemies: [],
    items: [],
    decorations: [],
    parTime: 30,
    difficulty: 1,
  };
}

function validAuthoredModule(): StageModule {
  return {
    manifest: {
      schemaVersion: 1,
      id: 'test.stage',
      revision: 1,
      chapterId: 'test.chapter',
      order: 0,
      title: 'Test Stage',
      summary: 'A valid authored stage.',
      layout: { kind: 'authored' },
      exits: [{
        id: 'test.exit',
        anchor: { kind: 'tile', x: 2, y: 1 },
        targetStageId: 'campaign.complete',
      }],
    },
    authoredLevel: authoredLevel(),
  };
}

describe('stage public contracts', () => {
  it('accepts a complete authored StageModule without Phaser state', () => {
    const validator = new StageValidator();

    expect(validator.validateModule(validAuthoredModule())).toEqual([]);
  });

  it('reports schema, identity, revision, layout, anchor and exit invariants deterministically', () => {
    const fixture = validAuthoredModule() as unknown as Record<string, any>;
    fixture.manifest = {
      ...fixture.manifest,
      schemaVersion: 2,
      id: 'Invalid Stage',
      revision: 0,
      chapterId: 'Invalid Chapter',
      order: -1,
      title: ' ',
      summary: '',
      layout: { kind: 'authored' },
      exits: [
        { id: 'same.exit', anchor: { kind: 'tile', x: -1, y: 1 }, targetStageId: 'Bad Target' },
        { id: 'same.exit', anchor: { kind: 'map-exit' }, targetStageId: 'campaign.complete' },
      ],
    };
    delete fixture.authoredLevel;
    const validator = new StageValidator();

    const first = validator.validateModule(fixture as unknown as StageModule);
    const second = validator.validateModule(fixture as unknown as StageModule);

    expect(second).toEqual(first);
    expect(first.map(diagnostic => diagnostic.code)).toEqual([
      'stage.layout.authored-level-required',
      'stage.chapter-id.invalid',
      'stage.exit.anchor.invalid',
      'stage.exit.target-id.invalid',
      'stage.exit.id.duplicate',
      'stage.id.invalid',
      'stage.order.invalid',
      'stage.revision.invalid',
      'stage.schema-version.unsupported',
      'stage.summary.required',
      'stage.title.required',
    ]);
  });

  it('rejects missing routes and invalid procedural sources at runtime', () => {
    const module = {
      manifest: {
        schemaVersion: 1,
        id: 'test.procedural',
        revision: 1,
        chapterId: 'test.chapter',
        order: 1,
        title: 'Procedural',
        summary: 'Runtime-invalid data cast through an external boundary.',
        layout: {
          kind: 'procedural',
          preset: 'missing-preset',
          seed: 'fixed-seed',
          overrides: { seed: 'override' },
        },
        exits: [],
      },
    } as unknown as StageModule;

    expect(new StageValidator().validateModule(module).map(diagnostic => diagnostic.code)).toEqual([
      'stage.exit.required',
      'stage.layout.procedural-seed-override',
      'stage.layout.procedural-preset-unknown',
      'stage.layout.procedural-seed-invalid',
    ]);
  });
});
