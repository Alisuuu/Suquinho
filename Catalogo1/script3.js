// =========================================================================
// SCRIPT PRINCIPAL DO CATÁLOGO (CORRIGIDO)
// Versão corrigida para criar dinamicamente o wrapper do player,
// garantindo que o modal funcione mesmo quando chamado de outros scripts.
// =========================================================================

// --- Funções da API, Lógica Principal, Filtros e Modal de Detalhes ---

function getCompanyConfigForQuery(query) {
    const normalizedQuery = query.toLowerCase().trim();
    if (typeof companyKeywordMap === 'undefined') {
        console.error("A variável 'companyKeywordMap' de script1.js não foi encontrada.");
        return null;
    }
    for (const keyword in companyKeywordMap) {
        if (normalizedQuery.includes(keyword)) {
            return companyKeywordMap[keyword];
        }
    }
    return null;
}

function stopMainPageBackdropSlideshow() {
    console.log("LOG (stopMainPageBackdropSlideshow): Slideshow parado.");
    clearInterval(mainPageBackdropSlideshowInterval);
    mainPageBackdropSlideshowInterval = null;
}

function startMainPageBackdropSlideshow() {
    stopMainPageBackdropSlideshow();
    if (mainPageBackdropPaths.length === 0) {
        console.warn("LOG (startMainPageBackdropSlideshow): Não há backdrops para iniciar o slideshow.");
        updatePageBackground(null);
        return;
    }
    console.log("LOG (startMainPageBackdropSlideshow): Slideshow iniciado.");
    updatePageBackground(mainPageBackdropPaths[currentMainPageBackdropIndex]);
    mainPageBackdropSlideshowInterval = setInterval(() => {
        currentMainPageBackdropIndex = (currentMainPageBackdropIndex + 1) % mainPageBackdropPaths.length;
        updatePageBackground(mainPageBackdropPaths[currentMainPageBackdropIndex]);
    }, 8000);
}

async function fetchTMDB(endpoint, params = {}) {
    const urlParams = new URLSearchParams({ api_key: TMDB_API_KEY, language: LANGUAGE, include_adult: 'false', ...params });
    const url = `${TMDB_BASE_URL}${endpoint}?${urlParams}`;
    console.log("LOG (fetchTMDB): Tentando buscar URL:", url);
    try {
        const response = await fetch(url);
        if (!response.ok) {
            let errorData;
            try { errorData = await response.json(); } catch (e) {
                console.warn("Falha ao parsear JSON da resposta de erro da API TMDB:", e);
                errorData = { status_message: response.statusText || "Falha ao obter detalhes do erro da API.", success: false };
            }
            console.error(`TMDB API Error: ${response.status} ${response.statusText}`, errorData);
            return { error: true, status: response.status, message: errorData.status_message || "Erro desconhecido da API." };
        }
        return await response.json();
    } catch (error) {
        console.error('Erro de rede ou configuração de fetch ao buscar dados do TMDB:', error);
        throw error;
    }
}

async function loadMainPageContent() {
    console.log("loadMainPageContent called");
    showLoader();
    if (defaultContentSections) defaultContentSections.style.display = 'block';
    if (singleResultsSection) singleResultsSection.style.display = 'none';
    if (filterToggleButton) filterToggleButton.classList.remove('active');
    activeAppliedGenre = { id: null, name: null, type: null };
    selectedGenreSA = { id: null, name: null, type: null };
    currentContentContext = 'main';

    popularMoviesCurrentPage = 1; popularMoviesTotalPages = 1; isLoadingMorePopularMovies = false;
    topRatedTvShowsCurrentPage = 1; topRatedTvShowsTotalPages = 1; isLoadingMoreTopRatedTvShows = false;
    if (moviesResultsGrid) moviesResultsGrid.innerHTML = '';
    if (tvShowsResultsGrid) tvShowsResultsGrid.innerHTML = '';
    mainPageBackdropPaths = []; currentMainPageBackdropIndex = 0;

    const moviesPromise = fetchTMDB(`/movie/popular`, { page: popularMoviesCurrentPage });
    const tvShowsPromise = fetchTMDB(`/tv/top_rated`, { page: topRatedTvShowsCurrentPage });
    const [moviesData, tvShowsData] = await Promise.all([moviesPromise, tvShowsPromise]);

    if (moviesResultsGrid) {
        if (moviesData && !moviesData.error && moviesData.results) {
            popularMoviesTotalPages = moviesData.total_pages || 1;
            displayResults(moviesData.results, 'movie', moviesResultsGrid, true);
            moviesData.results.forEach(movie => { if (movie.backdrop_path) mainPageBackdropPaths.push(movie.backdrop_path); });
        } else { moviesResultsGrid.innerHTML = `<p class="text-center col-span-full text-[var(--text-secondary)] py-5">Não foi possível carregar filmes populares. ${moviesData?.message || ''}</p>`; }
    }
    if (tvShowsResultsGrid) {
        if (tvShowsData && !tvShowsData.error && tvShowsData.results) {
            topRatedTvShowsTotalPages = tvShowsData.total_pages || 1;
            displayResults(tvShowsData.results, 'tv', tvShowsResultsGrid, true);
            tvShowsData.results.forEach(show => { if (show.backdrop_path) mainPageBackdropPaths.push(show.backdrop_path); });
        } else { tvShowsResultsGrid.innerHTML = `<p class="text-center col-span-full text-[var(--text-secondary)] py-5">Não foi possível carregar séries populares. ${tvShowsData?.message || ''}</p>`; }
    }
    if (typeof shuffleArray === "function") shuffleArray(mainPageBackdropPaths);
    startMainPageBackdropSlideshow();
    hideLoader();
}

