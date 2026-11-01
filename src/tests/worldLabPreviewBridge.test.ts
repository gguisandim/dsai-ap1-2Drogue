import { createWorldLabPreviewBridge } from '../devtools/world-lab/WorldLabPreviewBridge';

describe('World Lab preview camera bridge', () => {
  function fixture() {
    const hud = { depth: 900, setVisible: jest.fn() };
    const camera = {
      width: 1280,
      height: 720,
      zoom: 1,
      scrollX: 80,
      scrollY: 40,
      stopFollow: jest.fn(),
      setZoom: jest.fn(function setZoom(value: number) { camera.zoom = value; }),
      centerOn: jest.fn(),
      startFollow: jest.fn(),
      setScroll: jest.fn(),
    };
    const player = { x: 144, y: 240 };
    const scene = {
      scene: { isActive: jest.fn(() => true) },
      cameras: { main: camera },
      children: { list: [{ depth: 10, setVisible: jest.fn() }, hud] },
      currentLevel: { tileMap: Array.from({ length: 30 }, () => Array(96).fill(0)) },
      player,
    };
    const game = { scene: { getScene: jest.fn(() => scene) } };
    return { bridge: createWorldLabPreviewBridge(game as never), camera, hud, player };
  }

  it('fits a panoramic map and controls HUD visibility', () => {
    const { bridge, camera, hud } = fixture();
    expect(bridge.apply({ type: 'fit-map', hud: false })).toBe(true);
    expect(camera.stopFollow).toHaveBeenCalled();
    expect(camera.setZoom).toHaveBeenCalledWith(0.4);
    expect(camera.centerOn).toHaveBeenCalledWith(1536, 480);
    expect(hud.setVisible).toHaveBeenCalledWith(false);
  });

  it('restores gameplay follow and supports focus and pan inspection', () => {
    const { bridge, camera, player } = fixture();
    bridge.apply({ type: 'gameplay', zoom: 1.25 });
    expect(camera.startFollow).toHaveBeenCalledWith(player, true, 0.1, 0.1);
    expect(camera.centerOn).toHaveBeenCalledWith(player.x, player.y);

    bridge.apply({ type: 'focus-tile', x: 10, y: 12, zoom: 0.75 });
    expect(camera.centerOn).toHaveBeenLastCalledWith(336, 400);

    bridge.apply({ type: 'pan', x: 192, y: -96 });
    expect(camera.setScroll).toHaveBeenCalledWith(336, -88);
  });
});
