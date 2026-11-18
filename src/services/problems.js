import { normalizeProblemCategory } from './problemCategories.js';

const base=(import.meta.env.VITE_API_BASE_URL||(import.meta.env.PROD?'https://needit-backend-d3lv.onrender.com/api':'/api')).replace(/\/$/,'');
export function normalizeProblem(row){return {...row,description:row.content||'',category:normalizeProblemCategory(row.category),count:Number(row.likes_count??row.count??0)};}
async function request(path,options={}){
 let response;
 try{response=await fetch(`${base}${path}`,{...options,signal:options.signal||AbortSignal.timeout(90000)});}catch(error){if(options.signal?.aborted)throw error;throw new Error('백엔드에 연결하지 못했어요. 서버 실행 및 연결 설정을 확인해주세요.');}
 const body=await response.json().catch(()=>null);
 if(!response.ok){
  if(response.status===404)throw new Error('불편함 API 경로를 찾지 못했어요 (404). 프론트 개발 서버를 재시작하고 백엔드의 /api/problems 경로를 확인해주세요.');
  if(response.status===400)throw new Error(body?.error||'입력 내용을 확인해주세요.');
  if(response.status===401||response.status===403)throw new Error(`API 접근이 거부됐어요 (${response.status}). 서버의 인증 및 접근 권한을 확인해주세요.`);
  throw new Error(`서버 오류가 발생했어요 (${response.status}). 백엔드 로그와 DB 연결 상태를 확인해주세요.`);
 }
 return body;
}
export async function listProblems(signal){const rows=await request('/problems',{signal});if(!Array.isArray(rows))throw new Error('불편함 목록 응답 형식이 올바르지 않아요.');return rows.map(normalizeProblem);}
export async function createProblem(data){const row=await request('/problems',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title:data.title.trim(),content:data.description.trim(),category:data.category})});if(row?.id==null)throw new Error('등록 결과를 확인하지 못했어요. 목록에서 확인해주세요.');return normalizeProblem(row);}
