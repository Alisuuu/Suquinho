// --- Script 2: API Functions, Core Logic, Filter Logic, Item Details Modal ---

const companyKeywordMap = { /* ... (mapa de empresas como antes) ... */ };
function getCompanyConfigForQuery(query) { /* ... (função como antes) ... */ }

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

function stopMainPageBackdropSlideshow() { /* ... (como antes) ... */ }
function startMainPageBackdropSlideshow() { /* ... (como antes) ... */ }

async function loadMainPageContent() {
    console.log("loadMainPageContent called");
    showLoader(); // Usa loader global para carga inicial da página
    if (defaultContentSections) defaultContentSections.style.display = 'block';
    if (singleResultsSection) singleResultsSection.style.display = 'none';
    if (filterToggleButton) filterToggleButton.classList.remove('active');
    activeAppliedGenre = { id: null, name: null, type: null };
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
    hideLoader(); // Esconde loader global
}

// Estas funções não serão mais chamadas por scroll horizontal, mas a lógica de fetch existe.
async function loadMorePopularMovies() {
    if (isLoadingMorePopularMovies || popularMoviesCurrentPage >= popularMoviesTotalPages) return;
    isLoadingMorePopularMovies = true;
    if (popularMoviesLoader) popularMoviesLoader.style.display = 'block';
    console.log(`Carregando mais filmes populares, página ${popularMoviesCurrentPage + 1}`);
    popularMoviesCurrentPage++;
    const data = await fetchTMDB('/movie/popular', { page: popularMoviesCurrentPage });
    if (data && !data.error && data.results && data.results.length > 0) {
        displayResults(data.results, 'movie', moviesResultsGrid, false);
        data.results.forEach(movie => { if (movie.backdrop_path && !mainPageBackdropPaths.includes(movie.backdrop_path)) mainPageBackdropPaths.push(movie.backdrop_path); });
        popularMoviesTotalPages = data.total_pages || popularMoviesTotalPages;
    } else if (data && data.error) { console.error("Erro ao carregar mais filmes populares:", data.message); popularMoviesCurrentPage--; }
    if (popularMoviesLoader) popularMoviesLoader.style.display = 'none';
    isLoadingMorePopularMovies = false;
}

async function loadMoreTopRatedTvShows() {
    if (isLoadingMoreTopRatedTvShows || topRatedTvShowsCurrentPage >= topRatedTvShowsTotalPages) return;
    isLoadingMoreTopRatedTvShows = true;
    if (topRatedTvShowsLoader) topRatedTvShowsLoader.style.display = 'block';
    console.log(`Carregando mais séries populares, página ${topRatedTvShowsCurrentPage + 1}`);
    topRatedTvShowsCurrentPage++;
    const data = await fetchTMDB('/tv/top_rated', { page: topRatedTvShowsCurrentPage });
    if (data && !data.error && data.results && data.results.length > 0) {
        displayResults(data.results, 'tv', tvShowsResultsGrid, false);
        data.results.forEach(show => { if (show.backdrop_path && !mainPageBackdropPaths.includes(show.backdrop_path)) mainPageBackdropPaths.push(show.backdrop_path); });
        topRatedTvShowsTotalPages = data.total_pages || topRatedTvShowsTotalPages;
    } else if (data && data.error) { console.error("Erro ao carregar mais séries populares:", data.message); topRatedTvShowsCurrentPage--; }
    if (topRatedTvShowsLoader) topRatedTvShowsLoader.style.display = 'none';
    isLoadingMoreTopRatedTvShows = false;
}

