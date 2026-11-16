import React, { useEffect, useRef, useState } from 'react';
import Icon from './components/common/Icon.jsx';

const initialProblems = [
 {id:103,title:'강의실 콘센트가 부족해요',category:'시설',count:127},
 {id:101,title:'도서관 좌석 현황을 실시간으로 알고 싶어요',category:'도서관',count:98},
 {id:97,title:'학부 공지가 여러 곳에 흩어져 있어요',category:'학사·행정',count:85},
 {id:95,title:'빈 강의실을 한눈에 찾고 싶어요',category:'시설',count:72},
 {id:92,title:'팀 프로젝트 시간을 맞추기 어려워요',category:'학교생활',count:64},
];
const projects = [
 {id:1,title:'강의실 콘센트 현황 안내 서비스',description:'강의실별 콘센트 수와 사용 가능 여부를 실시간으로 확인',progress:70,status:'개발 중'},
 {id:2,title:'도서관 좌석 알리미',description:'도서관 좌석 현황을 실시간으로 보여주는 서비스',progress:30,status:'기획 중'},
 {id:3,title:'학부 공지 모아보기',description:'흩어진 학부 공지와 신청 마감을 한곳에서 확인',progress:55,status:'개발 중'},
];

const footerPages = ['홈','불편함 탐색','프로젝트','서비스 소개'];

