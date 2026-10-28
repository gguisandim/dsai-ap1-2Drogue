import { CORRIDOR_LEVEL } from '../../data/CorridorLevelData';
import { ALL_LEVELS, LevelDefinition } from '../../data/LevelData';
import { VERSE_SECTIONS } from '../../data/VerseLevelData';
import { cloneLevelDefinition } from './LevelDefinitionCopy';

const DEFAULT_LEGACY_LEVELS: readonly LevelDefinition[] = [
  ...VERSE_SECTIONS,
  ...ALL_LEVELS,
  CORRIDOR_LEVEL,
];

export class LegacyLevelAdapter {
  private readonly levels = new Map<string, LevelDefinition>();

  public constructor(levels: readonly LevelDefinition[] = DEFAULT_LEGACY_LEVELS) {
    levels.forEach(level => {
      if (this.levels.has(level.id)) throw new Error(`duplicate legacy level id: ${level.id}`);
      this.levels.set(level.id, level);
    });
  }

  public resolve(levelId: string): LevelDefinition | undefined {
    const level = this.levels.get(levelId);
    return level ? cloneLevelDefinition(level) : undefined;
  }
}
