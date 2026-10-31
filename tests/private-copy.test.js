import test from 'node:test';
import assert from 'node:assert/strict';
import {parsePrivate,sendPrivateCopy,readPrivateCopy,PRIVATE_NAME,PRIVATE_MARKER} from '../docs/private-data.js';
import {connectGoogle,signOut} from '../docs/auth.js';
const example={schemaVersion:1,fictional:false,source:'carla-mac-readonly',updatedAt:'2026-10-31T12:00:00Z',students:[{id:'s1',name:'Pessoa de teste',type:'Presencial',price:20,active:true}],lessons:[{id:'l1',date:'2026-10-31',studentId:'s1',type:'Presencial',value:20}]};
test('schema privado só aceita campos autorizados e referências válidas',()=>{
 assert.deepEqual(parsePrivate(JSON.stringify(example)),example);
 for(const field of ['phone','telefone','tokens','pagamentos']){const copy=structuredClone(example);copy.students[0][field]='rejeitar';assert.throws(()=>parsePrivate(JSON.stringify(copy)),/campos/);}
 const copy=structuredClone(example);copy.lessons[0].studentId='missing';assert.throws(()=>parsePrivate(JSON.stringify(copy)),/aula/);
 copy.lessons[0].studentId='s1';copy.lessons[0].date='2026-02-31';assert.throws(()=>parsePrivate(JSON.stringify(copy)),/aula/);
 assert.throws(()=>parsePrivate('{}'));assert.throws(()=>parsePrivate('not-json'));
});
test('cópia privada criada sem partilha e atualizada no mesmo ID; leitura confirmada',async()=>{
 let callback,stored=null;const calls=[];const original=globalThis.fetch;
 globalThis.window={google:{accounts:{oauth2:{initTokenClient:o=>{callback=o.callback;return {requestAccessToken(){}};},hasGrantedAllScopes:()=>true}}}};
 const meta={id:'private_id',name:PRIVATE_NAME,mimeType:'application/json',size:'500',appProperties:{carlaPrivate:PRIVATE_MARKER},version:'1'};
 globalThis.fetch=async(url,options)=>{
  if(String(url).includes('userinfo'))return {ok:true,json:async()=>({sub:'fake'})};
  const u=new URL(url);calls.push({method:options.method,path:u.pathname,body:options.body});
  if(options.method==='POST'){
   assert.ok(options.body.includes(PRIVATE_MARKER));assert.ok(!options.body.includes('permissions'));stored=JSON.stringify(example);
   return {ok:true,status:200,json:async()=>({id:meta.id})};
  }
  if(options.method==='PATCH'){assert.equal(u.pathname,'/upload/drive/v3/files/private_id');stored=options.body;return {ok:true,status:200};}
  if(u.pathname==='/drive/v3/files'){assert.ok(u.searchParams.get('q').includes(PRIVATE_MARKER));return {ok:true,status:200,json:async()=>({files:stored?[meta]:[]})};}
  assert.equal(u.pathname,'/drive/v3/files/private_id');return {ok:true,status:200,text:async()=>stored};
 };
 try{
  connectGoogle({drive:true});await callback({access_token:'fake-test-token',expires_in:3600});
  const initial=await sendPrivateCopy(JSON.stringify(example));assert.equal(initial.id,meta.id);
  const next=structuredClone(example);next.lessons[0].value=21;
  const update=await sendPrivateCopy(JSON.stringify(next));assert.equal(update.id,initial.id);assert.equal(calls.filter(c=>c.method==='POST').length,1);assert.equal(calls.filter(c=>c.method==='PATCH').length,1);
  const iphone=await readPrivateCopy();assert.equal(iphone.data.lessons[0].value,21);assert.equal(iphone.sha256,update.sha256);
  const before=calls.length;const bad=structuredClone(example);bad.students[0].telefone='123';await assert.rejects(sendPrivateCopy(JSON.stringify(bad)));assert.equal(calls.length,before);
 }finally{signOut();globalThis.fetch=original;delete globalThis.window;}
});