export default function App(){
 const [tab,setTab]=useState('홈');
 const [query,setQuery]=useState('');
 const [problems,setProblems]=useState(initialProblems);
 const [liked,setLiked]=useState([]);
 const [dialog,setDialog]=useState(null);
 const [notice,setNotice]=useState('');
 const dialogRef=useRef(null);
 useEffect(()=>{ if(dialog) dialogRef.current?.showModal(); else dialogRef.current?.close(); },[dialog]);
 useEffect(()=>{if(!notice)return;const timer=setTimeout(()=>setNotice(''),3500);return()=>clearTimeout(timer);},[notice]);
 const filteredProblems=problems.filter(p=>(p.title+p.category).includes(query));
 const filteredProjects=projects.filter(p=>(p.title+p.description).includes(query));
 function toggleLike(id){const active=liked.includes(id);setLiked(prev=>active?prev.filter(x=>x!==id):[...prev,id]);setProblems(prev=>prev.map(p=>p.id===id?{...p,count:p.count+(active?-1:1)}:p));}
 function submitProblem(event){event.preventDefault();const form=new FormData(event.currentTarget);setProblems(prev=>[{id:Math.max(...prev.map(p=>p.id))+1,title:form.get('title').trim(),category:form.get('category'),description:form.get('description').trim(),count:0},...prev]);setDialog(null);setTab('불편함 탐색');setNotice('불편함이 등록되었어요. 현재 브라우저의 데모 데이터에 반영됩니다.');}
 return <>
  <header className="header"><div className="header-inner">
   <a className="brand" href="#" onClick={e=>{e.preventDefault();setTab('홈');setQuery('');}} aria-label="NEEDIT 홈"><Icon name="code" size={34}/><span>NEEDIT</span></a>
   <nav aria-label="주 메뉴">{['홈','불편함 탐색','프로젝트','서비스 소개'].map(item=><button key={item} className={tab===item?'nav-item active':'nav-item'} aria-current={tab===item?'page':undefined} onClick={()=>setTab(item)}>{item}</button>)}</nav>
   <div className="header-tools"><label className="search"><Icon name="search" size={21}/><input aria-label="불편함이나 프로젝트 검색" placeholder="불편함이나 프로젝트를 검색하세요" value={query} onChange={e=>setQuery(e.target.value)}/>{query&&<button aria-label="검색 지우기" onClick={()=>setQuery('')}><Icon name="close" size={16}/></button>}</label><button className="icon-button" aria-label="알림" onClick={()=>setDialog({type:'notification'})}><Icon name="bell" size={27}/></button><button className="avatar" aria-label="내 프로필" onClick={()=>setDialog({type:'profile'})}><Icon name="user" size={23}/></button></div>
  </div></header>
  <main>
   {tab==='서비스 소개'&&!query?<section className="about-page" aria-labelledby="about-title">
    <div className="about-hero"><p className="code-comment">// ABOUT NEEDIT</p><h1 id="about-title">당신의 불편함에서,<br/><span>모두의 서비스로.</span></h1><p>해결하고 싶은 문제를 가진 대학생과<br/>해결할 문제를 찾는 개발자를 연결해요.</p><button className="button primary" onClick={()=>setDialog({type:'report'})}><Icon name="pencil" size={22}/>불편함 제보하기</button></div>
    <section className="about-journey" aria-labelledby="journey-title"><div className="about-section-heading"><p>HOW IT WORKS</p><h2 id="journey-title">NEEDIT의 해결 과정</h2><span>작은 경험이 실제 서비스가 되는 다섯 단계</span></div><ol className="about-steps">{[
     {icon:'pencil',title:'불편함 제보',text:'학교생활에서 겪은 불편함을 들려주세요. 언제, 어디서, 무엇이 불편했는지 작은 경험이면 충분해요.',example:'“학부 공지가 흩어져 있어 신청 기간을 놓쳐요.”'},
     {icon:'users',title:'공감으로 수요 확인',text:'같은 경험을 한 학생들이 공감과 댓글을 남겨요. 개발자는 누구에게 필요한 문제인지 살펴볼 수 있어요.',example:'공감과 경험을 모아 해결할 문제 발견'},
     {icon:'sparkles',title:'AI로 아이디어 구체화',text:'AI가 제보를 바탕으로 핵심 문제, 주요 기능, 기술 스택과 개발 범위를 제안해요.',example:'맞춤형 학부 공지 알림 서비스 기획'},
     {icon:'code',title:'프로젝트 개발',text:'개발자가 관심 있는 문제를 선택하고 프로젝트로 발전시켜요. 진행 상태를 공유하며 해결책을 만들어가요.',example:'기획 → 개발 → 테스트'},
     {icon:'users',title:'베타테스트와 피드백',text:'공개된 서비스 링크로 직접 사용해 보세요. 제보자와 공감한 학생들의 피드백이 더 나은 서비스를 만들어요.',example:'직접 써보고, 의견을 남기고, 함께 개선'}
    ].map((step,i)=><li className="about-step" key={step.title}><span className="about-step-number">0{i+1}</span><div className="about-step-icon"><Icon name={step.icon} size={28}/></div><div><h3>{step.title}</h3><p>{step.text}</p><span className="about-example">{step.example}</span></div></li>)}</ol></section>
    <section className="about-roles" aria-labelledby="roles-title"><div className="about-section-heading"><p>TOGETHER ON NEEDIT</p><h2 id="roles-title">서로 다른 역할, 하나의 문제 해결</h2></div><div className="about-role-grid"><article><Icon name="users" size={30}/><h3>불편함을 가진 대학생</h3><p>경험을 제보하고, 공감하고, 서비스를 직접 써보며 해결 과정에 참여해요.</p><span>제보 · 공감 · 사용자 피드백</span></article><article><Icon name="code" size={30}/><h3>문제를 해결하는 개발자</h3><p>실제 수요에서 아이디어를 찾고, 프로젝트를 개발하며 사용자 의견을 받아요.</p><span>아이디어 발굴 · 개발 · 서비스 개선</span></article></div></section>
    <div className="about-cta"><h2>다음 프로젝트는 당신의 경험에서 시작돼요.</h2><p>불편함을 나누거나, 해결하고 싶은 문제를 찾아보세요.</p><div><button className="button primary" onClick={()=>setDialog({type:'report'})}>불편함 제보하기</button><button className="button outline" onClick={()=>setTab('프로젝트')}>프로젝트 둘러보기</button></div></div>
   </section>:<>
   {tab==='홈'&&!query&&<>
    <section className="hero" aria-labelledby="hero-title"><div className="hero-copy"><div className="hero-line-numbers" aria-hidden="true">{Array.from({length:8},(_,i)=><span key={i}>{i+1}</span>)}</div><div className="hero-line-numbers" aria-hidden="true">{[1,2,3,4,5,6,7,8].map(number=><span key={number}>{number}</span>)}</div><p className="code-comment"><span className="numbered-line" data-line="1">// NEEDIT</span><span className="numbered-line" data-line="2">// 학생들의 불편함을 실제 서비스로 연결하는 플랫폼</span></p><h1 id="hero-title"><span className="numbered-line" data-line="3">당신의 불편함이</span><span className="numbered-line" data-line="4"><span>개발</span>로 해결되는 곳, <span>NEEDIT</span><span className="hero-caret" aria-hidden="true"/></span></h1><p className="hero-description"><span className="numbered-line" data-line="5">학교생활 속 불편함을 제보하고,</span><span className="numbered-line" data-line="6">컴퓨터학부 학생들과 함께 실질적인 해결책을 만들어가요.</span></p><div className="hero-spacer numbered-line" data-line="7" aria-hidden="true"/><div className="hero-actions numbered-line" data-line="8"><button className="button primary" onClick={()=>setDialog({type:'report'})}><Icon name="pencil" size={28}/>불편함 제보하기</button><button className="button outline" onClick={()=>setTab('프로젝트')}><Icon name="code" size={29}/>프로젝트 둘러보기</button></div></div>
    <div className="editor" aria-label="불편함을 서비스로 만드는 코드 예시"><div className="editor-top"><i/><i/><i/></div><div className="editor-tabs"><span><Icon name="code" size={18}/>needit.<b>ts</b></span></div><div className="code-lines"><div><em>1</em><code><span className="blue">const</span> <span className="purple">issue</span> = <span className="yellow">"학교생활 속 불편함"</span>;</code></div><div><em>2</em><code><span className="blue">const</span> <span className="purple">solution</span> = develop(issue);</code></div><div><em>3</em><code> </code></div><div><em>4</em><code className="green">// From Issue to Service</code></div></div></div></section>
   </>}
   {(tab!=='홈'||query)&&<div className="page-heading"><div><p className="code-comment">// {query?'SEARCH':tab==='프로젝트'?'PROJECTS':'DISCOVER'}</p><h1>{query?'검색 결과':tab}</h1><p>{query?`“${query}”에 대한 불편함과 프로젝트를 찾아보세요.`:tab==='프로젝트'?'학생들의 불편함이 실제 서비스로 만들어지고 있어요.':'당신도 같은 불편함을 겪었다면 공감해주세요.'}</p></div><button className="button primary" onClick={()=>setDialog({type:'report'})}><Icon name="pencil"/>불편함 제보하기</button></div>}
   <div className={`dashboard ${tab!=='홈'&&!query?'single':''}`}>
    {(tab!=='프로젝트'||query)&&<section className="panel"><div className="panel-header"><h2><span className="fire" aria-hidden="true">🔥</span>{tab==='홈'&&!query?'인기 불편함':'불편함 목록'}</h2>{tab==='홈'&&!query&&<button onClick={()=>setTab('불편함 탐색')}>전체보기 <Icon name="arrow" size={18}/></button>}<span className="sr-only">총 {filteredProblems.length}건</span></div><div className="problem-list">{filteredProblems.map(p=><article className="problem-row" key={p.id}><span className="issue-id">#{p.id}</span><button className="problem-title" onClick={()=>setDialog({type:'problem',data:p})}>{p.title}</button><span className="category">{p.category}</span><button className={`like ${liked.includes(p.id)?'liked':''}`} aria-label={`${p.title} 공감 ${p.count}개`} aria-pressed={liked.includes(p.id)} onClick={()=>toggleLike(p.id)}><Icon name="heart" size={20}/><span>{p.count}</span></button></article>)}{!filteredProblems.length&&<p className="empty">검색한 불편함이 없어요. 첫 번째로 제보해보세요.</p>}</div></section>}
    {(tab!=='불편함 탐색'||query)&&<section className="panel"><div className="panel-header"><h2><Icon name="code" size={29}/>진행 중인 프로젝트</h2>{tab==='홈'&&!query&&<button onClick={()=>setTab('프로젝트')}>전체보기 <Icon name="arrow" size={18}/></button>}</div><div className="project-list">{filteredProjects.map(p=><article className="project-row" key={p.id}><Icon className="folder" name="folder" size={38}/><div className="project-content"><div className="project-title-row"><button className="project-title" onClick={()=>setDialog({type:'project',data:p})}>{p.title}</button><span className={`status ${p.progress>50?'developing':'planning'}`}>{p.status}</span></div><p>{p.description}</p><div className="progress-row"><div className="progress-track" role="progressbar" aria-label={`${p.title} 진행률`} aria-valuenow={p.progress} aria-valuemin={0} aria-valuemax={100}><div style={{width:`${p.progress}%`}}/></div><span>{p.progress}%</span></div></div></article>)}{!filteredProjects.length&&<p className="empty">검색한 프로젝트가 없어요.</p>}</div></section>}
   </div>
   </>}
  </main>
  <footer className="site-footer"><div className="footer-terminal-bar"><div className="footer-window-dots" aria-hidden="true"><i/><i/><i/></div><span>needit@campus: ~/connect</span><span className="footer-shell">bash</span></div><div className="footer-inner"><div className="footer-summary"><a className="brand footer-brand" href="#" onClick={e=>{e.preventDefault();setTab(footerPages[0]);setQuery('');window.scrollTo({top:0,behavior:'smooth'});}}><Icon name="code" size={28}/><span>NEEDIT</span></a><p>학생들의 작은 불편함을 모아<br/>개발 아이디어와 실제 서비스로 연결합니다.</p><strong>당신의 불편함에서, 모두의 서비스로.</strong></div><nav className="footer-menu" aria-label="하단 메뉴"><h2><span>$</span> ls ./pages</h2><div>{footerPages.map(page=><a key={page} href="#" aria-current={tab===page&&!query?'page':undefined} onClick={e=>{e.preventDefault();setTab(page);setQuery('');window.scrollTo({top:0,behavior:'smooth'});}}>{page}</a>)}<button onClick={()=>setDialog({type:'report'})}>불편함 제보하기</button></div></nav><div className="footer-about"><h2><span>$</span> cat about.txt</h2><p>2026 컴퓨터학부 해커톤 프로젝트</p><p>NEED + IT</p><p>실제 문제 발견 · 개발 · 사용자 검증</p></div></div><div className="footer-bottom"><div><span>© {new Date().getFullYear()} NEEDIT</span><span className="footer-prompt">needit@campus:~$ <span className="footer-ready">ready to solve</span><span className="footer-cursor" aria-hidden="true">▌</span></span></div></div></footer>
  <dialog ref={dialogRef} onCancel={()=>setDialog(null)} onClick={e=>{if(e.target===e.currentTarget)setDialog(null);}} aria-labelledby="dialog-title"><div className="dialog-header"><h2 id="dialog-title">{dialog?.type==='report'?'불편함 제보하기':dialog?.type==='notification'?'알림':dialog?.type==='profile'?'내 프로필':dialog?.data?.title}</h2><button className="icon-button" aria-label="닫기" onClick={()=>setDialog(null)}><Icon name="close"/></button></div>
   {dialog?.type==='report'?<form onSubmit={submitProblem}><p className="muted">작은 불편함도 좋은 프로젝트의 시작이 될 수 있어요.</p><label>제목<input name="title" required maxLength={80} pattern=".*\S.*" placeholder="어떤 불편함을 겪으셨나요?"/></label><label>카테고리<select name="category"><option>시설</option><option>도서관</option><option>학사·행정</option><option>학교생활</option><option>기타</option></select></label><label>자세한 이야기<textarea name="description" required maxLength={2000} rows={4} placeholder="언제, 어디에서, 어떤 점이 불편했는지 알려주세요."/></label><p className="demo-note">데모 화면입니다. 등록 내용은 새로고침하면 초기화됩니다.</p><button className="button primary submit" type="submit">제보 등록하기 <Icon name="arrow" size={20}/></button></form>:dialog?.type==='problem'?<div className="detail"><span className="category">{dialog.data.category}</span><p>{dialog.data.description||'학교생활에서 겪는 이 불편함에 공감하고, 해결 아이디어를 함께 나눠주세요.'}</p><button className="button outline" onClick={()=>{toggleLike(dialog.data.id);setDialog(null);}}><Icon name="heart"/> {liked.includes(dialog.data.id)?'공감 취소하기':'저도 공감해요'}</button></div>:dialog?.type==='project'?<div className="detail"><span className="category">{dialog.data.status}</span><p>{dialog.data.description}</p><p className="muted">진행률 {dialog.data.progress}% · 프로젝트 예시 데이터</p></div>:<p className="detail muted">{dialog?.type==='notification'?'아직 새로운 알림이 없어요.':'현재는 게스트로 둘러보고 있어요. 로그인 기능은 백엔드 연결 후 제공될 예정이에요.'}</p>}
  </dialog>
  {notice&&<div className="toast" role="status">{notice}</div>}
 </>;
}
