import React,{useEffect,useRef,useState} from 'react';
import Icon from './common/Icon.jsx';
import {apiRequest} from '../services/problems.js';
import {useAuth} from '../contexts/AuthContext.jsx';

export default function ProjectFeedbackReaction({projectId,feedbackId,feedback}){
 const {requireLogin}=useAuth();
 const [liked,setLiked]=useState(feedback?.my_reaction==='like');
 const [count,setCount]=useState(Number(feedback?.like_count)||0);
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 const request=useRef(null);
 useEffect(()=>()=>request.current?.abort(),[]);
 async function toggle(){
  if(request.current||!requireLogin())return;
  const controller=new AbortController();request.current=controller;setBusy(true);setError('');
  try{
   const saved=await apiRequest(`/projects/${encodeURIComponent(projectId)}/feedback/${encodeURIComponent(feedbackId)}/reaction`,{method:'PUT',signal:controller.signal,headers:{'Content-Type':'application/json'},body:JSON.stringify({reaction:liked?null:'like'})});
   if(!controller.signal.aborted){setLiked(saved.my_reaction==='like');setCount(Number(saved.like_count)||0);}
  }catch(e){if(!controller.signal.aborted)setError(e.message);}
  finally{if(!controller.signal.aborted){request.current=null;setBusy(false);}}
 }
 return <div className="feedback-heart-row">
  <button type="button" className={'feedback-heart'+(liked?' liked':'')} aria-pressed={liked} aria-label={`공감 ${count}개`} disabled={busy} onClick={toggle}><Icon name="heart" size={20}/><span>{count}</span></button>
  {error&&<p className="wp-comment-error" role="alert">{error}</p>}
 </div>;
}
