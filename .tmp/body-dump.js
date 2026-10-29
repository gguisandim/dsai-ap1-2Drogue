const s = game.scene.keys.GameScene;
const lvl = s.currentLevel;
const ts = 32;
function tileOf(px,py){ return { c: Math.floor(px/ts), r: Math.floor(py/ts) }; }
const enemies = (s.enemies.getChildren()||[]).map(e=>({x:e.x,y:e.y,hp:e.hp,kind:e.constructor.name,...tileOf(e.x,e.y)}));
return {
  tileMap: lvl.tileMap,
  enemies,
  items: (lvl.items||[]).map(i=>({x:i.x,y:i.y,type:i.type||i.kind||i.id,...tileOf(i.x||0,i.y||0)})),
  exitTiles: s.pendingExitTiles,
  spawn: {x:s.player.x,y:s.player.y,...tileOf(s.player.x,s.player.y)},
};
