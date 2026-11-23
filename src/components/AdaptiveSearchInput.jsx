import React,{useLayoutEffect,useRef,useState} from 'react';

const hints=['불편함이나 프로젝트를 검색하세요','불편함·프로젝트 검색','검색'];
export default function AdaptiveSearchInput(props){
 const ref=useRef(null);
 const [hint,setHint]=useState(hints[0]);
 useLayoutEffect(()=>{
  const input=ref.current,context=document.createElement('canvas').getContext('2d');
  function fit(){
   if(!context)return;
   const style=getComputedStyle(input);
   context.font=style.font;
   const available=input.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight)-4;
   const spacing=parseFloat(style.letterSpacing)||0;
   setHint(hints.find(text=>context.measureText(text).width+spacing*text.length<=available)||hints.at(-1));
  }
  const observer=new ResizeObserver(fit);observer.observe(input);window.addEventListener('resize',fit);fit();
  return()=>{observer.disconnect();window.removeEventListener('resize',fit);};
 },[]);
 return <input {...props} ref={ref} placeholder={hint} title="불편함이나 프로젝트를 검색하세요"/>;
}
