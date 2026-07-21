const C='sf3';
self.addEventListener('install',e=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil((async()=>{
  const ks=await caches.keys();
  await Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)));
  await self.clients.claim();
})()));
self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.method!=='GET')return;
  if(req.mode==='navigate'||req.destination==='document'){
    e.respondWith(fetch(req).then(r=>{const cl=r.clone();caches.open(C).then(c=>c.put(req,cl));return r;}).catch(()=>caches.match(req)));
  }else{
    e.respondWith(caches.open(C).then(async c=>{
      const hit=await c.match(req);
      const net=fetch(req).then(r=>{c.put(req,r.clone());return r;}).catch(()=>hit);
      return hit||net;
    }));
  }
});
