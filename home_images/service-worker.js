const CACHE_VERSION = 'freek53-homeimgs-v2';

// List ONLY files that truly exist under /home_images/
const APP_SHELL = [
  '/home_images/',
  '/home_images/home.html',
  '/home_images/style.css',
  '/home_images/icon-192.png',
  '/home_images/icon-512.png',
  '/home_images/images.png',
  '/home_images/K53_Controls_Test.PNG',
  '/home_images/K53_Signs_Test.PNG',
  '/home_images/K53_Rules_Test.PNG',
  '/home_images/K53_Book_Test.PNG',
  '/home_images/K53_Learners_Test.PNG'
  // '/home_images/offline.html'  // add this only if you create the file
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_VERSION);
    // Cache files one-by-one so a single 404 doesn't fail the whole install
    await Promise.all(APP_SHELL.map(async (url) => {
      try {
        const res = await fetch(url, { cache: 'no-cache' });
        if (res.ok) await cache.put(url, res.clone());
        else console.warn('Skip caching (not ok):', url, res.status);
      } catch (err) {
        console.warn('Skip caching (fetch error):', url, err);
      }
    }));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => (k === CACHE_VERSION ? null : caches.delete(k))))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle our scope
  if (url.origin !== self.location.origin || !url.pathname.startsWith('/home_images/')) return;

  // Network-first for HTML/PHP
  if (req.mode === 'navigate' || /\.php$/i.test(url.pathname)) {
    event.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE_VERSION).then(c => c.put(req, copy));
        return res;
      }).catch(() =>
        caches.match(req).then(r => r /*|| caches.match('/home_images/offline.html')*/)
      )
    );
    return;
  }

  // Cache-first for static assets
  if (/\.(css|js|png|jpg|jpeg|webp|svg|ico|gif|ttf|woff2?)$/i.test(url.pathname)) {
    event.respondWith(
      caches.match(req).then(cached => cached ||
        fetch(req).then(res => {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then(c => c.put(req, copy));
          return res;
        }).catch(() => caches.match('/home_images/home.html'))
      )
    );
  }
});
