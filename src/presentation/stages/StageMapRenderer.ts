import Phaser from 'phaser';
import type { LevelDefinition } from '../../data/LevelData';
import type {
  ResolvedStagePresentation,
  ResolvedStageSprite,
  ResolvedStageTexture,
  StageLogicalTileId,
} from '../../stages/contracts';

export interface RenderedStageExitTile {
  readonly x: number;
  readonly y: number;
}

export interface StageMapRenderResult {
  readonly images: readonly Phaser.GameObjects.Image[];
  readonly decorationImages: readonly Phaser.GameObjects.Image[];
  readonly environmentObjects: readonly Phaser.GameObjects.GameObject[];
  readonly pendingExitTiles: readonly RenderedStageExitTile[];
}

export class StageMapRenderError extends Error {
  public constructor(
    public readonly code:
      | 'stage.visual.texture.runtime-missing'
      | 'stage.visual.animation.runtime-missing'
      | 'stage.visual.decoration.unresolved',
    message: string,
    public readonly referenceId: string,
  ) {
    super(message);
    this.name = 'StageMapRenderError';
  }
}

const TILE_LOGICAL_IDS: Readonly<Record<number, StageLogicalTileId>> = Object.freeze({
  0: 'floor', 1: 'wall', 2: 'pillar', 3: 'water', 4: 'lava',
  5: 'exit', 6: 'locked-door', 7: 'chest', 8: 'spawn', 9: 'boss',
});

const LAYER_DEPTH = Object.freeze({ background: -3, terrain: 2, foreground: 5 });

