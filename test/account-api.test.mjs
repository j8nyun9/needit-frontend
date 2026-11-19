import {test} from 'node:test';import assert from 'node:assert/strict';import {build} from 'esbuild';
const output=await build({entryPoints:['src/services/account.js'],bundle:true,platform:'node',format:'esm',write:false,define:{'import.meta.env':'{}'}});
const api=await import('data:text/javascript;base64,'+Buffer.from(output.outputFiles[0].text).toString('base64'));
test('account reloads persisted data and profile saves use the authenticated API',async()=>{
 const original=globalThis.fetch;const data={profile:{id:'alice',name:'Alice'},problems:[{id:1,content:'Saved post',mine:true,liked_by_me:true,likes_count:3}],projects:[{id:2,summary:'Saved project',release_status:'서비스 운영 중',interested:true,can_edit:false}],activity:[{id:1,key:'post-1'}]};
 try{
  globalThis.fetch=async(url,options)=>{assert.equal(url,'/api/account');return Response.json(data);};
  const first=await api.getAccount();assert.equal(first.problems[0].mine,true);assert.equal(first.problems[0].count,3);assert.equal(first.problems[0].description,'Saved post');assert.equal(first.projects[0].interested,true);
  assert.deepEqual(await api.getAccount(),first);
  globalThis.fetch=async(url,options)=>{assert.equal(url,'/api/account/profile');assert.equal(options.method,'PUT');return Response.json({...data.profile,...JSON.parse(options.body)});};
  assert.equal((await api.saveProfile({name:'New Alice',bio:'Saved'})).name,'New Alice');
  globalThis.fetch=async()=>Response.json({error:'temporarily unavailable'},{status:503});await assert.rejects(api.getAccount(),e=>e.status===503);
 }finally{globalThis.fetch=original;}
});
test('selected MyPage tabs are restored separately for each user',()=>{
 const old=globalThis.sessionStorage;const storage=new Map();globalThis.sessionStorage={getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)};
 try{api.saveMyTab('alice',2);api.saveMyTab('bob',1);assert.equal(api.readMyTab('alice'),2);assert.equal(api.readMyTab('bob'),1);assert.equal(api.readMyTab('charlie'),0);storage.set('needit-my-tab:alice','99');assert.equal(api.readMyTab('alice'),0);}finally{if(old===undefined)delete globalThis.sessionStorage;else globalThis.sessionStorage=old;}
});
test('malformed optional rows and profile fields cannot crash the MyPage render',()=>{
 const data=api.normalizeAccount({profile:{id:'alice',name:{invalid:true}},problems:[null,{id:7,title:'Saved',content:{invalid:true}}],projects:[null],activity:[null,{id:7,title:{invalid:true},text:null}]});
 assert.equal(data.profile.name,'');assert.equal(data.problems.length,1);assert.equal(data.problems[0].description,'');assert.equal(data.projects.length,0);assert.equal(data.activity[0].title,'');assert.deepEqual(data.warnings,[]);
 assert.throws(()=>api.normalizeAccount({profile:null}),/마이페이지/);
});