async function loadMorePopularMovies() {
    if (isLoadingMorePopularMovies || popularMoviesCurrentPage >= popularMoviesTotalPages) return;
    isLoadingMorePopularMovies = true;
    if (typeof popularMoviesLoader !== 'undefined' && popularMoviesLoader) popularMoviesLoader.style.display = 'block';
    console.log(`Carregando mais filmes populares, página ${popularMoviesCurrentPage + 1}`);
    popularMoviesCurrentPage++;
    const data = await fetchTMDB('/movie/popular', { page: popularMoviesCurrentPage });
    if (data && !data.error && data.results && data.results.length > 0) {
        displayResults(data.results, 'movie', moviesResultsGrid, false);
        data.results.forEach(movie => { if (movie.backdrop_path && !mainPageBackdropPaths.includes(movie.backdrop_path)) mainPageBackdropPaths.push(movie.backdrop_path); });
        popularMoviesTotalPages = data.total_pages || popularMoviesTotalPages;
    } else if (data && data.error) { console.error("Erro ao carregar mais filmes populares:", data.message); popularMoviesCurrentPage--; }
    if (typeof popularMoviesLoader !== 'undefined' && popularMoviesLoader) popularMoviesLoader.style.display = 'none';
    isLoadingMorePopularMovies = false;
}

async function loadMoreTopRatedTvShows() {
    if (isLoadingMoreTopRatedTvShows || topRatedTvShowsCurrentPage >= topRatedTvShowsTotalPages) return;
    isLoadingMoreTopRatedTvShows = true;
    if (typeof topRatedTvShowsLoader !== 'undefined' && topRatedTvShowsLoader) topRatedTvShowsLoader.style.display = 'block';
    console.log(`Carregando mais séries populares, página ${topRatedTvShowsCurrentPage + 1}`);
    topRatedTvShowsCurrentPage++;
    const data = await fetchTMDB('/tv/top_rated', { page: topRatedTvShowsCurrentPage });
    if (data && !data.error && data.results && data.results.length > 0) {
        displayResults(data.results, 'tv', tvShowsResultsGrid, false);
        data.results.forEach(show => { if (show.backdrop_path && !mainPageBackdropPaths.includes(show.backdrop_path)) mainPageBackdropPaths.push(show.backdrop_path); });
        topRatedTvShowsTotalPages = data.total_pages || topRatedTvShowsTotalPages;
    } else if (data && data.error) { console.error("Erro ao carregar mais séries populares:", data.message); topRatedTvShowsCurrentPage--; }
    if (typeof topRatedTvShowsLoader !== 'undefined' && topRatedTvShowsLoader) topRatedTvShowsLoader.style.display = 'none';
    isLoadingMoreTopRatedTvShows = false;
}

