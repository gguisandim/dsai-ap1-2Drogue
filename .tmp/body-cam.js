const s = game.scene.keys.GameScene;
const cam = s.cameras.main;
const c = game.canvas;
const r = c.getBoundingClientRect();
return {
  canvas: { cssW: r.width, cssH: r.height, left: r.left, top: r.top, width: c.width, height: c.height },
  cam: { zoom: cam.zoom, scrollX: cam.scrollX, scrollY: cam.scrollY, width: cam.width, height: cam.height, worldView: { x: cam.worldView.x, y: cam.worldView.y, w: cam.worldView.width, h: cam.worldView.height } },
  dpr: window.devicePixelRatio,
  tile: { w: s.currentLevel && s.currentLevel.tileWidth, h: s.currentLevel && s.currentLevel.tileHeight, cols: s.currentLevel && s.currentLevel.width, rows: s.currentLevel && s.currentLevel.height },
};