async function performSearch(query) {
    stopMainPageBackdropSlideshow();
    if (pageBackdrop.style.opacity !== '0') updatePageBackground(null);
    showLoader(); // Usa loader global para busca inicial
    activeAppliedGenre = { id: null, name: null, type: null };
    selectedGenreSA = { id: null, name: null, type: null };
    if (filterToggleButton) filterToggleButton.classList.remove('active');
    searchCurrentPage = 1; totalPages.search = 1; currentContentContext = 'search'; 
    isLoadingMore = false; 
    if (!query || !query.trim()) { loadMainPageContent(); hideLoader(); return; }
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
        let companyMovieData = null; let companyTvData = null;
        if (companyConfig && allFetchedResults.length > 1) { companyMovieData = allFetchedResults[1]; companyTvData = allFetchedResults[2]; }
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
        const uniqueResults = Array.from(new Map(finalDisplayResults.map(item => [item.id + item.media_type, item])).values());
        uniqueResults.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
        if (singleResultsGrid) {
            if (uniqueResults.length > 0) displayResults(uniqueResults, null, singleResultsGrid, true);
            else {
                const baseErrorMsg = companyConfig ? `Nenhum conteúdo de ${companyConfig.name} ou resultados diretos encontrados para "${query}".` : `Nenhum filme ou série relevante encontrado para "${query}".`;
                singleResultsGrid.innerHTML = `<p class="text-center col-span-full">${multiSearchData?.error ? multiSearchData.message : baseErrorMsg}</p>`;
            }
        }
    } catch (error) {
        console.error("Erro ao realizar busca combinada:", error);
        if (singleResultsGrid) singleResultsGrid.innerHTML = `<p class="text-center col-span-full">Não foi possível realizar a busca. ${error.message || 'Tente novamente.'}</p>`;
    } finally { hideLoader(); }
}

async function applyGenreFilterFromSA() {
    stopMainPageBackdropSlideshow();
    if (pageBackdrop.style.opacity !== '0') updatePageBackground(null);
    if (!selectedGenreSA.id) {
        activeAppliedGenre = { id: null, name: null, type: null };
        if (filterToggleButton) filterToggleButton.classList.remove('active');
        loadMainPageContent(); return;
    }
    showLoader(); // Usa loader global para filtro inicial
    activeAppliedGenre = { ...selectedGenreSA };
    filterCurrentPage = 1; totalPages.filter = 1; currentContentContext = 'filter';
    isLoadingMore = false; 
    if (defaultContentSections) defaultContentSections.style.display = 'none';
    if (singleResultsSection) singleResultsSection.style.display = 'block';
    if (singleResultsGrid) singleResultsGrid.innerHTML = ''; 
    if (singleSectionTitleEl) singleSectionTitleEl.textContent = `${activeAppliedGenre.type === 'movie' ? 'Filmes' : 'Séries'} do Gênero: ${activeAppliedGenre.name}`;
    const data = await fetchTMDB(`/discover/${activeAppliedGenre.type}`, { with_genres: activeAppliedGenre.id, sort_by: 'popularity.desc', page: filterCurrentPage });
    if (singleResultsGrid) {
        if (data && !data.error && data.results) {
            totalPages.filter = data.total_pages || 1;
            if (data.results.length > 0) displayResults(data.results, activeAppliedGenre.type, singleResultsGrid, true);
            else singleResultsGrid.innerHTML = `<p class="text-center col-span-full">Nenhum item encontrado para o gênero ${activeAppliedGenre.name}.</p>`;
        } else singleResultsGrid.innerHTML = `<p class="text-center col-span-full">Não foi possível aplicar o filtro. ${data?.message || 'Tente novamente.'}</p>`;
    }
    hideLoader(); // Esconde loader global
    if (filterToggleButton) filterToggleButton.classList.add('active');
}

async function getItemDetails(itemId, mediaType) { /* ... (como antes) ... */ }
async function openItemModal(itemId, mediaType, backdropPath = null) { /* ... (com logs LOG:, como antes) ... */ }
async function openFilterSweetAlert() { /* ... (como antes) ... */ }
async function fetchAndDisplayGenresInSA(mediaType, genrePanelElement) { /* ... (como antes) ... */ }
function updateGenreButtonsInSAUI(genrePanelElement) { /* ... (como antes) ... */ }
function updateClearButtonVisibilitySA() { /* ... (como antes) ... */ }

