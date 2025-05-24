// Dependências: constants.js

// Referências a elementos do DOM
const searchInput = document.getElementById('searchInput');
const resultsGrid = document.getElementById('resultsGrid');
const itemModal = document.getElementById('itemModal');
const modalBody = document.getElementById('modalBody');
const closeModalButton = document.getElementById('closeModalButton');

const episodePlayerModal = document.getElementById('episodePlayerModal');
const closeEpisodeModalButton = document.getElementById('closeEpisodeModalButton');
const episodePlayerTitleEl = document.getElementById('episodePlayerTitle');
const copyEpisodeLinkBtn = document.getElementById('copyEpisodeLinkBtn');
const loader = document.getElementById('loader');
const noResultsMessage = document.getElementById('noResults');
const currentViewTitleEl = document.getElementById('currentViewTitle');

const btnExplore = document.getElementById('btnExplore');
const btnMovies = document.getElementById('btnMovies');
const btnSeries = document.getElementById('btnSeries');
const categoryButtons = [btnExplore, btnMovies, btnSeries];

// Variáveis de estado da UI
let currentItemModalEmbedderUrl = '';
let currentEpisodeEmbedderUrl = '';
let isItemModalOpen = false;
let isEpisodeModalOpen = false;

// Funções de manipulação do DOM e UI
function showToast(message) {
    const existingToast = document.querySelector('.toast-message');
    if (existingToast) existingToast.remove();
    const toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function setActiveButton(activeBtn) {
    categoryButtons.forEach(btn => btn.classList.remove('active'));
    if (activeBtn) activeBtn.classList.add('active');
}

function displayResults(items, operationTitle) {
    if (resultsGrid) resultsGrid.innerHTML = '';
    const validItems = items ? items.filter(item => item.poster_path) : [];

    if (noResultsMessage) {
        if (validItems.length === 0) {
            if (operationTitle && operationTitle.toLowerCase().startsWith("resultados da busca por:")) {
                const searchTermMatch = operationTitle.match(/Resultados da Busca por: "([^"]*)"/);
                const searchTerm = searchTermMatch ? searchTermMatch[1] : searchInput.value.trim();
                noResultsMessage.textContent = `Nenhum resultado encontrado para "${searchTerm}".`;
            } else {
                noResultsMessage.textContent = "Nenhum item encontrado nesta categoria.";
            }
            noResultsMessage.classList.remove('hidden');
            return;
        }
        noResultsMessage.classList.add('hidden');
    }

    validItems.forEach(item => {
        const effectiveMediaType = item.media_type || (item.title ? 'movie' : 'tv');
        const card = document.createElement('div');
        card.className = 'item-card rounded-lg shadow-lg cursor-pointer overflow-hidden flex flex-col';
        card.addEventListener('click', () => fetchItemDetails(item.id, effectiveMediaType)); // Chama uma função do main.js

        const img = document.createElement('img');
        img.src = `${IMAGE_BASE_URL}${item.poster_path}`;
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
        if (resultsGrid) resultsGrid.appendChild(card);
    });
}

function embedderPlugin(type, imdb, season, episode, targetContainerId = 'EmbedderIframeContainer') {
    var frameContainer = document.getElementById(targetContainerId);
    if (!frameContainer) {
        console.error(`Elemento '${targetContainerId}' não encontrado.`);
        if (targetContainerId === 'EmbedderIframeContainer') currentItemModalEmbedderUrl = '';
        else if (targetContainerId === 'EpisodeEmbedderIframeContainer') currentEpisodeEmbedderUrl = '';
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

    if (targetContainerId === 'EmbedderIframeContainer') currentItemModalEmbedderUrl = embedUrl;
    else if (targetContainerId === 'EpisodeEmbedderIframeContainer') currentEpisodeEmbedderUrl = embedUrl;

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
}

// Funções para definir o estado do modal
function setItemModalOpen(isOpen) {
    isItemModalOpen = isOpen;
    if (isOpen) {
        if (itemModal) itemModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    } else {
        if (itemModal) itemModal.style.display = 'none';
        if (modalBody) modalBody.innerHTML = '';
        document.body.style.overflow = 'auto';
    }
}

function setEpisodeModalOpen(isOpen) {
    isEpisodeModalOpen = isOpen;
    if (isOpen) {
        if (episodePlayerModal) episodePlayerModal.style.display = 'flex';
        if(isItemModalOpen && itemModal) itemModal.style.zIndex = '900'; // Diminui o z-index do modal principal
    } else {
        if (episodePlayerModal) episodePlayerModal.style.display = 'none';
        const episodeIframeContainer = document.getElementById('EpisodeEmbedderIframeContainer');
        if (episodeIframeContainer) episodeIframeContainer.innerHTML = '';
        if(isItemModalOpen && itemModal) itemModal.style.zIndex = '1000'; // Restaura o z-index do modal principal
    }
}
