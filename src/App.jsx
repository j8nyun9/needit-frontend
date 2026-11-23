import AdaptiveSearchInput from './components/AdaptiveSearchInput.jsx';
import ResponsiveHeroArtwork from './components/ResponsiveHeroArtwork.jsx';
import React, { useEffect, useRef, useState } from 'react';
import Icon from './components/common/Icon.jsx';
import {AuthContext,LoginRequired} from './contexts/AuthContext.jsx';
import {listProblems,getProblem,createProblem,editProblem,problemEditingEnabled,setProblemLike} from './services/problems.js';
import {mergeSavedLikes} from './services/problemLikeState.js';
import ReportPage from './features/problems/components/ReportPage.jsx';
import MyPage from './pages/MyPage.jsx';
import {ProjectsPage,ProjectCreatePage,ProjectDetailPage,ProjectNotifications,ServiceLink} from './pages/ProjectReleasePages.jsx';
import {listProjects,releaseStatuses} from './services/projects.js';
import {projectDate, projectDisplayStatus, projectStatusClass} from './utils/projectPresentation.js';
import LoginPage from './pages/LoginPage.jsx';
import {currentUser,logout} from './services/auth.js';
import ReadmePage from './pages/ReadmePage.jsx';
import {ExplorePage,IssueDetailPage,extraIssues} from './pages/WorkspacePages.jsx';

const initialProblems = [
 {id:103,title:'강의실 콘센트가 부족해요',category:'시설',count:127},
 {id:101,title:'도서관 좌석 현황을 실시간으로 알고 싶어요',category:'도서관',count:98},
 {id:97,title:'학부 공지가 여러 곳에 흩어져 있어요',category:'학사·행정',count:85},
 {id:95,title:'빈 강의실을 한눈에 찾고 싶어요',category:'시설',count:72},
 {id:92,title:'팀 프로젝트 시간을 맞추기 어려워요',category:'학교생활',count:64},
];


const footerPages = ['홈','불편함 탐색','프로젝트','서비스 소개','마이페이지'];

