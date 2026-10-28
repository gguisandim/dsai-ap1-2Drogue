import type { LevelDefinition } from '../../data/LevelData';
import { ProceduralLevelFactory } from '../../procedural';
import type { StageManifest } from '../contracts';

export class ProceduralStageAdapter {
  public constructor(
    private readonly factory: Pick<ProceduralLevelFactory, 'create'> = new ProceduralLevelFactory(),
  ) {}

  public resolve(manifest: StageManifest, runSeed: string | number): LevelDefinition {
    if (manifest.layout.kind !== 'procedural') {
      throw new Error(`stage is not procedural: ${manifest.id}`);
    }
    return this.factory.create({
      seed: `${String(runSeed)}:stage:${manifest.id}`,
      preset: manifest.layout.preset,
      overrides: manifest.layout.overrides ? { ...manifest.layout.overrides } : undefined,
      level: {
        id: manifest.id,
        name: manifest.title,
        description: manifest.summary,
      },
    });
  }
}