async function performSearch(query) {
    const trimmedQuery = query ? query.trim().toLowerCase() : '';

    if (trimmedQuery === 'sq') { window.location.href = '../Hyper/hyper.html'; return; }
    if (trimmedQuery === 'yt') { window.location.href = '../Yt/yt.html'; return; }
    if (trimmedQuery === 'suquin') { window.location.href = '../game/index.html'; return; }
    if (trimmedQuery === 'lk') { window.location.href = '../links/links.html'; return; }
    
    stopMainPageBackdropSlideshow();
    if (pageBackdrop.style.opacity !== '0') updatePageBackground(null);
    showLoader();
    activeAppliedGenre = { id: null, name: null, type: null };
    selectedGenreSA = { id: null, name: null, type: null };
    if (filterToggleButton) filterToggleButton.classList.remove('active');
    searchCurrentPage = 1;
    totalPages.search = 1;
    currentContentContext = 'search';
    isLoadingMore = false;
    
    if (!query || !query.trim()) {
        loadMainPageContent();
        hideLoader();
        return;
    }
    
    if (defaultContentSections) defaultContentSections.style.display = 'none';
    if (singleResultsSection) singleResultsSection.style.display = 'block';
    if (singleResultsGrid) singleResultsGrid.innerHTML = '';

    let finalDisplayResults = [];
    let searchTitle = `Resultados para: "${query}"`;
    const companyConfig = getCompanyConfigForQuery(query);
    const fetchPromises = [];
    fetchPromises.push(fetchTMDB('/search/multi', { query: query, page: searchCurrentPage }));
    if (companyConfig) {
        searchTitle = `Conteúdo de ${companyConfig.name} (e mais resultados para "${query}")`;
        const companyIdsString = companyConfig.ids.join('|');
        fetchPromises.push(fetchTMDB(`/discover/movie`, { with_companies: companyIdsString, page: 1, sort_by: 'popularity.desc' }));
        fetchPromises.push(fetchTMDB(`/discover/tv`, { with_companies: companyIdsString, page: 1, sort_by: 'popularity.desc' }));
    }
    if (singleSectionTitleEl) singleSectionTitleEl.textContent = searchTitle;
    
    try {
        const allFetchedResults = await Promise.all(fetchPromises);
        const multiSearchData = allFetchedResults[0];
        let companyMovieData = null;
        let companyTvData = null;
        if (companyConfig && allFetchedResults.length > 1) {
            companyMovieData = allFetchedResults[1];
            companyTvData = allFetchedResults[2];
        }
        if (multiSearchData && !multiSearchData.error && multiSearchData.results) {
            finalDisplayResults.push(...multiSearchData.results.filter(item => (item.media_type === 'movie' || item.media_type === 'tv') && item.poster_path));
            totalPages.search = multiSearchData.total_pages || 1;
        } else if (multiSearchData && multiSearchData.error) console.error("Erro na busca múltipla:", multiSearchData.message);

        if (companyMovieData && !companyMovieData.error && companyMovieData.results) {
            finalDisplayResults.push(...companyMovieData.results.filter(item => item.poster_path).map(item => ({ ...item, media_type: 'movie' })));
        } else if (companyMovieData && companyMovieData.error) console.error(`Erro ao buscar filmes para ${companyConfig?.name}:`, companyMovieData.message);

        if (companyTvData && !companyTvData.error && companyTvData.results) {
            finalDisplayResults.push(...companyTvData.results.filter(item => item.poster_path).map(item => ({ ...item, media_type: 'tv' })));
        } else if (companyTvData && companyTvData.error) console.error(`Erro ao buscar séries para ${companyConfig?.name}:`, companyTvData.message);

        const uniqueResults = Array.from(new Map(finalDisplayResults.map(item => [item.id + (item.media_type || ''), item])).values());
        uniqueResults.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

        if (singleResultsGrid) {
            displayResults(uniqueResults, null, singleResultsGrid, true);
            if (uniqueResults.length === 0) {
                const baseErrorMsg = companyConfig ? `Nenhum conteúdo de ${companyConfig.name} ou resultados diretos encontrados para "${query}".` : `Nenhum filme ou série relevante encontrado para "${query}".`;
                singleResultsGrid.innerHTML = `<p class="text-center col-span-full">${multiSearchData?.error ? multiSearchData.message : baseErrorMsg}</p>`;
            }
        }
    } catch (error) {
        console.error("Erro ao realizar busca combinada:", error);
        if (singleResultsGrid) singleResultsGrid.innerHTML = `<p class="text-center col-span-full">Não foi possível realizar a busca. ${error.message || 'Tente novamente.'}</p>`;
    } finally {
        hideLoader();
    }
}

async function applyGenreFilterFromSA() {
    stopMainPageBackdropSlideshow();
    if (pageBackdrop.style.opacity !== '0') updatePageBackground(null);
    if (!selectedGenreSA.id && selectedGenreSA.type !== 'anime') {
        activeAppliedGenre = { id: null, name: null, type: null };
        if (filterToggleButton) filterToggleButton.classList.remove('active');
        loadMainPageContent(); return;
    }
    showLoader();
    activeAppliedGenre = { ...selectedGenreSA };
    filterCurrentPage = 1; totalPages.filter = 1; currentContentContext = 'filter';
    isLoadingMore = false;
    if (defaultContentSections) defaultContentSections.style.display = 'none';
    if (singleResultsSection) singleResultsSection.style.display = 'block';
    if (singleResultsGrid) singleResultsGrid.innerHTML = '';

    let data = null;
    let titlePrefix = '';
    let params = { sort_by: 'popularity.desc', page: filterCurrentPage };
    let endpointType = activeAppliedGenre.type === 'movie' ? 'movie' : 'tv';

    if (activeAppliedGenre.id) params.with_genres = activeAppliedGenre.id;
    
    if (activeAppliedGenre.type === 'anime') {
        titlePrefix = 'Animes';
        params.with_origin_country = TMDB_JAPAN_COUNTRY_CODE;
        params.with_keywords = TMDB_ANIME_KEYWORD_ID;
    } else {
        titlePrefix = activeAppliedGenre.type === 'movie' ? 'Filmes' : 'Séries';
    }

    if (singleSectionTitleEl) singleSectionTitleEl.textContent = `${titlePrefix} do Gênero: ${activeAppliedGenre.name || 'Todos'}`;

    data = await fetchTMDB(`/discover/${endpointType}`, params);

    if (singleResultsGrid) {
        displayResults(data.results, activeAppliedGenre.type, singleResultsGrid, true);
        if (!data.results || data.results.length === 0) {
            singleResultsGrid.innerHTML = `<p class="text-center col-span-full">Nenhum item encontrado para o gênero ${activeAppliedGenre.name || 'selecionado'}.</p>`;
        } else {
            totalPages.filter = data.total_pages || 1;
        }
    }
    hideLoader();
    if (filterToggleButton) filterToggleButton.classList.add('active');
}

