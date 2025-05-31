// --- Script 3: Utility Functions, Event Listeners, Initialization ---
// --- Utility Functions ---
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
            setTimeout(() => {
                if (pageBackdrop.style.opacity === '0') {
                    pageBackdrop.style.backgroundImage = '';
                }
            }, 700);
        }
    }
}

function displayResults(items, defaultMediaType = null, targetGridElement) {
    if (!targetGridElement) {
        console.error("Elemento target para displayResults não encontrado no DOM.");
        return;
    }
    targetGridElement.innerHTML = '';
    let displayedCount = 0;

    if (!items || items.length === 0) {
        targetGridElement.innerHTML = `<p class="text-center col-span-full text-[var(--text-secondary)] py-10 text-lg">Nenhum item para exibir.</p>`;
        return;
    }

    items.forEach(item => {
        const mediaType = item.media_type || defaultMediaType;
        // Validação básica do item (mantida)
        if (!mediaType || (mediaType !== 'movie' && mediaType !== 'tv') || !item.poster_path) {
            console.warn("Item inválido ou sem poster_path, pulando:", item);
            return; // Pula este item se não for filme/tv ou não tiver pôster
        }

        // const originalLanguage = item.original_language ? item.original_language.toLowerCase() : ''; // Não é mais usado para bloqueio aqui

        // NENHUM BLOQUEIO EXPLÍCITO POR IDIOMA OU PAÍS AQUI, CONFORME SOLICITADO
        // if (ASIAN_LANGUAGES_TO_BLOCK.includes(originalLanguage)) {
        //     console.log(`Item bloqueado (idioma asiático): ${item.title || item.name}, Idioma: ${originalLanguage}`);
        //     return;
        // }

        const card = document.createElement('div');
        card.className = 'content-card shadow-lg group';
        card.onclick = () => openItemModal(item.id, mediaType, item.backdrop_path);
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.setAttribute('aria-label', `Ver detalhes de ${item.title || item.name || 'Conteúdo sem título'}`);
        card.onkeydown = (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                openItemModal(item.id, mediaType, item.backdrop_path);
            }
        };

        const img = document.createElement('img');
        img.src = `${TMDB_IMAGE_BASE_URL}w780${item.poster_path}`;
        img.alt = `Pôster de ${item.title || item.name || 'Conteúdo sem título'}`;
        img.loading = 'lazy';
        img.onerror = function() {
            this.src = `https://placehold.co/780x1170/0A0514/F0F0F0?text=Indispon%C3%ADvel&font=inter`;
            this.alt = 'Imagem indisponível';
            this.onerror = null;
        };

        const titleOverlay = document.createElement('div');
        titleOverlay.className = 'title-overlay';

        const titleDiv = document.createElement('div');
        titleDiv.className = 'title';
        titleDiv.textContent = item.title || item.name || "Título não disponível";

        titleOverlay.appendChild(titleDiv);
        card.appendChild(img);
        card.appendChild(titleOverlay);
        targetGridElement.appendChild(card);
        displayedCount++;
    });

    // Se nenhum item foi exibido após percorrer todos (devido a filtros internos como falta de poster_path)
    if (displayedCount === 0 && items.length > 0) {
         targetGridElement.innerHTML = `<p class="text-center col-span-full text-[var(--text-secondary)] py-10 text-lg">Nenhum item válido para exibir após as validações.</p>`;
    } else if (displayedCount === 0) { // Este caso cobre items.length === 0 ou se, por algum motivo raro, displayedCount for 0.
         targetGridElement.innerHTML = `<p class="text-center col-span-full text-[var(--text-secondary)] py-10 text-lg">Nenhum item para exibir.</p>`;
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
        if (typeof Swal !== 'undefined') {
            Swal.fire({ toast: true, position: 'top-end', icon: 'warning', title: warningTitle, showConfirmButton: false, timer: 2500, background: 'var(--card-bg)', color: 'var(--text-primary)', iconColor: 'var(--text-secondary)'});
        }
        return;
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(textToCopy).then(() => {
            console.log("[copyToClipboard] navigator.clipboard.writeText sucesso.");
            if (typeof Swal !== 'undefined') {
                Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: successTitle, showConfirmButton: false, timer: 1500, background: 'var(--card-bg)', color: 'var(--text-primary)', timerProgressBar: true, iconColor: 'var(--success-green)' });
            }
        }).catch(errN => {
            console.error('[copyToClipboard] Erro ao usar navigator.clipboard.writeText:', errN, 'Tentando fallback para document.execCommand.');
            legacyCopyToClipboard(textToCopy, successTitle, errorTitle);
        });
    } else {
        console.warn("[copyToClipboard] navigator.clipboard.writeText não está disponível. Tentando fallback para document.execCommand.");
        legacyCopyToClipboard(textToCopy, successTitle, errorTitle);
    }
}

