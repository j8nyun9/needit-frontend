import {test} from 'node:test';import assert from 'node:assert/strict';import {build} from 'esbuild';import Module from 'node:module';import path from 'node:path';
const bundled=await build({stdin:{contents:"import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';import Card from './src/components/ServiceLaunchCard.jsx';export const render=p=>renderToStaticMarkup(React.createElement(Card,{project:p}));export {registerService,unpublishService} from './src/services/projects.js';",resolveDir:process.cwd()},bundle:true,platform:'node',format:'cjs',external:['react','react-dom/server'],write:false,define:{'import.meta.env':'{}'}});
const filename=path.resolve('test/service-launch.bundle.cjs');const loaded=new Module(filename);loaded.filename=filename;loaded.paths=Module._nodeModulePaths(process.cwd());loaded._compile(bundled.outputFiles[0].text,filename);const api=loaded.exports;
test('published services can be opened without login while drafts and unsafe links stay hidden',()=>{
 const card=api.render({status:'서비스 운영 중',deployment_url:'https://example.com/service'});assert.match(card,/href="https:\/\/example.com\/service"/);assert.match(card,/target="_blank"/);assert.match(card,/noopener noreferrer/);assert.match(card,/서비스 사용하기/);
 assert.equal(api.render({status:'개발 중',deployment_url:'https://example.com'}),'');assert.equal(api.render({status:'서비스 운영 중',deployment_url:'javascript:alert(1)'}),'');
});
test('service registration uses the backend and normalizes published service results',async()=>{
 const original=globalThis.fetch;
 try{globalThis.fetch=async(url,options)=>{assert.equal(url,'/api/projects');assert.equal(options.method,'POST');const body=JSON.parse(options.body);return Response.json({id:99,...body,release_status:'서비스 운영 중',can_edit:true,progress:0});};
  const project=await api.registerService({title:'Finished',description:'Demo',deployment_url:'https://example.com'});assert.equal(project.status,'서비스 운영 중');assert.equal(project.progress,100);assert.equal(project.can_edit,true);
 }finally{globalThis.fetch=original;}
});

test('withdrawal sends an authenticated POST and returns the unpublished state',async()=>{
 const old=globalThis.fetch;try{globalThis.fetch=async(url,options)=>{assert.equal(url,'/api/projects/99/unpublish');assert.equal(options.method,'POST');return Response.json({id:99,title:'Demo',release_status:'테스트 중',deployment_url:'https://example.com',released_at:null});};const p=await api.unpublishService(99);assert.equal(p.status,'테스트 중');assert.equal(p.deployment_url,'https://example.com');assert.equal(api.render(p),'');}finally{globalThis.fetch=old;}
});
