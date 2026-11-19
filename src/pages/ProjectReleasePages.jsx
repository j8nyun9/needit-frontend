import React,{useEffect,useRef,useState} from 'react';
import Icon from '../components/common/Icon.jsx';
import {useAuth} from '../contexts/AuthContext.jsx';
import {createProject,getProject,saveProject,favoriteProject,postFeedback,releaseStatuses,serviceUrl,listNotifications,readNotification} from '../services/projects.js';
import {getProblem} from '../services/problems.js';
import './project-release.css';
import ServiceRegistration from '../components/ServiceRegistration.jsx';
import ServiceLaunchCard from '../components/ServiceLaunchCard.jsx';
import ServiceUnpublishButton from '../components/ServiceUnpublishButton.jsx';

export function ServiceLink({project}){
 const url=serviceUrl(project.deployment_url);
 return project.status==='서비스 운영 중'&&url?<a className="button primary" href={url} target="_blank" rel="noopener noreferrer">서비스 사용하기 ↗</a>:null;
}
export function RelatedServices({problem,projects=[],onProject}){
 const related=projects.filter(p=>p.status==='서비스 운영 중'&&p.problem_ids?.some(id=>String(id)===String(problem.id)));
 if(!related.length)return null;
 return <section className="release-related" aria-label="이 불편함을 해결한 서비스"><h2>이 불편함을 해결한 서비스가 출시됐어요</h2>{related.map(p=><div key={p.id}><button className="release-text-link" onClick={()=>onProject(p)}>{p.title} →</button><ServiceLink project={p}/></div>)}</section>;
}
export function ProjectsPage({projects,onOpen,onCreated}){
 const [status,setStatus]=useState('전체');const [registering,setRegistering]=useState(false);const {requireLogin}=useAuth();
 if(registering)return <div className="wp-page"><ServiceRegistration onCancel={()=>setRegistering(false)} onCreated={project=>{setRegistering(false);onCreated(project);}}/></div>;
 const rows=projects.filter(p=>status==='전체'||p.status===status);
 return <div className="wp-page"><p className="code-comment">// FROM ISSUE TO SERVICE</p><h1>함께 만드는 <span>프로젝트</span></h1><p className="wp-demo">학생들의 불편함에서 시작된 서비스를 만나보세요.</p><div className="release-actions"><button className="button primary" onClick={()=>{if(requireLogin())setRegistering(true);}}>＋ 완성한 서비스 등록</button></div><div className="release-filters" aria-label="프로젝트 상태 필터">{['전체',...releaseStatuses].map(s=><button className={'button '+(s===status?'primary':'outline')} aria-pressed={s===status} key={s} onClick={()=>setStatus(s)}>{s}</button>)}</div><div className="wp-project-grid">{rows.map(p=><article className="wp-box" key={p.id}><h2><button onClick={()=>onOpen(p)}>{p.title} →</button></h2><div className="wp-box-body"><span className={'status '+(p.status==='서비스 운영 중'?'release-live':'developing')}>{p.status}</span><p className="wp-long-copy">{p.description}</p><div className="progress-track"><div style={{width:`${p.progress}%`}}/></div><div className="release-actions"><button className="button outline" onClick={()=>onOpen(p)}>프로젝트 살펴보기</button><ServiceLink project={p}/></div></div></article>)}</div>{!rows.length&&<p className="empty">해당 상태의 프로젝트가 없어요.</p>}</div>;
}

