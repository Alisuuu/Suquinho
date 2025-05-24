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
};

App.EventListeners.handleCloseEpisodeModalButton = () => {
    App.UI.setEpisodeModalOpen(false);
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
    await App.UI.initDisplay('discover/movie', "Filmes Populares", App.UI.elements.btnMovies, { sort_by: 'popularity.desc' });
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
document.addEventListener('DOMContentLoaded', () => {
    App.EventListeners.fetchTrending(); // Carrega os filmes/séries em alta na inicialização

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
