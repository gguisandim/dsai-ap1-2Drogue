const s = game.scene.keys.GameScene; const b=s.player.body;
return { moves:b.moves, immovable:b.immovable, allowGravity:b.allowGravity, mass:b.mass, drag:{x:b.drag.x,y:b.drag.y},
 maxVel:{x:b.maxVelocity.x,y:b.maxVelocity.y}, checkCollision:b.checkCollision, speed:b.speed,
 physicsRunning: s.physics.world.isPaused, fps: s.physics.world.fps,
 playerActive:s.player.active, playerVisible:s.player.visible, alpha:s.player.alpha, playerState:s.player.state };
