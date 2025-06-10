const randomMovieButton = document.getElementById('randomMovieButton');
const randomTvButton = document.getElementById('randomTvButton');
const modalActionButtonsContainer = document.getElementById('externalCopyButtonContainer');
const pickAgainButton = document.getElementById('pickAgainButton');
const externalCopyLinkButton = document.getElementById('externalCopyLinkButton');
const trailerButton = document.getElementById('trailerButton');

let pickedMediaHistory = [];
const MAX_HISTORY_SIZE = 10; 
let lastPickedMediaType = null; 
let currentModalItemId = null;
let currentModalItemType = null;
let currentExternalCopyUrl = null; // Certifique-se de que esta variável é atualizada globalmente quando o modal é aberto

/**
 * Verifica se um item já está no histórico de sorteios recentes.
 * @param {Object} item - O item a ser verificado. Deve conter `id` e `media_type`.
 * @returns {boolean} - True se o item está no histórico, false caso contrário.
 */
function isItemInHistory(item) {
    return pickedMediaHistory.some(historyItem => 
        historyItem.id === item.id && historyItem.type === item.media_type
    );
}

/**
 * Adiciona um item ao histórico de sorteios, removendo os mais antigos se o histórico exceder o tamanho máximo.
 * @param {Object} item - O item a ser adicionado ao histórico. Deve conter `id` e `media_type`.
 */
function addToHistory(item) {
    pickedMediaHistory.push({ id: item.id, type: item.media_type });
    if (pickedMediaHistory.length > MAX_HISTORY_SIZE) {
        pickedMediaHistory.shift(); // Remove o item mais antigo
    }
}

/**
 * Função principal para sortear um filme ou série aleatoriamente.
 * @param {string} type - O tipo de mídia a ser sorteado ('movie' ou 'tv').
 */
async function pickRandomMedia(type) {
    // Verifica se as funções essenciais dos scripts do catálogo estão disponíveis globalmente
    // showLoader, hideLoader, fetchTMDB, openItemModal, TMDB_API_KEY
    if (typeof showLoader !== 'function' || typeof hideLoader !== 'function' ||
        typeof fetchTMDB !== 'function' || typeof openItemModal !== 'function' ||
        typeof TMDB_API_KEY === 'undefined') {
        console.error("Erro: Funções ou constantes essenciais do catálogo não carregadas globalmente.");
        Swal.fire({
            icon: 'error',
            title: 'Erro!',
            text: 'Não foi possível carregar a funcionalidade de sorteio. Verifique se os scripts do catálogo estão acessíveis e carregados corretamente, e se a TMDB_API_KEY está definida.',
            background: 'var(--card-bg)',
            color: 'var(--text-primary)'
        });
        return;
    }

    modalActionButtonsContainer.style.display = 'none';
    lastPickedMediaType = null; 
    currentModalItemId = null;
    currentModalItemType = null;
    currentExternalCopyUrl = null;

    showLoader();
    try {
        const endpoint = type === 'movie' ? '/movie/popular' : '/tv/top_rated';
        let randomItem = null;
        let attempts = 0;
        const MAX_ATTEMPTS = 10; // Tenta buscar um item não repetido até 10 vezes

        while (randomItem === null && attempts < MAX_ATTEMPTS) {
            const randomPage = Math.floor(Math.random() * 5) + 1; // Busca entre as primeiras 5 páginas populares/top_rated
            const data = await fetchTMDB(endpoint, { page: randomPage });

            if (data && !data.error && data.results && data.results.length > 0) {
                const availableItems = data.results.filter(item => !isItemInHistory(item));

                if (availableItems.length > 0) {
                    const randomIndex = Math.floor(Math.random() * availableItems.length);
                    randomItem = availableItems[randomIndex];
                } else {
                    attempts++; // Incrementa tentativas se todos os itens na página já estiverem no histórico
                }
            } else {
                throw new Error(`Falha ao buscar ${type === 'movie' ? 'filmes' : 'séries'} populares.`);
            }
        }

        if (randomItem) {
            addToHistory(randomItem);
            lastPickedMediaType = type; 
            currentModalItemId = randomItem.id;
            currentModalItemType = type;
            
            // Assume que `openItemModal` é responsável por definir `currentExternalCopyUrl`
            // ou que ele será definido logo após o retorno de openItemModal para garantir que o link esteja pronto.
            openItemModal(randomItem.id, type, randomItem.backdrop_path);
            
        } else {
            Swal.fire({
                icon: 'warning',
                title: 'Oops!',
                text: `Não foi possível sortear um(a) ${type === 'movie' ? 'filme' : 'série'} não repetido(a) no momento. Tente novamente!`,
                background: 'var(--card-bg)',
                color: 'var(--text-primary)'
            });
        }
    } catch (error) {
        console.error("Erro ao sortear item:", error);
        Swal.fire({
            icon: 'error',
            title: 'Erro!',
            text: `Ocorreu um erro ao sortear o item: ${error.message}`,
            background: 'var(--card-bg)',
            color: 'var(--text-primary)'
        });
    } finally {
        hideLoader();
    }
}

// Adiciona listeners aos botões de sorteio principais
randomMovieButton.addEventListener('click', () => pickRandomMedia('movie'));
randomTvButton.addEventListener('click', () => pickRandomMedia('tv'));

