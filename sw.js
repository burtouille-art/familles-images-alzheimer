// Généré par scripts/build-cache.py ; tout média est disponible hors connexion.
const CACHE='memoire-partage-b1aa1332adce';
const FILES=["./", "./index.html", "./style.css", "./script.js", "./store.js", "./manifest.webmanifest", "./README.md", "./LICENSE", "./games/core.js", "./games/data.js", "./games/expressions.js", "./games/memory.js", "./games/money.js", "./games/odd.js", "./games/pairs.js", "./games/places.js", "./games/puzzle.js", "./games/recall.js", "./games/recognition.js", "./games/sequence.js", "./games/sorting.js", "./games/sounds.js", "./games/yesno.js", "./assets/CREDITS.md", "./assets/fonts/OFL.txt", "./assets/fonts/atkinson-400.woff2", "./assets/fonts/atkinson-700.woff2", "./assets/icon-192.png", "./assets/icon-512.png", "./assets/icon.svg", "./assets/photos/ail.jpg", "./assets/photos/banane.jpg", "./assets/photos/billets.jpg", "./assets/photos/bonnet.jpg", "./assets/photos/bottines.jpg", "./assets/photos/bouilloire.jpg", "./assets/photos/brocoli.jpg", "./assets/photos/brosse.jpg", "./assets/photos/cafe.jpg", "./assets/photos/carotte.jpg", "./assets/photos/casquette.jpg", "./assets/photos/centime.jpg", "./assets/photos/champignon.jpg", "./assets/photos/chapeau.jpg", "./assets/photos/chat.jpg", "./assets/photos/chaussures.jpg", "./assets/photos/chemise-carreaux.jpg", "./assets/photos/chemise.jpg", "./assets/photos/chien.jpg", "./assets/photos/chou.jpg", "./assets/photos/claquettes.jpg", "./assets/photos/concombre.jpg", "./assets/photos/courgette.jpg", "./assets/photos/fraise.jpg", "./assets/photos/framboise.jpg", "./assets/photos/jardin.jpg", "./assets/photos/jean.jpg", "./assets/photos/jupe.jpg", "./assets/photos/lac.jpg", "./assets/photos/lapin.jpg", "./assets/photos/maison.jpg", "./assets/photos/melon.jpg", "./assets/photos/montagne.jpg", "./assets/photos/mure.jpg", "./assets/photos/oignon.jpg", "./assets/photos/orange.jpg", "./assets/photos/pain.jpg", "./assets/photos/pantalon.jpg", "./assets/photos/pieces.jpg", "./assets/photos/plage.jpg", "./assets/photos/poire.jpg", "./assets/photos/poivron.jpg", "./assets/photos/pomme.jpg", "./assets/photos/prune.jpg", "./assets/photos/pull.jpg", "./assets/photos/robe.jpg", "./assets/photos/tomate.jpg", "./assets/photos/veste-costume.jpg", "./assets/photos/veste.jpg", "./assets/sons/chat.mp3", "./assets/sons/chien.mp3", "./assets/sons/eau.mp3"];
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
