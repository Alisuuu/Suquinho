// --- Funções Utilitárias ---
function showLoader() {
    if(loader) loader.style.display = 'block';
}

function hideLoader() {
    if(loader) loader.style.display = 'none';
}

function updatePageBackground(backdropPath) {
    if (pageBackdrop) {
        if (backdropPath) {
            pageBackdrop.style.backgroundImage = `url(${TMDB_BACKDROP_BASE_URL}${backdropPath})`;
            pageBackdrop.style.opacity = '1';
        } else {
            pageBackdrop.style.opacity = '0';
            // Aguarda a transição de opacidade terminar antes de limpar o backgroundImage
            // para evitar que a imagem antiga pisque durante o fade out.
            setTimeout(() => {
                if (pageBackdrop.style.opacity === '0') {
                    pageBackdrop.style.backgroundImage = '';
                }
            }, 700); // Duração da transição de opacidade em ms (deve corresponder ao CSS)
        }
    }
}

function displayResults(items, defaultMediaType = null, targetGridElement) {
    if (!targetGridElement) {
        console.error("Elemento target para displayResults não encontrado.");
        return;
    }
    targetGridElement.innerHTML = ''; // Limpa o grid antes de adicionar novos itens.
    let displayedCount = 0;

    if (!items || items.length === 0) {
        targetGridElement.innerHTML = `<p class="text-center col-span-full text-[var(--text-secondary)] py-10 text-lg">Nenhum item para exibir.</p>`;
        return;
    }

    items.forEach(item => {
        const mediaType = item.media_type || defaultMediaType;
        // Garante que o item seja um filme ou série e tenha um poster.
        if (!mediaType || (mediaType !== 'movie' && mediaType !== 'tv') || !item.poster_path) {
            return; // Pula este item se não atender aos critérios.
        }

        // LÓGICA DE BLOQUEIO DE PAÍS REMOVIDA DAQUI

        const card = document.createElement('div');
        card.className = 'content-card shadow-lg group'; // Classes para estilização do card.
        // Define a ação de clique para abrir o modal de detalhes.
        card.onclick = () => openItemModal(item.id, mediaType, item.backdrop_path);
        card.setAttribute('role', 'button'); // Define o papel do elemento para acessibilidade.
        card.setAttribute('tabindex', '0'); // Permite que o card seja focado via teclado.
        card.setAttribute('aria-label', `Ver detalhes de ${item.title || item.name}`); // Rótulo para leitores de tela.

        const img = document.createElement('img');
        img.src = `${TMDB_IMAGE_BASE_URL}w780${item.poster_path}`; // URL da imagem do poster.
        img.alt = `Pôster de ${item.title || item.name}`; // Texto alternativo para a imagem.
        img.loading = 'lazy'; // Habilita o carregamento preguiçoso da imagem.
        // Define uma imagem placeholder em caso de erro ao carregar a imagem original.
        img.onerror = () => {
            img.src = `https://placehold.co/780x1170/0A0514/F0F0F0?text=Indispon%C3%ADvel&font=inter`;
            img.alt = 'Imagem indisponível';
        };

        const titleOverlay = document.createElement('div');
        titleOverlay.className = 'title-overlay'; // Overlay para exibir o título sobre a imagem.

        const titleDiv = document.createElement('div');
        titleDiv.className = 'title';
        titleDiv.textContent = item.title || item.name; // Título do filme ou série.

        titleOverlay.appendChild(titleDiv);
        card.appendChild(img);
        card.appendChild(titleOverlay);
        targetGridElement.appendChild(card); // Adiciona o card ao grid.
        displayedCount++;
    });

    // Se nenhum item foi exibido após o loop (por exemplo, se todos foram pulados por outros motivos),
    // mostra uma mensagem apropriada.
    if (displayedCount === 0) {
         targetGridElement.innerHTML = `<p class="text-center col-span-full text-[var(--text-secondary)] py-10 text-lg">Nenhum item para exibir após a filtragem.</p>`;
    }
}

function copyToClipboard(textToCopy, isPlayerLink = false) {
    console.log("[copyToClipboard] Iniciada. Tentando copiar:", textToCopy, "É link do player?", isPlayerLink);

    const linkType = isPlayerLink ? "do player" : "da página";
    const warningTitle = `Nenhum link ${linkType} disponível para copiar.`;
    const successTitle = `Link ${linkType} copiado!`;
    const errorTitle = `Falha ao copiar link ${linkType}!`;

    if (!textToCopy) {
         console.warn("[copyToClipboard] Texto para copiar está vazio ou nulo.");
         // Exibe uma notificação toast de aviso.
         Swal.fire({ toast: true, position: 'top-end', icon: 'warning', title: warningTitle, showConfirmButton: false, timer: 2500, background: 'var(--card-bg)', color: 'var(--text-primary)', iconColor: 'var(--text-secondary)'});
        return;
    }
    // Cria uma área de texto temporária para realizar a cópia.
    const tempTextArea = document.createElement("textarea");
    tempTextArea.value = textToCopy;
    tempTextArea.style.position = "absolute"; tempTextArea.style.left = "-9999px"; // Posiciona fora da tela.
    document.body.appendChild(tempTextArea);
    tempTextArea.select(); // Seleciona o conteúdo.
    tempTextArea.setSelectionRange(0, 99999); // Para compatibilidade com dispositivos móveis.

    let success = false;
    try {
        // Tenta copiar usando o método legacy document.execCommand.
        success = document.execCommand('copy');
        console.log("[copyToClipboard] document.execCommand('copy') sucesso:", success);
    } catch (err) {
        console.error("[copyToClipboard] Erro ao usar document.execCommand('copy'):", err);
    }
    document.body.removeChild(tempTextArea); // Remove a área de texto temporária.

    // Propriedades comuns para as notificações toast do Swal.
    const swalProps = { toast: true, position: 'top-end', showConfirmButton: false, timer: 1500, background: 'var(--card-bg)', color: 'var(--text-primary)', timerProgressBar: true };

    if (success) {
        Swal.fire({ ...swalProps, icon: 'success', title: successTitle, iconColor: 'var(--success-green)' });
    } else {
        // Se document.execCommand falhar, tenta a API Clipboard (mais moderna).
        console.log("[copyToClipboard] document.execCommand falhou. Tentando navigator.clipboard.");
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(textToCopy).then(() => {
                console.log("[copyToClipboard] navigator.clipboard.writeText sucesso.");
                Swal.fire({ ...swalProps, icon: 'success', title: successTitle, iconColor: 'var(--success-green)' });
            }).catch(errN => {
                console.error('[copyToClipboard] Erro ao usar navigator.clipboard.writeText:', errN);
                Swal.fire({ ...swalProps, icon: 'error', title: errorTitle, timer:2000, iconColor: 'var(--danger-red)' });
            });
        } else {
             // Se ambas as abordagens falharem.
             console.warn("[copyToClipboard] navigator.clipboard.writeText não está disponível.");
             Swal.fire({ ...swalProps, icon: 'error', title: errorTitle, timer:2000, iconColor: 'var(--danger-red)' });
        }
    }
}