export function ProjectCreatePage({ problem, onCancel, onCreated, onProblemUpdate, onOpenProject }) {
 const plan=problem.ai_plan;
 const details=plan.hackathonPlan;
 const [draft,setDraft]=useState(()=>({
  title: (details?.projectName?.trim() || plan.title?.trim() || problem.title).slice(0,100),
  description: plan.problem_definition || details?.problem_definition || problem.description || problem.content || '',
  features: (plan.recommended_features || details?.features || []).join('\n'),
 }));
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [conflict,setConflict]=useState(false);
 const [projectId,setProjectId]=useState(problem.project_id ?? null);
 const request=useRef(null);
 useEffect(()=>()=>request.current?.abort(),[]);
 const features=draft.features.split(/\r?\n/).map(line=>line.trim()).filter(Boolean);
 const invalidFeatures=features.length>10||features.some(line=>line.length>250);
 const change=event=>setDraft(previous=>({...previous,[event.target.name]:event.target.value}));

 async function refreshProblem(signal) {
  const issue=await getProblem(problem.id,signal);
  if(signal.aborted)return;
  setProjectId(issue.project_id ?? null);
  setConflict(issue.project_id != null);
  onProblemUpdate(issue);
 }

 async function run(action) {
  if(request.current)return;
  const controller=new AbortController();
  request.current=controller;
  setBusy(true);
  setError('');
  try{await action(controller.signal);}
  catch(error){if(!controller.signal.aborted)setError(error.message);}
  finally{
   request.current=null;
   if(!controller.signal.aborted)setBusy(false);
  }
 }

 function submit(event) {
  event.preventDefault();
  if(conflict||projectId!=null||invalidFeatures||!draft.title.trim()||!draft.description.trim())return;
  run(async signal=>{
   try{
    const project=await createProject({
     title:draft.title.trim(),description:draft.description.trim(),features,problem_id:problem.id,
    },signal);
    if(!signal.aborted)onCreated(project,problem.id);
   }catch(error){
    if(signal.aborted)return;
    if(error.status!==409)throw error;
    setConflict(true);
    await refreshProblem(signal);
   }
  });
 }

 return <div className="wp-page release-create">
  <h1>프로젝트 등록</h1>
  <form className="release-editor" onSubmit={submit}>
   <p className="release-source">원본 불편함 <strong>#{problem.id} {problem.title}</strong></p>
   <fieldset disabled={busy}>
    <label>프로젝트 제목<input name="title" required maxLength={100} value={draft.title} onChange={change}/></label>
    <label>프로젝트 설명<textarea name="description" rows={6} required maxLength={5000} value={draft.description} onChange={change}/></label>
    <label>주요 기능<textarea name="features" rows={4} value={draft.features} onChange={change}
      aria-invalid={invalidFeatures} placeholder="기능을 한 줄에 하나씩 입력해주세요."/></label>
    {invalidFeatures&&<p className="release-error" role="alert">주요 기능은 10개까지, 한 줄에 250자까지 입력할 수 있어요.</p>}
    {(conflict||projectId!=null)&&<p className="release-error" role="status">이미 다른 프로젝트에 채택된 불편함이에요.</p>}
    {error&&<p className="release-error" role="alert">{error}</p>}
    <div className="release-actions">
     {projectId!=null?<button className="button primary" type="button" onClick={()=>onOpenProject({id:projectId})}>연결된 프로젝트 보기</button>
      :conflict?<button className="button outline" type="button" onClick={()=>run(refreshProblem)}>채택 상태 다시 확인</button>
      :<button className="button primary" type="submit" disabled={invalidFeatures||!draft.title.trim()||!draft.description.trim()}>{busy?'등록 중…':'프로젝트 등록하기'}</button>}
     <button className="button outline" type="button" onClick={onCancel}>취소</button>
    </div>
   </fieldset>
  </form>
 </div>;
}

