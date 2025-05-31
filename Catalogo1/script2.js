// --- Funções da API ---
async function fetchTMDB(endpoint, params = {}) {
    // Constrói os parâmetros da URL, incluindo a chave da API, idioma e outros parâmetros fornecidos.
    const urlParams = new URLSearchParams({ api_key: TMDB_API_KEY, language: LANGUAGE, include_adult: 'false', ...params });
    const url = `${TMDB_BASE_URL}${endpoint}?${urlParams}`;
    try {
        // Realiza a requisição para a API do TMDB.
        const response = await fetch(url);
        // Verifica se a resposta da API foi bem-sucedida.
        if (!response.ok) {
            // Tenta obter dados de erro da resposta JSON, ou usa o statusText como fallback.
            const errorData = await response.json().catch(() => ({ status_message: response.statusText, success: false }));
            console.error(`Erro na API TMDB: ${response.status} ${response.statusText}`, errorData);
            // Retorna um objeto de erro padronizado.
            return { error: true, status: response.status, message: errorData.status_message || "Erro desconhecido na API" };
        }
        // Retorna os dados JSON da resposta se bem-sucedido.
        return await response.json();
    } catch (error) {
        // Captura erros de rede ou outros problemas durante a requisição.
        console.error('Erro de rede ao buscar dados do TMDB:', error);
        return { error: true, message: "Erro de rede, por favor verifique a sua conexão." };
    }
}

// --- Lógica Principal da Aplicação ---
async function loadMainPageContent() {
    console.log("loadMainPageContent chamada");
    showLoader(); // Mostra o indicador de carregamento.
    defaultContentSections.style.display = 'block'; // Exibe as seções de conteúdo padrão.
    singleResultsSection.style.display = 'none'; // Oculta a seção de resultados únicos.
    filterToggleButton.classList.remove('active'); // Remove o estado ativo do botão de filtro.
    activeAppliedGenre = { id: null, name: null, type: null }; // Reseta o gênero ativo aplicado.

    // Busca filmes populares e séries mais bem avaliadas em paralelo.
    const moviesPromise = fetchTMDB(`/movie/popular`);
    const tvShowsPromise = fetchTMDB(`/tv/top_rated`);

    // Aguarda a conclusão de ambas as requisições.
    const [moviesData, tvShowsData] = await Promise.all([moviesPromise, tvShowsPromise]);

    // Exibe os resultados dos filmes se a requisição for bem-sucedida.
    if (moviesData && !moviesData.error && moviesData.results) {
        displayResults(moviesData.results, 'movie', moviesResultsGrid);
    } else {
        // Exibe mensagem de erro se não for possível carregar os filmes.
        moviesResultsGrid.innerHTML = `<p class="text-center col-span-full text-[var(--text-secondary)] py-5">Não foi possível carregar filmes populares. ${moviesData?.message || ''}</p>`;
    }
    // Exibe os resultados das séries se a requisição for bem-sucedida.
    if (tvShowsData && !tvShowsData.error && tvShowsData.results) {
        displayResults(tvShowsData.results, 'tv', tvShowsResultsGrid);
    } else {
        // Exibe mensagem de erro se não for possível carregar as séries.
        tvShowsResultsGrid.innerHTML = `<p class="text-center col-span-full text-[var(--text-secondary)] py-5">Não foi possível carregar séries populares. ${tvShowsData?.message || ''}</p>`;
    }
    hideLoader(); // Oculta o indicador de carregamento.
}

