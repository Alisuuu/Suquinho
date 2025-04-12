const API_KEY = '5e5da432e96174227b25086fe8637985';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w185';
const POSTER_BG_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const YOUTUBE_EMBED_URL = 'https://www.youtube.com/embed/'; // URL correta para iframe

const popularMoviesList = document.getElementById('popularMoviesList');
const topRatedMoviesList = document.getElementById('topRatedMoviesList');
const popularSeriesList = document.getElementById('popularSeriesList');
const topRatedSeriesList = document.getElementById('topRatedSeriesList');
const searchInput = document.getElementById('searchInput');
const searchResultsSection = document.getElementById('searchResultsSection');
const searchResultsList = document.getElementById('searchResultsList');
const originalSections = [
    document.getElementById('popularMoviesSection'),
    document.getElementById('topRatedMoviesSection'),
    document.getElementById('popularSeriesSection'),
    document.getElementById('topRatedSeriesSection')
];
const body = document.body;

let popularMovies = [];
let topRatedMovies = [];
let popularSeries = [];
let topRatedSeries = [];
let searchResults = [];
let searchTerm = '';
let debounceTimer;
let currentModal = null;

function createModal(item, detailsData, genresHTML, castListHTML, watchProvidersHTML, trailerHTML) {
    const modal = document.createElement('div');
    modal.id = 'customModal';
    modal.className = 'custom-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-button" onclick="closeModal()">×</span>
            <div class="modal-header">
                <img src="${getItemPoster(item).replace('w342', 'w500')}" alt="${getItemTitle(item)}" class="modal-poster">
                <h2 class="modal-title">${getItemTitle(item)}</h2>
            </div>
            <div class="modal-body">
                <p><strong>Sinopse:</strong> ${detailsData.overview || 'Sinopse não disponível.'}</p>
                ${detailsData.release_date ? `<p><strong>Data de Lançamento:</strong> ${new Date(detailsData.release_date).toLocaleDateString()}</p>` : ''}
                ${detailsData.first_air_date ? `<p><strong>Data de Lançamento:</strong> ${new Date(detailsData.first_air_date).toLocaleDateString()}</p>` : ''}
                ${genresHTML ? `<p><strong>Gênero:</strong> ${genresHTML}</p>` : ''}
                ${watchProvidersHTML ? `<h3>Onde Assistir (Brasil)</h3><div class="watch-providers">${watchProvidersHTML}</div>` : '<p>Informações sobre onde assistir não disponíveis.</p>'}
                ${castListHTML ? `<h3>Elenco Principal</h3><div class="cast-list">${castListHTML}</div>` : ''}
                ${trailerHTML ? `<h3>Trailer</h3><div class="trailer-container">${trailerHTML}</div>` : ''}
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    return modal;
}

function openModal() {
    if (currentModal) {
        currentModal.style.display = 'block';
        body.classList.add('modal-open');
    }
}

function closeModal() {
    if (currentModal) {
        currentModal.style.display = 'none';
        body.classList.remove('modal-open');
        document.body.removeChild(currentModal);
        currentModal = null;
        body.classList.remove('has-backdrop');
        document.documentElement.style.removeProperty('--backdrop-url');
    }
}

