// /visitors2/service-worker.js
const CACHE_VERSION = 'v1.0.1';
const APP_SHELL = [
  './',              // resolves to /visitors2/
  './home.html',
  './style.css',
  './offline.html',
    './K53_Controls_Test.PNG',
    './K53_Signs_Test.PNG',
    './K53_Rules_Test.PNG',
    './K53_Book_Test.PNG',
    './K53_Learners_Test.PNG',
    './images.png',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_VERSION).then(c => c.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => (k !== CACHE_VERSION ? caches.delete(k) : null)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // don’t cache your counter endpoint
  if (url.pathname.endsWith('update_visitors.php')) return;

  // network-first for PHP
  if (url.pathname.endsWith('.php') || url.pathname.endsWith('/visitors2/') || url.pathname.endsWith('/')) {
    e.respondWith(
      fetch(e.request).then(res => {
        const copy = res.clone();
        caches.open(CACHE_VERSION).then(c => c.put(e.request, copy));
        return res;
      }).catch(() => caches.match(e.request).then(r => r || caches.match('./offline.html')))
    );
    return;
  }

  // cache-first for static
  if (/\.(css|js|png|jpg|jpeg|webp|svg|ico|gif|ttf|woff2?)$/i.test(url.pathname)) {
    e.respondWith(
      caches.match(e.request).then(cached => cached ||
        fetch(e.request).then(res => {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then(c => c.put(e.request, copy));
          return res;
        }).catch(() => caches.match('./offline.html'))
      )
    );
    return;
  }

  // default
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request).then(r => r || caches.match('./offline.html'))));
});

