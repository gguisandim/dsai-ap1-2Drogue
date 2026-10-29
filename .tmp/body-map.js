const lvl = game.scene.keys.GameScene.currentLevel;
const look = lvl.tiles || lvl.grid || lvl.layout || lvl.map || lvl.rows || lvl.data;
const meta = Object.keys(lvl);
let grid = null;
// try common shapes
if (Array.isArray(lvl.tiles) && Array.isArray(lvl.tiles[0])) grid = lvl.tiles;
else if (Array.isArray(lvl.grid) && Array.isArray(lvl.grid[0])) grid = lvl.grid;
else if (Array.isArray(lvl.layout) && Array.isArray(lvl.layout[0])) grid = lvl.layout;
else if (typeof lvl.tiles === 'string') grid = lvl.tiles.split('\n').map(r=>r.trim()).filter(Boolean);
return { meta, tileW: lvl.tileWidth, tileH: lvl.tileHeight, width: lvl.width, height: lvl.height,
  gridType: Array.isArray(grid) ? 'array' : typeof grid,
  sample: Array.isArray(grid) ? grid.slice(0,3) : null };
