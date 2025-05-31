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
        console.error("Elemento target para displayResults não encontrado.");
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
        if (!mediaType || (mediaType !== 'movie' && mediaType !== 'tv') || !item.poster_path) return;

        const originalLanguage = item.original_language ? item.original_language.toLowerCase() : '';
        const originCountries = (item.origin_country || []).map(c => c.toUpperCase()); 

        if (ASIAN_LANGUAGES_TO_BLOCK.includes(originalLanguage) || 
            originCountries.some(countryCode => ASIAN_ORIGIN_COUNTRIES_TO_BLOCK.includes(countryCode))) {
            console.log(`Item bloqueado (asiático): ${item.title || item.name}, Idioma: ${originalLanguage}, Países: ${originCountries.join(', ')}`);
            return; 
        }

        const card = document.createElement('div');
        card.className = 'content-card shadow-lg group';
        card.onclick = () => openItemModal(item.id, mediaType, item.backdrop_path);
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.setAttribute('aria-label', `Ver detalhes de ${item.title || item.name}`);

        const img = document.createElement('img');
        img.src = `${TMDB_IMAGE_BASE_URL}w780${item.poster_path}`;
        img.alt = `Pôster de ${item.title || item.name}`;
        img.loading = 'lazy'; 
        img.onerror = () => { 
            img.src = `https://placehold.co/780x1170/0A0514/F0F0F0?text=Indispon%C3%ADvel&font=inter`;
            img.alt = 'Imagem indisponível';
        };
        
        const titleOverlay = document.createElement('div');
        titleOverlay.className = 'title-overlay';
        
        const titleDiv = document.createElement('div');
        titleDiv.className = 'title';
        titleDiv.textContent = item.title || item.name;

        titleOverlay.appendChild(titleDiv);
        card.appendChild(img);
        card.appendChild(titleOverlay);
        targetGridElement.appendChild(card);
        displayedCount++;
    });

    if (displayedCount === 0 && items.length > 0) { 
         targetGridElement.innerHTML = `<p class="text-center col-span-full text-[var(--text-secondary)] py-10 text-lg">Todos os itens foram filtrados (conteúdo asiático).</p>`;
    } else if (displayedCount === 0) { 
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
         Swal.fire({ toast: true, position: 'top-end', icon: 'warning', title: warningTitle, showConfirmButton: false, timer: 2500, background: 'var(--card-bg)', color: 'var(--text-primary)', iconColor: 'var(--text-secondary)'});
        return;
    }
    const tempTextArea = document.createElement("textarea");
    tempTextArea.value = textToCopy;
    tempTextArea.style.position = "absolute"; tempTextArea.style.left = "-9999px";
    document.body.appendChild(tempTextArea);
    tempTextArea.select();
    tempTextArea.setSelectionRange(0, 99999);

    let success = false;
    try {
        success = document.execCommand('copy');
        console.log("[copyToClipboard] document.execCommand('copy') sucesso:", success);
    } catch (err) {
        console.error("[copyToClipboard] Erro ao usar document.execCommand('copy'):", err);
    }
    document.body.removeChild(tempTextArea);

    const swalProps = { toast: true, position: 'top-end', showConfirmButton: false, timer: 1500, background: 'var(--card-bg)', color: 'var(--text-primary)', timerProgressBar: true };

    if (success) {
        Swal.fire({ ...swalProps, icon: 'success', title: successTitle, iconColor: 'var(--success-green)' });
    } else {
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
             console.warn("[copyToClipboard] navigator.clipboard.writeText não está disponível.");
             Swal.fire({ ...swalProps, icon: 'error', title: errorTitle, timer:2000, iconColor: 'var(--danger-red)' });
        }
    }
}

// --- Event Listeners ---
if (searchInput) {
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            performSearch(searchInput.value);
        }, 500); 
    });
} else {
    console.error("Elemento searchInput não encontrado.");
}

if (searchButton) {
    searchButton.addEventListener('click', () => {
        clearTimeout(searchTimeout); 
        if (searchInput) {
            performSearch(searchInput.value);
        } else {
            console.error("Elemento searchInput não encontrado para executar busca.");
        }
    });
} else {
    console.error("Elemento searchButton não encontrado.");
}

if (filterToggleButton) {
    filterToggleButton.addEventListener('click', openFilterSweetAlert);
} else {
    console.error("Elemento filterToggleButton não encontrado.");
}


document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        if (Swal.isVisible()) {
            Swal.close();
        }
    }
});

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded event fired.");
    const urlParams = new URLSearchParams(window.location.search);
    const typeParam = urlParams.get('type');
    const idParam = urlParams.get('id');

    const apiKeyIsValid = TMDB_API_KEY && TMDB_API_KEY !== 'SUA_CHAVE_API_DO_TMDB_AQUI' && TMDB_API_KEY.length > 10;

    if (!apiKeyIsValid) {
         console.error("Chave da API TMDB inválida ou não configurada.");
         const errorMsg = `<p class="text-center text-red-400 p-4 col-span-full">Chave da API TMDB inválida ou não configurada. Verifique a constante TMDB_API_KEY no script.</p>`;
         if(moviesResultsGrid) moviesResultsGrid.innerHTML = errorMsg;
         if(tvShowsResultsGrid) tvShowsResultsGrid.innerHTML = errorMsg;
         if(searchInput) searchInput.disabled = true;
         if(searchButton) searchButton.disabled = true;
         if(filterToggleButton) filterToggleButton.disabled = true;
         if(loader) loader.style.display = 'none';
         
         const header = document.querySelector('header');
         const errorDiv = document.createElement('div');
         errorDiv.innerHTML = `<div class="bg-red-700 text-white text-center p-3"><strong>ERRO DE CONFIGURAÇÃO:</strong> A chave da API TMDB é necessária. O aplicativo não funcionará corretamente.</div>`;
         if(header && header.parentNode) header.parentNode.insertBefore(errorDiv, header.nextSibling);
         return; 
    }

    if (typeParam && idParam) {
        console.log(`Link direto detectado: type=${typeParam}, id=${idParam}. Escondendo seções principais e abrindo modal.`);
        if(defaultContentSections) defaultContentSections.style.display = 'none';
        if(singleResultsSection) singleResultsSection.style.display = 'none';
        
        if(moviesResultsGrid) moviesResultsGrid.innerHTML = ''; 
        if(tvShowsResultsGrid) tvShowsResultsGrid.innerHTML = '';
        if(singleResultsGrid) singleResultsGrid.innerHTML = '';
        
        if(loader) loader.style.display = 'none'; 
        
        openItemModal(idParam, typeParam, null);
    } else {
        console.log("Nenhum link direto detectado. Carregando conteúdo principal da página.");
        loadMainPageContent(); 
    }
});
