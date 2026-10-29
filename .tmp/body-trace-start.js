const s = game.scene.keys.GameScene;
window.__trace = [];
if (!window.__traceOn) {
  window.__traceOn = true;
  s.sys.events.on('update', () => {
    if (window.__trace.length < 400) {
      const b = s.player.body;
      window.__trace.push([Math.round(s.time.now), +s.player.x.toFixed(1), +b.position.x.toFixed(1), +b.velocity.x.toFixed(0)]);
    }
  });
}
return { installed: true };
