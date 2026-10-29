(()=>{
  const sels = Array.from(document.querySelectorAll('select'));
  let chosen=null;
  sels.forEach(s=>{
    const opt = Array.from(s.options).find(o=>/Igapó das Memórias/.test(o.textContent) && /available/i.test(o.textContent));
    if(opt){ s.value=opt.value; s.dispatchEvent(new Event('change',{bubbles:true})); chosen={value:opt.value,text:opt.textContent}; }
  });
  return {selects:sels.length, chosen};
})()
