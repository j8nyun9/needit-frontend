import React,{useEffect,useId,useRef,useState} from 'react';
import {useAuth} from '../contexts/AuthContext.jsx';
import {unpublishService} from '../services/projects.js';

export default function ServiceUnpublishButton({project,onUnpublished}){
 const {user}=useAuth();const [open,setOpen]=useState(false);const [busy,setBusy]=useState(false);const [error,setError]=useState('');
 const dialog=useRef(null);const lock=useRef(false);const title=useId();const description=useId();
 const allowed=Boolean(user&&project.can_edit&&project.status==='서비스 운영 중');
 useEffect(()=>{if(open&&allowed)dialog.current?.showModal();else dialog.current?.close();},[open,allowed]);
 if(!allowed)return null;
 async function confirm(){
  if(lock.current)return;lock.current=true;setBusy(true);setError('');
  try{const saved=await unpublishService(project.id);setOpen(false);onUnpublished(saved);}
  catch(e){setError(e.message);}finally{lock.current=false;setBusy(false);}
 }
 return <><button className="button outline service-unpublish-trigger" type="button" onClick={()=>{setError('');setOpen(true);}}>서비스 공개 취소</button>
  <dialog ref={dialog} className="service-unpublish-dialog" aria-labelledby={title} aria-describedby={description}
   onCancel={event=>{if(busy)event.preventDefault();else setOpen(false);}}
   onClick={event=>{if(event.target===event.currentTarget&&!busy)setOpen(false);}}>
   <div className="service-unpublish-content"><h2 id={title}>서비스 공개를 취소할까요?</h2><strong>{project.title}</strong>
    <p id={description}>NEEDIT의 사용하기 버튼과 출시 알림이 숨겨지고 ‘테스트 중’으로 변경돼요. 프로젝트와 등록한 주소, 후기·관심 등록은 유지돼요. 나중에 다시 공개할 수 있어요.</p>
    <p>외부에 배포한 사이트 자체는 계속 운영돼요.</p>
    {error&&<p className="release-error" role="alert">{error}</p>}
    <div className="release-actions"><button className="button outline" type="button" disabled={busy} onClick={()=>setOpen(false)}>돌아가기</button><button className="button service-unpublish-confirm" type="button" disabled={busy} onClick={confirm}>{busy?'취소 중…':'공개 취소하기'}</button></div>
   </div>
  </dialog></>;
}
