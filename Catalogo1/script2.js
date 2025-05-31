// --- Script 2: API Functions, Core Logic, Filter Logic, Item Details Modal ---
// --- API Functions ---
async function fetchTMDB(endpoint, params = {}) {
    const urlParams = new URLSearchParams({ api_key: TMDB_API_KEY, language: LANGUAGE, include_adult: 'false', ...params });
    const url = `${TMDB_BASE_URL}${endpoint}?${urlParams}`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
            } catch (e) {
                errorData = { status_message: response.statusText || "Falha ao obter detalhes do erro da API.", success: false };
            }
            console.error(`TMDB API Error: ${response.status} ${response.statusText}`, errorData);
            return { error: true, status: response.status, message: errorData.status_message || "Erro desconhecido da API." };
        }
        return await response.json();
    } catch (error) {
        console.error('Erro de rede ao buscar dados do TMDB:', error);
        return { error: true, message: "Erro de rede, por favor verifique sua conexão." };
    }
}

// --- Core Application Logic ---
async function loadMainPageContent() {
    console.log("loadMainPageContent called");
    showLoader();
    if (defaultContentSections) defaultContentSections.style.display = 'block';
    if (singleResultsSection) singleResultsSection.style.display = 'none';
    if (filterToggleButton) filterToggleButton.classList.remove('active');
    activeAppliedGenre = { id: null, name: null, type: null };

    const moviesPromise = fetchTMDB(`/movie/popular`);
    const tvShowsPromise = fetchTMDB(`/tv/top_rated`);

    const [moviesData, tvShowsData] = await Promise.all([moviesPromise, tvShowsPromise]);

    if (moviesResultsGrid) {
        if (moviesData && !moviesData.error && moviesData.results) {
            displayResults(moviesData.results, 'movie', moviesResultsGrid);
        } else {
            moviesResultsGrid.innerHTML = `<p class="text-center col-span-full text-[var(--text-secondary)] py-5">Não foi possível carregar filmes populares. ${moviesData?.message || ''}</p>`;
        }
    }
    if (tvShowsResultsGrid) {
        if (tvShowsData && !tvShowsData.error && tvShowsData.results) {
            displayResults(tvShowsData.results, 'tv', tvShowsResultsGrid);
        } else {
            tvShowsResultsGrid.innerHTML = `<p class="text-center col-span-full text-[var(--text-secondary)] py-5">Não foi possível carregar séries populares. ${tvShowsData?.message || ''}</p>`;
        }
    }
    hideLoader();
}

async function performSearch(query) {
    console.log("performSearch called with query:", query);
    showLoader();
    activeAppliedGenre = { id: null, name: null, type: null };
    selectedGenreSA = { id: null, name: null, type: null };
    if (filterToggleButton) filterToggleButton.classList.remove('active');

    if (!query || !query.trim()) {
        loadMainPageContent();
        return;
    }

    if (defaultContentSections) defaultContentSections.style.display = 'none';
    if (singleResultsSection) singleResultsSection.style.display = 'block';
    if (singleSectionTitleEl) singleSectionTitleEl.textContent = `Resultados para: "${query}"`;

    const data = await fetchTMDB('/search/multi', { query: query });
    if (singleResultsGrid) {
        if (data && !data.error && data.results) {
            const filteredResults = data.results.filter(item => (item.media_type === 'movie' || item.media_type === 'tv') && item.poster_path);
            if (filteredResults.length > 0) {
                displayResults(filteredResults, null, singleResultsGrid);
            } else {
                singleResultsGrid.innerHTML = `<p class="text-center col-span-full">Nenhum filme ou série relevante encontrado para "${query}".</p>`;
            }
        } else {
            singleResultsGrid.innerHTML = `<p class="text-center col-span-full">Não foi possível realizar a busca. ${data?.message || 'Tente novamente.'}</p>`;
        }
    }
    hideLoader();
}

