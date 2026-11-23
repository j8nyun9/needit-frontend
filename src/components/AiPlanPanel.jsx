import PlanDocument from './PlanDocument.jsx';
import {notionPlanMarkdown,copyNotionPlan} from '../utils/notionPlan.js';
import React,{useEffect,useRef,useState} from 'react';
import Icon from './common/Icon.jsx';
import {useAuth} from '../contexts/AuthContext.jsx';
import {getProblem,generateProblemPlan,apiRequest} from '../services/problems.js';
import './ai-plan.css';
const swLabels={direct:'SW로 직접 해결 가능',partial:'SW로 부분 해결 가능',difficult:'SW만으로 해결하기 어려움'};
export default function AiPlanPanel({problem,onUpdate,onCreateProject,onOpenProject,detailLoaded=false}){
 const {user,requireLogin}=useAuth();
 const [ownProject,setOwnProject]=useState(null);const [checkingOwn,setCheckingOwn]=useState(false);const [ownError,setOwnError]=useState('');
 useEffect(()=>{setOwnProject(null);setOwnError('');if(!user){setCheckingOwn(false);return;}const c=new AbortController();setCheckingOwn(true);apiRequest('/projects?related_problem_id='+encodeURIComponent(problem.id),{signal:c.signal}).then(rows=>{if(!Array.isArray(rows))throw new Error('프로젝트 목록을 확인하지 못했어요.');if(!c.signal.aborted)setOwnProject(rows.find(p=>p.can_edit===true)||null);}).catch(e=>{if(!c.signal.aborted)setOwnError(e.message);}).finally(()=>{if(!c.signal.aborted)setCheckingOwn(false);});return()=>c.abort();},[problem.id,user?.id]);
 const identity=useRef(user?.id);identity.current=user?.id;
 const [row,setRow]=useState(problem);const[reading,setReading]=useState(false);const[busy,setBusy]=useState(false);const[error,setError]=useState('');const[retryAt,setRetryAt]=useState(0);const[now,setNow]=useState(Date.now());const[refresh,setRefresh]=useState(0);const active=useRef(true);const request=useRef(null);const locked=useRef(false);const update=useRef(onUpdate);update.current=onUpdate;
 useEffect(()=>{active.current=true;return()=>{active.current=false;request.current?.abort();};},[]);
 useEffect(()=>{
  if(detailLoaded&&refresh===0)return;
  request.current?.abort();setRow({...problem,ai_plan:null,ai_plan_access:false});setError('');
  if(!user){setReading(false);return;}
  const controller=new AbortController();
  setReading(true);
  getProblem(problem.id,controller.signal).then(value=>{
   if(!controller.signal.aborted){setRow(value);update.current?.(value);}
  }).catch(e=>{if(!controller.signal.aborted)setError(e.message);})
   .finally(()=>{if(!controller.signal.aborted)setReading(false);});
  return()=>controller.abort();
 },[problem.id,refresh,user?.id,detailLoaded]);
 useEffect(()=>{if(retryAt<=Date.now())return;const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer);},[retryAt]);
 const seconds=Math.max(0,Math.ceil((retryAt-now)/1000));
 const plan=user&&row.ai_plan_access&&String(row.ai_plan_owner_id)===String(user.id)?row.ai_plan:null;const details=plan?.hackathonPlan;
 const [copyStatus,setCopyStatus]=useState('');const [manualCopy,setManualCopy]=useState(false);
 const notionMarkdown=details?notionPlanMarkdown(row,plan):'';
 useEffect(()=>{setCopyStatus('');setManualCopy(false);},[notionMarkdown,user?.id]);
 async function copyForNotion(){try{await copyNotionPlan(notionMarkdown);setCopyStatus('기획안을 복사했어요.');setManualCopy(false);}catch{setManualCopy(true);setCopyStatus('아래 내용을 선택해 직접 복사해주세요.');}}

 async function generate(){if(!requireLogin())return;if(locked.current||seconds>0)return;locked.current=true;setBusy(true);setError('');request.current=new AbortController();const owner=user.id;try{const result=await generateProblemPlan(problem.id,request.current.signal);if(!active.current||identity.current!==owner)return;setRow(result);update.current?.(result);setRetryAt(0);}catch(e){if(!active.current||identity.current!==owner)return;setError(e.message);if(e.retryAfter){setRetryAt(Date.now()+e.retryAfter*1000);setNow(Date.now());}}finally{locked.current=false;if(active.current)setBusy(false);}}
 return <section className="ai-plan-panel" aria-labelledby={`ai-title-${problem.id}`}><header><div><h2 id={`ai-title-${problem.id}`}>AI 개발 기획안</h2></div></header><div className="ai-plan-body">{ownError&&<p className="ai-error" role="alert">채택 여부를 확인하지 못했어요. {ownError}</p>}{details&&<button type="button" className="ai-copy-icon" aria-label="기획안 복사" title="기획안 복사" disabled={busy||reading} onClick={copyForNotion}><Icon name="copy" size={18}/></button>}<p className="ai-issue-title">{row.title}</p><p className="ai-intro">실제 불편함을 바탕으로 해결 가능성과 해커톤 MVP를 구체화해요.</p><div className="ai-actions"><button type="button" className="button primary" disabled={busy||reading||seconds>0} onClick={generate}>{!user?'로그인하고 AI 기획안 생성':busy?'기획안 생성 중…':seconds>0?`${seconds}초 후 재생성 가능`:details?'AI 기획안 재생성':'AI 기획안 생성'}</button>{ownProject&&onOpenProject?<button type="button" className="button outline" onClick={()=>onOpenProject(ownProject)}>내 프로젝트 보기</button>:plan&&onCreateProject&&<button type="button" className="button primary" disabled={reading||busy||checkingOwn||Boolean(ownError)} onClick={()=>onCreateProject(row)}>{checkingOwn?'채택 여부 확인 중…':'불편함 채택하기'}</button>}</div>{!details&&<p className="ai-adoption-guide">AI 기획안을 만든 뒤 불편함을 채택할 수 있어요.</p>}<p className="ai-status" role="status">{busy?'분석에 최대 1분 정도 걸릴 수 있어요. 완료되면 결과가 DB에 저장돼요.':reading?'저장된 결과를 확인하고 있어요.':details?'내 계정에 저장된 기획안이에요. 재생성하면 내 기획안만 바뀌어요.':'이 계정에서 생성한 기획안이 없어요. 로그인 후 AI 기능을 사용하면 기획안을 볼 수 있어요.'}</p>{error&&<div className="ai-error" role="alert">{error}<p>기존 기획안이 있으면 그대로 유지돼요. 분석이 진행 중이거나 응답이 끊겼다면 잠시 후 저장된 결과를 조회해주세요.</p></div>}{details&&<div className="ai-notion-export"><p className="ai-status" role="status">{copyStatus}</p>{manualCopy&&<textarea aria-label="노션용 기획안" readOnly rows={12} value={notionMarkdown} onFocus={e=>e.target.select()}/>}</div>}{details?<PlanDocument markdown={notionMarkdown}/>:!reading&&!busy&&<div className="ai-empty"><Icon name="code" size={36}/><h3>이 불편함, 어떤 서비스로 만들 수 있을까요?</h3><p>해결 가능성 · 핵심 기능 · 기술 스택 · MVP 범위를 제안받아보세요.</p></div>}

  </div></section>;
}
export function AiPlanDialog({problem,onClose,onUpdate,onCreateProject,onOpenProject}){const ref=useRef(null);useEffect(()=>{ref.current?.showModal();},[]);return <dialog ref={ref} className="ai-plan-dialog" aria-label="AI 개발 기획안" onCancel={onClose} onClick={e=>{if(e.target===e.currentTarget)onClose();}}><div className="ai-dialog-toolbar"><span>needit / issue-{problem.id} / plan.md</span><button type="button" aria-label="기획안 닫기" onClick={onClose}><Icon name="close" size={20}/></button></div><AiPlanPanel key={problem.id} problem={problem} onUpdate={onUpdate} onCreateProject={onCreateProject} onOpenProject={onOpenProject}/></dialog>;}
