jest.mock('phaser', () => {
  class Sprite {
    public readonly texture: { key: string };
    public displaySize?: readonly number[];
    public bodySize?: readonly number[];
    public bodyOffset?: readonly number[];
    public depth?: number;
    public tint?: number;
    public scale?: number;
    public played?: string;
    public body = { enable: true };
    public active = true;
    public displayHeight = 64;
    public x: number;
    public y: number;
    public scene: any;

    public constructor(scene: any, x: number, y: number, textureKey: string) {
      this.scene = scene;
      this.x = x;
      this.y = y;
      this.texture = { key: textureKey };
    }
    public setCollideWorldBounds(): this { return this; }
    public setBounce(): this { return this; }
    public setDisplaySize(...args: number[]): this { this.displaySize = args; return this; }
    public setSize(...args: number[]): this { this.bodySize = args; return this; }
    public setOffset(...args: number[]): this { this.bodyOffset = args; return this; }
    public setDepth(value: number): this { this.depth = value; return this; }
    public setTint(value: number): this { this.tint = value; return this; }
    public clearTint(): this { this.tint = undefined; return this; }
    public setScale(value: number): this { this.scale = value; return this; }
    public play(value: string): this { this.played = value; return this; }
    public stop(): this { return this; }
    public setFrame(): this { return this; }
    public setVelocity(): this { return this; }
    public once(): this { return this; }
    public destroy(): void {}
  }
  return {
    __esModule: true,
    default: {
      Scene: class {},
      Physics: { Arcade: { Sprite } },
      Math: { Distance: { Between: () => 100 } },
      Animations: { Events: { ANIMATION_COMPLETE: 'animationcomplete' } },
    },
  };
});

import { Enemy } from '../entities/Enemy';
import { RangedEnemy } from '../entities/RangedEnemy';
import { StageMapRenderError, StageMapRenderer } from '../presentation/stages/StageMapRenderer';
import {
  AGUAS_CHAPTER_MANIFEST,
  AGUAS_VISUAL_RESOURCES,
  IGAPO_DAS_MEMORIAS_STAGE,
  IGAPO_DAS_MEMORIAS_STAGE_ID,
  LEGACY_RESOLVED_NPC_SPRITE,
  StageLoader,
  StageRegistry,
  StageVisualRegistry,
  registerCampaignChapters,
  registerLegacyStages,
} from '../stages';
import { poiInteractionPoints } from '../application/interaction/WorldInteraction';
import type { ChapterManifest, StageModule } from '../stages';

function loadIgapo() {
  const registry = new StageRegistry();
  registerLegacyStages(registry);
  registerCampaignChapters(registry);
  const result = new StageLoader(registry).load({
    stageId: IGAPO_DAS_MEMORIAS_STAGE_ID,
    runId: 'run.entity-presentation',
    runSeed: 'seed.entity-presentation',
  });
  if (!result.ok || !result.value.presentation) throw new Error('Igapó did not load presentation.');
  return result.value as typeof result.value & { presentation: NonNullable<typeof result.value.presentation> };
}

function enemyScene() {
  const rectangle = () => ({
    setDepth() { return this; }, setOrigin() { return this; }, setScale() { return this; },
    setPosition() { return this; }, destroy() {},
  });
  return {
    add: { existing: jest.fn(), rectangle: jest.fn(rectangle) },
    physics: { add: { existing: jest.fn() } },
  } as any;
}

