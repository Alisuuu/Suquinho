const CACHE_NAME = 'suquinho-cache-v4'; // Incremented version to force update
const OFFLINE_PAGE = '/index.html';

const urlsToCache = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/manifest.json',
  '/parar.html',
  '/sw.js',
  '/calendario/index.html',
  '/calendario/script.js',
  '/catalogo1/index.html',
  '/catalogo1/catalogo.js',
  '/game/index.html',
  '/game/css/button.css',
  '/game/css/intro.css',
  '/game/css/shop.css',
  '/game/js/alien.js',
  '/game/js/alien_cannon.js',
  '/game/js/alien_dummy.js',
  '/game/js/alien_follower.js',
  '/game/js/alien_fummy.js',
  '/game/js/alien_launcher.js',
  '/game/js/alien_missile.js',
  '/game/js/alien_mummy.js',
  '/game/js/alien_rock.js',
  '/game/js/alien_shrapnel.js',
  '/game/js/alien_stealer.js',
  '/game/js/alien_turret.js',
  '/game/js/credit.js',
  '/game/js/desktop.js',
  '/game/js/effects.js',
  '/game/js/hit.js',
  '/game/js/index.js',
  '/game/js/intro.js',
  '/game/js/level.js',
  '/game/js/music.js',
  '/game/js/ship.js',
  '/game/js/shop.js',
  '/game/js/shot.js',
  '/game/js/sound.js',
  '/game/js/sprite.js',
  '/game/js/storage.js',
  '/game/js/touchpad.js',
  '/game/music/gravity_sound__no_patience.ogg',
  '/game/sound/explosion.ogg',
  '/game/sound/explosion2.ogg',
  '/game/sound/pew.ogg',
  '/hyper/hyper.html',
  '/hyper/script.js',
  '/js/script.js',
  '/links/links.html',
  '/links/links.txt',
  '/links/pluto_br_final.m3u',
  '/links/vi.mp4',
  '/sorteio/index.html',
  '/sorteio/script.js',
  '/themes/anime/calendario.css',
  '/themes/anime/catálogo.css',
  '/themes/anime/integration.css',
  '/themes/anime/ocultos.css',
  '/themes/anime/player.css',
  '/themes/anime/profile.css',
  '/themes/anime/sidebar.css',
  '/themes/anime/sorteio.css',
  '/themes/anime/update.css',
  '/themes/dracula/calendario.css',
  '/themes/dracula/catálogo.css',
  '/themes/dracula/integration.css',
  '/themes/dracula/ocultos.css',
  '/themes/dracula/player.css',
  '/themes/dracula/profile.css',
  '/themes/dracula/sidebar.css',
  '/themes/dracula/sorteio.css',
  '/themes/dracula/update.css',
  '/themes/noir/calendario.css',
  '/themes/noir/catálogo.css',
  '/themes/noir/integration.css',
  '/themes/noir/ocultos.css',
  '/themes/noir/player.css',
  '/themes/noir/profile.css',
  '/themes/noir/sidebar.css',
  '/themes/noir/sorteio.css',
  '/themes/noir/update.css',
  '/update/index.html',
  '/yt/yt.html',
  '/yt/script.js',
  OFFLINE_PAGE
];

// Instala e armazena os arquivos
self.addEventListener('install', event => {
  self.skipWaiting();  // Ativação mais rápida
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
});

// Limpa caches antigos
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();  // Controle imediato das páginas
});

// Estratégia de cache
self.addEventListener('fetch', event => {
  // Ignora requisições não-GET
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    caches.match(event.request).then(response => {
      // Retorna do cache se disponível
      if (response) return response;
      
      // Busca na rede
      return fetch(event.request).then(networkResponse => {
        // Filtra respostas inválidas
        if (!networkResponse || 
            networkResponse.status !== 200 || 
            networkResponse.type !== 'basic') {
          return networkResponse;
        }
        
        // Armazena no cache
        const responseClone = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseClone);
        });
        
        return networkResponse;
      }).catch(() => {
        // Fallback para navegação offline
        if (event.request.mode === 'navigate') {
          return caches.match(OFFLINE_PAGE);
        }
        // Fallback genérico
        return new Response('Offline - Conteúdo não disponível');
      });
    })
  );
});