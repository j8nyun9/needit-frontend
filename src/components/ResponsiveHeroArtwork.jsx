import React,{useLayoutEffect,useRef} from 'react';

export default function ResponsiveHeroArtwork({children,...props}){
 const ref=useRef(null);
 useLayoutEffect(()=>{
  const artwork=ref.current,hero=artwork.parentElement;
  let frame,lastWidth=-1,disposed=false;
  function measure(){
   hero.classList.remove('hero-artwork-hidden');
   if(!artwork.getClientRects().length)return;
   const clipped=[...artwork.querySelectorAll('.code-lines > div')].some(line=>line.scrollWidth>line.clientWidth+1);
   hero.classList.toggle('hero-artwork-hidden',clipped);
  }
  function schedule(){cancelAnimationFrame(frame);frame=requestAnimationFrame(measure);}
  const observer=new ResizeObserver(entries=>{
   const width=entries[0].contentRect.width;
   if(width!==lastWidth){lastWidth=width;schedule();}
  });
  observer.observe(hero);window.addEventListener('resize',schedule);
  document.fonts?.ready.then(()=>{if(!disposed)schedule();});
  measure();
  return()=>{disposed=true;cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener('resize',schedule);hero.classList.remove('hero-artwork-hidden');};
 },[]);
 return <div {...props} ref={ref}>{children}</div>;
}
