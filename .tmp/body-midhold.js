const s = game.scene.keys.GameScene;
return { keyD: s.player.keyD.isDown, vx: Math.round(s.player.body.velocity.x), x: Math.round(s.player.x), y: Math.round(s.player.y) };
