const s = game.scene.keys.GameScene; const b=s.player.body;
const snap = () => ({px:+s.player.x.toFixed(2), bx:+b.x.toFixed(2), posx:+b.position.x.toFixed(2), prevx:+b.prev.x.toFixed(2), pfx:+b.prevFrame.x.toFixed(2), dx:+b._dx.toFixed(2), vx:+b.velocity.x.toFixed(1), speed:+b.speed.toFixed(1), moves:b.moves});
return snap();
