const CACHE="zhk-mega-v3";
const CORE=["./","./index.html","./admin.html","./firebase-config.js","./zhk-firebase.js","./manifest.webmanifest","./manifest-admin.webmanifest","./icons/icon-192.png","./icons/icon-512.png","./icons/icon-180.png"];
// Кэшируем только свои файлы, шрифты и SDK Firebase. Запросы к базе и авторизации (googleapis.com) — никогда.
const CACHEABLE=u=>u.origin===self.location.origin||u.host==="fonts.googleapis.com"||u.host==="fonts.gstatic.com"||(u.host==="www.gstatic.com"&&u.pathname.startsWith("/firebasejs/"));
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()));});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener("fetch",e=>{
  const r=e.request; if(r.method!=="GET") return;
  const u=new URL(r.url); if(!CACHEABLE(u)) return;
  if(r.mode==="navigate"){ const key=u.pathname.endsWith("admin.html")?"./admin.html":"./index.html"; e.respondWith(fetch(r).then(res=>{const c=res.clone();caches.open(CACHE).then(x=>x.put(key,c));return res;}).catch(()=>caches.match(key))); return; }
  // свои скрипты (настройки Firebase) — сначала сеть, чтобы изменения применялись сразу
  if(u.origin===self.location.origin && u.pathname.endsWith(".js")){ e.respondWith(fetch(r).then(res=>{const c=res.clone();caches.open(CACHE).then(x=>x.put(r,c));return res;}).catch(()=>caches.match(r))); return; }
  e.respondWith(caches.match(r).then(hit=>hit||fetch(r).then(res=>{ if(res.ok||res.type==="opaque"){const c=res.clone();caches.open(CACHE).then(x=>x.put(r,c));} return res; })));
});
