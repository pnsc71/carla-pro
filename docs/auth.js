import {CONFIG} from './config.js';
const DRIVE_SCOPE='https://www.googleapis.com/auth/drive.file';
// A sessão e o access token vivem apenas em memória; nunca em localStorage, URL ou cache.
let session=null;
let tokenClient;
let onChange=()=>{};
let expires;
export const authState=()=>session ? {signedIn:true,driveGranted:session.driveGranted} : {signedIn:false,driveGranted:false};
export function observeAuth(callback) {onChange=callback;}
function clear() {session=null;clearTimeout(expires);onChange(authState());}
export function connectGoogle({drive=false}={}) {
  const oauth=window.google?.accounts?.oauth2;
  if (!oauth) throw new Error('A ligação à Google ainda não carregou. Verifica a Internet e tenta novamente.');
  if (!CONFIG.clientId) throw new Error('Falta configurar o Client ID público da Google.');
  tokenClient=oauth.initTokenClient({
    client_id:CONFIG.clientId,
    scope:drive ? `openid email ${DRIVE_SCOPE}` : 'openid email',
    include_granted_scopes:true,
    callback:async response=>{
      if(response.error||!response.access_token){clear();onChange({...authState(),error:'A Google não autorizou a ligação.'});return;}
      try {
        // A Google valida o access token; não confiamos apenas num JWT descodificado no navegador.
        const r=await fetch('https://openidconnect.googleapis.com/v1/userinfo',{
          headers:{Authorization:`Bearer ${response.access_token}`},cache:'no-store',credentials:'omit',
        });
        if(!r.ok) throw new Error('Não foi possível confirmar a sessão Google.');
        const identity=await r.json();
        if(!identity.sub) throw new Error('A sessão Google não foi reconhecida.');
        const driveGranted=oauth.hasGrantedAllScopes(response,DRIVE_SCOPE);
        if(drive&&!driveGranted) throw new Error('A permissão para o ficheiro do Drive não foi concedida.');
        session={token:response.access_token,driveGranted};
        clearTimeout(expires);
        expires=setTimeout(()=>{clear();onChange({...authState(),error:'A sessão expirou. Entra novamente com a Google.'});},Math.max(0,(Number(response.expires_in)||3600)-30)*1000);
        onChange(authState());
      } catch {clear();onChange({...authState(),error:'Não foi possível confirmar a ligação. Tenta entrar novamente com a Google.'});}
    },
    error_callback:()=>onChange({...authState(),error:'A janela Google foi fechada ou bloqueada. Toca novamente em Entrar com Google.'}),
  });
  tokenClient.requestAccessToken({prompt:session?'':'select_account'});
}
export function signOut(){clear();window.google?.accounts?.id?.disableAutoSelect();}
export function disconnectGoogle(){
  if(session?.token) window.google?.accounts?.oauth2?.revoke(session.token,()=>{});
  clear();
}
// Deliberadamente sem token exportado, chamadas files.get, listagens ou escrita no Drive.
