const s = game.scene.keys.GameScene;
const b = s.player.body;
const g = s.currentLevel.tileMap; const ts=32;
const c=Math.floor(s.player.x/ts), r=Math.floor(s.player.y/ts);
const around=[];
for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++)around.push(`${c+dc},${r+dr}=${g[r+dr]&&g[r+dr][c+dc]}`);
return {
  player:{x:s.player.x,y:s.player.y,tile:[c,r]}, around,
  body:{vx:Math.round(b.velocity.x),vy:Math.round(b.velocity.y),blocked:b.blocked,touching:b.touching,enable:b.enable},
  solids: s.solidTiles ? s.solidTiles.length : (s.walls? s.walls.getLength(): null),
  groups: Object.keys(s).filter(k=>/solid|wall|obstacle|block|collid/i.test(k)),
};