export default function App(){
 const [headerVisible,setHeaderVisible]=useState(true);
 useEffect(()=>{
  const mobile=window.matchMedia('(max-width:800px)');
  let previous=Math.max(0,window.scrollY),travel=0,direction=0,frame;
  function update(){
   frame=null;
   const position=Math.max(0,window.scrollY),delta=position-previous;
   previous=position;
   if(!mobile.matches||position<24){travel=0;direction=0;setHeaderVisible(true);return;}
   const nextDirection=Math.sign(delta);
   if(!nextDirection)return;
   if(nextDirection!==direction){travel=0;direction=nextDirection;}
   travel+=Math.abs(delta);
   if(travel>=10){setHeaderVisible(direction<0);travel=0;}
  }
  function scroll(){if(frame==null)frame=requestAnimationFrame(update);}
  function reset(){previous=Math.max(0,window.scrollY);travel=0;direction=0;setHeaderVisible(true);}
  window.addEventListener('scroll',scroll,{passive:true});mobile.addEventListener('change',reset);
  return()=>{if(frame!=null)cancelAnimationFrame(frame);window.removeEventListener('scroll',scroll);mobile.removeEventListener('change',reset);};
 },[]);

 const [user,setUser]=useState(null);
 const [authLoading,setAuthLoading]=useState(true);
 function updateProfile(profile){setUser(previous=>previous?.id===profile.id?{...previous,name:profile.name}:previous);}
 const voter=useRef(user?.id);voter.current=user?.id;
 const voteRevision=useRef(0);const savedVotes=useRef(new Map());
 const deletedProblems=useRef(new Set());
 function handleProblemDeleted(id,stayOnMyPage=false){
  deletedProblems.current.add(String(id));savedVotes.current.delete(String(id));
  setProblems(prev=>prev.filter(p=>String(p.id)!==String(id)));
  setLiked(prev=>prev.filter(value=>String(value)!==String(id)));
  setProjects(prev=>prev.map(p=>({...p,problem_ids:p.problem_ids?.filter(value=>String(value)!==String(id))})));
  setPage(null);setTab(stayOnMyPage?'마이페이지':'불편함 탐색');setQuery('');setNotice('불편함을 삭제했어요.');
 }
 const [projects,setProjects]=useState([]);
 const [projectToday,setProjectToday]=useState(projectDate);
 useEffect(()=>{
  const refreshDate=()=>setProjectToday(projectDate());
  const timer=window.setInterval(refreshDate,30000);
  window.addEventListener('focus',refreshDate);
  document.addEventListener('visibilitychange',refreshDate);
  return ()=>{
   window.clearInterval(timer);
   window.removeEventListener('focus',refreshDate);
   document.removeEventListener('visibilitychange',refreshDate);
  };
 },[]);
 const [projectError,setProjectError]=useState('');
 const [projectReload,setProjectReload]=useState(0);
 useEffect(()=>{const c=new AbortController();setProjects([]);setProjectError('');listProjects(c.signal).then(setProjects).catch(e=>{if(!c.signal.aborted)setProjectError(e.message);});return()=>c.abort();},[user?.id,projectReload]);
 function updateProject(row){setProjects(prev=>prev.map(p=>String(p.id)===String(row.id)?{...p,...row}:p));}
 function openProject(row){setPageState(previous=>({type:'project',data:row,back:previous}));}
 function openProjectDraft(problem) {
  if(!requireLogin()||!problem.ai_plan_access||String(problem.ai_plan_owner_id)!==String(user.id)||
   !problem.ai_plan)return;
  setPageState({type:'project-draft',data:problem,accountId:user.id,back:page});
 }
 function finishProjectCreation(project,problemId) {
  setProjects(previous=>[project,...previous.filter(row=>String(row.id)!==String(project.id))]);
  setProblems(previous=>previous.map(row=>String(row.id)===String(problemId)?{...row,project_id:project.id}:row));
  openProject(project);
 }
 function handleProjectCreated(row){setProjects(previous=>[row,...previous.filter(p=>String(p.id)!==String(row.id))]);setPageState({type:'project',data:row});setNotice('서비스를 공개했어요. 이제 다른 사용자도 사용해볼 수 있어요.');}

 useEffect(()=>{const expired=()=>{setUser(null);setPageState({type:'login'});setNotice('로그인이 만료됐어요. 다시 로그인해주세요.');};window.addEventListener('needit-auth-expired',expired);return()=>window.removeEventListener('needit-auth-expired',expired);},[]);
 useEffect(()=>{let active=true;currentUser().then(value=>{if(active)setUser(value);}).catch(error=>{if(active)setNotice(error.message);}).finally(()=>{if(active)setAuthLoading(false);});return()=>{active=false;};},[]);
 async function signOut(){try{await logout();}catch{setNotice('서버 로그아웃을 확인하지 못했어요. 이 브라우저의 로그인 정보는 지웠어요.');}finally{setUser(null);setLiked([]);setProblems(prev=>prev.map(p=>({...p,mine:false})));setTab(footerPages[0]);setPage(null);}}
 const [initialIssuePage]=useState(()=>{
  const params=new URLSearchParams(window.location.search);
  const projectId=params.get('project');
  if(projectId&&/^\d+$/.test(projectId))return {type:'project',data:{id:projectId}};
  const id=params.get('issue');
  return id?{type:params.get('edit')==='1'?'problem-edit':'problem',data:{id}}:null;
 });
 const [tab,setTab]=useState(()=>{if(initialIssuePage)return initialIssuePage.type==='project'?footerPages[2]:footerPages[1];try{const saved=sessionStorage.getItem('needit-active-tab');return footerPages.includes(saved)?saved:footerPages[0];}catch{return footerPages[0];}});
 const [query,setQuery]=useState('');
 const [problems,setProblems]=useState([]);
 const [page,setPageState]=useState(initialIssuePage);
 useEffect(()=>{if(page?.type==='login')return;try{sessionStorage.setItem('needit-active-tab',page?.type==='profile'?footerPages[4]:tab);}catch{/* Navigation preference only. */}},[tab,page?.type]);
 function requireLogin(){if(user)return true;setNotice('로그인 후 사용할 수 있는 기능이에요.');setQuery('');setPageState({type:'login'});return false;}
 function setPage(value){if(typeof value==='function'){setPageState(value);return;}if(['report','profile'].includes(value?.type)&&!requireLogin())return;setPageState(value);}
 const editingProblem=page?.type==='problem-edit';
 const problemId=editingProblem||page?.type==='problem'?String(page.data.id):null;
 const problemRouteKey=problemId?JSON.stringify([problemId,editingProblem,user?.id]):null;
 const [issueDetail,setIssueDetail]=useState(null);
 const [issueRetry,setIssueRetry]=useState(0);
 useEffect(()=>{
  if(!problemId||authLoading)return;
  const controller=new AbortController();
  setIssueDetail(null);
  getProblem(problemId,controller.signal).then(problem=>{
   if(!controller.signal.aborted)setIssueDetail({key:problemRouteKey,problem});
  }).catch(error=>{
   if(!controller.signal.aborted)setIssueDetail({key:problemRouteKey,error});
  });
  return()=>controller.abort();
 },[problemId,problemRouteKey,authLoading,issueRetry]);
 const [loading,setLoading]=useState(true);
 const [apiError,setApiError]=useState('');
 const [reload,setReload]=useState(0);
 useEffect(()=>{
  const controller=new AbortController();const account=user?.id;const revision=voteRevision.current;
  setLoading(true);setProblems([]);setApiError('');
  listProblems(controller.signal).then(rows=>{
   if(controller.signal.aborted||voter.current!==account)return;
   const merged=mergeSavedLikes(rows,savedVotes.current,revision,account).filter(p=>!deletedProblems.current.has(String(p.id)));
   setProblems(merged);setLiked(merged.filter(p=>p.liked_by_me).map(p=>p.id));
  }).catch(error=>{if(!controller.signal.aborted)setApiError(error.message);}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});
  return()=>controller.abort();
 },[reload,user?.id]);
 function updateProblem(row){
  const id=String(row.id);
  setProblems(previous=>previous.map(problem=>String(problem.id)===id?{...problem,...row,mine:problem.mine,count:problem.count}:problem));
  setIssueDetail(previous=>previous?.problem&&String(previous.problem.id)===id
   ?{...previous,problem:{...previous.problem,...row}}:previous);
 }
 async function saveProblem(data){if(!requireLogin())throw new Error('로그인이 필요해요.');const p=await createProblem(data);setProblems(prev=>[{...p,mine:true},...prev.filter(item=>item.id!==p.id)]);setApiError('');setTab(footerPages[1]);setPage(null);setNotice('불편함을 DB에 등록했어요.');}
 useEffect(()=>{
  const url = new URL(window.location.href);
  if(problemId)url.searchParams.set('issue',problemId);
  else url.searchParams.delete('issue');
  if(page?.type==='project')url.searchParams.set('project',page.data.id);
  else url.searchParams.delete('project');
  if(editingProblem)url.searchParams.set('edit','1');
  else url.searchParams.delete('edit');
  if(url.href!==window.location.href)window.history.replaceState(window.history.state,'',url.href);
 },[problemId,editingProblem,page?.type,page?.data?.id]);
 const [liked,setLiked]=useState([]);
 const [dialog,setDialog]=useState(null);
 const [notice,setNotice]=useState('');
 const dialogRef=useRef(null);
 useEffect(()=>{ if(dialog) dialogRef.current?.showModal(); else dialogRef.current?.close(); },[dialog]);
 useEffect(()=>{if(!notice)return;const timer=setTimeout(()=>setNotice(''),3500);return()=>clearTimeout(timer);},[notice]);
 const filteredProblems=problems.filter(p=>(p.title+p.category).includes(query));
 const homeProblems=tab===footerPages[0]&&!query
  ? [...filteredProblems].sort((a,b)=>Number(b.count||0)-Number(a.count||0)||(Date.parse(b.created_at)||0)-(Date.parse(a.created_at)||0))
  : filteredProblems;
 const filteredProjects=projects.filter(p=>(p.title+p.description).includes(query)).map(project=>{
  
  return {project,status:projectDisplayStatus(project)};
 });
 const homeProjects=tab===footerPages[0]&&!query
  ? [...filteredProjects].sort((a,b)=>releaseStatuses.indexOf(b.status)-releaseStatuses.indexOf(a.status)||(Date.parse(b.project.created_at)||0)-(Date.parse(a.project.created_at)||0)).slice(0,3)
  : filteredProjects;
 const liking=useRef(new Set());
 async function toggleLike(id,currentLiked=liked.includes(id)){
  if(!requireLogin())return;
  const account=user.id;const key=`${account}:${id}`;
  if(liking.current.has(key))return;liking.current.add(key);
  try{
   const row=await setProblemLike(id,!currentLiked);
   if(voter.current!==account)return;
   savedVotes.current.set(String(id),{...row,userId:account,revision:++voteRevision.current});
   setLiked(prev=>row.liked_by_me?[...new Set([...prev,id])]:prev.filter(x=>x!==id));
   const vote={count:row.likes_count,likes_count:row.likes_count,liked_by_me:row.liked_by_me};
   setProblems(prev=>prev.map(p=>String(p.id)===String(id)?{...p,...vote}:p));
   setIssueDetail(previous=>previous?.problem&&String(previous.problem.id)===String(id)
    ?{...previous,problem:{...previous.problem,...vote}}:previous);
  }catch(e){if(voter.current===account)setNotice(e.message);}finally{liking.current.delete(key);}
 }

 function renderProblemRoute(){
  const backToExplore=()=>{setTab(footerPages[1]);setPage(null);};
  const detail=issueDetail?.key===problemRouteKey?issueDetail:null;
  if(authLoading||!detail)return <p className="wp-page" role="status">불편함을 불러오는 중이에요…</p>;
  if(detail.error)return <div className="wp-page">
   <p role="alert">{detail.error.status===404?'해당 불편함을 찾을 수 없어요.':detail.error.message}</p>
   {detail.error.status!==404&&<button type="button" className="button outline" onClick={()=>setIssueRetry(value=>value+1)}>다시 시도</button>}
   <button type="button" className="button outline" onClick={backToExplore}>불편함 탐색으로</button>
  </div>;
  const problem=detail.problem;
  const canEdit=Boolean(user)&&problem.mine===true&&problem.can_edit!==false;
  const returnToDetail=()=>setPage({type:'problem',data:{id:problem.id}});
  if(editingProblem){
   if(!problemEditingEnabled||!canEdit)return <div className="wp-page">
    <p role="alert">{problemEditingEnabled?'작성자만 이 불편함을 수정할 수 있어요.':'불편함 수정 기능을 준비 중이에요.'}</p>
    <button type="button" className="button outline" onClick={returnToDetail}>불편함 상세로 돌아가기</button>
   </div>;
   return <ReportPage key={problemRouteKey} initialProblem={problem} onBack={returnToDetail} onSubmit={async draft=>{
    const account=user.id;
    const updated=await editProblem(problem.id,draft);
    if(voter.current!==account)return;
    updateProblem(updated);
    setReload(revision=>revision+1);
    returnToDetail();
    setNotice('변경사항을 저장했어요.');
   }}/>;
  }
  const isLiked=Boolean(problem.liked_by_me);
  return <IssueDetailPage key={problemRouteKey} problem={problem}
   liked={isLiked} onLike={()=>toggleLike(problem.id,isLiked)} onBack={backToExplore}
   onEdit={problemEditingEnabled&&canEdit?()=>setPage({type:'problem-edit',data:{id:problem.id}}):undefined}
   onDeleted={handleProblemDeleted} projects={projects} onOpenProject={openProject}
   onCreateProject={openProjectDraft} onProblemUpdate={updateProblem}
   onProject={()=>{setPage(null);setTab(footerPages[2]);}}/>;
 }

 return <AuthContext.Provider value={{user,requireLogin}}>
  <header className={"header"+(headerVisible?"":" header-scroll-hidden")}><div className="header-inner">
   <a className="brand" href="#" onClick={e=>{e.preventDefault();setPage(null);setTab('홈');setQuery('');}} aria-label="NEEDIT 홈"><Icon name="code" size={34}/><span>NEEDIT</span></a>
   <nav aria-label="주 메뉴">{['홈','불편함 탐색','프로젝트','서비스 소개','마이페이지'].map(item=><button key={item} className={tab===item?'nav-item active':'nav-item'} aria-current={tab===item?'page':undefined} onClick={()=>{setPage(null);setTab(item);}}>{item}</button>)}</nav>
   <div className="header-tools"><label className="search"><Icon name="search" size={21}/><AdaptiveSearchInput aria-label="불편함이나 프로젝트 검색" value={query} onChange={e=>setQuery(e.target.value)}/>{query&&<button aria-label="검색 지우기" onClick={()=>setQuery('')}><Icon name="close" size={16}/></button>}</label><div className="header-account"><ProjectNotifications onOpen={openProject}/><button className="header-login" onClick={()=>user?signOut():setPage({type:'login'})}>{user?'로그아웃':'로그인'}</button>{user&&<span className="header-user">{user.name}님</span>}<button className="avatar" aria-label="내 프로필" onClick={()=>setPage({type:'profile'})}><Icon name="user" size={23}/></button></div></div>
  </div></header>
  <main>
   {projectError&&<div className="api-banner error" role="alert">{projectError}<button onClick={()=>setProjectReload(n=>n+1)}>프로젝트 다시 불러오기</button></div>}

   {loading&&<p className="api-banner" role="status">불편함 목록을 불러오는 중이에요…</p>}
   {apiError&&<div className="api-banner error" role="alert">{apiError}<button onClick={()=>setReload(n=>n+1)}>다시 시도</button></div>}
   {authLoading&&(page?.type==='profile'||tab===footerPages[4])?<p className="wp-page" role="status">로그인 정보를 불러오는 중이에요…</p>:!user&&page?.type!=='login'&&(page?.type==='profile'||tab===footerPages[4])?<LoginRequired onLogin={requireLogin}/>:problemId?renderProblemRoute():page?.type==='login'?<LoginPage onLogin={value=>{setUser(value);setQuery('');setTab(footerPages[4]);setPage(null);setNotice(`${value.name}님, 환영해요!`);}} onBack={()=>{setPage(null);setTab(footerPages[0]);}}/>:(page?.type==='profile'||(tab==='마이페이지'&&!page))?<MyPage onProblemDeleted={id=>handleProblemDeleted(id,true)} onProjectDeleted={id=>{setProjects(previous=>previous.filter(p=>String(p.id)!==String(id)));setProjectReload(n=>n+1);setReload(n=>n+1);}} projectToday={projectToday} onProfileUpdate={updateProfile} onExplore={()=>{setQuery('');setPage(null);setTab(footerPages[1]);}} onBrowseProjects={()=>{setQuery('');setPage(null);setTab(footerPages[2]);}} key={user?.id||'guest'} user={user} problems={problems} projects={projects} liked={liked} onIssue={p=>setPage({type:'problem',data:p})} onProject={(p,options)=>setPage({type:'project',data:p,edit:Boolean(options?.edit),fromMyPage:true})} onReport={()=>setPage({type:'report'})}/>:page?.type==='report'?<ReportPage onBack={()=>setPage(null)} onSubmit={saveProblem}/>:page?.type==='project-draft'?
   (user?.id===page.accountId?<ProjectCreatePage key={page.data.id} problem={page.data} onCancel={()=>setPageState(page.back)}
     onCreated={finishProjectCreation} onProblemUpdate={updateProblem} onOpenProject={openProject}/>:<LoginRequired onLogin={requireLogin}/>)
   :page?.type==='project'?<ProjectDetailPage onDeleted={id=>{setProjects(previous=>previous.filter(p=>String(p.id)!==String(id)));setProjectReload(n=>n+1);setReload(n=>n+1);}} startEditing={page.edit} projectToday={projectToday} key={page.data.id} project={projects.find(p=>String(p.id)===String(page.data.id))||page.data} onUpdate={updateProject} onIssue={p=>setPage({type:"problem",data:problems.find(row=>String(row.id)===String(p.id))||p})} backLabel={page.back?.type==='problem' ? '불편함 상세로 돌아가기' : undefined} onBack={()=>{if(page.fromMyPage){setPage(null);setTab(footerPages[4]);}else setPageState(page.back??null);}} onIssues={()=>{setPage(null);setTab(footerPages[1]);}}/>:tab===footerPages[1]?<ExplorePage onCreateProject={openProjectDraft} onOpenProject={openProject} onProblemUpdate={updateProblem} problems={problems} liked={liked} query={query} onLike={toggleLike} onOpen={p=>setPage({type:'problem',data:p})} onReport={()=>setPage({type:'report'})}/>:tab===footerPages[2]&&!query?<ProjectsPage projectToday={projectToday} onCreated={handleProjectCreated} problems={problems} projects={projects} onOpen={p=>setPage({type:'project',data:p})}/>:<>
   {tab==='서비스 소개'&&!query?<ReadmePage onReport={()=>setPage({type:'report'})} onProjects={()=>setTab(footerPages[2])}/>:<>
   {tab==='홈'&&!query&&<>
    <section className="hero" aria-labelledby="hero-title"><div className="hero-copy"><div className="hero-line-numbers" aria-hidden="true">{Array.from({length:8},(_,i)=><span key={i}>{i+1}</span>)}</div><div className="hero-line-numbers" aria-hidden="true">{[1,2,3,4,5,6,7,8].map(number=><span key={number}>{number}</span>)}</div><p className="code-comment"><span className="numbered-line" data-line="1">// NEEDIT</span><span className="numbered-line" data-line="2">// 학생들의 불편함을 실제 서비스로 연결하는 플랫폼</span></p><h1 id="hero-title"><span className="numbered-line" data-line="3">당신의 불편함이</span><span className="numbered-line" data-line="4"><span>개발</span>로 해결되는 곳, <span>NEEDIT</span><span className="hero-caret" aria-hidden="true"/></span></h1><p className="hero-description"><span className="numbered-line" data-line="5">학교생활 속 불편함을 제보하고,</span><span className="numbered-line" data-line="6">컴퓨터학부 학생들과 함께 실질적인 해결책을 만들어가요.</span></p><div className="hero-spacer numbered-line" data-line="7" aria-hidden="true"/><div className="hero-actions numbered-line" data-line="8"><button className="button primary" onClick={()=>setPage({type:'report'})}><Icon name="pencil" size={28}/>불편함 제보하기</button><button className="button outline" onClick={()=>setTab('프로젝트')}><Icon name="code" size={29}/>프로젝트 둘러보기</button></div></div>
    <ResponsiveHeroArtwork className="editor" aria-label="불편함을 서비스로 만드는 코드 예시"><div className="editor-top"><i/><i/><i/></div><div className="editor-tabs"><span><Icon name="code" size={18}/>needit.<b>ts</b></span></div><div className="code-lines"><div><em>1</em><code><span className="blue">const</span> <span className="purple">issue</span> = <span className="yellow">"학교생활 속 불편함"</span>;</code></div><div><em>2</em><code><span className="blue">const</span> <span className="purple">solution</span> = develop(issue);</code></div><div><em>3</em><code> </code></div><div><em>4</em><code className="green">// From Issue to Service</code></div></div></ResponsiveHeroArtwork></section>
   </>}
   {(tab!=='홈'||query)&&<div className="page-heading"><div><p className="code-comment">// {query?'SEARCH':tab==='프로젝트'?'PROJECTS':'DISCOVER'}</p><h1>{query?'검색 결과':tab}</h1><p>{query?`“${query}”에 대한 불편함과 프로젝트를 찾아보세요.`:tab==='프로젝트'?'학생들의 불편함이 실제 서비스로 만들어지고 있어요.':'당신도 같은 불편함을 겪었다면 공감해주세요.'}</p></div><button className="button primary" onClick={()=>setPage({type:'report'})}><Icon name="pencil"/>불편함 제보하기</button></div>}
   <div className={`dashboard ${tab===footerPages[0]&&!query?'home-dashboard':''} ${tab!=='홈'&&!query?'single':''}`}>
    {(tab!=='프로젝트'||query)&&<section className="panel"><div className="panel-header"><h2><span className="fire" aria-hidden="true">🔥</span>{tab==='홈'&&!query?'인기 불편함':'불편함 목록'}</h2>{tab==='홈'&&!query&&<button onClick={()=>setTab('불편함 탐색')}>전체보기 <Icon name="arrow" size={18}/></button>}<span className="sr-only">총 {filteredProblems.length}건</span></div><div className="problem-list">{homeProblems.slice(0,5).map(p=><article className="problem-row" key={p.id}><span className="issue-id">#{p.id}</span><button className="problem-title" onClick={()=>setPage({type:'problem',data:p})}>{p.title}</button><span className="category">{p.category}</span>{tab===footerPages[0]?<span className={`like ${liked.includes(p.id)?'liked':''}`} aria-label={p.title+' 공감 '+p.count+'개'}><Icon name="heart" size={20}/><span>{p.count}</span></span>:<button className={`like ${liked.includes(p.id)?'liked':''}`} aria-label={`${p.title} 공감 ${p.count}개`} aria-pressed={liked.includes(p.id)} onClick={()=>toggleLike(p.id)}><Icon name="heart" size={20}/><span>{p.count}</span></button>}</article>)}{!filteredProblems.length&&<p className="empty">검색한 불편함이 없어요. 첫 번째로 제보해보세요.</p>}</div></section>}
    {(tab!=='불편함 탐색'||query)&&<section className="panel"><div className="panel-header"><h2><Icon name="code" size={29}/>진행 중인 프로젝트</h2>{tab==='홈'&&!query&&<button onClick={()=>setTab('프로젝트')}>전체보기 <Icon name="arrow" size={18}/></button>}</div><div className="project-list">{homeProjects.map(({project:p,status})=><article className="project-row" key={p.id}><Icon className="folder" name="folder" size={38}/><div className="project-content"><div className="project-title-row"><button className="project-title" onClick={()=>setPage({type:'project',data:p})}>{p.title}</button><div className="home-project-status-actions"><span className={'status '+projectStatusClass(status)}>{status}</span></div></div><p>{p.description}</p><p className="muted">개발 완료 예정일: {p.expected_completion_date||'미정'}</p>{tab!==footerPages[0]&&<div className="home-project-launch"><ServiceLink project={p}/></div>}</div></article>)}{!homeProjects.length&&<p className="empty">검색한 프로젝트가 없어요.</p>}</div></section>}
   </div>
   </>}
   </>}
  </main>
  <footer className="site-footer"><div className="footer-terminal-bar"><div className="footer-window-dots" aria-hidden="true"><i/><i/><i/></div><span>needit@campus: ~/connect</span><span className="footer-shell">bash</span></div><div className="footer-inner"><div className="footer-summary"><a className="brand footer-brand" href="#" onClick={e=>{e.preventDefault();setPage(null);setTab(footerPages[0]);setQuery('');window.scrollTo({top:0,behavior:'smooth'});}}><Icon name="code" size={28}/><span>NEEDIT</span></a><p>학생들의 작은 불편함을 모아<br/>개발 아이디어와 실제 서비스로 연결합니다.</p><strong>당신의 불편함에서, 모두의 서비스로.</strong></div><nav className="footer-menu" aria-label="하단 메뉴"><h2><span>$</span> ls ./pages</h2><div>{footerPages.map(page=><a key={page} href="#" aria-current={tab===page&&!query?'page':undefined} onClick={e=>{e.preventDefault();setPage(null);setTab(page);setQuery('');window.scrollTo({top:0,behavior:'smooth'});}}>{page}</a>)}<button onClick={()=>setPage({type:'report'})}>불편함 제보하기</button></div></nav><div className="footer-about"><h2><span>$</span> cat about.txt</h2><p>2026 컴퓨터학부 해커톤 프로젝트</p><p>NEED + IT</p><p>실제 문제 발견 · 개발 · 사용자 검증</p></div></div><div className="footer-bottom"><div><span>© {new Date().getFullYear()} NEEDIT</span><span className="footer-prompt">needit@campus:~$ <span className="footer-ready">ready to solve</span><span className="footer-cursor" aria-hidden="true">▌</span></span></div></div></footer>
  <dialog ref={dialogRef} onCancel={()=>setDialog(null)} onClick={e=>{if(e.target===e.currentTarget)setDialog(null);}} aria-labelledby="dialog-title"><div className="dialog-header"><h2 id="dialog-title">{dialog?.type==='notification'?'알림':dialog?.type==='profile'?'내 프로필':dialog?.data?.title}</h2><button className="icon-button" aria-label="닫기" onClick={()=>setDialog(null)}><Icon name="close"/></button></div>
   {dialog?.type==='problem'?<div className="detail"><span className="category">{dialog.data.category}</span><p>{dialog.data.description||'학교생활에서 겪는 이 불편함에 공감하고, 해결 아이디어를 함께 나눠주세요.'}</p><button className="button outline" onClick={()=>{toggleLike(dialog.data.id);setDialog(null);}}><Icon name="heart"/> {liked.includes(dialog.data.id)?'공감 취소하기':'저도 공감해요'}</button></div>:dialog?.type==='project'?<div className="detail"><span className="category">{dialog.data.status}</span><p>{dialog.data.description}</p><p className="muted">개발 완료 예정일: {dialog.data.expected_completion_date||'미정'} · 프로젝트 예시 데이터</p></div>:<p className="detail muted">{dialog?.type==='notification'?'아직 새로운 알림이 없어요.':'현재는 게스트로 둘러보고 있어요. 로그인 기능은 백엔드 연결 후 제공될 예정이에요.'}</p>}
  </dialog>
  {notice&&<div className="toast" role="status">{notice}</div>}
 </AuthContext.Provider>;
}
