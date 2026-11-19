import React,{useId,useRef,useState} from 'react';
import {registerService,serviceUrl} from '../services/projects.js';

export default function ServiceRegistration({onCreated,onCancel}){
 const id=useId();const lock=useRef(false);const [busy,setBusy]=useState(false);const [error,setError]=useState('');
 const [data,setData]=useState({title:'',description:'',deployment_url:'',usage_guide:'',team_name:'',github_url:''});
 const update=e=>setData(previous=>({...previous,[e.target.name]:e.target.value}));
 const url=serviceUrl(data.deployment_url);
 async function submit(event){
  event.preventDefault();if(lock.current)return;lock.current=true;setBusy(true);setError('');
  try{const project=await registerService(data);onCreated(project);}catch(e){setError(e.message);}finally{lock.current=false;setBusy(false);}
 }
 return <section className="wp-box service-registration" aria-labelledby={id+'-title'}><h2 id={id+'-title'}>완성한 서비스 등록</h2><div className="wp-box-body"><p className="wp-demo">배포된 서비스 주소를 등록하면 다른 학생들이 바로 사용해볼 수 있어요.</p>
  <form onSubmit={submit}><fieldset disabled={busy}>
   <label htmlFor={id+'-name'}>서비스 이름<input id={id+'-name'} name="title" value={data.title} onChange={update} maxLength={100} required autoFocus placeholder="예: 강의실 좌석 알리미"/></label>
   <label htmlFor={id+'-description'}>서비스 소개<textarea id={id+'-description'} name="description" value={data.description} onChange={update} rows={3} maxLength={3000} required placeholder="어떤 불편함을 해결하고, 누구에게 도움이 되나요?"/></label>
   <label htmlFor={id+'-url'}>서비스 주소<input id={id+'-url'} name="deployment_url" type="url" value={data.deployment_url} onChange={update} maxLength={2000} required placeholder="https://..."/></label>
   {url&&<p className="service-url-preview">등록 후 사용자가 이동할 주소: <span>{url}</span></p>}
   <label htmlFor={id+'-guide'}>사용 방법 <span className="wp-demo">(선택)</span><textarea id={id+'-guide'} name="usage_guide" value={data.usage_guide} onChange={update} rows={3} maxLength={5000} placeholder="접속 후 이용 방법과 별도 로그인 필요 여부를 알려주세요."/></label>
   <div className="service-registration__optional"><label htmlFor={id+'-team'}>개발 팀 <span className="wp-demo">(선택)</span><input id={id+'-team'} name="team_name" value={data.team_name} onChange={update} maxLength={100}/></label><label htmlFor={id+'-github'}>GitHub 주소 <span className="wp-demo">(선택)</span><input id={id+'-github'} name="github_url" type="url" value={data.github_url} onChange={update} maxLength={2000} placeholder="https://github.com/..."/></label></div>
   <p className="wp-demo">등록하면 ‘서비스 운영 중’으로 공개돼요. 이후 프로젝트 상세에서 주소와 사용 방법을 수정할 수 있어요.</p>
   <div className="release-actions"><button className="button primary" type="submit">{busy?'공개 중…':'서비스 공개하기'}</button><button className="button outline" type="button" onClick={onCancel}>취소</button></div>
  </fieldset>{error&&<p role="alert" className="release-error">{error}</p>}</form>
 </div></section>;
}
