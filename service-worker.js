const CACHE_NAME = 'suquinho-cache-v1';
const urlsToCache = [
  '/',
  '/styles.css',
  '/script.js',
  '/favicon.ico',
  '/nave.png',
  '/p.png',
  '/p2.png',
  '/planeta.webp',
  // arquivos das pastas
  '/Hyper/script.js',
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
