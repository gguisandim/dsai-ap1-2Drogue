const raw = localStorage.getItem('umbra-trail-run-v1');
let parsed=null; try{parsed=raw?JSON.parse(raw):null;}catch(e){}
const keys=Object.keys(localStorage);
return {lsKeys:keys, hasRun:!!raw, runBytes: raw?raw.length:0, parsed};
