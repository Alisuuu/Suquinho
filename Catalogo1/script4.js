// Crie um objeto App.ModalHandlers global se ainda não existir
window.App = window.App || {};
App.ModalHandlers = App.ModalHandlers || {};

// Dependências: App.Constants, App.UI, App.API

App.ModalHandlers.fetchItemDetails = async (itemId, mediaType) => {
    if(App.UI.elements.loader) App.UI.elements.loader.classList.remove('hidden');
    try {
        const data = await App.API.fetchItemDetailsFromApi(itemId, mediaType);
        if (data) await App.ModalHandlers.displayModal(data, mediaType);
    } catch (error) {
        App.UI.showToast("Erro ao carregar detalhes. Tente novamente.");
    } finally {
        if(App.UI.elements.loader) App.UI.elements.loader.classList.add('hidden');
    }
};

App.ModalHandlers.displayModal = async (item, mediaType) => {
    const title = item.title || item.name;
    const overview = item.overview || 'Sinopse não disponível.';
    const releaseDate = item.release_date || item.first_air_date;
    const rating = item.vote_average ? item.vote_average.toFixed(1) : 'N/A';
    const posterPath = item.poster_path ? `${App.Constants.IMAGE_BASE_URL}${item.poster_path}` : `https://placehold.co/400x600/0a0a0a/581c87?text=Poster`;

    App.UI.state.currentItemModalEmbedderUrl = ''; // Reinicia a URL do player do item

    let playerSectionHTML = '';
    let seasonsSectionHTML = '';
    let seriesLinkButtonHTML = ''; // Novo HTML para o botão de link da série

    if (mediaType === 'movie') {
        playerSectionHTML = `
            <div class="player-section">
                <div class="flex justify-between items-center mb-2">
                    <h4 class="text-xl font-semibold text-violet-200">Player (Embedder.net)</h4>
                    <button id="copyMainPlayerLinkBtn" class="action-button text-xs py-1 px-3 rounded-md" title="Copiar link do player">
                        Copiar Link
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ml-2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                    </button>
                </div>
                <div id="embedderPlayerMessage" class="text-gray-400 mb-2">Verificando disponibilidade...</div>
                <div id="EmbedderIframeContainer"></div>
            </div>`;
    } else if (mediaType === 'tv') {
        // Botão para copiar o link da página da série
        seriesLinkButtonHTML = `
            <div class="text-center mt-4">
                <button id="copySeriesPageLinkBtn" class="action-button" title="Copiar link da página da série">
                    Copiar Link da Série
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ml-2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                </button>
            </div>
        `;

        seasonsSectionHTML = `
            <div class="seasons-section">
                <h4 class="text-xl font-semibold text-violet-200 mb-3">Temporadas e Episódios</h4>
                <div id="seasonsAccordion"></div>
            </div>`;
    }

    if (App.UI.elements.modalBody) App.UI.elements.modalBody.innerHTML = `
        <div class="flex flex-col md:flex-row gap-8">
            <div class="md:w-1/3 flex-shrink-0">
                <img src="${posterPath}" alt="${title}" class="w-full rounded-xl shadow-lg" onerror="this.src='https://placehold.co/400x600/0a0a0a/581c87?text=Poster'; this.alt='Poster Indisponível';">
            </div>
            <div class="md:w-2/3">
                <h2 class="text-3xl lg:text-4xl font-bold mb-3 text-violet-300">${title}</h2>
                <p class="text-sm text-gray-400 mb-1"><strong>Tipo:</strong> ${mediaType === 'movie' ? 'Filme' : 'Série de TV'}</p>
                <p class="text-sm text-gray-400 mb-1"><strong>Lançamento:</strong> ${releaseDate ? new Date(releaseDate).toLocaleDateString('pt-BR') : 'Não informado'}</p>
                <p class="text-sm text-gray-400 mb-4"><strong>Avaliação:</strong> ${rating} ⭐</p>
                <h4 class="text-xl font-semibold mb-2 text-violet-200">Sinopse Padrão</h4>
                <p class="text-gray-300 mb-6 text-sm leading-relaxed">${overview}</p>
            </div>
        </div>
        ${playerSectionHTML}
        ${seasonsSectionHTML}
        ${seriesLinkButtonHTML} `;

    App.UI.setItemModalOpen(true); // Abre o modal

    if (mediaType === 'movie') {
        const imdbId = item.external_ids?.imdb_id;
        const tmdbId = item.id;
        const embedderPlayerMessageEl = document.getElementById('embedderPlayerMessage');
        const copyMainPlayerLinkBtn = document.getElementById('copyMainPlayerLinkBtn');

        if (copyMainPlayerLinkBtn) {
            copyMainPlayerLinkBtn.disabled = true;
            copyMainPlayerLinkBtn.addEventListener('click', () => {
                if (App.UI.state.currentItemModalEmbedderUrl) {
                    const textarea = document.createElement('textarea');
                    textarea.value = App.UI.state.currentItemModalEmbedderUrl;
                    document.body.appendChild(textarea);
                    textarea.select();
                    try { document.execCommand('copy'); App.UI.showToast('Link do player copiado!'); }
                    catch (err) { App.UI.showToast('Falha ao copiar.'); console.error('Falha ao copiar:', err); }
                    document.body.removeChild(textarea);
                } else { App.UI.showToast('Link do player não disponível.'); }
            });
        }

        if (document.getElementById('EmbedderIframeContainer')) document.getElementById('EmbedderIframeContainer').innerHTML = '';
        if (embedderPlayerMessageEl) embedderPlayerMessageEl.textContent = 'Verificando disponibilidade...';

        if (!imdbId) {
            if (embedderPlayerMessageEl) embedderPlayerMessageEl.textContent = 'ID IMDB não encontrado. Player não disponível.';
            if (copyMainPlayerLinkBtn) copyMainPlayerLinkBtn.disabled = true;
            App.UI.state.currentItemModalEmbedderUrl = '';
        } else {
            try {
                const isAvailable = await App.API.checkEmbedderStatus(tmdbId, 'movie');
                if (isAvailable) {
                    if (embedderPlayerMessageEl) embedderPlayerMessageEl.textContent = `Disponível! Carregando player...`;
                    App.UI.embedderPlugin('filme', imdbId, null, null, 'EmbedderIframeContainer');
                    if (copyMainPlayerLinkBtn) copyMainPlayerLinkBtn.disabled = false;
                } else {
                    if (embedderPlayerMessageEl) embedderPlayerMessageEl.textContent = `Conteúdo não disponível no Embedder.net.`;
                    if (copyMainPlayerLinkBtn) copyMainPlayerLinkBtn.disabled = true;
                    App.UI.state.currentItemModalEmbedderUrl = '';
                }
            } catch (error) {
                if (embedderPlayerMessageEl) embedderPlayerMessageEl.innerHTML = `Falha ao verificar (Erro: ${error.message}). <br>Tentando carregar player...`;
                App.UI.embedderPlugin('filme', imdbId, null, null, 'EmbedderIframeContainer');
                if (copyMainPlayerLinkBtn && App.UI.state.currentItemModalEmbedderUrl) copyMainPlayerLinkBtn.disabled = false; else if (copyMainPlayerLinkBtn) copyMainPlayerLinkBtn.disabled = true;
            }
        }
    } else if (mediaType === 'tv') {
        const seasonsAccordion = document.getElementById('seasonsAccordion');
        if (item.seasons && seasonsAccordion) {
            const validSeasons = item.seasons.filter(s => s.season_number > 0 && s.episode_count > 0);
            validSeasons.forEach(async (season, index) => {
                const seasonDiv = document.createElement('div');
                const seasonButton = document.createElement('button');
                seasonButton.className = 'season-button';
                seasonButton.innerHTML = `${season.name || `Temporada ${season.season_number}`} <span class="text-xs text-gray-400">(${season.episode_count} episódios)</span> <span class="text-violet-300 ml-auto text-xl">${index === 0 ? '▾' : '▸'}</span>`;

                const episodesContainer = document.createElement('div');
                episodesContainer.className = 'episode-list-container hidden pl-4';

                if (index === 0) {
                    seasonButton.classList.add('active');
                    episodesContainer.classList.remove('hidden');
                    await App.ModalHandlers.loadSeasonEpisodes(item.id, season.season_number, episodesContainer, item.external_ids?.imdb_id);
                }

                seasonButton.addEventListener('click', async () => {
                    const isActive = seasonButton.classList.toggle('active');
                    seasonButton.querySelector('span:last-child').innerHTML = isActive ? '▾' : '▸';
                    episodesContainer.classList.toggle('hidden');
                    if (isActive && episodesContainer.innerHTML.includes('Carregando episódios...')) {
                        await App.ModalHandlers.loadSeasonEpisodes(item.id, season.season_number, episodesContainer, item.external_ids?.imdb_id);
                    } else if (isActive && episodesContainer.innerHTML === '') {
                        await App.ModalHandlers.loadSeasonEpisodes(item.id, season.season_number, episodesContainer, item.external_ids?.imdb_id);
                    }
                });
                seasonDiv.appendChild(seasonButton);
                seasonDiv.appendChild(episodesContainer);
                seasonsAccordion.appendChild(seasonDiv);
            });
        }

        // Adiciona o event listener para o botão de copiar link da série
        const copySeriesPageLinkBtn = document.getElementById('copySeriesPageLinkBtn');
        if (copySeriesPageLinkBtn) {
            copySeriesPageLinkBtn.addEventListener('click', () => {
                const seriesPageLink = `${window.location.origin}${window.location.pathname}?type=${mediaType}&id=${item.id}`;
                const textarea = document.createElement('textarea');
                textarea.value = seriesPageLink;
                document.body.appendChild(textarea);
                textarea.select();
                try { document.execCommand('copy'); App.UI.showToast('Link da série copiado!'); }
                catch (err) { App.UI.showToast('Falha ao copiar.'); console.error('Falha ao copiar link da série:', err); }
                document.body.removeChild(textarea);
            });
        }
    }
};


