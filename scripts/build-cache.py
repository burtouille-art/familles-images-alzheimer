"""Générer un cache exhaustif et versionné à partir des fichiers livrés."""
from pathlib import Path
import hashlib,json

root=Path(__file__).resolve().parents[1]
paths=[root/name for name in ['index.html','style.css','script.js','store.js','family-pack.js','manifest.webmanifest','README.md','LICENSE']]
paths+=sorted((root/'games').glob('*.js'))
paths+=sorted(p for p in (root/'assets').rglob('*') if p.is_file())
digest=hashlib.sha256(b''.join(str(p.relative_to(root)).encode()+p.read_bytes() for p in paths)).hexdigest()[:12]
files=['./']+['./'+str(p.relative_to(root)) for p in paths]
template="""// Généré par scripts/build-cache.py ; tout média est disponible hors connexion.
const CACHE='memoire-partage-__VERSION__';
const FILES=__FILES__;
const ROOT=new URL('./',self.location.href);
self.addEventListener('install',event=>{event.waitUntil((async()=>{
  const cache=await caches.open(CACHE);
  await cache.addAll(FILES.map(path=>new URL(path,ROOT).href));
  await self.skipWaiting();
})());});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{
  for(const key of await caches.keys())if(key.startsWith('memoire-partage-')&&key!==CACHE)await caches.delete(key);
  await self.clients.claim();
})());});
self.addEventListener('fetch',event=>{
  const req=event.request,url=new URL(req.url);
  if(req.method!=='GET'||url.origin!==ROOT.origin||!url.pathname.startsWith(ROOT.pathname))return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    if(req.mode==='navigate'&&(url.pathname===ROOT.pathname||url.pathname.endsWith('/index.html'))){
      const shell=await cache.match(new URL('./index.html',ROOT).href);if(shell)return shell;
    }
    const stored=await cache.match(req);if(stored)return stored;
    return fetch(req);
  })());
});
"""
(root/'sw.js').write_text(template.replace('__VERSION__',digest).replace('__FILES__',json.dumps(files,ensure_ascii=False)),encoding='utf-8')
print(f'Cache {digest} : {len(files)} ressources')