// Listener para o botão "Sortear Novamente" no rodapé
pickAgainButton.addEventListener('click', () => {
    if (typeof Swal !== 'undefined') Swal.close();
    if (lastPickedMediaType) {
        pickRandomMedia(lastPickedMediaType);
    } else {
        console.warn("Nenhum tipo de mídia anterior para sortear novamente.");
    }
});

// Listener para o botão "Copiar Link"
externalCopyLinkButton.addEventListener('click', () => {
    if (typeof copyToClipboard === 'function' && typeof currentExternalCopyUrl !== 'undefined' && currentExternalCopyUrl) {
        copyToClipboard(currentExternalCopyUrl, false);
    } else {
        console.warn("Função copyToClipboard ou URL não disponíveis.");
        Swal.fire({
            toast: true, position: 'top-end', icon: 'warning',
            title: 'Nenhum link para copiar!', showConfirmButton: false, timer: 2500,
            background: 'var(--card-bg)', color: 'var(--text-primary)', iconColor: 'var(--text-secondary)'
        });
    }
});

// Listener para o botão "Trailer"
trailerButton.addEventListener('click', async () => {
    if (!currentModalItemId || !currentModalItemType) {
        console.warn("Nenhum item selecionado para buscar trailer.");
        Swal.fire({
            toast: true, position: 'top-end', icon: 'warning',
            title: 'Nenhum item selecionado!', showConfirmButton: false, timer: 2500,
            background: 'var(--card-bg)', color: 'var(--text-primary)', iconColor: 'var(--text-secondary)'
        });
        return;
    }

    showLoader();
    try {
        const details = await fetchTMDB(`/${currentModalItemType}/${currentModalItemId}`, { append_to_response: 'videos' });

        if (details && !details.error && details.videos && details.videos.results.length > 0) {
            const trailer = details.videos.results.find(video => video.type === 'Trailer' && video.site === 'YouTube') ||
                            details.videos.results.find(video => video.site === 'YouTube');

            if (trailer) {
                const trailerUrl = `https://www.youtube.com/watch?v=${trailer.key}`;
                window.open(trailerUrl, '_blank');
            } else {
                Swal.fire({
                    icon: 'info',
                    title: 'Trailer não encontrado!',
                    text: 'Nenhum trailer disponível no YouTube para este item.',
                    background: 'var(--card-bg)',
                    color: 'var(--text-primary)'
                });
            }
        } else {
            Swal.fire({
                icon: 'info',
                title: 'Trailer não encontrado!',
                text: 'Nenhum trailer disponível para este item ou falha na busca.',
                background: 'var(--card-bg)',
                color: 'var(--text-primary)'
            });
        }
    } catch (error) {
        console.error("Erro ao buscar trailer:", error);
        Swal.fire({
            icon: 'error',
            title: 'Erro!',
            text: `Ocorreu um erro ao buscar o trailer: ${error.message}`,
            background: 'var(--card-bg)',
            color: 'var(--text-primary)'
        });
    } finally {
        hideLoader();
    }
});


// --- Inicialização do Backdrop ---
document.addEventListener('DOMContentLoaded', () => {
    // Verifica se as funções globais de background do catálogo existem
    // startMainPageBackdropSlideshow, fetchPopularMovies, fetchTopRatedTvSeries, shuffleArray, mainPageBackdropPaths
    if (typeof startMainPageBackdropSlideshow === 'function' && typeof fetchPopularMovies === 'function' &&
        typeof fetchTopRatedTvSeries === 'function' && typeof shuffleArray === 'function' &&
        typeof mainPageBackdropPaths !== 'undefined') {

        async function initializeRandomBackdrop() {
            console.log("LOG: Tentando inicializar o backdrop dinâmico...");
            const moviesBackdrops = await fetchPopularMovies();
            const seriesBackdrops = await fetchTopRatedTvSeries();
            
            // Concatena e filtra apenas os backdrops válidos
            mainPageBackdropPaths = [...moviesBackdrops.filter(b => b), ...seriesBackdrops.filter(b => b)];
            
            if (mainPageBackdropPaths.length > 0) {
                shuffleArray(mainPageBackdropPaths);
                startMainPageBackdropSlideshow();
                console.log("LOG: Backdrop dinâmico iniciado com sucesso.");
            } else {
                console.warn("Nenhum backdrop válido encontrado para o slideshow. Verifique a chave da API do TMDB ou a conexão.");
                const pageBackdrop = document.getElementById('pageBackdrop');
                if(pageBackdrop) {
                    // Fallback para uma imagem de fundo sólida preta
                    pageBackdrop.style.backgroundImage = `url('https://placehold.co/1920x1080/000000/000000')`; 
                    pageBackdrop.style.opacity = '1';
                }
            }
        }
        initializeRandomBackdrop();

    } else {
        console.error("Erro: Funções globais para o backdrop não carregadas do catálogo. O backdrop dinâmico NÃO funcionará.");
        const pageBackdrop = document.getElementById('pageBackdrop');
        if(pageBackdrop) {
            // Fallback para uma imagem de fundo sólida preta se as funções do catálogo não estiverem disponíveis
            pageBackdrop.style.backgroundImage = `url('https://placehold.co/1920x1080/000000/000000')`; 
            pageBackdrop.style.opacity = '1';
        }
    }
});