async function performSearch(query) {
    console.log("performSearch chamada com a query:", query);
    showLoader();
    activeAppliedGenre = { id: null, name: null, type: null }; // Reseta o gênero ativo.
    selectedGenreSA = { id: null, name: null, type: null }; // Reseta o gênero selecionado no SweetAlert.
    filterToggleButton.classList.remove('active'); // Desativa o botão de filtro.

    // Se a query estiver vazia, carrega o conteúdo da página principal.
    if (!query.trim()) {
        loadMainPageContent();
        return;
    }

    // Configura a exibição para resultados de pesquisa.
    defaultContentSections.style.display = 'none';
    singleResultsSection.style.display = 'block';
    singleSectionTitleEl.textContent = `Resultados para: "${query}"`;

    // Busca por múltiplos tipos de mídia (filmes e séries).
    const data = await fetchTMDB('/search/multi', { query: query });
    if (data && !data.error && data.results) {
        // Filtra os resultados para incluir apenas filmes e séries com poster.
        const filteredResults = data.results.filter(item => (item.media_type === 'movie' || item.media_type === 'tv') && item.poster_path);
        if (filteredResults.length > 0) {
            displayResults(filteredResults, null, singleResultsGrid);
        } else {
            singleResultsGrid.innerHTML = `<p class="text-center col-span-full">Nenhum filme ou série relevante encontrado para "${query}".</p>`;
        }
    } else {
         singleResultsGrid.innerHTML = `<p class="text-center col-span-full">Não foi possível realizar a busca. ${data?.message || 'Tente novamente.'}</p>`;
    }
    hideLoader();
}

// --- Lógica de Filtro (SweetAlert2) ---
async function openFilterSweetAlert() {
    console.log("openFilterSweetAlert chamada");
    // HTML para o modal de filtro do SweetAlert.
    const swalHTML = `
        <div class="swal-genre-filter-type-selector mb-4">
            <button id="swalMovieGenreTypeButton" data-type="movie" class="${currentFilterTypeSA === 'movie' ? 'active' : ''}">Filmes</button>
            <button id="swalTvGenreTypeButton" data-type="tv" class="${currentFilterTypeSA === 'tv' ? 'active' : ''}">Séries</button>
        </div>
        <div id="swalGenreButtonsPanel" class="swal-genre-buttons-panel my-4">
            Carregando géneros...
        </div>
    `;

    // Abre o modal SweetAlert.
    currentOpenSwalRef = Swal.fire({
        title: 'Filtrar por Género',
        html: swalHTML,
        showCloseButton: true,
        showCancelButton: false,
        showDenyButton: true,
        denyButtonText: 'Limpar Filtro',
        confirmButtonText: 'Aplicar Filtro',
        customClass: { // Classes CSS personalizadas para o SweetAlert.
            popup: 'swal2-popup',
            title: 'swal2-title',
            htmlContainer: 'swal2-html-container',
            closeButton: 'swal2-close',
            actions: 'swal-filter-actions',
            confirmButton: 'swal2-confirm',
            denyButton: 'swal2-deny'
        },
        didOpen: () => {
            // Event listeners para os botões de tipo de mídia (filme/série) e painel de géneros.
            const movieBtn = document.getElementById('swalMovieGenreTypeButton');
            const tvBtn = document.getElementById('swalTvGenreTypeButton');
            const genrePanel = document.getElementById('swalGenreButtonsPanel');

            movieBtn.addEventListener('click', () => fetchAndDisplayGenresInSA('movie', genrePanel));
            tvBtn.addEventListener('click', () => fetchAndDisplayGenresInSA('tv', genrePanel));

            fetchAndDisplayGenresInSA(currentFilterTypeSA, genrePanel); // Carrega os géneros iniciais.
            updateClearButtonVisibilitySA(); // Atualiza a visibilidade do botão de limpar.
        },
        preConfirm: () => {
            return selectedGenreSA; // Retorna o género selecionado antes de confirmar.
        },
    });

    // Lida com o resultado do SweetAlert (confirmar, negar).
    currentOpenSwalRef.then(async (result) => {
        if (result.isConfirmed) {
            if (selectedGenreSA.id) {
                await applyGenreFilterFromSA(); // Aplica o filtro de género.
            } else {
                // Se nenhum género for selecionado, limpa o filtro e recarrega a página principal.
                activeAppliedGenre = { id: null, name: null, type: null };
                filterToggleButton.classList.remove('active');
                loadMainPageContent();
            }
        } else if (result.isDenied) {
            // Se o filtro for negado (limpo), reseta os géneros e recarrega a página principal.
            selectedGenreSA = { id: null, name: null, type: null };
            activeAppliedGenre = { id: null, name: null, type: null };
            filterToggleButton.classList.remove('active');
            loadMainPageContent();
        }
        currentOpenSwalRef = null; // Reseta a referência do SweetAlert aberto.
    });
}

