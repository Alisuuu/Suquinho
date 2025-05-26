// Crie um objeto App.EventListeners global se ainda não existir
window.App = window.App || {};
App.EventListeners = App.EventListeners || {};

// Dependências: App.UI, App.ModalHandlers

// Funções de tratamento de eventos
App.EventListeners.handleSearchInput = (e) => {
    clearTimeout(App.EventListeners.searchTimeout); // Usa a propriedade no objeto App.EventListeners
    const query = e.target.value;
    if (query.trim()) {
        App.EventListeners.searchTimeout = setTimeout(() => App.EventListeners.searchItems(query), 500);
    } else {
        App.EventListeners.fetchTrending();
    }
};

App.EventListeners.handleCloseModalButton = () => {
    App.UI.setItemModalOpen(false);
    // Limpa os parâmetros da URL ao fechar o modal principal
    const url = new URL(window.location.href);
    url.searchParams.delete('type');
    url.searchParams.delete('id');
    url.searchParams.delete('season');
    url.searchParams.delete('episode');
    window.history.pushState({}, '', url.toString());
};

App.EventListeners.handleCloseEpisodeModalButton = () => {
    App.UI.setEpisodeModalOpen(false);
    // Limpa os parâmetros de episódio da URL ao fechar o modal do episódio
    const url = new URL(window.location.href);
    url.searchParams.delete('season');
    url.searchParams.delete('episode');
    window.history.pushState({}, '', url.toString());
};

App.EventListeners.handleWindowClick = (event) => {
    if (App.UI.state.isEpisodeModalOpen && event.target === App.UI.elements.episodePlayerModal) {
        App.EventListeners.handleCloseEpisodeModalButton();
    } else if (App.UI.state.isItemModalOpen && event.target === App.UI.elements.itemModal && !App.UI.state.isEpisodeModalOpen) {
        App.EventListeners.handleCloseModalButton();
    }
};

App.EventListeners.handleKeyDown = (event) => {
    if (event.key === 'Escape') {
        if (App.UI.state.isEpisodeModalOpen) {
            App.EventListeners.handleCloseEpisodeModalButton();
        } else if (App.UI.state.isItemModalOpen) {
            App.EventListeners.handleCloseModalButton();
        }
    }
};

App.EventListeners.handleCopyEpisodeLinkBtn = () => {
    if (App.UI.state.currentEpisodeEmbedderUrl) {
        const textarea = document.createElement('textarea');
        textarea.value = App.UI.state.currentEpisodeEmbedderUrl;
        document.body.appendChild(textarea);
        textarea.select();
        try { document.execCommand('copy'); App.UI.showToast('Link do episódio copiado!'); }
        catch (err) { App.UI.showToast('Falha ao copiar.'); console.error('Falha ao copiar:', err); }
        document.body.removeChild(textarea);
    } else { App.UI.showToast('Link do episódio não disponível.'); }
};

// Funções para buscar e exibir conteúdo (replicadas aqui para serem chamadas diretamente pelos listeners)
App.EventListeners.fetchTrending = async () => {
    await App.UI.initDisplay('trending/all/week', "", App.UI.elements.btnExplore);
};

App.EventListeners.fetchMovies = async () => {
    await App.UI.initDisplay('discover/movie', "Filmes Populares", App.UI.elements.btnMovies, { sort_by: 'vote_count.desc' });
};

App.EventListeners.fetchSeries = async () => {
    await App.UI.initDisplay('discover/tv', "Séries Populares", App.UI.elements.btnSeries, { sort_by: 'vote_count.desc' });
};

App.EventListeners.searchItems = async (query) => {
    if (!query.trim()) {
        App.EventListeners.fetchTrending();
        return;
    }
    await App.UI.initDisplay('search/multi', `Resultados da Busca por: "${query}"`, null, { query }, 2);
};

// Variável para o timeout de busca
App.EventListeners.searchTimeout = null;

// Inicialização dos event listeners
document.addEventListener('DOMContentLoaded', async () => {
    // Check for deep linking parameters
    const urlParams = new URLSearchParams(window.location.search);
    const itemType = urlParams.get('type');
    const itemId = urlParams.get('id');
    const seasonNum = urlParams.get('season');
    const episodeNum = urlParams.get('episode');

    if (itemType && itemId) {
        // If deep link exists, try to open the modal
        try {
            await App.ModalHandlers.fetchItemDetails(itemId, itemType);
            // Atualiza a URL para refletir o item aberto
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.set('type', itemType);
            newUrl.searchParams.set('id', itemId);
            window.history.pushState({}, '', newUrl.toString());

            if (itemType === 'tv' && seasonNum && episodeNum) {
                // Need to fetch item details first to get imdb_id if not already fetched
                const itemDetails = await App.API.fetchItemDetailsFromApi(itemId, itemType); // Re-fetch to be safe, or pass from previous fetch
                if (itemDetails && itemDetails.external_ids && itemDetails.external_ids.imdb_id) {
                    const episodeTitle = `S${seasonNum} E${episodeNum}`; // Simplified title for deep link
                    await App.ModalHandlers.openEpisodePlayerModal(itemDetails.external_ids.imdb_id, seasonNum, episodeNum, itemId, episodeTitle);
                    // Atualiza a URL para incluir o episódio
                    const episodeUrl = new URL(window.location.href);
                    episodeUrl.searchParams.set('season', seasonNum);
                    episodeUrl.searchParams.set('episode', episodeNum);
                    window.history.pushState({}, '', episodeUrl.toString());
                }
            }
        } catch (error) {
            console.error("Failed to deep link:", error);
            App.UI.showToast("Não foi possível carregar o conteúdo do link direto.");
            // Fallback to normal trending view if deep link fails
            App.EventListeners.fetchTrending();
        }
    } else {
        // Normal initial load if no deep link
        App.EventListeners.fetchTrending();
    }

    // Adiciona os listeners aos elementos do DOM
    if (App.UI.elements.searchInput) App.UI.elements.searchInput.addEventListener('input', App.EventListeners.handleSearchInput);
    if (App.UI.elements.closeModalButton) App.UI.elements.closeModalButton.addEventListener('click', App.EventListeners.handleCloseModalButton);
    if (App.UI.elements.closeEpisodeModalButton) App.UI.elements.closeEpisodeModalButton.addEventListener('click', App.EventListeners.handleCloseEpisodeModalButton);
    if (App.UI.elements.copyEpisodeLinkBtn) App.UI.elements.copyEpisodeLinkBtn.addEventListener('click', App.EventListeners.handleCopyEpisodeLinkBtn);

    window.addEventListener('click', App.EventListeners.handleWindowClick);
    document.addEventListener('keydown', App.EventListeners.handleKeyDown);

    if (App.UI.elements.btnExplore) App.UI.elements.btnExplore.addEventListener('click', App.EventListeners.fetchTrending);
    if (App.UI.elements.btnMovies) App.UI.elements.btnMovies.addEventListener('click', App.EventListeners.fetchMovies);
    if (App.UI.elements.btnSeries) App.UI.elements.btnSeries.addEventListener('click', App.EventListeners.fetchSeries);
});
