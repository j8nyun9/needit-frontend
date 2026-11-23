import useSessionPreference from '../hooks/useSessionPreference.js';
import ProjectDeleteButton from '../components/ProjectDeleteButton.jsx';
import ProjectIntroduction from '../components/ProjectIntroduction.jsx';
import useMyFilter from '../hooks/useMyFilter.js';
import FeedbackActions from '../components/FeedbackActions.jsx';
import React,{useEffect,useRef,useState} from 'react';
import Icon from '../components/common/Icon.jsx';
import {useAuth} from '../contexts/AuthContext.jsx';
import {createProject,getProject,saveProject,favoriteProject,postFeedback,releaseStatuses,serviceUrl,listNotifications,readNotification} from '../services/projects.js';
import {getProblem,apiRequest} from '../services/problems.js';
import './project-release.css';
import ServiceLaunchCard from '../components/ServiceLaunchCard.jsx';
import ProjectProgressEditor from '../components/ProjectProgressEditor.jsx';
import ProjectFeedbackReaction from '../components/ProjectFeedbackReaction.jsx';
import {isLinkedProject, projectDate, projectDisplayStatus, projectStatusClass} from '../utils/projectPresentation.js';
import ServiceUnpublishButton from '../components/ServiceUnpublishButton.jsx';

export function ServiceLink({project}){
 const url=serviceUrl(project.deployment_url);
 return project.status==='서비스 운영 중'&&url?<a className="button primary" href={url} target="_blank" rel="noopener noreferrer">서비스 사용하기 ↗</a>:null;
}
export function RelatedServices({problem,projects=[],onProject}){
 const related=projects.filter(p=>p.status==='서비스 운영 중'&&p.problem_ids?.some(id=>String(id)===String(problem.id)));
 if(!related.length)return null;
 return <section className="release-related" aria-label="이 불편함을 해결한 서비스"><h2>이 불편함을 해결한 서비스가 출시됐어요</h2><div className="release-related-links">{related.map(p=><ServiceLink key={p.id} project={p}/>)}</div></section>;
}
function ProblemProjectCount({problem}) {
 const count=problem.project_count;
 if(!Number.isInteger(count)||count<0)return null;
 return <span className="status developing wp-project-count">연결된 프로젝트 {count}개</span>;
}

