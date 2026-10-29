const s=game.scene.keys.GameScene;const p=s.player;
const prof=localStorage.getItem('umbra-trail-profile');
const prog=localStorage.getItem('vigrid-progression-v1');
let profJ=null,progJ=null;try{profJ=prof?JSON.parse(prof):null}catch(e){}try{progJ=prog?JSON.parse(prog):null}catch(e){}
return {
  levelId:s.currentLevel.id, controlsGuideOpen:s.controlsGuideOpen,
  player:{classId:p.heroClass&&p.heroClass.id, classFlat:p.classId, hp:p.hp, maxHp:p.maxHp, magic:Math.round(p.magic), maxMagic:p.maxMagic, halos:p.halos, x:Math.round(p.x), y:Math.round(p.y)},
  progression:{level:s.progression.levelProgress().level, xp:s.progression.levelProgress().current, required:s.progression.levelProgress().required, snapshot:s.progression.snapshot()},
  profileShape: profJ?Object.keys(profJ):null,
  profileClass: profJ&&(profJ.classId||profJ.selectedClass||profJ.appearance&&profJ.appearance.classId),
  progLevel: progJ&&(progJ.level||progJ.currentLevel||progJ.data&&progJ.data.level),
};