// MODIFICADO: loadMoreItems usa searchResultsLoader
async function loadMoreItems() {
    if (isLoadingMore) return;
    isLoadingMore = true;
    // showLoader(); // Removido loader global
    if (searchResultsLoader) searchResultsLoader.style.display = 'block';
    
    console.log(`LOG: loadMoreItems ACIONADO para contexto: ${currentContentContext}, próxima página de busca: ${searchCurrentPage + 1}, próxima de filtro: ${filterCurrentPage + 1}`);
    
    let nextPageData = null;
    try {
        switch (currentContentContext) {
            case 'search':
                if (searchCurrentPage >= totalPages.search) { 
                    if (searchResultsLoader) searchResultsLoader.style.display = 'none';
                    isLoadingMore = false; return; 
                }
                searchCurrentPage++;
                nextPageData = await fetchTMDB('/search/multi', { query: searchInput.value, page: searchCurrentPage });
                if (nextPageData && !nextPageData.error && nextPageData.results) {
                    totalPages.search = nextPageData.total_pages || totalPages.search;
                    const filteredResults = nextPageData.results.filter(item => (item.media_type === 'movie' || item.media_type === 'tv') && item.poster_path);
                    displayResults(filteredResults, null, singleResultsGrid, false);
                } else if (nextPageData && nextPageData.error) { 
                    console.error("LOG (loadMoreItems): Erro ao carregar mais resultados da busca:", nextPageData.message); 
                    searchCurrentPage--; 
                }
                break;
            case 'filter':
                if (filterCurrentPage >= totalPages.filter) { 
                    if (searchResultsLoader) searchResultsLoader.style.display = 'none';
                    isLoadingMore = false; return; 
                }
                filterCurrentPage++;
                nextPageData = await fetchTMDB(`/discover/${activeAppliedGenre.type}`, { with_genres: activeAppliedGenre.id, sort_by: 'popularity.desc', page: filterCurrentPage });
                if (nextPageData && !nextPageData.error && nextPageData.results) {
                    totalPages.filter = nextPageData.total_pages || totalPages.filter;
                    displayResults(nextPageData.results, activeAppliedGenre.type, singleResultsGrid, false);
                } else if (nextPageData && nextPageData.error) { 
                    console.error("LOG (loadMoreItems): Erro ao carregar mais resultados do filtro:", nextPageData.message); 
                    filterCurrentPage--; 
                }
                break;
            default: 
                console.warn(`LOG (loadMoreItems): Contexto desconhecido: ${currentContentContext}`);
        }
    } catch (error) {
        console.error("LOG (loadMoreItems): Erro geral:", error);
        if (currentContentContext === 'search' && searchCurrentPage > 1) searchCurrentPage--;
        if (currentContentContext === 'filter' && filterCurrentPage > 1) filterCurrentPage--;
    } finally {
        if (searchResultsLoader) searchResultsLoader.style.display = 'none';
        isLoadingMore = false;
    }
}
// --- Coloque as implementações completas de getItemDetails, openItemModal, openFilterSweetAlert, fetchAndDisplayGenresInSA, updateGenreButtonsInSAUI, updateClearButtonVisibilitySA aqui, como nas respostas anteriores ---
// Para manter a resposta concisa, estou omitindo o corpo dessas funções que não foram diretamente alteradas nesta etapa, mas elas devem estar no seu arquivo.
// Certifique-se de que a função openItemModal está com os logs "LOG:" como na penúltima resposta.
// Se precisar delas novamente, me avise.
// **REINSERINDO FUNÇÕES COMPLETAS PARA CLAREZA**
async function getItemDetails(itemId, mediaType) {
    const data = await fetchTMDB(`/${mediaType}/${itemId}`, { append_to_response: 'external_ids,credits,videos' });
    return data;
}