// --- Filter Logic (SweetAlert2) ---
async function openFilterSweetAlert() {
    console.log("openFilterSweetAlert called");
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
        title: 'Filtrar por Gênero',
        html: swalHTML,
        showCloseButton: true,
        showCancelButton: false,
        showDenyButton: true,
        denyButtonText: 'Limpar Filtro',
        confirmButtonText: 'Aplicar Filtro',
        customClass: {
            popup: 'swal2-popup',
            title: 'swal2-title',
            htmlContainer: 'swal2-html-container',
            closeButton: 'swal2-close',
            actions: 'swal-filter-actions',
            confirmButton: 'swal2-confirm',
            denyButton: 'swal2-deny'
        },
        didOpen: () => {
            const movieBtn = document.getElementById('swalMovieGenreTypeButton');
            const tvBtn = document.getElementById('swalTvGenreTypeButton');
            const genrePanel = document.getElementById('swalGenreButtonsPanel');

            if (movieBtn) movieBtn.addEventListener('click', () => fetchAndDisplayGenresInSA('movie', genrePanel));
            if (tvBtn) tvBtn.addEventListener('click', () => fetchAndDisplayGenresInSA('tv', genrePanel));

            fetchAndDisplayGenresInSA(currentFilterTypeSA, genrePanel);
            updateClearButtonVisibilitySA();
        },
        preConfirm: () => {
            return selectedGenreSA;
        },
    });

    currentOpenSwalRef.then(async (result) => {
        if (result.isConfirmed) {
            if (selectedGenreSA.id) {
                await applyGenreFilterFromSA();
            } else {
                activeAppliedGenre = { id: null, name: null, type: null };
                if(filterToggleButton) filterToggleButton.classList.remove('active');
                loadMainPageContent();
            }
        } else if (result.isDenied) {
            selectedGenreSA = { id: null, name: null, type: null };
            activeAppliedGenre = { id: null, name: null, type: null };
            if(filterToggleButton) filterToggleButton.classList.remove('active');
            loadMainPageContent();
        }
        currentOpenSwalRef = null;
    });
}

async function fetchAndDisplayGenresInSA(mediaType, genrePanelElement) {
    if (!genrePanelElement) {
        console.error("Painel de gêneros do SweetAlert não encontrado.");
        return;
    }
    currentFilterTypeSA = mediaType;
    const movieBtn = document.getElementById('swalMovieGenreTypeButton');
    const tvBtn = document.getElementById('swalTvGenreTypeButton');
    if (movieBtn) movieBtn.classList.toggle('active', mediaType === 'movie');
    if (tvBtn) tvBtn.classList.toggle('active', mediaType === 'tv');

    if (selectedGenreSA.id && mediaType !== selectedGenreSA.type) {
         selectedGenreSA = { id: null, name: null, type: null };
    }

    genrePanelElement.innerHTML = '<div class="loader mx-auto my-3" style="width: 30px; height: 30px; border-width: 3px;"></div>';
    const data = await fetchTMDB(`/genre/${mediaType}/list`);
    genrePanelElement.innerHTML = '';
    if (data && !data.error && data.genres) {
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
        const genreId = parseInt(btn.dataset.genreId);
        btn.classList.toggle('active', genreId === selectedGenreSA.id && currentFilterTypeSA === selectedGenreSA.type);
    });
}

function updateClearButtonVisibilitySA() {
    if (typeof Swal === 'undefined' || !Swal.getDenyButton) return;
    const denyButton = Swal.getDenyButton();
    if (denyButton) {
        denyButton.style.display = (selectedGenreSA.id || activeAppliedGenre.id) ? 'inline-flex' : 'none';
    }
}

async function applyGenreFilterFromSA() {
    console.log("applyGenreFilterFromSA called with:", selectedGenreSA);
    if (!selectedGenreSA.id) {
        activeAppliedGenre = { id: null, name: null, type: null };
        if(filterToggleButton) filterToggleButton.classList.remove('active');
        loadMainPageContent();
        return;
    }
    showLoader();
    activeAppliedGenre = { ...selectedGenreSA };

    if(defaultContentSections) defaultContentSections.style.display = 'none';
    if(singleResultsSection) singleResultsSection.style.display = 'block';
    if(singleSectionTitleEl) singleSectionTitleEl.textContent = `${activeAppliedGenre.type === 'movie' ? 'Filmes' : 'Séries'} do Gênero: ${activeAppliedGenre.name}`;

    const data = await fetchTMDB(`/discover/${activeAppliedGenre.type}`, { with_genres: activeAppliedGenre.id, sort_by: 'popularity.desc' });
    if (singleResultsGrid) {
        if (data && !data.error && data.results) {
            if (data.results.length > 0) {
                displayResults(data.results, activeAppliedGenre.type, singleResultsGrid);
            } else {
                singleResultsGrid.innerHTML = `<p class="text-center col-span-full">Nenhum item encontrado para o gênero ${activeAppliedGenre.name}.</p>`;
            }
        } else {
            singleResultsGrid.innerHTML = `<p class="text-center col-span-full">Não foi possível aplicar o filtro. ${data?.message || 'Tente novamente.'}</p>`;
        }
    }
    hideLoader();
    if(filterToggleButton) filterToggleButton.classList.add('active');
}

