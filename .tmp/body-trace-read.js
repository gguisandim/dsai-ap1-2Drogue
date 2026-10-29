const tr = window.__trace || [];
return { n: tr.length, first: tr.slice(0,5), mid: tr.slice(Math.floor(tr.length/2), Math.floor(tr.length/2)+3), last: tr.slice(-5), pxRange: [Math.min(...tr.map(x=>x[1])), Math.max(...tr.map(x=>x[1]))], bxRange:[Math.min(...tr.map(x=>x[2])), Math.max(...tr.map(x=>x[2]))] };
