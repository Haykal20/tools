const CACHE_NAME = 'haykal-tools-v1';
const ASSETS = [
  './index.html',
  './offline.html',
  './manifest.json',
  './css/style.css',
  './js/main.js',
  './js/ai-chat.js',
  './js/tiktok-downloader.js',
  './js/qrcode-generator.js',
  './js/diagram-editor.js',
  './js/text-extractor.js',
  './js/face-recognition.js'
  // ...tambahkan asset lain yang ingin diprecache...
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS).catch(()=>{}))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  // Navigation requests -> network first, fallback to cached offline.html
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).then(res => {
        // update cache for navigation responses
        return caches.open(CACHE_NAME).then(cache => { cache.put(req, res.clone()); return res; });
      }).catch(() => caches.match('./offline.html'))
    );
    return;
  }

  // For other requests: cache-first, then network, then fallback to cache
  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(networkRes => {
        // only cache same-origin responses
        try {
          if (networkRes && networkRes.type !== 'opaque' && new URL(req.url).origin === location.origin) {
            const clone = networkRes.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
          }
        } catch (e) {
          // ignore URL parsing errors for cross-origin requests
        }
        return networkRes;
      }).catch(() => caches.match('./offline.html'));
    })
  );
});
