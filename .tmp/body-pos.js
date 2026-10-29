const s = game.scene.keys.GameScene;
const en = (s.enemies.getChildren()||[]).map(e=>({x:Math.round(e.x),y:Math.round(e.y),hp:e.hp,kind:e.constructor.name}));
return { player:{x:Math.round(s.player.x),y:Math.round(s.player.y),hp:s.player.hp,magic:Math.round(s.player.magic)}, wave:s.currentWaveIndex, enemies:en, exitsRevealed:s.exitsRevealed, time: Math.round(s.time.now) };