async function fetchAndDisplayGenresInSA(mediaType, genrePanelElement) {
    currentFilterTypeSA = mediaType; // Atualiza o tipo de mídia atual para o filtro.
    // Atualiza o estado visual dos botões de tipo de mídia.
    const movieBtn = document.getElementById('swalMovieGenreTypeButton');
    const tvBtn = document.getElementById('swalTvGenreTypeButton');
    if (movieBtn) movieBtn.classList.toggle('active', mediaType === 'movie');
    if (tvBtn) tvBtn.classList.toggle('active', mediaType === 'tv');

    // Se o género selecionado for de um tipo de mídia diferente, reseta-o.
    if (selectedGenreSA.id && mediaType !== selectedGenreSA.type) {
         selectedGenreSA = { id: null, name: null, type: null };
    }

    // Mostra um loader enquanto os géneros são carregados.
    genrePanelElement.innerHTML = '<div class="loader mx-auto my-3" style="width: 30px; height: 30px; border-width: 3px;"></div>';
    const data = await fetchTMDB(`/genre/${mediaType}/list`); // Busca a lista de géneros.
    genrePanelElement.innerHTML = ''; // Limpa o painel de géneros.
    if (data && !data.error && data.genres) {
        // Cria um botão para cada género retornado.
        data.genres.forEach(genre => {
            const button = document.createElement('button');
            button.textContent = genre.name;
            button.dataset.genreId = genre.id;
            button.dataset.genreName = genre.name;

            // Marca o botão como ativo se for o género atualmente selecionado.
            if (genre.id === selectedGenreSA.id && mediaType === selectedGenreSA.type) {
                button.classList.add('active');
            }
            // Define o evento de clique para selecionar/desselecionar o género.
            button.onclick = () => {
                if (selectedGenreSA.id === genre.id && selectedGenreSA.type === mediaType) {
                    // Desseleciona se já estiver selecionado.
                    selectedGenreSA = { id: null, name: null, type: null };
                } else {
                    // Seleciona o novo género.
                    selectedGenreSA = { id: genre.id, name: genre.name, type: mediaType };
                }
                updateGenreButtonsInSAUI(genrePanelElement); // Atualiza a UI dos botões de género.
                updateClearButtonVisibilitySA(); // Atualiza a visibilidade do botão de limpar.
            };
            genrePanelElement.appendChild(button);
        });
    } else {
        genrePanelElement.innerHTML = `<p class="text-xs text-center">Géneros não encontrados. ${data?.message || ''}</p>`;
    }
    updateGenreButtonsInSAUI(genrePanelElement); // Garante que a UI dos botões seja atualizada.
    updateClearButtonVisibilitySA();
}

function updateGenreButtonsInSAUI(genrePanelElement) {
    if (!genrePanelElement) return;
    const buttons = genrePanelElement.querySelectorAll('button');
    // Alterna a classe 'active' dos botões de acordo com o género selecionado.
    buttons.forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.genreId) === selectedGenreSA.id && currentFilterTypeSA === selectedGenreSA.type);
    });
}

function updateClearButtonVisibilitySA() {
    const denyButton = Swal.getDenyButton(); // Obtém o botão de "negar" (Limpar Filtro).
    if (denyButton) {
        // Mostra o botão de limpar se um género estiver selecionado ou aplicado.
        denyButton.style.display = (selectedGenreSA.id || activeAppliedGenre.id) ? 'inline-flex' : 'none';
    }
}

