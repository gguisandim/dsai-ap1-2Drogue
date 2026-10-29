const s = game.scene.keys.GameScene; const w=s.physics.world;
const upd = s.sys.events.listenerCount ? s.sys.events.listenerCount('update') : null;
let listeners = [];
try { listeners = s.sys.events.listeners('update').map(fn=>fn===w.update?'world.update':(fn.name||'anon')); } catch(e){}
return {
  updateListenerCount: upd, listeners,
  worldTime: w.time, worldStep: w.stepsLastFrame,
  worldPauseFlag: w.isPaused,
  sceneStatus: s.sys.settings.status,
  sceneActive: s.scene.isActive(), visible: s.sys.settings.visible,
  physicsStarted: w.isBooted !== undefined ? w.isBooted : 'n/a',
};
