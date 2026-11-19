import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
const output=await build({stdin:{contents:"export * from './src/services/auth.js';export {apiRequest} from './src/services/problems.js';",resolveDir:process.cwd()},bundle:true,platform:'node',format:'esm',write:false,define:{'import.meta.env':'{}'}});
const code=Buffer.from(output.outputFiles[0].text).toString('base64');
test('browser session survives reload and refreshes once for concurrent expired API calls',async()=>{
 const originalFetch=globalThis.fetch,originalStorage=globalThis.sessionStorage;const storage=new Map();let calls=0;
 globalThis.sessionStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)};
 const body={user:{id:'alice',name:'Alice'},accessToken:'old-token',refreshToken:'refresh-1'};
 try{
  globalThis.fetch=async(url,options)=>{
   if(url.endsWith('/auth/login'))return Response.json(body);
   if(url.endsWith('/auth/me'))return Response.json({error:'expired'},{status:401});
   if(url.endsWith('/auth/refresh')){calls++;assert.equal(JSON.parse(options.body).refreshToken,calls===1?'refresh-1':'refresh-2');return Response.json({...body,accessToken:'new-token',refreshToken:'refresh-2'});}
   if(url.endsWith('/auth/logout'))return new Response(null,{status:204});
   return options.headers.Authorization==='Bearer new-token'?Response.json({ok:true}):Response.json({error:'expired'},{status:401});
  };
  const api=await import('data:text/javascript;base64,'+code+'#first');
  await api.login('x','y');assert.equal(storage.get('needit-auth-refresh'),'refresh-1');
  await Promise.all([api.apiRequest('/test'),api.apiRequest('/test')]);assert.equal(calls,1);assert.equal(api.getToken(),'new-token');
  const reloaded=await import('data:text/javascript;base64,'+code+'#reload');assert.equal(reloaded.getToken(),'new-token');assert.equal((await reloaded.currentUser()).id,'alice');
  await reloaded.logout();assert.equal(reloaded.getToken(),'');assert.equal(storage.size,0);
  assert.equal(await reloaded.currentUser(),null);
 }finally{globalThis.fetch=originalFetch;if(originalStorage===undefined)delete globalThis.sessionStorage;else globalThis.sessionStorage=originalStorage;}
});
test('temporary refresh failures keep credentials; invalid refresh tokens clear them',async()=>{
 const oldFetch=globalThis.fetch,oldStorage=globalThis.sessionStorage;const store=new Map([['needit-auth-token','expired'],['needit-auth-refresh','refresh']]);
 globalThis.sessionStorage={getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)};
 try{
  const api=await import('data:text/javascript;base64,'+code+'#errors');
  globalThis.fetch=async()=>Response.json({error:'temporary'},{status:503});
  await assert.rejects(api.refreshSession(),e=>e.status===503);assert.equal(store.get('needit-auth-refresh'),'refresh');
  globalThis.fetch=async()=>Response.json({error:'revoked'},{status:401});
  await assert.rejects(api.refreshSession(),e=>e.status===401);assert.equal(store.size,0);
 }finally{globalThis.fetch=oldFetch;if(oldStorage===undefined)delete globalThis.sessionStorage;else globalThis.sessionStorage=oldStorage;}
});