async function getItemDetails(itemId, mediaType) {
    const data = await fetchTMDB(`/${mediaType}/${itemId}`, { append_to_response: 'external_ids,credits,videos' });
    return data;
}

async function openItemModal(itemId, mediaType, backdropPath = null) {
    stopMainPageBackdropSlideshow();
    updatePageBackground(backdropPath);

    let mainPlayerUrl = ''; // Armazena a URL do player principal

    currentOpenSwalRef = Swal.fire({
        title: 'Carregando Detalhes...',
        html: '<div class="loader mx-auto my-10" style="width: 40px; height: 40px; border-width: 4px;"></div>',
        showConfirmButton: false, showCloseButton: true, allowOutsideClick: true,
        customClass: { popup: 'swal2-popup swal-details-popup' },
        willClose: () => {
            updatePageBackground(null);
            currentOpenSwalRef = null;
            
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.has('type') && urlParams.has('id')) {
                window.history.replaceState({}, document.title, window.location.pathname);
                if (defaultContentSections.style.display === 'none' && singleResultsSection.style.display === 'none') {
                    loadMainPageContent();
                } else if (defaultContentSections.style.display === 'block') {
                    startMainPageBackdropSlideshow();
                }
            } else {
                if (defaultContentSections.style.display === 'block') {
                    startMainPageBackdropSlideshow();
                }
            }
        }
    });

    let details = await getItemDetails(itemId, mediaType);

    if (!Swal.isVisible()) return;

    if (!details || details.error) {
        Swal.update({ title: 'Erro', html: `<p class="text-red-400 text-center py-10">Não foi possível carregar os detalhes.</p>`, showConfirmButton: true, confirmButtonText: 'Fechar' });
        return;
    }

    if (!backdropPath && details.backdrop_path) updatePageBackground(details.backdrop_path);

    const imdbId = details.external_ids?.imdb_id;
    if (mediaType === 'movie' && imdbId) mainPlayerUrl = `${PLAYER_BASE_URL_MOVIE}${imdbId}`;
    else if (mediaType === 'tv') mainPlayerUrl = `${PLAYER_BASE_URL_SERIES}${itemId}/1/`;
    
    const shareUrl = `https://alisuuu.github.io/Suquinho/?pagina=Catalogo1%2Findex.html%3Ftype%3D${mediaType}%26id%3D${itemId}`;
    const titleText = details.title || details.name || "Título Indisponível";
    const videos = details.videos?.results || [];
    const trailer = videos.find(v => v.site === 'YouTube' && v.type === 'Trailer') || videos.find(v => v.site === 'YouTube');
    const coverImagePath = details.backdrop_path ? `${TMDB_IMAGE_BASE_URL}w1280${details.backdrop_path}` : (details.poster_path ? `${TMDB_IMAGE_BASE_URL}w780${details.poster_path}` : 'https://placehold.co/1280x720/0A0514/F0F0F0?text=Indispon%C3%ADvel');

    const headerContentHTML = `
        <div class="details-trailer-container" id="details-header-cover">
            <div class="trailer-cover">
                <img src="${coverImagePath}" alt="Capa de ${titleText}" class="trailer-cover-img" onerror="this.onerror=null; this.src='https://placehold.co/1280x720/0A0514/F0F0F0?text=Erro';">
                <div class="play-icon-overlay"><i class="fas fa-play"></i></div>
            </div>
            ${trailer && trailer.key ? `<iframe id="trailer-iframe" src="https://www.youtube.com/embed/${trailer.key}?autoplay=1&mute=1&controls=0&showinfo=0&loop=1&playlist=${trailer.key}" frameborder="0" allow="autoplay; encrypted-media" title="Trailer de ${titleText}"></iframe>` : ''}
        </div>`;

    const overview = details.overview || 'Sinopse não disponível.';
    const releaseDate = details.release_date || details.first_air_date;
    const rating = details.vote_average ? details.vote_average.toFixed(1) : 'N/A';
    const genres = details.genres?.map(g => g.name).join(', ') || 'Não informado';
    const runtime = details.runtime || details.episode_run_time?.[0] || null;
    
    let castSectionHTML = '';
    if (details.credits?.cast?.length > 0) {
        castSectionHTML = `<div class="details-cast-section"><h3 class="details-section-subtitle">Elenco Principal</h3><div class="details-cast-scroller">${details.credits.cast.slice(0, 15).map(person => `<div class="cast-member-card"><img src="${person.profile_path ? TMDB_IMAGE_BASE_URL + 'w185' + person.profile_path : PLACEHOLDER_PERSON_IMAGE}" alt="${person.name}" class="cast-member-photo" onerror="this.onerror=null; this.src='${PLACEHOLDER_PERSON_IMAGE}';"><p class="cast-member-name">${person.name}</p><p class="cast-member-character">${person.character}</p></div>`).join('')}</div></div>`;
    }
    
    const isFav = isFavorite(itemId, mediaType);
    const favoriteButtonHTML = `<button id="modalFavoriteButton" class="modal-favorite-button ${isFav ? 'active' : ''}" data-id="${itemId}" data-type="${mediaType}" title="${isFav ? 'Remover dos Favoritos' : 'Adicionar aos Favoritos'}">${isFav ? '<i class="fas fa-heart"></i>' : '<i class="far fa-heart"></i>'}</button>`;
    const copyLinkButtonHTML = `<button id="modalCopyLinkButton" class="modal-copy-link-button" title="Copiar Link"><i class="fas fa-link"></i></button>`;
    
    const detailsHTML = `
        <div class="swal-details-content">
            ${headerContentHTML}
            <div class="details-info-area">
                <h2 class="details-content-title">${titleText}</h2>
                <div class="details-meta-info">
                    ${releaseDate ? `<span><i class="fas fa-calendar-alt"></i> ${new Date(releaseDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</span>` : ''}
                    ${rating !== 'N/A' ? `<span><i class="fas fa-star"></i> ${rating} / 10</span>` : ''}
                    ${runtime ? `<span><i class="fas fa-clock"></i> ${runtime} min</span>` : ''}
                </div>
                ${genres ? `<p class="details-genres"><strong>Gêneros:</strong> ${genres}</p>` : ''}
                <div class="modal-actions-wrapper">
                    ${favoriteButtonHTML}
                    ${copyLinkButtonHTML}
                </div>
                <h3 class="details-section-subtitle" style="padding-left:0;">Sinopse</h3>
                <p class="details-overview">${overview}</p>
            </div>
            ${castSectionHTML}
        </div>`;

    Swal.update({ title: '', html: detailsHTML, showConfirmButton: false });
    
    // ======================= INÍCIO DA CORREÇÃO =======================
    document.getElementById('details-header-cover')?.addEventListener('click', () => {
        if (mainPlayerUrl) {
            let wrapper = document.getElementById('player-fullscreen-wrapper');

            // Se o wrapper não existir no DOM, o cria dinamicamente.
            if (!wrapper) {
                console.warn("Elemento #player-fullscreen-wrapper não encontrado. Criando dinamicamente. Recomenda-se adicioná-lo ao seu HTML.");
                wrapper = document.createElement('div');
                wrapper.id = 'player-fullscreen-wrapper';
                // Adiciona estilos essenciais para o funcionamento
                Object.assign(wrapper.style, {
                    position: 'fixed',
                    top: '0',
                    left: '0',
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'black',
                    display: 'none',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: '9999'
                });
                document.body.appendChild(wrapper);
            }

            // Define o conteúdo e exibe o player
            wrapper.innerHTML = `<iframe src="${mainPlayerUrl}" style="width:100%; height:100%; border:none;" allowfullscreen></iframe>`;
            wrapper.style.display = 'flex';
            
            // Tenta entrar em modo tela cheia
            if (wrapper.requestFullscreen) {
                wrapper.requestFullscreen().catch(err => {
                    console.error(`Erro ao tentar ativar modo tela cheia: ${err.message} (${err.name})`);
                });
            } else if (wrapper.webkitRequestFullscreen) { // Safari
                wrapper.webkitRequestFullscreen();
            } else if (wrapper.msRequestFullscreen) { // IE11
                wrapper.msRequestFullscreen();
            }
        } else {
            showCustomToast('Player principal não disponível.', 'info');
        }
    });
    // ======================= FIM DA CORREÇÃO =======================

    document.getElementById('modalFavoriteButton')?.addEventListener('click', () => toggleFavorite(details, mediaType));
    document.getElementById('modalCopyLinkButton')?.addEventListener('click', () => copyToClipboard(shareUrl));
}

async function openFilterSweetAlert() {
    const swalHTML = `<div class="swal-genre-filter-type-selector mb-4"><button id="swalMovieGenreTypeButton" data-type="movie" class="${currentFilterTypeSA === 'movie' ? 'active' : ''}">Filmes</button><button id="swalTvGenreTypeButton" data-type="tv" class="${currentFilterTypeSA === 'tv' ? 'active' : ''}">Séries</button><button id="swalAnimeGenreTypeButton" data-type="anime" class="${currentFilterTypeSA === 'anime' ? 'active' : ''}">Animes</button></div><div id="swalGenreButtonsPanel" class="swal-genre-buttons-panel my-4">Carregando...</div>`;
    Swal.fire({
        title: 'Filtrar por Gênero', html: swalHTML, showCloseButton: true, showDenyButton: true,
        denyButtonText: 'Limpar Filtro', confirmButtonText: 'Aplicar Filtro',
        customClass: { popup: 'swal2-popup' },
        didOpen: () => {
            const genrePanel = document.getElementById('swalGenreButtonsPanel');
            document.getElementById('swalMovieGenreTypeButton')?.addEventListener('click', () => fetchAndDisplayGenresInSA('movie', genrePanel));
            document.getElementById('swalTvGenreTypeButton')?.addEventListener('click', () => fetchAndDisplayGenresInSA('tv', genrePanel));
            document.getElementById('swalAnimeGenreTypeButton')?.addEventListener('click', () => fetchAndDisplayGenresInSA('anime', genrePanel));
            fetchAndDisplayGenresInSA(currentFilterTypeSA, genrePanel);
        },
        preConfirm: () => selectedGenreSA,
    }).then(async (result) => {
        if (result.isConfirmed) applyGenreFilterFromSA();
        else if (result.isDenied) {
            selectedGenreSA = { id: null, name: null, type: null };
            activeAppliedGenre = { id: null, name: null, type: null };
            if (filterToggleButton) filterToggleButton.classList.remove('active');
            loadMainPageContent();
        }
    });
}

async function fetchAndDisplayGenresInSA(mediaType, genrePanelElement) {
    if (!genrePanelElement) return;
    currentFilterTypeSA = mediaType;
    document.querySelectorAll('.swal-genre-filter-type-selector button').forEach(btn => btn.classList.toggle('active', btn.dataset.type === mediaType));
    genrePanelElement.innerHTML = '<div class="loader mx-auto my-3"></div>';
    const genresToFetchType = mediaType === 'anime' ? 'tv' : mediaType;
    const data = await fetchTMDB(`/genre/${genresToFetchType}/list`);
    genrePanelElement.innerHTML = '';
    if (data && !data.error && data.genres) {
        if (mediaType === 'anime') {
            const allBtn = document.createElement('button');
            allBtn.textContent = 'Todos os Animes'; allBtn.dataset.genreId = '';
            allBtn.onclick = () => { selectedGenreSA = { id: null, name: 'Todos', type: 'anime' }; updateGenreButtonsInSAUI(genrePanelElement); };
            genrePanelElement.appendChild(allBtn);
        }
        data.genres.forEach(genre => {
            const button = document.createElement('button');
            button.textContent = genre.name; button.dataset.genreId = genre.id;
            button.onclick = () => { selectedGenreSA = { id: genre.id, name: genre.name, type: mediaType }; updateGenreButtonsInSAUI(genrePanelElement); };
            genrePanelElement.appendChild(button);
        });
        updateGenreButtonsInSAUI(genrePanelElement);
    } else {
        genrePanelElement.innerHTML = `<p class="text-xs text-center">Gêneros não encontrados.</p>`;
    }
}

function updateGenreButtonsInSAUI(panel) {
    if (!panel) return;
    panel.querySelectorAll('button').forEach(btn => {
        const btnId = btn.dataset.genreId ? parseInt(btn.dataset.genreId, 10) : null;
        const isActive = (selectedGenreSA.id === null && btnId === null && selectedGenreSA.type === 'anime') || (btnId === selectedGenreSA.id);
        btn.classList.toggle('active', isActive);
    });
}

async function loadMoreItems() {
    if (isLoadingMore) return;
    isLoadingMore = true;
    if (searchResultsLoader) searchResultsLoader.style.display = 'block';
    let nextPageData = null;
    try {
        if (currentContentContext === 'search' && searchCurrentPage < totalPages.search) {
            searchCurrentPage++;
            nextPageData = await fetchTMDB('/search/multi', { query: searchInput.value, page: searchCurrentPage });
            if (nextPageData && !nextPageData.error && nextPageData.results) {
                totalPages.search = nextPageData.total_pages || totalPages.search;
                displayResults(nextPageData.results.filter(item => item.poster_path), null, singleResultsGrid, false);
            } else { searchCurrentPage--; }
        } else if (currentContentContext === 'filter' && filterCurrentPage < totalPages.filter) {
            filterCurrentPage++;
            const endpointType = activeAppliedGenre.type === 'movie' ? 'movie' : 'tv';
            let params = { sort_by: 'popularity.desc', page: filterCurrentPage };
            if (activeAppliedGenre.id) params.with_genres = activeAppliedGenre.id;
            if (activeAppliedGenre.type === 'anime') {
                params.with_origin_country = TMDB_JAPAN_COUNTRY_CODE;
                params.with_keywords = TMDB_ANIME_KEYWORD_ID;
            }
            nextPageData = await fetchTMDB(`/discover/${endpointType}`, params);
            if (nextPageData && !nextPageData.error && nextPageData.results) {
                totalPages.filter = nextPageData.total_pages || totalPages.filter;
                displayResults(nextPageData.results, activeAppliedGenre.type, singleResultsGrid, false);
            } else { filterCurrentPage--; }
        }
    } catch (error) {
        console.error("Erro ao carregar mais itens:", error);
    } finally {
        if (searchResultsLoader) searchResultsLoader.style.display = 'none';
        isLoadingMore = false;
    }
}

function showCustomToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `custom-toast custom-toast--${type}`;
    toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}"></i><span>${message}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 400); }, 2500);
}