export function ProblemProjectLinks({problem,onOpenProject}) {
 const [selectedProject,setSelectedProject]=useState(null);
 const [open,setOpen]=useState(false);const [rows,setRows]=useState([]);const [loading,setLoading]=useState(false);const [error,setError]=useState('');const [retry,setRetry]=useState(0);const dialog=useRef(null);const trigger=useRef(null);
 useEffect(()=>{if(dialog.current)dialog.current.scrollTop=0;},[selectedProject?.id]);
 useEffect(()=>{setOpen(false);setRows([]);setSelectedProject(null);},[problem.id]);
 useEffect(()=>{if(open)dialog.current?.showModal();else dialog.current?.close();},[open]);
 useEffect(()=>{if(!open)return;const controller=new AbortController();setLoading(true);setError('');setRows([]);apiRequest('/projects?related_problem_id='+encodeURIComponent(problem.id),{signal:controller.signal}).then(data=>{if(!Array.isArray(data))throw new Error('프로젝트 목록을 확인하지 못했어요.');if(!controller.signal.aborted)setRows(data);}).catch(e=>{if(!controller.signal.aborted)setError(e.message);}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});return()=>controller.abort();},[open,problem.id,retry]);
 function close(){setSelectedProject(null);setOpen(false);trigger.current?.focus();}
 return <div className="wp-project-links"><ProblemProjectCount problem={problem}/><button ref={trigger} className="button primary" type="button" onClick={()=>{setSelectedProject(null);setOpen(true);}}>연결된 프로젝트 보기</button>
 <dialog ref={dialog} className="linked-project-dialog" aria-labelledby={'linked-project-title-'+problem.id} onCancel={close} onClick={e=>{if(e.target===e.currentTarget)close();}}>
  <div className="linked-project-dialog-header"><h2 id={'linked-project-title-'+problem.id}>연결된 프로젝트</h2><button type="button" className="icon-button" aria-label="닫기" onClick={close}><Icon name="close" size={20}/></button></div>
  <div className="linked-project-dialog-body">{selectedProject?<ProjectDetailPage key={selectedProject.id} onDeleted={id=>{setRows(previous=>previous.filter(p=>String(p.id)!==String(id)));setSelectedProject(null);}} project={selectedProject} backLabel="연결된 프로젝트 목록으로" onBack={()=>setSelectedProject(null)} onIssues={close} onIssue={close} onUpdate={saved=>{setSelectedProject(previous=>({...previous,...saved}));setRows(previous=>previous.map(p=>String(p.id)===String(saved.id)?{...p,...saved}:p));}}/>:<><p className="linked-project-source">#{problem.id} {problem.title}</p>
   {loading?<p role="status">프로젝트를 불러오는 중이에요.</p>:error?<div role="alert"><p>{error}</p><button className="button outline" type="button" onClick={()=>setRetry(n=>n+1)}>다시 시도</button></div>:rows.length?<div className="wp-project-grid linked-project-cards">{rows.map(p=><article className="wp-box release-directory-card" key={p.id}><div className="wp-box-body"><div className="release-card-meta"><div className="release-card-heading"><Icon name="folder" size={22}/><h3><button type="button" className="release-card-title-link" onClick={()=>setSelectedProject(p)}>{p.title}</button></h3></div><span className={'status '+projectStatusClass(projectDisplayStatus(p))}>{projectDisplayStatus(p)}</span></div><p className="wp-demo"><strong className="release-content-label">시작 문제</strong>{problem.title}</p><div className="release-directory-note"><strong className="release-content-label">프로젝트 설명 · 주요 기능</strong>{Array.isArray(p.features)&&p.features.some(f=>typeof f==='string'&&f.trim())?<ul className="release-card-features">{p.features.filter(f=>typeof f==='string'&&f.trim()).map((f,i)=><li key={i}>{f}</li>)}</ul>:<p className="wp-demo">등록된 주요 기능이 없어요.</p>}</div><div className="release-card-footer"><p className="wp-demo">개발 완료 예정일: {p.expected_completion_date||'미정'}</p></div></div></article>)}</div>:<p>아직 연결된 프로젝트가 없어요.</p>}
  </>} </div>
 </dialog></div>;
}

export function ProjectsPage({projects,problems,onOpen,onCreated,projectToday}){
 const [status,setStatus]=useSessionPreference('needit-projects:status','전체',['전체',...releaseStatuses]);
 const {user,requireLogin}=useAuth();
 const [onlyMine,setOnlyMine]=useMyFilter(user?.id,'projects');
 const cards=projects.map(project=>{
  
  return {project,status:projectDisplayStatus(project)};
 });
 const rows=cards.filter(card=>(!onlyMine||(Boolean(user)&&card.project.can_edit===true))&&(status==='전체'||card.status===status));
 const filters=['전체',...releaseStatuses];
 return <div className="wp-page release-directory">
  <p className="code-comment">// FROM ISSUE TO SERVICE</p>
  <h1>함께 만드는 <span>프로젝트</span></h1>
  <p className="release-directory-note">학생들의 불편함에서 시작된 서비스를 만나보세요.</p>
  <div className="release-filters" role="group" aria-label="프로젝트 상태 필터">
   <button type="button" className={'my-filter-toggle'+(onlyMine?' is-on':'')} aria-pressed={onlyMine} onClick={()=>{if(onlyMine)setOnlyMine(false);else if(requireLogin())setOnlyMine(true);}}><span>My</span><span className="my-filter-switch" aria-hidden="true"/></button>
   {filters.map(option=><button type="button" key={option} className={'button '+(option===status?'primary':'outline')}
    aria-pressed={option===status} onClick={()=>setStatus(option)}>{option}</button>)}
  </div>
  <div className="release-directory-summary"><h2>프로젝트 <span>{rows.length}개</span></h2>
   <p>상단 검색창에서 제목이나 설명으로 검색할 수 있어요.</p></div>
  <div className="wp-project-grid">
   {rows.map(({project,status:label})=>{
    const issue=problems.find(problem=>isLinkedProject(project,problem));
    return <article className="wp-box release-directory-card" key={project.id}>
     <div className="wp-box-body">
      <div className="release-card-meta"><div className="release-card-heading"><Icon name="folder" size={22}/><h3><button type="button" className="release-card-title-link" onClick={()=>onOpen(project)}>{project.title}</button></h3></div><div className="release-card-status-actions"><span className={'status '+projectStatusClass(label)}>{label}</span></div></div>
      
      {issue&&<p className="wp-demo"><strong className="release-content-label">시작 문제</strong>{issue.title}</p>}
      <div className="release-directory-note"><strong className="release-content-label">프로젝트 설명 · 주요 기능</strong>{Array.isArray(project.features)&&project.features.some(f=>typeof f==='string'&&f.trim())?<ul className="release-card-features">{project.features.filter(f=>typeof f==='string'&&f.trim()).map((feature,index)=><li key={index}>{feature}</li>)}</ul>:<p className="wp-demo">등록된 주요 기능이 없어요.</p>}</div>
      <div className="release-card-bottom"><div className="release-card-footer">
       <p className="wp-demo">개발 완료 예정일: {project.expected_completion_date||'미정'}</p>

      </div>
     </div>
    </div></article>;
   })}
  </div>
  {!rows.length&&<p className="empty">{status==='전체'?'아직 표시할 프로젝트가 없어요.':'해당 상태의 프로젝트가 없어요.'}</p>}
 </div>;
}



