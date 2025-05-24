// Crie um objeto App.UI global se ainda não existir
window.App = window.App || {};
App.UI = App.UI || {};

// Dependências: App.Constants (para IMAGE_BASE_URL)

// Referências a elementos do DOM
App.UI.elements = {
    searchInput: document.getElementById('searchInput'),
    resultsGrid: document.getElementById('resultsGrid'),
    itemModal: document.getElementById('itemModal'),
    modalBody: document.getElementById('modalBody'),
    closeModalButton: document.getElementById('closeModalButton'),

    episodePlayerModal: document.getElementById('episodePlayerModal'),
    closeEpisodeModalButton: document.getElementById('closeEpisodeModalButton'),
    episodePlayerTitleEl: document.getElementById('episodePlayerTitle'),
    copyEpisodeLinkBtn: document.getElementById('copyEpisodeLinkBtn'),
    loader: document.getElementById('loader'),
    noResultsMessage: document.getElementById('noResults'),
    currentViewTitleEl: document.getElementById('currentViewTitle'),

    btnExplore: document.getElementById('btnExplore'),
    btnMovies: document.getElementById('btnMovies'),
    btnSeries: document.getElementById('btnSeries'),
    categoryButtons: [document.getElementById('btnExplore'), document.getElementById('btnMovies'), document.getElementById('btnSeries')]
};

// Variáveis de estado da UI
App.UI.state = {
    currentItemModalEmbedderUrl: '',
    currentEpisodeEmbedderUrl: '',
    isItemModalOpen: false,
    isEpisodeModalOpen: false
};

// Funções de manipulação do DOM e UI
App.UI.showToast = (message) => {
    const existingToast = document.querySelector('.toast-message');
    if (existingToast) existingToast.remove();
    const toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
};

App.UI.setActiveButton = (activeBtn) => {
    App.UI.elements.categoryButtons.forEach(btn => btn.classList.remove('active'));
    if (activeBtn) activeBtn.classList.add('active');
};

// Esta função agora espera uma função de callback para o clique do card,
// pois `WorkspaceItemDetails` está em `script4.js`
App.UI.displayResults = (items, operationTitle, onItemClickCallback) => {
    if (App.UI.elements.resultsGrid) App.UI.elements.resultsGrid.innerHTML = '';
    const validItems = items ? items.filter(item => item.poster_path) : [];

    if (App.UI.elements.noResultsMessage) {
        if (validItems.length === 0) {
            if (operationTitle && operationTitle.toLowerCase().startsWith("resultados da busca por:")) {
                const searchTermMatch = operationTitle.match(/Resultados da Busca por: "([^"]*)"/);
                const searchTerm = searchTermMatch ? searchTermMatch[1] : App.UI.elements.searchInput.value.trim();
                App.UI.elements.noResultsMessage.textContent = `Nenhum resultado encontrado para "${searchTerm}".`;
            } else {
                App.UI.elements.noResultsMessage.textContent = "Nenhum item encontrado nesta categoria.";
            }
            App.UI.elements.noResultsMessage.classList.remove('hidden');
            return;
        }
        App.UI.elements.noResultsMessage.classList.add('hidden');
    }

    validItems.forEach(item => {
        const effectiveMediaType = item.media_type || (item.title ? 'movie' : 'tv');
        const card = document.createElement('div');
        card.className = 'item-card rounded-lg shadow-lg cursor-pointer overflow-hidden flex flex-col';
        // Usa o callback passado para lidar com o clique
        card.addEventListener('click', () => onItemClickCallback(item.id, effectiveMediaType));

        const img = document.createElement('img');
        img.src = `${App.Constants.IMAGE_BASE_URL}${item.poster_path}`;
        img.alt = item.title || item.name;
        img.className = 'w-full h-auto object-cover aspect-[2/3]';
        img.onerror = () => {
            img.src = `https://placehold.co/500x750/101010/581c87?text=Indispon%C3%ADvel`;
            img.alt = 'Imagem Indisponível';
        };

        const infoDiv = document.createElement('div');
        infoDiv.className = 'p-3 flex flex-col flex-grow';

        const titleEl = document.createElement('h3');
        titleEl.className = 'text-md font-semibold text-violet-300 truncate mb-1';
        titleEl.textContent = item.title || item.name;
        titleEl.title = item.title || item.name;

        const dateText = item.release_date || item.first_air_date;
        const dateEl = document.createElement('p');
        dateEl.className = 'text-xs text-gray-500';
        dateEl.textContent = dateText ? new Date(dateText).getFullYear() : 'Ano N/A';

        infoDiv.appendChild(titleEl);
        infoDiv.appendChild(dateEl);
        card.appendChild(img);
        card.appendChild(infoDiv);
        if (App.UI.elements.resultsGrid) App.UI.elements.resultsGrid.appendChild(card);
    });
};

