import {apiRequest} from './problems.js';
export const releaseStatuses=['기획 중','개발 중','테스트 중','서비스 운영 중'];
export function serviceUrl(value){try{const u=new URL(value);return ['http:','https:'].includes(u.protocol)&&!u.username&&!u.password?u.href:null;}catch{return null;}}
export function normalizeProject(p){return {...p,description:p.description||p.summary||'',status:p.release_status||p.status,progress:p.release_status==='서비스 운영 중'?100:Number(p.progress||0)};}
export async function listProjects(signal){const rows=await apiRequest('/projects',{signal});if(!Array.isArray(rows))throw new Error('프로젝트 목록 형식이 올바르지 않아요.');return rows.map(normalizeProject);}
export async function getProject(id,signal){return normalizeProject(await apiRequest(`/projects/${encodeURIComponent(id)}`,{signal}));}
export async function saveProject(id,data){return normalizeProject(await apiRequest(`/projects/${encodeURIComponent(id)}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}));}
export const favoriteProject=(id,interested)=>apiRequest(`/projects/${encodeURIComponent(id)}/favorite`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({interested})});
export const postFeedback=(id,data)=>apiRequest(`/projects/${encodeURIComponent(id)}/feedback`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
export const listNotifications=signal=>apiRequest('/projects/notifications',{signal});
export const readNotification=id=>apiRequest(`/projects/${encodeURIComponent(id)}/read`,{method:'POST'});
