import {test} from 'node:test';import assert from 'node:assert/strict';import http from 'node:http';import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import {execFile} from 'node:child_process';
const browser=['C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(p=>fs.existsSync(p));const root=path.resolve('dist');
test('developer registers a service, opens its launch link and withdraws it after confirmation',{skip:!browser||!fs.existsSync(path.join(root,'index.html'))},async t=>{
 const script=`<script>
 sessionStorage.setItem('needit-auth-token','browser-test');sessionStorage.setItem('needit-active-tab','프로젝트');
 window.__errors=[];window.__posted=null;window.__publishedUrl=null;window.__withdrawn=false;let created;
 window.addEventListener('error',e=>window.__errors.push(e.message));window.addEventListener('unhandledrejection',e=>window.__errors.push(String(e.reason)));
 window.fetch=async(url,options={})=>{
  if(String(url).endsWith('/auth/me'))return Response.json({user:{id:'alice',name:'Alice'}});
  if(String(url).endsWith('/projects')&&options.method==='POST'){window.__posted=JSON.parse(options.body);created={id:99,...window.__posted,release_status:'서비스 운영 중',can_edit:true,progress:100,related_problems:[],feedback:[]};return Response.json(created,{status:201});}
  if(String(url).endsWith('/projects/99/unpublish')&&options.method==='POST'){window.__withdrawn=true;created={...created,release_status:'테スト中',released_at:null};return Response.json(created);}
  if(String(url).endsWith('/projects/99'))return Response.json(created);
  return Response.json([]);
 };
 let step=0;const flow=setInterval(()=>{
  if(step===0&&document.querySelector('.header-user')){const button=[...document.querySelectorAll('button')].find(b=>b.textContent.includes('완성한 서비스 등록'));if(button){button.click();step=1;}}
  else if(step===1){const form=document.querySelector('.service-registration form');if(form){for(const [name,value]of Object.entries({title:'Browser service',description:'Completed service description',deployment_url:'https://example.com/demo'})){const input=form.elements.namedItem(name);const proto=input.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(input,value);input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));}step=2;}}
  else if(step===2){document.querySelector('.service-registration button[type=submit]')?.click();step=3;}
  else if(step===3){const link=document.querySelector('.service-launch a');if(link){window.__publishedUrl=link.href;document.querySelector('.service-unpublish-trigger')?.click();step=4;}}
  else if(step===4){const confirm=document.querySelector('.service-unpublish-dialog[open] .service-unpublish-confirm');if(confirm){confirm.click();step=5;}}
 },150);
 setTimeout(()=>{clearInterval(flow);const pre=document.createElement('pre');pre.id='service-browser-result';pre.textContent=JSON.stringify({step,main:document.querySelector('main')?.innerText.slice(0,600),fields:[...document.querySelectorAll('.service-registration input,.service-registration textarea')].map(i=>({name:i.name,value:i.value,valid:i.checkValidity()})),errors:window.__errors,posted:window.__posted,withdrawn:window.__withdrawn,publishedUrl:window.__publishedUrl,title:document.querySelector('main h1')?.textContent,url:document.querySelector('.service-launch a')?.getAttribute('href'),target:document.querySelector('.service-launch a')?.target});document.body.appendChild(pre);},3500);
 </script>`;
 const server=http.createServer((req,res)=>{const url=new URL(req.url,'http://local');const file=url.pathname==='/'?path.join(root,'index.html'):path.join(root,url.pathname.slice(1));if(!file.startsWith(root+path.sep)){res.writeHead(404).end();return;}try{const ext=path.extname(file);res.setHeader('Content-Type',ext==='.js'?'text/javascript':ext==='.css'?'text/css':'text/html');let body=fs.readFileSync(file);if(ext==='.html')body=body.toString().replace('<head>','<head>'+script);res.end(body);}catch{res.writeHead(404).end();}});
 server.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));t.after(()=>server.close());
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'needit-register-browser-'));
 const html=await new Promise((resolve,reject)=>execFile(browser,['--headless','--disable-gpu','--no-sandbox','--no-first-run','--disable-background-networking','--user-data-dir='+dir,'--dump-dom','--virtual-time-budget=5000',`http://127.0.0.1:${server.address().port}/`],{windowsHide:true,timeout:30000,maxBuffer:2e6},(e,out)=>e?reject(e):resolve(out)));
 const raw=html.match(/<pre id="service-browser-result">([\s\S]*?)<\/pre>/)?.[1];assert.ok(raw,'Browser completed registration flow');const data=JSON.parse(raw.replaceAll('&quot;','"').replaceAll('&amp;','&').replaceAll('&lt;','<').replaceAll('&gt;','>'));
 assert.deepEqual(data.errors,[]);assert.ok(data.posted,JSON.stringify(data));assert.equal(data.posted?.title,'Browser service');assert.equal(data.title,'Browser service');assert.equal(data.publishedUrl,'https://example.com/demo');assert.equal(data.withdrawn,true);assert.equal(data.url,undefined);assert.match(data.main,/테스트 중/);
});