function hashVariant(themeId: string, logicalId: StageLogicalTileId, x: number, y: number): number {
  const source = `${themeId}|${logicalId}|${x}|${y}`;
  let hash = 2166136261;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function selectVisual(
  presentation: ResolvedStagePresentation,
  logicalId: StageLogicalTileId,
  x: number,
  y: number,
): ResolvedStageTexture {
  const tile = presentation.tiles[logicalId];
  const choices: readonly ResolvedStageTexture[] = [tile, ...tile.variants];
  return choices[hashVariant(presentation.themeId, logicalId, x, y) % choices.length];
}

function applyVisual<T extends Phaser.GameObjects.Image | Phaser.Physics.Arcade.Sprite>(
  target: T,
  visual: ResolvedStageTexture,
): T {
  if (visual.tint !== undefined) target.setTint(visual.tint);
  if (visual.alpha !== undefined) target.setAlpha(visual.alpha);
  return target;
}

export class StageMapRenderer {
  public createNpcSprite(
    scene: Phaser.Scene,
    x: number,
    y: number,
    sprite: ResolvedStageSprite,
  ): Phaser.GameObjects.Sprite {
    this.assertSprite(scene, sprite);
    const marker = scene.add.sprite(x, y, sprite.textureKey)
      .setDepth(sprite.depth)
      .setScale(sprite.scale);
    if (sprite.tint !== undefined) marker.setTint(sprite.tint);
    if (sprite.animations.idle) marker.play(sprite.animations.idle);
    return marker;
  }

  public render(
    scene: Phaser.Scene,
    level: LevelDefinition,
    presentation: ResolvedStagePresentation,
    collisionGroup: Phaser.Physics.Arcade.StaticGroup,
    includeLegacyExit: boolean,
  ): StageMapRenderResult {
    this.assertTextures(scene, presentation);
    const images: Phaser.GameObjects.Image[] = [];
    const decorationImages: Phaser.GameObjects.Image[] = [];
    const environmentObjects: Phaser.GameObjects.GameObject[] = [];
    const pendingExitTiles: RenderedStageExitTile[] = [];
    const tileSize = presentation.tileSize;

    level.tileMap.forEach((row, y) => row.forEach((tileValue, x) => {
      const posX = x * tileSize + tileSize / 2;
      const posY = y * tileSize + tileSize / 2;
      const floorVisual = selectVisual(presentation, 'floor', x, y);
      const floor = applyVisual(
        scene.add.image(posX, posY, floorVisual.textureKey),
        floorVisual,
      ).setDepth(-2);
      images.push(floor);

      const logicalId = TILE_LOGICAL_IDS[tileValue];
      if (tileValue >= 1 && tileValue <= 3 && logicalId) {
        const visual = selectVisual(presentation, logicalId, x, y);
        const obstacle = collisionGroup.create(posX, posY, visual.textureKey) as Phaser.Physics.Arcade.Sprite;
        applyVisual(obstacle, visual).setDepth(1);
        obstacle.refreshBody();
      } else if (tileValue === 4) {
        const visual = selectVisual(presentation, 'lava', x, y);
        const lava = applyVisual(scene.add.image(posX, posY, visual.textureKey), visual).setDepth(-1);
        images.push(lava);
      } else if (tileValue === 5 && includeLegacyExit) {
        pendingExitTiles.push(Object.freeze({ x: posX, y: posY }));
      }
    }));

    level.decorations.forEach(placement => {
      if (placement.visible === false) return;
      const definition = presentation.decorations[placement.type];
      if (!definition) {
        if (presentation.themeId === 'theme.legacy.default') return;
        throw new StageMapRenderError(
          'stage.visual.decoration.unresolved',
          `Decoration is not resolved for theme ${presentation.themeId}: ${placement.type}`,
          placement.type,
        );
      }
      const image = scene.add.image(
        placement.x * tileSize + tileSize / 2,
        placement.y * tileSize + tileSize / 2,
        definition.textureKey,
      );
      image.setDepth(placement.depth ?? (placement.layer ? LAYER_DEPTH[placement.layer] : definition.depth));
      image.setScale(placement.scale ?? definition.defaultScale);
      if (placement.rotation !== undefined) image.setRotation(placement.rotation);
      if (placement.tint !== undefined) image.setTint(placement.tint);
      images.push(image);
      decorationImages.push(image);
    });

    if (presentation.environment) {
      const environment = presentation.environment;
      const width = scene.cameras.main.width;
      const height = scene.cameras.main.height;
      const ambientOpacity = Math.min(0.3, Math.max(0, (1 - environment.lightIntensity) * 0.35));
      if (ambientOpacity > 0) {
        environmentObjects.push(scene.add.rectangle(
          width / 2, height / 2, width, height, environment.ambientColor, ambientOpacity,
        ).setScrollFactor(0).setDepth(3));
      }
      if (environment.fog && environment.fog.opacity > 0) {
        environmentObjects.push(scene.add.rectangle(
          width / 2, height / 2, width, height, environment.fog.color, environment.fog.opacity,
        ).setScrollFactor(0).setDepth(environment.fog.depth));
      }
    }

    return Object.freeze({
      images: Object.freeze(images),
      decorationImages: Object.freeze(decorationImages),
      environmentObjects: Object.freeze(environmentObjects),
      pendingExitTiles: Object.freeze(pendingExitTiles),
    });
  }

  private assertTextures(scene: Phaser.Scene, presentation: ResolvedStagePresentation): void {
    const keys = new Set<string>();
    Object.values(presentation.tiles).forEach(tile => {
      keys.add(tile.textureKey);
      tile.variants.forEach(variant => keys.add(variant.textureKey));
    });
    Object.values(presentation.decorations).forEach(decoration => keys.add(decoration.textureKey));
    Object.values(presentation.npcSprites).forEach(sprite => keys.add(sprite.textureKey));
    Object.values(presentation.enemySprites).forEach(sprite => keys.add(sprite.textureKey));
    [...keys].sort().forEach(textureKey => {
      if (!scene.textures.exists(textureKey)) throw new StageMapRenderError(
        'stage.visual.texture.runtime-missing',
        `Renderer texture is not loaded: ${textureKey}`,
        textureKey,
      );
    });
    Object.values(presentation.npcSprites).forEach(sprite => this.assertSprite(scene, sprite));
    Object.values(presentation.enemySprites).forEach(sprite => this.assertSprite(scene, sprite));
  }

  private assertSprite(scene: Phaser.Scene, sprite: ResolvedStageSprite): void {
    if (!scene.textures.exists(sprite.textureKey)) throw new StageMapRenderError(
      'stage.visual.texture.runtime-missing',
      `Renderer texture is not loaded: ${sprite.textureKey}`,
      sprite.textureKey,
    );
    Object.values(sprite.animations).forEach(animationKey => {
      if (!scene.anims.exists(animationKey)) throw new StageMapRenderError(
        'stage.visual.animation.runtime-missing',
        `Renderer animation is not loaded: ${animationKey}`,
        animationKey,
      );
    });
  }
}
