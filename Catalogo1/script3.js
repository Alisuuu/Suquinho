// --- Script 3: Utility Functions, Event Listeners, Initialization ---

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function showLoader() { if(loader) loader.style.display = 'block'; }
function hideLoader() { if(loader) loader.style.display = 'none'; }

function updatePageBackground(backdropPath) {
    if (pageBackdrop) {
        if (backdropPath) {
            const currentBgImage = pageBackdrop.style.backgroundImage;
            const newBgImage = `url(${TMDB_BACKDROP_BASE_URL}${backdropPath})`;
            if (currentBgImage !== newBgImage || pageBackdrop.style.opacity === '0') {
                pageBackdrop.style.backgroundImage = newBgImage;
            }
            pageBackdrop.style.opacity = '1';
        } else { 
            pageBackdrop.style.opacity = '0';
            setTimeout(() => {
                const popup = Swal.getPopup();
                const isDetailsModalVisible = Swal.isVisible() && popup && popup.classList.contains('swal-details-popup');
                if (pageBackdrop.style.opacity === '0' && !isDetailsModalVisible) {
                    pageBackdrop.style.backgroundImage = '';
                }
            }, 700); 
        }
    }
}

function displayResults(items, defaultMediaType = null, targetGridElement, replace = true) {
    if (!targetGridElement) { console.error("Elemento target para displayResults não encontrado."); return; }
    if (replace) targetGridElement.innerHTML = '';
    let displayedCountThisCall = 0;
    if (!items || items.length === 0) {
        if (replace && targetGridElement.innerHTML === '') targetGridElement.innerHTML = `<p class="text-center col-span-full text-[var(--text-secondary)] py-10 text-lg">Nenhum item para exibir.</p>`;
        return;
    }
    items.forEach(item => {
        const mediaType = item.media_type || defaultMediaType;
        if (!mediaType || (mediaType !== 'movie' && mediaType !== 'tv') || !item.poster_path) { return; }
        const card = document.createElement('div'); card.className = 'content-card shadow-lg group';
        card.onclick = () => openItemModal(item.id, mediaType, item.backdrop_path);
        card.setAttribute('role', 'button'); card.setAttribute('tabindex', '0'); card.setAttribute('aria-label', `Ver detalhes de ${item.title || item.name || 'Conteúdo sem título'}`);
        card.onkeydown = (event) => { if (event.key === 'Enter' || event.key === ' ') openItemModal(item.id, mediaType, item.backdrop_path); };
        const img = document.createElement('img'); img.src = `${TMDB_IMAGE_BASE_URL}w780${item.poster_path}`; img.alt = `Pôster de ${item.title || item.name || 'Conteúdo sem título'}`; img.loading = 'lazy';
        img.onerror = function() { this.src = `https://placehold.co/780x1170/0A0514/F0F0F0?text=Indispon%C3%ADvel&font=inter`; this.alt = 'Imagem indisponível'; this.onerror = null; };
        const titleOverlay = document.createElement('div'); titleOverlay.className = 'title-overlay';
        const titleDiv = document.createElement('div'); titleDiv.className = 'title'; titleDiv.textContent = item.title || item.name || "Título não disponível";
        titleOverlay.appendChild(titleDiv); card.appendChild(img); card.appendChild(titleOverlay); targetGridElement.appendChild(card);
        displayedCountThisCall++;
    });
    if (replace && displayedCountThisCall === 0 && items.length > 0) {
         targetGridElement.innerHTML = `<p class="text-center col-span-full text-[var(--text-secondary)] py-10 text-lg">Nenhum item válido para exibir após as validações.</p>`;
    }
}

