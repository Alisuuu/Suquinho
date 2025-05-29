    document.addEventListener('DOMContentLoaded', function() {
        // --- Elementos do DOM (Backdrop e UI Geral) ---
        const loadingSpaceship = document.getElementById('loadingSpaceship');
        const currentImageElem = document.getElementById('currentPoster'); 
        const titleContainerElem = document.getElementById('titleContainer');
        const movieLogoElem = document.getElementById('movieLogo'); 
        
        const helpButton = document.getElementById('helpButton');
        const helpModal = document.getElementById('helpModal');
        const closeHelpModal = document.getElementById('closeHelpModal');
        const newsButton = document.getElementById('newsButton');
        const suquinhoBtn = document.getElementById('suquinhoBtn');

        // --- Elementos do DOM (Listas de Filmes/Séries) ---
        const popularMoviesContainer = document.getElementById('popular_movies_container');
        const topRatedShowsContainer = document.getElementById('top_rated_shows_container');
        const featuredMovieContainer = document.getElementById('featured_movie_container');
        const featuredShowContainer = document.getElementById('featured_show_container');

        const popularMoviesSection = document.getElementById('popular_movies_section');
        const topRatedShowsSection = document.getElementById('top_rated_shows_section');
        const featuredMovieSection = document.getElementById('featured_movie_section');
        const featuredShowSection = document.getElementById('featured_show_section');
        
        const generalErrorMessageLists = document.getElementById('general_error_message_lists');

        // --- Constantes e Variáveis Globais ---
        const TMDB_API_KEY = '5e5da432e96174227b25086fe8637985'; 
        const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
        const TMDB_BACKDROP_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/original'; 
        const TMDB_LOGO_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/original'; 
        const TMDB_POSTER_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w780'; // Qualidade de poster melhorada

        let moviesForBackdrop = [];
        let currentMovieIndexForBackdrop = 0;
        const IMAGE_CHANGE_INTERVAL = 10000; 
        let changeImageTimeoutId = null; 
        let attemptsToFindMovieWithLogoAndBackdrop = 0; // Renomeado para clareza
        let firstImageLoadedSuccessfully = false; 

        const asianLanguages = ['ja', 'ko', 'zh', 'th', 'hi', 'id', 'vi', 'ms', 'ta', 'te', 'fa'];
        const asianOriginCountries = ['JP', 'KR', 'CN', 'HK', 'TH', 'IN', 'ID', 'VN', 'MY', 'PH', 'SG', 'TW', 'IR'];

        // --- Variáveis para Destaques Rotativos das Listas ---
        let popularMoviesList = [];
        let topRatedShowsList = [];
        let currentFeaturedMovieIndex = 0;
        let currentFeaturedShowIndex = 0;
        const FEATURED_ITEM_CHANGE_INTERVAL = 15000; 
        let changeFeaturedItemTimeoutId = null;
        let showFeaturedMovieInRotation = true; 


        // --- Lógica de Modal (Ajuda) ---
        if (helpButton && helpModal && closeHelpModal) {
            helpButton.onclick = function() { helpModal.style.display = "flex"; }
            closeHelpModal.onclick = function() { helpModal.style.display = "none"; }
            window.onclick = function(event) {
                if (event.target == helpModal) { helpModal.style.display = "none"; }
            }
        }
        
        // --- Lógica do Botão de Notícias ---
        if(newsButton) {
            newsButton.addEventListener('click', function(event){
                event.preventDefault();
                console.log("Botão de Notícias clicado!");
                const customAlert = (message) => {
                    const modal = document.createElement('div');
                    modal.style.cssText = 'position:fixed; left:0; top:0; width:100%; height:100%; background-color:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; z-index:3000;';
                    const modalContent = document.createElement('div');
                    modalContent.style.cssText = 'background-color:#333; color:white; padding:20px; border-radius:8px; text-align:center;';
                    const messageP = document.createElement('p');
                    messageP.textContent = message;
                    messageP.style.marginBottom = '15px';
                    const closeBtn = document.createElement('button');
                    closeBtn.textContent = 'OK';
                    closeBtn.style.cssText = 'padding:8px 15px; background-color:#593BA2; color:white; border:none; border-radius:5px; cursor:pointer;';
                    closeBtn.onclick = () => { document.body.removeChild(modal); };
                    modalContent.appendChild(messageP);
                    modalContent.appendChild(closeBtn);
                    modal.appendChild(modalContent);
                    document.body.appendChild(modal);
                };
                customAlert("Funcionalidade de Notícias a ser implementada!");
            });
        }

        // --- Funções de Erro para Listas ---
        function showListsError(message) {
            if (generalErrorMessageLists) {
                generalErrorMessageLists.textContent = message;
                generalErrorMessageLists.classList.remove('hidden');
            }
            [popularMoviesSection, topRatedShowsSection, featuredMovieSection, featuredShowSection].forEach(section => {
                if(section) section.classList.add('hidden');
            });
        }
        function hideListsError() {
            if (generalErrorMessageLists) generalErrorMessageLists.classList.add('hidden');
        }

        // --- Lógica de Backdrop ---
        async function fetchMoviesForBackdrop() {
            if (TMDB_API_KEY === 'YOUR_TMDB_API_KEY' || TMDB_API_KEY.length < 30) {
                console.error("TMDB API Key parece inválida ou é um placeholder.");
                if (loadingSpaceship) loadingSpaceship.classList.add('hidden');
                if (currentImageElem) currentImageElem.style.opacity = 0;
                showListsError("Erro crítico na configuração da API. Não é possível carregar dados.");
                return false; 
            }

            if (loadingSpaceship && !firstImageLoadedSuccessfully) loadingSpaceship.classList.remove('hidden');
            
            attemptsToFindMovieWithLogoAndBackdrop = 0; // Resetar tentativas ao buscar nova lista

            let fetchedMovies = [];
            try {
                const endpoints = [
                    `${TMDB_BASE_URL}/movie/now_playing?api_key=${TMDB_API_KEY}&language=pt-BR&page=1&region=BR`,
                    `${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&language=pt-BR&page=1&region=BR`,
                    `${TMDB_BASE_URL}/movie/upcoming?api_key=${TMDB_API_KEY}&language=pt-BR&page=1&region=BR` 
                ];

                for (const endpoint of endpoints) {
                    const response = await fetch(endpoint);
                    if (!response.ok) {
                        console.warn(`Falha ao buscar de ${endpoint}: ${response.status}`);
                        continue; 
                    }
                    const data = await response.json();
                    if (data.results) {
                        fetchedMovies = fetchedMovies.concat(data.results.filter(movie => movie.backdrop_path && movie.title));
                    }
                }
              
                moviesForBackdrop = fetchedMovies.filter(movie => {
                    const isAsianLanguage = asianLanguages.includes(movie.original_language);
                    const isAsianCountry = movie.origin_country && movie.origin_country.some(countryCode => asianOriginCountries.includes(countryCode.toUpperCase()));
                    return !isAsianLanguage && !isAsianCountry;
                });

                moviesForBackdrop = moviesForBackdrop.filter((movie, index, self) =>
                    index === self.findIndex((m) => m.id === movie.id)
                );
                moviesForBackdrop.sort(() => 0.5 - Math.random()); 

                if (moviesForBackdrop.length > 0) {
                    if (changeImageTimeoutId) clearInterval(changeImageTimeoutId); 
                    await changeImage(); 
                    changeImageTimeoutId = setInterval(changeImage, IMAGE_CHANGE_INTERVAL); 
                    return true; 
                } else {
                    console.error("Nenhum filme (não-asiático, com backdrop) encontrado para o slideshow de fundo.");
                    if (currentImageElem) currentImageElem.style.opacity = 0; 
                    if (loadingSpaceship && !loadingSpaceship.classList.contains('hidden') && !firstImageLoadedSuccessfully) {
                        loadingSpaceship.classList.add('hidden');
                    }
                    return false; 
                }
            } catch (error) {
                console.error('Erro ao buscar filmes para backdrop:', error);
                if (currentImageElem) currentImageElem.style.opacity = 0;
                if (loadingSpaceship && !loadingSpaceship.classList.contains('hidden') && !firstImageLoadedSuccessfully) {
                    loadingSpaceship.classList.add('hidden');
                }
                return false; 
            } 
        }

        async function fetchMovieLogo(movieId) {
            try {
                const response = await fetch(`${TMDB_BASE_URL}/movie/${movieId}/images?api_key=${TMDB_API_KEY}&include_image_language=pt,en,null`);
                if (!response.ok) return null; 
                const data = await response.json();
                if (data.logos && data.logos.length > 0) {
                    let logo = data.logos.find(l => l.iso_639_1 === 'pt' && l.file_path.endsWith('.png'));
                    if (!logo) logo = data.logos.find(l => l.iso_639_1 === 'en' && l.file_path.endsWith('.png'));
                    if (!logo) logo = data.logos.find(l => (l.iso_639_1 === null || l.iso_639_1 === '') && l.file_path.endsWith('.png'));
                    if (!logo) logo = data.logos.find(l => l.file_path.endsWith('.png')); // Fallback para qualquer PNG, mas a checagem .endsWith('.png') é crucial
                    
                    // Garante que estamos retornando apenas se for PNG
                    if (logo && logo.file_path.endsWith('.png')) {
                        return logo;
                    }
                }
            } catch (error) {
                console.warn('Erro ao buscar logo do filme:', movieId, error);
            }
            return null; // Retorna null se não encontrar logo PNG ou se houver erro
        }

        async function changeImage() {
            if (!moviesForBackdrop || moviesForBackdrop.length === 0) {
                if (loadingSpaceship && !loadingSpaceship.classList.contains('hidden') && !firstImageLoadedSuccessfully) {
                    loadingSpaceship.classList.add('hidden');
                }
                return;
            }

            if (attemptsToFindMovieWithLogoAndBackdrop >= moviesForBackdrop.length * 2) { // Permite duas voltas completas
                console.warn("Nenhum filme com backdrop e logo PNG encontrado após várias tentativas para o slideshow de fundo.");
                if (loadingSpaceship && !loadingSpaceship.classList.contains('hidden') && !firstImageLoadedSuccessfully) {
                    loadingSpaceship.classList.add('hidden');
                }
                // Não limpa o intervalo, apenas para de tentar ativamente e deixa o timer chamar de novo.
                // Se a lista for atualizada, attemptsToFindMovieWithLogoAndBackdrop será resetado.
                currentMovieIndexForBackdrop = (currentMovieIndexForBackdrop + 1) % moviesForBackdrop.length; // Continua ciclando o índice
                return;
            }
        
            const movieToDisplay = moviesForBackdrop[currentMovieIndexForBackdrop];
        
            if (!movieToDisplay) {
                console.error("Filme indefinido no índice atual do backdrop. Próximo.");
                currentMovieIndexForBackdrop = (currentMovieIndexForBackdrop + 1) % moviesForBackdrop.length;
                attemptsToFindMovieWithLogoAndBackdrop++; 
                requestAnimationFrame(changeImage);
                return; 
            }
        
            // Fade out current images before loading new ones
            if(currentImageElem) currentImageElem.style.opacity = 0;
            if(movieLogoElem) movieLogoElem.style.opacity = 0;
            if(titleContainerElem) titleContainerElem.style.opacity = 0;
        
            if (!movieToDisplay.backdrop_path) {
                console.log(`Backdrop: Filme "${movieToDisplay.title}" saltado (sem backdrop_path). Próximo.`);
                currentMovieIndexForBackdrop = (currentMovieIndexForBackdrop + 1) % moviesForBackdrop.length;
                attemptsToFindMovieWithLogoAndBackdrop++;
                requestAnimationFrame(changeImage); 
                return;
            }
        
            const movieLogoData = await fetchMovieLogo(movieToDisplay.id); // fetchMovieLogo agora só retorna PNGs válidos ou null

            if (!movieLogoData) { // Se fetchMovieLogo retornou null (sem logo PNG)
                console.log(`Backdrop: Filme "${movieToDisplay.title}" saltado (sem logo PNG). Próximo.`);
                currentMovieIndexForBackdrop = (currentMovieIndexForBackdrop + 1) % moviesForBackdrop.length;
                attemptsToFindMovieWithLogoAndBackdrop++;
                requestAnimationFrame(changeImage);
                return;
            }
            
            // Se chegou aqui, temos backdrop E logo PNG.
            attemptsToFindMovieWithLogoAndBackdrop = 0; // Resetar tentativas pois encontramos um candidato válido

            const preloadBackdrop = new Image();
            const backdropSrc = `${TMDB_BACKDROP_IMAGE_BASE_URL}${movieToDisplay.backdrop_path}`;
        
            preloadBackdrop.onload = () => {
                if (!firstImageLoadedSuccessfully && loadingSpaceship && !loadingSpaceship.classList.contains('hidden')) {
                    loadingSpaceship.classList.add('hidden');
                    firstImageLoadedSuccessfully = true;
                }
        
                if(currentImageElem) {
                    currentImageElem.src = preloadBackdrop.src;
                    currentImageElem.alt = `Fundo de ${movieToDisplay.title || 'Filme'}`;
                    currentImageElem.style.opacity = 1; 
                }
        
                // movieLogoData já é garantido ser um logo PNG válido aqui
                const preloadLogo = new Image();
                preloadLogo.onload = () => {
                    if(movieLogoElem) {
                        movieLogoElem.src = preloadLogo.src;
                        movieLogoElem.alt = `Logo de ${movieToDisplay.title}`;
                        // Para aumentar o tamanho do logo, ajuste max-height/max-width no CSS do elemento #movieLogo
                        movieLogoElem.style.display = 'block';
                        void movieLogoElem.offsetWidth; 
                        movieLogoElem.style.opacity = 1; 
                    }
                    if(titleContainerElem) titleContainerElem.style.opacity = 1; 
                };
                preloadLogo.onerror = () => {
                    // Este erro é menos provável agora que filtramos, mas mantemos por segurança
                    console.warn(`Backdrop: Erro ao carregar LOGO PNG ${movieLogoData.file_path} para "${movieToDisplay.title}".`);
                    if(movieLogoElem) movieLogoElem.style.display = 'none';
                    if(titleContainerElem) titleContainerElem.style.opacity = 0; 
                };
                preloadLogo.src = `${TMDB_LOGO_IMAGE_BASE_URL}${movieLogoData.file_path}`;
            };
        
            preloadBackdrop.onerror = () => {
                console.error(`Backdrop: Erro ao carregar imagem de fundo: ${backdropSrc}. Tentando próximo filme.`);
                currentMovieIndexForBackdrop = (currentMovieIndexForBackdrop + 1) % moviesForBackdrop.length;
                // Não incrementar attemptsToFindMovieWithLogoAndBackdrop aqui, pois o problema foi o backdrop, não o logo.
                // Ou podemos contar, mas a lógica de skip já o faria.
                // A questão é se um backdrop falhar, devemos pular o filme. Sim.
                attemptsToFindMovieWithLogoAndBackdrop++; // Contamos como tentativa falha de exibir este item.
                requestAnimationFrame(changeImage);
            };
        
            preloadBackdrop.src = backdropSrc;
            currentMovieIndexForBackdrop = (currentMovieIndexForBackdrop + 1) % moviesForBackdrop.length;
        }

        // --- Lógica de Listas de Filmes/Séries ---
        async function fetchTMDBDataForLists(endpoint, pages = 1) {
            let allResults = [];
            try {
                for (let i = 1; i <= pages; i++) {
                    const response = await fetch(`${TMDB_BASE_URL}${endpoint}?api_key=${TMDB_API_KEY}&language=pt-BR&page=${i}`);
                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.status_message || `Erro HTTP: ${response.status}`);
                    }
                    const data = await response.json();
                    allResults = allResults.concat(data.results);
                }
                return allResults;
            } catch (error) {
                console.error(`Erro ao buscar dados da API para listas (${endpoint}):`, error);
                showListsError(`Erro ao buscar dados para listas (${endpoint.split('/')[1]}): ${error.message}.`);
                return null;
            }
        }

        function createItemCard(item, type) {
            const title = type === 'movie' ? item.title : item.name;
            const releaseDate = type === 'movie' ? item.release_date : item.first_air_date;
            const posterPath = item.poster_path ? `${TMDB_POSTER_IMAGE_BASE_URL}${item.poster_path}` : 'https://placehold.co/780x1170/1f2937/9ca3af?text=Sem+Imagem';
            const overview = item.overview ? (item.overview.substring(0, 70) + (item.overview.length > 70 ? '...' : '')) : 'Sem sinopse.';

            return `
                <div class="card">
                    <img src="${posterPath}" alt="Poster de ${title}" loading="lazy" onerror="this.onerror=null;this.src='https://placehold.co/780x1170/1f2937/9ca3af?text=Erro+Img';">
                    <div class="card-content">
                        <div>
                            <h3 class="card-title">${title}</h3>
                            <p class="card-info text-xs mb-1">${overview}</p>
                        </div>
                        <div>
                            <p class="card-info">Lançamento: ${releaseDate ? new Date(releaseDate).toLocaleDateString('pt-BR') : 'N/A'}</p>
                            <p class="card-info">Nota: ${item.vote_average ? item.vote_average.toFixed(1) : 'N/A'} ⭐</p>
                        </div>
                    </div>
                </div>
            `;
        }
        
        function createFeaturedItemCard(item, type) {
            const title = type === 'movie' ? item.title : item.name;
            const releaseDate = type === 'movie' ? item.release_date : item.first_air_date;
            const overview = item.overview || 'Sinopse não disponível.';
            const posterPath = item.poster_path ? `${TMDB_POSTER_IMAGE_BASE_URL}${item.poster_path}` : 'https://placehold.co/390x585/1f2937/9ca3af?text=Sem+Imagem';

            return `
                <img src="${posterPath}" alt="Poster de ${title}" class="rounded-l-lg" onerror="this.onerror=null;this.src='https://placehold.co/390x585/1f2937/9ca3af?text=Erro+Img';">
                <div class="featured-content">
                    <h3 class="featured-title">${title}</h3>
                    <p class="featured-overview">${overview}</p>
                    <p class="card-info text-base">Lançamento: ${releaseDate ? new Date(releaseDate).toLocaleDateString('pt-BR') : 'N/A'}</p>
                    <p class="card-info text-base">Nota: ${item.vote_average ? item.vote_average.toFixed(1) : 'N/A'} ⭐</p>
                    <p class="card-info text-base">Popularidade: ${item.popularity ? item.popularity.toFixed(0) : 'N/A'}</p>
                </div>
            `;
        }

        function displayItemsInGrid(items, containerElement, itemType, limit = 50) {
            if (!containerElement) return;
            containerElement.innerHTML = ''; 
            if (!items || items.length === 0) {
                containerElement.innerHTML = `<p class="text-gray-400 col-span-full text-center">Nenhum ${itemType === 'movie' ? 'filme' : 'programa de TV'} encontrado.</p>`;
                return;
            }
            const itemsToDisplay = items.slice(0, limit);
            itemsToDisplay.forEach(item => {
                containerElement.innerHTML += createItemCard(item, itemType);
            });
        }

        function displayFeaturedItemInCard(item, containerElement, itemType) {
            if (!containerElement) return;
            containerElement.innerHTML = '';
            if (!item) {
                containerElement.innerHTML = '<p class="text-gray-400 text-center">Nenhum item em destaque para exibir.</p>';
                return;
            }
            containerElement.innerHTML = createFeaturedItemCard(item, itemType);
        }

        function updateFeaturedItems() {
            if (featuredMovieSection) featuredMovieSection.classList.add('hidden');
            if (featuredShowSection) featuredShowSection.classList.add('hidden');
        
            const hasPopularMovies = popularMoviesList && popularMoviesList.length > 0;
            const hasTopRatedShows = topRatedShowsList && topRatedShowsList.length > 0;
        
            if (!hasPopularMovies && !hasTopRatedShows) {
                return; 
            }
        
            let movieShownThisCycle = false;
            let seriesShownThisCycle = false;
        
            if (showFeaturedMovieInRotation) {
                if (hasPopularMovies) {
                    const movieToShow = popularMoviesList[currentFeaturedMovieIndex];
                    displayFeaturedItemInCard(movieToShow, featuredMovieContainer, 'movie');
                    if (featuredMovieSection) featuredMovieSection.classList.remove('hidden');
                    currentFeaturedMovieIndex = (currentFeaturedMovieIndex + 1) % popularMoviesList.length;
                    movieShownThisCycle = true;
                } else if (hasTopRatedShows) { 
                    const showToShow = topRatedShowsList[currentFeaturedShowIndex];
                    displayFeaturedItemInCard(showToShow, featuredShowContainer, 'tv');
                    if (featuredShowSection) featuredShowSection.classList.remove('hidden');
                    currentFeaturedShowIndex = (currentFeaturedShowIndex + 1) % topRatedShowsList.length;
                    seriesShownThisCycle = true;
                }
            } else { 
                if (hasTopRatedShows) {
                    const showToShow = topRatedShowsList[currentFeaturedShowIndex];
                    displayFeaturedItemInCard(showToShow, featuredShowContainer, 'tv');
                    if (featuredShowSection) featuredShowSection.classList.remove('hidden');
                    currentFeaturedShowIndex = (currentFeaturedShowIndex + 1) % topRatedShowsList.length;
                    seriesShownThisCycle = true;
                } else if (hasPopularMovies) { 
                    const movieToShow = popularMoviesList[currentFeaturedMovieIndex];
                    displayFeaturedItemInCard(movieToShow, featuredMovieContainer, 'movie');
                    if (featuredMovieSection) featuredMovieSection.classList.remove('hidden');
                    currentFeaturedMovieIndex = (currentFeaturedMovieIndex + 1) % popularMoviesList.length;
                    movieShownThisCycle = true;
                }
            }
        
            if (movieShownThisCycle && hasTopRatedShows) {
                showFeaturedMovieInRotation = false;
            } else if (seriesShownThisCycle && hasPopularMovies) {
                showFeaturedMovieInRotation = true;
            } else if (movieShownThisCycle && !hasTopRatedShows) {
                showFeaturedMovieInRotation = true; 
            } else if (seriesShownThisCycle && !hasPopularMovies) {
                showFeaturedMovieInRotation = false; 
            }
        }


        async function loadAllListsData() {
            hideListsError();
        
            const fetchedPopularMovies = await fetchTMDBDataForLists('/movie/popular', 3); 
            if (fetchedPopularMovies && fetchedPopularMovies.length > 0) {
                popularMoviesList = fetchedPopularMovies.slice(0, 50); 
                displayItemsInGrid(popularMoviesList, popularMoviesContainer, 'movie', 50); 
                if(popularMoviesSection) popularMoviesSection.classList.remove('hidden');
            } else {
                popularMoviesList = []; 
                if (popularMoviesSection) popularMoviesSection.classList.add('hidden');
                console.log("Lista de filmes populares está vazia ou falhou ao carregar.");
            }
        
            const fetchedTopRatedShows = await fetchTMDBDataForLists('/tv/top_rated', 3); 
            if (fetchedTopRatedShows && fetchedTopRatedShows.length > 0) {
                topRatedShowsList = fetchedTopRatedShows.slice(0, 50); 
                displayItemsInGrid(topRatedShowsList, topRatedShowsContainer, 'tv', 50); 
                if(topRatedShowsSection) topRatedShowsSection.classList.remove('hidden');
            } else {
                topRatedShowsList = []; 
                if (topRatedShowsSection) topRatedShowsSection.classList.add('hidden');
                console.log("Lista de séries mais votadas está vazia ou falhou ao carregar.");
            }
            
            if (popularMoviesList.length > 0 || topRatedShowsList.length > 0) {
                if (featuredMovieSection) featuredMovieSection.classList.add('hidden'); 
                if (featuredShowSection) featuredShowSection.classList.add('hidden'); 

                updateFeaturedItems(); 
                if (changeFeaturedItemTimeoutId) clearInterval(changeFeaturedItemTimeoutId); 
                changeFeaturedItemTimeoutId = setInterval(updateFeaturedItems, FEATURED_ITEM_CHANGE_INTERVAL);
            } else { 
                if (featuredMovieSection) featuredMovieSection.classList.add('hidden');
                if (featuredShowSection) featuredShowSection.classList.add('hidden');
                console.log("Nenhum filme ou série para destacar na rotação.");
            }
        }

        // --- Lógica de Botões Adicionais (Suquinho, etc.) ---
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
                if (clickCount >= CLICKS_NEEDED) { 
                    window.location.href = 'game/index.html'; 
                }
            });
        }

        const iconButtons = document.querySelectorAll('.actions-menu .icon-button:not(#newsButton):not(#helpButton):not(#suquinhoBtn)');
        iconButtons.forEach(button => {
            button.addEventListener('click', function(event) {
                event.preventDefault();
                const targetUrl = this.href || this.closest('a')?.href; 
                if (targetUrl && targetUrl !== window.location.href + "#" && !targetUrl.toLowerCase().startsWith('javascript:')) {
                    setTimeout(() => { window.location.href = targetUrl; }, 50);
                }
            });
        });
        
        // --- Inicialização ---
        async function initializeApp() {
            const backdropSuccess = await fetchMoviesForBackdrop(); // Tenta carregar backdrops primeiro
            
            if (TMDB_API_KEY !== 'YOUR_TMDB_API_KEY' && TMDB_API_KEY.length >= 30) {
                 await loadAllListsData(); // Carrega listas de filmes/séries
            } else {
                showListsError("Configuração de API inválida. Não é possível carregar listas de filmes/séries.");
            }

            // Garante que o loading do backdrop suma se o fetchMoviesForBackdrop falhar mas a API key for válida para as listas
            if (!backdropSuccess && loadingSpaceship && !loadingSpaceship.classList.contains('hidden') && firstImageLoadedSuccessfully === false ) {
                 loadingSpaceship.classList.add('hidden'); 
            }
        }

        initializeApp();

        // --- Service Worker (opcional, mantido do script original) ---
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('service-worker.js') 
            .then(function (registration) { /* console.log('SW registered'); */ })
            .catch(function (error) { /* console.log('SW registration error:', error); */ });
        }
    });

              