async function openItemModal(itemId, mediaType, backdropPath = null) {
    console.log(`LOG: openItemModal iniciada. ID: ${itemId}, Tipo: ${mediaType}`);
    stopMainPageBackdropSlideshow();
    updatePageBackground(backdropPath);

    currentOpenSwalRef = Swal.fire({
        title: 'Carregando Detalhes...',
        html: '<div class="loader mx-auto my-10" style="width: 40px; height: 40px; border-width: 4px;"></div>',
        showConfirmButton: false, showCloseButton: true, allowOutsideClick: true,
        customClass: { popup: 'swal2-popup swal-details-popup', title: 'swal2-title', htmlContainer: 'swal2-html-container', closeButton: 'swal2-close' },
        willClose: () => {
            updatePageBackground(null);
            const iframe = document.getElementById('swal-details-iframe');
            if (iframe) iframe.src = 'about:blank';
            currentOpenSwalRef = null;
            if (externalCopyButtonContainer) externalCopyButtonContainer.style.display = 'none';
            const btn = document.getElementById('externalCopyLinkButton');
            if (btn && externalCopyButtonHandler) btn.removeEventListener('click', externalCopyButtonHandler);
            currentExternalCopyUrl = ''; externalCopyButtonHandler = null;
            const urlParams = new URLSearchParams(window.location.search);
            const wasDeepLink = urlParams.has('type') && urlParams.has('id');
            if (wasDeepLink) {
                window.history.replaceState({}, document.title, window.location.pathname);
                if (defaultContentSections && defaultContentSections.style.display === 'none' && singleResultsSection && singleResultsSection.style.display === 'none') {
                    loadMainPageContent();
                } else if (defaultContentSections && defaultContentSections.style.display === 'block') {
                    startMainPageBackdropSlideshow();
                }
            } else {
                if (defaultContentSections && defaultContentSections.style.display === 'block') {
                    startMainPageBackdropSlideshow();
                }
            }
        }
    });

    console.log("LOG: Modal 'Carregando Detalhes...' disparado.");
    let details;
    try {
        details = await getItemDetails(itemId, mediaType);
        console.log("LOG: Detalhes da API recebidos. Error: ", details ? details.error : 'N/A', " Message: ", details ? (details.message || (details.status_message || 'Sem mensagem específica')) : 'N/A');
    } catch (errorCaught) {
        console.error("LOG: Erro CRÍTICO capturado ao chamar getItemDetails:", errorCaught);
        details = { error: true, message: "Falha ao buscar detalhes do item." };
    }

    console.log("LOG: Verificando validade do modal para atualização.");
    const currentPopup = Swal.getPopup();
    const isSwalVisible = Swal.isVisible();
    const hasSwalRef = !!currentOpenSwalRef;
    const hasPopup = !!currentPopup;
    const popupHasDetailsClass = hasPopup && currentPopup.classList.contains('swal-details-popup');
    console.log(`LOG: Status da Verificação: isVisible=${isSwalVisible}, hasRef=${hasSwalRef}, hasPopup=${hasPopup}, popupHasDetailsClass=${popupHasDetailsClass}`);

    if (!isSwalVisible || !hasSwalRef || !hasPopup || !popupHasDetailsClass) {
        console.error("LOG: ABORTE RÁPIDO: Modal não é válido para atualização neste ponto.");
        return;
    }
    console.log("LOG: Verificação inicial do modal passou.");

    if (!details || details.error) {
        console.warn("LOG: Conteúdo dos detalhes com erro ou nulo. Exibindo erro no modal. Mensagem:", details?.message);
        Swal.update({
            title: 'Erro',
            html: `<p class="text-red-400 text-center py-10">Não foi possível carregar os detalhes. ${details?.message || 'Tente novamente.'}</p>`,
            showConfirmButton: true, confirmButtonText: 'Fechar',
        });
        return;
    }
    console.log("LOG: Detalhes válidos, prosseguindo para construir HTML.");

    if (!backdropPath && details.backdrop_path) updatePageBackground(details.backdrop_path);
    else if (backdropPath) updatePageBackground(backdropPath);

    const imdbId = details.external_ids?.imdb_id;
    let superflixPlayerUrl = '';
    if (imdbId) superflixPlayerUrl = mediaType === 'movie' ? `${PLAYER_BASE_URL_MOVIE}${imdbId}` : `${PLAYER_BASE_URL_SERIES}${imdbId}`;
    const linkForContentPage = `${window.location.origin}${window.location.pathname}?type=${mediaType}&id=${itemId}`;
    currentExternalCopyUrl = linkForContentPage;
    if(externalCopyButtonContainer) externalCopyButtonContainer.style.display = 'flex';
    const currentExternalBtn = document.getElementById('externalCopyLinkButton');
    if(currentExternalBtn) {
        if (externalCopyButtonHandler) currentExternalBtn.removeEventListener('click', externalCopyButtonHandler);
        externalCopyButtonHandler = () => { if(currentExternalCopyUrl) copyToClipboard(currentExternalCopyUrl, false); };
        currentExternalBtn.addEventListener('click', externalCopyButtonHandler);
    }
    const titleText = details.title || details.name || "Título Indisponível"; // Renomeado para evitar conflito com window.title
    const overview = details.overview || 'Sinopse não disponível.';
    const posterModalPath = details.poster_path ? `${TMDB_IMAGE_BASE_URL}w780${details.poster_path}` : `https://placehold.co/780x1170/0A0514/F0F0F0?text=Indispon%C3%ADvel&font=inter`;
    const releaseDate = details.release_date || details.first_air_date;
    const rating = details.vote_average ? details.vote_average.toFixed(1) : 'N/A';
    const genres = details.genres && details.genres.length > 0 ? details.genres.map(g => g.name).join(', ') : 'Gêneros não informados';
    const runtime = details.runtime || (details.episode_run_time && details.episode_run_time.length > 0 ? details.episode_run_time[0] : null);
    const iframeContainerClass = mediaType === 'tv' ? 'iframe-series-dimensions' : '';
    let castSectionHTML = '';
    if (details.credits && details.credits.cast && details.credits.cast.length > 0) {
        const castMembers = details.credits.cast.slice(0, 15);
        castSectionHTML = `<div class="details-cast-section"><h3 class="details-section-subtitle">Elenco Principal</h3><div class="details-cast-scroller">${castMembers.map(person => `<div class="cast-member-card"><img src="${person.profile_path ? TMDB_IMAGE_BASE_URL + 'w185' + person.profile_path : PLACEHOLDER_PERSON_IMAGE}" alt="${person.name || 'Ator/Atriz sem nome listado'}" class="cast-member-photo" onerror="this.onerror=null; this.src='${PLACEHOLDER_PERSON_IMAGE}';"><p class="cast-member-name">${person.name || 'Nome não disponível'}</p><p class="cast-member-character">${person.character || ''}</p></div>`).join('')}</div></div>`;
    }
    let playerSectionHTML = '';
    if (superflixPlayerUrl) playerSectionHTML = `<div class="details-player-section"><h3 class="details-section-subtitle">Assistir Agora</h3><div class="details-iframe-container ${iframeContainerClass}"><iframe id="swal-details-iframe" src="${superflixPlayerUrl}" allowfullscreen title="Player de ${titleText.replace(/"/g, '&quot;')}" sandbox="allow-scripts allow-same-origin"></iframe></div></div>`;
    else playerSectionHTML = `<div class="details-player-section"><p class="details-player-unavailable">Player não disponível para este título.</p></div>`;
    const detailsHTML = `<div class="swal-details-content"><div class="details-flex-container"><img src="${posterModalPath}" alt="Pôster de ${titleText.replace(/"/g, '&quot;')}" class="details-poster" onerror="this.onerror=null; this.src='https://placehold.co/780x1170/0A0514/F0F0F0?text=Erro+Imagem&font=inter';"><div class="details-info-area"><h2 class="details-content-title">${titleText}</h2><div class="details-meta-info">${releaseDate ? `<span><i class="fas fa-calendar-alt"></i> ${new Date(releaseDate).toLocaleDateString('pt-BR', { year: 'numeric', month: '2-digit', day: '2-digit' })}</span>` : ''}${rating !== 'N/A' ? `<span><i class="fas fa-star"></i> ${rating} / 10</span>` : ''}${runtime ? `<span><i class="fas fa-clock"></i> ${runtime} min</span>` : ''}</div>${genres ? `<p class="details-genres"><strong>Gêneros:</strong> ${genres}</p>` : ''}<h3 class="details-section-subtitle">Sinopse</h3><p class="details-overview">${overview}</p></div></div>${castSectionHTML}${playerSectionHTML}</div>`;
    
    console.log("LOG: HTML dos detalhes construído. Tentando atualizar o modal...");
    Swal.update({ title: '', html: detailsHTML, showConfirmButton: false, showCloseButton: true, allowOutsideClick: true });
    console.log("LOG: Modal ATUALIZADO com conteúdo final.");
}

