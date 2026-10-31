/* Chrono-Ohm · app instalable: funciona sin conexión.
   La página se pide primero a la red (para recibir mejoras) y si no hay red se usa la copia guardada.
   Las voces se guardan en una caché aparte que se conserva entre versiones (cada archivo tiene un nombre único). */
const V = 'chrono-1.6-202610311519', AUDIO = 'chrono-audio';
const CORE = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V && k !== AUDIO).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const u = new URL(req.url); if (u.origin !== location.origin) return;
  if (u.pathname.endsWith('.mp3')) {
    // voces: primero la copia guardada; si no está, se descarga entera (sin «Range») y se guarda
    e.respondWith(caches.open(AUDIO).then(c => c.match(u.href).then(hit => hit || fetch(u.href).then(r => { if (r.ok && r.status === 200) c.put(u.href, r.clone()); return r; }))));
    return;
  }
  if (req.mode === 'navigate' || u.pathname.endsWith('/') || u.pathname.endsWith('.html') || u.pathname.endsWith('manifest.json')) {
    e.respondWith(fetch(req).then(r => { if (r.ok) { const c = r.clone(); caches.open(V).then(x => x.put(req, c)); } return r; })
      .catch(() => caches.match(req).then(r => r || caches.match('index.html'))));
    return;
  }
  e.respondWith(caches.match(req).then(r => r || fetch(req)));
});
