const s=game.scene.keys.GameScene;const lvl=s.currentLevel;const g=lvl.tileMap;const R=g.length,C=g[0].length;
const stairs=[];for(let r=0;r<R;r++)for(let c=0;c<C;c++){if(g[r][c]==='5'||g[r][c]==='8')stairs.push({c,r,v:g[r][c]});}
return {id:lvl.id,rows:R,cols:C,ascii:g.map(r=>r.join('')).join('\n'),stairs,player:{x:Math.round(s.player.x),y:Math.round(s.player.y)},pending:s.pendingExitTiles};
