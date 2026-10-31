import {DEMO} from './data.js';
import {observeAuth,connectGoogle,driveTestRequest,signOut} from './auth.js';
import {TEST_NAME,buildDemoUpload} from './drive-test-schema.js';
import {findDemoFile,readDemoFile} from './drive.js';
const $=id=>document.getElementById(id);
function status(text){$('status').textContent=text;}
$('authorize').onclick=()=>{try{connectGoogle({drive:true});}catch(e){status(e.message);}};
$('logout').onclick=signOut;
observeAuth(s=>{$('create').disabled=!s.driveGranted;$('logout').hidden=!s.signedIn;if(s.error)status(s.error);else status(s.driveGranted?'Google ligada. Podes preparar a amostra fictícia.':'Entra com Google para preparar a amostra.');});
$('create').onclick=async()=>{
 $('create').disabled=true;
 try{
  status('A verificar se a amostra já existe…');
  const existing=await findDemoFile();
  if(!existing){
   const boundary='carla_demo_'+crypto.randomUUID().replaceAll('-','');
   const body=buildDemoUpload(boundary);
   status('A criar apenas o ficheiro fictício privado…');
   await driveTestRequest('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id',{method:'POST',headers:{'Content-Type':`multipart/related; boundary=${boundary}`},body});
  }
  const proof=await readDemoFile();
  status(`Amostra ${existing?'já existente':'criada'} e leitura confirmada no Mac.\n\nFicheiro: ${TEST_NAME}\nID: ${proof.id}\nVersão: ${proof.version}\nCódigo de comparação: ${proof.sha256}\n\nAgora abre Definições no iPhone, entra na mesma conta e toca em Ler ficheiro fictício do Drive. Compara o ID e o código nos dois dispositivos.`);
 }catch(e){status(e.message);}finally{$('create').disabled=false;}
};
