const s = game.scene.keys.GameScene; const b=s.player.body;
const walls = s.wallTiles;
const out = { playerBody:{x:b.x,y:b.y,w:b.width,h:b.height,off:{x:b.offset.x,y:b.offset.y},right:b.right,bottom:b.bottom}, wallCount: walls ? walls.getLength() : null };
if (walls && walls.getChildren) {
  out.near = walls.getChildren().filter(w => { const wb=w.body; if(!wb) return false; return wb.right > b.left-40 && wb.left < b.right+40 && wb.bottom > b.top-40 && wb.top < b.bottom+40; })
    .map(w => ({x:w.x,y:w.y,tl:{x:w.body.x,y:w.body.y},w:w.body.width,h:w.body.height,immovable:w.body.immovable,active:w.active,vis:w.visible}));
}
// also static bodies
const world = s.physics.world;
out.staticCount = world.staticBodies ? world.staticBodies.size : null;
return out;
