const CACHE='carla-pro-iphone-shell-v2';
const SHELL=['./','./index.html','./style.css','./app.js','./auth.js','./config.js','./data.js','./drive.js','./drive-test-schema.js','./manifest.webmanifest','./assets/icon.svg','./assets/icon-192.png','./assets/icon-512.png','./assets/apple-touch-icon.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('carla-pro-iphone-shell-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 // Não intercetar nem guardar Google, tokens, Drive, userinfo ou pedidos autenticados.
 if(event.request.method!=='GET'||url.origin!==self.location.origin||event.request.headers.has('Authorization'))return;
 const allowed=new Set(SHELL.map(path=>new URL(path,self.registration.scope).href));
 if(!allowed.has(url.href))return;
 event.respondWith(fetch(event.request).then(response=>{
  if(response.ok&&response.type==='basic'){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(c=>c.put(event.request,copy)));}
  return response;
 }).catch(()=>caches.match(event.request).then(response=>response||Response.error())));
});