function shuffleArray(array) { for (let i = array.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[array[i], array[j]] = [array[j], array[i]]; } }
function showLoader() { if (loader) loader.style.display = 'flex'; }
function hideLoader() { if (loader) loader.style.display = 'none'; }
function updatePageBackground(path) { if (pageBackdrop) pageBackdrop.style.backgroundImage = path ? `url(${TMDB_IMAGE_BASE_URL}original${path})` : ''; }
function getFavorites() { try { return JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY) || '[]'); } catch { return []; } }
function saveFavorites(favs) { localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favs)); }
function isFavorite(id, type) { return favorites.some(fav => fav.id.toString() === id.toString() && fav.media_type === type); }

function toggleFavorite(item, type) {
    const itemId = item.id.toString();
    const index = favorites.findIndex(fav => fav.id.toString() === itemId && fav.media_type === type);
    if (index > -1) { favorites.splice(index, 1); showCustomToast('Removido dos Favoritos', 'info');
    } else { favorites.push({ id: item.id, media_type: type, title: item.title || item.name, poster_path: item.poster_path, backdrop_path: item.backdrop_path }); showCustomToast('Adicionado aos Favoritos', 'success'); }
    saveFavorites(favorites);
    updateFavoriteButtonsState(item.id, type);
}

function updateFavoriteButtonsState(id, type) {
    const isFav = isFavorite(id, type);
    document.querySelectorAll(`.favorite-button[data-id="${id}"][data-type="${type}"]`).forEach(btn => {
        btn.classList.toggle('active', isFav);
        btn.innerHTML = isFav ? '<i class="fas fa-heart"></i>' : '<i class="far fa-heart"></i>';
    });
    const modalBtn = document.getElementById('modalFavoriteButton');
    if (modalBtn && modalBtn.dataset.id == id && modalBtn.dataset.type == type) {
        modalBtn.classList.toggle('active', isFav);
        modalBtn.title = isFav ? 'Remover dos Favoritos' : 'Adicionar aos Favoritos';
        modalBtn.innerHTML = isFav ? '<i class="fas fa-heart"></i>' : '<i class="far fa-heart"></i>';
    }
}

