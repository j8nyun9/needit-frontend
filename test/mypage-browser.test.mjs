import {test} from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {execFile} from 'node:child_process';
const browser=['C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(p=>fs.existsSync(p));
const root=path.resolve('dist');
test('MyPage mounts in a browser while restoring login and loading account data',{skip:!browser||!fs.existsSync(path.join(root,'index.html'))},async t=>{
 const inject=`<script>
 sessionStorage.setItem('needit-auth-token','browser-test');sessionStorage.setItem('needit-active-tab','마이페이지');
 window.__errors=[];window.addEventListener('error',e=>window.__errors.push(e.message));window.addEventListener('unhandledrejection',e=>window.__errors.push(String(e.reason)));
 const scenario=new URL(location.href).searchParams.get('scenario');
 window.fetch=async(url)=>{
  if(String(url).endsWith('/auth/me'))return Response.json({user:{id:'alice',name:'Alice',email:'alice@example.com'}});
  if(String(url).endsWith('/account')){
   if(scenario==='unavailable')return Response.json({error:'Account temporarily unavailable'},{status:503});
   const data={profile:{id:'alice',name:'Alice',email:'alice@example.com',bio:'Saved profile'},problems:[{id:7,title:'My saved issue',content:'Persisted content',mine:true,likes_count:3}],projects:[],activity:[]};
   if(scenario==='partial'){data.unavailable=['favorites','managed'];data.warnings=[{section:'favorites',message:'Project section unavailable'}];}
   if(scenario==='malformed'){data.profile.name={bad:true};data.problems.unshift(null);}
   return Response.json(data);
  }
  return Response.json([]);
 };
 setTimeout(()=>{const p=document.createElement('pre');p.id='browser-result';p.textContent=JSON.stringify({errors:window.__errors,overview:!!document.querySelector('.my-overview'),main:document.querySelector('main')?.innerText||''});document.body.appendChild(p);},2500);
 </script>`;
 const server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://local');const file=url.pathname==='/'?path.join(root,'index.html'):path.join(root,url.pathname.slice(1));
  if(!file.startsWith(root+path.sep)&&file!==path.join(root,'index.html')){res.writeHead(404).end();return;}
  try{const ext=path.extname(file);res.setHeader('Content-Type',ext==='.js'?'text/javascript':ext==='.css'?'text/css':'text/html');let body=fs.readFileSync(file);if(ext==='.html')body=body.toString().replace('<head>','<head>'+inject);res.end(body);}catch{res.writeHead(404).end();}
 });
 server.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));t.after(()=>server.close());
 for(const scenario of ['normal','unavailable','partial','malformed'])await t.test(scenario,async()=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'needit-mypage-browser-'));
 const html=await new Promise((resolve,reject)=>execFile(browser,['--headless','--disable-gpu','--no-sandbox','--no-first-run','--disable-background-networking','--user-data-dir='+temp,'--dump-dom','--virtual-time-budget=5000',`http://127.0.0.1:${server.address().port}/?scenario=${scenario}`],{windowsHide:true,timeout:30000,maxBuffer:2e6},(error,stdout,stderr)=>error?reject(new Error(error.message+' '+stderr.slice(-300))):resolve(stdout)));
 const raw=html.match(/<pre id="browser-result">([\s\S]*?)<\/pre>/)?.[1];assert.ok(raw,'Browser completed the page load');
 const result=JSON.parse(raw.replaceAll('&quot;','"').replaceAll('&amp;','&').replaceAll('&lt;','<').replaceAll('&gt;','>'));
 assert.deepEqual(result.errors,[]);assert.equal(result.overview,true);
 if(scenario==='unavailable'){assert.match(result.main,/Account temporarily unavailable/);assert.match(result.main,/Alice/);}
 else{assert.match(result.main,/My saved issue/);assert.match(result.main,/Saved profile/);}
 if(scenario==='partial')assert.match(result.main,/Project section unavailable/);
 });
});
