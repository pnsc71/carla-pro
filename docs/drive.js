import {driveTestRequest} from './auth.js';
import {TEST_NAME,MARKER,validateDemo,fingerprint} from './drive-test-schema.js';
export const DRIVE_PLAN=Object.freeze({scope:'https://www.googleapis.com/auth/drive.file',format:'application/json',status:'fictional-test-only'});
export async function findDemoFile(){
 const params=new URLSearchParams({q:`trashed = false and name = '${TEST_NAME}' and appProperties has { key='carlaProTest' and value='${MARKER}' }`,spaces:'drive',pageSize:'10',fields:'files(id,name,mimeType,size,version,modifiedTime,appProperties),nextPageToken'});
 const result=await (await driveTestRequest(`https://www.googleapis.com/drive/v3/files?${params}`)).json();
 if(result.files?.length>1||result.nextPageToken)throw new Error('Há mais de um ficheiro de teste. Mantém apenas uma cópia no Drive e volta a tentar.');
 return result.files?.[0]||null;
}
export async function readDemoFile(){
 const meta=await findDemoFile();
 if(!meta)throw new Error('Ainda não existe o ficheiro fictício. Primeiro prepara-o no navegador do Mac, com a mesma conta Google.');
 if(meta.name!==TEST_NAME||meta.appProperties?.carlaProTest!==MARKER||meta.mimeType!=='application/json'||!Number.isFinite(Number(meta.size))||Number(meta.size)>50000)throw new Error('Este ficheiro não é uma amostra de teste válida.');
 const response=await driveTestRequest(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(meta.id)}?alt=media`);
 const text=await response.text();
 if(new TextEncoder().encode(text).length>50000)throw new Error('O ficheiro de teste excede o limite permitido.');
 let data;try{data=JSON.parse(text);}catch{throw new Error('O ficheiro não contém JSON válido.');}
 validateDemo(data);
 return {data,id:meta.id,version:meta.version,modifiedTime:meta.modifiedTime,sha256:await fingerprint(text)};
}
export async function readPrivateFile(){throw new Error('Leitura de dados reais desativada. Apenas o ficheiro fictício de teste pode ser lido.');}