function copyToClipboard(textToCopy, isPlayerLink = false) {
    const linkType = isPlayerLink ? "do player" : "da página";
    const warningTitle = `Nenhum link ${linkType} disponível para copiar.`; const successTitle = `Link ${linkType} copiado!`; const errorTitle = `Falha ao copiar link ${linkType}!`;
    if (!textToCopy) { if (typeof Swal !== 'undefined') Swal.fire({ toast: true, position: 'top-end', icon: 'warning', title: warningTitle, showConfirmButton: false, timer: 2500, background: 'var(--card-bg)', color: 'var(--text-primary)', iconColor: 'var(--text-secondary)'}); return; }
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(textToCopy)
            .then(() => { if (typeof Swal !== 'undefined') Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: successTitle, showConfirmButton: false, timer: 1500, background: 'var(--card-bg)', color: 'var(--text-primary)', timerProgressBar: true, iconColor: 'var(--success-green)' }); })
            .catch(errN => legacyCopyToClipboard(textToCopy, successTitle, errorTitle));
    } else legacyCopyToClipboard(textToCopy, successTitle, errorTitle);
}
function legacyCopyToClipboard(textToCopy, successTitle, errorTitle) {
    const tempTextArea = document.createElement("textarea"); tempTextArea.value = textToCopy; tempTextArea.style.position = "absolute"; tempTextArea.style.left = "-9999px"; tempTextArea.style.top = "0";
    document.body.appendChild(tempTextArea); tempTextArea.select(); tempTextArea.setSelectionRange(0, 99999); let success = false;
    try { success = document.execCommand('copy'); } catch (err) { console.error("[legacyCopyToClipboard] Erro:", err); }
    document.body.removeChild(tempTextArea);
    if (typeof Swal !== 'undefined') {
        const swalProps = { toast: true, position: 'top-end', showConfirmButton: false, timer: 1500, background: 'var(--card-bg)', color: 'var(--text-primary)', timerProgressBar: true };
        if (success) Swal.fire({ ...swalProps, icon: 'success', title: successTitle, iconColor: 'var(--success-green)' });
        else Swal.fire({ ...swalProps, icon: 'error', title: errorTitle, timer:2000, iconColor: 'var(--danger-red)' });
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    console.log("LOG DOMContentLoaded: Iniciando aplicação.");
    const apiKeyIsValid = TMDB_API_KEY && TMDB_API_KEY !== 'SUA_CHAVE_API_DO_TMDB_AQUI' && TMDB_API_KEY.length > 10;
    if (!apiKeyIsValid) {
         console.error("Chave da API TMDB inválida ou não configurada.");
         const errorMsgHtml = `<p class="text-center text-red-400 p-4 col-span-full">Chave da API TMDB inválida.</p>`;
         if(moviesResultsGrid) moviesResultsGrid.innerHTML = errorMsgHtml; if(tvShowsResultsGrid) tvShowsResultsGrid.innerHTML = errorMsgHtml; if(singleResultsGrid) singleResultsGrid.innerHTML = errorMsgHtml;
         if(searchInput) searchInput.disabled = true; if(searchButton) searchButton.disabled = true; if(filterToggleButton) filterToggleButton.disabled = true; if(loader) loader.style.display = 'none';
         const header = document.querySelector('header'); const errorDiv = document.createElement('div'); errorDiv.innerHTML = `<div style="background-color: #B91C1C; color: white; text-align: center; padding: 0.75rem; font-weight: bold;">ERRO: Chave da API TMDB necessária.</div>`;
         if(header && header.parentNode) header.parentNode.insertBefore(errorDiv, header.nextSibling); else document.body.insertBefore(errorDiv, document.body.firstChild);
         return;
    }

    if (searchInput) searchInput.addEventListener('input', () => { clearTimeout(searchTimeout); searchTimeout = setTimeout(() => { if (searchInput.value !== undefined) performSearch(searchInput.value); }, 500); });
    else console.warn("Elemento searchInput não encontrado.");
    if (searchButton) searchButton.addEventListener('click', () => { clearTimeout(searchTimeout); if (searchInput && searchInput.value !== undefined) performSearch(searchInput.value); else if (searchInput) performSearch(''); else console.warn("Elemento searchInput não encontrado para busca por botão."); });
    else console.warn("Elemento searchButton não encontrado.");
    if (filterToggleButton) filterToggleButton.addEventListener('click', openFilterSweetAlert);
    else console.warn("Elemento filterToggleButton não encontrado.");
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape') { if (typeof Swal !== 'undefined' && Swal.isVisible()) Swal.close(); } });

    // --- Listeners de Scroll para Infinite Scroll ---

    // HORIZONTAL Scroll para seções da PÁGINA PRINCIPAL (agora grids verticais, este listener não será efetivo como antes)
    // Mantido caso o layout CSS mude no futuro para permitir scroll horizontal nelas de novo,
    // mas com o CSS atual (tudo grid), não deve disparar loadMore...
    if (moviesResultsGrid) {
        moviesResultsGrid.addEventListener('scroll', () => {
            if (defaultContentSections && defaultContentSections.style.display === 'block' &&
                !isLoadingMorePopularMovies && popularMoviesCurrentPage < popularMoviesTotalPages &&
                moviesResultsGrid.scrollWidth > moviesResultsGrid.clientWidth && // Só se houver de fato scroll horizontal
                (moviesResultsGrid.scrollLeft + moviesResultsGrid.clientWidth >= moviesResultsGrid.scrollWidth - 200)) {
                // loadMorePopularMovies(); // Desativado pois o layout agora é grid vertical
                // console.log("Scroll horizontal em moviesResultsGrid detectado, mas loadMorePopularMovies está desativado.");
            }
        });
    } else console.warn("Elemento moviesResultsGrid não encontrado.");

    if (tvShowsResultsGrid) {
        tvShowsResultsGrid.addEventListener('scroll', () => {
            if (defaultContentSections && defaultContentSections.style.display === 'block' &&
                !isLoadingMoreTopRatedTvShows && topRatedTvShowsCurrentPage < topRatedTvShowsTotalPages &&
                tvShowsResultsGrid.scrollWidth > tvShowsResultsGrid.clientWidth && // Só se houver de fato scroll horizontal
                (tvShowsResultsGrid.scrollLeft + tvShowsResultsGrid.clientWidth >= tvShowsResultsGrid.scrollWidth - 200)) {
                // loadMoreTopRatedTvShows(); // Desativado
                // console.log("Scroll horizontal em tvShowsResultsGrid detectado, mas loadMoreTopRatedTvShows está desativado.");
            }
        });
    } else console.warn("Elemento tvShowsResultsGrid não encontrado.");
    
    // VERTICAL Scroll para resultados de BUSCA e FILTRO
    const mainContentAreaEl = document.getElementById('contentArea'); 
    let scrollTargetForResults = window; 
    let useElementScrollProperties = false; 

    console.log("LOG DOMContentLoaded: Verificando alvo de scroll vertical. window.innerWidth:", window.innerWidth);
    if (mainContentAreaEl) { 
        console.log("LOG DOMContentLoaded: #contentArea ENCONTRADO.");
        const bodyComputedOverflowY = getComputedStyle(document.body).overflowY;
        const mainContentComputedOverflowY = getComputedStyle(mainContentAreaEl).overflowY;
        console.log("LOG DOMContentLoaded: Estilo Computado - Body overflow-y:", bodyComputedOverflowY, "| #contentArea overflow-y:", mainContentComputedOverflowY);
        
        if (window.innerWidth < 768 && bodyComputedOverflowY === 'hidden' && (mainContentComputedOverflowY === 'auto' || mainContentComputedOverflowY === 'scroll')) {
            scrollTargetForResults = mainContentAreaEl;
            useElementScrollProperties = true;
            console.log("LOG: Scroll vertical para busca/filtro ATRELADO ao #contentArea (mobile).");
        } else {
             console.log("LOG: Scroll vertical para busca/filtro ATRELADO à window (Desktop ou fallback mobile - bodyOFY:"+bodyComputedOverflowY+", mainContentOFY:"+mainContentComputedOverflowY+").");
        }
    } else {
        console.warn("LOG DOMContentLoaded: #contentArea NÃO encontrado. Usando window como alvo de scroll para resultados.");
        scrollTargetForResults = window; 
        useElementScrollProperties = false;
    }
    
    scrollTargetForResults.addEventListener('scroll', () => {
        // console.log(`LOG: Evento de SCROLL disparado em ${useElementScrollProperties && scrollTargetForResults !== window ? '#contentArea' : 'window'}`);
        const isSingleSectionVisible = singleResultsSection && singleResultsSection.style.display === 'block';
        // console.log(`LOG Scroll Check 1: isSingleSectionVisible=${isSingleSectionVisible}, isLoadingMore=${isLoadingMore}`);
        if (!isSingleSectionVisible || isLoadingMore) { 
            return;
        }

        let canLoadMoreContext = false;
        if (currentContentContext === 'search' && searchCurrentPage < totalPages.search) {
            canLoadMoreContext = true;
        } else if (currentContentContext === 'filter' && filterCurrentPage < totalPages.filter) {
            canLoadMoreContext = true;
        }
        // console.log(`LOG Scroll Check 2: canLoadMoreContext=${canLoadMoreContext} (Contexto: ${currentContentContext}, PágAtualBusca: ${searchCurrentPage}, TotalBusca: ${totalPages.search}, PágAtualFiltro: ${filterCurrentPage}, TotalFiltro: ${totalPages.filter})`);
        if (!canLoadMoreContext) return;

        let scrolledToEnd;
        const offset = 100; 

        if (useElementScrollProperties && scrollTargetForResults !== window) { 
            const st = scrollTargetForResults.scrollTop;
            const ch = scrollTargetForResults.clientHeight;
            const sh = scrollTargetForResults.scrollHeight;
            // console.log(`LOG Scroll Check 3 (Elemento #contentArea): scrollTop=${st}, clientHeight=${ch}, scrollHeight=${sh}, TargetReach=${sh - offset}`);
            scrolledToEnd = (st + ch >= sh - offset);
        } else { 
            const wh = window.innerHeight;
            const sy = window.scrollY;
            const dh = document.documentElement.scrollHeight;
            // console.log(`LOG Scroll Check 3 (Window): innerHeight=${wh}, scrollY=${sy}, docScrollHeight=${dh}, TargetReach=${dh - (offset + 150)}`);
            scrolledToEnd = (wh + sy >= dh - (offset + 150)); 
        }
        // console.log(`LOG Scroll Check 4: scrolledToEnd=${scrolledToEnd}`);

        if (scrolledToEnd) {
            console.log(`LOG: !!! Scroll VERTICAL em ${useElementScrollProperties && scrollTargetForResults !== window ? '#contentArea' : 'window'} ATIVOU loadMoreItems para contexto: ${currentContentContext} !!!`);
            loadMoreItems();
        }
    });

    // --- Inicialização do Conteúdo da Página ---
    const urlParams = new URLSearchParams(window.location.search);
    const typeParam = urlParams.get('type'); const idParam = urlParams.get('id');
    if (typeParam && idParam && (typeParam === 'movie' || typeParam === 'tv')) {
        console.log(`Link direto detectado: type=${typeParam}, id=${idParam}. Abrindo modal.`);
        if(defaultContentSections) defaultContentSections.style.display = 'none'; if(singleResultsSection) singleResultsSection.style.display = 'none';
        if(moviesResultsGrid) moviesResultsGrid.innerHTML = ''; if(tvShowsResultsGrid) tvShowsResultsGrid.innerHTML = ''; if(singleResultsGrid) singleResultsGrid.innerHTML = '';
        if(loader) loader.style.display = 'none';
        openItemModal(idParam, typeParam, null);
    } else {
        console.log("Nenhum link direto. Carregando conteúdo principal.");
        loadMainPageContent();
    }
});
