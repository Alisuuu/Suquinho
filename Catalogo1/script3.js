// --- API Functions, Core Logic, Filter Logic, Item Details Modal ---

        function getCompanyConfigForQuery(query) {
            const normalizedQuery = query.toLowerCase().trim();
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
            selectedGenreSA = { id: null, name: null, type: null }; // Reset selected genre for filter modal
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
            const trimmedQuery = query ? query.trim().toLowerCase() : '';

            if (trimmedQuery === 'sq') {
                window.location.href = '../Hyper/hyper.html';
                return;
            }
            if (trimmedQuery === 'yt') {
                window.location.href = '../Yt/yt.html';
                return;
            }
            if (trimmedQuery === 'suquin') {
                window.location.href = '../game/index.html';
                return;
            }
           if (trimmedQuery === 'lk') {
                window.location.href = '../links/links.html';
                return;
           }
            stopMainPageBackdropSlideshow();
            if (pageBackdrop.style.opacity !== '0') updatePageBackground(null);
            showLoader();
            activeAppliedGenre = { id: null, name: null, type: null };
            selectedGenreSA = { id: null, name: null, type: null }; // Reset selected genre for filter modal
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
            } finally {
                hideLoader();
            }
        }

        async function applyGenreFilterFromSA() {
            stopMainPageBackdropSlideshow();
            if (pageBackdrop.style.opacity !== '0') updatePageBackground(null);
            if (!selectedGenreSA.id && selectedGenreSA.type !== 'anime') { // If no genre selected and not anime type
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

            if (activeAppliedGenre.type === 'movie') {
                titlePrefix = 'Filmes do Gênero: ';
                params.with_genres = activeAppliedGenre.id;
                data = await fetchTMDB(`/discover/movie`, params);
            } else if (activeAppliedGenre.type === 'tv') {
                titlePrefix = 'Séries do Gênero: ';
                params.with_genres = activeAppliedGenre.id;
                data = await fetchTMDB(`/discover/tv`, params);
            } else if (activeAppliedGenre.type === 'anime') {
                titlePrefix = 'Animes do Gênero: ';
                params.with_origin_country = TMDB_JAPAN_COUNTRY_CODE; // Always Japanese origin for anime
                params.with_keywords = TMDB_ANIME_KEYWORD_ID; // Always include anime keyword
                if (activeAppliedGenre.id) { // If a specific genre was selected within anime
                    params.with_genres = activeAppliedGenre.id;
                }
                data = await fetchTMDB(`/discover/tv`, params); // Anime are generally TV shows
            }

            if (singleSectionTitleEl) singleSectionTitleEl.textContent = `${titlePrefix}${activeAppliedGenre.name || 'Todos'}`;

            if (singleResultsGrid) {
                if (data && !data.error && data.results) {
                    totalPages.filter = data.total_pages || 1;
                    if (data.results.length > 0) displayResults(data.results, activeAppliedGenre.type === 'movie' ? 'movie' : 'tv', singleResultsGrid, true); // Anime results are 'tv'
                    else singleResultsGrid.innerHTML = `<p class="text-center col-span-full">Nenhum item encontrado para o gênero ${activeAppliedGenre.name || 'selecionado'}.</p>`;
                } else singleResultsGrid.innerHTML = `<p class="text-center col-span-full">Não foi possível aplicar o filtro. ${data?.message || 'Tente novamente.'}</p>`;
            }
            hideLoader();
            if (filterToggleButton) filterToggleButton.classList.add('active');
        }

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
                    console.log("LOG: Modal de detalhes prestes a fechar. Restaurando fundo.");
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

            const linkForContentPage = mediaType === 'movie'
                ? `https://alisuuu.github.io/Suquinho/?pagina=Catalogo1%2Findex.html%3Ftype%3Dmovie%26id%3D${itemId}`
                : `https://alisuuu.github.io/Suquinho/?pagina=Catalogo1%2Findex.html%3Ftype%3Dtv%26id%3D${itemId}`;

            currentExternalCopyUrl = linkForContentPage;

            if(externalCopyButtonContainer) externalCopyButtonContainer.style.display = 'flex';
            const currentExternalBtn = document.getElementById('externalCopyLinkButton');
            if(currentExternalBtn) {
                if (externalCopyButtonHandler) currentExternalBtn.removeEventListener('click', externalCopyButtonHandler);
                externalCopyButtonHandler = () => {
                    if(currentExternalCopyUrl) copyToClipboard(currentExternalCopyUrl, false);
                };
                currentExternalBtn.addEventListener('click', externalCopyButtonHandler);
            }
            
            const titleText = details.title || details.name || "Título Indisponível";

            // --- START: Logic to get Trailer or Fallback Poster ---
            let headerContentHTML = '';
            const videos = details.videos?.results || [];
            const trailer = videos.find(video => video.site === 'YouTube' && video.type === 'Trailer') || videos.find(video => video.site === 'YouTube'); // Fallback to any youtube video
            const posterModalPath = details.poster_path ? `${TMDB_IMAGE_BASE_URL}w780${details.poster_path}` : `https://placehold.co/780x1170/0A0514/F0F0F0?text=Indispon%C3%ADvel&font=inter`;

            if (trailer && trailer.key) {
                headerContentHTML = `
                    <div class="details-trailer-container">
                        <iframe
                            src="https://www.youtube.com/embed/${trailer.key}?autoplay=1&mute=1&rel=0&loop=1&playlist=${trailer.key}"
                            frameborder="0"
                            allow="autoplay; fullscreen; picture-in-picture"
                            allowfullscreen
                            title="Trailer de ${titleText.replace(/"/g, '&quot;')}"
                        ></iframe>
                    </div>`;
            } else {
                 const headerImagePath = details.backdrop_path ? `${TMDB_IMAGE_BASE_URL}w1280${details.backdrop_path}` : posterModalPath;
                 headerContentHTML = `<img src="${headerImagePath}" alt="Pôster de ${titleText.replace(/"/g, '&quot;')}" class="details-poster-fallback" onerror="this.onerror=null; this.src='https://placehold.co/1280x720/0A0514/F0F0F0?text=Erro+Imagem&font=inter';">`;
            }
            // --- END: Logic to get Trailer or Fallback Poster ---

            const overview = details.overview || 'Sinopse não disponível.';
            const releaseDate = details.release_date || details.first_air_date;
            const rating = details.vote_average ? details.vote_average.toFixed(1) : 'N/A';
            const genres = details.genres && details.genres.length > 0 ? details.genres.map(g => g.name).join(', ') : 'Gêneros não informados';
            const runtime = details.runtime || (details.episode_run_time && details.episode_run_time.length > 0 ? details.episode_run_time[0] : null);
            
            const iframeContainerClass = mediaType === 'tv' ? 'iframe-series-dimensions' : '';
            let castSectionHTML = '';
            if (details.credits && details.credits.cast && details.credits.cast.length > 0) {
                const castMembers = details.credits.cast.slice(0, 15);
                castSectionHTML = `<div class="details-cast-section"><h3 class="details-section-subtitle">Elenco Principal</h3><div class="details-cast-scroller">${castMembers.map(person => `<div class="cast-member-card"><img src="${person.profile_path ? TMDB_IMAGE_BASE_URL + 'w185' + person.profile_path : PLACEHOLDER_PERSON_IMAGE}" alt="${person.name || 'Ator/Atriz sem nome listado'}" class="cast-member-photo" onerror="this.onerror=null; this.src='${PLACEHOLDER_PERSON_IMAGE}';"> <p class="cast-member-name">${person.name || 'Nome não disponível'}</p><p class="cast-member-character">${person.character || ''}</p></div>`).join('')}</div></div>`;
            }
            let playerSectionHTML = '';
            if (superflixPlayerUrl) playerSectionHTML = `<div class="details-player-section"><h3 class="details-section-subtitle">Assistir Agora</h3><div class="details-iframe-container ${iframeContainerClass}"><iframe id="swal-details-iframe" src="${superflixPlayerUrl}" allowfullscreen title="Player de ${titleText.replace(/"/g, '&quot;')}" sandbox="allow-scripts allow-same-origin"></iframe></div></div>`;
            else playerSectionHTML = `<div class="details-player-section"><p class="details-player-unavailable">Player não disponível para este título.</p></div>`;

            const isFav = isFavorite(itemId, mediaType);
            const favoriteButtonHTML = `
                <button id="modalFavoriteButton" class="modal-favorite-button ${isFav ? 'active' : ''}" data-id="${itemId}" data-type="${mediaType}">
                    ${isFav ? '<i class="fas fa-heart"></i> Remover dos Favoritos' : '<i class="far fa-heart"></i> Adicionar aos Favoritos'}
                </button>
            `;
            
            // --- Final HTML structure for the modal ---
            const detailsHTML = `
                <div class="swal-details-content">
                    ${headerContentHTML}
                    <div class="details-info-area">
                        <h2 class="details-content-title">${titleText}</h2>
                        <div class="details-meta-info">
                            ${releaseDate ? `<span><i class="fas fa-calendar-alt"></i> ${new Date(releaseDate).toLocaleDateString('pt-BR', { year: 'numeric', month: '2-digit', day: '2-digit' })}</span>` : ''}
                            ${rating !== 'N/A' ? `<span><i class="fas fa-star"></i> ${rating} / 10</span>` : ''}
                            ${runtime ? `<span><i class="fas fa-clock"></i> ${runtime} min</span>` : ''}
                        </div>
                        ${genres ? `<p class="details-genres"><strong>Gêneros:</strong> ${genres}</p>` : ''}
                        ${favoriteButtonHTML}
                        <h3 class="details-section-subtitle" style="padding-left:0;">Sinopse</h3>
                        <p class="details-overview">${overview}</p>
                    </div>
                    ${castSectionHTML}
                    ${playerSectionHTML}
                </div>`;

            console.log("LOG: HTML dos detalhes construído. Tentando atualizar o modal...");
            Swal.update({ title: '', html: detailsHTML, showConfirmButton: false, showCloseButton: true, allowOutsideClick: true });
            console.log("LOG: Modal ATUALIZADO com conteúdo final.");

            const modalFavButton = document.getElementById('modalFavoriteButton');
            if (modalFavButton) {
                modalFavButton.addEventListener('click', () => {
                    const itemForFav = {
                        id: itemId,
                        title: details.title || details.name,
                        name: details.name || details.title,
                        poster_path: details.poster_path,
                        backdrop_path: details.backdrop_path
                    };
                    toggleFavorite(itemForFav, mediaType);
                });
            }
        }

        async function openFilterSweetAlert() {
            const swalHTML = `
                <div class="swal-genre-filter-type-selector mb-4">
                    <button id="swalMovieGenreTypeButton" data-type="movie" class="${currentFilterTypeSA === 'movie' ? 'active' : ''}">Filmes</button>
                    <button id="swalTvGenreTypeButton" data-type="tv" class="${currentFilterTypeSA === 'tv' ? 'active' : ''}">Séries</button>
                    <button id="swalAnimeGenreTypeButton" data-type="anime" class="${currentFilterTypeSA === 'anime' ? 'active' : ''}">Animes</button>
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
                    const movieBtn = document.getElementById('swalMovieGenreTypeButton');
                    const tvBtn = document.getElementById('swalTvGenreTypeButton');
                    const animeBtn = document.getElementById('swalAnimeGenreTypeButton'); // New Anime button
                    const genrePanel = document.getElementById('swalGenreButtonsPanel');

                    if (movieBtn) movieBtn.addEventListener('click', () => fetchAndDisplayGenresInSA('movie', genrePanel));
                    if (tvBtn) tvBtn.addEventListener('click', () => fetchAndDisplayGenresInSA('tv', genrePanel));
                    if (animeBtn) animeBtn.addEventListener('click', () => fetchAndDisplayGenresInSA('anime', genrePanel)); // Event for Anime

                    fetchAndDisplayGenresInSA(currentFilterTypeSA, genrePanel);
                    updateClearButtonVisibilitySA();
                },
                preConfirm: () => { return selectedGenreSA; },
            });
            currentOpenSwalRef.then(async (result) => {
                if (result.isConfirmed) {
                    if (selectedGenreSA.id || selectedGenreSA.type === 'anime') await applyGenreFilterFromSA(); // Apply filter even if no specific genre for anime
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

            // Update active state for type buttons
            document.querySelectorAll('.swal-genre-filter-type-selector button').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.type === mediaType);
            });

            // If switching type, clear selected genre
            if (selectedGenreSA.id && mediaType !== selectedGenreSA.type) {
                selectedGenreSA = { id: null, name: null, type: null };
            }

            genrePanelElement.innerHTML = '<div class="loader mx-auto my-3" style="width: 30px; height: 30px; border-width: 3px;"></div>';

            let genresToFetchType = mediaType;
            if (mediaType === 'anime') {
                genresToFetchType = 'tv'; // Animes are generally TV shows, so fetch TV genres
            }

            const data = await fetchTMDB(`/genre/${genresToFetchType}/list`);
            genrePanelElement.innerHTML = '';

            if (data && !data.error && data.genres) {
                // Add an "All" button for anime if no specific genre is selected
                if (mediaType === 'anime') {
                    const allButton = document.createElement('button');
                    allButton.textContent = 'Todos os Animes';
                    allButton.dataset.genreId = ''; // No specific ID
                    allButton.dataset.genreName = 'Todos';
                    allButton.setAttribute('role', 'button');
                    if (selectedGenreSA.id === null && selectedGenreSA.type === 'anime') {
                         allButton.classList.add('active');
                    }
                    allButton.onclick = () => {
                        selectedGenreSA = { id: null, name: 'Todos', type: 'anime' };
                        updateGenreButtonsInSAUI(genrePanelElement);
                        updateClearButtonVisibilitySA();
                    };
                    genrePanelElement.appendChild(allButton);
                }

                data.genres.forEach(genre => {
                    const button = document.createElement('button');
                    button.textContent = genre.name;
                    button.dataset.genreId = genre.id;
                    button.dataset.genreName = genre.name;
                    button.setAttribute('role', 'button');

                    if (genre.id === selectedGenreSA.id && mediaType === selectedGenreSA.type) {
                        button.classList.add('active');
                    }
                    button.onclick = () => {
                        if (selectedGenreSA.id === genre.id && selectedGenreSA.type === mediaType) {
                            selectedGenreSA = { id: null, name: null, type: null };
                            // If it was anime and we deselect a genre, default to "All Animes"
                            if (mediaType === 'anime') {
                                selectedGenreSA = { id: null, name: 'Todos', type: 'anime' };
                            }
                        } else {
                            selectedGenreSA = { id: genre.id, name: genre.name, type: mediaType };
                        }
                        updateGenreButtonsInSAUI(genrePanelElement);
                        updateClearButtonVisibilitySA();
                    };
                    genrePanelElement.appendChild(button);
                });
            } else {
                genrePanelElement.innerHTML = `<p class="text-xs text-center">Gêneros não encontrados. ${data?.message || ''}</p>`;
            }
            updateGenreButtonsInSAUI(genrePanelElement);
            updateClearButtonVisibilitySA();
        }

        function updateGenreButtonsInSAUI(genrePanelElement) {
            if (!genrePanelElement) return;
            const buttons = genrePanelElement.querySelectorAll('button');
            buttons.forEach(btn => {
                const genreId = btn.dataset.genreId ? parseInt(btn.dataset.genreId) : null;
                const isActive = (genreId === selectedGenreSA.id && currentFilterTypeSA === selectedGenreSA.type) ||
                                 (genreId === null && selectedGenreSA.id === null && currentFilterTypeSA === selectedGenreSA.type && currentFilterTypeSA === 'anime'); // For "All Animes" button
                btn.classList.toggle('active', isActive);
            });
        }

        function updateClearButtonVisibilitySA() {
            if (typeof Swal === 'undefined' || !Swal.getDenyButton) return;
            const denyButton = Swal.getDenyButton();
            if (denyButton) denyButton.style.display = (selectedGenreSA.id || activeAppliedGenre.id || selectedGenreSA.type === 'anime') ? 'inline-flex' : 'none';
        }

        async function loadMoreItems() {
            if (isLoadingMore) return;
            isLoadingMore = true;
            if (searchResultsLoader) searchResultsLoader.style.display = 'block';

            console.log(`LOG: loadMoreItems ACIONADO para contexto: ${currentContentContext}, próxima página de busca: ${searchCurrentPage + 1}, próxima de filtro: ${filterCurrentPage + 1}`);

            let nextPageData = null;
            let params = { sort_by: 'popularity.desc' };

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

                        if (activeAppliedGenre.type === 'movie') {
                            params.with_genres = activeAppliedGenre.id;
                            nextPageData = await fetchTMDB(`/discover/movie`, { ...params, page: filterCurrentPage });
                        } else if (activeAppliedGenre.type === 'tv') {
                            params.with_genres = activeAppliedGenre.id;
                            nextPageData = await fetchTMDB(`/discover/tv`, { ...params, page: filterCurrentPage });
                        } else if (activeAppliedGenre.type === 'anime') {
                            params.with_origin_country = TMDB_JAPAN_COUNTRY_CODE;
                            params.with_keywords = TMDB_ANIME_KEYWORD_ID;
                            if (activeAppliedGenre.id) {
                                params.with_genres = activeAppliedGenre.id;
                            }
                            nextPageData = await fetchTMDB(`/discover/tv`, { ...params, page: filterCurrentPage });
                        }

                        if (nextPageData && !nextPageData.error && nextPageData.results) {
                            totalPages.filter = nextPageData.total_pages || totalPages.filter;
                            displayResults(nextPageData.results, activeAppliedGenre.type === 'movie' ? 'movie' : 'tv', singleResultsGrid, false);
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


        // --- Utility Functions, Event Listeners, Initialization ---

        function shuffleArray(array) {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
        }

        function showLoader() { if(loader) loader.style.display = 'block'; }
        function hideLoader() { if(loader) loader.style.display = 'none'; }

        function updatePageBackground(backdropPath) {
            if (pageBackdrop) {
                if (backdropPath) {
                    const newBgImage = `url(${TMDB_IMAGE_BASE_URL}original${backdropPath})`;
                    if (pageBackdrop.style.backgroundImage !== newBgImage || pageBackdrop.style.opacity === '100') {
                        pageBackdrop.style.backgroundImage = newBgImage;
                    }
                    } else {
                    setTimeout(() => {
                        const popup = Swal.getPopup();
                        const isDetailsModalVisible = Swal.isVisible() && popup && popup.classList.contains('swal-details-popup');
                        if (pageBackdrop.style.opacity === '0' && !isDetailsModalVisible) {
                            pageBackdrop.style.backgroundImage = '';
                        }
                    }, 700);
                }
            }
        }

        function getFavorites() {
            try {
                const storedFavorites = localStorage.getItem(FAVORITES_STORAGE_KEY);
                return storedFavorites ? JSON.parse(storedFavorites) : [];
            } catch (e) {
                console.error("Error reading favorites from localStorage:", e);
                return [];
            }
        }

        function saveFavorites(favs) {
            try {
                localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favs));
            } catch (e) {
                console.error("Error saving favorites to localStorage:", e);
            }
        }

        function isFavorite(id, mediaType) {
            return favorites.some(fav => fav.id === id && fav.media_type === mediaType);
        }

        function toggleFavorite(item, mediaType) {
            const index = favorites.findIndex(fav => fav.id === item.id && fav.media_type === mediaType);
            if (index > -1) {
                // Remove from favorites
                favorites.splice(index, 1);
                Swal.fire({
                    toast: true, position: 'top-end', icon: 'info',
                    title: 'Removido dos Favoritos!', showConfirmButton: false, timer: 1500,
                    background: 'var(--card-bg)', color: 'var(--text-primary)', iconColor: 'var(--text-secondary)'
                });
            } else {
                // Add to favorites
                const favItem = {
                    id: item.id,
                    media_type: mediaType,
                    title: item.title || item.name,
                    poster_path: item.poster_path,
                    backdrop_path: item.backdrop_path // Store backdrop for details modal
                };
                favorites.push(favItem);
                Swal.fire({
                    toast: true, position: 'top-end', icon: 'success',
                    title: 'Adicionado aos Favoritos!', showConfirmButton: false, timer: 1500,
                    background: 'var(--card-bg)', color: 'var(--text-primary)', iconColor: 'var(--success-green)'
                });
            }
            saveFavorites(favorites);
            updateFavoriteButtonsState(item.id, mediaType); // Update all relevant buttons
        }

        function updateFavoriteButtonsState(itemId, mediaType) {
            const isFav = isFavorite(itemId, mediaType);
            // Update card buttons
            document.querySelectorAll(`.favorite-button[data-id="${itemId}"][data-type="${mediaType}"]`).forEach(btn => {
                btn.classList.toggle('active', isFav);
                btn.innerHTML = isFav ? '<i class="fas fa-heart"></i>' : '<i class="far fa-heart"></i>';
                btn.title = isFav ? 'Remover dos Favoritos' : 'Adicionar aos Favoritos';
            });
            // Update modal button if open
            const modalFavButton = document.getElementById('modalFavoriteButton');
            if (modalFavButton && modalFavButton.dataset.id == itemId && modalFavButton.dataset.type == mediaType) {
                modalFavButton.classList.toggle('active', isFav);
                modalFavButton.innerHTML = isFav ? '<i class="fas fa-heart"></i> Remover dos Favoritos' : '<i class="far fa-heart"></i> Adicionar aos Favoritos';
            }
        }

        function displayResults(items, defaultMediaType = null, targetGridElement, replace = true) {
            if (!targetGridElement) { console.error("Elemento target para displayResults não encontrado."); return; }
            if (replace) targetGridElement.innerHTML = '';
            let displayedCountThisCall = 0;
            if (!items || items.length === 0) {
                if (replace && targetGridElement.innerHTML === '') targetGridElement.innerHTML = `<p class="text-center col-span-full text-[var(--text-secondary)] py-10 text-lg">Nenhum item para exibir.</p>`;
                return;
            }
            items.forEach(item => {
                const mediaType = item.media_type || defaultMediaType;
                if (!mediaType || (mediaType !== 'movie' && mediaType !== 'tv') || !item.poster_path) { return; }
                const card = document.createElement('div'); card.className = 'content-card shadow-lg group';
                card.onclick = () => openItemModal(item.id, mediaType, item.backdrop_path);
                card.setAttribute('role', 'button'); card.setAttribute('tabindex', '0'); card.setAttribute('aria-label', `Ver detalhes de ${item.title || item.name || 'Conteúdo sem título'}`);
                card.onkeydown = (event) => { if (event.key === 'Enter' || event.key === ' ') openItemModal(item.id, mediaType, item.backdrop_path); };
                const img = document.createElement('img'); img.src = `${TMDB_IMAGE_BASE_URL}w780${item.poster_path}`; img.alt = `Pôster de ${item.title || item.name || 'Conteúdo sem título'}`; img.loading = 'lazy';
                img.onerror = function() { this.src = `https://placehold.co/780x1170/0A0514/F0F0F0?text=Indispon%C3%ADvel&font=inter`; this.alt = 'Imagem indisponível'; this.onerror = null; };
                const titleOverlay = document.createElement('div'); titleOverlay.className = 'title-overlay';
                const titleDiv = document.createElement('div'); titleDiv.className = 'title'; titleDiv.textContent = item.title || item.name || "Título não disponível";
                titleOverlay.appendChild(titleDiv);

                // Add Favorite Button to card
                const favButton = document.createElement('button');
                favButton.className = 'favorite-button';
                favButton.dataset.id = item.id;
                favButton.dataset.type = mediaType;
                favButton.title = 'Adicionar aos Favoritos';
                favButton.innerHTML = '<i class="far fa-heart"></i>'; // Default: not favorited

                favButton.addEventListener('click', (event) => {
                    event.stopPropagation(); // Prevent card click from opening modal
                    toggleFavorite(item, mediaType);
                });

                card.appendChild(img);
                card.appendChild(titleOverlay);
                card.appendChild(favButton); // Append to card
                targetGridElement.appendChild(card);
                displayedCountThisCall++;
                // Update button state immediately after creating it
                updateFavoriteButtonsState(item.id, mediaType);
            });
            if (replace && displayedCountThisCall === 0 && items.length > 0) {
                 targetGridElement.innerHTML = `<p class="text-center col-span-full text-[var(--text-secondary)] py-10 text-lg">Nenhum item válido para exibir após as validações.</p>`;
            }
        }

        function copyToClipboard(textToCopy, isPlayerLink = false) {
            const linkType = isPlayerLink ? "do player" : "da página";
            const warningTitle = `Nenhum link ${linkType} disponível para copiar.`; const successTitle = `Link ${linkType} copiado!`; const errorTitle = `Falha ao copiar link ${linkType}!`;
            if (!textToCopy) { if (typeof Swal !== 'undefined') Swal.fire({ toast: true, position: 'top-end', icon: 'warning', title: warningTitle, showConfirmButton: false, timer: 2500, background: 'var(--card-bg)', color: 'var(--text-primary)', iconColor: 'var(--text-secondary)'}); return; }
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(textToCopy)
                    .then(() => { if (typeof Swal !== 'undefined') Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: successTitle, showConfirmButton: false, timer: 1500, background: 'var(--card-bg)', color: 'var(--text-primary)', timerProgressBar: true, iconColor: 'var(--success-green)' }); })
                    .catch(errN => legacyCopyToClipboard(textToCopy, successTitle, errorTitle));
            } else legacyCopyToClipboard(textToCopy, successTitle, errorTitle);
        }
        function legacyCopyToClipboard(textToCopy, successTitle, errorTitle) {
            const tempTextArea = document.createElement("textarea"); tempTextArea.value = textToCopy; tempTextArea.style.position = "absolute"; tempTextArea.style.left = "-9999px"; tempTextArea.style.top = "0";
            document.body.appendChild(tempTextArea); tempTextArea.select(); tempTextArea.setSelectionRange(0, 99999); let success = false;
            try { success = document.execCommand('copy'); } catch (err) { console.error("[legacyCopyToClipboard] Erro:", err); }
            document.body.removeChild(tempTextArea);
            if (typeof Swal !== 'undefined') {
                const swalProps = { toast: true, position: 'top-end', showConfirmButton: false, timer: 1500, background: 'var(--card-bg)', color: 'var(--text-primary)', timerProgressBar: true };
                if (success) Swal.fire({ ...swalProps, icon: 'success', title: successTitle, iconColor: 'var(--success-green)' });
                else Swal.fire({ ...swalProps, icon: 'error', title: errorTitle, timer:2000, iconColor: 'var(--danger-red)' });
            }
        }

        async function openFavoritesModal() {
            const currentFavs = getFavorites();
            let favsHtml = '';
            if (currentFavs.length === 0) {
                favsHtml = '<p class="text-center text-[var(--text-secondary)] py-5">Você não tem nenhum favorito ainda.</p>';
            } else {
                favsHtml = `
                    <div class="favorites-grid">
                        ${currentFavs.map(item => `
                            <div class="content-card favorite-card" role="button" tabindex="0" aria-label="Ver detalhes de ${item.title || item.name}"
                                onclick="openItemModal(${item.id}, '${item.media_type}', '${item.backdrop_path || ''}')"
                                onkeydown="if(event.key === 'Enter' || event.key === ' ') openItemModal(${item.id}, '${item.media_type}', '${item.backdrop_path || ''}')">
                                <img src="${TMDB_IMAGE_BASE_URL}w342${item.poster_path}" alt="Pôster de ${item.title || item.name}" loading="lazy" onerror="this.src='https://placehold.co/342x513/0A0514/F0F0F0?text=Indispon%C3%ADvel&font=inter'; this.alt='Imagem indisponível'; this.onerror=null;">
                                <div class="title-overlay"><div class="title">${item.title || item.name}</div></div>
                                <button class="remove-favorite-button" data-id="${item.id}" data-type="${item.media_type}" title="Remover dos Favoritos">
                                    <i class="fas fa-times-circle"></i>
                                </button>
                            </div>
                        `).join('')}
                    </div>
                `;
            }

            currentOpenSwalRef = Swal.fire({
                title: 'Meus Favoritos',
                html: favsHtml,
                showConfirmButton: false,
                showCloseButton: true,
                allowOutsideClick: true,
                customClass: {
                    popup: 'swal2-popup swal-favorites-popup',
                    title: 'swal2-title',
                    htmlContainer: 'swal2-html-container',
                    closeButton: 'swal2-close'
                },
                didOpen: () => {
                    document.querySelectorAll('.remove-favorite-button').forEach(button => {
                        button.addEventListener('click', (event) => {
                            event.stopPropagation(); // Prevent card click
                            const itemId = parseInt(button.dataset.id);
                            const mediaType = button.dataset.type;
                            const itemToRemove = currentFavs.find(fav => fav.id === itemId && fav.media_type === mediaType);
                            if (itemToRemove) {
                                toggleFavorite(itemToRemove, mediaType);
                                // Re-open the favorites modal to reflect changes
                                Swal.close();
                                openFavoritesModal();
                            }
                        });
                    });
                }
            });
        }


        // Event Listeners
        document.addEventListener('DOMContentLoaded', () => {
            console.log("LOG DOMContentLoaded: Iniciando aplicação.");
            const apiKeyIsValid = TMDB_API_KEY && TMDB_API_KEY !== 'SUA_CHAVE_API_TMDB_AQUI' && TMDB_API_KEY.length > 10;
            if (!apiKeyIsValid) {
                 console.error("Chave da API TMDB inválida ou não configurada.");
                 const errorMsgHtml = `<p class="text-center text-red-400 p-4 col-span-full">Chave da API TMDB inválida.</p>`;
                 if(moviesResultsGrid) moviesResultsGrid.innerHTML = errorMsgHtml; if(tvShowsResultsGrid) tvShowsResultsGrid.innerHTML = errorMsgHtml; if(singleResultsGrid) singleResultsGrid.innerHTML = errorMsgHtml;
                 if(searchInput) searchInput.disabled = true; if(searchButton) searchButton.disabled = true; if(filterToggleButton) filterToggleButton.disabled = true; if(loader) loader.style.display = 'none';
                 const header = document.querySelector('header'); const errorDiv = document.createElement('div'); errorDiv.innerHTML = `<div style="background-color: #B91C1C; color: white; text-align: center; padding: 0.75rem; font-weight: bold;">ERRO: Chave da API TMDB necessária.</div>`;
                 if(header && header.parentNode) header.parentNode.insertBefore(errorDiv, header.nextSibling); else document.body.insertBefore(errorDiv, document.body.firstChild);
                 return;
            }

            favorites = getFavorites(); // Load favorites on startup

            if (searchInput) searchInput.addEventListener('input', () => { clearTimeout(searchTimeout); searchTimeout = setTimeout(() => { if (searchInput.value !== undefined) performSearch(searchInput.value); }, 500); });
            else console.warn("Elemento searchInput não encontrado.");
            if (searchButton) searchButton.addEventListener('click', () => { clearTimeout(searchTimeout); if (searchInput && searchInput.value !== undefined) performSearch(searchInput.value); else if (searchInput) performSearch(''); else console.warn("Elemento searchInput não encontrado para busca por botão."); });
            else console.warn("Elemento searchButton não encontrado.");
            if (filterToggleButton) filterToggleButton.addEventListener('click', openFilterSweetAlert);
            else console.warn("Elemento filterToggleButton não encontrado.");
            document.addEventListener('keydown', (event) => { if (event.key === 'Escape') { if (typeof Swal !== 'undefined' && Swal.isVisible()) Swal.close(); } });

            // Floating Favorites Button Listener
            if (floatingFavoritesButton) {
                floatingFavoritesButton.addEventListener('click', openFavoritesModal);
            } else {
                console.warn("Elemento floatingFavoritesButton não encontrado.");
            }

            // --- Scroll Listeners for Infinite Scroll ---
            if (moviesResultsGrid) {
                moviesResultsGrid.addEventListener('scroll', () => {
                    if (defaultContentSections && defaultContentSections.style.display === 'block' &&
                        !isLoadingMorePopularMovies && popularMoviesCurrentPage < popularMoviesTotalPages &&
                        moviesResultsGrid.scrollWidth > moviesResultsGrid.clientWidth &&
                        (moviesResultsGrid.scrollLeft + moviesResultsGrid.clientWidth >= moviesResultsGrid.scrollWidth - 200)) {
                    }
                });
            } else console.warn("Elemento moviesResultsGrid não encontrado.");

            if (tvShowsResultsGrid) {
                tvShowsResultsGrid.addEventListener('scroll', () => {
                    if (defaultContentSections && defaultContentSections.style.display === 'block' &&
                        !isLoadingMoreTopRatedTvShows && topRatedTvShowsCurrentPage < topRatedTvShowsTotalPages &&
                        tvShowsResultsGrid.scrollWidth > tvShowsResultsGrid.clientWidth &&
                        (tvShowsResultsGrid.scrollLeft + tvShowsResultsGrid.clientWidth >= tvShowsResultsGrid.scrollWidth - 200)) {
                    }
                });
            } else console.warn("Elemento tvShowsResultsGrid não encontrado.");

            const mainContentAreaEl = document.getElementById('contentArea');
            let scrollTargetForResults = window;
            let useElementScrollProperties = false;

            console.log("LOG DOMContentLoaded: Verificando alvo de scroll vertical. window.innerWidth:", window.innerWidth);
            if (mainContentAreaEl) {
                console.log("LOG DOMContentLoaded: #contentArea ENCONTRADO.");
                const bodyComputedOverflowY = getComputedStyle(document.body).overflowY;
                const mainContentComputedOverflowY = getComputedStyle(mainContentAreaEl).overflowY;
                console.log("LOG DOMContentLoaded: Estilo Computado - Body overflow-y:", bodyComputedOverflowY, "| #contentArea overflow-y:", mainContentComputedOverflowY);

                if (window.innerWidth < 768 && bodyComputedOverflowY === 'hidden' && (mainContentComputedOverflowY === 'auto' || mainContentComputedOverflowY === 'scroll')) {
                    scrollTargetForResults = mainContentAreaEl;
                    useElementScrollProperties = true;
                    console.log("LOG: Scroll vertical para busca/filtro ATRELADO ao #contentArea (mobile).");
                } else {
                     console.log("LOG: Scroll vertical para busca/filtro ATRELADO à window (Desktop ou fallback mobile - bodyOFY:"+bodyComputedOverflowY+", mainContentOFY:"+mainContentComputedOverflowY+").");
                }
            } else {
                console.warn("LOG DOMContentLoaded: #contentArea NÃO encontrado. Usando window como alvo de scroll para resultados.");
                scrollTargetForResults = window;
                useElementScrollProperties = false;
            }

            scrollTargetForResults.addEventListener('scroll', () => {
                const isSingleSectionVisible = singleResultsSection && singleResultsSection.style.display === 'block';
                if (!isSingleSectionVisible || isLoadingMore) {
                    return;
                }

                let canLoadMoreContext = false;
                if (currentContentContext === 'search' && searchCurrentPage < totalPages.search) {
                    canLoadMoreContext = true;
                } else if (currentContentContext === 'filter' && filterCurrentPage < totalPages.filter) {
                    canLoadMoreContext = true;
                }
                if (!canLoadMoreContext) return;

                let scrolledToEnd;
                const offset = 100;

                if (useElementScrollProperties && scrollTargetForResults !== window) {
                    const st = scrollTargetForResults.scrollTop;
                    const ch = scrollTargetForResults.clientHeight;
                    const sh = scrollTargetForResults.scrollHeight;
                    scrolledToEnd = (st + ch >= sh - offset);
                } else {
                    const wh = window.innerHeight;
                    const sy = window.scrollY;
                    const dh = document.documentElement.scrollHeight;
                    scrolledToEnd = (wh + sy >= dh - (offset + 150));
                }

                if (scrolledToEnd) {
                    console.log(`LOG: !!! Scroll VERTICAL em ${useElementScrollProperties && scrollTargetForResults !== window ? '#contentArea' : 'window'} ATIVOU loadMoreItems para contexto: ${currentContentContext} !!!`);
                    loadMoreItems();
                }
            });

            // --- Page Content Initialization ---
            const urlParams = new URLSearchParams(window.location.search);
            const typeParam = urlParams.get('type'); const idParam = urlParams.get('id');
            if (typeParam && idParam && (typeParam === 'movie' || typeParam === 'tv')) {
                console.log(`Link direto detectado: type=${typeParam}, id=${idParam}. Abrindo modal.`);
                stopMainPageBackdropSlideshow();
                if(defaultContentSections) defaultContentSections.style.display = 'none'; if(singleResultsSection) singleResultsSection.style.display = 'none';
                if(moviesResultsGrid) moviesResultsGrid.innerHTML = ''; if(tvShowsResultsGrid) tvShowsResultsGrid.innerHTML = ''; if(singleResultsGrid) singleResultsGrid.innerHTML = '';
                if(loader) loader.style.display = 'none';
                openItemModal(idParam, typeParam, null);
            } else {
                console.log("Nenhum link direto. Carregando conteúdo principal.");
                loadMainPageContent();
            }
        });
