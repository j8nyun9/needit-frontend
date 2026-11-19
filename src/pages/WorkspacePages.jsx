import React, { useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Icon from '../components/common/Icon.jsx';
import './workspace-pages.css';
import IssueShare from '../components/common/IssueShare.jsx';
import ProblemDeleteButton from '../components/common/ProblemDeleteButton.jsx';
import {useAuth} from '../contexts/AuthContext.jsx';
import AiPlanPanel,{AiPlanDialog} from '../components/AiPlanPanel.jsx';
import {RelatedServices} from './ProjectReleasePages.jsx';
import { problemCategories } from '../services/problemCategories.js';

const allCategories = '전체';
export const extraIssues=[
{id:96,title:'수강신청 서버가 자주 다운돼요',category:'학사·행정',count:85,description:'수강신청 기간마다 서버가 불안정해서 원하는 수업을 신청하기 어려워요.'},
{id:94,title:'학식 메뉴와 혼잡도를 미리 알고 싶어요',category:'학교생활',count:76,description:'식당에 가기 전에 메뉴와 현재 혼잡도를 한눈에 확인하고 싶어요.'},
{id:91,title:'과제 마감일을 한눈에 관리하고 싶어요',category:'학교생활',count:58,description:'수업마다 다른 과제 마감일을 한곳에서 확인하고 싶어요.'},
{id:90,title:'학교 셔틀버스 위치를 실시간으로 알고 싶어요',category:'학교생활',count:53,description:'셔틀버스가 어디쯤 오고 있는지 알 수 있으면 통학 계획에 도움이 될 것 같아요.'}];
const desc=p=>p.description||`${p.title}. 학교생활에서 자주 겪는 불편함이에요. 필요한 정보를 한곳에서 편하게 확인할 수 있는 서비스가 있으면 좋겠어요.`;
function Box({title,children}){return <section className="wp-box"><h2>{title}</h2><div className="wp-box-body">{children}</div></section>}
function Back({onClick,children}){return <button className="wp-back" onClick={onClick}>← {children}</button>}
function CategoryFilterButton({ name, example, selected, onSelect }) {
  const tooltipId = useId();
  const buttonRef = useRef(null);
  const tooltipRef = useRef(null);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const visible = hovered || focused;

  useLayoutEffect(() => {
    if (!visible) return;

    function positionTooltip() {
      const button = buttonRef.current.getBoundingClientRect();
      const tooltip = tooltipRef.current;
      const { clientWidth, clientHeight } = document.documentElement;
      const inset = 8;
      tooltip.style.maxWidth = Math.min(260, clientWidth - 2 * inset) + 'px';
      const { width, height } = tooltip.getBoundingClientRect();
      const center = button.left + (button.width - width) / 2;
      const left = Math.max(inset, Math.min(center, clientWidth - width - inset));
      const below = button.bottom + inset;
      const above = button.top - height - inset;
      const top = below + height <= clientHeight - inset ? below : above;
      tooltip.style.left = left + 'px';
      tooltip.style.top = Math.max(inset, Math.min(top, clientHeight - height - inset)) + 'px';
    }

    positionTooltip();
    window.addEventListener('resize', positionTooltip);
    window.addEventListener('scroll', positionTooltip, true);
    return () => {
      window.removeEventListener('resize', positionTooltip);
      window.removeEventListener('scroll', positionTooltip, true);
    };
  }, [visible]);

  return <>
    <button
      ref={buttonRef}
      type="button"
      className={selected ? 'selected' : ''}
      aria-pressed={selected}
      aria-describedby={tooltipId}
      onPointerEnter={event => { if (event.pointerType === 'mouse') setHovered(true); }}
      onPointerLeave={() => setHovered(false)}
      onFocus={event => setFocused(event.currentTarget.matches(':focus-visible'))}
      onBlur={() => setFocused(false)}
      onClick={onSelect}
    >{name}</button>
    {createPortal(
      <span id={tooltipId} ref={tooltipRef} role="tooltip" className="wp-category-tooltip" hidden={!visible}>{example}</span>,
      document.body
    )}
  </>;
}

export function ExplorePage({problems,liked,onLike,onOpen,onReport,onProblemUpdate,onCreateProject,onOpenProject,query=''}){const[planProblem,setPlanProblem]=useState(null);const[search,setSearch]=useState('');const[category,setCategory]=useState(allCategories);const[sort,setSort]=useState('latest');const items=problems.filter(p=>(category===allCategories||p.category===category)&&(p.title+desc(p)).includes(search||query)).sort((a,b)=>sort==='popular'?b.count-a.count:(new Date(b.created_at||0)-new Date(a.created_at||0)));return <div className="wp-page"><section className="wp-explore-hero"><div><p className="code-comment">// NEEDIT<br/>// 대학생활 속 불편함을 함께 찾아 해결해요</p><h1>불편함 <span>탐색</span></h1><p>학교생활, 학사행정, 시설 등에서 겪는 다양한 불편함을 둘러보고,<br/>공감하는 문제에 의견을 남기거나, 해결해볼 아이디어를 떠올려보세요.</p></div><div className="wp-code"><div>🔴 🟡 🟢 <span>needit.ts</span></div><code><i>1</i> <b>const</b> explore = <em>"학생들의 불편함을 발견하고,"</em><br/><i>2</i> <b>const</b> solve = <em>"함께 해결해나가는 과정"</em>;<br/><i>3</i> <span>// Explore Inconveniences</span></code></div></section><div className="wp-filters"><label><Icon name="search" size={20}/><input aria-label="불편함 검색" placeholder="제목, 내용, 키워드로 검색해보세요" value={search} onChange={e=>setSearch(e.target.value)}/></label><div className="wp-chips">
        <button type="button" className={category === allCategories ? 'selected' : ''} aria-pressed={category === allCategories} onClick={() => setCategory(allCategories)}>{allCategories}</button>
        {problemCategories.map(({ name, example }) => (
          <CategoryFilterButton key={name} name={name} example={example} selected={category === name} onSelect={() => setCategory(name)} />
        ))}
      </div><select aria-label="정렬" value={sort} onChange={e=>setSort(e.target.value)}><option value="latest">최신순</option><option value="popular">인기순</option></select></div><div className="wp-list-heading"><h2>전체 <span>{items.length}</span>건의 불편함</h2><button className="button primary" onClick={onReport}><Icon name="pencil" size={20}/>불편함 제보하기</button></div><div className="wp-issue-grid">{items.map((p,index)=>{
 const rank=sort==='popular'&&index<2?index+1:null;
 const cardClass=rank?`wp-issue-card wp-rank-${rank}`:'wp-issue-card';
 return <article className={cardClass} key={p.id}>
  {rank&&<span className="wp-rank-label">인기 {rank}위</span>}
  <div><span className="issue-id">#{p.id}</span><button className="wp-card-title" onClick={()=>onOpen(p)}>{p.title}</button><span className="category">{p.category}</span></div><p>{desc(p)}</p>{p.project_id!=null&&<span className="status developing wp-adopted">프로젝트 채택 완료</span>}<footer><button className="wp-ai-trigger" onClick={()=>setPlanProblem(p)}><Icon name="sparkles" size={17}/>{p.ai_plan?'AI 기획안 보기':'AI 기획안 만들기'}</button><button className={liked.includes(p.id)?'wp-liked':''} onClick={()=>onLike(p.id)} aria-pressed={liked.includes(p.id)}><Icon name="heart" size={20}/>{p.count}</button><button onClick={()=>onOpen(p)}>댓글 보기</button><button className="wp-card-arrow" aria-label={`${p.title} 상세 보기`} onClick={()=>onOpen(p)}><Icon name="arrow" size={19}/></button></footer></article>;})}</div>{planProblem&&<AiPlanDialog problem={planProblem} onClose={()=>setPlanProblem(null)} onUpdate={onProblemUpdate} onCreateProject={onCreateProject} onOpenProject={onOpenProject}/>}{!items.length&&<p className="empty">조건에 맞는 불편함이 없어요.</p>}</div>}
const issueDateFormatter = new Intl.DateTimeFormat('ko-KR', {
  dateStyle: 'medium', timeStyle: 'short', hourCycle: 'h23', timeZone: 'Asia/Seoul',
});

function IssueCreatedTime({ value }) {
  if (typeof value !== 'string' || !value.trim()) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return <time className="wp-meta-time" dateTime={date.toISOString()}>{issueDateFormatter.format(date)}</time>;
}

export function IssueDetailPage({problem,liked,onLike,onBack,onProject,onProblemUpdate,projects,onOpenProject,onDeleted,onCreateProject}){const {user,requireLogin}=useAuth();const[comments,setComments]=useState([{id:1,text:'저도 같은 불편함을 겪고 있어요. 함께 해결되면 좋겠어요!',author:'컴퓨터학부 학생'},{id:2,text:'필요한 정보를 한곳에서 볼 수 있으면 좋겠어요.',author:'경영학부 학생'}]);const[text,setText]=useState('');const[sort,setSort]=useState('latest');return <div className="wp-page"><Back onClick={onBack}>불편함 탐색으로 돌아가기</Back><div className="wp-detail-grid"><article className="wp-box wp-issue-detail"><span className="category">{problem.category}</span><h1>{problem.title}</h1><p className="wp-meta"><span className="wp-meta-author"><Icon name="user" size={23}/>익명 사용자 · 예시 게시글</span><IssueCreatedTime value={problem.created_at}/></p><RelatedServices problem={problem} projects={projects} onProject={onOpenProject}/><p className="wp-long-copy">{desc(problem)}</p>{problem.location&&<p className="wp-demo">관련 위치: {problem.location}</p>}<div className="wp-chips">{[problem.category,'학교생활','아이디어'].map(t=><span key={t}>#{t}</span>)}</div><div className="wp-detail-actions"><button className={liked?'wp-liked':''} onClick={onLike} aria-pressed={liked}><Icon name="heart"/>{problem.count}</button><span>댓글 {comments.length}</span>{problem.project_id!=null?<><span className="status developing wp-adopted">프로젝트 채택 완료</span><button className="button primary" type="button" onClick={()=>onOpenProject({id:problem.project_id})}>연결된 프로젝트 보기</button></>:<button className="button primary" onClick={onProject}><Icon name="code" size={20}/>개발 프로젝트 보기</button>}<IssueShare id={problem.id}/><ProblemDeleteButton problem={problem} onDeleted={onDeleted}/></div><div className="wp-comments-heading"><h2>댓글 {comments.length}</h2><select aria-label="댓글 정렬" value={sort} onChange={e=>setSort(e.target.value)}><option value="latest">최신순</option><option value="oldest">등록순</option></select></div>{[...comments].sort((a,b)=>sort==='latest'?b.id-a.id:a.id-b.id).map(c=><div className="wp-comment" key={c.id}><Icon name="user" size={28}/><div><strong>{c.author}</strong><p>{c.text}</p></div></div>)}<form className="wp-comment-form" onSubmit={e=>{e.preventDefault();if(!requireLogin()||!text.trim())return;setComments([...comments,{id:Date.now(),text:text.trim(),author:user?.name||'나'}]);setText('')}}><input required maxLength={500} aria-label="댓글" placeholder="댓글을 입력하세요..." value={text} onChange={e=>setText(e.target.value)}/><button type="submit" aria-label="댓글 등록"><Icon name="arrow"/></button></form><p className="wp-demo">댓글은 현재 화면에서만 유지돼요.</p></article><AiPlanPanel key={problem.id} problem={problem} onUpdate={onProblemUpdate} onCreateProject={onCreateProject}/></div></div>}
