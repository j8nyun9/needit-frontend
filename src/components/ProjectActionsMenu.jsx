import React,{useEffect,useRef,useState} from 'react';
import Icon from './common/Icon.jsx';
import ProjectDeleteButton from './ProjectDeleteButton.jsx';

export default function ProjectActionsMenu({project,onEdit,onDeleted}){
 const [open,setOpen]=useState(false),[message,setMessage]=useState(''),[manual,setManual]=useState('');
 const container=useRef(null),trigger=useRef(null);
 useEffect(()=>{
  if(!open)return;
  function outside(e){if(!container.current?.contains(e.target))setOpen(false);}
  function escape(e){if(container.current?.querySelector('dialog[open]'))return;if(e.key==='Escape'){setOpen(false);trigger.current?.focus();}}
  document.addEventListener('pointerdown',outside);document.addEventListener('keydown',escape);
  return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape);};
 },[open]);
 async function share(){
  const url=new URL(window.location.href);url.search='';url.hash='';url.searchParams.set('project',project.id);
  setOpen(false);trigger.current?.focus();
  try{await navigator.clipboard.writeText(url.href);setMessage('링크를 복사했어요.');}
  catch{setManual(url.href);setMessage('링크를 선택해서 복사해주세요.');}
 }
 return <div className="wp-issue-more project-actions-menu" ref={container}>
  <button ref={trigger} className="wp-issue-more-trigger" type="button" aria-label="프로젝트 더보기" aria-expanded={open} onClick={()=>{setMessage('');setManual('');setOpen(v=>!v);}}><span aria-hidden="true">⋮</span></button>
  {open&&<div className="wp-issue-menu">
   <button type="button" onClick={()=>{setOpen(false);onEdit();}}>수정<Icon name="pencil" size={18}/></button>
   <ProjectDeleteButton project={project} onDeleted={onDeleted} triggerClassName="wp-issue-menu-danger" triggerContent={<>삭제<Icon name="trash" size={18}/></>}/>
   <button type="button" onClick={share}>URL 공유<Icon name="link" size={18}/></button>
  </div>}
  {message&&<span className="wp-share-status" role="status">{message}</span>}
  {manual&&<input className="wp-share-manual" aria-label="프로젝트 공유 링크" readOnly value={manual} onFocus={e=>e.target.select()}/>}
 </div>;
}
