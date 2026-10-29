const s=game.scene.keys.GameScene;const b=s.player.body;
const near=s.wallTiles.getChildren().filter(w=>w.body&&w.body.right>b.left-50&&w.body.left<b.right+50&&w.body.bottom>b.top-50&&w.body.top<b.bottom+50).map(w=>({x:w.x,y:w.y,tl:{x:w.body.x,y:w.body.y},w:w.body.width,h:w.body.height}));
return {player:{x:s.player.x,y:s.player.y},body:{x:b.x,y:b.y,w:b.width,h:b.height,top:b.top,bottom:b.bottom,left:b.left,right:b.right},near,
 combatInputEnabled:s.player.combatInputEnabled, active:s.player.active, isDodging:s.player.isDodging, scenePaused:s.scene.isPaused()};