function PublicationEditor({project,onSaved,onCancel}){
 const [data,setData]=useState({release_status:'서비스 운영 중',deployment_url:project.deployment_url||'',usage_guide:project.usage_guide||''});
 const [busy,setBusy]=useState(false);const [error,setError]=useState('');const lock=useRef(false);
 const change=e=>setData({...data,[e.target.name]:e.target.value});
 return <form className="release-editor" onSubmit={async e=>{e.preventDefault();if(lock.current)return;lock.current=true;setBusy(true);setError('');try{onSaved(await saveProject(project.id,data));}catch(e){setError(e.message);}finally{lock.current=false;setBusy(false);}}}><h2>프로젝트 공개 정보 수정</h2><fieldset disabled={busy}><label>서비스 상태<select name="release_status" value={data.release_status} onChange={change}>{releaseStatuses.map(s=><option key={s}>{s}</option>)}</select></label><label>배포된 서비스 주소<input name="deployment_url" type="url" placeholder="https://..." value={data.deployment_url} onChange={change} maxLength={2000} required={data.release_status==='서비스 운영 중'}/></label><label>사용 방법<textarea name="usage_guide" rows={5} value={data.usage_guide} onChange={change} maxLength={5000} placeholder="서비스를 사용하는 방법과 로그인 필요 여부를 알려주세요."/></label><p className="wp-demo">운영 중으로 변경하면 관심 등록한 사용자와 관련 불편함에 공감한 사용자에게 출시 알림이 표시돼요.</p><div className="release-actions"><button className="button primary" type="submit">{busy?'저장 중…':'저장하기'}</button><button className="button outline" type="button" onClick={onCancel}>취소</button></div></fieldset>{error&&<p role="alert" className="release-error">{error}</p>}</form>;
}
export function ProjectDetailPage({project:initial,onBack,onIssues,onIssue,onUpdate}){
 const {user,requireLogin}=useAuth();const [project,setProject]=useState(initial);const [loading,setLoading]=useState(true);const [error,setError]=useState('');const [retry,setRetry]=useState(0);const [editing,setEditing]=useState(false);const [tab,setTab]=useState('소개');const [content,setContent]=useState('');const [kind,setKind]=useState('review');const [busy,setBusy]=useState(false);const lock=useRef(false);
 useEffect(()=>{const c=new AbortController();setLoading(true);setError('');setEditing(false);getProject(initial.id,c.signal).then(setProject).catch(e=>{if(!c.signal.aborted)setError(e.message);}).finally(()=>{if(!c.signal.aborted)setLoading(false);});return()=>c.abort();},[initial.id,user?.id,retry]);
 function update(p){setProject(prev=>({...prev,...p}));onUpdate?.(p);}
 async function action(fn){if(!requireLogin()||lock.current)return;lock.current=true;setBusy(true);setError('');try{await fn();}catch(e){setError(e.message);}finally{lock.current=false;setBusy(false);}}
 return <div className="wp-page"><button className="wp-back" onClick={onBack}>← 프로젝트 목록으로</button>{loading?<p role="status">프로젝트를 불러오는 중이에요…</p>:<><p className="code-comment">// 학생의 불편함에서 시작된 프로젝트</p><div className="release-title"><h1>{project.title}</h1><span className={'status '+(project.status==='서비스 운영 중'?'release-live':'developing')}>{project.status}</span></div><p className="wp-long-copy">{project.description}</p><ServiceLaunchCard project={project}/><div className="release-actions"><button className="button outline" disabled={busy} aria-pressed={Boolean(project.interested)} onClick={()=>action(async()=>{const row=await favoriteProject(project.id,!project.interested);update(row.id?row:{...project,...row});})}>{project.interested?'♥ 관심 등록됨':'♡ 관심 등록'}</button>{project.can_edit&&<button className="button outline" onClick={()=>setEditing(!editing)}>{project.status==='서비스 운영 중'?'서비스 공개 정보 수정':'서비스 출시하기'}</button>}<ServiceUnpublishButton project={project} onUnpublished={saved=>{update(saved);setEditing(false);}}/></div>{editing&&project.can_edit&&<PublicationEditor project={project} onCancel={()=>setEditing(false)} onSaved={p=>{update(p);setEditing(false);}}/>}<div className="wp-project-detail"><div><div className="wp-detail-tabs">{['소개','관련 불편함','후기·오류 제보'].map(t=><button key={t} className={tab===t?'selected':''} onClick={()=>setTab(t)}>{t}</button>)}</div>{tab==='소개'?<section className="wp-box"><h2>서비스 소개 및 사용 방법</h2><div className="wp-box-body"><p className="release-copy">{project.description}</p><h3>사용 방법</h3><p className="release-copy">{project.usage_guide||'아직 등록된 사용 방법이 없어요.'}</p>{Array.isArray(project.features)&&project.features.length>0&&<><h3>주요 기능</h3><ul>{project.features.map((f,i)=><li key={i}>{typeof f==='string'?f:JSON.stringify(f)}</li>)}</ul></>}</div></section>:tab==='관련 불편함'?<section className="wp-box"><h2>이 프로젝트가 해결하는 불편함</h2><div className="wp-box-body">{project.related_problems?.map(p=><button className="release-related-item" key={p.id} onClick={()=>onIssue(p)}>#{p.id} {p.title} →</button>)}{!project.related_problems?.length&&<p>연결된 불편함이 없어요.</p>}<button className="button outline" onClick={onIssues}>불편함 탐색하기</button></div></section>:<section className="wp-box"><h2>사용 후기 · 오류 제보</h2><div className="wp-box-body"><form onSubmit={e=>{e.preventDefault();action(async()=>{const row=await postFeedback(project.id,{kind,content});setProject(p=>({...p,feedback:[row,...(p.feedback||[])]}));setContent('');});}}><fieldset disabled={busy}><label>의견 종류<select value={kind} onChange={e=>setKind(e.target.value)} aria-label="의견 종류"><option value="review">사용 후기</option><option value="bug">오류 제보</option></select></label><textarea aria-label="후기 또는 오류 내용" rows={4} maxLength={1000} required value={content} onChange={e=>setContent(e.target.value)} placeholder="도움이 된 점이나 오류가 발생한 상황을 알려주세요."/><button className="button primary" type="submit">{busy?'등록 중…':'의견 등록'}</button></fieldset></form>{project.feedback?.map(f=><article className="release-feedback" key={f.id}><strong>{f.kind==='bug'?'오류 제보':'사용 후기'} · {f.author_name}</strong><time dateTime={f.created_at}>{new Date(f.created_at).toLocaleDateString('ko-KR')}</time><p className="release-copy">{f.content}</p></article>)}{!project.feedback?.length&&<p className="wp-demo">첫 번째 의견을 남겨주세요.</p>}</div></section>}</div><aside><section className="wp-box"><h2>프로젝트 진행 현황</h2><div className="wp-box-body"><ol className="release-stages">{releaseStatuses.map(s=><li className={s===project.status?'current':''} key={s}>{s}</li>)}</ol><div className="progress-track"><div style={{width:`${project.progress}%`}}/></div><p>{project.progress}%</p></div></section><section className="wp-box"><h2>프로젝트 기본 정보</h2><div className="wp-box-body"><p>개발 팀: {project.team_name||'미등록'}</p>{serviceUrl(project.github_url)&&<p><a href={serviceUrl(project.github_url)} target="_blank" rel="noopener noreferrer">GitHub ↗</a></p>}<ServiceLink project={project}/>{!serviceUrl(project.deployment_url)&&<p className="wp-demo">배포 주소 등록 전이에요.</p>}{project.released_at&&<p className="wp-demo">출시일 {new Date(project.released_at).toLocaleDateString('ko-KR')}</p>}</div></section></aside></div></>}{error&&<div className="release-error" role="alert">{error}<button className="button outline" onClick={()=>setRetry(n=>n+1)}>다시 불러오기</button></div>}</div>;
}
export function ProjectNotifications({onOpen}){
 const {user,requireLogin}=useAuth();const [open,setOpen]=useState(false);const [rows,setRows]=useState([]);const [error,setError]=useState('');const [loading,setLoading]=useState(false);const dialog=useRef(null);
 useEffect(()=>{setOpen(false);setRows([]);},[user?.id]);
 useEffect(()=>{if(!open)return;const c=new AbortController();setLoading(true);setError('');listNotifications(c.signal).then(setRows).catch(e=>{if(!c.signal.aborted)setError(e.message);}).finally(()=>{if(!c.signal.aborted)setLoading(false);});return()=>c.abort();},[open,user?.id]);
 useEffect(()=>{if(open)dialog.current?.showModal();else dialog.current?.close();},[open]);
 return <><button className="icon-button" aria-label="출시 알림" onClick={()=>{if(requireLogin())setOpen(true);}}><Icon name="bell" size={27}/></button><dialog ref={dialog} onCancel={()=>setOpen(false)} onClick={e=>{if(e.target===e.currentTarget)setOpen(false);}} aria-label="서비스 출시 알림"><div className="dialog-header"><h2>서비스 출시 알림</h2><button className="icon-button" aria-label="닫기" onClick={()=>setOpen(false)}><Icon name="close"/></button></div><div className="release-notifications">{loading&&<p role="status">알림을 불러오는 중…</p>}{error&&<p role="alert">{error}</p>}{!loading&&!error&&!rows.length&&<p>새로운 출시 알림이 없어요. 프로젝트를 관심 등록하거나 불편함에 공감해보세요.</p>}{rows.map(r=><button className="release-related-item" key={r.id} onClick={async()=>{setOpen(false);onOpen(r);try{await readNotification(r.id);}catch{/* Keep the notification unread if saving fails. */}}}>{!r.read&&<span className="status release-live">NEW</span>} {r.title} 서비스가 출시됐어요!<small>{new Date(r.released_at).toLocaleDateString('ko-KR')}</small></button>)}</div></dialog></>;
}