async function openFilterSweetAlert() {
    const swalHTML = `
        <div class="swal-genre-filter-type-selector mb-4">
            <button id="swalMovieGenreTypeButton" data-type="movie" class="${currentFilterTypeSA === 'movie' ? 'active' : ''}">Filmes</button>
            <button id="swalTvGenreTypeButton" data-type="tv" class="${currentFilterTypeSA === 'tv' ? 'active' : ''}">Séries</button>
        </div>
        <div id="swalGenreButtonsPanel" class="swal-genre-buttons-panel my-4">
            Carregando gêneros...
        </div>
    `;
    currentOpenSwalRef = Swal.fire({
        title: 'Filtrar por Gênero', html: swalHTML, showCloseButton: true, showCancelButton: false, showDenyButton: true,
        denyButtonText: 'Limpar Filtro', confirmButtonText: 'Aplicar Filtro',
        customClass: { popup: 'swal2-popup', title: 'swal2-title', htmlContainer: 'swal2-html-container', closeButton: 'swal2-close', actions: 'swal-filter-actions', confirmButton: 'swal2-confirm', denyButton: 'swal2-deny' },
        didOpen: () => {
            const movieBtn = document.getElementById('swalMovieGenreTypeButton'); const tvBtn = document.getElementById('swalTvGenreTypeButton');
            const genrePanel = document.getElementById('swalGenreButtonsPanel');
            if (movieBtn) movieBtn.addEventListener('click', () => fetchAndDisplayGenresInSA('movie', genrePanel));
            if (tvBtn) tvBtn.addEventListener('click', () => fetchAndDisplayGenresInSA('tv', genrePanel));
            fetchAndDisplayGenresInSA(currentFilterTypeSA, genrePanel); updateClearButtonVisibilitySA();
        },
        preConfirm: () => { return selectedGenreSA; },
    });
    currentOpenSwalRef.then(async (result) => {
        if (result.isConfirmed) {
            if (selectedGenreSA.id) await applyGenreFilterFromSA();
            else { activeAppliedGenre = { id: null, name: null, type: null }; if(filterToggleButton) filterToggleButton.classList.remove('active'); loadMainPageContent(); }
        } else if (result.isDenied) {
            selectedGenreSA = { id: null, name: null, type: null }; activeAppliedGenre = { id: null, name: null, type: null };
            if(filterToggleButton) filterToggleButton.classList.remove('active'); loadMainPageContent();
        }
        currentOpenSwalRef = null;
    });
}