App.ModalHandlers.loadSeasonEpisodes = async (tvId, seasonNumber, container, seriesImdbId) => {
    container.innerHTML = '<p class="text-sm text-gray-400 p-2">Carregando episódios...</p>';
    try {
        const seasonData = await App.API.fetchSeasonDetailsFromApi(tvId, seasonNumber);
        if (seasonData && seasonData.episodes) {
            container.innerHTML = '';
            if (seasonData.episodes.length === 0) {
                container.innerHTML = '<p class="text-sm text-gray-400 p-2">Nenhum episódio encontrado para esta temporada.</p>';
                return;
            }
            seasonData.episodes.forEach(ep => {
                const epButton = document.createElement('button');
                epButton.className = 'episode-button';
                epButton.textContent = `EP ${ep.episode_number}: ${ep.name || 'Episódio sem título'}`;
                epButton.addEventListener('click', () => {
                    App.ModalHandlers.openEpisodePlayerModal(seriesImdbId, seasonNumber, ep.episode_number, tvId, `S${seasonNumber} E${ep.episode_number}: ${ep.name || 'Episódio'}`);
                });
                container.appendChild(epButton);
            });
        } else {
            container.innerHTML = '<p class="text-sm text-red-400 p-2">Falha ao carregar episódios.</p>';
        }
    } catch (error) {
        container.innerHTML = '<p class="text-sm text-red-400 p-2">Falha ao carregar episódios.</p>';
        App.UI.showToast(`Erro ao carregar episódios da temporada ${seasonNumber}.`);
    }
};

