const s = game.scene.keys.GameScene;
if (!window.__sceneUpdates) { window.__sceneUpdates = 0; s.sys.events.on('update', () => { window.__sceneUpdates++; }); }
return { registered: true, count: window.__sceneUpdates, time: Math.round(s.time.now), physicsTime: s.physics.world.time };
