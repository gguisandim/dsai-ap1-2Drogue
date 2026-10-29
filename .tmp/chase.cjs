// Chase-and-melee: keeps inside the ranged enemy's no-shoot (<180px) band using real keys, taps J.
// Usage: node .tmp/chase.cjs <iterations> <checkpointPath>
const fs = require('node:fs');
const path = require('node:path');
const WebSocket = require('ws');
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function connect() {
  const targets = await (await fetch('http://127.0.0.1:9333/json/list')).json();
  const t = targets.find(x => x.type === 'page' && x.url.startsWith('http://127.0.0.1:5173/'));
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.once('open', r); ws.once('error', j); });
  let id = 0; const p = new Map();
  ws.on('message', raw => { const m = JSON.parse(raw); if (!m.id) return; const e = p.get(m.id); if (!e) return; p.delete(m.id); m.error ? e.j(new Error(JSON.stringify(m.error))) : e.r(m.result); });
  const send = (method, params = {}) => new Promise((r, j) => { const i = ++id; p.set(i, { r, j }); ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Runtime.enable');
  return { ws, send };
}
const STATE = `(()=>{const g=window.__probeGame;const sc=g.scene.keys.GameScene;const cam=sc.cameras.main;const c=g.canvas;const r=c.getBoundingClientRect();const fx=wx=>r.left+(wx-cam.worldView.x)/cam.worldView.width*r.width;const fy=wy=>r.top+(wy-cam.worldView.y)/cam.worldView.height*r.height;const p=sc.player;const en=(sc.enemies.getChildren()||[]).filter(e=>e.active&&e.hp>0).map(e=>({x:e.x,y:e.y,hp:e.hp}));en.sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y));const n=en[0];return{player:{x:p.x,y:p.y,hp:p.hp},nearest:n?{x:n.x,y:n.y,hp:n.hp,dist:Math.round(Math.hypot(n.x-p.x,n.y-p.y)),sx:Math.round(fx(n.x)),sy:Math.round(fy(n.y))}:null,alive:en.length,wave:sc.currentWaveIndex,exitsRevealed:sc.exitsRevealed};})()`;
async function state(send){const r=await send('Runtime.evaluate',{expression:STATE,returnByValue:true});if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails));return r.result.value;}
async function shot(send,file){const s=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,Buffer.from(s.data,'base64'));}
const KEYS={w:{key:'w',code:'KeyW',vk:87},a:{key:'a',code:'KeyA',vk:65},s:{key:'s',code:'KeyS',vk:83},d:{key:'d',code:'KeyD',vk:68}};
async function holdKeys(send,keys,ms){
  for(const k of keys) await send('Input.dispatchKeyEvent',{type:'keyDown',...KEYS[k]});
  await sleep(ms);
  for(const k of keys) await send('Input.dispatchKeyEvent',{type:'keyUp',...KEYS[k]});
}
async function tapJ(send){const p={key:'j',code:'KeyJ',windowsVirtualKeyCode:74,nativeVirtualKeyCode:74};await send('Input.dispatchKeyEvent',{type:'keyDown',...p});await sleep(50);await send('Input.dispatchKeyEvent',{type:'keyUp',...p});}
(async()=>{
  const iters=Number(process.argv[2]||12); const cpf=process.argv[3]||'.tmp/evidence/chase-cp.png';
  const {ws,send}=await connect();
  const att=await send('Runtime.evaluate',{expression:`(()=>window.__probeGame?'ok':'missing')()`,returnByValue:true});
  if(att.result.value==='missing'){const proto=await send('Runtime.evaluate',{expression:'Phaser.Game.prototype'});const objs=await send('Runtime.queryObjects',{prototypeObjectId:proto.result.objectId});await send('Runtime.callFunctionOn',{objectId:objs.objects.objectId,functionDeclaration:'function(){window.__probeGame=this[0];return !!this[0];}',returnByValue:true});}
  const log=[];
  for(let i=0;i<iters;i++){
    const st=await state(send);
    log.push({i,alive:st.alive,php:st.player.hp,wave:st.wave,dist:st.nearest&&st.nearest.dist,hp:st.nearest&&st.nearest.hp,exits:st.exitsRevealed});
    if(!st.nearest||st.player.hp<=0) break;
    const dx=st.nearest.x-st.player.x, dy=st.nearest.y-st.player.y;
    await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:st.nearest.sx,y:st.nearest.sy,button:'none',buttons:0});
    const keys=[];
    if(dx>24)keys.push('d'); else if(dx<-24)keys.push('a');
    if(dy>24)keys.push('s'); else if(dy<-24)keys.push('w');
    if(keys.length && st.nearest.dist>60) await holdKeys(send,keys,150);
    await tapJ(send);
    await sleep(110);
  }
  const fin=await state(send);
  await shot(send,cpf);
  console.log(JSON.stringify({log,final:fin},null,1));
  ws.terminate();
})().catch(e=>{console.error(e);process.exitCode=1;});
