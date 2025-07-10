// Referências dos elementos HTML
const randomMovieButton = document.getElementById('randomMovieButton');
const randomTvButton = document.getElementById('randomTvButton');
const historyButton = document.getElementById('historyButton');
const pickAgainButton = document.getElementById('pickAgainButton');

// Variáveis de estado para o histórico de SORTEIO
let pickedMediaHistory = [];
const MAX_HISTORY_SIZE = 40;
let lastPickedMediaType = null;

/**
 * Salva o histórico de mídias sorteadas no LocalStorage.
 */
function savePickedHistoryToLocalStorage() {
    try {
        // Usando uma chave diferente para não conflitar com o histórico de exibição
        localStorage.setItem('pickedMediaHistory_v2', JSON.stringify(pickedMediaHistory));
    } catch (e) {
        console.error('Erro ao salvar histórico de sorteio:', e);
    }
}

/**
 * Carrega o histórico de mídias sorteadas do LocalStorage ao iniciar.
 */
function loadPickedHistoryFromLocalStorage() {
    try {
        const stored = localStorage.getItem('pickedMediaHistory_v2');
        if (stored) {
            pickedMediaHistory = JSON.parse(stored).slice(-MAX_HISTORY_SIZE);
        }
    } catch (e) {
        console.error('Erro ao carregar histórico de sorteio:', e);
        localStorage.removeItem('pickedMediaHistory_v2');
        pickedMediaHistory = [];
    }
}

/**
 * Verifica se um item já está no histórico de sorteio.
 * @param {object} item - O objeto de mídia do TMDB.
 * @returns {boolean} - True se o item estiver no histórico.
 */
function isItemInPickedHistory(item) {
    const itemType = item.media_type || lastPickedMediaType;
    return pickedMediaHistory.some(h => h.id === item.id && h.type === itemType);
}

/**
 * Adiciona um item sorteado ao histórico de sorteio.
 * @param {object} item - O objeto de mídia do TMDB.
 */
function addToPickedHistory(item) {
    const historyItem = {
        id: item.id,
        type: item.media_type || lastPickedMediaType,
        title: item.title || item.name || 'Título Desconhecido',
        backdrop_path: item.backdrop_path,
        timestamp: new Date().toISOString()
    };
    
    pickedMediaHistory = pickedMediaHistory.filter(h => h.id !== historyItem.id || h.type !== historyItem.type);
    pickedMediaHistory.push(historyItem);

    if (pickedMediaHistory.length > MAX_HISTORY_SIZE) {
        pickedMediaHistory.shift();
    }
    savePickedHistoryToLocalStorage();
}

/**
 * Sorteia uma mídia (filme ou série) aleatoriamente.
 * @param {string} type - 'movie' ou 'tv'.
 */
async function pickRandomMedia(type) {
    // Verifica se as funções essenciais do catálogo estão disponíveis
    if (typeof showLoader !== 'function' || typeof fetchTMDB !== 'function' || typeof openItemModal !== 'function') {
        Swal.fire({ icon: 'error', title: 'Erro de Carregamento', text: 'Os scripts do catálogo não foram carregados.' });
        return;
    }
    
    lastPickedMediaType = type;
    showLoader();

    try {
        const endpoint = type === 'movie' ? '/discover/movie' : '/discover/tv';
        const totalPagesToConsider = 200; 
        let randomItem = null;
        let attempts = 0;
        const MAX_ATTEMPTS = 15;

        while (!randomItem && attempts < MAX_ATTEMPTS) {
            const randomPage = Math.floor(Math.random() * totalPagesToConsider) + 1;
            const params = { 
                page: randomPage,
                "vote_count.gte": 100,
                "sort_by": "popularity.desc"
            };
            if (type === 'tv') {
                params.without_genres = '10764,10767';
            }

            const data = await fetchTMDB(endpoint, params);

            if (data && data.results?.length > 0) {
                const availableItems = data.results.filter(i => !isItemInPickedHistory(i) && i.overview);
                if (availableItems.length > 0) {
                    randomItem = availableItems[Math.floor(Math.random() * availableItems.length)];
                }
            }
            attempts++;
        }

        if (randomItem) {
            addToPickedHistory(randomItem);
            // Abre o modal do catálogo, mas NÃO adiciona ao histórico de exibição ainda.
            // O histórico de exibição só é atualizado quando o usuário clica em "play".
            openItemModal(randomItem.id, type, randomItem.backdrop_path, true);
        } else {
            Swal.fire({ 
                icon: 'warning', 
                title: 'Nenhum item novo encontrado!', 
                text: `Não foi possível sortear um(a) ${type === 'movie' ? 'filme' : 'série'} novo(a) no momento. Tente novamente.` 
            });
        }
    } catch (error) {
        console.error('Erro ao sortear mídia:', error);
        Swal.fire({ icon: 'error', title: 'Erro de Conexão', text: 'Não foi possível se comunicar com a API.' });
    } finally {
        hideLoader();
    }
}

/**
 * Exibe o histórico de mídias SORTEADAS.
 */
function showPickedHistoryModal() {
    if (pickedMediaHistory.length === 0) {
        Swal.fire({ title: 'Histórico de Sorteio', text: 'Você ainda não sorteou nenhuma mídia.', showCloseButton: true, showConfirmButton: false });
        return;
    }
    const sorted = [...pickedMediaHistory].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    let html = '<div style="max-height: 300px; overflow-y: auto; padding-right: 10px;"><ul style="list-style: none; padding: 0; text-align: left;">';
    sorted.forEach(i => {
        html += `<li style="padding: 10px; border-bottom: 1px solid #333; cursor: pointer;" onclick="Swal.close(); openItemModal(${i.id}, '${i.type}', '${i.backdrop_path}')">
                    <strong>${i.title}</strong> (${i.type === 'movie' ? 'Filme' : 'Série'})<br>
                    <small style="color: #9CA3AF;">Sorteado em: ${new Date(i.timestamp).toLocaleString('pt-BR')}</small>
                 </li>`;
    });
    html += '</ul></div>';

    Swal.fire({ 
        title: 'Histórico de Sorteio', 
        html, 
        showCloseButton: true, 
        showConfirmButton: false,
        width: '850px',
        customClass: { popup: 'swal-history-popup' }
    });
}

// --- Event Listeners ---
randomMovieButton.addEventListener('click', () => pickRandomMedia('movie'));
randomTvButton.addEventListener('click', () => pickRandomMedia('tv'));
historyButton.addEventListener('click', showPickedHistoryModal);

pickAgainButton.addEventListener('click', () => {
    if (Swal.isVisible()) {
        Swal.close();
        setTimeout(() => {
            if (lastPickedMediaType) {
                pickRandomMedia(lastPickedMediaType);
            }
        }, 250); 
    } else {
         if (lastPickedMediaType) {
            pickRandomMedia(lastPickedMediaType);
        }
    }
});

// Carrega o histórico de SORTEIO quando a página é carregada
document.addEventListener('DOMContentLoaded', loadPickedHistoryFromLocalStorage);
