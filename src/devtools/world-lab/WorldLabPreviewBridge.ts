import type Phaser from 'phaser';

export type WorldLabPreviewCommand =
  | { readonly type: 'fit-map'; readonly hud?: boolean }
  | { readonly type: 'gameplay'; readonly zoom: number; readonly hud?: boolean }
  | {
      readonly type: 'focus-tile';
      readonly x: number;
      readonly y: number;
      readonly zoom: number;
      readonly hud?: boolean;
    }
  | { readonly type: 'pan'; readonly x: number; readonly y: number; readonly hud?: boolean }
  | { readonly type: 'hud'; readonly visible: boolean };

export interface WorldLabPreviewBridge {
  apply(command: WorldLabPreviewCommand): boolean;
}

type PreviewScene = Phaser.Scene & {
  readonly currentLevel?: { readonly tileMap?: readonly (readonly number[])[] };
  readonly player?: Phaser.GameObjects.GameObject & { readonly x: number; readonly y: number };
};

function sceneFor(game: Phaser.Game): PreviewScene | undefined {
  const scene = game.scene.getScene('GameScene') as PreviewScene | undefined;
  return scene?.cameras?.main && scene.scene.isActive() && scene.currentLevel?.tileMap && scene.player
    ? scene
    : undefined;
}

function setHud(scene: PreviewScene, visible: boolean): void {
  scene.children.list.forEach(child => {
    const candidate = child as Phaser.GameObjects.GameObject & {
      readonly depth?: number;
      setVisible?(value: boolean): unknown;
    };
    if ((candidate.depth ?? 0) >= 900) candidate.setVisible?.(visible);
  });
}

export function createWorldLabPreviewBridge(game: Phaser.Game): WorldLabPreviewBridge {
  return Object.freeze({
    apply(command: WorldLabPreviewCommand): boolean {
      const scene = sceneFor(game);
      if (!scene) return false;
      if (command.type === 'hud') {
        setHud(scene, command.visible);
        return true;
      }
      if (command.hud !== undefined) setHud(scene, command.hud);
      const camera = scene.cameras.main;
      const map = scene.currentLevel?.tileMap;
      if (command.type === 'fit-map') {
        const width = (map?.[0]?.length ?? 0) * 32;
        const height = (map?.length ?? 0) * 32;
        if (width <= 0 || height <= 0) return false;
        camera.stopFollow();
        camera.setZoom(Math.min(camera.width / width, camera.height / height) * 0.96);
        camera.centerOn(width / 2, height / 2);
        return true;
      }
      if (command.type === 'gameplay') {
        camera.setZoom(command.zoom);
        if (scene.player) {
          camera.startFollow(scene.player, true, 0.1, 0.1);
          camera.centerOn(scene.player.x, scene.player.y);
        }
        return true;
      }
      if (command.type === 'focus-tile') {
        camera.stopFollow();
        camera.setZoom(command.zoom);
        camera.centerOn(command.x * 32 + 16, command.y * 32 + 16);
        return true;
      }
      camera.stopFollow();
      const zoom = Math.max(0.01, camera.zoom);
      camera.setScroll(camera.scrollX + command.x / zoom, camera.scrollY + command.y / zoom);
      return true;
    },
  });
}

export function registerWorldLabPreviewBridge(game: Phaser.Game): WorldLabPreviewBridge {
  const bridge = createWorldLabPreviewBridge(game);
  (globalThis as typeof globalThis & {
    __UMBRA_WORLD_LAB_PREVIEW__?: WorldLabPreviewBridge;
  }).__UMBRA_WORLD_LAB_PREVIEW__ = bridge;
  return bridge;
}
