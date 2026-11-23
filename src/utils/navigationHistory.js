const signature=route=>JSON.stringify([route.tab,route.page?.type,route.page?.data?.id,Boolean(route.page?.edit)]);
const tabs=['홈','불편함 탐색','프로젝트','서비스 소개','마이페이지'];
const views=['home','explore','projects','about','mypage'];
export function readNavigationRoute(href,state={},savedTab){
 const params=new URL(href).searchParams,saved=state?.needitNavigation;
 let page=null;
 const project=params.get('project'),issue=params.get('issue'),screen=params.get('screen');
 if(project&&/^\d+$/.test(project))page={type:'project',data:{id:project}};
 else if(issue&&/^\d+$/.test(issue))page={type:params.get('edit')==='1'?'problem-edit':'problem',data:{id:issue}};
 else if(['report','login','profile'].includes(screen))page={type:screen};
 else page=saved?.page||null;
 const urlTab=tabs[views.indexOf(params.get('view'))];
 const tab=urlTab||(tabs.includes(saved?.tab)?saved.tab:page?.type==='project'?tabs[2]:['problem','problem-edit'].includes(page?.type)?tabs[1]:tabs.includes(savedTab)?savedTab:tabs[0]);
 return {tab,page,query:typeof saved?.query==='string'?saved.query:''};
}
function fallbackPage(page){
 if(!page)return null;
 if(page.type==='project-draft')return {type:'problem',data:{id:page.data.id}};
 return {...page,data:page.data?.id!=null?{id:page.data.id}:undefined,back:undefined};
}
export function navigationUrl(route,href){
 const url=new URL(href);
 for(const key of ['issue','project','edit','screen'])url.searchParams.delete(key);
 const view=views[tabs.indexOf(route.tab)];
 if(view)url.searchParams.set('view',view);
 if(['problem','problem-edit'].includes(route.page?.type))url.searchParams.set('issue',route.page.data.id);
 if(route.page?.type==='problem-edit')url.searchParams.set('edit','1');
 if(route.page?.type==='project')url.searchParams.set('project',route.page.data.id);
 if(['report','login','profile'].includes(route.page?.type))url.searchParams.set('screen',route.page.type);
 return url.href;
}
export function createNavigationHistory(initial,onRestore,browser=window){
 const snapshots=new Map(),session=Date.now().toString(36)+Math.random().toString(36).slice(2);let sequence=0,currentKey,currentSignature;
 function write(route,replace){
  const key=session+':'+(++sequence);
  snapshots.set(key,route);currentKey=key;currentSignature=signature(route);
  const state={...browser.history.state,needitNavigation:{key,tab:route.tab,page:fallbackPage(route.page),query:route.query||''}};
  browser.history[replace?'replaceState':'pushState'](state,'',navigationUrl(route,browser.location.href));
 }
 function restore(event){
  const saved=event.state?.needitNavigation;if(!saved)return;
  const route=snapshots.get(saved.key)||{tab:saved.tab,page:saved.page,query:saved.query||''};
  currentKey=saved.key;currentSignature=signature(route);onRestore(route);
 }
 write(initial,true);browser.addEventListener('popstate',restore);
 return {
  update(route){
   if(signature(route)===currentSignature){
    snapshots.set(currentKey,route);
    const state={...browser.history.state,needitNavigation:{key:currentKey,tab:route.tab,page:fallbackPage(route.page),query:route.query||''}};
    browser.history.replaceState(state,'',navigationUrl(route,browser.location.href));return;
   }
   write(route,false);
  },
  dispose(){browser.removeEventListener('popstate',restore);},
 };
}
