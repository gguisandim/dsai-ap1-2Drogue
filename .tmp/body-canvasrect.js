const c=game.canvas;const r=c.getBoundingClientRect();
return {left:r.left,top:r.top,width:r.width,height:r.height,cw:c.width,ch:c.height,winW:window.innerWidth,winH:window.innerHeight,dpr:window.devicePixelRatio,scaleMode:game.scale.scaleMode,displaySize:game.scale.displaySize,canvasBounds:game.scale.canvasBounds};
