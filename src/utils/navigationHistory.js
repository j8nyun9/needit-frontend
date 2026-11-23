const signature=route=>JSON.stringify([route.tab,route.page?.type,route.page?.data?.id,Boolean(route.page?.edit)]);
function fallbackPage(page){
 if(!page)return null;
 if(page.type==='project-draft')return {type:'problem',data:{id:page.data.id}};
 return {...page,data:page.data?.id!=null?{id:page.data.id}:undefined,back:undefined};
}
export function navigationUrl(route,href){
 const url=new URL(href);
 for(const key of ['issue','project','edit'])url.searchParams.delete(key);
 if(['problem','problem-edit'].includes(route.page?.type))url.searchParams.set('issue',route.page.data.id);
 if(route.page?.type==='problem-edit')url.searchParams.set('edit','1');
 if(route.page?.type==='project')url.searchParams.set('project',route.page.data.id);
 return url.href;
}
export function createNavigationHistory(initial,onRestore,browser=window){
 const snapshots=new Map(),session=Date.now().toString(36)+Math.random().toString(36).slice(2);let sequence=0,currentKey,currentSignature;
 function write(route,replace){
  const key=session+':'+(++sequence);
  snapshots.set(key,route);currentKey=key;currentSignature=signature(route);
  const state={...browser.history.state,needitNavigation:{key,tab:route.tab,page:fallbackPage(route.page)}};
  browser.history[replace?'replaceState':'pushState'](state,'',navigationUrl(route,browser.location.href));
 }
 function restore(event){
  const saved=event.state?.needitNavigation;if(!saved)return;
  const route=snapshots.get(saved.key)||{tab:saved.tab,page:saved.page,query:''};
  currentKey=saved.key;currentSignature=signature(route);onRestore(route);
 }
 write(initial,true);browser.addEventListener('popstate',restore);
 return {
  update(route){
   if(signature(route)===currentSignature){snapshots.set(currentKey,route);return;}
   write(route,false);
  },
  dispose(){browser.removeEventListener('popstate',restore);},
 };
}
