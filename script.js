document.addEventListener('DOMContentLoaded', function() {
  const newsFrame = document.getElementById('newsFrame');
  const loadingSpaceship = document.getElementById('loadingSpaceship');

  if (newsFrame && loadingSpaceship) {
    let iframeLoadFired = false;
    newsFrame.addEventListener('load', function handleIframeLoad() {
      if (iframeLoadFired && newsFrame.dataset.lastLoadedSrc === this.src) {
        return;
      }
      iframeLoadFired = true;
      newsFrame.dataset.lastLoadedSrc = this.src;
      setTimeout(() => {
        loadingSpaceship.classList.add('hidden');
      }, 300);
    });
    newsFrame.addEventListener('error', function() {
      loadingSpaceship.classList.add('hidden');
    });
  } else {
    if (!newsFrame) console.error("Elemento newsFrame não encontrado!");
    if (loadingSpaceship) {
        loadingSpaceship.classList.add('hidden');
    } else {
        console.error("Elemento loadingSpaceship não encontrado!");
    }
  }

  const suquinhoBtn = document.getElementById('suquinhoBtn');
  if (suquinhoBtn) {
    let clickCount = 0;
    const CLICKS_NEEDED = 10;
    const TIMEOUT_DURATION = 2000;
    let clickTimeout;
    suquinhoBtn.addEventListener('click', () => {
      clearTimeout(clickTimeout);
      clickTimeout = setTimeout(() => {
        clickCount = 0;
      }, TIMEOUT_DURATION);
      clickCount++;
      suquinhoBtn.classList.toggle('enlarged');
      setTimeout(() => {
        suquinhoBtn.classList.remove('enlarged');
      }, 300);
      if (clickCount >= CLICKS_NEEDED) {
        window.location.href = 'game/index.html';
      }
    });
  }

  const iconButtons = document.querySelectorAll('.icon-button');
  iconButtons.forEach(button => {
    button.addEventListener('click', function(event) {
      event.preventDefault();
      const targetUrl = this.href;
      const navigationDelay = 50; // Pequeno delay para permitir que a animação de clique comece
      setTimeout(() => {
        if (newsFrame && targetUrl === newsFrame.src) {
            if(newsFrame.contentWindow) {
                try {
                    newsFrame.contentWindow.location.reload();
                } catch (e) {
                    newsFrame.src = targetUrl; // Fallback se o reload direto falhar (ex: cross-origin)
                }
            }
        } else if (targetUrl && targetUrl !== window.location.href + "#" && !targetUrl.toLowerCase().startsWith('javascript:')) {
          window.location.href = targetUrl;
        }
      }, navigationDelay);
    });
  });

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js')
      .then(function (registration) {
        // Service Worker registered
      })
      .catch(function (error) {
        // console.log('Erro ao registrar o Service Worker:', error);
      });
  }
});

