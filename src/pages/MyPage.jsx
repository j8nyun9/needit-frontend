import React,{useEffect,useRef,useState} from 'react';
import Icon from '../components/common/Icon.jsx';
import {isLinkedProject,projectDisplayStatus,projectStatusClass} from '../utils/projectPresentation.js';
import {getAccount,saveProfile,readMyTab,saveMyTab,emptyAccount} from '../services/account.js';

const labels=['내가 등록한 불편함','공감한 불편함','관심 프로젝트','참여 프로젝트'];
const icons=['pencil','heart','folder','code'];
const profileFields=[['name','닉네임',30],['bio','자기소개',150],['department','학부',50],['year','학년',20],['school','학교',80]];
class MyPageBoundary extends React.Component{
 state={failed:false};
 static getDerivedStateFromError(){return {failed:true};}
 componentDidCatch(error){console.error('MyPage rendering failed:',error);}
 render(){return this.state.failed?<section className="wp-page my-page"><h1>마이페이지</h1><p role="alert">마이페이지 화면을 표시하지 못했어요.</p><button className="button outline" onClick={()=>this.setState({failed:false})}>다시 열기</button></section>:this.props.children;}
}
export default function MyPage(props){
 if(!props.user?.id)return <section className="wp-page my-page"><h1>마이페이지</h1><p role="status">로그인 정보를 확인하고 있어요. 로그인이 완료되면 다시 열어주세요.</p></section>;
 return <MyPageBoundary key={props.user.id}><AuthenticatedMyPage {...props}/></MyPageBoundary>;
}
function AuthenticatedMyPage({user,projects:allProjects,onIssue,onProject,onReport,onProfileUpdate,onExplore,onBrowseProjects,projectToday}){
 const [account,setAccount]=useState(()=>emptyAccount(user));const [loaded,setLoaded]=useState(false);const [loading,setLoading]=useState(true);const [error,setError]=useState('');const [retry,setRetry]=useState(0);
 const [editing,setEditing]=useState(false);const [draft,setDraft]=useState({});const [saving,setSaving]=useState(false);const [saveError,setSaveError]=useState('');const [saved,setSaved]=useState(false);
 const [tab,setTab]=useState(()=>readMyTab(user.id));const [allActivity,setAllActivity]=useState(false);const lock=useRef(false);
 useEffect(()=>{
  const c=new AbortController();setLoading(true);setError('');
  getAccount(c.signal).then(data=>{if(!c.signal.aborted){if(data.profile.id!==user.id)throw new Error('계정 정보를 다시 확인해주세요.');setAccount(data);setLoaded(true);}}).catch(e=>{if(!c.signal.aborted)setError(e.message);}).finally(()=>{if(!c.signal.aborted)setLoading(false);});
  return()=>c.abort();
 },[user.id,retry]);
 function chooseTab(index){setTab(index);saveMyTab(user.id,index);}
 function edit(){if(saving)return;setDraft(account.profile);setSaveError('');setSaved(false);setEditing(!editing);}
 async function submit(event){
  event.preventDefault();if(lock.current)return;lock.current=true;setSaving(true);setSaveError('');setSaved(false);
  try{const profile=await saveProfile(draft);setAccount(prev=>({...prev,profile}));onProfileUpdate?.(profile);setEditing(false);setSaved(true);}
  catch(e){setSaveError(e.message);}finally{lock.current=false;setSaving(false);}
 }
 const {profile,problems,projects,activity,warnings,unavailable}=account;
 const sectionKeys=['mine','liked','favorites','managed'];
 const sectionMissing=!loaded||unavailable.includes(sectionKeys[tab]);
 const profileUnavailable=!loaded||unavailable.includes('profile');
 const groups=[problems.filter(p=>p.mine),problems.filter(p=>p.liked_by_me),projects.filter(p=>p.interested),projects.filter(p=>p.can_edit)];
 function openActivity(item){const row=(item.type==='problem'?problems:projects).find(p=>String(p.id)===String(item.id));if(row)(item.type==='problem'?onIssue:onProject)(row);}
 return <div className="wp-page my-page">
  <p className="code-comment">// NEEDIT<br/>// 나의 활동과 관심사를 한곳에서 관리해요</p><h1>마이페이지</h1>
  <p className="my-intro">내가 제안한 불편함, 공감한 이슈, 관심·담당 프로젝트를 확인하고 관리할 수 있어요.</p>
  {error&&<div className="api-banner error" role="alert">{error}<button onClick={()=>setRetry(n=>n+1)}>다시 불러오기</button></div>}
  {warnings.map((warning,i)=><div className="api-banner error" role="alert" key={warning.section+'-'+i}>{warning.message}<button onClick={()=>setRetry(n=>n+1)}>다시 불러오기</button></div>)}
  {loading&&<p role="status">최신 정보를 불러오는 중이에요…</p>}
  {saved&&<p role="status">프로필을 저장했어요.</p>}
  <div className="my-overview">
   <section className="my-profile wp-box"><div className="my-avatar"><Icon name="user" size={72}/><button aria-label="프로필 수정" disabled={saving||profileUnavailable} onClick={edit}><Icon name="pencil" size={17}/></button></div>
    <div className="my-profile-copy"><div><h2>{profile.name||user.name}</h2><span className="status developing">학생</span><button className="button outline" disabled={saving||profileUnavailable} onClick={edit}><Icon name="pencil" size={18}/>{editing?'닫기':'프로필 수정'}</button></div><p>{profile.bio||(profileUnavailable?'저장된 프로필을 확인하고 있어요.':'프로필 수정에서 자기소개를 추가해보세요.')}</p><small>{[profile.department,profile.year,profile.school].filter(Boolean).join(' · ')||profile.email}</small></div>
   </section>
   {labels.map((label,i)=><button className={`my-stat wp-box ${tab===i?'current':''}`} key={label} onClick={()=>chooseTab(i)}><Icon name={icons[i]} size={29}/><span>{label.replace('내가 ','')}</span><strong>{!loaded||unavailable.includes(sectionKeys[i])?'—':groups[i].length+'개'}</strong></button>)}
  </div>
  {editing&&<section className="wp-box my-edit"><h2>프로필 수정</h2><form onSubmit={submit}>
   {profileFields.map(([key,label,max])=><label key={key}>{label}<input name={key} value={draft[key]||''} disabled={saving} maxLength={max} required={key==='name'} pattern={key==='name'?'.*\\S.*':undefined} onChange={e=>setDraft(previous=>({...previous,[key]:e.target.value}))}/></label>)}
   <button className="button primary" disabled={saving}>{saving?'저장 중…':'저장하기'}</button>{saveError&&<p className="api-banner error" role="alert">{saveError}</p>}
  </form></section>}
  <div className="my-tabs" role="tablist" aria-label="나의 활동">{labels.map((label,i)=><button role="tab" id={`my-tab-${i}`} aria-controls="my-tab-panel" aria-selected={tab===i} className={tab===i?'active':''} onClick={()=>chooseTab(i)} key={label}><Icon name={icons[i]} size={24}/>{label} ({!loaded||unavailable.includes(sectionKeys[i])?'—':groups[i].length})</button>)}</div>
  <div className="my-content"><section className="wp-box" id="my-tab-panel" role="tabpanel" aria-labelledby={`my-tab-${tab}`}>
   <h2 className="my-panel-heading"><span>{labels[tab]}</span>{tab===0&&<button className="button outline" onClick={onReport}>＋ 불편함 제안하기</button>}</h2>
   <div className="my-items">{sectionMissing&&<p className="empty" role="status">{loading?'저장된 정보를 불러오는 중이에요…':'목록을 불러오지 못했어요. 다시 불러오기를 눌러주세요.'}</p>}{groups[tab].length?groups[tab].map(p=>{const linked=tab<2 ? allProjects?.find(project=>isLinkedProject(project,p)) : p; return <article className="my-project-entry" key={p.id}><button className="my-item" key={p.id} onClick={()=>tab<2?onIssue(p):onProject(p)}><span className="issue-id">#{p.id}</span><div><div className="my-item-title"><h3>{p.title}</h3>{tab<2&&<span className={"my-item-count"+(tab===1?" my-item-liked":"")}><Icon name="heart" size={20}/>{p.count}</span>}</div><p className={tab>=2?"my-service-introduction":undefined}>{tab>=2&&<strong>서비스 소개: </strong>}{p.description||(tab>=2?"아직 등록된 서비스 소개가 없어요.":"")}</p></div>{tab<2&&<span className="category">{p.category}</span>}<span className={"status "+(linked?projectStatusClass(projectDisplayStatus(linked)):"my-project-unlinked")}>{linked?projectDisplayStatus(linked):"연결 전"}</span><Icon name="arrow" size={18}/></button>{linked&&<div className="release-actions"><span className="wp-demo">개발 완료 예정일: {linked.expected_completion_date||'미정'}</span></div>}</article>;}):sectionMissing?null:<div className="my-empty"><Icon name={icons[tab]} size={36}/><h3>{['아직 등록한 불편함이 없어요','아직 공감한 불편함이 없어요','관심 등록한 프로젝트가 없어요','담당하고 있는 프로젝트가 없어요'][tab]}</h3><p>{['첫 번째 불편함을 들려주세요.','불편함 탐색에서 공감한 글이 여기에 표시돼요.','프로젝트 상세에서 관심 등록해보세요.','담당자로 지정된 프로젝트가 여기에 표시돼요.'][tab]}</p><button className="button primary" onClick={[onReport,onExplore,onBrowseProjects,onBrowseProjects][tab]}>{['불편함 제보하기','불편함 탐색하기','프로젝트 둘러보기','프로젝트 둘러보기'][tab]}</button></div>}</div>
  </section><section className="wp-box"><h2 className="my-panel-heading"><span>최근 활동</span>{activity.length>4&&<button onClick={()=>setAllActivity(!allActivity)}>{allActivity?'접기':'전체보기 →'}</button>}</h2><div className="my-activity">
   {activity.length?(allActivity?activity:activity.slice(0,4)).map(item=><button className="my-activity-row" key={item.key} onClick={()=>openActivity(item)}><span className="my-activity-dot"/><span className="my-activity-icon"><Icon name={item.icon} size={23}/></span><span><strong>{item.title}</strong><p>{item.text}</p>{item.created_at&&<small>{new Date(item.created_at).toLocaleDateString('ko-KR')}</small>}</span></button>):<div className="my-empty"><Icon name="folder" size={32}/><p>불편함을 등록하거나 공감하면<br/>활동 내역이 여기에 표시돼요.</p></div>}
  </div></section></div>
 </div>;
}
