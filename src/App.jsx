import React, { useEffect, useRef, useState } from 'react';
import Icon from './components/common/Icon.jsx';
import {AuthContext,LoginRequired} from './contexts/AuthContext.jsx';
import {listProblems,createProblem,setProblemLike} from './services/problems.js';
import ReportPage from './features/problems/components/ReportPage.jsx';
import MyPage from './pages/MyPage.jsx';
import {ProjectsPage,ProjectDetailPage,ProjectNotifications} from './pages/ProjectReleasePages.jsx';
import {listProjects} from './services/projects.js';
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
 const [user,setUser]=useState(null);
 const [projects,setProjects]=useState([]);
 const [projectError,setProjectError]=useState('');
 const [projectReload,setProjectReload]=useState(0);
 useEffect(()=>{const c=new AbortController();setProjects([]);setProjectError('');listProjects(c.signal).then(setProjects).catch(e=>{if(!c.signal.aborted)setProjectError(e.message);});return()=>c.abort();},[user?.id,projectReload]);
 function updateProject(row){setProjects(prev=>prev.map(p=>String(p.id)===String(row.id)?{...p,...row}:p));}
 function openProject(row){setPageState({type:'project',data:row});}

 useEffect(()=>{const expired=()=>{setUser(null);setPageState({type:'login'});setNotice('로그인이 만료됐어요. 다시 로그인해주세요.');};window.addEventListener('needit-auth-expired',expired);return()=>window.removeEventListener('needit-auth-expired',expired);},[]);
 useEffect(()=>{let active=true;currentUser().then(value=>{if(active)setUser(value);}).catch(error=>{if(active)setNotice(error.message);});return()=>{active=false;};},[]);
 async function signOut(){try{await logout();}catch{setNotice('서버 로그아웃을 확인하지 못했어요. 이 브라우저의 로그인 정보는 지웠어요.');}finally{setUser(null);setLiked([]);setProblems(prev=>prev.map(p=>({...p,mine:false})));setTab(footerPages[0]);setPage(null);}}
 const [sharedIssueId] = useState(() => new URLSearchParams(window.location.search).get('issue'));
 const [tab,setTab]=useState(sharedIssueId ? footerPages[1] : footerPages[0]);
 const [query,setQuery]=useState('');
 const [problems,setProblems]=useState([]);
 const [selectedPage,setPageState]=useState(sharedIssueId ? {type:'shared'} : null);
 function requireLogin(){if(user)return true;setNotice('로그인 후 사용할 수 있는 기능이에요.');setQuery('');setPageState({type:'login'});return false;}
 function setPage(value){if(typeof value==='function'){setPageState(value);return;}if(['report','profile'].includes(value?.type)&&!requireLogin())return;setPageState(value);}
 const sharedProblem = selectedPage?.type === 'shared'
  ? problems.find(problem => String(problem.id) === sharedIssueId)
  : null;
 const page = sharedProblem ? {type:'problem',data:sharedProblem} : selectedPage;
 const [loading,setLoading]=useState(true);
 const [apiError,setApiError]=useState('');
 const [reload,setReload]=useState(0);
 useEffect(()=>{const controller=new AbortController();setLoading(true);setProblems([]);setApiError('');listProblems(controller.signal).then(rows=>{setProblems(rows);setLiked(rows.filter(p=>p.liked_by_me).map(p=>p.id));}).catch(error=>{if(!controller.signal.aborted)setApiError(error.message);}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});return()=>controller.abort();},[reload,user?.id]);
 function updateProblem(row){setProblems(prev=>prev.map(p=>p.id===row.id?{...p,...row,mine:p.mine,count:p.count}:p));}
 async function saveProblem(data){if(!requireLogin())throw new Error('로그인이 필요해요.');const p=await createProblem(data);setProblems(prev=>[{...p,mine:true},...prev.filter(item=>item.id!==p.id)]);setApiError('');setTab(footerPages[1]);setPage(null);setNotice('불편함을 DB에 등록했어요.');}
 useEffect(()=>{
  setPage(previous => previous?.type === 'shared' ? previous : null);
 },[tab]);
 useEffect(()=>{
  if(selectedPage?.type === 'shared') return;
  const url = new URL(window.location.href);
  if(!url.searchParams.has('issue')) return;
  url.searchParams.delete('issue');
  window.history.replaceState(null,'',url.href);
 },[selectedPage]);
 const [liked,setLiked]=useState([]);
 const [dialog,setDialog]=useState(null);
 const [notice,setNotice]=useState('');
 const dialogRef=useRef(null);
 useEffect(()=>{ if(dialog) dialogRef.current?.showModal(); else dialogRef.current?.close(); },[dialog]);
 useEffect(()=>{if(!notice)return;const timer=setTimeout(()=>setNotice(''),3500);return()=>clearTimeout(timer);},[notice]);
 const filteredProblems=problems.filter(p=>(p.title+p.category).includes(query));
 const filteredProjects=projects.filter(p=>(p.title+p.description).includes(query));
 const liking=useRef(new Set());
 async function toggleLike(id){if(!requireLogin()||liking.current.has(id))return;liking.current.add(id);try{const row=await setProblemLike(id,!liked.includes(id));setLiked(prev=>row.liked_by_me?[...new Set([...prev,id])]:prev.filter(x=>x!==id));setProblems(prev=>prev.map(p=>p.id===id?{...p,count:Number(row.likes_count),liked_by_me:row.liked_by_me}:p));}catch(e){setNotice(e.message);}finally{liking.current.delete(id);}}

 return <AuthContext.Provider value={{user,requireLogin}}>
  <header className="header"><div className="header-inner">
   <a className="brand" href="#" onClick={e=>{e.preventDefault();setPage(null);setTab('홈');setQuery('');}} aria-label="NEEDIT 홈"><Icon name="code" size={34}/><span>NEEDIT</span></a>
   <nav aria-label="주 메뉴">{['홈','불편함 탐색','프로젝트','서비스 소개','마이페이지'].map(item=><button key={item} className={tab===item?'nav-item active':'nav-item'} aria-current={tab===item?'page':undefined} onClick={()=>{setPage(null);setTab(item);}}>{item}</button>)}</nav>
   <div className="header-tools"><label className="search"><Icon name="search" size={21}/><input aria-label="불편함이나 프로젝트 검색" placeholder="불편함이나 프로젝트를 검색하세요" value={query} onChange={e=>setQuery(e.target.value)}/>{query&&<button aria-label="검색 지우기" onClick={()=>setQuery('')}><Icon name="close" size={16}/></button>}</label><ProjectNotifications onOpen={openProject}/><button className="header-login" onClick={()=>user?signOut():setPage({type:'login'})}>{user?'로그아웃':'로그인'}</button>{user&&<span className="header-user">{user.name}님</span>}<button className="avatar" aria-label="내 프로필" onClick={()=>setPage({type:'profile'})}><Icon name="user" size={23}/></button></div>
  </div></header>
  <main>
   {projectError&&<div className="api-banner error" role="alert">{projectError}<button onClick={()=>setProjectReload(n=>n+1)}>프로젝트 다시 불러오기</button></div>}

   {loading&&<p className="api-banner" role="status">불편함 목록을 불러오는 중이에요…</p>}
   {apiError&&<div className="api-banner error" role="alert">{apiError}<button onClick={()=>setReload(n=>n+1)}>다시 시도</button></div>}
   {!user&&page?.type!=='login'&&(page?.type==='profile'||tab===footerPages[4])?<LoginRequired onLogin={requireLogin}/>:page?.type==='shared'?(!loading&&!apiError&&<div className="wp-page">
    <p className="empty" role="status">이 링크의 제보를 찾을 수 없어요.</p>
    <button className="button outline" onClick={()=>setPage(null)}>불편함 탐색으로</button>
   </div>):page?.type==='login'?<LoginPage onLogin={value=>{setUser(value);setQuery('');setTab(footerPages[4]);setPage(null);setNotice(`${value.name}님, 환영해요!`);}} onBack={()=>{setPage(null);setTab(footerPages[0]);}}/>:(page?.type==='profile'||(tab==='마이페이지'&&!page))?<MyPage key={user?.id||'guest'} user={user} problems={problems} projects={projects} liked={liked} onIssue={p=>setPage({type:'problem',data:p})} onProject={p=>setPage({type:'project',data:p})} onReport={()=>setPage({type:'report'})}/>:page?.type==='report'?<ReportPage onBack={()=>setPage(null)} onSubmit={saveProblem}/>:page?.type==='problem'?<IssueDetailPage projects={projects} onOpenProject={openProject} onProblemUpdate={updateProblem} key={page.data.id} problem={problems.find(p=>p.id===page.data.id)||page.data} liked={liked.includes(page.data.id)} onLike={()=>toggleLike(page.data.id)} onBack={()=>setPage(null)} onProject={()=>{setPage(null);setTab(footerPages[2]);}}/>:page?.type==='project'?<ProjectDetailPage key={page.data.id} project={projects.find(p=>String(p.id)===String(page.data.id))||page.data} onUpdate={updateProject} onIssue={p=>setPage({type:"problem",data:problems.find(row=>String(row.id)===String(p.id))||p})} onBack={()=>setPage(null)} onIssues={()=>{setPage(null);setTab(footerPages[1]);}}/>:tab===footerPages[1]?<ExplorePage onProblemUpdate={updateProblem} problems={problems} liked={liked} query={query} onLike={toggleLike} onOpen={p=>setPage({type:'problem',data:p})} onReport={()=>setPage({type:'report'})}/>:tab===footerPages[2]&&!query?<ProjectsPage projects={projects} onOpen={p=>setPage({type:'project',data:p})}/>:<>
   {tab==='서비스 소개'&&!query?<ReadmePage onReport={()=>setPage({type:'report'})} onProjects={()=>setTab(footerPages[2])}/>:<>
   {tab==='홈'&&!query&&<>
    <section className="hero" aria-labelledby="hero-title"><div className="hero-copy"><div className="hero-line-numbers" aria-hidden="true">{Array.from({length:8},(_,i)=><span key={i}>{i+1}</span>)}</div><div className="hero-line-numbers" aria-hidden="true">{[1,2,3,4,5,6,7,8].map(number=><span key={number}>{number}</span>)}</div><p className="code-comment"><span className="numbered-line" data-line="1">// NEEDIT</span><span className="numbered-line" data-line="2">// 학생들의 불편함을 실제 서비스로 연결하는 플랫폼</span></p><h1 id="hero-title"><span className="numbered-line" data-line="3">당신의 불편함이</span><span className="numbered-line" data-line="4"><span>개발</span>로 해결되는 곳, <span>NEEDIT</span><span className="hero-caret" aria-hidden="true"/></span></h1><p className="hero-description"><span className="numbered-line" data-line="5">학교생활 속 불편함을 제보하고,</span><span className="numbered-line" data-line="6">컴퓨터학부 학생들과 함께 실질적인 해결책을 만들어가요.</span></p><div className="hero-spacer numbered-line" data-line="7" aria-hidden="true"/><div className="hero-actions numbered-line" data-line="8"><button className="button primary" onClick={()=>setPage({type:'report'})}><Icon name="pencil" size={28}/>불편함 제보하기</button><button className="button outline" onClick={()=>setTab('프로젝트')}><Icon name="code" size={29}/>프로젝트 둘러보기</button></div></div>
    <div className="editor" aria-label="불편함을 서비스로 만드는 코드 예시"><div className="editor-top"><i/><i/><i/></div><div className="editor-tabs"><span><Icon name="code" size={18}/>needit.<b>ts</b></span></div><div className="code-lines"><div><em>1</em><code><span className="blue">const</span> <span className="purple">issue</span> = <span className="yellow">"학교생활 속 불편함"</span>;</code></div><div><em>2</em><code><span className="blue">const</span> <span className="purple">solution</span> = develop(issue);</code></div><div><em>3</em><code> </code></div><div><em>4</em><code className="green">// From Issue to Service</code></div></div></div></section>
   </>}
   {(tab!=='홈'||query)&&<div className="page-heading"><div><p className="code-comment">// {query?'SEARCH':tab==='프로젝트'?'PROJECTS':'DISCOVER'}</p><h1>{query?'검색 결과':tab}</h1><p>{query?`“${query}”에 대한 불편함과 프로젝트를 찾아보세요.`:tab==='프로젝트'?'학생들의 불편함이 실제 서비스로 만들어지고 있어요.':'당신도 같은 불편함을 겪었다면 공감해주세요.'}</p></div><button className="button primary" onClick={()=>setPage({type:'report'})}><Icon name="pencil"/>불편함 제보하기</button></div>}
   <div className={`dashboard ${tab!=='홈'&&!query?'single':''}`}>
    {(tab!=='프로젝트'||query)&&<section className="panel"><div className="panel-header"><h2><span className="fire" aria-hidden="true">🔥</span>{tab==='홈'&&!query?'인기 불편함':'불편함 목록'}</h2>{tab==='홈'&&!query&&<button onClick={()=>setTab('불편함 탐색')}>전체보기 <Icon name="arrow" size={18}/></button>}<span className="sr-only">총 {filteredProblems.length}건</span></div><div className="problem-list">{filteredProblems.slice(0,5).map(p=><article className="problem-row" key={p.id}><span className="issue-id">#{p.id}</span><button className="problem-title" onClick={()=>setPage({type:'problem',data:p})}>{p.title}</button><span className="category">{p.category}</span><button className={`like ${liked.includes(p.id)?'liked':''}`} aria-label={`${p.title} 공감 ${p.count}개`} aria-pressed={liked.includes(p.id)} onClick={()=>toggleLike(p.id)}><Icon name="heart" size={20}/><span>{p.count}</span></button></article>)}{!filteredProblems.length&&<p className="empty">검색한 불편함이 없어요. 첫 번째로 제보해보세요.</p>}</div></section>}
    {(tab!=='불편함 탐색'||query)&&<section className="panel"><div className="panel-header"><h2><Icon name="code" size={29}/>진행 중인 프로젝트</h2>{tab==='홈'&&!query&&<button onClick={()=>setTab('프로젝트')}>전체보기 <Icon name="arrow" size={18}/></button>}</div><div className="project-list">{filteredProjects.map(p=><article className="project-row" key={p.id}><Icon className="folder" name="folder" size={38}/><div className="project-content"><div className="project-title-row"><button className="project-title" onClick={()=>setPage({type:'project',data:p})}>{p.title}</button><span className={`status ${p.progress>50?'developing':'planning'}`}>{p.status}</span></div><p>{p.description}</p><div className="progress-row"><div className="progress-track" role="progressbar" aria-label={`${p.title} 진행률`} aria-valuenow={p.progress} aria-valuemin={0} aria-valuemax={100}><div style={{width:`${p.progress}%`}}/></div><span>{p.progress}%</span></div></div></article>)}{!filteredProjects.length&&<p className="empty">검색한 프로젝트가 없어요.</p>}</div></section>}
   </div>
   </>}
   </>}
  </main>
  <footer className="site-footer"><div className="footer-terminal-bar"><div className="footer-window-dots" aria-hidden="true"><i/><i/><i/></div><span>needit@campus: ~/connect</span><span className="footer-shell">bash</span></div><div className="footer-inner"><div className="footer-summary"><a className="brand footer-brand" href="#" onClick={e=>{e.preventDefault();setPage(null);setTab(footerPages[0]);setQuery('');window.scrollTo({top:0,behavior:'smooth'});}}><Icon name="code" size={28}/><span>NEEDIT</span></a><p>학생들의 작은 불편함을 모아<br/>개발 아이디어와 실제 서비스로 연결합니다.</p><strong>당신의 불편함에서, 모두의 서비스로.</strong></div><nav className="footer-menu" aria-label="하단 메뉴"><h2><span>$</span> ls ./pages</h2><div>{footerPages.map(page=><a key={page} href="#" aria-current={tab===page&&!query?'page':undefined} onClick={e=>{e.preventDefault();setPage(null);setTab(page);setQuery('');window.scrollTo({top:0,behavior:'smooth'});}}>{page}</a>)}<button onClick={()=>setPage({type:'report'})}>불편함 제보하기</button></div></nav><div className="footer-about"><h2><span>$</span> cat about.txt</h2><p>2026 컴퓨터학부 해커톤 프로젝트</p><p>NEED + IT</p><p>실제 문제 발견 · 개발 · 사용자 검증</p></div></div><div className="footer-bottom"><div><span>© {new Date().getFullYear()} NEEDIT</span><span className="footer-prompt">needit@campus:~$ <span className="footer-ready">ready to solve</span><span className="footer-cursor" aria-hidden="true">▌</span></span></div></div></footer>
  <dialog ref={dialogRef} onCancel={()=>setDialog(null)} onClick={e=>{if(e.target===e.currentTarget)setDialog(null);}} aria-labelledby="dialog-title"><div className="dialog-header"><h2 id="dialog-title">{dialog?.type==='notification'?'알림':dialog?.type==='profile'?'내 프로필':dialog?.data?.title}</h2><button className="icon-button" aria-label="닫기" onClick={()=>setDialog(null)}><Icon name="close"/></button></div>
   {dialog?.type==='problem'?<div className="detail"><span className="category">{dialog.data.category}</span><p>{dialog.data.description||'학교생활에서 겪는 이 불편함에 공감하고, 해결 아이디어를 함께 나눠주세요.'}</p><button className="button outline" onClick={()=>{toggleLike(dialog.data.id);setDialog(null);}}><Icon name="heart"/> {liked.includes(dialog.data.id)?'공감 취소하기':'저도 공감해요'}</button></div>:dialog?.type==='project'?<div className="detail"><span className="category">{dialog.data.status}</span><p>{dialog.data.description}</p><p className="muted">진행률 {dialog.data.progress}% · 프로젝트 예시 데이터</p></div>:<p className="detail muted">{dialog?.type==='notification'?'아직 새로운 알림이 없어요.':'현재는 게스트로 둘러보고 있어요. 로그인 기능은 백엔드 연결 후 제공될 예정이에요.'}</p>}
  </dialog>
  {notice&&<div className="toast" role="status">{notice}</div>}
 </AuthContext.Provider>;
}
