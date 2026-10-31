import {driveTestRequest} from './auth.js';
import {fingerprint} from './drive-test-schema.js';
export const PRIVATE_NAME='CARLA-CONSULTA-PRIVADA-v1.json';
export const PRIVATE_MARKER='carla-private-consult-v1';
const MAX=5000000;
function keys(obj,allowed){if(!obj||typeof obj!=='object'||Array.isArray(obj)||Object.keys(obj).some(k=>!allowed.includes(k))||allowed.some(k=>!(k in obj)))throw new Error('O ficheiro inclui campos não permitidos ou incompletos.');}
function str(v,max=200){return typeof v==='string'&&v.length>0&&v.length<=max;}
function value(v){return typeof v==='number'&&Number.isFinite(v)&&v>=0;}
function day(v){return /^\d{4}-\d{2}-\d{2}$/.test(v)&&!Number.isNaN(Date.parse(v))&&new Date(v+'T12:00:00Z').toISOString().slice(0,10)===v;}
export function validatePrivate(data){
 keys(data,['schemaVersion','fictional','source','updatedAt','students','lessons']);
 if(data.schemaVersion!==1||data.fictional!==false||data.source!=='carla-mac-readonly'||!str(data.updatedAt)||Number.isNaN(Date.parse(data.updatedAt))||!Array.isArray(data.students)||!Array.isArray(data.lessons)||data.students.length>10000||data.lessons.length>100000)throw new Error('Formato da cópia privada inválido.');
 const ids=new Set();
 for(const s of data.students){keys(s,['id','name','type','price','active']);if(!str(s.id)||!str(s.name)||!['Presencial','Online'].includes(s.type)||!value(s.price)||typeof s.active!=='boolean'||ids.has(s.id))throw new Error('Dados de aluno inválidos.');ids.add(s.id);}
 const lessonIds=new Set();
 for(const l of data.lessons){keys(l,['id','date','studentId','type','value']);if(!str(l.id)||!day(l.date)||!ids.has(l.studentId)||!['Presencial','Online'].includes(l.type)||!value(l.value)||lessonIds.has(l.id))throw new Error('Dados de aula inválidos.');lessonIds.add(l.id);}
 return data;
}
export function parsePrivate(text){
 if(new TextEncoder().encode(text).length>MAX)throw new Error('A cópia excede o limite de tamanho.');
 let data;try{data=JSON.parse(text);}catch{throw new Error('Escolhe o JSON criado pelo exportador do Mac.');}
 return validatePrivate(data);
}
async function find(){
 const p=new URLSearchParams({q:`trashed = false and name = '${PRIVATE_NAME}' and appProperties has { key='carlaPrivate' and value='${PRIVATE_MARKER}' }`,spaces:'drive',pageSize:'10',fields:'files(id,name,mimeType,size,modifiedTime,version,appProperties),nextPageToken'});
 const r=await (await driveTestRequest(`https://www.googleapis.com/drive/v3/files?${p}`)).json();
 if(r.nextPageToken||r.files?.length>1)throw new Error('Existe mais de uma cópia privada. É necessário escolher uma única cópia antes de continuar.');
 return r.files?.[0]||null;
}
export async function readPrivateCopy(){
 const meta=await find();
 if(!meta)throw new Error('Ainda não foi enviada uma cópia privada pelo Mac.');
 if(meta.name!==PRIVATE_NAME||meta.appProperties?.carlaPrivate!==PRIVATE_MARKER||meta.mimeType!=='application/json'||!Number.isFinite(Number(meta.size))||Number(meta.size)>MAX)throw new Error('A cópia privada não passou a verificação.');
 const text=await (await driveTestRequest(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(meta.id)}?alt=media`)).text();
 const data=parsePrivate(text);
 return {data,id:meta.id,version:meta.version,sha256:await fingerprint(text)};
}
export async function sendPrivateCopy(text){
 const data=parsePrivate(text); // Recusa telefones, contactos, pagamentos e campos extra antes de qualquer upload.
 const canonical=JSON.stringify(data);
 const old=await find();
 if(old){
  if(old.appProperties?.carlaPrivate!==PRIVATE_MARKER||old.name!==PRIVATE_NAME)throw new Error('O destino não é a cópia privada da aplicação.');
  await driveTestRequest(`https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(old.id)}?uploadType=media&fields=id`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:canonical});
 }else{
  const boundary='carla_private_'+crypto.randomUUID().replaceAll('-','');
  const meta={name:PRIVATE_NAME,mimeType:'application/json',appProperties:{carlaPrivate:PRIVATE_MARKER}};
  const body=`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n${canonical}\r\n--${boundary}--`;
  await driveTestRequest('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id',{method:'POST',headers:{'Content-Type':`multipart/related; boundary=${boundary}`},body});
 }
 const proof=await readPrivateCopy();
 if(proof.sha256!==await fingerprint(canonical))throw new Error('A cópia enviada não coincide com a leitura de confirmação. Tenta atualizar.');
 return proof;
}