App.UI.embedderPlugin = (type, imdb, season, episode, targetContainerId = 'EmbedderIframeContainer') => {
    var frameContainer = document.getElementById(targetContainerId);
    if (!frameContainer) {
        console.error(`Elemento '${targetContainerId}' não encontrado.`);
        if (targetContainerId === 'EmbedderIframeContainer') App.UI.state.currentItemModalEmbedderUrl = '';
        else if (targetContainerId === 'EpisodeEmbedderIframeContainer') App.UI.state.currentEpisodeEmbedderUrl = '';
        return;
    }
    frameContainer.innerHTML = ''; // Clear previous content

    let seasonPath = "", episodePath = "";
    if (type === "serie") {
        if (season) seasonPath = "/" + season;
        if (episode) episodePath = "/" + episode;
    }
    var ref = document.referrer || window.location.origin;
    const embedUrl = `https://embedder.net/e/${imdb}${seasonPath}${episodePath}?ref=${encodeURIComponent(ref)}`;

    if (targetContainerId === 'EmbedderIframeContainer') App.UI.state.currentItemModalEmbedderUrl = embedUrl;
    else if (targetContainerId === 'EpisodeEmbedderIframeContainer') App.UI.state.currentEpisodeEmbedderUrl = embedUrl;

    const iframe = document.createElement('iframe');
    iframe.src = embedUrl;
    iframe.setAttribute('scrolling', 'no');
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('allowfullscreen', '');
    iframe.setAttribute('webkitallowfullscreen', '');
    iframe.setAttribute('mozallowfullscreen', '');
    iframe.style.width = '100%';
    iframe.style.height = '450px';
    iframe.style.borderRadius = '0.75rem';
    iframe.style.backgroundColor = '#000';
    frameContainer.appendChild(iframe);
};

// Funções para definir o estado do modal
App.UI.setItemModalOpen = (isOpen) => {
    App.UI.state.isItemModalOpen = isOpen;
    if (isOpen) {
        if (App.UI.elements.itemModal) App.UI.elements.itemModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    } else {
        if (App.UI.elements.itemModal) App.UI.elements.itemModal.style.display = 'none';
        if (App.UI.elements.modalBody) App.UI.elements.modalBody.innerHTML = '';
        document.body.style.overflow = 'auto';
    }
};

App.UI.setEpisodeModalOpen = (isOpen) => {
    App.UI.state.isEpisodeModalOpen = isOpen;
    if (isOpen) {
        if (App.UI.elements.episodePlayerModal) App.UI.elements.episodePlayerModal.style.display = 'flex';
        if(App.UI.state.isItemModalOpen && App.UI.elements.itemModal) App.UI.elements.itemModal.style.zIndex = '900'; // Diminui o z-index do modal principal
    } else {
        if (App.UI.elements.episodePlayerModal) App.UI.elements.episodePlayerModal.style.display = 'none';
        const episodeIframeContainer = document.getElementById('EpisodeEmbedderIframeContainer');
        if (episodeIframeContainer) episodeIframeContainer.innerHTML = '';
        if(App.UI.state.isItemModalOpen && App.UI.elements.itemModal) App.UI.elements.itemModal.style.zIndex = '1000'; // Restaura o z-index do modal principal
    }
};

// Função para iniciar a exibição de resultados
App.UI.initDisplay = async (endpoint, title, activeBtn, baseParams = {}, pages = 2) => {
    if (App.UI.elements.currentViewTitleEl) App.UI.elements.currentViewTitleEl.textContent = title;
    App.UI.setActiveButton(activeBtn);
    if (App.UI.elements.loader) App.UI.elements.loader.classList.remove('hidden');
    if (App.UI.elements.resultsGrid) App.UI.elements.resultsGrid.innerHTML = '';
    if (App.UI.elements.noResultsMessage) App.UI.elements.noResultsMessage.classList.add('hidden');

    try {
        // Chamada para a função em App.API
        const data = await App.API.fetchMultiplePages(endpoint, baseParams, pages);
        // Passa a função de clique do card para displayResults
        App.UI.displayResults(data?.results || [], title, App.ModalHandlers.fetchItemDetails);
    } catch (error) {
        if (App.UI.elements.currentViewTitleEl) App.UI.elements.currentViewTitleEl.textContent = "Erro ao Carregar Dados";
        if (App.UI.elements.noResultsMessage) {
            App.UI.elements.noResultsMessage.textContent = "Não foi possível carregar. Tente novamente.";
            App.UI.elements.noResultsMessage.classList.remove('hidden');
        }
        App.UI.displayResults([], title, App.ModalHandlers.fetchItemDetails);
    } finally {
        if (App.UI.elements.loader) App.UI.elements.loader.classList.add('hidden');
    }
};
