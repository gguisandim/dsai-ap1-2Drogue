const lvl = game.scene.keys.GameScene.currentLevel;
const tm = lvl.tileMap;
const tmType = Array.isArray(tm) ? (Array.isArray(tm[0]) ? '2d-array' : '1d-array') : typeof tm;
const out = { tmType, tmKeys: tm && !Array.isArray(tm) ? Object.keys(tm) : null };
if (Array.isArray(tm) && Array.isArray(tm[0])) {
  out.rows = tm.length; out.cols = tm[0].length;
  out.ascii = tm.map(r => r.join('')).join('\n');
} else if (typeof tm === 'string') {
  out.ascii = tm;
} else if (tm && typeof tm === 'object') {
  out.inner = Object.keys(tm).slice(0,5);
}
return out;
