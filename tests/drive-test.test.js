import test from 'node:test';
import assert from 'node:assert/strict';
import {DEMO} from '../docs/data.js';
import {MARKER,TEST_NAME,validateDemo,buildDemoUpload,fingerprint} from '../docs/drive-test-schema.js';
import {findDemoFile,readDemoFile,readPrivateFile} from '../docs/drive.js';
import {connectGoogle,signOut,driveTestRequest} from '../docs/auth.js';

test('upload é sempre a amostra fictícia exata; validação rejeita contactos e outros dados',async()=>{
 const body=buildDemoUpload('carla_demo_123');
 assert.ok(body.includes(JSON.stringify(DEMO)));assert.ok(body.includes(MARKER));assert.ok(!body.includes('permissions'));
 assert.deepEqual(validateDemo(JSON.parse(JSON.stringify(DEMO))),DEMO);
 const real=structuredClone(DEMO);real.students[0].phone='000000000';assert.throws(()=>validateDemo(real));
 const altered=structuredClone(DEMO);altered.students[0].name='Outro nome';assert.throws(()=>validateDemo(altered));
 assert.throws(()=>buildDemoUpload('invalid\r\n'));
 assert.equal((await fingerprint(JSON.stringify(DEMO))).length,64);
});
test('mesmo ID/código nos dispositivos, acesso limitado e erros seguros',async()=>{
 let callback;
 globalThis.window={google:{accounts:{oauth2:{initTokenClient:o=>{callback=o.callback;return {requestAccessToken(){}};},hasGrantedAllScopes:()=>true}}}};
 const originalFetch=globalThis.fetch;
 const text=JSON.stringify(DEMO);
 const meta={id:'demo_drive_id',name:TEST_NAME,mimeType:'application/json',size:String(text.length),version:'1',appProperties:{carlaProTest:MARKER}};
 let mode='ok';let methods=[];
 globalThis.fetch=async(url,options)=>{
  if(String(url).includes('userinfo'))return {ok:true,json:async()=>({sub:'test-sub'})};
  methods.push(options.method);assert.equal(options.cache,'no-store');assert.equal(options.headers.Authorization,'Bearer fake-test-token');
  if(mode==='expired')return {ok:false,status:401};
  const u=new URL(url);
  if(u.pathname==='/drive/v3/files'){
   assert.ok(u.searchParams.get('q').includes(MARKER));
   return {ok:true,status:200,json:async()=>({files:mode==='none'?[]:mode==='duplicate'?[meta,meta]:[meta]})};
  }
  assert.equal(u.pathname,'/drive/v3/files/demo_drive_id');assert.equal(u.searchParams.get('alt'),'media');
  return {ok:true,status:200,text:async()=>mode==='bad'?'{}':text};
 };
 try{
  await assert.rejects(readDemoFile(),/autoriza drive.file/);
  connectGoogle({drive:true});await callback({access_token:'fake-test-token',expires_in:3600});
  const mac=await readDemoFile();const phone=await readDemoFile();assert.equal(mac.id,phone.id);assert.equal(mac.sha256,phone.sha256);assert.deepEqual(mac.data,DEMO);
  assert.ok(methods.every(m=>m==='GET'));
  await assert.rejects(driveTestRequest('https://not-google.invalid/drive/v3/files'),/não permitida/);
  await assert.rejects(driveTestRequest('https://www.googleapis.com/drive/v3/files/demo_drive_id',{method:'DELETE'}),/não permitida/);
  mode='none';assert.equal(await findDemoFile(),null);await assert.rejects(readDemoFile(),/não existe/);
  mode='duplicate';await assert.rejects(readDemoFile(),/mais de um/);
  mode='bad';await assert.rejects(readDemoFile(),/amostra fictícia/);
  mode='expired';await assert.rejects(readDemoFile(),/expirou/);
  await assert.rejects(readPrivateFile(),/reais desativada/);
 }finally{signOut();globalThis.fetch=originalFetch;delete globalThis.window;}
});