async function fetchData(url, categoryName) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Erro ao buscar dados de ${categoryName}: ${response.status}`);
        const data = await response.json();
        const results = data.results;
        switch (categoryName) {
            case 'popularMovies':
                popularMovies = results.map(item => ({ ...item, media_type: 'movie' }));
                renderItems(popularMovies, popularMoviesList);
                break;
            case 'topRatedMovies':
                topRatedMovies = results.map(item => ({ ...item, media_type: 'movie' }));
                renderItems(topRatedMovies, topRatedMoviesList);
                break;
            case 'popularSeries':
                popularSeries = results.map(item => ({ ...item, media_type: 'tv' }));
                renderItems(popularSeries, popularSeriesList);
                break;
            case 'topRatedSeries':
                topRatedSeries = results.map(item => ({ ...item, media_type: 'tv' }));
                renderItems(topRatedSeries, topRatedSeriesList);
                break;
        }
    } catch (error) {
        console.error(`Erro ao buscar dados de ${categoryName}:`, error);
    }
}

function getItemTitle(item) {
    return item.title || item.name;
}

function getItemPoster(item) {
    return item.poster_path ? `${IMAGE_BASE_URL.replace('w185', 'w342')}${item.poster_path}` : './p2.png';
}

function renderItems(items, container) {
    container.innerHTML = '';
    items.forEach(item => {
        const listItem = document.createElement('li');
        listItem.className = 'item-card';
        listItem.onclick = () => showDetails(item);

        let releaseDate = '';
        if (item.media_type === 'movie' && item.release_date) {
            releaseDate = new Date(item.release_date).toLocaleDateString();
        } else if (item.media_type === 'tv' && item.first_air_date) {
            releaseDate = new Date(item.first_air_date).toLocaleDateString();
        }

        listItem.innerHTML = `
            <img src="${getItemPoster(item)}" alt="${getItemTitle(item)}" class="item-poster">
            <div class="item-info">
                <h2 class="item-title">${getItemTitle(item)}</h2>
                ${item.media_type ? `<span class="media-type ${item.media_type}">${item.media_type === 'movie' ? 'Filme' : 'Série'}</span>` : ''}
                ${releaseDate ? `<p class="release-date">${releaseDate}</p>` : ''}
            </div>
        `;
        container.appendChild(listItem);
    });
}

async function fetchSearchedItems() {
    if (searchTerm) {
        try {
            const response = await fetch(`${BASE_URL}/search/multi?api_key=${API_KEY}&language=pt-BR&query=${searchTerm}`);
            if (response.ok) {
                const data = await response.json();
                searchResults = data.results;
                searchResults = searchResults.map(item => {
                    if (item.media_type === 'movie' && item.release_date) {
                        item.release_date_formatted = new Date(item.release_date).toLocaleDateString();
                    } else if (item.media_type === 'tv' && item.first_air_date) {
                        item.first_air_date_formatted = new Date(item.first_air_date).toLocaleDateString();
                    }
                    return item;
                });
                renderItems(searchResults, searchResultsList);
                searchResultsSection.style.display = 'block';
                originalSections.forEach(section => section.style.display = 'none');
            } else {
                console.error("Erro na busca:", response.status);
            }
        } catch (error) {
            console.error("Erro na busca:", error);
        }
    } else {
        searchResults = [];
        searchResultsSection.style.display = 'none';
        originalSections.forEach(section => section.style.display = 'block');
        fetchData(`${BASE_URL}/movie/popular?api_key=${API_KEY}&language=pt-BR`, 'popularMovies');
        fetchData(`${BASE_URL}/movie/top_rated?api_key=${API_KEY}&language=pt-BR`, 'topRatedMovies');
        fetchData(`${BASE_URL}/tv/popular?api_key=${API_KEY}&language=pt-BR`, 'popularSeries');
        fetchData(`${BASE_URL}/tv/top_rated?api_key=${API_KEY}&language=pt-BR`, 'topRatedSeries');
    }
}

searchInput.addEventListener('input', (event) => {
    searchTerm = event.target.value;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(fetchSearchedItems, 300);
});

async function fetchTrailer(itemId, mediaType) {
    try {
        const response = await fetch(`${BASE_URL}/${mediaType}/${itemId}/videos?api_key=${API_KEY}&language=pt-BR`);
        if (response.ok) {
            const data = await response.json();
            const trailer = data.results.find(video => video.type.toLowerCase() === 'trailer' && video.site.toLowerCase() === 'youtube');
            if (trailer) {
                return `<iframe width="100%" height="315" src="${YOUTUBE_EMBED_URL}${trailer.key}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
            }
        }
        return null;
    } catch (error) {
        console.error("Erro ao buscar trailer:", error);
        return null;
    }
}