async function applyGenreFilterFromSA() {
    console.log("applyGenreFilterFromSA chamada com:", selectedGenreSA);
    // Se nenhum género estiver selecionado, limpa o filtro e recarrega a página principal.
    if (!selectedGenreSA.id) {
        activeAppliedGenre = { id: null, name: null, type: null };
        filterToggleButton.classList.remove('active');
        loadMainPageContent();
        return;
    }
    showLoader();
    activeAppliedGenre = { ...selectedGenreSA }; // Define o género ativo aplicado.

    // Configura a exibição para resultados filtrados por género.
    defaultContentSections.style.display = 'none';
    singleResultsSection.style.display = 'block';
    singleSectionTitleEl.textContent = `${activeAppliedGenre.type === 'movie' ? 'Filmes' : 'Séries'} do Género: ${activeAppliedGenre.name}`;

    // Busca itens pelo género selecionado, ordenados por popularidade.
    const data = await fetchTMDB(`/discover/${activeAppliedGenre.type}`, { with_genres: activeAppliedGenre.id, sort_by: 'popularity.desc' });
    if (data && !data.error && data.results) {
        if (data.results.length > 0) {
            displayResults(data.results, activeAppliedGenre.type, singleResultsGrid);
        } else {
            singleResultsGrid.innerHTML = `<p class="text-center col-span-full">Nenhum item encontrado para o género ${activeAppliedGenre.name}.</p>`;
        }
    } else {
        singleResultsGrid.innerHTML = `<p class="text-center col-span-full">Não foi possível aplicar o filtro. ${data?.message || 'Tente novamente.'}</p>`;
    }
    hideLoader();
    filterToggleButton.classList.add('active'); // Marca o botão de filtro como ativo.
}

// --- Modal de Detalhes do Item ---
async function getItemDetails(itemId, mediaType) {
    // Busca detalhes do item, incluindo IDs externos, créditos e vídeos.
    const data = await fetchTMDB(`/${mediaType}/${itemId}`, { append_to_response: 'external_ids,credits,videos' });
    return data;
}

