
// Referências dos elementos HTML
const randomMovieButton = document.getElementById('randomMovieButton');
const randomTvButton = document.getElementById('randomTvButton');
const historyButton = document.getElementById('historyButton');
const modalActionButtonsContainer = document.getElementById('externalCopyButtonContainer');
const pickAgainButton = document.getElementById('pickAgainButton');
const externalCopyLinkButton = document.getElementById('externalCopyLinkButton');
const trailerButton = document.getElementById('trailerButton');
const pageBackdrop = document.getElementById('pageBackdrop');

let pickedMediaHistory = [];
const MAX_HISTORY_SIZE = 40;
let lastPickedMediaType = null;
let currentModalItemId = null;
let currentModalItemType = null;
let currentExternalCopyUrl = null;
let currentBackdropPath = null;

function saveHistoryToLocalStorage() {
    try {
        localStorage.setItem('pickedMediaHistory', JSON.stringify(pickedMediaHistory));
    } catch (e) {
        console.error('Erro ao salvar histórico:', e);
    }
}

function loadHistoryFromLocalStorage() {
    try {
        const stored = localStorage.getItem('pickedMediaHistory');
        if (stored) {
            pickedMediaHistory = JSON.parse(stored).slice(-MAX_HISTORY_SIZE);
        }
    } catch (e) {
        console.error('Erro ao carregar histórico:', e);
        localStorage.removeItem('pickedMediaHistory');
        pickedMediaHistory = [];
    }
}

function isItemInHistory(item) {
    return pickedMediaHistory.some(h => h.id === item.id && h.type === item.media_type);
}

function addToHistory(item) {
    const historyItem = {
        id: item.id,
        type: item.media_type,
        title: item.title || item.name || 'Título Desconhecido',
        backdrop_path: item.backdrop_path,
        timestamp: new Date().toISOString()
    };
    pickedMediaHistory.push(historyItem);
    if (pickedMediaHistory.length > MAX_HISTORY_SIZE) pickedMediaHistory.shift();
    saveHistoryToLocalStorage();
}

async function pickRandomMedia(type) {
    if (typeof showLoader !== 'function' || typeof hideLoader !== 'function' ||
        typeof fetchTMDB !== 'function' || typeof openItemModal !== 'function' ||
        typeof TMDB_API_KEY === 'undefined') {
        Swal.fire({ icon: 'error', title: 'Erro!', text: 'Funções essenciais não carregadas.' });
        return;
    }

    modalActionButtonsContainer.style.display = 'none';
    lastPickedMediaType = null;
    currentModalItemId = null;
    currentModalItemType = null;
    currentExternalCopyUrl = null;
    currentBackdropPath = null;

    showLoader();
    try {
        const endpoint = type === 'movie' ? '/discover/movie' : '/discover/tv';
        const totalPages = 500;
        let randomItem = null;
        let attempts = 0;
        const MAX_ATTEMPTS = 30;

        while (!randomItem && attempts < MAX_ATTEMPTS) {
            const randomPage = Math.floor(Math.random() * totalPages) + 1;
            const filters = type === 'tv' ? { page: randomPage, with_genres: '', without_genres: '10764,10767' } : { page: randomPage };
            const data = await fetchTMDB(endpoint, filters);

            if (data && data.results?.length > 0) {
                const available = data.results.filter(i => !isItemInHistory(i) && i.overview && i.overview.trim() !== '');
                if (available.length > 0) {
                    randomItem = available[Math.floor(Math.random() * available.length)];
                }
            }
            attempts++;
        }

        if (randomItem) {
            addToHistory(randomItem);
            lastPickedMediaType = type;
            currentModalItemId = randomItem.id;
            currentModalItemType = type;
            currentBackdropPath = randomItem.backdrop_path;
            currentExternalCopyUrl = `https://www.themoviedb.org/${type}/${randomItem.id}`;
            openItemModal(randomItem.id, type, randomItem.backdrop_path);
        } else {
            Swal.fire({ icon: 'warning', title: 'Oops!', text: `Não foi possível sortear um(a) ${type === 'movie' ? 'filme' : 'série'} novo(a).` });
        }
    } catch (error) {
        Swal.fire({ icon: 'error', title: 'Erro!', text: error.message });
    } finally {
        hideLoader();
    }
}

randomMovieButton.addEventListener('click', () => pickRandomMedia('movie'));
randomTvButton.addEventListener('click', () => pickRandomMedia('tv'));
historyButton.addEventListener('click', () => {
    const sorted = [...pickedMediaHistory].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    let html = '<ul>';
    sorted.forEach(i => {
        html += `<li><strong>${i.title}</strong> (${i.type})<br><small>${new Date(i.timestamp).toLocaleString('pt-BR')}</small></li>`;
    });
    html += '</ul>';
    Swal.fire({ title: 'Histórico', html, showCloseButton: true, showConfirmButton: false });
});

pickAgainButton.addEventListener('click', () => {
    if (Swal) Swal.close();
    if (lastPickedMediaType) pickRandomMedia(lastPickedMediaType);
});

externalCopyLinkButton.addEventListener('click', () => {
    if (typeof copyToClipboard === 'function' && currentExternalCopyUrl) {
        copyToClipboard(currentExternalCopyUrl, false);
    } else {
        Swal.fire({ toast: true, icon: 'warning', title: 'Nenhum link para copiar!', timer: 2000 });
    }
});

document.addEventListener('DOMContentLoaded', loadHistoryFromLocalStorage);
