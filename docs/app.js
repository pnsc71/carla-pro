import {DEMO,filterLessons,summary,months} from './data.js';
import {readPrivateCopy} from './private-data.js';
import {readDemoFile} from './drive.js';
import {observeAuth,authState,connectGoogle,signOut,disconnectGoogle} from './auth.js';
const $=id=>document.getElementById(id);
const money=new Intl.NumberFormat('pt-PT',{style:'currency',currency:'EUR'});
const monthName=new Intl.DateTimeFormat('pt-PT',{month:'long',year:'numeric',timeZone:'UTC'});
const dateName=new Intl.DateTimeFormat('pt-PT',{month:'short',timeZone:'UTC'});
let state={page:'home',access:false,demo:false};
let currentData=DEMO;let proof=null;let generation=0;
function resetDrive(){currentData=DEMO;proof=null;generation++;$('drive-proof').hidden=true;$('drive-proof').textContent='';refreshMonths();}
const safeRead=(key)=>{try{return localStorage.getItem(key);}catch{return null;}};
const safeWrite=(key,val)=>{try{localStorage.setItem(key,val);}catch{}};
function notice(text=''){$('notice').textContent=text;$('notice').hidden=!text;}
function applyTheme(dark){document.body.classList.toggle('dark',dark);$('theme').textContent=dark?'☀':'☾';$('theme').setAttribute('aria-label',dark?'Ativar modo claro':'Ativar modo escuro');document.querySelector('meta[name="theme-color"]').content=dark?'#111b2a':'#f1f5fa';}
applyTheme(safeRead('carla-iphone-theme')==='dark');
$('theme').addEventListener('click',()=>{const dark=!document.body.classList.contains('dark');applyTheme(dark);safeWrite('carla-iphone-theme',dark?'dark':'light');});
function menu(open){$('sidebar').classList.toggle('open',open);$('backdrop').hidden=!open;$('menu').setAttribute('aria-expanded',String(open));}
$('menu').onclick=()=>menu(!$('sidebar').classList.contains('open'));
$('backdrop').onclick=()=>menu(false);
document.addEventListener('keydown',e=>{if(e.key==='Escape')menu(false);});
function access(demo=false){if(demo)resetDrive();state.access=true;state.demo=demo;$('login').hidden=true;$('content').hidden=false;render();}
function login(drive=false){notice();try{connectGoogle({drive});}catch(e){notice(e.message);}}
$('google-login').onclick=()=>login();$('settings-login').onclick=()=>login();
$('demo-login').onclick=()=>access(true);
$('drive-consent').onclick=()=>login(true);
$('logout').onclick=signOut;$('disconnect').onclick=disconnectGoogle;
observeAuth(session=>{
 if(session.error){notice(session.error);}
 if(session.signedIn){resetDrive();access(false);if(!session.error)notice('Ligação Google confirmada. Continuas a consultar apenas dados fictícios.');}
 else {resetDrive();state.access=false;state.demo=false;$('login').hidden=false;$('content').hidden=true;render();}
 renderSession();
});
function refreshMonths(){const selected=$('month').value;$('month').replaceChildren();for(const m of months(currentData)){const option=document.createElement('option');option.value=m;option.textContent=monthName.format(new Date(`${m}-01T12:00:00Z`));$('month').append(option);}if(months(currentData).includes(selected))$('month').value=selected;}
refreshMonths();
$('month').onchange=render;$('hide-values').onchange=render;
$('lesson-search').oninput=renderLessons;$('lesson-type').onchange=renderLessons;$('student-search').oninput=renderStudents;
function nav(page){state.page=page;menu(false);render();window.scrollTo({top:0,behavior:'instant'});}
document.querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>nav(b.dataset.page));
document.querySelectorAll('[data-type]').forEach(b=>b.onclick=()=>{$('lesson-type').value=b.dataset.type;nav('lessons');});
$('all-lessons').onclick=()=>{$('lesson-type').value='Todas';$('lesson-search').value='';nav('lessons');};
const value=v=>$('hide-values').checked?'•••• €':money.format(v);
function el(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;}
function rows(target,lessons){const box=$(target);box.replaceChildren();if(!lessons.length){box.append(el('p','empty','Sem aulas para esta seleção.'));return;}
 for(const lesson of lessons){const student=currentData.students.find(s=>s.id===lesson.studentId);const row=el('article','lesson-row');const date=el('div','date-box');date.append(el('b','',lesson.date.slice(-2)),el('small','',dateName.format(new Date(`${lesson.date}T12:00:00Z`))));const details=el('div','lesson-details');details.append(el('div','lesson-name',student.name),el('div','lesson-meta',`${lesson.type==='Presencial'?'⌂':'▱'} ${lesson.type} · ${lesson.date.split('-').reverse().join('/')}`));row.append(date,details,el('div','lesson-value',value(lesson.value)));box.append(row);}
}
function renderHome(){const lessons=filterLessons(currentData,$('month').value);const totals=summary(lessons);$('metrics').replaceChildren();
 for(const [title,key,icon,color] of [['Total do mês','total','€','blue'],['Aulas realizadas','count','▦','green'],['Presencial','presencial','⌂','orange'],['Online','online','▱','violet']]){const card=el('article',`metric ${color}`);const content=el('div');content.append(el('p','',title),el('strong','',key==='count'?String(totals[key]):value(totals[key])));card.append(el('span','metric-icon',icon),content);$('metrics').append(card);}
 $('presencial-total').textContent=value(totals.presencial);$('online-total').textContent=value(totals.online);rows('recent-list',lessons.slice(0,5));
}
function renderLessons(){const lessons=filterLessons(currentData,$('month').value,$('lesson-type').value,$('lesson-search').value);$('lesson-count').textContent=`${lessons.length} ${lessons.length===1?'aula':'aulas'} · ${value(summary(lessons).total)}`;rows('lesson-list',lessons);}
function renderStudents(){const q=$('student-search').value.trim().toLocaleLowerCase('pt-PT');const list=currentData.students.filter(s=>s.active!==false).filter(s=>s.name.toLocaleLowerCase('pt-PT').includes(q));$('student-list').replaceChildren();for(const s of list){const card=el('article','student-card');const details=el('div');details.append(el('h2','',s.name),el('p','',`${s.type} · ${value(s.price)} / hora`));card.append(el('span','student-avatar',s.name.slice(-1)),details);$('student-list').append(card);}if(!list.length)$('student-list').append(el('p','empty','Nenhum aluno encontrado.'));}
function renderSession(){const auth=authState();$('drive-read').hidden=!auth.driveGranted;$('private-read').hidden=!auth.driveGranted;$('session-label').textContent=auth.signedIn?'Sessão Google confirmada. A cópia privada só é consultada quando pedires.':'Demonstração pública, sem sessão Google.';$('logout').hidden=!auth.signedIn;$('disconnect').hidden=!auth.signedIn;$('settings-login').hidden=auth.signedIn;$('drive-consent').hidden=!auth.signedIn||auth.driveGranted;$('drive-label').textContent=auth.driveGranted?'Permissão drive.file autorizada. Podes consultar a cópia privada enviada pelo Mac ou a amostra fictícia.':'Nenhum ficheiro foi lido. A autorização será pedida separadamente.';}
function render(){const real=currentData.fictional===false;$('data-banner').querySelector('strong').textContent=real?'Dados reais · Cópia privada do Mac':'Demonstração com dados fictícios';$('data-banner').querySelector('small').textContent=real?'Atualizada: '+new Date(currentData.updatedAt).toLocaleString('pt-PT')+' · Apenas consulta':'Nenhum dado do Mac é usado nesta demonstração.';$('source-footer').textContent=real?'Cópia privada do Mac':'Dados fictícios';const titles={home:'Olá, Carla!',lessons:'Aulas',students:'Alunos',settings:'Definições'};$('title').textContent=titles[state.page];$('subtitle').textContent=state.page==='home'?'Tudo organizado, onde estiveres.':'Versão de teste · Apenas consulta';for(const p of ['home','lessons','students','settings'])$(p+'-view').hidden=p!==state.page;$('month-controls').hidden=!['home','lessons'].includes(state.page);document.querySelectorAll('[data-page]').forEach(b=>{b.classList.toggle('active',b.dataset.page===state.page);if(b.dataset.page===state.page)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});renderHome();renderLessons();renderStudents();renderSession();}
$('drive-read').onclick=async()=>{
 const attempt=++generation;$('drive-read').disabled=true;notice('A consultar apenas a amostra fictícia privada…');
 try{
  const result=await readDemoFile();
  if(attempt!==generation||!authState().driveGranted)return;
  proof=result;currentData=result.data;refreshMonths();
  $('drive-proof').textContent=`Mesmo ficheiro: ${result.id}\nVersão: ${result.version}\nCódigo de comparação: ${result.sha256}`;
  $('drive-proof').hidden=false;render();notice('Amostra fictícia lida do Drive. Compara o ID e o código de comparação com os apresentados no Mac.');
 }catch(e){if(attempt===generation)notice(e.message);}finally{$('drive-read').disabled=false;}
};
$('private-read').onclick=async()=>{
 const attempt=++generation;$('private-read').disabled=true;notice('A consultar a cópia privada do Mac…');
 try{
  const result=await readPrivateCopy();
  if(attempt!==generation||!authState().driveGranted)return;
  proof=result;currentData=result.data;refreshMonths();
  $('drive-proof').textContent=`Cópia privada: ${result.id}\nVersão: ${result.version}\nCódigo de comparação: ${result.sha256}`;
  $('drive-proof').hidden=false;render();notice('Dados reais carregados da cópia privada. Apenas consulta; nada foi alterado no Mac.');
 }catch(e){if(attempt===generation)notice(e.message);}finally{$('private-read').disabled=false;}
};
render();
if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch(()=>notice('A instalação offline não ficou disponível neste navegador. Podes continuar a consultar a demonstração.'));