export function ProjectCreatePage({ problem, onCancel, onCreated, onProblemUpdate, onOpenProject }) {
 const plan=problem.ai_plan;
 const details=plan.hackathonPlan;
 const [draft,setDraft]=useState(()=>({
  title: (details?.projectName?.trim() || plan.title?.trim() || problem.title).slice(0,100),
  description: typeof details?.solution==='string' ? details.solution.trim() : '',
  features: (plan.recommended_features || details?.features || []).join('\n'),
  expected_completion_date: '',
  release_status: releaseStatuses[0],
  deployment_url: '',
 }));
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [existingProject,setExistingProject]=useState(null);


 const request=useRef(null);
 useEffect(()=>()=>request.current?.abort(),[]);
 const features=draft.features.split(/\r?\n/).map(line=>line.trim()).filter(Boolean);
 const invalidFeatures=features.length>10||features.some(line=>line.length>250);
 const today=projectDate();
 const invalidDate=!draft.expected_completion_date||draft.expected_completion_date<today;
 const change=event=>setDraft(previous=>({...previous,[event.target.name]:event.target.value}));

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
  if(plan.swCategory==='difficult'){setError('소프트웨어만으로 해결하기 어려운 불편함은 채택할 수 없어요.');return;}
  if(existingProject||invalidFeatures||invalidDate||!draft.title.trim()||!draft.description.trim())return;
  run(async signal=>{
   try{
    const project=await createProject({
          title:draft.title.trim(),description:draft.description.trim(),features,problem_id:problem.id,release_status:draft.release_status,...(draft.release_status===releaseStatuses[3]?{deployment_url:draft.deployment_url}:{}),
     ...(draft.expected_completion_date && {
      expected_completion_date: draft.expected_completion_date,     }),
    },signal);
    if(!signal.aborted)onCreated(project,problem.id);
   }catch(error){
    if(signal.aborted)return;
    if(error.status===409&&error.project){setExistingProject(error.project);setError(error.message);return;}
    throw error;
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
    <label>프로젝트 상태<select name="release_status" value={draft.release_status} onChange={change}>{releaseStatuses.map(s=><option key={s}>{s}</option>)}</select></label>{draft.release_status===releaseStatuses[3]&&<label>서비스 주소<input type="url" name="deployment_url" required value={draft.deployment_url} onChange={change} placeholder="https://..."/></label>}<label>개발 완료 예정일 (필수)<input type="date" name="expected_completion_date" required
      min={today} value={draft.expected_completion_date} onChange={change} /></label>
    {invalidDate&&<p className="wp-demo">개발 완료 예정일을 오늘 또는 이후 날짜로 선택해주세요.</p>}
    {invalidFeatures&&<p className="release-error" role="alert">주요 기능은 10개까지, 한 줄에 250자까지 입력할 수 있어요.</p>}

    {error&&<p className="release-error" role="alert">{error}</p>}
    <div className="release-actions">
     {existingProject?<button className="button primary" type="button" onClick={()=>onOpenProject(existingProject)}>내 프로젝트 보기</button>:<button className="button primary" type="submit" disabled={plan.swCategory==='difficult'||invalidFeatures||invalidDate||!draft.title.trim()||!draft.description.trim()}>{busy?'등록 중…':'프로젝트 등록하기'}</button>}
     <button className="button outline" type="button" onClick={onCancel}>취소</button>
    </div>
   </fieldset>
  </form>
 </div>;
}

function PublicationEditor({project,onSaved,onCancel}){
 const [data,setData]=useState({release_status:releaseStatuses[3],deployment_url:project.deployment_url||'',usage_guide:project.usage_guide||''});
 const [busy,setBusy]=useState(false);const [error,setError]=useState('');const lock=useRef(false);
 const change=e=>setData({...data,[e.target.name]:e.target.value});
 return <form className="release-editor" onSubmit={async e=>{e.preventDefault();if(lock.current)return;lock.current=true;setBusy(true);setError('');try{onSaved(await saveProject(project.id,data));}catch(e){setError(e.message);}finally{lock.current=false;setBusy(false);}}}><h2>프로젝트 공개 정보 수정</h2><fieldset disabled={busy}><label>서비스 상태<select name="release_status" value={data.release_status} onChange={change}>{releaseStatuses.map(s=><option key={s}>{s}</option>)}</select></label><label>배포된 서비스 주소<input name="deployment_url" type="url" placeholder="https://..." value={data.deployment_url} onChange={change} maxLength={2000} required={data.release_status==='서비스 운영 중'}/></label><label>사용 방법<textarea name="usage_guide" rows={5} value={data.usage_guide} onChange={change} maxLength={5000} placeholder="서비스를 사용하는 방법과 로그인 필요 여부를 알려주세요."/></label><p className="wp-demo">운영 중으로 변경하면 관심 등록한 사용자와 관련 불편함에 공감한 사용자에게 출시 알림이 표시돼요.</p><div className="release-actions"><button className="button primary" type="submit">{busy?'저장 중…':'저장하기'}</button><button className="button outline" type="button" onClick={onCancel}>취소</button></div></fieldset>{error&&<p role="alert" className="release-error">{error}</p>}</form>;
}
export function ProjectDetailPage({project:initial,onBack,onIssues,onIssue,onUpdate,backLabel,projectToday,startEditing=false,onDeleted}){
 const {user,requireLogin}=useAuth();const [project,setProject]=useState(initial);const [loading,setLoading]=useState(true);const [error,setError]=useState('');const [retry,setRetry]=useState(0);const [editing,setEditing]=useState(false);const [tab,setTab]=useSessionPreference('needit-project-detail:'+initial.id+':'+String(user?.id||'guest'),'소개',['소개','관련 불편함','후기·오류 제보']);const [content,setContent]=useState('');const [kind,setKind]=useState('review');const [busy,setBusy]=useState(false);const lock=useRef(false);
 useEffect(()=>{const c=new AbortController();setLoading(true);setError('');setEditing(false);getProject(initial.id,c.signal).then(p=>{setProject(p);setEditing(Boolean(startEditing&&p.can_edit));}).catch(e=>{if(!c.signal.aborted)setError(e.message);}).finally(()=>{if(!c.signal.aborted)setLoading(false);});return()=>c.abort();},[initial.id,user?.id,retry,startEditing]);
 function update(p){setProject(prev=>({...prev,...p}));onUpdate?.(p);}
 async function action(fn){if(!requireLogin()||lock.current)return;lock.current=true;setBusy(true);setError('');try{await fn();}catch(e){setError(e.message);}finally{lock.current=false;setBusy(false);}}
 
 const statusLabel=projectDisplayStatus(project);
 const isOwnProject=Boolean(user && !loading && !error && project.can_edit);
 const canManage=isOwnProject;
 const canFeedback=project.status===releaseStatuses[3];
 const launched=project.status==='서비스 운영 중'&&Boolean(serviceUrl(project.deployment_url));
 return <div className="wp-page"><button className="wp-back" onClick={onBack}>← {backLabel||'프로젝트 목록으로'}</button>{loading?<p role="status">프로젝트를 불러오는 중이에요…</p>:<><p className="code-comment">// 학생의 불편함에서 시작된 프로젝트</p><div className="release-title"><h1>{project.title}</h1>{isOwnProject&&<span className="status release-owner-badge">내 프로젝트</span>}<span className={'status '+projectStatusClass(statusLabel)}>{statusLabel}</span></div><ServiceLaunchCard project={project}/><div className="release-actions">{launched&&<button type="button" className="button outline" onClick={()=>setTab('후기·오류 제보')}>이용 의견 남기기</button>}<button className="button outline" disabled={busy} aria-pressed={Boolean(project.interested)} onClick={()=>action(async()=>{const row=await favoriteProject(project.id,!project.interested);update(row.id?row:{...project,...row});})}>{project.interested?'♥ 관심 등록됨':'♡ 관심 등록'}</button>{canManage&&<button className="button outline" onClick={()=>setEditing(!editing)}>{project.status==='서비스 운영 중'?'서비스 공개 정보 수정':'완성한 서비스 등록'}</button>}{isOwnProject&&<ProjectDeleteButton project={project} onDeleted={id=>{onDeleted?.(id);onBack?.();}} triggerClassName="button outline project-detail-delete"/>}{canManage&&<ServiceUnpublishButton project={project} onUnpublished={saved=>{update(saved);setEditing(false);}}/>}</div>{editing&&canManage&&<PublicationEditor project={project} onCancel={()=>setEditing(false)} onSaved={p=>{update(p);setEditing(false);}}/>}<div className="wp-project-detail project-detail-aligned"><div><div className="wp-detail-tabs">{['소개','관련 불편함','후기·오류 제보'].map(t=><button key={t} className={tab===t?'selected':''} onClick={()=>setTab(t)}>{t}</button>)}</div>{tab==='소개'?<ProjectIntroduction key={String(project.id)+String(user?.id)} project={project} canEdit={isOwnProject} onSaved={update}/>:tab==='관련 불편함'?<section className="wp-box"><h2>이 프로젝트가 해결하는 불편함</h2><div className="wp-box-body"><div className="release-related-browse-row"><div className="release-related-browse-list">{project.related_problems?.map(p=><button className="release-related-item" key={p.id} onClick={()=>onIssue(p)}>#{p.id} {p.title}</button>)}{!project.related_problems?.length&&<p>연결된 불편함이 없어요.</p>}</div><button className="button outline" onClick={onIssues}>불편함 탐색하기</button></div></div></section>:<section className="wp-box"><h2>사용 후기 · 오류 제보</h2><div className="wp-box-body">{!canFeedback&&<p className="wp-demo" role="status">프로젝트가 완료되면 피드백을 작성할 수 있어요. (서비스 운영 중)</p>}{canFeedback&&<form onSubmit={e=>{e.preventDefault();action(async()=>{const row=await postFeedback(project.id,{kind,content});setProject(p=>({...p,feedback:[row,...(p.feedback||[])]}));setContent('');});}}><fieldset disabled={busy}><label>의견 종류<select value={kind} onChange={e=>setKind(e.target.value)} aria-label="의견 종류"><option value="review">사용 후기</option><option value="bug">오류 제보</option></select></label><textarea aria-label="후기 또는 오류 내용" rows={4} maxLength={1000} required value={content} onChange={e=>setContent(e.target.value)} placeholder="도움이 된 점이나 오류가 발생한 상황을 알려주세요."/><button className="button primary" type="submit">{busy?'등록 중…':'의견 등록'}</button></fieldset></form>}{project.feedback?.map(f=><article className="release-feedback wp-comment" key={f.id}><Icon name="user" size={28}/><div className="feedback-comment-body"><div className="wp-comment-meta"><strong>{f.author_name}</strong><time className="wp-comment-time" dateTime={f.created_at}>{new Date(f.created_at).toLocaleString('ko-KR',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false})}</time><div className="feedback-kind-reaction"><span className="feedback-kind">{f.kind==='bug'?'오류 제보':'사용 후기'}</span>{launched&&<ProjectFeedbackReaction key={user?.id??'guest'} projectId={project.id} feedbackId={f.id} feedback={f} userId={user?.id}/>}</div></div><p className="release-copy">{f.content}</p><FeedbackActions key={String(f.id)+String(user?.id)} feedback={f} projectId={project.id} onSaved={row=>setProject(p=>({...p,feedback:p.feedback.map(item=>item.id===row.id?{...item,...row}:item)}))} onDeleted={id=>setProject(p=>({...p,feedback:p.feedback.filter(item=>item.id!==id)}))}/></div></article>)}{canFeedback&&!project.feedback?.length&&<p className="wp-demo">첫 번째 의견을 남겨주세요.</p>}</div></section>}</div><aside><section className="wp-box"><h2>프로젝트 진행 현황</h2><div className="wp-box-body"><ol className="release-stages">{releaseStatuses.map(s=><li className={'release-stage '+projectStatusClass(s)+(s===statusLabel?' reached':'')+(s===statusLabel?' current':'')} key={s}>{s}</li>)}</ol>{project.expected_completion_date&&<p className="wp-demo">개발 완료 예정일 <time dateTime={project.expected_completion_date}>{project.expected_completion_date}</time></p>}{canManage&&<ProjectProgressEditor project={project} today={projectToday} onSaved={update}/>}</div></section><section className="wp-box"><h2>프로젝트 기본 정보</h2><div className="wp-box-body"><p>개발 팀: {project.team_name||'미등록'}</p>{serviceUrl(project.github_url)&&<p><a href={serviceUrl(project.github_url)} target="_blank" rel="noopener noreferrer">GitHub ↗</a></p>}{!serviceUrl(project.deployment_url)&&<p className="wp-demo">배포 주소 등록 전이에요.</p>}{project.released_at&&<p className="wp-demo">출시일 {new Date(project.released_at).toLocaleDateString('ko-KR')}</p>}</div></section></aside></div></>}{error&&<div className="release-error" role="alert">{error}<button className="button outline" onClick={()=>setRetry(n=>n+1)}>다시 불러오기</button></div>}</div>;
}
export function ProjectNotifications({onOpen}){
 const {user,requireLogin}=useAuth();const [open,setOpen]=useState(false);const [rows,setRows]=useState([]);const [error,setError]=useState('');const [loading,setLoading]=useState(false);const dialog=useRef(null);
 useEffect(()=>{setOpen(false);setRows([]);},[user?.id]);
 useEffect(()=>{if(!open)return;const c=new AbortController();setLoading(true);setError('');listNotifications(c.signal).then(setRows).catch(e=>{if(!c.signal.aborted)setError(e.message);}).finally(()=>{if(!c.signal.aborted)setLoading(false);});return()=>c.abort();},[open,user?.id]);
 useEffect(()=>{if(open)dialog.current?.showModal();else dialog.current?.close();},[open]);
 return <><button className="icon-button" aria-label="출시 알림" onClick={()=>{if(requireLogin())setOpen(true);}}><Icon name="bell" size={27}/></button><dialog ref={dialog} onCancel={()=>setOpen(false)} onClick={e=>{if(e.target===e.currentTarget)setOpen(false);}} aria-label="서비스 출시 알림"><div className="dialog-header"><h2>서비스 출시 알림</h2><button className="icon-button" aria-label="닫기" onClick={()=>setOpen(false)}><Icon name="close"/></button></div><div className="release-notifications">{loading&&<p role="status">알림을 불러오는 중…</p>}{error&&<p role="alert">{error}</p>}{!loading&&!error&&!rows.length&&<p>새로운 출시 알림이 없어요. 프로젝트를 관심 등록하거나 불편함에 공감해보세요.</p>}{rows.map(r=><button className="release-related-item" key={r.id} onClick={async()=>{setOpen(false);onOpen(r);try{await readNotification(r.id);}catch{/* Keep the notification unread if saving fails. */}}}>{!r.read&&<span className="status release-live">NEW</span>} {r.title} 서비스가 출시됐어요!<small>{new Date(r.released_at).toLocaleDateString('ko-KR')}</small></button>)}</div></dialog></>;
}
