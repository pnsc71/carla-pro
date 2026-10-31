import {DEMO} from './data.js';
export const TEST_NAME='CARLA-PRO-TESTE-FICTICIO-v1.json';
export const MARKER='carla-pro-cross-device-v1';
export function validateDemo(data){
 // Esta prova só admite a amostra pública exata. Nenhum aluno/contacto real é aceite.
 if(JSON.stringify(data)!==JSON.stringify(DEMO)) throw new Error('O ficheiro não corresponde à amostra fictícia aprovada. Nenhum dado foi carregado.');
 return data;
}
export function buildDemoUpload(boundary){
 if(!/^carla_demo_[A-Za-z0-9]+$/.test(boundary))throw new Error('Separador de upload inválido.');
 const metadata={name:TEST_NAME,mimeType:'application/json',appProperties:{carlaProTest:MARKER}};
 return `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n${JSON.stringify(DEMO)}\r\n--${boundary}--`;
}
export async function fingerprint(text){
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));
 return [...new Uint8Array(digest)].map(v=>v.toString(16).padStart(2,'0')).join('');
}
