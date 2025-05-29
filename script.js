document.addEventListener('DOMContentLoaded', function() {
  const loadingSpaceship = document.getElementById('loadingSpaceship');
  const currentImageElem = document.getElementById('currentPoster'); 
  const titleContainerElem = document.getElementById('titleContainer');
  const movieLogoElem = document.getElementById('movieLogo'); 
  
  const helpButton = document.getElementById('helpButton');
  const helpModal = document.getElementById('helpModal');
  const closeHelpModal = document.getElementById('closeHelpModal');
  const newsButton = document.getElementById('newsButton');
  
  const TMDB_API_KEY = '5e5da432e96174227b25086fe8637985'; 
  const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
  const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/original'; 
  const TMDB_LOGO_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/original'; 

  let movies = [];
  let currentMovieIndex = 0;
  const IMAGE_CHANGE_INTERVAL = 10000; 
  let changeImageTimeoutId = null; 
  let attemptsToFindMovieWithLogo = 0; 
  let firstImageLoadedSuccessfully = false;

  const asianLanguages = ['ja', 'ko', 'zh', 'th', 'hi', 'id', 'vi', 'ms', 'ta', 'te', 'fa'];
  const asianOriginCountries = ['JP', 'KR', 'CN', 'HK', 'TH', 'IN', 'ID', 'VN', 'MY', 'PH', 'SG', 'TW', 'IR'];

  // --- Modal Logic ---
  if (helpButton && helpModal && closeHelpModal) {
    helpButton.onclick = function() {
      helpModal.style.display = "flex";
    }
    closeHelpModal.onclick = function() {
      helpModal.style.display = "none";
    }
    window.onclick = function(event) {
      if (event.target == helpModal) {
        helpModal.style.display = "none";
      }
    }
  }
  
  // --- News Button Logic (Placeholder) ---
  if(newsButton) {
      newsButton.addEventListener('click', function(event){
          event.preventDefault();
          // Aqui você pode definir para onde o botão de notícias deve levar.
          // Exemplo: window.location.href = 'sua-pagina-de-noticias.html';
          // Por agora, vamos apenas logar no console e mostrar um alerta customizado (se tivesse um).
          console.log("Botão de Notícias clicado!");
          // Simula um modal customizado para o alerta
          const customAlert = (message) => {
              const modal = document.createElement('div');
              modal.style.position = 'fixed';
              modal.style.left = '0';
              modal.style.top = '0';
              modal.style.width = '100%';
              modal.style.height = '100%';
              modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
              modal.style.display = 'flex';
              modal.style.alignItems = 'center';
              modal.style.justifyContent = 'center';
              modal.style.zIndex = '3000';

              const modalContent = document.createElement('div');
              modalContent.style.backgroundColor = '#333';
              modalContent.style.color = 'white';
              modalContent.style.padding = '20px';
              modalContent.style.borderRadius = '8px';
              modalContent.style.textAlign = 'center';
              
              const messageP = document.createElement('p');
              messageP.textContent = message;
              messageP.style.marginBottom = '15px';

              const closeBtn = document.createElement('button');
              closeBtn.textContent = 'OK';
              closeBtn.style.padding = '8px 15px';
              closeBtn.style.backgroundColor = '#593BA2';
              closeBtn.style.color = 'white';
              closeBtn.style.border = 'none';
              closeBtn.style.borderRadius = '5px';
              closeBtn.style.cursor = 'pointer';

              closeBtn.onclick = () => {
                  document.body.removeChild(modal);
              };

              modalContent.appendChild(messageP);
              modalContent.appendChild(closeBtn);
              modal.appendChild(modalContent);
              document.body.appendChild(modal);
          };
          customAlert("Funcionalidade de Notícias a ser implementada!");
      });
  }


  async function fetchMovies() {
    if (TMDB_API_KEY === 'YOUR_TMDB_API_KEY' || TMDB_API_KEY.length < 30) {
      console.error("TMDB API Key parece inválida ou é um placeholder.");
      if (loadingSpaceship) loadingSpaceship.classList.add('hidden');
      if (currentImageElem) currentImageElem.style.opacity = 0;
      console.error("Erro na API, não será possível exibir filmes.");
      document.body.style.backgroundColor = '#101010';
      return;
    }

    if (loadingSpaceship) loadingSpaceship.classList.remove('hidden');
    titleContainerElem.style.opacity = 0; 
    currentImageElem.style.opacity = 0; 
    attemptsToFindMovieWithLogo = 0; 
    firstImageLoadedSuccessfully = false;

    let fetchedMovies = [];
    try {
      const nowPlayingResponse = await fetch(`${TMDB_BASE_URL}/movie/now_playing?api_key=${TMDB_API_KEY}&language=pt-BR&page=1&region=BR`);
      const nowPlayingData = await nowPlayingResponse.json();
      if (nowPlayingData.results) {
        fetchedMovies = fetchedMovies.concat(nowPlayingData.results.filter(movie => movie.backdrop_path && movie.title));
      }

      const popularResponse = await fetch(`${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&language=pt-BR&page=1&region=BR`);
      const popularData = await popularResponse.json();
      if (popularData.results) {
        fetchedMovies = fetchedMovies.concat(popularData.results.filter(movie => movie.backdrop_path && movie.title));
      }
      
      movies = fetchedMovies.filter(movie => {
        const isAsianLanguage = asianLanguages.includes(movie.original_language);
        const isAsianCountry = movie.origin_country && movie.origin_country.some(countryCode => asianOriginCountries.includes(countryCode.toUpperCase()));
        return !isAsianLanguage && !isAsianCountry;
      });

      movies = movies.filter((movie, index, self) =>
        index === self.findIndex((m) => m.id === movie.id)
      );
      movies.sort(() => 0.5 - Math.random()); 

      if (movies.length > 0) {
        if (changeImageTimeoutId) clearInterval(changeImageTimeoutId); 
        changeImage(); 
        changeImageTimeoutId = setInterval(changeImage, IMAGE_CHANGE_INTERVAL); 
      } else {
        console.error("Nenhum filme (não-asiático, lançado/popular) encontrado com os critérios.");
        if (currentImageElem) currentImageElem.style.opacity = 0; 
        if (loadingSpaceship && !loadingSpaceship.classList.contains('hidden')) loadingSpaceship.classList.add('hidden');
      }
    } catch (error) {
      console.error('Erro ao buscar filmes:', error);
      if (currentImageElem) currentImageElem.style.opacity = 0;
      if (loadingSpaceship && !loadingSpaceship.classList.contains('hidden')) loadingSpaceship.classList.add('hidden');
    } 
  }

  async function fetchMovieLogo(movieId) {
    try {
      const response = await fetch(`${TMDB_BASE_URL}/movie/${movieId}/images?api_key=${TMDB_API_KEY}&include_image_language=pt,en,null`);
      const data = await response.json();
      if (data.logos && data.logos.length > 0) {
        let logo = data.logos.find(l => l.iso_639_1 === 'pt' && l.file_path.endsWith('.png'));
        if (!logo) logo = data.logos.find(l => l.iso_639_1 === 'en' && l.file_path.endsWith('.png'));
        if (!logo) logo = data.logos.find(l => (l.iso_639_1 === null || l.iso_639_1 === '') && l.file_path.endsWith('.png'));
        if (!logo) logo = data.logos.find(l => l.file_path.endsWith('.png'));
        return logo; 
      }
    } catch (error) {
      console.error('Erro ao buscar logo do filme:', movieId, error);
    }
    return null;
  }

  async function changeImage() { 
    if (movies.length === 0) {
        console.log("Lista de filmes vazia.");
        if (loadingSpaceship && !loadingSpaceship.classList.contains('hidden') && !firstImageLoadedSuccessfully) {
             loadingSpaceship.classList.add('hidden');
        }
        return;
    }

    if (attemptsToFindMovieWithLogo >= movies.length * 2) { 
        console.warn("Nenhum filme com logo PNG encontrado após várias tentativas.");
        currentImageElem.style.opacity = 0; 
        titleContainerElem.style.opacity = 0;
        if (changeImageTimeoutId) clearInterval(changeImageTimeoutId); 
        if (loadingSpaceship && !loadingSpaceship.classList.contains('hidden') && !firstImageLoadedSuccessfully) {
            loadingSpaceship.classList.add('hidden');
        }
        return;
    }

    const movieToDisplay = movies[currentMovieIndex];
    const movieLogoData = await fetchMovieLogo(movieToDisplay.id);

    if (movieLogoData && movieLogoData.file_path && movieLogoData.file_path.endsWith('.png')) {
        attemptsToFindMovieWithLogo = 0; 

        movieLogoElem.style.opacity = 0; 
        movieLogoElem.style.display = 'none';
        titleContainerElem.style.opacity = 0; 
        
        const preloadBackdrop = new Image();
        const preloadLogo = new Image();
        let backdropLoaded = false;
        let logoLoaded = false;

        const displayContent = () => {
            if (backdropLoaded && logoLoaded) {
                if (!firstImageLoadedSuccessfully && loadingSpaceship && !loadingSpaceship.classList.contains('hidden')) {
                    loadingSpaceship.classList.add('hidden');
                    firstImageLoadedSuccessfully = true;
                }
                
                currentImageElem.src = preloadBackdrop.src;
                currentImageElem.alt = `Fundo de ${movieToDisplay.title || 'Filme'}`;
                currentImageElem.style.opacity = 1; 
                
                movieLogoElem.src = preloadLogo.src;
                movieLogoElem.alt = `Logo de ${movieToDisplay.title}`;
                
                movieLogoElem.style.display = 'block'; 
                void movieLogoElem.offsetWidth;      
                movieLogoElem.style.opacity = 1;    

                titleContainerElem.style.opacity = 1;
            }
        };

        preloadBackdrop.onload = () => {
            backdropLoaded = true;
            displayContent();
        };
        preloadBackdrop.onerror = () => {
            console.error(`Erro ao carregar imagem de fundo: ${preloadBackdrop.src}. Tentando próximo filme.`);
            currentImageElem.style.opacity = 0; 
            currentMovieIndex = (currentMovieIndex + 1) % movies.length;
            attemptsToFindMovieWithLogo++; 
            requestAnimationFrame(changeImage); 
        };

        preloadLogo.onload = () => {
            logoLoaded = true;
            displayContent();
        };
        preloadLogo.onerror = () => {
            console.error(`Erro ao carregar LOGO: ${preloadLogo.src}. Saltando filme "${movieToDisplay.title}".`);
            titleContainerElem.style.opacity = 0; 
            currentImageElem.style.opacity = 0;   
            currentMovieIndex = (currentMovieIndex + 1) % movies.length;
            attemptsToFindMovieWithLogo++;
            requestAnimationFrame(changeImage);
        };
        
        preloadBackdrop.src = `${TMDB_IMAGE_BASE_URL}${movieToDisplay.backdrop_path}`;
        preloadLogo.src = `${TMDB_LOGO_IMAGE_BASE_URL}${movieLogoData.file_path}`;

    } else {
        console.log(`Filme "${movieToDisplay.title}" saltado (sem logo PNG). Tentativa ${attemptsToFindMovieWithLogo + 1}`);
        currentMovieIndex = (currentMovieIndex + 1) % movies.length;
        attemptsToFindMovieWithLogo++;
        requestAnimationFrame(changeImage); 
        return; 
    }

    currentMovieIndex = (currentMovieIndex + 1) % movies.length; 
  }

  fetchMovies();

  const suquinhoBtn = document.getElementById('suquinhoBtn');
  if (suquinhoBtn) {
    let clickCount = 0;
    const CLICKS_NEEDED = 10;
    const TIMEOUT_DURATION = 2000;
    let clickTimeout;
    suquinhoBtn.addEventListener('click', () => {
      clearTimeout(clickTimeout);
      clickTimeout = setTimeout(() => { clickCount = 0; }, TIMEOUT_DURATION);
      clickCount++;
      suquinhoBtn.classList.toggle('enlarged');
      setTimeout(() => { suquinhoBtn.classList.remove('enlarged');}, 300);
      if (clickCount >= CLICKS_NEEDED) { window.location.href = 'game/index.html'; }
    });
  }

  const iconButtons = document.querySelectorAll('.icon-button:not(#newsButton)');
  iconButtons.forEach(button => {
    button.addEventListener('click', function(event) {
      event.preventDefault();
      const targetUrl = this.href;
      const navigationDelay = 50;       
      setTimeout(() => {
        if (targetUrl && targetUrl !== window.location.href + "#" && !targetUrl.toLowerCase().startsWith('javascript:')) {
          window.location.href = targetUrl;
        }
      }, navigationDelay);
    });
  });

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js') 
      .then(function (registration) { /* console.log('SW registered'); */ })
      .catch(function (error) { /* console.log('SW registration error:', error); */ });
  }
});
</script>
</body>
</html>

