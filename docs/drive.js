import {CONFIG} from './config.js';
export const DRIVE_PLAN=Object.freeze({
 scope:'https://www.googleapis.com/auth/drive.file',
 format:'application/json',
 project:CONFIG.cloudProjectNumber,
 status:'pending-cross-device-proof',
});
export async function readPrivateFile() {
  // Bloqueio absoluto nesta fase: mesmo com drive.file autorizado, não há leitura.
  // Primeiro comprovar o mesmo fileId/conta/consentimento no Mac e iPhone com um JSON fictício.
  throw new Error('Leitura do Drive desativada nesta fase. São usados exclusivamente dados fictícios.');
}
