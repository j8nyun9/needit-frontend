const text=value=>typeof value==='string'?value.trim():'';
const cleanTitle=value=>text(value).replace(/^#{1,6}\s+/, '');
export function notionPlanMarkdown(problem,plan){
 if(plan?.swCategory==='difficult')return ['**해결 가능성:** 소프트웨어만으로 해결하기 어려움',text(plan.swReason)].filter(Boolean).join('\n\n');
 const d=plan?.hackathonPlan;if(!d)return '';
 const blocks=[];
 const add=(heading,contents)=>{const rows=contents.filter(Boolean);if(rows.length)blocks.push('## '+heading,...rows);};
 const list=items=>Array.isArray(items)?items.map(text).filter(Boolean).map(x=>'- '+x).join('\n'):'';
 const name=cleanTitle(d.projectName);
 const labels={direct:'소프트웨어로 직접 해결 가능',partial:'소프트웨어로 부분 해결 가능',difficult:'소프트웨어만으로 해결하기 어려움'};
 add('1. 아이디어 개요',[name?'**서비스명:** '+name:'']);
 add('2. 기획 배경 및 문제 정의',[
  plan.swCategory?'**해결 가능성:** '+(labels[plan.swCategory]||text(plan.swCategory)):'',
  text(plan.swReason)
 ]);
 add('3. 서비스 소개',[text(d.solution)]);
 add('4. 핵심 기능',[list(d.features)]);
 add('7. MVP 개발 범위',[text(d.mvpScope),text(d.difficulty)?'**개발 난이도:** '+text(d.difficulty):'']);
 add('8. 예상 기술 스택',[list(d.techStack)]);
 add('9. 예상 리스크 및 대응 방안',[text(plan.alternativeApproach)?'**대안·우회 방안:**\n'+text(plan.alternativeApproach):'']);
 return blocks.join('\n\n');
}

const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
export function notionPlanHtml(markdown){
 return markdown.split('\n\n').map(block=>{
  const heading=block.match(/^(#{1,3}) (.*)$/);if(heading)return '<h'+heading[1].length+'>'+escape(heading[2])+'</h'+heading[1].length+'>';
  if(block.startsWith('- '))return '<ul>'+block.split('\n').map(line=>'<li>'+escape(line.slice(2))+'</li>').join('')+'</ul>';
  return '<p>'+escape(block).replaceAll('\n','<br>')+'</p>';
 }).join('');
}
export async function copyNotionPlan(markdown){
 if(navigator.clipboard?.write&&typeof ClipboardItem!=='undefined'){
  try{await navigator.clipboard.write([new ClipboardItem({'text/plain':new Blob([markdown],{type:'text/plain'}),'text/html':new Blob([notionPlanHtml(markdown)],{type:'text/html'})})]);return;}catch{}
 }
 if(!navigator.clipboard?.writeText)throw new Error('클립보드를 사용할 수 없어요. 아래 내용을 직접 복사해주세요.');
 await navigator.clipboard.writeText(markdown);
}
