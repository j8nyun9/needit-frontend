const base=(import.meta.env.VITE_API_BASE_URL||(import.meta.env.PROD?'https://needit-backend-d3lv.onrender.com/api':'/api')).replace(/\/$/,'');
const tokenKey='needit-auth-token';
const refreshKey='needit-auth-refresh';
let memoryToken='',memoryRefresh='',refreshing=null,generation=0;
function stored(key,fallback){try{return sessionStorage.getItem(key)||fallback;}catch{return fallback;}}
export function getToken(){return stored(tokenKey,memoryToken);}
function getRefreshToken(){return stored(refreshKey,memoryRefresh);}
function saveTokens(token='',refresh=''){
 memoryToken=token;memoryRefresh=refresh;
 try{for(const [key,value] of [[tokenKey,token],[refreshKey,refresh]]){if(value)sessionStorage.setItem(key,value);else sessionStorage.removeItem(key);}}catch{/* The current tab still works without browser storage. */}
}
async function request(path,options={}){
 let response;
 try{response=await fetch(`${base}/auth${path}`,{...options,headers:{'Content-Type':'application/json',...(getToken()?{Authorization:`Bearer ${getToken()}`}:{})},signal:AbortSignal.timeout(90000)});}
 catch{throw new Error('로그인 서버에 연결하지 못했어요. 잠시 후 다시 시도해주세요.');}
 const body=response.status===204?null:await response.json().catch(()=>null);
 if(!response.ok){const error=new Error(body?.error||'로그인 요청을 처리하지 못했어요.');error.status=response.status;throw error;}
 return body;
}
function acceptSession(data){
 if(!data?.accessToken||!data?.refreshToken||!data?.user?.id)throw new Error('로그인 응답 형식이 올바르지 않아요. 최신 백엔드 배포를 확인해주세요.');
 saveTokens(data.accessToken,data.refreshToken);return data.user;
}
export async function login(email,password){
 const version=++generation;
 const data=await request('/login',{method:'POST',body:JSON.stringify({email,password})});
 if(version!==generation)throw new Error('로그인 요청이 취소됐어요. 다시 시도해주세요.');
 return acceptSession(data);
}
export async function refreshSession(){
 if(refreshing)return refreshing;
 const refreshToken=getRefreshToken();
 if(!refreshToken){const e=new Error('다시 로그인해주세요.');e.status=401;throw e;}
 const version=generation;
 const task=(async()=>{
  try{
   const data=await request('/refresh',{method:'POST',body:JSON.stringify({refreshToken})});
   if(version!==generation){const e=new Error('로그인이 종료됐어요.');e.status=401;throw e;}
   return acceptSession(data);
  }catch(e){if(e.status===401&&version===generation){generation++;saveTokens();}throw e;}
 })();
 refreshing=task;
 try{return await task;}finally{if(refreshing===task)refreshing=null;}
}
export async function currentUser(){
 if(!getToken()&&!getRefreshToken())return null;
 try{return (await request('/me')).user;}
 catch(e){if(e.status!==401)throw e;try{return await refreshSession();}catch(error){if(error.status===401)return null;throw error;}}
}
export async function logout(){
 generation++;
 try{await request('/logout',{method:'POST'});}finally{saveTokens();}
}
