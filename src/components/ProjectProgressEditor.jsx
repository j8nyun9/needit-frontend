import React,{useState,useRef} from 'react';
import {saveProjectProgress,releaseStatuses} from '../services/projects.js';
export default function ProjectProgressEditor({project,onSaved}){
 const [status,setStatus]=useState(project.release_status||project.status||releaseStatuses[0]);
 const [date,setDate]=useState(project.expected_completion_date||'');
 const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [message,setMessage]=useState('');const lock=useRef(false);
 return <form className="release-progress-editor" onSubmit={async e=>{e.preventDefault();if(lock.current)return;lock.current=true;setBusy(true);setError('');setMessage('');try{const row=await saveProjectProgress(project.id,{release_status:status,expected_completion_date:date||null});onSaved(row);setMessage('프로젝트 상태와 예정일을 저장했어요.');}catch(e){setError(e.message);}finally{lock.current=false;setBusy(false);}}}>
 <fieldset disabled={busy}><label>프로젝트 상태<select value={status} onChange={e=>setStatus(e.target.value)}>{releaseStatuses.map(s=><option key={s}>{s}</option>)}</select></label>
 <label>개발 완료 예정일<input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label><p className="wp-demo">예정일이 지나도 상태는 자동으로 바뀌지 않아요. 서비스 운영 중으로 변경하려면 서비스 주소를 먼저 등록해주세요.</p><button className="button outline" type="submit">{busy?'저장 중…':'상태·예정일 저장'}</button></fieldset>{error&&<p role="alert" className="release-error">{error}</p>}{message&&<p role="status">{message}</p>}</form>;
}
