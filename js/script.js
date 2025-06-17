document.addEventListener('DOMContentLoaded', () => {
    const apiURL = 'https://superflixapi.pw/calendario.php';
    let data = [];
    let periodo = 'semana';
    let itemsByDay = {};
    let selectedDateKey = null;

    // Estado dos filtros
    let activeFilters = {
        type: 'all',
        status: ['Atualizado', 'Hoje', 'Futuro', 'Atrasado']
    };

    const contentArea = document.getElementById('content-area');
    const searchInput = document.getElementById('search');
    const weekNav = document.getElementById('week-navigation');
    
    async function fetchData() {
        contentArea.innerHTML = `<p class="text-center col-span-full p-10 text-[var(--on-surface-variant-color)]">Carregando lançamentos...</p>`;
        try {
            const response = await fetch(apiURL);
            if (!response.ok) throw new Error(`Erro na API: ${response.statusText}`);
            data = await response.json();
            if (!Array.isArray(data) || data.length === 0) {
                 throw new Error('API não retornou dados válidos.');
            }
            setupBackdropSlideshow(data); // Inicia o slideshow de fundo
            render();
        } catch (error) {
            console.error('Erro ao buscar dados da API:', error);
            contentArea.innerHTML = `<p class="text-center col-span-full p-10 text-[var(--status-atrasado)]">Não foi possível carregar os dados. Tente novamente mais tarde.</p>`;
        }
    }

    // ========================================================================
    // LÓGICA DO SLIDESHOW DE FUNDO
    // ========================================================================
    function setupBackdropSlideshow(items) {
        const backdropContainer = document.getElementById('backdrop-container');
        if (!backdropContainer) return;

        const backdropUrls = items
            .filter(item => item.backdrop)
            .map(item => `https://image.tmdb.org/t/p/w1280${item.backdrop}`);

        if (backdropUrls.length === 0) return;

        // Preload para transições suaves
        backdropUrls.forEach(url => { (new Image()).src = url; });
        
        backdropContainer.innerHTML = '';
        backdropUrls.forEach(url => {
            const img = document.createElement('img');
            img.src = url;
            img.className = 'backdrop-image';
            img.loading = 'lazy';
            backdropContainer.appendChild(img);
        });

        let currentIndex = 0;
        const images = backdropContainer.querySelectorAll('.backdrop-image');

        if(images.length > 0) {
            images[0].classList.add('active'); // Ativa a primeira imagem
        }
        
        if (images.length > 1) {
            setInterval(() => {
                images[currentIndex].classList.remove('active');
                currentIndex = (currentIndex + 1) % images.length;
                images[currentIndex].classList.add('active');
            }, 4000); // Muda a imagem a cada 4 segundos
        }
    }


    // ========================================================================
    // EVENT LISTENERS
    // ========================================================================

    document.getElementById('toggleFiltersBtn').addEventListener('click', showFilterSweetAlert);

    document.querySelector('.period').addEventListener('click', (event) => {
        const btn = event.target.closest('button');
        if (btn && btn.id) {
            periodo = btn.id;
            document.querySelectorAll('.period button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            render();
        }
    });

    let searchTimeout;
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(render, 300);
    });

    weekNav.addEventListener('click', (event) => {
        const dayButton = event.target.closest('.day-button');
        if (!dayButton) return;
        selectedDateKey = dayButton.dataset.datekey;
        renderContentForDay(selectedDateKey);
    });

    contentArea.addEventListener('click', (event) => {
        const dayCell = event.target.closest('.month-day-cell');
        if (event.target.closest('.swal2-html-container')) return;
        
        if(!dayCell || !dayCell.dataset.datekey) return;
        const dateKey = dayCell.dataset.datekey;
        showMonthDetailModal(dateKey, itemsByDay[dateKey] || []);
    });

    // ========================================================================
    // FUNÇÕES DE RENDERIZAÇÃO E MODAIS (COM SWEETALERT)
    // ========================================================================

    function showFilterSweetAlert() {
        const typeButtonsHTML = `
            <button data-type="all" class="button-blur px-4 py-2 rounded-full text-sm ${activeFilters.type === 'all' ? 'active' : ''}">Todos</button>
            <button data-type="2" class="button-blur px-4 py-2 rounded-full text-sm ${activeFilters.type === '2' ? 'active' : ''}">Séries</button>
            <button data-type="3" class="button-blur px-4 py-2 rounded-full text-sm ${activeFilters.type === '3' ? 'active' : ''}">Animes</button>
        `;

        const statusButtonsHTML = `
            <button data-status="Atualizado" class="button-blur px-4 py-2 rounded-full text-sm ${activeFilters.status.includes('Atualizado') ? 'active' : ''}">Atualizado</button>
            <button data-status="Hoje" class="button-blur px-4 py-2 rounded-full text-sm ${activeFilters.status.includes('Hoje') ? 'active' : ''}">Hoje</button>
            <button data-status="Futuro" class="button-blur px-4 py-2 rounded-full text-sm ${activeFilters.status.includes('Futuro') ? 'active' : ''}">Futuro</button>
            <button data-status="Atrasado" class="button-blur px-4 py-2 rounded-full text-sm ${activeFilters.status.includes('Atrasado') ? 'active' : ''}">Atrasado</button>
        `;

        Swal.fire({
            title: 'Opções de Filtro',
            html: `
                <div class="mb-6">
                    <h3 class="text-lg font-semibold text-[var(--on-surface-color)] mb-3 text-left">Tipo:</h3>
                    <div id="swal-type-filters" class="filters flex flex-wrap gap-2">
                        ${typeButtonsHTML}
                    </div>
                </div>
                <div>
                    <h3 class="text-lg font-semibold text-[var(--on-surface-color)] mb-3 text-left">Status:</h3>
                    <div id="swal-status-filters" class="filters flex flex-wrap gap-2">
                        ${statusButtonsHTML}
                    </div>
                </div>
            `,
            showConfirmButton: true,
            confirmButtonText: 'Aplicar Filtros',
            showCloseButton: true,
            background: 'transparent',
            willOpen: () => {
                const popup = Swal.getPopup();
                
                popup.querySelector('#swal-type-filters').addEventListener('click', e => {
                    const btn = e.target.closest('button');
                    if (!btn || !btn.dataset.type) return;
                    popup.querySelectorAll('#swal-type-filters button').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                });

                popup.querySelector('#swal-status-filters').addEventListener('click', e => {
                    const btn = e.target.closest('button');
                    if (!btn || !btn.dataset.status) return;
                    btn.classList.toggle('active');
                });
            },
            preConfirm: () => {
                const popup = Swal.getPopup();
                const newType = popup.querySelector('#swal-type-filters button.active')?.dataset.type || 'all';
                const newStatus = [...popup.querySelectorAll('#swal-status-filters button.active')].map(b => b.dataset.status);
                return { type: newType, status: newStatus };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                activeFilters.type = result.value.type;
                activeFilters.status = result.value.status;
                render();
            }
        });
    }

    function showMonthDetailModal(dateKey, items) {
        const day = new Date(dateKey + 'T00:00:00');
        const title = day.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
        
        let contentHTML = '';
        if (items.length > 0) {
            const container = document.createElement('div');
            items.forEach(item => {
                container.appendChild(createItemCard(item));
            });
            contentHTML = container.innerHTML;
        } else {
            contentHTML = `<p class="text-center p-10 text-[var(--on-surface-variant-color)]">Nenhum lançamento para este dia.</p>`;
        }

        Swal.fire({
            title: title,
            html: `<div class="swal-scroll-container space-y-3 max-h-[60vh] overflow-y-auto p-1">${contentHTML}</div>`,
            width: '90%',
            maxWidth: '768px',
            showConfirmButton: false,
            showCloseButton: true,
            background: 'transparent',
        });
    }

    function createItemCard(item) {
        const itemEl = document.createElement('a');
        
        // MODIFICAÇÃO: Usando ../ para subir um nível (de /calendario/ para /Suquinho/)
        // e adicionando a string de consulta com o valor que o script de destino espera.
        itemEl.href = `../?pagina=Catalogo1%2Findex.html%3Ftype%3Dtv%26id%3D${item.tmdb_id}`;
        
        // REMOVIDO: Target="_blank" para abrir o link na mesma aba/janela
        // itemEl.target = '_blank'; 
        
        // O rel="noopener noreferrer" é mais relevante com target="_blank",
        // mas pode ser mantido sem causar problemas.
        itemEl.rel = 'noopener noreferrer'; 
        
        itemEl.className = `task-item relative overflow-hidden flex flex-col cursor-pointer transition-transform duration-300 hover:scale-[1.02]`;

        const posterURL = item.poster ? `https://image.tmdb.org/t/p/w185${item.poster}` : 'https://placehold.co/185x278/111827/FFFFFF?text=N/A';
        const backdropURL = item.backdrop ? `https://image.tmdb.org/t/p/w500${item.backdrop}` : '';
        
        const watchButtonHTML = `
            <div class="mt-4">
                <span class="inline-block bg-[var(--primary-color)] text-[var(--on-primary-color)] px-4 py-2 rounded-full text-xs font-semibold pointer-events-none">
                    Assistir Agora
                </span>
            </div>
        `;

        // HTML para a tag de status
        const statusTagHTML = `
            <span class="status-tag status-tag-${item.status.toLowerCase()}">
                ${item.status}
            </span>
        `;
        
        let borderColor = 'var(--outline-color)';
        switch (item.status) {
            case 'Atualizado': borderColor = 'var(--status-atualizado)'; break;
            case 'Hoje': borderColor = 'var(--status-hoje)'; break;
            case 'Futuro': borderColor = 'var(--status-futuro)'; break;
            case 'Atrasado': borderColor = 'var(--status-atrasado)'; break;
        }

        itemEl.style.borderLeft = `3px solid ${borderColor}`;

        itemEl.innerHTML = `
            ${statusTagHTML}
            <div class="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-black/80 via-black/50 to-transparent z-10"></div>
            ${backdropURL ? `<img src="${backdropURL}" class="absolute top-0 left-0 w-full h-full object-cover opacity-30 z-0" loading="lazy">` : ''}
            <div class="relative z-20 p-4 flex flex-col justify-end flex-grow">
                <div class="flex items-start gap-4">
                    <img class="w-20 sm:w-24 h-auto object-cover flex-shrink-0 rounded-lg shadow-lg border border-white/10" src="${posterURL}" alt="Poster" loading="lazy" onerror="this.src='https://placehold.co/185x278/1f2937/FFFFFF?text=N/A'">
                    <div class="flex-grow pt-2 flex flex-col justify-between self-stretch">
                        <div>
                            <h3 class="font-bold text-base sm:text-lg text-[var(--on-surface-color)]">${item.title}</h3>
                            <p class="text-sm text-[var(--on-surface-variant-color)] mt-1">${item.episode} (T${item.season}E${item.number})</p>
                        </div>
                        ${watchButtonHTML}
                    </div>
                </div>
            </div>
        `;
        return itemEl;
    }

    function renderContentForDay(dateKey) {
        contentArea.innerHTML = '';
        document.querySelectorAll('.day-button').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll(`.day-button[data-datekey="${dateKey}"]`).forEach(btn => btn.classList.add('active'));

        const items = itemsByDay[dateKey] || [];
        if (items.length === 0) {
            contentArea.innerHTML = `<p class="text-center p-10 text-[var(--on-surface-variant-color)]">Nenhum lançamento para este dia.</p>`;
            return;
        }

        const contentWrapper = document.createElement('div');
        contentWrapper.className = "grid grid-cols-1 lg:grid-cols-2 gap-4";
        items.forEach(item => {
            if (item.tmdb_id) { 
                contentWrapper.appendChild(createItemCard(item));
            }
        });
        contentArea.appendChild(contentWrapper);
    }

    function renderWeekNavigation() {
        weekNav.innerHTML = '';
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const startOfWeek = new Date(hoje);
        startOfWeek.setDate(hoje.getDate() - hoje.getDay());

        for (let i = 0; i < 7; i++) {
            const day = new Date(startOfWeek);
            day.setDate(startOfWeek.getDate() + i);
            const dateKey = day.toISOString().split('T')[0];
            const itemCount = itemsByDay[dateKey]?.length || 0;

            const dayButton = document.createElement('button');
            dayButton.className = 'day-button relative flex-shrink-0 flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 w-20 h-20';
            dayButton.dataset.datekey = dateKey;
            
            let dayLabelClass = "font-semibold text-xs text-[var(--on-surface-variant-color)]";
            let dayNumberClass = "font-bold text-2xl text-[var(--on-surface-color)]";
            if(dateKey === hoje.toISOString().split('T')[0]){
                 dayLabelClass = "font-bold text-xs text-[var(--primary-color)]";
                 dayNumberClass = "font-bold text-2xl text-[var(--primary-color)]";
            }
            
            dayButton.innerHTML = `
                <p class="${dayLabelClass}">${day.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '').toUpperCase()}</p>
                <p class="${dayNumberClass}">${day.getDate()}</p>
                ${itemCount > 0 ? `<span class="absolute top-1 right-1 text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full bg-[var(--primary-color)] text-white shadow-lg">${itemCount}</span>` : ''}
            `;
            
            weekNav.appendChild(dayButton);
        }
    }
    
    function renderMonthView() {
        contentArea.innerHTML = '';
        const hoje = new Date();
        hoje.setHours(0,0,0,0);
        const startOfMonth = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        const endOfMonth = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
        const daysInMonth = endOfMonth.getDate();
        const startDayOfWeek = startOfMonth.getDay();

        const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const headerGrid = document.createElement('div');
        headerGrid.className = "grid grid-cols-7 gap-2 text-center mb-2";
        weekdays.forEach(day => {
            headerGrid.innerHTML += `<div class="text-xs font-bold text-[var(--on-surface-variant-color)]">${day.toUpperCase()}</div>`;
        });
        contentArea.appendChild(headerGrid);

        const calendarGrid = document.createElement('div');
        calendarGrid.className = "grid grid-cols-7 gap-2";

        for (let i = 0; i < startDayOfWeek; i++) {
            calendarGrid.appendChild(document.createElement('div'));
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dayCell = document.createElement('div');
            const currentDate = new Date(hoje.getFullYear(), hoje.getMonth(), day);
            const dateKey = currentDate.toISOString().split('T')[0];
            const itemCount = itemsByDay[dateKey]?.length || 0;

            dayCell.className = `month-day-cell relative flex flex-col items-center justify-start h-24 rounded-2xl bg-black/20 border border-white/10 transition-all duration-200 p-2`;
            
            let dayNumberClass = "font-bold text-lg text-[var(--on-surface-color)]";

            if (itemCount > 0) {
                dayCell.classList.add('cursor-pointer', 'hover:bg-white/20');
                dayCell.dataset.datekey = dateKey;
                dayCell.innerHTML = `<span class="absolute top-1 right-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--primary-color)] text-white">${itemCount}</span>`;
            }

            if (currentDate.toDateString() === hoje.toDateString()) {
                dayCell.classList.add('border-2', 'border-[var(--primary-color)]');
                dayNumberClass = "font-bold text-lg text-[var(--primary-color)]";
            }
            
            const dayNumberEl = document.createElement('span');
            dayNumberEl.className = `${dayNumberClass} self-start`;
            dayNumberEl.textContent = day;
            dayCell.prepend(dayNumberEl);

            calendarGrid.appendChild(dayCell);
        }
        contentArea.appendChild(calendarGrid);
    }

    function render() {
        const type = activeFilters.type;
        const activeStatuses = activeFilters.status;
        const search = searchInput.value.toLowerCase();

        itemsByDay = {};
        
        data.filter(item => {
            if (!item.air_date || !item.tmdb_id) return false;
            
            const matchType = type === 'all' || (item.type && item.type.toString() === type);
            const matchStatus = activeStatuses.length === 0 || activeStatuses.includes(item.status);
            const matchSearch = !search || (item.title && item.title.toLowerCase().includes(search)) || (item.episode && item.episode.toLowerCase().includes(search));
            return matchType && matchStatus && matchSearch;
        }).forEach(item => {
            const dateKey = item.air_date.split(' ')[0];
            if (!itemsByDay[dateKey]) itemsByDay[dateKey] = [];
            itemsByDay[dateKey].push(item);
        });

        if (periodo === 'semana') {
            weekNav.classList.remove('hidden');
            renderWeekNavigation();
            const todayKey = new Date().toISOString().split('T')[0];
            selectedDateKey = itemsByDay[todayKey] ? todayKey : Object.keys(itemsByDay).sort((a,b) => new Date(a) - new Date(b)).find(key => {
                const d = new Date(key + "T00:00:00");
                const today = new Date(todayKey + "T00:00:00");
                const start = new Date(today);
                start.setDate(start.getDate() - start.getDay());
                const end = new Date(start);
                end.setDate(start.getDate()+6);
                return d >= start && d <= end;
            }) || todayKey;
            renderContentForDay(selectedDateKey);
        } else {
            weekNav.classList.add('hidden');
            renderMonthView();
        }
    }

    fetchData();
});
