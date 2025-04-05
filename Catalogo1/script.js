const API_KEY = '5e5da432e96174227b25086fe8637985';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w185';
const POSTER_BG_BASE_URL = 'https://image.tmdb.org/t/p/w500';

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

let popularMovies = [];
let topRatedMovies = [];
let popularSeries = [];
let topRatedSeries = [];
let searchResults = [];
let searchTerm = '';
let debounceTimer;

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
                popularSeries = results;
                renderItems(popularSeries, popularSeriesList);
                break;
            case 'topRatedSeries':
                topRatedSeries = results;
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
    return item.poster_path ? `${IMAGE_BASE_URL.replace('w185', 'w342')}${item.poster_path}` : 'placeholder_image_url';
}

function renderItems(items, container) {
    container.innerHTML = '';
    items.forEach(item => {
        const listItem = document.createElement('li');
        listItem.className = 'item-card';
        listItem.onclick = () => showDetails(item);
        listItem.innerHTML = `
            <img src="${getItemPoster(item)}" alt="${getItemTitle(item)}" class="item-poster">
            <div class="item-info">
                <h2 class="item-title">${getItemTitle(item)}</h2>
                ${item.media_type ? `<span class="media-type ${item.media_type}">${item.media_type === 'movie' ? 'Filme' : 'Série'}</span>` : ''}
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

async function showDetails(item) {
    const itemId = item.id;
    const itemType = item.media_type === 'movie' ? 'movie' : 'tv';
    const body = document.body;

    try {
        const detailsResponse = await fetch(`${BASE_URL}/${itemType}/${itemId}?api_key=${API_KEY}&language=pt-BR`);
        if (!detailsResponse.ok) throw new Error(`Erro ao buscar detalhes: ${detailsResponse.status}`);
        const detailsData = await detailsResponse.json();

        // Define o backdrop como fundo da página usando ::before
        if (detailsData.backdrop_path) {
            body.classList.add('has-backdrop');
            document.documentElement.style.setProperty('--backdrop-url', `url(${POSTER_BG_BASE_URL}${detailsData.backdrop_path})`);
        } else {
            body.classList.remove('has-backdrop');
            document.documentElement.style.removeProperty('--backdrop-url');
        }

        const creditsResponse = await fetch(`${BASE_URL}/${itemType}/${itemId}/credits?api_key=${API_KEY}&language=pt-BR`);
        const creditsData = creditsResponse.ok ? await creditsResponse.json() : { cast: [] };
        const castList = creditsData.cast.map(actor => `
            <div style="display: inline-block; margin-right: 15px; width: 100px; text-align: center;">
                <img src="${actor.profile_path ? IMAGE_BASE_URL.replace('w185', 'w185') + actor.profile_path : './p2.png'}" alt="${actor.name}" style="width: 70px; height: 70px; border-radius: 50%; object-fit: cover; margin-bottom: 5px;">
                <div style="font-size: 0.9em;">${actor.name}</div>
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

        Swal.fire({
            title: getItemTitle(item),
            html: `
                <div style="padding: 20px; border-radius: 10px; color: #f0f0f0;">
                    <p><strong>Sinopse:</strong> ${detailsData.overview || 'Sinopse não disponível.'}</p>
                    ${castList ? `<h3>Elenco Principal</h3><div style="overflow-x: auto; white-space: nowrap; padding-bottom: 10px;">${castList}</div>` : ''}
                    ${watchProvidersHTML ? `<h3>Onde Assistir (Brasil)</h3>${watchProvidersHTML}` : '<p>Informações sobre onde assistir não disponíveis.</p>'}
                </div>
            `,
            imageUrl: getItemPoster(item),
            imageAlt: getItemTitle(item),
            imageHeight: '300px',
            showCloseButton: true,
            confirmButtonText: 'Fechar',
            confirmButtonColor: '#5e35b1',
            customClass: {
                popup: 'swal2-popup-custom'
            }
        });

    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Erro',
            text: `Falha ao carregar detalhes: ${error.message}`,
            confirmButtonColor: '#d33'
        });
    }
}

// Initial data fetching
fetchData(`${BASE_URL}/movie/popular?api_key=${API_KEY}&language=pt-BR`, 'popularMovies');
fetchData(`${BASE_URL}/movie/top_rated?api_key=${API_KEY}&language=pt-BR`, 'topRatedMovies');
fetchData(`${BASE_URL}/tv/popular?api_key=${API_KEY}&language=pt-BR`, 'popularSeries');
fetchData(`${BASE_URL}/tv/top_rated?api_key=${API_KEY}&language=pt-BR`, 'topRatedSeries');