function legacyCopyToClipboard(textToCopy, successTitle, errorTitle) {
    const tempTextArea = document.createElement("textarea");
    tempTextArea.value = textToCopy;
    tempTextArea.style.position = "absolute";
    tempTextArea.style.left = "-9999px";
    tempTextArea.style.top = "0";
    document.body.appendChild(tempTextArea);
    tempTextArea.select();
    tempTextArea.setSelectionRange(0, 99999);

    let success = false;
    try {
        success = document.execCommand('copy');
        console.log("[legacyCopyToClipboard] document.execCommand('copy') sucesso:", success);
    } catch (err) {
        console.error("[legacyCopyToClipboard] Erro ao usar document.execCommand('copy'):", err);
    }
    document.body.removeChild(tempTextArea);

    if (typeof Swal !== 'undefined') {
        const swalProps = { toast: true, position: 'top-end', showConfirmButton: false, timer: 1500, background: 'var(--card-bg)', color: 'var(--text-primary)', timerProgressBar: true };
        if (success) {
            Swal.fire({ ...swalProps, icon: 'success', title: successTitle, iconColor: 'var(--success-green)' });
        } else {
            Swal.fire({ ...swalProps, icon: 'error', title: errorTitle, timer:2000, iconColor: 'var(--danger-red)' });
        }
    }
}


// --- Event Listeners ---
if (searchInput) {
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            if (searchInput.value !== undefined) {
                 performSearch(searchInput.value);
            }
        }, 500);
    });
} else {
    console.warn("Elemento searchInput não encontrado no DOM. Funcionalidade de busca por input desabilitada.");
}

if (searchButton) {
    searchButton.addEventListener('click', () => {
        clearTimeout(searchTimeout);
        if (searchInput && searchInput.value !== undefined) {
            performSearch(searchInput.value);
        } else if (searchInput) {
            performSearch('');
        } else {
            console.warn("Elemento searchInput não encontrado para executar busca a partir do botão.");
        }
    });
} else {
    console.warn("Elemento searchButton não encontrado no DOM. Funcionalidade de busca por botão desabilitada.");
}

if (filterToggleButton) {
    filterToggleButton.addEventListener('click', openFilterSweetAlert);
} else {
    console.warn("Elemento filterToggleButton não encontrado no DOM. Funcionalidade de filtro desabilitada.");
}

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        if (typeof Swal !== 'undefined' && Swal.isVisible()) {
            Swal.close();
        }
    }
});

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded event fired. Iniciando aplicação.");

    const apiKeyIsValid = TMDB_API_KEY && TMDB_API_KEY !== 'SUA_CHAVE_API_DO_TMDB_AQUI' && TMDB_API_KEY.length > 10;

    if (!apiKeyIsValid) {
         console.error("Chave da API TMDB inválida ou não configurada. A aplicação pode não funcionar.");
         const errorMsgHtml = `<p class="text-center text-red-400 p-4 col-span-full">Chave da API TMDB inválida ou não configurada. Verifique a constante TMDB_API_KEY no script.</p>`;
         if(moviesResultsGrid) moviesResultsGrid.innerHTML = errorMsgHtml;
         if(tvShowsResultsGrid) tvShowsResultsGrid.innerHTML = errorMsgHtml;
         if(singleResultsGrid) singleResultsGrid.innerHTML = errorMsgHtml;

         if(searchInput) searchInput.disabled = true;
         if(searchButton) searchButton.disabled = true;
         if(filterToggleButton) filterToggleButton.disabled = true;
         if(loader) loader.style.display = 'none';

         const header = document.querySelector('header');
         const errorDiv = document.createElement('div');
         errorDiv.innerHTML = `<div style="background-color: #B91C1C; color: white; text-align: center; padding: 0.75rem; font-weight: bold;">ERRO DE CONFIGURAÇÃO: A chave da API TMDB é necessária. O aplicativo não funcionará corretamente.</div>`;
         if(header && header.parentNode) {
            header.parentNode.insertBefore(errorDiv, header.nextSibling);
         } else {
            document.body.insertBefore(errorDiv, document.body.firstChild);
         }
         return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const typeParam = urlParams.get('type');
    const idParam = urlParams.get('id');

    if (typeParam && idParam && (typeParam === 'movie' || typeParam === 'tv')) {
        console.log(`Link direto detectado: type=${typeParam}, id=${idParam}. Abrindo modal.`);
        if(defaultContentSections) defaultContentSections.style.display = 'none';
        if(singleResultsSection) singleResultsSection.style.display = 'none';

        if(moviesResultsGrid) moviesResultsGrid.innerHTML = '';
        if(tvShowsResultsGrid) tvShowsResultsGrid.innerHTML = '';
        if(singleResultsGrid) singleResultsGrid.innerHTML = '';

        if(loader) loader.style.display = 'none';

        openItemModal(idParam, typeParam, null);
    } else {
        console.log("Nenhum link direto válido detectado. Carregando conteúdo principal da página.");
        loadMainPageContent();
    }
});