import React,{useEffect,useId,useRef,useState} from 'react';
import Icon from './common/Icon.jsx';
import {apiRequest} from '../services/problems.js';

export default function ProjectDeleteButton({project,onDeleted,triggerClassName='my-project-delete',triggerContent}){
 const [open,setOpen]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const dialog=useRef(null),trigger=useRef(null),request=useRef(null),heading=useId();
 useEffect(()=>()=>request.current?.abort(),[]);
 useEffect(()=>{if(open)dialog.current?.showModal();else dialog.current?.close();},[open]);
 function close(){if(request.current)return;setOpen(false);trigger.current?.focus();}
 async function remove(){
  if(request.current)return;
  const c=new AbortController();request.current=c;setBusy(true);setError('');
  try{
   await apiRequest('/projects/'+encodeURIComponent(project.id),{method:'DELETE',signal:c.signal});
   if(!c.signal.aborted){setOpen(false);onDeleted(project.id);}
  }catch(e){if(!c.signal.aborted)setError(e.message);}
  finally{if(!c.signal.aborted){request.current=null;setBusy(false);}}
 }
 if(project.can_edit!==true)return null;
 return <><button ref={trigger} type="button" className={triggerClassName} onClick={()=>{setError('');setOpen(true);}}>{triggerContent||<><Icon name="trash" size={15}/>프로젝트 삭제</>}</button>
  <dialog ref={dialog} className="project-delete-dialog" aria-labelledby={heading} onCancel={e=>{e.preventDefault();close();}} onClick={e=>{if(e.target===e.currentTarget)close();}}>
   <h2 id={heading}>프로젝트를 삭제할까요?</h2><p className="project-delete-name">{project.title}</p>
   <p>프로젝트와 관련 후기·하트·관심 등록 내역이 삭제돼요. 연결된 불편함과 AI 기획안은 유지돼요. 삭제는 되돌릴 수 없어요.</p>
   {error&&<p className="release-error" role="alert">{error}</p>}
   <div className="release-actions"><button className="button outline" type="button" disabled={busy} onClick={close}>취소</button><button className="button project-delete-confirm" type="button" disabled={busy} onClick={remove}>{busy?'삭제 중…':'삭제하기'}</button></div>
  </dialog>
 </>;
}