describe('stage entity presentation', () => {
  it('resolves the authored NPC sprite and enemy variants without changing logical archetypes', () => {
    const loaded = loadIgapo();
    expect(loaded.presentation.npcSprites['environment.memory-vestige']).toMatchObject({
      id: 'sprite.aguas.memory-vestige',
      textureKey: 'enemy_ranged_anim',
      animations: { idle: 'enemy_ranged_anim_walk' },
    });
    expect(loaded.presentation.enemySprites.affinity).toMatchObject({
      id: 'sprite.aguas.affinity-forgotten', textureKey: 'enemy_melee_anim', tint: 0x57a878,
    });
    expect(loaded.presentation.enemySprites.applaud).toMatchObject({
      id: 'sprite.aguas.applaud-forgotten', textureKey: 'enemy_ranged_anim', tint: 0x59b8c0,
    });
    expect(loaded.level.waves?.flatMap(wave => wave.enemies.map(enemy => enemy.type)))
      .toEqual(['affinity', 'applaud', 'affinity', 'affinity', 'applaud']);
  });

  it('keeps the legacy NPC and enemy presentation available as a compatible fallback', () => {
    expect(LEGACY_RESOLVED_NPC_SPRITE).toMatchObject({
      id: 'sprite.legacy.npc-marker', textureKey: 'poi_vestige', animations: {},
    });
    const visuals = new StageVisualRegistry();
    const resolved = visuals.resolve(
      { id: 'stage.legacy.fixture' } as StageModule['manifest'],
      { decorations: [] } as any,
    );
    expect(resolved.ok).toBe(true);
    if (!resolved.ok) return;
    expect(resolved.value.enemySprites.affinity).toMatchObject({
      textureKey: 'enemy_melee_anim', tint: 0xf2cf68,
    });
  });

  it('rejects unknown NPC/enemy sprites and a selected enemy sprite without required animations', () => {
    const loaded = loadIgapo();
    const registry = new StageVisualRegistry();
    registry.registerChapter(AGUAS_CHAPTER_MANIFEST);
    const invalidNpc = registry.validateManifest({
      ...loaded.manifest,
      presentation: {
        ...loaded.manifest.presentation!,
        npcSprites: { 'environment.memory-vestige': 'sprite.missing' },
      },
    }, loaded.npcs);
    expect(invalidNpc).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'stage.visual.sprite.unknown', referenceId: 'sprite.missing' }),
    ]));

    const invalidEnemy = registry.validateManifest({
      ...loaded.manifest,
      presentation: {
        ...loaded.manifest.presentation!, enemySprites: { affinity: 'sprite.missing' },
      },
    }, loaded.npcs);
    expect(invalidEnemy).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'stage.visual.enemy-sprite.unknown', referenceId: 'sprite.missing' }),
    ]));

    const chapter: ChapterManifest = {
      ...AGUAS_CHAPTER_MANIFEST,
      visualResources: {
        ...AGUAS_VISUAL_RESOURCES,
        sprites: AGUAS_VISUAL_RESOURCES.sprites?.map(sprite =>
          sprite.id === 'sprite.aguas.affinity-forgotten'
            ? { ...sprite, animations: { walk: 'enemy_melee_anim_walk', hurt: 'enemy_melee_anim_hurt' } }
            : sprite),
      },
    };
    const missingAnimation = new StageVisualRegistry();
    missingAnimation.registerChapter(chapter);
    expect(missingAnimation.validateManifest(loaded.manifest, loaded.npcs)).toEqual(expect.arrayContaining([
      expect.objectContaining({
        code: 'stage.visual.enemy-animation.missing',
        referenceId: 'sprite.aguas.affinity-forgotten',
      }),
    ]));
  });

  it('creates an animated NPC sprite without adding physics and preserves narrative proximity data', () => {
    const loaded = loadIgapo();
    const sprite = loaded.presentation.npcSprites['environment.memory-vestige'];
    const marker = {
      setDepth: jest.fn().mockReturnThis(), setScale: jest.fn().mockReturnThis(),
      setTint: jest.fn().mockReturnThis(), play: jest.fn().mockReturnThis(),
    };
    const scene = {
      textures: { exists: jest.fn(() => true) },
      anims: { exists: jest.fn(() => true) },
      add: { sprite: jest.fn(() => marker) },
      physics: { add: { existing: jest.fn() } },
    } as any;
    new StageMapRenderer().createNpcSprite(scene, 880, 534, sprite);
    expect(scene.add.sprite).toHaveBeenCalledWith(880, 534, 'enemy_ranged_anim');
    expect(marker.play).toHaveBeenCalledWith('enemy_ranged_anim_walk');
    expect(scene.physics.add.existing).not.toHaveBeenCalled();
    expect(poiInteractionPoints(loaded.npcs)).toContainEqual(expect.objectContaining({
      id: 'npc.aguas.igapo.memory-vestige', dialogueId: 'dialogue.aguas.igapo.eco-das-aguas',
    }));
  });

  it('fails explicitly when a resolved NPC animation is absent at Phaser runtime', () => {
    const sprite = loadIgapo().presentation.npcSprites['environment.memory-vestige'];
    const scene = {
      textures: { exists: () => true }, anims: { exists: () => false }, add: { sprite: jest.fn() },
    } as any;
    expect(() => new StageMapRenderer().createNpcSprite(scene, 0, 0, sprite)).toThrow(
      expect.objectContaining<Partial<StageMapRenderError>>({
        code: 'stage.visual.animation.runtime-missing', referenceId: 'enemy_ranged_anim_walk',
      }),
    );
    expect(scene.add.sprite).not.toHaveBeenCalled();
  });

  it('changes enemy texture/animations without changing display size or hitbox', () => {
    const original = new Enemy(enemyScene(), 10, 20, 'enemy_melee_anim') as any;
    const custom = new Enemy(enemyScene(), 10, 20, 'custom_enemy', {
      walk: 'custom_walk', attack: 'custom_attack', hurt: 'custom_hurt',
    }) as any;
    expect(custom.texture.key).toBe('custom_enemy');
    expect(custom.displaySize).toEqual(original.displaySize);
    expect(custom.bodySize).toEqual(original.bodySize);
    expect(custom.bodyOffset).toEqual(original.bodyOffset);

    const originalRanged = new RangedEnemy(enemyScene(), 10, 20) as any;
    const customRanged = new RangedEnemy(enemyScene(), 10, 20, undefined, 'custom_ranged', {
      walk: 'custom_walk', attack: 'custom_attack', hurt: 'custom_hurt',
    }) as any;
    expect(customRanged.displaySize).toEqual(originalRanged.displaySize);
    expect(customRanged.bodySize).toEqual(originalRanged.bodySize);
    expect(customRanged.bodyOffset).toEqual(originalRanged.bodyOffset);
  });

  it('fails StageLoader rather than silently changing the logical enemy for an invalid explicit reference', () => {
    const invalidModule: StageModule = {
      ...IGAPO_DAS_MEMORIAS_STAGE,
      manifest: {
        ...IGAPO_DAS_MEMORIAS_STAGE.manifest,
        presentation: {
          ...IGAPO_DAS_MEMORIAS_STAGE.manifest.presentation!,
          enemySprites: { affinity: 'sprite.missing' },
        },
        exits: [{ id: 'exit.fixture.complete', anchor: { kind: 'map-exit' }, targetStageId: 'campaign.complete' }],
      },
    };
    const registry = new StageRegistry();
    registry.registerChapter({ ...AGUAS_CHAPTER_MANIFEST, dependencies: [] }, [invalidModule]);
    const result = new StageLoader(registry).load({
      stageId: invalidModule.manifest.id, runId: 'run.invalid-entity', runSeed: 'seed.invalid-entity',
    });
    expect(result).toMatchObject({
      ok: false,
      error: {
        code: 'invalid-reference',
        diagnostics: expect.arrayContaining([
          expect.objectContaining({ code: 'stage.visual.enemy-sprite.unknown', referenceId: 'sprite.missing' }),
        ]),
      },
    });
  });
});
