import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {DEMO,filterLessons,summary,months} from '../docs/data.js';
import {readPrivateFile} from '../docs/drive.js';
import {CONFIG} from '../docs/config.js';
import * as auth from '../docs/auth.js';

test('fixture apenas fictícia e totais por mês e modalidade',()=>{
 assert.equal(DEMO.fictional,true);
 assert.deepEqual(months(DEMO),['2026-10','2026-09']);
 assert.deepEqual(summary(filterLessons(DEMO,'2026-10')),{total:126,count:7,presencial:80,online:46});
 assert.equal(filterLessons(DEMO,'2026-09','Online').length,1);
 assert.equal(filterLessons(DEMO,'2026-10','Todas','exemplo a').length,2);
 assert.equal(filterLessons(DEMO,'2025-01').length,0);
 const list=filterLessons(DEMO,'2026-10');assert.equal(list[0].date,'2026-10-31');
 for(const student of DEMO.students){assert.ok(student.id.startsWith('demo-'));assert.equal(student.telefone,undefined);}
});
test('leitura privada bloqueada independentemente da configuração',async()=>{
 assert.equal(CONFIG.driveReadEnabled,false);
 await assert.rejects(readPrivateFile('any-id'),/desativada/);
});
test('manifest e shell funcionam no subdiretório do GitHub Pages',async()=>{
 const manifest=JSON.parse(await readFile(new URL('../docs/manifest.webmanifest',import.meta.url)));
 assert.equal(manifest.start_url,'./');assert.equal(manifest.scope,'./');assert.equal(manifest.display,'standalone');
 for(const icon of manifest.icons)await readFile(new URL('../docs/'+icon.src,import.meta.url));
 const html=await readFile(new URL('../docs/index.html',import.meta.url),'utf8');
 assert.ok(html.includes('viewport-fit=cover'));assert.ok(html.includes('apple-touch-icon'));
 assert.ok(!html.includes('client_secret'));assert.ok(!html.includes('sqlite3'));
 const sw=await readFile(new URL('../docs/sw.js',import.meta.url),'utf8');
 assert.ok(sw.includes("url.origin!==self.location.origin"));assert.ok(sw.includes("headers.has('Authorization')"));
});
test('OAuth verifica sessão na Google, pede drive.file separadamente e apaga sessão',async()=>{
 let options,requested,onChange;
 globalThis.window={google:{accounts:{oauth2:{
  initTokenClient:config=>{options=config;return {requestAccessToken:r=>{requested=r;}};},
  hasGrantedAllScopes:r=>(r.scope||'').includes('drive.file'),
  revoke:(_token,cb)=>cb(),
 }}}};
 const oldFetch=globalThis.fetch;
 globalThis.fetch=async(url,init)=>{assert.equal(url,'https://openidconnect.googleapis.com/v1/userinfo');assert.equal(init.cache,'no-store');return {ok:true,json:async()=>({sub:'fake-test-account'})};};
 auth.observeAuth(s=>{onChange=s;});auth.connectGoogle();
 assert.equal(options.scope,'openid email');assert.equal(requested.prompt,'select_account');
 await options.callback({access_token:'fake-test-token',expires_in:3600,scope:'openid email'});
 assert.equal(auth.authState().signedIn,true);assert.equal(auth.authState().driveGranted,false);
 auth.connectGoogle({drive:true});assert.ok(options.scope.includes('https://www.googleapis.com/auth/drive.file'));
 await options.callback({access_token:'fake-test-token',expires_in:3600,scope:'openid email'});
 assert.equal(auth.authState().signedIn,false);assert.ok(onChange.error);
 auth.connectGoogle({drive:true});
 await options.callback({access_token:'fake-test-token',expires_in:3600,scope:'openid email https://www.googleapis.com/auth/drive.file'});
 assert.equal(auth.authState().driveGranted,true);
 auth.signOut();assert.equal(auth.authState().signedIn,false);
 const originalTimer=globalThis.setTimeout;let expire;globalThis.setTimeout=callback=>{expire=callback;return 0;};
 auth.connectGoogle();await options.callback({access_token:'fake-test-token',expires_in:31,scope:'openid email'});
 assert.equal(auth.authState().signedIn,true);expire();assert.equal(auth.authState().signedIn,false);
 globalThis.setTimeout=originalTimer;
 globalThis.fetch=async()=>({ok:false});auth.connectGoogle();
 await options.callback({access_token:'fake-test-token',expires_in:3600});
 assert.equal(auth.authState().signedIn,false);
 globalThis.fetch=oldFetch;delete globalThis.window;
});
test('nenhum ficheiro de base de dados, contacto ou credencial privada na publicação',async()=>{
 const files=await readdir(new URL('../docs/',import.meta.url),{recursive:true});
 for(const file of files)assert.ok(!/\.(db|sqlite3?|csv|numbers|env)$|client_secret|credentials/i.test(file),file);
 const authSource=await readFile(new URL('../docs/auth.js',import.meta.url),'utf8');
 assert.ok(!/localStorage\.(setItem|getItem)|sessionStorage\./.test(authSource));
 assert.ok(!/www.googleapis.com\/drive\/v3/.test(authSource));
});
