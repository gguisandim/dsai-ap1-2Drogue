const keys=Object.keys(localStorage).filter(k=>k.startsWith('umbra-trail-campaign-v1'));
const raw=localStorage.getItem('umbra-trail-campaign-v1:run.e2e.igapo.20261029:chapter.aguas:stage.aguas.igapo-das-memorias');
let parsed=null;try{parsed=raw?JSON.parse(raw):null}catch(e){}
const s=game.scene.keys.GameScene;
return {keys, hasStageSave:!!raw, flags:parsed&&parsed.narrative&&parsed.narrative.flags, processedEventIds:parsed&&parsed.narrative&&parsed.narrative.processedEventIds, dialogueOpen:s.dialogueOpen, physicsPaused:s.physics.world.isPaused, combatInput:s.player.combatInputEnabled};
