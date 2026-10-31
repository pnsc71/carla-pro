import {observeAuth,connectGoogle,signOut,authState} from './auth.js';
import {parsePrivate,sendPrivateCopy} from './private-data.js';
const $=id=>document.getElementById(id);
let text=null,busy=false;
function ready(){$('send').disabled=busy||!text||!authState().driveGranted;}
$('authorize').onclick=()=>{try{connectGoogle({drive:true});}catch(e){$('result').textContent=e.message;}};
$('logout').onclick=()=>{text=null;$('file').value='';$('preview').textContent='Nenhum ficheiro selecionado.';$('result').textContent='';signOut();};
observeAuth(s=>{$('logout').hidden=!s.signedIn;$('account').textContent=s.error||(s.driveGranted?'Conta Google ligada. O envio será para esta conta privada.':'Entra na mesma conta Google usada no iPhone.');ready();});
$('file').onchange=async()=>{
 text=null;$('result').textContent='';ready();const file=$('file').files[0];if(!file)return;
 try{
  if(file.size>5000000)throw new Error('A cópia excede o limite de tamanho.');
  const candidate=await file.text();const data=parsePrivate(candidate);
  text=candidate;$('preview').textContent=`Cópia verificada: ${data.lessons.length} aulas e ${data.students.filter(s=>s.active).length} alunos ativos.\nExportada: ${new Date(data.updatedAt).toLocaleString('pt-PT')}.\nSem telefones, mensagens ou pagamentos.\nSó será enviada quando carregares no botão abaixo.`;
 }catch(e){$('preview').textContent=e.message;}ready();
};
$('send').onclick=async()=>{
 if(!text||busy)return;busy=true;ready();$('result').textContent='A enviar a cópia privada e a confirmar a leitura…';
 try{const proof=await sendPrivateCopy(text);$('result').textContent=`Cópia privada enviada e verificada.\n${proof.data.lessons.length} aulas.\nID: ${proof.id}\nCódigo de comparação: ${proof.sha256}\nAgora, no iPhone, abre Definições e toca em Ler dados reais do Drive.`;}
 catch(e){$('result').textContent=e.message;}finally{busy=false;ready();}
};
