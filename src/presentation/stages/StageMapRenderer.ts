import type Phaser from 'phaser';
import type { LevelDefinition } from '../../data/LevelData';
import type {
  ResolvedStagePresentation,
  ResolvedStageEffect,
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
const STATIC_TILE_BATCH_THRESHOLD = 1_024;
const STATIC_TILE_CHUNK_SIZE = 8;

function hashVariant(themeId: string, logicalId: StageLogicalTileId, x: number, y: number): number {
  const source = `${themeId}|${logicalId}|${x}|${y}`;
  let hash = 2166136261;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function effectUnit(effectId: string, index: number, channel: string): number {
  const source = `${effectId}|${index}|${channel}`;
  let hash = 2166136261;
  for (let position = 0; position < source.length; position += 1) {
    hash ^= source.charCodeAt(position);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 0xffffffff;
}

function selectVisual(
  presentation: ResolvedStagePresentation,
  logicalId: StageLogicalTileId,
  x: number,
  y: number,
  shoreline = false,
): ResolvedStageTexture {
  const tile = presentation.tiles[logicalId];
  if (logicalId === 'floor' && presentation.themeId.startsWith('theme.aguas.igapo')) {
    const choices: readonly ResolvedStageTexture[] = [tile, ...tile.variants];
    return choices[hashVariant(
      presentation.themeId, logicalId, Math.floor(x / 3), Math.floor(y / 2),
    ) % choices.length];
  }
  if (logicalId === 'water' && tile.variants.length > 0) {
    if (shoreline) return tile.variants[0];
    const patch = hashVariant(presentation.themeId, logicalId, Math.floor(x / 4), Math.floor(y / 3)) % 5;
    return patch === 0 ? tile.variants[2] ?? tile : tile;
  }
  const choices: readonly ResolvedStageTexture[] = [tile, ...tile.variants];
  return choices[hashVariant(presentation.themeId, logicalId, x, y) % choices.length];
}

function isShorelineWater(tileMap: readonly (readonly number[])[], x: number, y: number): boolean {
  for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
    for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
      if (tileMap[y + offsetY]?.[x + offsetX] === 0) return true;
    }
  }
  return false;
}

function applyVisual<T extends Phaser.GameObjects.Image | Phaser.Physics.Arcade.Sprite>(
  target: T,
  visual: ResolvedStageTexture,
): T {
  if (visual.tint !== undefined) target.setTint(visual.tint);
  if (visual.alpha !== undefined) target.setAlpha(visual.alpha);
  return target;
}

function addVisualImage(
  scene: Phaser.Scene,
  x: number,
  y: number,
  visual: ResolvedStageTexture,
): Phaser.GameObjects.Image {
  const image = visual.frame !== undefined
    ? scene.add.image(x, y, visual.textureKey, visual.frame)
    : scene.add.image(x, y, visual.textureKey);
  return applyVisual(image, visual);
}

export class StageMapRenderer {
  public createNpcSprite(
    scene: Phaser.Scene,
    x: number,
    y: number,
    sprite: ResolvedStageSprite,
  ): Phaser.GameObjects.Sprite {
    this.assertSprite(scene, sprite);
    const marker = (sprite.frame !== undefined
      ? scene.add.sprite(x, y, sprite.textureKey, sprite.frame)
      : scene.add.sprite(x, y, sprite.textureKey))
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
    const foregroundDecorations: Phaser.GameObjects.Image[] = [];
    const pendingExitTiles: RenderedStageExitTile[] = [];
    const tileSize = presentation.tileSize;

    if (this.canBatchStaticTiles(scene, level)) {
      images.push(...this.renderStaticTileChunks(scene, level, presentation, tileSize));
      this.createCollisionRuns(collisionGroup, level, presentation, tileSize);
      level.tileMap.forEach((row, y) => row.forEach((tileValue, x) => {
        if (tileValue !== 5 || !includeLegacyExit) return;
        pendingExitTiles.push(Object.freeze({
          x: x * tileSize + tileSize / 2,
          y: y * tileSize + tileSize / 2,
        }));
      }));
    } else level.tileMap.forEach((row, y) => row.forEach((tileValue, x) => {
      const posX = x * tileSize + tileSize / 2;
      const posY = y * tileSize + tileSize / 2;
      const floorVisual = selectVisual(presentation, 'floor', x, y);
      const floor = addVisualImage(scene, posX, posY, floorVisual)
        .setDisplaySize(tileSize, tileSize)
        .setDepth(-2);
      images.push(floor);

      const logicalId = TILE_LOGICAL_IDS[tileValue];
      if (tileValue >= 1 && tileValue <= 3 && logicalId) {
        const visual = selectVisual(
          presentation, logicalId, x, y,
          logicalId === 'water' && isShorelineWater(level.tileMap, x, y),
        );
        const obstacle = (visual.frame !== undefined
          ? collisionGroup.create(posX, posY, visual.textureKey, visual.frame)
          : collisionGroup.create(posX, posY, visual.textureKey)) as Phaser.Physics.Arcade.Sprite;
        applyVisual(obstacle, visual).setDisplaySize(tileSize, tileSize).setDepth(1);
        obstacle.refreshBody();
      } else if (tileValue === 4) {
        const visual = selectVisual(presentation, 'lava', x, y);
        const lava = addVisualImage(scene, posX, posY, visual)
          .setDisplaySize(tileSize, tileSize)
          .setDepth(-1);
        images.push(lava);
      } else if (tileValue === 5 && includeLegacyExit) {
        pendingExitTiles.push(Object.freeze({ x: posX, y: posY }));
      }
    }));

    level.decorations.forEach(placement => {
      if (placement.visible === false) return;
      const decorationId = presentation.decorationOverrides?.[placement.type] ?? placement.type;
      const definition = presentation.decorations[decorationId];
      if (!definition) {
        if (presentation.themeId === 'theme.legacy.default') return;
        throw new StageMapRenderError(
          'stage.visual.decoration.unresolved',
          `Decoration is not resolved for theme ${presentation.themeId}: ${decorationId}`,
          decorationId,
        );
      }
      const image = definition.frame !== undefined
        ? scene.add.image(
            placement.x * tileSize + tileSize / 2,
            placement.y * tileSize + tileSize / 2,
            definition.textureKey,
            definition.frame,
          )
        : scene.add.image(
            placement.x * tileSize + tileSize / 2,
            placement.y * tileSize + tileSize / 2,
            definition.textureKey,
          );
      image.setDepth(placement.depth ?? (placement.layer ? LAYER_DEPTH[placement.layer] : definition.depth));
      image.setScale(placement.scale ?? definition.defaultScale);
      if (placement.rotation !== undefined) image.setRotation(placement.rotation);
      if (placement.tint !== undefined) image.setTint(placement.tint);
      if (placement.alpha !== undefined) image.setAlpha(placement.alpha);
      if (placement.flipX) image.setFlipX(true);
      if (placement.flipY) image.setFlipY(true);
      if (placement.originX !== undefined || placement.originY !== undefined) {
        image.setOrigin(placement.originX ?? 0.5, placement.originY ?? 0.5);
      }
      images.push(image);
      decorationImages.push(image);
      const layer = placement.layer ?? definition.layer;
      if (layer === 'foreground') foregroundDecorations.push(image);
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

    environmentObjects.push(...this.renderEffects(
      scene, level, presentation.effects, foregroundDecorations, tileSize,
    ));

    return Object.freeze({
      images: Object.freeze(images),
      decorationImages: Object.freeze(decorationImages),
      environmentObjects: Object.freeze(environmentObjects),
      pendingExitTiles: Object.freeze(pendingExitTiles),
    });
  }

  /**
   * Large authored panoramas are immutable during a visit. Flattening their
   * static tile visuals into camera-cullable chunks replaces thousands of
   * display-list images with a few dozen render textures. Collision remains
   * in Arcade Physics, consolidated into exact horizontal runs.
   */
  private canBatchStaticTiles(scene: Phaser.Scene, level: LevelDefinition): boolean {
    const tileCount = level.tileMap.length * (level.tileMap[0]?.length ?? 0);
    return tileCount >= STATIC_TILE_BATCH_THRESHOLD &&
      typeof scene.add.renderTexture === 'function' &&
      typeof scene.make.image === 'function';
  }

  private renderStaticTileChunks(
    scene: Phaser.Scene,
    level: LevelDefinition,
    presentation: ResolvedStagePresentation,
    tileSize: number,
  ): readonly Phaser.GameObjects.RenderTexture[] {
    const chunks: Phaser.GameObjects.RenderTexture[] = [];
    const width = level.tileMap[0]?.length ?? 0;
    const height = level.tileMap.length;
    const first = selectVisual(presentation, 'floor', 0, 0);
    const brush = scene.make.image({
      x: 0, y: 0, key: first.textureKey, frame: first.frame, add: false,
    }).setOrigin(0.5);
    const draw = (
      target: Phaser.GameObjects.RenderTexture,
      visual: ResolvedStageTexture,
      x: number,
      y: number,
    ): void => {
      brush.setTexture(visual.textureKey, visual.frame);
      brush.setPosition(x, y).setDisplaySize(tileSize, tileSize).setAlpha(visual.alpha ?? 1);
      if (visual.tint !== undefined) brush.setTint(visual.tint);
      else brush.clearTint();
      target.batchDraw(brush);
    };

    for (let chunkY = 0; chunkY < height; chunkY += STATIC_TILE_CHUNK_SIZE) {
      for (let chunkX = 0; chunkX < width; chunkX += STATIC_TILE_CHUNK_SIZE) {
        const columns = Math.min(STATIC_TILE_CHUNK_SIZE, width - chunkX);
        const rows = Math.min(STATIC_TILE_CHUNK_SIZE, height - chunkY);
        const target = scene.add.renderTexture(
          chunkX * tileSize,
          chunkY * tileSize,
          columns * tileSize,
          rows * tileSize,
        ).setOrigin(0, 0).setDepth(-2);
        target.beginDraw();
        for (let localY = 0; localY < rows; localY += 1) {
          for (let localX = 0; localX < columns; localX += 1) {
            const x = chunkX + localX;
            const y = chunkY + localY;
            const tileValue = level.tileMap[y][x];
            const drawX = localX * tileSize + tileSize / 2;
            const drawY = localY * tileSize + tileSize / 2;
            draw(target, selectVisual(presentation, 'floor', x, y), drawX, drawY);
            const logicalId = TILE_LOGICAL_IDS[tileValue];
            if (tileValue >= 1 && tileValue <= 3 && logicalId) {
              draw(target, selectVisual(
                presentation, logicalId, x, y,
                logicalId === 'water' && isShorelineWater(level.tileMap, x, y),
              ), drawX, drawY);
            } else if (tileValue === 4) {
              draw(target, selectVisual(presentation, 'lava', x, y), drawX, drawY);
            }
          }
        }
        target.endDraw();
        chunks.push(target);
      }
    }
    brush.destroy();
    return chunks;
  }

  private createCollisionRuns(
    collisionGroup: Phaser.Physics.Arcade.StaticGroup,
    level: LevelDefinition,
    presentation: ResolvedStagePresentation,
    tileSize: number,
  ): void {
    level.tileMap.forEach((row, y) => {
      let runStart = -1;
      for (let x = 0; x <= row.length; x += 1) {
        const tileValue = row[x];
        const blocked = tileValue >= 1 && tileValue <= 3;
        if (blocked && runStart < 0) runStart = x;
        if (blocked || runStart < 0) continue;
        const runLength = x - runStart;
        const logicalId = TILE_LOGICAL_IDS[row[runStart]];
        const visual = selectVisual(presentation, logicalId, runStart, y);
        const obstacle = (visual.frame !== undefined
          ? collisionGroup.create(
              (runStart + runLength / 2) * tileSize,
              y * tileSize + tileSize / 2,
              visual.textureKey,
              visual.frame,
            )
          : collisionGroup.create(
              (runStart + runLength / 2) * tileSize,
              y * tileSize + tileSize / 2,
              visual.textureKey,
            )) as Phaser.Physics.Arcade.Sprite;
        obstacle.setVisible(false).setDisplaySize(runLength * tileSize, tileSize).refreshBody();
        runStart = -1;
      }
    });
  }

  private renderEffects(
    scene: Phaser.Scene,
    level: LevelDefinition,
    effects: readonly ResolvedStageEffect[],
    foregroundDecorations: readonly Phaser.GameObjects.Image[],
    tileSize: number,
  ): readonly Phaser.GameObjects.GameObject[] {
    const objects: Phaser.GameObjects.GameObject[] = [];
    const tileCenter = (value: number): number => value * tileSize + tileSize / 2;
    effects.forEach(effect => {
      if (effect.kind === 'foliage-sway') {
        foregroundDecorations.forEach((image, index) => {
          const amplitude = Math.max(0.25, (effect.amplitude ?? 2) * Math.PI / 180);
          image.setRotation(-amplitude);
          this.animate(scene, image, {
            rotation: amplitude,
            duration: effect.durationMs + index * 47,
            ease: 'Sine.easeInOut', yoyo: true, repeat: -1,
          });
        });
        return;
      }
      if (effect.kind === 'water-shimmer') {
        const waterTiles = level.tileMap.flatMap((row, y) => row.flatMap((tile, x) =>
          tile === 3 ? [{ x, y }] : []));
        const maximum = Math.min(effect.count ?? 24, waterTiles.length);
        for (let index = 0; index < maximum; index += 1) {
          const tile = waterTiles[Math.floor(index * waterTiles.length / Math.max(1, maximum))];
          const shimmer = scene.add.rectangle(
            tileCenter(tile.x), tileCenter(tile.y), tileSize * 0.72, 2,
            effect.color, effect.alpha * (0.55 + effectUnit(effect.id, index, 'alpha') * 0.45),
          ).setDepth(effect.depth).setRotation(-0.08 + effectUnit(effect.id, index, 'angle') * 0.16);
          objects.push(shimmer);
          this.animate(scene, shimmer, {
            alpha: effect.alpha * 0.18,
            scaleX: 0.55,
            duration: effect.durationMs + index * 31,
            delay: index * 71,
            ease: 'Sine.easeInOut', yoyo: true, repeat: -1,
          });
        }
        return;
      }

      const originX = tileCenter(effect.x ?? 0);
      const originY = tileCenter(effect.y ?? 0);
      if (effect.kind === 'pulse' || effect.kind === 'local-light') {
        const glow = scene.add.circle(
          originX, originY, effect.radius ?? 24, effect.color, effect.alpha,
        ).setDepth(effect.depth);
        objects.push(glow);
        const scale = 1 + (effect.amplitude ?? (effect.kind === 'local-light' ? 0.1 : 0.18));
        this.animate(scene, glow, {
          alpha: effect.alpha * 0.45, scaleX: scale, scaleY: scale,
          duration: effect.durationMs, ease: 'Sine.easeInOut', yoyo: true, repeat: -1,
        });
        return;
      }

      const width = (effect.width ?? 1) * tileSize;
      const height = (effect.height ?? 1) * tileSize;
      const count = effect.count ?? 1;
      if (effect.kind === 'mist') {
        for (let index = 0; index < count; index += 1) {
          const mist = scene.add.ellipse(
            originX - width / 2 + effectUnit(effect.id, index, 'x') * width,
            originY - height / 2 + effectUnit(effect.id, index, 'y') * height,
            width * (0.34 + effectUnit(effect.id, index, 'w') * 0.25),
            tileSize * (1.2 + effectUnit(effect.id, index, 'h') * 1.4),
            effect.color, effect.alpha * (0.55 + effectUnit(effect.id, index, 'a') * 0.35),
          ).setDepth(effect.depth);
          objects.push(mist);
          const drift = (effect.amplitude ?? 64) * (index % 2 === 0 ? 1 : -1);
          this.animate(scene, mist, {
            x: mist.x + drift, alpha: effect.alpha * 0.2,
            duration: effect.durationMs + index * 311,
            delay: index * 397,
            ease: 'Sine.easeInOut', yoyo: true, repeat: -1,
          });
        }
        return;
      }

      for (let index = 0; index < count; index += 1) {
        const x = originX - width / 2 + effectUnit(effect.id, index, 'x') * width;
        const y = originY - height / 2 + effectUnit(effect.id, index, 'y') * height;
        const spirit = effect.kind === 'spirits';
        const mote = scene.add.circle(
          x, y, spirit ? 2 + effectUnit(effect.id, index, 'r') * 2 : 1 + effectUnit(effect.id, index, 'r') * 1.6,
          effect.color, effect.alpha * (0.55 + effectUnit(effect.id, index, 'a') * 0.45),
        ).setDepth(effect.depth);
        objects.push(mote);
        const direction = index % 2 === 0 ? 1 : -1;
        this.animate(scene, mote, spirit ? {
          y: y - height * (0.55 + effectUnit(effect.id, index, 'rise') * 0.45),
          x: x + direction * (effect.amplitude ?? 18),
          alpha: 0,
          duration: effect.durationMs + index * 83,
          delay: index * 181,
          ease: 'Sine.easeOut', repeat: -1,
        } : {
          x: x + direction * (effect.amplitude ?? 18),
          y: y - (effect.amplitude ?? 18) * (0.35 + effectUnit(effect.id, index, 'drift')),
          alpha: effect.alpha * 0.22,
          duration: effect.durationMs + index * 109,
          delay: index * 137,
          ease: 'Sine.easeInOut', yoyo: true, repeat: -1,
        });
      }
    });
    return Object.freeze(objects);
  }

  private animate(
    scene: Phaser.Scene,
    target: Phaser.GameObjects.GameObject,
    config: Omit<Phaser.Types.Tweens.TweenBuilderConfig, 'targets'>,
  ): void {
    const tween = scene.tweens.add({ targets: target, ...config });
    target.once('destroy', () => {
      tween.stop();
      tween.remove();
    });
  }

  private assertTextures(scene: Phaser.Scene, presentation: ResolvedStagePresentation): void {
    const textures = new Map<string, readonly (number | undefined)[]>();
    const track = (textureKey: string, frame?: number): void => {
      const frames = textures.get(textureKey) ?? [];
      textures.set(textureKey, [...frames, frame]);
    };
    Object.values(presentation.tiles).forEach(tile => {
      track(tile.textureKey, tile.frame);
      tile.variants.forEach(variant => track(variant.textureKey, variant.frame));
    });
    Object.values(presentation.decorations).forEach(decoration =>
      track(decoration.textureKey, decoration.frame));
    Object.values(presentation.npcSprites).forEach(sprite => track(sprite.textureKey, sprite.frame));
    Object.values(presentation.enemySprites).forEach(sprite => track(sprite.textureKey, sprite.frame));
    [...textures.keys()].sort().forEach(textureKey => {
      if (!scene.textures.exists(textureKey)) throw new StageMapRenderError(
        'stage.visual.texture.runtime-missing',
        `Renderer texture is not loaded: ${textureKey}`,
        textureKey,
      );
      (textures.get(textureKey) ?? []).forEach(frame => {
        if (frame !== undefined && !scene.textures.getFrame(textureKey, frame)) throw new StageMapRenderError(
          'stage.visual.texture.runtime-missing',
          `Renderer frame is not loaded: ${textureKey}#${frame}`,
          textureKey,
        );
      });
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
    if (sprite.frame !== undefined && !scene.textures.getFrame(sprite.textureKey, sprite.frame)) {
      throw new StageMapRenderError(
        'stage.visual.texture.runtime-missing',
        `Renderer frame is not loaded: ${sprite.textureKey}#${sprite.frame}`,
        sprite.textureKey,
      );
    }
    Object.values(sprite.animations).forEach(animationKey => {
      if (!scene.anims.exists(animationKey)) throw new StageMapRenderError(
        'stage.visual.animation.runtime-missing',
        `Renderer animation is not loaded: ${animationKey}`,
        animationKey,
      );
    });
  }
}
