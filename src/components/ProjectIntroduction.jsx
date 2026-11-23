
import React,{useEffect,useRef,useState} from 'react';
import {apiRequest} from '../services/problems.js';
import {normalizeProject} from '../services/projects.js';
const fields=p=>({description:p.description||'',usage_guide:p.usage_guide||'',features:(p.features||[]).filter(f=>typeof f==='string').join('\n')});
export default function ProjectIntroduction({project,canEdit,onSaved,editRequest=0}){
 const [editing,setEditing]=useState(false),[data,setData]=useState(()=>fields(project)),[busy,setBusy]=useState(false),[error,setError]=useState('');const request=useRef(null);
 useEffect(()=>()=>request.current?.abort(),[]);
 useEffect(()=>{if(editRequest>0&&canEdit){setData(fields(project));setError('');setEditing(true);}},[editRequest,canEdit]);
 function change(e){setData(p=>({...p,[e.target.name]:e.target.value}));}
 async function save(e){
  e.preventDefault();if(request.current||!canEdit||!data.description.trim())return;
  const features=data.features.split('\n').map(f=>f.trim()).filter(Boolean);
  if(features.length>30||features.some(f=>f.length>500)){setError('주요 기능은 최대 30개, 각 500자까지 입력해주세요.');return;}
  const c=new AbortController();request.current=c;setBusy(true);setError('');
  try{const row=await apiRequest('/projects/'+encodeURIComponent(project.id),{method:'PATCH',signal:c.signal,headers:{'Content-Type':'application/json'},body:JSON.stringify({description:data.description.trim(),usage_guide:data.usage_guide.trim(),features})});if(!c.signal.aborted){onSaved(normalizeProject(row));setEditing(false);}}
  catch(e){if(!c.signal.aborted)setError(e.message);}finally{if(!c.signal.aborted){request.current=null;setBusy(false);}}
 }
 return <section className="wp-box project-introduction">
  <h2 className="project-introduction-heading"><span>서비스 소개 및 사용 방법</span>{canEdit&&!editing&&<button type="button" className="button outline" onClick={()=>{setData(fields(project));setError('');setEditing(true);}}>수정</button>}</h2>
  <div className="wp-box-body">{canEdit&&editing?<form className="release-editor" onSubmit={save}><fieldset disabled={busy}>
   <label>서비스 소개<textarea name="description" rows={5} required maxLength={5000} value={data.description} onChange={change}/></label>
   <label>사용 방법<textarea name="usage_guide" rows={4} maxLength={5000} value={data.usage_guide} onChange={change}/></label>
   <label>주요 기능<textarea name="features" rows={5} maxLength={15030} value={data.features} onChange={change}/></label>
   <p className="wp-demo">주요 기능은 한 줄에 하나씩 입력해주세요. (최대 30개, 각 500자)</p>
   <div className="release-actions"><button className="button primary" disabled={busy||!data.description.trim()}>{busy?'저장 중…':'저장'}</button><button className="button outline" type="button" onClick={()=>setEditing(false)}>취소</button></div>
  </fieldset>{error&&<p role="alert" className="release-error">{error}</p>}</form>:<><h3>서비스 소개</h3><p className="release-copy">{project.description}</p><h3>사용 방법</h3><p className="release-copy">{project.usage_guide||'아직 등록된 사용 방법이 없어요.'}</p>{Array.isArray(project.features)&&project.features.length>0&&<><h3>주요 기능</h3><ul>{project.features.map((f,i)=><li key={i}>{typeof f==='string'?f:JSON.stringify(f)}</li>)}</ul></>}</>}</div>
 </section>;
}