async function openItemModal(itemId, mediaType, backdropPath) {
    console.log(`openItemModal chamada para ID: ${itemId}, Tipo: ${mediaType}`);
    updatePageBackground(backdropPath); // Atualiza o fundo da página com o backdrop do item.

    // Abre um SweetAlert para exibir os detalhes do item.
    currentOpenSwalRef = Swal.fire({
        title: 'Carregando Detalhes...',
        html: '<div class="loader mx-auto my-10" style="width: 40px; height: 40px; border-width: 4px;"></div>', // Loader.
        showConfirmButton: false,
        showCloseButton: true,
        allowOutsideClick: false, // Impede o fechamento ao clicar fora (será alterado após o carregamento).
        customClass: {
            popup: 'swal2-popup swal-details-popup',
            title: 'swal2-title',
            htmlContainer: 'swal2-html-container',
            closeButton: 'swal2-close'
        },
        willClose: () => {
            // Ações a serem executadas quando o modal estiver prestes a fechar.
            console.log("[willClose] Modal de detalhes do item a ser fechado.");
            updatePageBackground(null); // Reseta o fundo da página.
            const iframe = document.getElementById('swal-details-iframe');
            if (iframe) iframe.src = 'about:blank'; // Limpa o src do iframe para parar a reprodução.
            currentOpenSwalRef = null;

            // Oculta e limpa o botão de cópia de link externo.
            if (externalCopyButtonContainer) {
                externalCopyButtonContainer.style.display = 'none';
                console.log("[willClose] Container do botão de cópia externo escondido.");
            } else {
                 console.error("[willClose] Container do botão de cópia externo NÃO encontrado para esconder!");
            }

            if (externalCopyButtonHandler) {
                const btn = document.getElementById('externalCopyLinkButton');
                if(btn) {
                    btn.removeEventListener('click', externalCopyButtonHandler);
                    console.log("[willClose] Handler de clique do botão externo removido.");
                }
            }
            currentExternalCopyUrl = '';
            externalCopyButtonHandler = null;

            // Se o modal foi aberto via deep link, remove os parâmetros da URL e recarrega a página principal.
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.has('type') && urlParams.has('id')) {
                window.history.replaceState({}, document.title, window.location.pathname);
                console.log("Modal de deep link fechado, carregando conteúdo da página principal.");
                loadMainPageContent();
            } else {
                console.log("Modal de item regular fechado.");
            }
        }
    });

    const details = await getItemDetails(itemId, mediaType); // Busca os detalhes do item.
    console.log("Detalhes recebidos do TMDB:", details);

    // Se o modal foi fechado antes dos detalhes carregarem, não faz nada.
    if (!Swal.isVisible() || !currentOpenSwalRef) {
        updatePageBackground(null);
        return;
    }

    // Se houver erro ao buscar detalhes, exibe mensagem de erro.
    if (!details || details.error) {
        Swal.update({
            title: 'Erro',
            html: `<p class="text-red-400 text-center py-10">Não foi possível carregar os detalhes. ${details?.message || 'Tente novamente.'}</p>`,
            showConfirmButton: true,
            confirmButtonText: 'Fechar',
        });
        return;
    }

    // Se o backdrop não foi fornecido inicialmente, mas está nos detalhes, atualiza o fundo.
    if (!backdropPath && details.backdrop_path) {
        updatePageBackground(details.backdrop_path);
    }

    const imdbId = details.external_ids?.imdb_id; // Obtém o ID do IMDb.
    console.log("ID IMDb extraído:", imdbId);

    let superflixPlayerUrl = ''; // URL do player SuperFlix.
    if (imdbId) {
        superflixPlayerUrl = mediaType === 'movie' ? `${PLAYER_BASE_URL_MOVIE}${imdbId}` : `${PLAYER_BASE_URL_SERIES}${imdbId}`;
    }

    // Cria o link para a página de conteúdo (para cópia).
    const linkForContentPage = `${window.location.origin}${window.location.pathname}?type=${mediaType}&id=${itemId}`;
    console.log("Link para a página do conteúdo (modal) a ser copiado:", linkForContentPage);

    // Configura o botão de cópia de link externo.
    currentExternalCopyUrl = linkForContentPage;
    if(externalCopyButtonContainer) {
        externalCopyButtonContainer.style.display = 'flex';
         console.log("[openItemModal] Estilo do container do botão externo definido para 'flex'. Visível?", window.getComputedStyle(externalCopyButtonContainer).display);
    } else {
        console.error("[openItemModal] Container do botão de cópia externo (#externalCopyButtonContainer) NÃO encontrado no DOM ao tentar mostrar!");
    }

    const currentExternalBtn = document.getElementById('externalCopyLinkButton');
    if(currentExternalBtn) {
        // Remove handler antigo para evitar duplicidade.
        if (externalCopyButtonHandler) {
            currentExternalBtn.removeEventListener('click', externalCopyButtonHandler);
            console.log("[openItemModal] Handler de clique antigo do botão externo removido.");
        }
        // Adiciona novo handler.
        externalCopyButtonHandler = () => {
            console.log("Botão externo de cópia clicado. Tentando copiar:", currentExternalCopyUrl);
            if(currentExternalCopyUrl) {
                copyToClipboard(currentExternalCopyUrl, false); // Função para copiar para a área de transferência.
            } else {
                console.warn("Tentativa de cópia externa sem URL válida.");
            }
        };
        currentExternalBtn.addEventListener('click', externalCopyButtonHandler);
        console.log("[openItemModal] Novo handler de clique adicionado ao botão externo.");
    } else {
        console.error("[openItemModal] Botão de cópia externo (#externalCopyLinkButton) NÃO encontrado no DOM!");
    }

    // Extrai informações dos detalhes para exibição.
    const title = details.title || details.name;
    const overview = details.overview || 'Sinopse não disponível.';
    const posterModalPath = details.poster_path ? `${TMDB_IMAGE_BASE_URL}w780${details.poster_path}` : `https://placehold.co/780x1170/0A0514/F0F0F0?text=Indispon%C3%ADvel&font=inter`;
    const releaseDate = details.release_date || details.first_air_date;
    const rating = details.vote_average ? details.vote_average.toFixed(1) : 'N/A';
    const genres = details.genres.map(g => g.name).join(', ');
    const runtime = details.runtime || (details.episode_run_time && details.episode_run_time.length > 0 ? details.episode_run_time[0] : null);

    const iframeContainerClass = mediaType === 'tv' ? 'iframe-series-dimensions' : ''; // Classe CSS para ajustar dimensões do iframe de séries.

    // Cria a seção de elenco.
    let castSectionHTML = '';
    if (details.credits && details.credits.cast && details.credits.cast.length > 0) {
        const castMembers = details.credits.cast.slice(0, 15); // Limita a 15 membros do elenco.
        castSectionHTML = `
            <div class="details-cast-section">
                <h3 class="details-section-subtitle">Elenco Principal</h3>
                <div class="details-cast-scroller">
                    ${castMembers.map(person => `
                        <div class="cast-member-card">
                            <img src="${person.profile_path ? TMDB_IMAGE_BASE_URL + 'w185' + person.profile_path : PLACEHOLDER_PERSON_IMAGE}"
                                 alt="${person.name}" class="cast-member-photo"
                                 onerror="this.src='${PLACEHOLDER_PERSON_IMAGE}'; this.onerror=null;">
                            <p class="cast-member-name">${person.name || 'Nome não disponível'}</p>
                            <p class="cast-member-character">${person.character || ''}</p>
                        </div>
                    `).join('')}
                </div>
            </div>`;
    }

    // Cria a seção do player.
    let playerSectionHTML = '';
    if (superflixPlayerUrl) {
        playerSectionHTML = `
            <div class="details-player-section">
                <h3 class="details-section-subtitle">Assistir Agora</h3>
                <div class="details-iframe-container ${iframeContainerClass}">
                   <iframe id="swal-details-iframe" src="${superflixPlayerUrl}" allowfullscreen title="Player de ${title}"></iframe>
                </div>
            </div>`;
    } else {
        playerSectionHTML = `<div class="details-player-section"><p class="details-player-unavailable">Player não disponível para este título.</p></div>`;
    }

    // Monta o HTML final para o conteúdo do modal.
    const detailsHTML = `
        <div class="swal-details-content">
            <div class="details-flex-container">
                <img src="${posterModalPath}" alt="Pôster de ${title}" class="details-poster" onerror="this.src='https://placehold.co/780x1170/0A0514/F0F0F0?text=Erro+Imagem&font=inter'; this.onerror=null;">
                <div class="details-info-area">
                    <h2 class="details-content-title">${title}</h2>
                    <div class="details-meta-info">
                        ${releaseDate ? `<span><i class="fas fa-calendar-alt"></i>${new Date(releaseDate).toLocaleDateString('pt-BR')}</span>` : ''}
                        ${rating !== 'N/A' ? `<span><i class="fas fa-star"></i>${rating} / 10</span>` : ''}
                        ${runtime ? `<span><i class="fas fa-clock"></i>${runtime} min</span>` : ''}
                    </div>
                    ${genres ? `<p class="details-genres"><strong>Géneros:</strong> ${genres}</p>` : ''}
                    <h3 class="details-section-subtitle">Sinopse</h3>
                    <p class="details-overview">${overview}</p>
                    </div>
            </div>
            ${castSectionHTML}
            ${playerSectionHTML}
        </div>
    `;

    // Atualiza o SweetAlert com os detalhes carregados.
    Swal.update({
        title: '', // Remove o título "Carregando Detalhes..."
        html: detailsHTML,
        showConfirmButton: false,
        showCloseButton: true,
        allowOutsideClick: true // Permite fechar clicando fora agora que o conteúdo carregou.
    });
}

