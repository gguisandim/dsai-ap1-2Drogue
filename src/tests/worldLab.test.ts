import fs from 'node:fs';
import path from 'node:path';
import {
  WORLD_LAB_SNAPSHOT_SCHEMA,
  WorldLabDataService,
  WorldLabSession,
  WorldLabSnapshotCodec,
  type WorldLabDocument,
  type WorldLabGenerationResult,
} from '../devtools/world-lab';
import {
  CampaignExitBinder,
  PhysicalExitResolver,
  type CampaignExitBindingResult,
  type PhysicalExitResult,
  type StageLoadResult,
} from '../stages';

function expectDocument(result: WorldLabGenerationResult): WorldLabDocument {
  if (!result.ok) throw new Error(JSON.stringify(result.error));
  return result.value;
}

function reordered(document: WorldLabDocument): WorldLabDocument {
  return {
    ...document,
    nodes: [...document.nodes].reverse(),
    edges: [...document.edges].reverse(),
    stages: [...document.stages].reverse().map(stage => ({
      ...stage,
      markers: [...stage.markers].reverse(),
      physicalExitIds: [...stage.physicalExitIds].reverse(),
    })),
    diagnostics: [...document.diagnostics].reverse(),
  };
}

describe('Umbra World Lab headless model', () => {
  let document: WorldLabDocument;

  beforeAll(() => {
    document = expectDocument(new WorldLabDataService().generate('world-lab-test-seed'));
  });

  it('projects a real campaign graph and every loadable stage without changing stable ids', () => {
    expect(document.source).toBe('fixture-real-headless-pipeline');
    expect(document.nodes.length).toBeGreaterThanOrEqual(9);
    expect(document.nodes.length).toBeLessThanOrEqual(12);
    expect(document.stages).toHaveLength(document.nodes.length);
    expect(new Set(document.nodes.map(node => node.id)).size).toBe(document.nodes.length);
    expect(new Set(document.edges.map(edge => edge.id)).size).toBe(document.edges.length);
    expect(document.nodes.some(node => node.kind === 'milestone')).toBe(true);
    expect(document.edges.some(edge => edge.kind === 'branch')).toBe(true);
    expect(document.edges.some(edge => edge.kind === 'rejoin')).toBe(true);
  });

  it('preserves physical exit and binding identities in graph and stage views', () => {
    expect(document.edges.every(edge => edge.bindingStatus === 'bound')).toBe(true);
    for (const edge of document.edges) {
      expect(edge.stageExitId).toBe(edge.exitSlotId);
      expect(edge.association).toBe('synthetic-slot');
      expect(edge.tile).toBeDefined();
      const stage = document.stages.find(candidate => candidate.nodeId === edge.sourceNodeId);
      expect(stage?.physicalExitIds).toContain(edge.physicalExitId);
      expect(stage?.markers).toContainEqual(expect.objectContaining({
        kind: 'physical-exit',
        edgeId: edge.id,
        physicalExitId: edge.physicalExitId,
      }));
    }
  });

  it('is deterministic for repeated generation with the same seed', () => {
    const repeated = expectDocument(new WorldLabDataService().generate('world-lab-test-seed'));
    expect(repeated).toEqual(document);
  });

  it('exports canonical snapshots independent of view array order', () => {
    const codec = new WorldLabSnapshotCodec();
    expect(codec.export(reordered(document))).toBe(codec.export(document));
  });

  it('round-trips a deterministic, versioned snapshot', () => {
    const codec = new WorldLabSnapshotCodec();
    const serialized = codec.export(document);
    const imported = codec.import(serialized);

    expect(JSON.parse(serialized).schema).toBe(WORLD_LAB_SNAPSHOT_SCHEMA);
    expect(imported.ok).toBe(true);
    if (!imported.ok) return;
    expect(codec.export(imported.value.document)).toBe(serialized);
  });

  it('rejects corrupt, incompatible, duplicated and inconsistent snapshots', () => {
    const codec = new WorldLabSnapshotCodec();
    expect(codec.import('{').ok).toBe(false);
    expect(codec.import(JSON.stringify({ schema: 'umbra-world-lab/v2', document })).ok).toBe(false);

    const duplicate = JSON.parse(codec.export(document));
    duplicate.document.nodes.push(duplicate.document.nodes[0]);
    const duplicateResult = codec.import(JSON.stringify(duplicate));
    expect(duplicateResult.ok).toBe(false);
    if (!duplicateResult.ok) expect(duplicateResult.error.code).toBe('duplicate-id');

    const inconsistent = JSON.parse(codec.export(document));
    inconsistent.document.edges[0].sourceNodeId = 'node.unknown';
    const inconsistentResult = codec.import(JSON.stringify(inconsistent));
    expect(inconsistentResult.ok).toBe(false);
    if (!inconsistentResult.ok) expect(inconsistentResult.error.code).toBe('invalid-reference');
  });

  it('synchronizes a physical exit selection with its graph edge, node and tile', () => {
    const source = { generate: (): WorldLabGenerationResult => ({ ok: true, value: document }) };
    const session = new WorldLabSession(source, new WorldLabSnapshotCodec(), document.seed);
    session.generate();
    const edge = document.edges.find(candidate => candidate.tile) as typeof document.edges[number];

    expect(session.selectPhysicalExit(edge.physicalExitId)).toBe(true);
    expect(session.state().selection).toEqual({
      nodeId: edge.sourceNodeId,
      edgeId: edge.id,
      tile: edge.tile,
    });
  });

  it('keeps the prior document when snapshot import fails', () => {
    const source = { generate: (): WorldLabGenerationResult => ({ ok: true, value: document }) };
    const session = new WorldLabSession(source);
    session.generate();
    const before = session.state().document;

    const result = session.importSnapshot('{invalid');

    expect(result.ok).toBe(false);
    expect(session.state().document).toBe(before);
    expect(session.state().diagnostics[0].origin).toBe('snapshot');
  });

  it('keeps typed unavailable diagnostics when integrated data cannot be generated', () => {
    const unavailable: WorldLabGenerationResult = {
      ok: false,
      error: {
        diagnostics: [{
          code: 'world-lab.integration-unavailable',
          severity: 'warning',
          origin: 'integration',
          message: 'No integrated data.',
        }],
      },
    };
    const session = new WorldLabSession({ generate: () => unavailable });

    expect(session.generate()).toEqual(unavailable);
    expect(session.state().document).toBeUndefined();
    expect(session.state().diagnostics).toEqual(unavailable.error.diagnostics);
  });

  it('keeps generator, loader, resolver and binder failures distinguishable', () => {
    const generatorFailure = new WorldLabDataService({ templates: [] }).generate('failure-seed');
    expect(generatorFailure.ok).toBe(false);
    if (!generatorFailure.ok) {
      expect(generatorFailure.error.diagnostics.every(item => item.origin === 'campaign-generator'))
        .toBe(true);
    }

    const loadFailure: StageLoadResult = {
      ok: false,
      error: {
        code: 'stage-not-found',
        stageId: 'fixture.missing',
        diagnostics: [{
          code: 'stage.load.not-found', severity: 'error', message: 'Missing.',
          path: ['stage'], stageId: 'fixture.missing',
        }],
      },
    };
    const loaderFailure = new WorldLabDataService({
      loader: { load: () => loadFailure },
    }).generate('failure-seed');
    expect(loaderFailure.ok).toBe(true);
    if (loaderFailure.ok) {
      expect(loaderFailure.value.diagnostics.some(item => item.origin === 'stage-loader')).toBe(true);
      expect(loaderFailure.value.stages).toHaveLength(0);
    }

    class FailingResolver extends PhysicalExitResolver {
      public override resolve(): PhysicalExitResult {
        return {
          ok: false,
          error: {
            code: 'insufficient-exit-space',
            diagnostics: [{
              code: 'physical-exit.insufficient-space', severity: 'error',
              message: 'No physical space.', path: ['stage', 'level'],
            }],
          },
        };
      }
    }
    const resolverFailure = new WorldLabDataService({ resolver: new FailingResolver() })
      .generate('failure-seed');
    expect(resolverFailure.ok).toBe(true);
    if (resolverFailure.ok) {
      expect(resolverFailure.value.diagnostics.some(item => item.origin === 'physical-exit-resolver'))
        .toBe(true);
      expect(resolverFailure.value.diagnostics.some(item => item.code === 'world-lab.binding-unavailable'))
        .toBe(true);
    }

    class FailingBinder extends CampaignExitBinder {
      public override bind(): CampaignExitBindingResult {
        return {
          ok: false,
          error: {
            code: 'physical-exit-mismatch',
            diagnostics: [{
              code: 'campaign-exit.physical-exit-incompatible', severity: 'error',
              message: 'Mismatched exit.', path: ['binding'],
            }],
          },
        };
      }
    }
    const binderFailure = new WorldLabDataService({ binder: new FailingBinder() })
      .generate('failure-seed');
    expect(binderFailure.ok).toBe(true);
    if (binderFailure.ok) {
      expect(binderFailure.value.diagnostics.some(item => item.origin === 'campaign-exit-binder'))
        .toBe(true);
      expect(binderFailure.value.edges.every(edge => edge.bindingStatus === 'failed')).toBe(true);
    }
  });

  it('keeps World Lab unreachable from the production entry graph', () => {
    const root = path.resolve('src');
    const visited = new Set<string>();
    const queue = [path.join(root, 'main.ts')];
    while (queue.length > 0) {
      const file = queue.shift() as string;
      if (visited.has(file) || !fs.existsSync(file)) continue;
      visited.add(file);
      const source = fs.readFileSync(file, 'utf8');
      const imports = [...source.matchAll(/(?:import|export)\s+(?:[^'\"]*?\s+from\s+)?['\"]([^'\"]+)['\"]/g)]
        .map(match => match[1]).filter(specifier => specifier.startsWith('.'));
      for (const specifier of imports) {
        const base = path.resolve(path.dirname(file), specifier);
        const candidate = [base, `${base}.ts`, path.join(base, 'index.ts')]
          .find(item => fs.existsSync(item) && fs.statSync(item).isFile());
        if (candidate) queue.push(candidate);
      }
    }

    expect([...visited].some(file => file.includes(`${path.sep}devtools${path.sep}world-lab${path.sep}`)))
      .toBe(false);
    expect(fs.readFileSync('vite.config.ts', 'utf8'))
      .toContain("input: path.resolve(__dirname, 'src/index.html')");
  });
});

