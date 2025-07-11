// Referências dos elementos HTML
const randomMovieButton = document.getElementById('randomMovieButton');
const randomTvButton = document.getElementById('randomTvButton');
const historyButton = document.getElementById('historyButton');
const pickAgainButton = document.getElementById('pickAgainButton');

// Variáveis de estado
// A variável 'pickedMediaHistory' agora é GLOBAL e gerenciada por 'catalogo.js'
let lastPickedMediaType = null;

/**
 * Verifica se um item já está no histórico de sorteio.
 * @param {object} item - O objeto de mídia do TMDB.
 * @returns {boolean} - True se o item estiver no histórico.
 */
function isItemInPickedHistory(item) {
    // Garante que a variável global 'pickedMediaHistory' exista
    if (typeof pickedMediaHistory === 'undefined') {
        console.warn("A variável 'pickedMediaHistory' ainda não foi definida.");
        return false;
    }
    const itemType = item.media_type || lastPickedMediaType;
    return pickedMediaHistory.some(h => h.id === item.id && h.type === itemType);
}

/**
 * Adiciona um item sorteado ao histórico de sorteio (agora usando o sistema centralizado).
 * @param {object} item - O objeto de mídia do TMDB.
 */
function addToPickedHistory(item) {
    // Verifica se as variáveis e funções globais de 'catalogo.js' estão disponíveis
    if (typeof pickedMediaHistory === 'undefined' || typeof MAX_RAFFLE_HISTORY_SIZE === 'undefined') {
        console.error("O estado do histórico de sorteio não foi inicializado a partir de catalogo.js");
        Swal.fire({ icon: 'error', title: 'Erro de Script', text: 'Não foi possível salvar o histórico.' });
        return;
    }

    const historyItem = {
        id: item.id,
        type: item.media_type || lastPickedMediaType,
        title: item.title || item.name || 'Título Desconhecido',
        backdrop_path: item.backdrop_path,
        timestamp: new Date().toISOString()
    };
    
    // Filtra o item se ele já existir para movê-lo para o topo
    pickedMediaHistory = pickedMediaHistory.filter(h => h.id !== historyItem.id || h.type !== historyItem.type);
    
    // Adiciona o novo item no início
    pickedMediaHistory.unshift(historyItem);

    // Garante que o histórico não exceda o tamanho máximo
    if (pickedMediaHistory.length > MAX_RAFFLE_HISTORY_SIZE) {
        pickedMediaHistory.pop(); // Remove o item mais antigo do final
    }
    
    // Usa a função centralizada de 'catalogo.js' para salvar tudo
    if (typeof saveAllUserData === 'function') {
        saveAllUserData();
    } else {
        console.error("A função saveAllUserData não foi encontrada. O histórico de sorteio não pôde ser salvo no Firebase.");
    }
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
                params.without_genres = '10764,10767'; // Excluir Reality e Talk Show
            }

            const data = await fetchTMDB(endpoint, params);

            if (data && data.results?.length > 0) {
                // Filtra itens sem sinopse ou que já estão no histórico
                const availableItems = data.results.filter(i => i.overview && !isItemInPickedHistory(i));
                if (availableItems.length > 0) {
                    randomItem = availableItems[Math.floor(Math.random() * availableItems.length)];
                }
            }
            attempts++;
        }

        if (randomItem) {
            addToPickedHistory(randomItem);
            // O terceiro argumento 'true' indica que a chamada vem do sorteio
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
    if (typeof pickedMediaHistory === 'undefined' || pickedMediaHistory.length === 0) {
        Swal.fire({ title: 'Histórico de Sorteio', text: 'Você ainda não sorteou nenhuma mídia.', showCloseButton: true, showConfirmButton: false });
        return;
    }
    // O histórico já é mantido ordenado pelo 'catalogo.js'
    const sorted = pickedMediaHistory;
    
    let html = '<div style="max-height: 400px; overflow-y: auto; padding-right: 10px;"><ul style="list-style: none; padding: 0; text-align: left;">';
    sorted.forEach(i => {
        html += `<li style="padding: 10px; border-bottom: 1px solid #333; cursor: pointer; display: flex; align-items: center; gap: 10px;" onclick="Swal.close(); openItemModal(${i.id}, '${i.type}', '${i.backdrop_path}')">
                    <img src="${i.backdrop_path ? TMDB_IMAGE_BASE_URL + 'w92' + i.backdrop_path : 'https://placehold.co/92x52/1a1a2a/FFF?text=Capa'}" style="width: 92px; height: 52px; object-fit: cover; border-radius: 4px;" alt="Poster">
                    <div>
                        <strong>${i.title}</strong> (${i.type === 'movie' ? 'Filme' : 'Série'})<br>
                        <small style="color: #9CA3AF;">Sorteado em: ${new Date(i.timestamp).toLocaleString('pt-BR')}</small>
                    </div>
                 </li>`;
    });
    html += '</ul></div>';

    Swal.fire({ 
        title: 'Histórico de Sorteio', 
        html, 
        showCloseButton: true, 
        showConfirmButton: false,
        width: '500px',
        customClass: { popup: 'swal-history-popup' }
    });
}

// --- Event Listeners ---
// Adiciona os listeners apenas se os botões existirem no DOM
if (randomMovieButton) {
    randomMovieButton.addEventListener('click', () => pickRandomMedia('movie'));
}
if (randomTvButton) {
    randomTvButton.addEventListener('click', () => pickRandomMedia('tv'));
}
if (historyButton) {
    historyButton.addEventListener('click', showPickedHistoryModal);
}
if (pickAgainButton) {
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
}

// A função 'loadPickedHistoryFromLocalStorage' e o seu event listener 'DOMContentLoaded' foram removidos.
// O carregamento agora é feito automaticamente pelo 'onAuthStateChanged' em 'catalogo.js'.