App.ModalHandlers.openEpisodePlayerModal = async (seriesImdbId, seasonNumber, episodeNumber, seriesTmdbId, episodeTitleText) => {
    if (!seriesImdbId) {
        App.UI.showToast("ID da série não encontrado para o player.");
        return;
    }
    if (App.UI.elements.episodePlayerTitleEl) App.UI.elements.episodePlayerTitleEl.textContent = episodeTitleText || `Temporada ${seasonNumber}, Episódio ${episodeNumber}`;

    const episodeIframeContainer = document.getElementById('EpisodeEmbedderIframeContainer');
    if (!episodeIframeContainer) return;

    const episodePlayerMessageEl = document.createElement('div');
    episodePlayerMessageEl.id = 'tempEpisodeMessage';
    episodePlayerMessageEl.className = 'text-gray-400 mb-2 text-center';
    episodeIframeContainer.innerHTML = '';
    episodeIframeContainer.appendChild(episodePlayerMessageEl);

    episodePlayerMessageEl.textContent = 'Verificando disponibilidade do episódio...';
    App.UI.state.currentEpisodeEmbedderUrl = ''; // Limpa a URL antes de tentar carregar uma nova
    if(App.UI.elements.copyEpisodeLinkBtn) App.UI.elements.copyEpisodeLinkBtn.disabled = true; // Desabilita o botão inicialmente

    App.UI.setEpisodeModalOpen(true); // Abre o modal do episódio

    try {
        const isAvailable = await App.API.checkEmbedderStatus(seriesTmdbId, 'tv', seasonNumber, episodeNumber);

        const tempMsg = document.getElementById('tempEpisodeMessage');
        if (tempMsg) tempMsg.remove();

        if (isAvailable) {
            App.UI.embedderPlugin('serie', seriesImdbId, seasonNumber, episodeNumber, 'EpisodeEmbedderIframeContainer');
            // O embedderPlugin já define App.UI.state.currentEpisodeEmbedderUrl.
            // Se estiver disponível, a URL deve ser definida, e habilitamos o botão.
            if(App.UI.elements.copyEpisodeLinkBtn) App.UI.elements.copyEpisodeLinkBtn.disabled = false;
        } else {
            episodeIframeContainer.innerHTML = `<p class="text-center text-gray-400 py-4">Episódio não disponível no Embedder.net.</p>`;
            if(App.UI.elements.copyEpisodeLinkBtn) App.UI.elements.copyEpisodeLinkBtn.disabled = true;
        }
    } catch (error) {
        const tempMsg = document.getElementById('tempEpisodeMessage');
        if (tempMsg) tempMsg.remove();
        episodeIframeContainer.innerHTML = `<p class="text-center text-gray-400 py-4">Falha ao verificar (Erro: ${error.message}).<br>Tentando carregar player...</p>`;
        App.UI.embedderPlugin('serie', seriesImdbId, seasonNumber, episodeNumber, 'EpisodeEmbedderIframeContainer');
        // Se houve erro na verificação mas o plugin foi tentado, o botão pode ser habilitado se a URL foi definida
        if(App.UI.elements.copyEpisodeLinkBtn) App.UI.elements.copyEpisodeLinkBtn.disabled = !App.UI.state.currentEpisodeEmbedderUrl;
    }
};
