// Dependências: ui_elements.js, modal_handlers.js, api.js (para fetchAndDisplay, fetchTrending, searchItems, etc.)

// Funções de tratamento de eventos
async function handleSearchInput(e) {
    clearTimeout(window.searchTimeout); // Assume searchTimeout is global or passed
    const query = e.target.value;
    if (query.trim()) {
        window.searchTimeout = setTimeout(() => searchItems(query), 500);
    } else {
        fetchTrending();
    }
}

function handleCloseModalButton() {
    setItemModalOpen(false);
}

function handleCloseEpisodeModalButton() {
    setEpisodeModalOpen(false);
}

function handleWindowClick(event) {
    if (isEpisodeModalOpen && event.target === episodePlayerModal) {
        handleCloseEpisodeModalButton();
    } else if (isItemModalOpen && event.target === itemModal && !isEpisodeModalOpen) {
        handleCloseModalButton();
    }
}

function handleKeyDown(event) {
    if (event.key === 'Escape') {
        if (isEpisodeModalOpen) {
            handleCloseEpisodeModalButton();
        } else if (isItemModalOpen) {
            handleCloseModalButton();
        }
    }
}

function handleCopyEpisodeLinkBtn() {
    if (currentEpisodeEmbedderUrl) {
        const textarea = document.createElement('textarea');
        textarea.value = currentEpisodeEmbedderUrl;
        document.body.appendChild(textarea);
        textarea.select();
        try { document.execCommand('copy'); showToast('Link do episódio copiado!'); }
        catch (err) { showToast('Falha ao copiar.'); console.error('Falha ao copiar:', err); }
        document.body.removeChild(textarea);
    } else { showToast('Link do episódio não disponível.'); }
}

// Inicialização dos event listeners
document.addEventListener('DOMContentLoaded', () => {
    fetchTrending(); // Carrega os filmes/séries em alta na inicialização

    if (searchInput) searchInput.addEventListener('input', handleSearchInput);
    if (closeModalButton) closeModalButton.addEventListener('click', handleCloseModalButton);
    if (closeEpisodeModalButton) closeEpisodeModalButton.addEventListener('click', handleCloseEpisodeModalButton);
    if (copyEpisodeLinkBtn) copyEpisodeLinkBtn.addEventListener('click', handleCopyEpisodeLinkBtn);

    window.addEventListener('click', handleWindowClick);
    document.addEventListener('keydown', handleKeyDown);

    if (btnExplore) btnExplore.addEventListener('click', () => fetchAndDisplay('trending/all/week', "Explorando o que está em alta", btnExplore));
    if (btnMovies) btnMovies.addEventListener('click', () => fetchAndDisplay('discover/movie', "Filmes Populares", btnMovies, { sort_by: 'popularity.desc' }));
    if (btnSeries) btnSeries.addEventListener('click', () => fetchAndDisplay('discover/tv', "Séries Populares", btnSeries, { sort_by: 'popularity.desc' }));
});
