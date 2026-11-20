import {getToken,refreshSession} from './auth.js';
export {request as apiRequest};
export function deleteProblem(id){return request(`/problems/${encodeURIComponent(id)}`,{method:'DELETE'});}
export async function setProblemLike(id,liked){
 const row=await request(`/problems/${encodeURIComponent(id)}/likes/me`,{method:liked?'PUT':'DELETE'});
 if(typeof row?.liked_by_me!=='boolean'||row.likes_count==null||!Number.isFinite(Number(row.likes_count))||Number(row.likes_count)<0)throw new Error('공감 저장 결과를 확인하지 못했어요. 다시 시도해주세요.');
 return {...row,likes_count:Number(row.likes_count)};
}
import { normalizeProblemCategory } from './problemCategories.js';

const base=(import.meta.env.VITE_API_BASE_URL||(import.meta.env.PROD?'https://needit-backend-d3lv.onrender.com/api':'/api')).replace(/\/$/,'');
export function normalizeProblem(row){return {...row,description:row.content||'',category:normalizeProblemCategory(row.category),count:Number(row.likes_count??row.count??0)};}
async function request(path,options={},retried=false){
 const sentToken=getToken();
 options={...options,headers:{...options.headers,...(getToken()?{Authorization:'Bearer '+getToken()}:{})}};
 let response;
 try{response=await fetch(`${base}${path}`,{...options,signal:options.signal?AbortSignal.any([options.signal,AbortSignal.timeout(90000)]):AbortSignal.timeout(90000)});}catch(error){if(options.signal?.aborted)throw error;throw new Error('백엔드에 연결하지 못했어요. 서버 실행 및 연결 설정을 확인해주세요.');}
 const body=await response.json().catch(()=>null);
 if(response.status===401&&!retried){
  if(options.signal?.aborted)throw options.signal.reason;
  try{if(!getToken()||getToken()===sentToken)await refreshSession();}
  catch(error){
   if(error.status===401&&typeof window!=='undefined')window.dispatchEvent(new Event('needit-auth-expired'));
   throw error;
  }
  return request(path,options,true);
 }
 if(!response.ok){
  const message=response.status===404?'요청한 불편함 또는 AI API를 찾지 못했어요. 최신 백엔드 배포를 확인해주세요.':body?.ai_error?.message||body?.error||`서버 오류가 발생했어요 (${response.status}).`;
  if(response.status===401&&typeof window!=='undefined')window.dispatchEvent(new Event('needit-auth-expired'));
  const error=new Error(message);error.status=response.status;
  const wait=Number(body?.retry_after||response.headers.get('Retry-After'));
  if(Number.isFinite(wait)&&wait>0)error.retryAfter=wait;
  throw error;
 }
 return body;
}
export async function listProblems(signal){const rows=await request('/problems',{signal});if(!Array.isArray(rows))throw new Error('불편함 목록 응답 형식이 올바르지 않아요.');return rows.map(normalizeProblem);}
export async function createProblem(data){const row=await request('/problems',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title:data.title.trim(),content:data.description.trim(),category:data.category})});if(row?.id==null)throw new Error('등록 결과를 확인하지 못했어요. 목록에서 확인해주세요.');return normalizeProblem(row);}

export async function getProblem(id,signal){const row=await request(`/problems/${encodeURIComponent(id)}`,{signal});if(row?.id==null)throw new Error('불편함 조회 응답이 올바르지 않아요.');return normalizeProblem(row);}
export async function generateProblemPlan(id,signal){const row=await request(`/problems/${encodeURIComponent(id)}/plan`,{method:'POST',signal});if(!row?.ai_plan?.hackathonPlan||row.ai_status==='failed')throw new Error(row?.ai_error?.message||'AI 기획안 생성 결과를 확인하지 못했어요.');return normalizeProblem(row);}

export async function listProblemComments(id, signal) {
  const rows = await request('/problems/' + encodeURIComponent(id) + '/comments', { signal });
  if (!Array.isArray(rows)) throw new Error('댓글 목록 응답 형식이 올바르지 않아요.');
  return rows;
}

export async function createProblemComment(id, content, signal) {
  const row = await request('/problems/' + encodeURIComponent(id) + '/comments', {
    method: 'POST', signal, headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: content.trim() }),
  });
  if (row?.id == null || typeof row.content !== 'string') throw new Error('서버의 댓글 등록 결과를 확인하지 못했어요.');
  return row;
}

export function deleteProblemComment(id, commentId, signal) {
  return request('/problems/' + encodeURIComponent(id) + '/comments/' + encodeURIComponent(commentId), {
    method: 'DELETE', signal,
  });
}