async function showDetails(item) {
    const itemId = item.id;
    const itemType = item.media_type === 'movie' ? 'movie' : 'tv';

    try {
        const detailsResponse = await fetch(`${BASE_URL}/${itemType}/${itemId}?api_key=${API_KEY}&language=pt-BR`);
        if (!detailsResponse.ok) throw new Error(`Erro ao buscar detalhes: ${detailsResponse.status}`);
        const detailsData = await detailsResponse.json();

        if (detailsData.backdrop_path) {
            body.classList.add('has-backdrop');
            document.documentElement.style.setProperty('--backdrop-url', `url(${POSTER_BG_BASE_URL}${detailsData.backdrop_path})`);
        } else {
            body.classList.remove('has-backdrop');
            document.documentElement.style.removeProperty('--backdrop-url');
        }

        const genresHTML = detailsData.genres ? detailsData.genres.map(genre => genre.name).join(', ') : '';

        const creditsResponse = await fetch(`${BASE_URL}/${itemType}/${itemId}/credits?api_key=${API_KEY}&language=pt-BR`);
        const creditsData = creditsResponse.ok ? await creditsResponse.json() : { cast: [] };
        const castListHTML = creditsData.cast.slice(0, 5).map(actor => `
            <div class="actor-card">
                <img src="${actor.profile_path ? IMAGE_BASE_URL.replace('w185', 'w185') + actor.profile_path : './p2.png'}" alt="${actor.name}">
                <div class="actor-name">${actor.name}</div>
            </div>
        `).join('');

        const watchProvidersResponse = await fetch(`${BASE_URL}/${itemType}/${itemId}/watch/providers?api_key=${API_KEY}`);
        const watchProvidersData = watchProvidersResponse.ok ? await watchProvidersResponse.json() : { results: {} };
        const providersBR = watchProvidersData.results?.BR || {};
        let watchProvidersHTML = '';
        if (providersBR.flatrate) {
            watchProvidersHTML += `<p><strong>Streaming:</strong> ${providersBR.flatrate.map(p => p.provider_name).join(', ')}</p>`;
        }
        if (providersBR.buy) {
            watchProvidersHTML += `<p><strong>Comprar:</strong> ${providersBR.buy.map(p => p.provider_name).join(', ')}</p>`;
        }
        if (providersBR.rent) {
            watchProvidersHTML += `<p><strong>Alugar:</strong> ${providersBR.rent.map(p => p.provider_name).join(', ')}</p>`;
        }
        if (!providersBR.flatrate && !providersBR.buy && !providersBR.rent) {
            watchProvidersHTML += '<p>Nenhuma informação de streaming ou compra disponível para o Brasil.</p>';
        }

        const trailerHTML = await fetchTrailer(itemId, itemType);

        currentModal = createModal(item, detailsData, genresHTML, castListHTML, watchProvidersHTML, trailerHTML);
        openModal();

    } catch (error) {
        console.error("Erro ao carregar detalhes:", error);
        // You might want to display a simple error message on the page instead of an alert
    }
}

// Event listener to close modal when clicking outside
window.addEventListener('click', (event) => {
    if (event.target === currentModal) {
        closeModal();
    }
});

// Initial data fetching
fetchData(`${BASE_URL}/movie/popular?api_key=${API_KEY}&language=pt-BR`, 'popularMovies');
fetchData(`${BASE_URL}/movie/top_rated?api_key=${API_KEY}&language=pt-BR`, 'topRatedMovies');
fetchData(`${BASE_URL}/tv/popular?api_key=${API_KEY}&language=pt-BR`, 'popularSeries');
fetchData(`${BASE_URL}/tv/top_rated?api_key=${API_KEY}&language=pt-BR`, 'topRatedSeries');
