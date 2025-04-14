const CACHE_NAME = 'suquinho-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/script.js',
  '/favicon.ico',
  '/nave.png',
  '/p.png',
  '/p2.png',
  '/planeta.webp',
  // arquivos das pastas
  '/Catalogo1/index.html',
  '/Hyper/index.html',
  '/Yt/index.html',
  '/game/index.html',
  '/not2/index.html'
  '/Hyper/styles.css',
  '/Hyper/script.js',
  '/Yt/styles.css',
  '/links/links.txt',
'/links/script.js',
'/Styles/styles.css',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
