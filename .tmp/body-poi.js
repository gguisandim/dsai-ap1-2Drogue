const s=game.scene.keys.GameScene;
const found=[];
s.children.list.forEach(o=>{const t=o.texture&&o.texture.key;const n=o.name||'';if((t&&/chest|vestig|memory|interest|npc/i.test(t))||/chest|vestig|memory|npc/i.test(n))found.push({type:o.type,tex:t,name:n,x:Math.round(o.x||0),y:Math.round(o.y||0),visible:o.visible});});
return {found, player:{x:Math.round(s.player.x),y:Math.round(s.player.y)}, enemies:s.enemies.countActive(true), exitsRevealed:s.exitsRevealed};
