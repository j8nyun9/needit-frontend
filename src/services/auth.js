const base=(import.meta.env.VITE_API_BASE_URL||(import.meta.env.PROD?'https://needit-backend.onrender.com/api':'/api')).replace(/\/$/,'');
const key='needit-auth-token';
let memoryToken='';
export function getToken(){try{return sessionStorage.getItem(key)||memoryToken;}catch{return memoryToken;}}
function setToken(value){memoryToken=value;try{if(value)sessionStorage.setItem(key,value);else sessionStorage.removeItem(key);}catch{/* This tab still works if browser storage is unavailable. */}}
async function request(path,options={}){let res;try{res=await fetch(`${base}/auth${path}`,{...options,headers:{'Content-Type':'application/json',...(getToken()?{Authorization:`Bearer ${getToken()}`}:{})},signal:AbortSignal.timeout(90000)});}catch{throw new Error('로그인 서버에 연결하지 못했어요. 잠시 후 다시 시도해주세요.');}const body=res.status===204?null:await res.json().catch(()=>null);if(!res.ok){if(res.status===401)setToken('');const error=new Error(body?.error||(res.status===404?'로그인 API가 배포되지 않았어요. 백엔드 재배포가 필요해요.':'로그인 요청을 처리하지 못했어요.'));error.status=res.status;throw error;}return body;}
export async function login(email,password){const data=await request('/login',{method:'POST',body:JSON.stringify({email,password})});if(!data?.accessToken||!data?.user?.id)throw new Error('로그인 응답 형식이 올바르지 않아요.');setToken(data.accessToken);return data.user;}
export async function currentUser(){if(!getToken())return null;try{return (await request('/me')).user;}catch(error){if(error.status===401)return null;throw error;}}
export async function logout(){try{await request('/logout',{method:'POST'});}finally{setToken('');}}
