// Uninterrupted climb + chase-melee against the ranged enemy. Real keys/mouse only.
// Usage: node .tmp/climbchase.cjs <climbMs> <iterations> <checkpoint>
const fs=require('node:fs'),path=require('node:path'),WebSocket=require('ws');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function connect(){const t=(await(await fetch('http://127.0.0.1:9333/json/list')).json()).find(x=>x.type==='page'&&x.url.startsWith('http://127.0.0.1:5173/'));const ws=new WebSocket(t.webSocketDebuggerUrl);await new Promise((r,j)=>{ws.once('open',r);ws.once('error',j);});let id=0;const p=new Map();ws.on('message',raw=>{const m=JSON.parse(raw);if(!m.id)return;const e=p.get(m.id);if(!e)return;p.delete(m.id);m.error?e.j(new Error(JSON.stringify(m.error))):e.r(m.result);});const send=(method,params={})=>new Promise((r,j)=>{const i=++id;p.set(i,{r,j});ws.send(JSON.stringify({id:i,method,params}));});await send('Runtime.enable');return{ws,send};}
const STATE=`(()=>{const g=window.__probeGame;const sc=g.scene.keys.GameScene;const cam=sc.cameras.main;const c=g.canvas;const r=c.getBoundingClientRect();const fx=wx=>r.left+(wx-cam.worldView.x)/cam.worldView.width*r.width;const fy=wy=>r.top+(wy-cam.worldView.y)/cam.worldView.height*r.height;const p=sc.player;const en=(sc.enemies.getChildren()||[]).filter(e=>e.active&&e.hp>0).map(e=>({x:e.x,y:e.y,hp:e.hp}));en.sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y));const n=en[0];return{player:{x:p.x,y:p.y,hp:p.hp,magic:Math.round(p.magic)},nearest:n?{x:n.x,y:n.y,hp:n.hp,dist:Math.round(Math.hypot(n.x-p.x,n.y-p.y)),sx:Math.round(fx(n.x)),sy:Math.round(fy(n.y))}:null,alive:en.length,wave:sc.currentWaveIndex,waves:sc.waves.length,exits:sc.exitsRevealed};})()`;
async function state(send){const r=await send('Runtime.evaluate',{expression:STATE,returnByValue:true});if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails));return r.result.value;}
const K={w:{key:'w',code:'KeyW',vk:87},a:{key:'a',code:'KeyA',vk:65},s:{key:'s',code:'KeyS',vk:83},d:{key:'d',code:'KeyD',vk:68}};
async function hold(send,keys,ms){for(const k of keys){const q=K[k];await send('Input.dispatchKeyEvent',{type:'keyDown',key:q.key,code:q.code,windowsVirtualKeyCode:q.vk,nativeVirtualKeyCode:q.vk});}await sleep(ms);for(const k of keys){const q=K[k];await send('Input.dispatchKeyEvent',{type:'keyUp',key:q.key,code:q.code,windowsVirtualKeyCode:q.vk,nativeVirtualKeyCode:q.vk});}}
async function tapJ(send){const p={key:'j',code:'KeyJ',windowsVirtualKeyCode:74,nativeVirtualKeyCode:74};await send('Input.dispatchKeyEvent',{type:'keyDown',...p});await sleep(45);await send('Input.dispatchKeyEvent',{type:'keyUp',...p});}
(async()=>{
 const climb=Number(process.argv[2]||1190),iters=Number(process.argv[3]||30),cpf=process.argv[4]||'.tmp/evidence/climbchase.png';
 const {ws,send}=await connect();
 const att=await send('Runtime.evaluate',{expression:`(()=>window.__probeGame?'ok':'missing')()`,returnByValue:true});
 if(att.result.value==='missing'){const pr=await send('Runtime.evaluate',{expression:'Phaser.Game.prototype'});const o=await send('Runtime.queryObjects',{prototypeObjectId:pr.result.objectId});await send('Runtime.callFunctionOn',{objectId:o.objects.objectId,functionDeclaration:'function(){window.__probeGame=this[0];return !!this[0];}',returnByValue:true});}
 const start=await state(send);
 await hold(send,['w'],climb);
 const log=[];let died=false;
 for(let i=0;i<iters;i++){
   const st=await state(send);
   if(i%5===0||i===iters-1)log.push({i,alive:st.alive,php:st.player.hp,wave:st.wave,dist:st.nearest&&st.nearest.dist,hp:st.nearest&&st.nearest.hp,exits:st.exits,py:Math.round(st.player.y)});
   if(!st.nearest||st.player.hp<=0){if(st.player.hp<=0)died=true;break;}
   const dx=st.nearest.x-st.player.x,dy=st.nearest.y-st.player.y;
   await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:st.nearest.sx,y:st.nearest.sy,button:'none',buttons:0});
   const keys=[];if(dx>20)keys.push('d');else if(dx<-20)keys.push('a');if(dy>28)keys.push('s');else if(dy<-28)keys.push('w');
   if(keys.length&&st.nearest.dist>55)await hold(send,keys,120);
   await tapJ(send);
   await sleep(95);
 }
 const fin=await state(send);
 const s=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.mkdirSync(path.dirname(cpf),{recursive:true});fs.writeFileSync(cpf,Buffer.from(s.data,'base64'));
 console.log(JSON.stringify({start,log,final:fin,died},null,1));
 ws.terminate();
})().catch(e=>{console.error(e);process.exitCode=1;});