// --- Event Listeners ---
if (searchInput) {
    // Adiciona um listener para o evento 'input' no campo de busca.
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout); // Limpa o timeout anterior para evitar múltiplas buscas.
        // Define um timeout para realizar a busca após um pequeno atraso (debounce).
        searchTimeout = setTimeout(() => {
            performSearch(searchInput.value);
        }, 500); // 500ms de atraso.
    });
} else {
    console.error("Elemento searchInput não encontrado.");
}

if (searchButton) {
    // Adiciona um listener para o evento 'click' no botão de busca.
    searchButton.addEventListener('click', () => {
        clearTimeout(searchTimeout); // Limpa qualquer timeout de busca pendente.
        if (searchInput) {
            performSearch(searchInput.value); // Realiza a busca imediatamente.
        } else {
            console.error("Elemento searchInput não encontrado para executar busca.");
        }
    });
} else {
    console.error("Elemento searchButton não encontrado.");
}

if (filterToggleButton) {
    // Adiciona um listener para o evento 'click' no botão de alternar filtro.
    filterToggleButton.addEventListener('click', openFilterSweetAlert);
} else {
    console.error("Elemento filterToggleButton não encontrado.");
}

// Adiciona um listener global para a tecla 'Escape' para fechar modais do SweetAlert.
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        if (Swal.isVisible()) {
            Swal.close();
        }
    }
});

// --- Inicialização ---
// Adiciona um listener para o evento 'DOMContentLoaded' que é disparado quando o HTML inicial é completamente carregado e parseado.
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded event fired.");
    const urlParams = new URLSearchParams(window.location.search); // Obtém os parâmetros da URL.
    const typeParam = urlParams.get('type');
    const idParam = urlParams.get('id');

    // Verifica se a chave da API TMDB é válida.
    const apiKeyIsValid = TMDB_API_KEY && TMDB_API_KEY !== 'SUA_CHAVE_API_DO_TMDB_AQUI' && TMDB_API_KEY.length > 10;

    if (!apiKeyIsValid) {
         console.error("Chave da API TMDB inválida ou não configurada.");
         const errorMsg = `<p class="text-center text-red-400 p-4 col-span-full">Chave da API TMDB inválida ou não configurada. Verifique a constante TMDB_API_KEY no script.</p>`;
         // Exibe mensagens de erro e desabilita funcionalidades se a chave for inválida.
         if(moviesResultsGrid) moviesResultsGrid.innerHTML = errorMsg;
         if(tvShowsResultsGrid) tvShowsResultsGrid.innerHTML = errorMsg;
         if(searchInput) searchInput.disabled = true;
         if(searchButton) searchButton.disabled = true;
         if(filterToggleButton) filterToggleButton.disabled = true;
         if(loader) loader.style.display = 'none';

         // Adiciona uma mensagem de erro proeminente no topo da página.
         const header = document.querySelector('header');
         const errorDiv = document.createElement('div');
         errorDiv.innerHTML = `<div class="bg-red-700 text-white text-center p-3"><strong>ERRO DE CONFIGURAÇÃO:</strong> A chave da API TMDB é necessária. O aplicativo não funcionará corretamente.</div>`;
         if(header && header.parentNode) header.parentNode.insertBefore(errorDiv, header.nextSibling);
         return; // Interrompe a inicialização.
    }

    // Se houver parâmetros 'type' e 'id' na URL (deep linking), abre o modal do item diretamente.
    if (typeParam && idParam) {
        console.log(`Link direto detectado: type=${typeParam}, id=${idParam}. Escondendo seções principais e abrindo modal.`);
        if(defaultContentSections) defaultContentSections.style.display = 'none';
        if(singleResultsSection) singleResultsSection.style.display = 'none';

        // Limpa os grids para não mostrar conteúdo antigo por baixo do modal.
        if(moviesResultsGrid) moviesResultsGrid.innerHTML = '';
        if(tvShowsResultsGrid) tvShowsResultsGrid.innerHTML = '';
        if(singleResultsGrid) singleResultsGrid.innerHTML = '';

        if(loader) loader.style.display = 'none'; // Garante que o loader não fique visível.

        openItemModal(idParam, typeParam, null); // Abre o modal com os dados do link.
    } else {
        // Caso contrário, carrega o conteúdo principal da página.
        console.log("Nenhum link direto detectado. Carregando conteúdo principal da página.");
        loadMainPageContent();
    }
});

