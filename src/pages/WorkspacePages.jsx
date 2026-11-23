import CommentEditor from '../components/CommentEditor.jsx';
import useMyFilter from '../hooks/useMyFilter.js';
import React, { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Icon from '../components/common/Icon.jsx';
import './workspace-pages.css';
import IssueActionsMenu from '../components/common/IssueActionsMenu.jsx';
import {useAuth} from '../contexts/AuthContext.jsx';
import AiPlanPanel from '../components/AiPlanPanel.jsx';
import {ProblemProjectLinks, RelatedServices} from './ProjectReleasePages.jsx';
import { problemCategories } from '../services/problemCategories.js';
import { createProblemComment, deleteProblemComment, listProblemComments } from '../services/problems.js';

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

function IssueProjectSummary({ problem }) {
  const { project_count: connected, deployed_project_count: deployed } = problem;
  const hasConnected = Number.isInteger(connected) && connected >= 0;
  const hasDeployed = Number.isInteger(deployed) && deployed >= 0;
  if (!hasConnected && !hasDeployed) return null;

  return <div className="wp-project-summary" aria-label="프로젝트 연결·배포 현황">
    {hasConnected && <span className={'wp-project-metric connected'+(connected===0?' is-empty':'')}><span>연결된 프로젝트</span><strong>{connected}<small>개</small></strong></span>}
    {hasDeployed && <span className={'wp-project-metric deployed'+(deployed===0?' is-empty':'')}><span>배포된 프로젝트</span><strong>{deployed}<small>개</small></strong></span>}
  </div>;
}

export function ExplorePage({problems,liked,onLike,onOpen,onReport,query=''}){const {user,requireLogin}=useAuth();const [onlyMine,setOnlyMine]=useMyFilter(user?.id,'problems');const[search,setSearch]=useState('');const[category,setCategory]=useState(allCategories);const[sort,setSort]=useState('latest');const items=problems.filter(p=>(!onlyMine||(Boolean(user)&&p.mine===true))&&(category===allCategories||p.category===category)&&(p.title+desc(p)).includes(search||query)).sort((a,b)=>sort==='popular'?b.count-a.count:(new Date(b.created_at||0)-new Date(a.created_at||0)));return <div className="wp-page"><section className="wp-explore-hero"><div><p className="code-comment">// NEEDIT<br/>// 대학생활 속 불편함을 함께 찾아 해결해요</p><h1>불편함 <span>탐색</span></h1><p>학교생활, 학사행정, 시설 등에서 겪는 다양한 불편함을 둘러보고,<br/>공감하는 문제에 의견을 남기거나, 해결해볼 아이디어를 떠올려보세요.</p></div><div className="wp-code"><div>🔴 🟡 🟢 <span>needit.ts</span></div><code><i>1</i> <b>const</b> explore = <em>"학생들의 불편함을 발견하고,"</em><br/><i>2</i> <b>const</b> solve = <em>"함께 해결해나가는 과정"</em>;<br/><i>3</i> <span>// Explore Inconveniences</span></code></div></section><div className="wp-filters"><label><Icon name="search" size={20}/><input aria-label="불편함 검색" placeholder="제목, 내용, 키워드로 검색해보세요" value={search} onChange={e=>setSearch(e.target.value)}/></label><div className="wp-chips">
        <button type="button" className={category === allCategories ? 'selected' : ''} aria-pressed={!onlyMine&&category === allCategories} onClick={() => {setCategory(allCategories);}}>{allCategories}</button>
        {problemCategories.map(({ name, example }) => (
          <CategoryFilterButton key={name} name={name} example={example} selected={!onlyMine&&category === name} onSelect={() => {setCategory(name);}} />
        ))}
      <button type="button" className={'my-filter-toggle'+(onlyMine?' is-on':'')} aria-pressed={onlyMine} aria-label="내가 작성한 불편함" onClick={()=>{if(onlyMine)setOnlyMine(false);else if(requireLogin())setOnlyMine(true);}}><span>My</span><span className="my-filter-switch" aria-hidden="true"/></button></div><select aria-label="정렬" value={sort} onChange={e=>setSort(e.target.value)}><option value="latest">최신순</option><option value="popular">인기순</option></select></div><div className="wp-list-heading"><h2>전체 <span>{items.length}</span>건의 불편함</h2><button className="button primary" onClick={onReport}><Icon name="pencil" size={20}/>불편함 제보하기</button></div><div className="wp-issue-grid">{items.map((p,index)=>{
 const rank=sort==='popular'&&index<2?index+1:null;
 const hasMyPlan=Boolean(user && p.ai_plan_access===true && String(p.ai_plan_owner_id)===String(user.id) && p.ai_plan?.hackathonPlan);
 const cardClass=rank?`wp-issue-card wp-rank-${rank}`:'wp-issue-card';
 return <article className={cardClass} key={p.id}>
  {rank&&<span className="wp-rank-label">인기 {rank}위</span>}
  <div>
    <span className="issue-id">#{p.id}</span>
    <button className="wp-card-title" onClick={()=>onOpen(p)}>{p.title}</button>
    <span className="category">{p.category}</span>
  </div>
  <p>{desc(p)}</p>

  <div className="wp-card-bottom">
    <button type="button" className={'wp-card-heart'+(liked.includes(p.id)?' wp-liked':'')} onClick={()=>onLike(p.id)} aria-pressed={liked.includes(p.id)} aria-label={p.title+' 공감'}><Icon name="heart" size={20}/>{p.count}</button>
    <IssueProjectSummary problem={p}/>
    {user&&<span className={"wp-plan-state"+(hasMyPlan?" is-generated":"")}><span aria-hidden="true"/>{hasMyPlan?"내 AI 기획안 · 생성됨":"내 AI 기획안 · 미생성"}</span>}
  </div>
  </article>;})}</div>{!items.length&&<p className="empty">조건에 맞는 불편함이 없어요.</p>}</div>}
const issueDateFormatter = new Intl.DateTimeFormat('ko-KR', {
  year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23',timeZone:'Asia/Seoul',
});

function IssueTime({ value, className }) {
  if (typeof value !== 'string' || !value.trim()) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return <time className={className} dateTime={date.toISOString()}>{issueDateFormatter.format(date)}</time>;
}

export function IssueDetailPage({ problem, liked, onLike, onBack, onProject, onProblemUpdate, projects, onOpenProject, onDeleted, onCreateProject, onEdit }) {
  const { user, requireLogin } = useAuth();
  const [comments, setComments] = useState([]);
  const [commentsFor, setCommentsFor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [revision, setRevision] = useState(0);
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState('');
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const commentWriteRequest = useRef(null);
  const deleteDialog = useRef(null);
  const deleteHeading = useId();
  const deleteDescription = useId();
  const accountId = user?.id ?? null;
  const draftKey = accountId === null ? null : 'needit-comment-draft:' + accountId + ':' + problem.id;

  useEffect(() => {
    setPosting(false);
    setPostError('');
    setDeleteTargetId(null);
    setDeleting(false);
    setDeleteError('');
    try {
      setText(draftKey ? sessionStorage.getItem(draftKey) || '' : '');
    } catch {
      setText('');
    }
    return () => {
      commentWriteRequest.current?.abort();
      commentWriteRequest.current = null;
    };
  }, [problem.id, draftKey]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setLoadError('');
    listProblemComments(problem.id, controller.signal).then(rows => {
      if (!controller.signal.aborted) {
        setComments(rows);
        setCommentsFor(accountId);
      }
    }).catch(error => {
      if (!controller.signal.aborted) setLoadError(error.message);
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [problem.id, revision, accountId]);

  async function submitComment(event) {
    event.preventDefault();
    if (loading || loadError || commentWriteRequest.current || !text.trim() || !requireLogin()) return;
    const controller = new AbortController();
    commentWriteRequest.current = controller;
    setPosting(true);
    setPostError('');
    try {
      const comment = await createProblemComment(problem.id, text, controller.signal);
      if (controller.signal.aborted) return;
      setComments(previous => [...previous.filter(row => row.id !== comment.id), comment]);
      setText('');
      try { if (draftKey) sessionStorage.removeItem(draftKey); } catch { /* The comment is already saved. */ }
    } catch (error) {
      if (error.status === 401 && draftKey) {
        try { sessionStorage.setItem(draftKey, text); } catch { /* Storage is optional. */ }
      }
      if (!controller.signal.aborted) setPostError(error.message);
    } finally {
      if (commentWriteRequest.current === controller) commentWriteRequest.current = null;
      if (!controller.signal.aborted) setPosting(false);
    }
  }

  const deletable = accountId !== null && commentsFor === accountId && !loading && !loadError;
  const deleteTarget = comments.find(comment => comment.id === deleteTargetId);
  const dialogOpen = deletable && deleteTarget?.can_delete === true;

  useEffect(() => {
    const dialog = deleteDialog.current;
    if (dialogOpen && !dialog?.open) dialog?.showModal();
    if (!dialogOpen && dialog?.open) dialog.close();
  }, [dialogOpen]);

  async function confirmDelete() {
    if (!dialogOpen || commentWriteRequest.current || !requireLogin()) return;
    const controller = new AbortController();
    commentWriteRequest.current = controller;
    setDeleting(true);
    setDeleteError('');

    try {
      await deleteProblemComment(problem.id, deleteTarget.id, controller.signal);
      if (!controller.signal.aborted) {
        setComments(previous => previous.filter(comment => comment.id !== deleteTarget.id));
        setDeleteTargetId(null);
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        setDeleteError(error.status === 404
          ? '댓글을 찾을 수 없거나 댓글 삭제 API가 아직 배포되지 않았어요.'
          : error.message);
      }
    } finally {
      if (commentWriteRequest.current === controller) commentWriteRequest.current = null;
      if (!controller.signal.aborted) setDeleting(false);
    }
  }

  const orderedComments = [...comments].sort((a, b) => {
    const byDate = (Date.parse(a.created_at) || 0) - (Date.parse(b.created_at) || 0);
    const order = byDate || String(a.id).localeCompare(String(b.id), undefined, { numeric: true });
    return -order;
  });
  const commentHeading = loading || loadError ? '댓글' : '댓글 ' + comments.length;

  return <div className="wp-page">
    <Back onClick={onBack}>불편함 탐색으로 돌아가기</Back>
    <div className="wp-detail-grid">
      <article className="wp-box wp-issue-detail">
        <div className="wp-issue-top">
          <span className="category">{problem.category}</span>
          <IssueActionsMenu problem={problem} onEdit={onEdit} canDelete={Boolean(user) && problem.can_delete === true} onDeleted={onDeleted}/>
        </div>
        <h1>{problem.title}</h1>
        <RelatedServices problem={problem} projects={projects} onProject={onOpenProject}/>
        <p className="wp-meta">
          
          <IssueTime value={problem.created_at} className="wp-meta-time"/>
        </p>

        <p className="wp-long-copy">{desc(problem)}</p>
        {problem.location && <p className="wp-demo">관련 위치: {problem.location}</p>}
        <div className="wp-chips">{[problem.category, '학교생활', '아이디어'].map(tag => <span key={tag}>#{tag}</span>)}</div>
        <div className="wp-detail-actions">
          <button type="button" className={liked ? 'wp-liked' : ''} onClick={onLike}
            aria-label={'공감 ' + problem.count + '개'} aria-pressed={liked}><Icon name="heart"/>{problem.count}</button>
          <span>{commentHeading}</span>
          <ProblemProjectLinks problem={problem} projects={projects} onOpenProject={onOpenProject} onOpenProjectList={onProject}/>
        </div>
        <div className="wp-comments-heading">
          <h2>{commentHeading}</h2>

        </div>
        {loading && <p className="wp-demo" role="status">댓글을 불러오는 중이에요…</p>}
        {loadError && <div className="wp-comment-error" role="alert">
          댓글을 불러오지 못했어요. {loadError}
          <button type="button" className="button outline" disabled={posting || deleting}
            onClick={() => setRevision(previous => previous + 1)}>다시 시도</button>
        </div>}
        {!loading && !loadError && comments.length === 0 && <p className="wp-demo">아직 등록된 댓글이 없어요.</p>}
        {orderedComments.map(comment => <div className="wp-comment" key={comment.id}>
          <Icon name="user" size={28}/>
          <div>
            <div className="wp-comment-meta">
              <strong>{comment.author_name || '익명 사용자'}</strong>
              <IssueTime value={comment.created_at} className="wp-comment-time"/>
              {deletable && comment.can_delete === true && (
                <button className="wp-comment-delete" type="button" disabled={posting || deleting}
                  onClick={() => { setDeleteError(''); setDeleteTargetId(comment.id); }}>삭제</button>
              )}
            </div>
            <CommentEditor key={String(comment.id)+String(accountId)} comment={comment} problemId={problem.id} canEdit={deletable&&(comment.can_edit===true||comment.can_delete===true)} disabled={posting||deleting} onSaved={row=>setComments(previous=>previous.map(item=>String(item.id)===String(row.id)?{...item,...row}:item))}/>
          </div>
        </div>)}
        <dialog ref={deleteDialog} className="problem-delete-dialog" aria-labelledby={deleteHeading}
          aria-describedby={deleteDescription}
          onCancel={event => { if (deleting) event.preventDefault(); else setDeleteTargetId(null); }}
          onClick={event => { if (event.target === event.currentTarget && !deleting) setDeleteTargetId(null); }}>
          <div className="problem-delete-content">
            <h2 id={deleteHeading}>이 댓글을 삭제할까요?</h2>
            <p id={deleteDescription} className="problem-delete-title">{deleteTarget?.content}</p>
            {deleteError && <p className="problem-delete-error" role="alert">{deleteError}</p>}
            <div className="problem-delete-actions">
              <button className="button outline" type="button" disabled={deleting}
                onClick={() => setDeleteTargetId(null)}>취소</button>
              <button className="button problem-delete-confirm" type="button" disabled={deleting}
                onClick={confirmDelete}>{deleting ? '삭제 중…' : '삭제하기'}</button>
            </div>
          </div>
        </dialog>
        <form className="wp-comment-form" onSubmit={submitComment}>
          <input required maxLength={500} aria-label="댓글" placeholder="댓글을 입력하세요..." value={text}
            disabled={posting} onChange={event => { setText(event.target.value); setPostError(''); }}/>
          <button type="submit" aria-label="댓글 등록" disabled={loading || Boolean(loadError) || posting || deleting || !text.trim()}><Icon name="arrow"/></button>
        </form>
        {posting && <p className="wp-demo" role="status">댓글을 등록하고 있어요…</p>}
        {postError && <p className="wp-comment-error" role="alert">댓글을 등록하지 못했어요. {postError}</p>}
      </article>
      <AiPlanPanel key={problem.id} problem={problem} detailLoaded onUpdate={onProblemUpdate} onCreateProject={onCreateProject} onOpenProject={onOpenProject}/>
    </div>
  </div>;
}