function displayResults(items, defaultType, targetEl, replace) {
    if (!targetEl) return;
    if (replace) targetEl.innerHTML = '';
    const fragment = document.createDocumentFragment();
    if (!items || items.length === 0) { if (replace) targetEl.innerHTML = `<p class="col-span-full text-center">Nenhum item para exibir.</p>`; return; }
    items.forEach(item => {
        const mediaType = item.media_type || defaultType;
        if (!mediaType || !item.poster_path) return;
        const card = document.createElement('div'); card.className = 'content-card';
        card.onclick = () => openItemModal(item.id, mediaType, item.backdrop_path);
        const isFav = isFavorite(item.id, mediaType);
        card.innerHTML = `<img src="${TMDB_IMAGE_BASE_URL}w780${item.poster_path}" alt="${item.title||item.name}" loading="lazy"><div class="title-overlay"><div class="title">${item.title||item.name}</div></div><button class="favorite-button ${isFav ? 'active' : ''}" data-id="${item.id}" data-type="${mediaType}"><i class="${isFav ? 'fas fa-heart' : 'far fa-heart'}"></i></button>`;
        card.querySelector('.favorite-button').onclick = (e) => { e.stopPropagation(); toggleFavorite(item, mediaType); };
        fragment.appendChild(card);
    });
    targetEl.appendChild(fragment);
}