async function fetchAndDisplayGenresInSA(mediaType, genrePanelElement) {
    if (!genrePanelElement) { console.error("Painel de gêneros do SweetAlert não encontrado."); return; }
    currentFilterTypeSA = mediaType;
    const movieBtn = document.getElementById('swalMovieGenreTypeButton'); const tvBtn = document.getElementById('swalTvGenreTypeButton');
    if (movieBtn) movieBtn.classList.toggle('active', mediaType === 'movie'); if (tvBtn) tvBtn.classList.toggle('active', mediaType === 'tv');
    if (selectedGenreSA.id && mediaType !== selectedGenreSA.type) selectedGenreSA = { id: null, name: null, type: null };
    genrePanelElement.innerHTML = '<div class="loader mx-auto my-3" style="width: 30px; height: 30px; border-width: 3px;"></div>';
    const data = await fetchTMDB(`/genre/${mediaType}/list`); genrePanelElement.innerHTML = '';
    if (data && !data.error && data.genres) {
        data.genres.forEach(genre => {
            const button = document.createElement('button'); button.textContent = genre.name; button.dataset.genreId = genre.id; button.dataset.genreName = genre.name; button.setAttribute('role', 'button');
            if (genre.id === selectedGenreSA.id && mediaType === selectedGenreSA.type) button.classList.add('active');
            button.onclick = () => {
                if (selectedGenreSA.id === genre.id && selectedGenreSA.type === mediaType) selectedGenreSA = { id: null, name: null, type: null };
                else selectedGenreSA = { id: genre.id, name: genre.name, type: mediaType };
                updateGenreButtonsInSAUI(genrePanelElement); updateClearButtonVisibilitySA();
            };
            genrePanelElement.appendChild(button);
        });
    } else genrePanelElement.innerHTML = `<p class="text-xs text-center">Gêneros não encontrados. ${data?.message || ''}</p>`;
    updateGenreButtonsInSAUI(genrePanelElement); updateClearButtonVisibilitySA();
}

function updateGenreButtonsInSAUI(genrePanelElement) {
    if (!genrePanelElement) return;
    const buttons = genrePanelElement.querySelectorAll('button');
    buttons.forEach(btn => { const genreId = parseInt(btn.dataset.genreId); btn.classList.toggle('active', genreId === selectedGenreSA.id && currentFilterTypeSA === selectedGenreSA.type); });
}

function updateClearButtonVisibilitySA() {
    if (typeof Swal === 'undefined' || !Swal.getDenyButton) return;
    const denyButton = Swal.getDenyButton();
    if (denyButton) denyButton.style.display = (selectedGenreSA.id || activeAppliedGenre.id) ? 'inline-flex' : 'none';
}


        
