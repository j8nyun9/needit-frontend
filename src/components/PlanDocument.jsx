import React from 'react';
function inline(text){return text.split(/(\*\*[^*]+\*\*)/g).map((part,i)=>part.startsWith('**')&&part.endsWith('**')?<strong key={i}>{part.slice(2,-2)}</strong>:part);}
export default function PlanDocument({markdown}){
 return <div className="ai-plan-document">{markdown.split(/\n\s*\n/).filter(Boolean).map((block,i)=>{
  const heading=block.match(/^(#{1,3}) (.*)$/);
  if(heading){const Tag=heading[1].length===1?'h3':heading[1].length===2?'h4':'h5';return <Tag key={i}>{inline(heading[2])}</Tag>;}
  if(block==='---')return <hr key={i}/>;
  const lines=block.split('\n');
  if(lines.every(line=>line.startsWith('- ')))return <ul key={i}>{lines.map((line,j)=><li key={j}>{inline(line.slice(2))}</li>)}</ul>;
  if(lines.every(line=>/^\d+\. /.test(line)))return <ol key={i}>{lines.map((line,j)=><li key={j}>{inline(line.replace(/^\d+\. /,''))}</li>)}</ol>;
  return <p key={i} className={block.startsWith('※')?'ai-plan-note':undefined}>{inline(block)}</p>;
 })}</div>;
}
