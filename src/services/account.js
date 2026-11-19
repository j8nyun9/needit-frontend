import {apiRequest,normalizeProblem} from './problems.js';
import {normalizeProject} from './projects.js';
export function emptyAccount(user){return {profile:{id:user.id,name:user.name||'내 프로필',email:user.email||'',bio:'',department:'',year:'',school:''},problems:[],projects:[],activity:[],warnings:[],unavailable:[]};}
const text=value=>typeof value==='string'?value:'';
export function normalizeAccount(data){
 if(!data?.profile?.id||!Array.isArray(data.problems)||!Array.isArray(data.projects)||!Array.isArray(data.activity))throw new Error('마이페이지 정보를 확인하지 못했어요. 다시 시도해주세요.');
 return {...data,profile:{id:data.profile.id,...Object.fromEntries(['name','email','bio','department','year','school'].map(key=>[key,text(data.profile[key])]))},
  problems:data.problems.filter(p=>p&&p.id!=null).map(p=>normalizeProblem({...p,title:text(p.title),content:text(p.content)})),
  projects:data.projects.filter(p=>p&&p.id!=null).map(p=>normalizeProject({...p,title:text(p.title),description:text(p.description),summary:text(p.summary),release_status:text(p.release_status),status:text(p.status)})),
  activity:data.activity.filter(a=>a&&a.id!=null).map(a=>({...a,title:text(a.title),text:text(a.text),icon:text(a.icon)||'folder'})),
  warnings:Array.isArray(data.warnings)?data.warnings.filter(w=>w&&typeof w.message==='string'):[],
  unavailable:Array.isArray(data.unavailable)?data.unavailable:[],
 };
}
export async function getAccount(signal){
 const data=await apiRequest('/account',{signal});
 return normalizeAccount(data);
}
export function saveProfile(data){return apiRequest('/account/profile',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});}
export function readMyTab(userId){try{const n=Number(sessionStorage.getItem('needit-my-tab:'+userId));return Number.isInteger(n)&&n>=0&&n<4?n:0;}catch{return 0;}}
export function saveMyTab(userId,tab){try{sessionStorage.setItem('needit-my-tab:'+userId,String(tab));}catch{/* UI preference only. */}}
