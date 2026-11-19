import {test} from 'node:test';import assert from 'node:assert/strict';import {build} from 'esbuild';
const output=await build({entryPoints:['src/services/problems.js'],bundle:true,platform:'node',format:'esm',write:false,define:{'import.meta.env':'{}'}});
const api=await import('data:text/javascript;base64,'+Buffer.from(output.outputFiles[0].text).toString('base64'));
test('deletion uses DELETE, accepts empty success and preserves actionable authorization errors',async()=>{
 const old=globalThis.fetch;
 try{
  globalThis.fetch=async(url,options)=>{assert.equal(url,'/api/problems/7');assert.equal(options.method,'DELETE');return new Response(null,{status:204});};
  assert.equal(await api.deleteProblem(7),null);
  globalThis.fetch=async()=>Response.json({error:'Only the author can delete'},{status:403});
  await assert.rejects(api.deleteProblem(7),e=>e.status===403&&e.message==='Only the author can delete');
  globalThis.fetch=async()=>Response.json({error:'DB unavailable'},{status:503});
  await assert.rejects(api.deleteProblem(7),e=>e.status===503&&e.message==='DB unavailable');
 }finally{globalThis.fetch=old;}
});
