/* Browser-local demonstration. No requests, tracking, or server-side ratings. */
'use strict';
const data=window.DEMO_DATA;
const $=id=>document.getElementById(id);
const criteria=[
 {id:'boundary',title:'Boundary transition',description:'Compare contour position, shape and transition fidelity with the all-in-focus reference. Look for displaced edges, ghosting and structural changes.'},
 {id:'halo',title:'Halo appearance',description:'Look for bright or dark fringes and overshoot that are absent from the reference. Judge halo appearance separately from texture smoothness.'},
 {id:'texture',title:'Texture preservation',description:'Compare real fine detail with the reference: thin lines, fur and grass. A smoother image is not necessarily a more faithful image.'}
];
const storageKey=data.version;
function hash(text){let h=2166136261;for(const c of text)h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;}
function shuffled(values,seed){const a=[...values];let x=seed||1;function random(){x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)/4294967296;}for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function fresh(){return {version:data.version,session:globalThis.crypto?.randomUUID?.()||String(Date.now())+'-'+Math.random().toString(36).slice(2),created:new Date().toISOString(),sample:0,criterion:0,records:{},drafts:{},revealed:false};}
let state;
try{state=JSON.parse(localStorage.getItem(storageKey));if(state?.version!==data.version||!state.records||!state.drafts)state=fresh();}catch{state=fresh();}
let view='crop',zoom=1,dragged=null,syncing=false,notice='',timerStart=Date.now();
const sample=()=>data.samples[state.sample];
const criterion=()=>criteria[state.criterion];
const taskKey=()=>sample().id+'/'+criterion().id;
function persist(){try{localStorage.setItem(storageKey,JSON.stringify(state));}catch{$('status').textContent='Browser storage is unavailable. Export before closing.';}}
function assignment(s){return shuffled(s.candidates.map(c=>c.id),hash(state.session+'/'+s.id));}
function label(id,s=sample()){return 'Candidate '+String.fromCharCode(65+assignment(s).indexOf(id));}
function candidate(id,s=sample()){return s.candidates.find(c=>c.id===id);}
function draft(){const key=taskKey();if(!state.drafts[key])state.drafts[key]={order:[...assignment(sample())],ties:[false,false,false]};return state.drafts[key];}
function rankValues(order,ties){const ranks={};let start=0;for(let i=0;i<order.length;i++){if(i===order.length-1||!ties[i]){const rank=((start+1)+(i+1))/2;for(let j=start;j<=i;j++)ranks[order[j]]=rank;start=i+1;}}return ranks;}
function completion(){return data.samples.reduce((sum,s)=>sum+criteria.filter(c=>state.records[s.id+'/'+c.id]).length,0);}
function escapeHtml(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function showImage(src,title){$('largeImage').src=src;$('imageTitle').textContent=title;$('imageDialog').showModal();}
function switchTask(si,ci){state.sample=si;state.criterion=ci;notice='';timerStart=Date.now();persist();render();}
function move(from,to){const d=draft();if(from===to||to<0||to>=d.order.length)return;const [item]=d.order.splice(from,1);d.order.splice(to,0,item);d.ties=[false,false,false];notice='Order updated. Save to confirm; ties were reset.';persist();renderRanking();}

function render(){
 const s=sample(),c=criterion(),done=completion();
 $('samples').innerHTML=data.samples.map((x,i)=>`<button class="${i===state.sample?'active':''}" data-sample="${i}">${escapeHtml(x.label)}</button>`).join('');
 $('criteria').innerHTML=criteria.map((x,i)=>`<button class="${i===state.criterion?'active':''}" data-criterion="${i}">${escapeHtml(x.title)}${state.records[s.id+'/'+x.id]?' · Saved':''}</button>`).join('');
 $('progressText').textContent=`${done} of 9 judgments completed`;$('progressBar').style.width=(done/9*100)+'%';
 $('criterionTitle').textContent=c.title;$('criterionDescription').textContent=c.description;
 $('refFull').src=s.reference.full;$('refCrop').src=s.reference.crop;
 const [x0,y0,x1,y1]=s.crop,[w,h]=s.size;
 Object.assign($('cropBox').style,{left:(100*x0/w)+'%',top:(100*y0/h)+'%',width:(100*(x1-x0)/w)+'%',height:(100*(y1-y0)/h)+'%'});
 $('sources').innerHTML=['sourceA','sourceB'].map(role=>`<div><p>${role==='sourceA'?'Source A':'Source B'}</p><img src="${escapeHtml(s[role].full)}" alt="${role==='sourceA'?'Source A':'Source B'}"></div>`).join('');
 $('candidateGrid').innerHTML=assignment(s).map(id=>{const item=candidate(id);return `<article class="candidate-card"><div class="candidate-head"><strong>${escapeHtml(label(id))}</strong><button data-enlarge="${id}" aria-label="Enlarge ${escapeHtml(label(id))}">Enlarge</button></div><div class="viewport" data-candidate="${id}"><div class="image-holder"><img src="${escapeHtml(item[view])}" alt="${escapeHtml(label(id))}"></div></div>${state.revealed?`<p class="hint" style="padding:0 .8rem">${escapeHtml(item.name)}</p>`:''}</article>`;}).join('');
 $('cropView').setAttribute('aria-pressed',view==='crop');$('fullView').setAttribute('aria-pressed',view==='full');
 $('reveal').disabled=done!==9;
 $('revealNote').textContent=state.revealed?'Configuration names revealed. Later revisions are marked as post-reveal.':done===9?'All judgments saved. You may now inspect the method identities.':'Names remain hidden until all nine judgments are completed.';
 applyZoom();renderRanking();persist();
}

function renderRanking(){
 const d=draft(),ranks=rankValues(d.order,d.ties),saved=state.records[taskKey()];
 $('ranking').innerHTML=d.order.map((id,i)=>`<div class="rank-row" draggable="true" data-index="${i}" tabindex="0" aria-label="${escapeHtml(label(id))}, rank ${ranks[id]}"><span class="rank-number">${ranks[id]}</span><img src="${escapeHtml(candidate(id).crop)}" alt=""><span class="rank-name">${escapeHtml(label(id))}</span><div class="move"><button data-move="${i}" data-direction="-1" ${i===0?'disabled':''} aria-label="Move ${escapeHtml(label(id))} earlier">Up</button><button data-move="${i}" data-direction="1" ${i===3?'disabled':''} aria-label="Move ${escapeHtml(label(id))} later">Down</button></div></div>${i<3?`<button class="tie ${d.ties[i]?'selected':''}" data-tie="${i}" aria-pressed="${d.ties[i]}">${d.ties[i]?'Tied':'Tie these two'}</button>`:''}`).join('');
 $('status').textContent=notice||(saved?(saved.status==='skipped'?'Saved as unable to judge.':'Saved. You can revise and save again.'):'Arrange all four candidates, then save.');
}

function applyZoom(){
 document.querySelectorAll('.viewport').forEach(v=>{
  v.classList.toggle('zoomed',zoom>1);const holder=v.querySelector('.image-holder'),img=v.querySelector('img');
  if(zoom===1){holder.style.width='100%';holder.style.height='100%';}
  else{const s=sample();const size=view==='crop'?[s.crop[2]-s.crop[0],s.crop[3]-s.crop[1]]:s.size;const base=Math.min(v.clientWidth/size[0],v.clientHeight/size[1]);holder.style.width=(size[0]*base*zoom)+'px';holder.style.height=(size[1]*base*zoom)+'px';}
  v.scrollTop=0;v.scrollLeft=0;
  v.onscroll=()=>{if(syncing)return;syncing=true;const sx=v.scrollLeft/(v.scrollWidth-v.clientWidth||1),sy=v.scrollTop/(v.scrollHeight-v.clientHeight||1);document.querySelectorAll('.viewport').forEach(other=>{if(other!==v){other.scrollLeft=sx*(other.scrollWidth-other.clientWidth);other.scrollTop=sy*(other.scrollHeight-other.clientHeight);}});requestAnimationFrame(()=>syncing=false);};
 });
}

function saveRecord(skipped=false,reason=''){
 const d=draft(),key=taskKey(),previous=state.records[key];
 state.records[key]={sample:sample().id,criterion:criterion().id,status:skipped?'skipped':'ranked',reason,
  order:[...d.order],ties:[...d.ties],ranks:skipped?null:rankValues(d.order,d.ties),
  initialOrder:assignment(sample()),savedAt:new Date().toISOString(),
  elapsedMs:(previous?.elapsedMs||0)+Date.now()-timerStart,postReveal:state.revealed,
  revisions:previous?[...(previous.revisions||[]),{savedAt:previous.savedAt,order:previous.order,ties:previous.ties,status:previous.status}]:[]};
 persist();
 if(completion()===9){notice='All nine judgments saved. Export your record below.';render();return;}
 const here=state.sample*3+state.criterion;
 for(let k=1;k<=9;k++){const next=(here+k)%9,si=Math.floor(next/3),ci=next%3;if(!state.records[data.samples[si].id+'/'+criteria[ci].id]){switchTask(si,ci);notice='Previous judgment saved.';renderRanking();break;}}
}

function download(filename,text,type){const url=URL.createObjectURL(new Blob([text],{type}));const a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function csvValue(x){return '"'+String(x??'').replace(/"/g,'""')+'"';}
function exportCsv(){
 const headers=['mode','session_id','review_id','sample_id','label','candidate_id','boundary_rank','halo_rank','texture_rank','boundary_status','halo_status','texture_status','post_reveal'];
 const rows=[];data.samples.forEach((s,i)=>assignment(s).forEach(id=>{const records=criteria.map(c=>state.records[s.id+'/'+c.id]);rows.push(['demo',state.session,i+1,s.id,label(id,s),id,...records.map(r=>r?.ranks?.[id]??''),...records.map(r=>r?.status||'not_completed'),records.some(r=>r?.postReveal)]);}));
 download('peafr_demo_rankings.csv','\uFEFF'+[headers,...rows].map(row=>row.map(csvValue).join(',')).join('\r\n'),'text/csv;charset=utf-8');
}

document.addEventListener('click',event=>{
 const el=event.target.closest('button');if(!el)return;
 if(el.dataset.sample!==undefined)switchTask(Number(el.dataset.sample),state.criterion);
 if(el.dataset.criterion!==undefined)switchTask(state.sample,Number(el.dataset.criterion));
 if(el.dataset.move!==undefined)move(Number(el.dataset.move),Number(el.dataset.move)+Number(el.dataset.direction));
 if(el.dataset.tie!==undefined){const i=Number(el.dataset.tie);draft().ties[i]=!draft().ties[i];notice='Tie updated. Save to confirm.';persist();renderRanking();}
 if(el.dataset.enlarge)showImage(candidate(el.dataset.enlarge)[view],label(el.dataset.enlarge));
 if(el.dataset.close)$(el.dataset.close).close();
});
$('ranking').addEventListener('dragstart',e=>{const row=e.target.closest('.rank-row');if(!row)return;dragged=Number(row.dataset.index);e.dataTransfer.setData('text/plain',String(dragged));row.classList.add('dragging');});
$('ranking').addEventListener('dragover',e=>{if(e.target.closest('.rank-row'))e.preventDefault();});
$('ranking').addEventListener('drop',e=>{const row=e.target.closest('.rank-row');if(!row||dragged===null)return;e.preventDefault();move(dragged,Number(row.dataset.index));dragged=null;});
$('ranking').addEventListener('dragend',()=>{dragged=null;document.querySelectorAll('.dragging').forEach(el=>el.classList.remove('dragging'));});
$('save').onclick=()=>saveRecord();
$('skip').onclick=()=>{const reason=prompt('Briefly explain why this criterion cannot be judged.');if(reason?.trim())saveRecord(true,reason.trim());};
$('help').onclick=()=>$('helpDialog').showModal();
$('refZoom').onclick=()=>showImage(sample().reference.crop,'All-in-focus reference · detail');
$('refFull').onclick=()=>showImage(sample().reference.full,'All-in-focus reference · full image');
$('sourcesButton').onclick=()=>{$('sources').hidden=!$('sources').hidden;$('sourcesButton').textContent=$('sources').hidden?'Show source images':'Hide source images';};
$('cropView').onclick=()=>{view='crop';render();};$('fullView').onclick=()=>{view='full';render();};
$('zoom').onchange=e=>{zoom=Number(e.target.value);applyZoom();};
$('exportCsv').onclick=exportCsv;
$('exportJson').onclick=()=>download('peafr_demo_session.json',JSON.stringify({mode:'demo',exportedAt:new Date().toISOString(),...state},null,2),'application/json');
$('reset').onclick=()=>{if(confirm('Start a new session? Export first if you want to keep your choices.')){state=fresh();notice='';timerStart=Date.now();persist();render();}};
$('reveal').onclick=()=>{if(completion()===9){state.revealed=true;persist();render();}};
window.addEventListener('resize',applyZoom);
render();
window.PEAFR_DEMO_TEST={rankValues,shuffled,hash};