function copyToClipboard(text) { navigator.clipboard.writeText(text).then(() => showCustomToast('Link copiado!', 'success'), () => showCustomToast('Falha ao copiar.', 'info')); }

async function openFavoritesModal() {
    let favsHtml = '<p class="text-center text-gray-400 py-5">Você não tem nenhum favorito ainda.</p>';
    if (favorites.length > 0) {
        favsHtml = `<div class="favorites-grid">${favorites.map(item => `
            <div class="content-card favorite-card" onclick="Swal.close(); openItemModal(${item.id}, '${item.media_type}', '${item.backdrop_path || ''}')">
                <img src="${TMDB_IMAGE_BASE_URL}w342${item.poster_path}" alt="${item.title || ''}" loading="lazy">
                <div class="title-overlay"><div class="title">${item.title || ''}</div></div>
                <button class="remove-favorite-button" data-id="${item.id}" data-type="${item.media_type}"><i class="fas fa-times-circle"></i></button>
            </div>`).join('')}</div>`;
    }
    Swal.fire({
        title: 'Meus Favoritos', html: favsHtml, showConfirmButton: false, showCloseButton: true,
        customClass: { popup: 'swal-favorites-popup' },
        didOpen: () => {
            document.querySelectorAll('.remove-favorite-button').forEach(button => {
                button.addEventListener('click', e => {
                    e.stopPropagation();
                    const itemToRemove = favorites.find(fav => fav.id.toString() === button.dataset.id && fav.media_type === button.dataset.type);
                    if (itemToRemove) {
                        toggleFavorite(itemToRemove, itemToRemove.media_type);
                        const card = button.closest('.favorite-card');
                        card.style.opacity = '0';
                        setTimeout(() => card.remove(), 300);
                    }
                });
            });
        }
    });
}

