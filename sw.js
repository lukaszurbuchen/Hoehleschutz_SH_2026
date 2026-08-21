const CACHE_NAME = 'punkte-app-v1';
const APP_SHELL = [
  './',
  './index.html',
  './data.js',
  './manifest.json',
  './vendor/leaflet.css',
  './vendor/leaflet.js',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Strategie:
// - App-Shell-Dateien: Cache First (funktionieren garantiert offline)
// - OSM-Kartenkacheln (tile.openstreetmap.org): Cache First, aber neue
//   Kacheln werden beim ersten Online-Betrachten automatisch abgelegt.
//   -> Vor der Feldbegehung: mit Internet einmal in die Ziel-Gemeinde(n)
//      hinein- und wieder herauszoomen, damit alle benoetigten Kacheln
//      im Cache landen.
self.addEventListener('fetch', event => {
  const url = event.request.url;
  const isTile = url.includes('tile.openstreetmap.org');

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (isTile && response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => cached);
    })
  );
});
