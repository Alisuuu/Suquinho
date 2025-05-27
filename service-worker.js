const CACHE_NAME = 'suquinho-cache-v1';

const urlsToCache = [
  '/', '/styles.css', '/script.js', '/favicon.ico', '/nave.png',
  '/p.png', '/p2.png', '/planeta.webp',
  '/not2/index.html', '/Hyper/script.js',
  '/links/links.txt', '/links/script.js', '/Styles/styles.css', 'Catalogo1/script1.js', 'Catalogo1/script2.js', 'Catalogo1/script3.js', 'Catalogo1/script4.js', 'Catalogo1/script5.js', 'Catalogo1/index.html',
];

// Instala e armazena os arquivos iniciais
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
});

// Ativa e limpa caches antigos se necessário (opcional)
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(name => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    })
  );
});

// Busca do cache, ou baixa e armazena dinamicamente se não estiver salvo
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      if (response) return response;

      return fetch(event.request).then(networkResponse => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const responseClone = networkResponse.clone();

        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseClone);
        });

        return networkResponse;
      }).catch(() => {
        // Opcional: retornar fallback offline aqui
      });
    })
  );
});
