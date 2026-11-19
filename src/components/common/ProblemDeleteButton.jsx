import React,{useEffect,useId,useRef,useState} from 'react';
import {useAuth} from '../../contexts/AuthContext.jsx';
import {deleteProblem} from '../../services/problems.js';
import './problem-delete.css';

export default function ProblemDeleteButton({problem,onDeleted}){
 const {user}=useAuth();const [open,setOpen]=useState(false);const [busy,setBusy]=useState(false);const [error,setError]=useState('');
 const dialog=useRef(null);const lock=useRef(false);const heading=useId();const description=useId();
 const permitted=Boolean(user&&problem.can_delete);
 useEffect(()=>{if(open&&permitted)dialog.current?.showModal();else dialog.current?.close();},[open,permitted]);
 if(!permitted)return null;
 async function confirm(){
  if(lock.current)return;lock.current=true;setBusy(true);setError('');
  try{await deleteProblem(problem.id);onDeleted(problem.id);}
  catch(e){
   if(e.status===404){onDeleted(problem.id);return;}
   setError(e.message);
  }finally{lock.current=false;setBusy(false);}
 }
 return <><button className="button outline problem-delete-trigger" type="button" onClick={()=>{setError('');setOpen(true);}}>불편함 삭제</button>
  <dialog ref={dialog} className="problem-delete-dialog" aria-labelledby={heading} aria-describedby={description}
   onCancel={event=>{if(busy)event.preventDefault();else setOpen(false);}}
   onClick={event=>{if(event.target===event.currentTarget&&!busy)setOpen(false);}}>
   <div className="problem-delete-content"><h2 id={heading}>이 불편함을 삭제할까요?</h2><p className="problem-delete-title">{problem.title}</p>
    <p id={description}>삭제한 글은 되돌릴 수 없어요. 공감, 댓글, 개인 AI 기획안도 함께 삭제돼요. 연결된 프로젝트는 유지돼요.</p>
    {error&&<p className="problem-delete-error" role="alert">{error}</p>}
    <div className="problem-delete-actions"><button className="button outline" type="button" disabled={busy} onClick={()=>setOpen(false)}>취소</button><button className="button problem-delete-confirm" type="button" disabled={busy} onClick={confirm}>{busy?'삭제 중…':'삭제하기'}</button></div>
   </div>
  </dialog></>;
}