// --- Item Details Modal ---
async function getItemDetails(itemId, mediaType) {
    const data = await fetchTMDB(`/${mediaType}/${itemId}`, { append_to_response: 'external_ids,credits,videos' });
    return data;
}

async function openItemModal(itemId, mediaType, backdropPath = null) {
    console.log(`openItemModal called for ID: ${itemId}, Type: ${mediaType}`);
    updatePageBackground(backdropPath);

    currentOpenSwalRef = Swal.fire({
        title: 'Carregando Detalhes...',
        html: '<div class="loader mx-auto my-10" style="width: 40px; height: 40px; border-width: 4px;"></div>',
        showConfirmButton: false,
        showCloseButton: true,
        allowOutsideClick: true,
        customClass: {
            popup: 'swal2-popup swal-details-popup',
            title: 'swal2-title',
            htmlContainer: 'swal2-html-container',
            closeButton: 'swal2-close'
        },
        willClose: () => {
            console.log("[willClose] Modal de detalhes do item a ser fechado.");
            updatePageBackground(null);
            const iframe = document.getElementById('swal-details-iframe');
            if (iframe) iframe.src = 'about:blank';
            currentOpenSwalRef = null;

            if (externalCopyButtonContainer) {
                externalCopyButtonContainer.style.display = 'none';
                console.log("[willClose] Container do botão de cópia externo escondido.");
            } else {
                 console.warn("[willClose] Container do botão de cópia externo (#externalCopyButtonContainer) NÃO encontrado para esconder. Verifique se o ID está correto e o elemento existe no HTML principal.");
            }

            const btn = document.getElementById('externalCopyLinkButton');
            if(btn && externalCopyButtonHandler) {
                btn.removeEventListener('click', externalCopyButtonHandler);
                console.log("[willClose] Handler de clique do botão externo removido.");
            }
            currentExternalCopyUrl = '';
            externalCopyButtonHandler = null;

            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.has('type') && urlParams.has('id')) {
                window.history.replaceState({}, document.title, window.location.pathname);
                console.log("Deep link modal closed, loading main page content.");
                loadMainPageContent();
            } else {
                console.log("Regular item modal closed.");
            }
        }
    });

    const details = await getItemDetails(itemId, mediaType);
    console.log("Detalhes recebidos do TMDB:", details);

    if (!Swal.isVisible() || !currentOpenSwalRef) {
        console.log("Modal de detalhes não está mais visível. Abortando atualização de conteúdo.");
        updatePageBackground(null);
        return;
    }

    if (!details || details.error) {
        Swal.update({
            title: 'Erro',
            html: `<p class="text-red-400 text-center py-10">Não foi possível carregar os detalhes. ${details?.message || 'Tente novamente.'}</p>`,
            showConfirmButton: true,
            confirmButtonText: 'Fechar',
        });
        return;
    }

    if (!backdropPath && details.backdrop_path) {
        updatePageBackground(details.backdrop_path);
    }

    const imdbId = details.external_ids?.imdb_id;
    console.log("IMDb ID extraído:", imdbId);

    let superflixPlayerUrl = '';
    if (imdbId) {
        superflixPlayerUrl = mediaType === 'movie' ? `${PLAYER_BASE_URL_MOVIE}${imdbId}` : `${PLAYER_BASE_URL_SERIES}${imdbId}`;
    }

    const linkForContentPage = `${window.location.origin}${window.location.pathname}?type=${mediaType}&id=${itemId}`;
    console.log("Link para a página do conteúdo (modal) a ser copiado:", linkForContentPage);

    currentExternalCopyUrl = linkForContentPage;
    if(externalCopyButtonContainer) {
        externalCopyButtonContainer.style.display = 'flex';
         console.log("[openItemModal] Estilo do container do botão externo definido para 'flex'. Visível?", window.getComputedStyle(externalCopyButtonContainer).display);
    } else {
        console.warn("[openItemModal] Container do botão de cópia externo (#externalCopyButtonContainer) NÃO encontrado no DOM ao tentar mostrar! Verifique o HTML.");
    }

    const currentExternalBtn = document.getElementById('externalCopyLinkButton');
    if(currentExternalBtn) {
        if (externalCopyButtonHandler) {
            currentExternalBtn.removeEventListener('click', externalCopyButtonHandler);
            console.log("[openItemModal] Handler de clique antigo do botão externo removido antes de adicionar novo.");
        }
        externalCopyButtonHandler = () => {
            console.log("Botão externo de cópia clicado. Tentando copiar:", currentExternalCopyUrl);
            if(currentExternalCopyUrl) {
                copyToClipboard(currentExternalCopyUrl, false);
            } else {
                console.warn("Tentativa de cópia externa sem URL válida.");
            }
        };
        currentExternalBtn.addEventListener('click', externalCopyButtonHandler);
        console.log("[openItemModal] Novo handler de clique adicionado ao botão externo.");
    } else {
        console.warn("[openItemModal] Botão de cópia externo (#externalCopyLinkButton) NÃO encontrado no DOM! Verifique o HTML.");
    }

    const title = details.title || details.name || "Título Indisponível";
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
        castSectionHTML = `
            <div class="details-cast-section">
                <h3 class="details-section-subtitle">Elenco Principal</h3>
                <div class="details-cast-scroller">
                    ${castMembers.map(person => `
                        <div class="cast-member-card">
                            <img src="${person.profile_path ? TMDB_IMAGE_BASE_URL + 'w185' + person.profile_path : PLACEHOLDER_PERSON_IMAGE}"
                                 alt="${person.name || 'Ator/Atriz sem nome listado'}" class="cast-member-photo"
                                 onerror="this.onerror=null; this.src='${PLACEHOLDER_PERSON_IMAGE}';">
                            <p class="cast-member-name">${person.name || 'Nome não disponível'}</p>
                            <p class="cast-member-character">${person.character || ''}</p>
                        </div>
                    `).join('')}
                </div>
            </div>`;
    }

    let playerSectionHTML = '';
    if (superflixPlayerUrl) {
        playerSectionHTML = `
            <div class="details-player-section">
                <h3 class="details-section-subtitle">Assistir Agora</h3>
                <div class="details-iframe-container ${iframeContainerClass}">
                   <iframe id="swal-details-iframe" src="${superflixPlayerUrl}" allowfullscreen title="Player de ${title.replace(/"/g, '&quot;')}"></iframe>
                </div>
            </div>`;
    } else {
        playerSectionHTML = `<div class="details-player-section"><p class="details-player-unavailable">Player não disponível para este título.</p></div>`;
    }

    const detailsHTML = `
        <div class="swal-details-content">
            <div class="details-flex-container">
                <img src="${posterModalPath}" alt="Pôster de ${title.replace(/"/g, '&quot;')}" class="details-poster" onerror="this.onerror=null; this.src='https://placehold.co/780x1170/0A0514/F0F0F0?text=Erro+Imagem&font=inter';">
                <div class="details-info-area">
                    <h2 class="details-content-title">${title}</h2>
                    <div class="details-meta-info">
                        ${releaseDate ? `<span><i class="fas fa-calendar-alt"></i> ${new Date(releaseDate).toLocaleDateString('pt-BR', { year: 'numeric', month: '2-digit', day: '2-digit' })}</span>` : ''}
                        ${rating !== 'N/A' ? `<span><i class="fas fa-star"></i> ${rating} / 10</span>` : ''}
                        ${runtime ? `<span><i class="fas fa-clock"></i> ${runtime} min</span>` : ''}
                    </div>
                    ${genres ? `<p class="details-genres"><strong>Gêneros:</strong> ${genres}</p>` : ''}
                    <h3 class="details-section-subtitle">Sinopse</h3>
                    <p class="details-overview">${overview}</p>
                </div>
            </div>
            ${castSectionHTML}
            ${playerSectionHTML}
        </div>
    `;

    Swal.update({
        title: '',
        html: detailsHTML,
        showConfirmButton: false,
        showCloseButton: true,
        allowOutsideClick: true
    });
}