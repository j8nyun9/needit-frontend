import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
const output=await build({entryPoints:['src/services/problems.js'],bundle:true,platform:'node',format:'esm',write:false,define:{'import.meta.env':'{}'}});
const api=await import(`data:text/javascript;base64,${Buffer.from(output.outputFiles[0].text).toString('base64')}`);
test('AI API requests, saved results, errors and cooldowns match backend contract',async()=>{
 const original=globalThis.fetch;const calls=[];
 const row={id:42,title:'Test',content:'Real issue',category:'시설',ai_status:'success',ai_plan:{hackathonPlan:{projectName:'Plan'}}};
 try{
  globalThis.fetch=async(url,options)=>{calls.push({url,options});return new Response(JSON.stringify(row),{status:200});};
  assert.equal((await api.getProblem(42)).description,'Real issue');
  assert.equal(calls[0].url,'/api/problems/42');assert.notEqual(calls[0].options.method,'POST');
  const plan=await api.generateProblemPlan(42);assert.equal(plan.ai_plan.hackathonPlan.projectName,'Plan');
  assert.equal(calls[1].url,'/api/problems/42/plan');assert.equal(calls[1].options.method,'POST');
  for(const status of [409,429,502]){
   globalThis.fetch=async()=>new Response(JSON.stringify({error:'backend message',retry_after:37}),{status});
   await assert.rejects(api.generateProblemPlan(42),e=>e.status===status&&e.message==='backend message'&&e.retryAfter===37);
  }
  globalThis.fetch=async()=>new Response(JSON.stringify({id:42,ai_status:'failed',ai_error:{message:'generation failed'}}),{status:200});
  await assert.rejects(api.generateProblemPlan(42),/generation failed/);
 }finally{globalThis.fetch=original;}
});