// --- INICIALIZAÇÃO DA APLICAÇÃO ---
document.addEventListener('DOMContentLoaded', () => {
    const apiKeyIsValid = typeof TMDB_API_KEY !== 'undefined' && TMDB_API_KEY.length > 10;
    if (!apiKeyIsValid) {
        document.body.innerHTML = `<div style="color:red;padding:2rem;text-align:center;">Erro: Chave da API não configurada.</div>`;
        return;
    }
    favorites = getFavorites();
    if (searchInput) searchInput.addEventListener('input', () => { clearTimeout(searchTimeout); searchTimeout = setTimeout(() => performSearch(searchInput.value), 500); });
    if (searchButton) searchButton.addEventListener('click', () => performSearch(searchInput.value));
    if (filterToggleButton) filterToggleButton.addEventListener('click', openFilterSweetAlert);
    if (floatingFavoritesButton) floatingFavoritesButton.addEventListener('click', openFavoritesModal);

    // --- LÓGICA FINAL DO PAINEL LATERAL ---
    const openBtn = document.getElementById('open-calendar-btn');
    const closeBtn = document.getElementById('close-calendar-btn');
    const mainContent = document.getElementById('main-content');
    
    if (openBtn) openBtn.addEventListener('click', (e) => { e.stopPropagation(); document.body.classList.add('calendar-open'); });
    if (closeBtn) closeBtn.addEventListener('click', () => document.body.classList.remove('calendar-open'));
    if (mainContent) mainContent.addEventListener('click', () => { if (document.body.classList.contains('calendar-open')) document.body.classList.remove('calendar-open'); });

    // Scroll infinito para as seções principais
    if(moviesResultsGrid) moviesResultsGrid.addEventListener('scroll', () => {
        if (defaultContentSections?.style.display === 'block' && !isLoadingMorePopularMovies && popularMoviesCurrentPage < popularMoviesTotalPages && (moviesResultsGrid.scrollLeft + moviesResultsGrid.clientWidth >= moviesResultsGrid.scrollWidth - 200)) {
            loadMorePopularMovies();
        }
    });

    if(tvShowsResultsGrid) tvShowsResultsGrid.addEventListener('scroll', () => {
        if (defaultContentSections?.style.display === 'block' && !isLoadingMoreTopRatedTvShows && topRatedTvShowsCurrentPage < topRatedTvShowsTotalPages && (tvShowsResultsGrid.scrollLeft + tvShowsResultsGrid.clientWidth >= tvShowsResultsGrid.scrollWidth - 200)) {
            loadMoreTopRatedTvShows();
        }
    });

    // Scroll infinito para a página de resultados únicos (busca/filtro)
    const scrollTargetForResults = window.innerWidth < 768 ? document.getElementById('contentArea') : window;
    scrollTargetForResults?.addEventListener('scroll', () => {
        const isSingleSectionVisible = singleResultsSection?.style.display === 'block';
        if (!isSingleSectionVisible || isLoadingMore) return;
        
        const offset = 200;
        let scrolledToEnd = false;
        if (scrollTargetForResults === window) {
            scrolledToEnd = (window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight - offset;
        } else {
            scrolledToEnd = (scrollTargetForResults.scrollTop + scrollTargetForResults.clientHeight) >= scrollTargetForResults.scrollHeight - offset;
        }

        if(scrolledToEnd) loadMoreItems();
    });

    // Listener para limpar o wrapper do player ao sair da tela cheia
    document.addEventListener('fullscreenchange', () => {
        if (!document.fullscreenElement) {
            const wrapper = document.getElementById('player-fullscreen-wrapper');
            if (wrapper) {
                wrapper.style.display = 'none';
                wrapper.innerHTML = '';
            }
        }
    });

    const urlParams = new URLSearchParams(window.location.search);
    const typeParam = urlParams.get('type');
    const idParam = urlParams.get('id');
    if (typeParam && idParam) openItemModal(idParam, typeParam);
    else loadMainPageContent();
});
