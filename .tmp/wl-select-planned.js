(()=>{
  const s=document.querySelector('select');
  const opt=Array.from(s.options).find(o=>/Mangues/.test(o.textContent));
  if(opt){s.value=opt.value;s.dispatchEvent(new Event('change',{bubbles:true}));}
  return {value:opt&&opt.value,text:opt&&opt.textContent};
})()
