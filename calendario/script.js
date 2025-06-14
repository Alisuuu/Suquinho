document.addEventListener('DOMContentLoaded', () => {
    const apiURL = 'https://superflixapi.pw/calendario.php';
    let data = [];
    let periodo = 'semana';
    let itemsByDay = {};
    let selectedDateKey = null;

    const contentArea = document.getElementById('content-area');
    const searchInput = document.getElementById('search');
    const filterModal = document.getElementById('filterModal');
    const weekNav = document.getElementById('week-navigation');
    
    async function fetchData() {
        contentArea.innerHTML = `<p class="text-center col-span-full p-10 text-[var(--on-surface-variant-color)]">Carregando lançamentos...</p>`;
        try {
            const response = await fetch(apiURL);
            if (!response.ok) throw new Error(`Erro na API: ${response.statusText}`);
            data = await response.json();
            initializeFilters();
            render();
        } catch (error) {
            console.error('Erro ao buscar dados da API:', error);
            contentArea.innerHTML = `<p class="text-center col-span-full p-10 text-[var(--status-atrasado)]">Não foi possível carregar os dados.</p>`;
        }
    }
    
    function initializeFilters() {
        document.querySelectorAll('#filterModal .filters button').forEach(btn => {
            btn.className = "button-blur px-4 py-2 rounded-full text-sm text-[var(--on-surface-variant-color)] bg-[var(--surface-color)] border border-[var(--outline-color)] transition-all";
            if(btn.classList.contains('active')) {
                btn.classList.add('active');
            }
        });
    }

    // ========================================================================
    // EVENT LISTENERS
    // ========================================================================

    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (event) => {
            if (event.target === modal || event.target.closest('[data-close-modal]')) {
                modal.classList.add('hidden');
            }
        });
    });

    document.getElementById('toggleFiltersBtn').addEventListener('click', () => filterModal.classList.remove('hidden'));

    filterModal.addEventListener('click', (event) => {
        const btn = event.target.closest('button');
        if (!btn || !btn.parentElement.classList.contains('filters') || btn.hasAttribute('data-close-modal')) return;
        
        if (btn.dataset.type) {
            btn.parentElement.querySelectorAll('button').forEach(b => b.classList.remove('active'));
        }
        btn.classList.toggle('active');
        render();
    });

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
        if(!dayCell || !dayCell.dataset.datekey) return;
        const dateKey = dayCell.dataset.datekey;
        showMonthDetailModal(dateKey, itemsByDay[dateKey] || []);
    });

    // ========================================================================
    // FUNÇÕES DE RENDERIZAÇÃO
    // ========================================================================

    function showMonthDetailModal(dateKey, items) {
        const modal = document.getElementById('monthDetailModal');
        const modalTitle = document.getElementById('monthDetailModalTitle');
        const modalContent = document.getElementById('monthDetailModalContent');
        
        const day = new Date(dateKey + 'T00:00:00');
        modalTitle.textContent = day.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
        
        modalContent.innerHTML = '';
        if(items.length > 0) {
            items.forEach(item => modalContent.appendChild(createItemCard(item)));
        }
        modal.classList.remove('hidden');
    }

    function createItemCard(item) {
        const posterURL = item.poster ? `https://image.tmdb.org/t/p/w185${item.poster}` : 'https://placehold.co/185x278/607D8B/FFFFFF?text=N/A';
        const backdropURL = item.backdrop ? `https://image.tmdb.org/t/p/w500${item.backdrop}` : '';
        const overviewHTML = item.overview ? `<p class="text-xs text-[var(--on-surface-variant-color)] mt-2">${item.overview}</p>` : '';
        
        let borderColor = '';
        switch (item.status) {
            case 'Atualizado': borderColor = 'var(--status-atualizado)'; break;
            case 'Hoje': borderColor = 'var(--status-hoje)'; break;
            case 'Futuro': borderColor = 'var(--status-futuro)'; break;
            case 'Atrasado': borderColor = 'var(--status-atrasado)'; break;
        }

        const itemEl = document.createElement('div');
        itemEl.className = `relative overflow-hidden flex flex-col bg-black/30 backdrop-blur-xl rounded-2xl border border-white/20`;
        itemEl.style.borderLeft = `4px solid ${borderColor}`;

        itemEl.innerHTML = `
            ${backdropURL ? `<img src="${backdropURL}" class="absolute top-0 left-0 w-full h-full object-cover opacity-30 z-0">` : ''}
            <div class="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-black/80 via-black/50 to-transparent z-10"></div>
            <div class="relative z-20 p-3 flex flex-col justify-end flex-grow">
                <div class="flex items-start gap-4">
                    <img class="w-20 h-28 object-cover flex-shrink-0 rounded-lg shadow-md" src="${posterURL}" alt="Poster" loading="lazy" onerror="this.src='https://placehold.co/185x278/607D8B/FFFFFF?text=N/A'">
                    <div class="flex-grow pt-10">
                        <h3 class="font-bold text-[var(--on-surface-color)]">${item.title}</h3>
                        <p class="text-sm text-[var(--on-surface-variant-color)] mt-1">${item.episode} (T${item.season}E${item.number})</p>
                        ${overviewHTML}
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
        contentWrapper.className = "grid grid-cols-1 md:grid-cols-2 gap-4";
        items.forEach(item => contentWrapper.appendChild(createItemCard(item)));
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
            dayButton.className = 'day-button relative flex-shrink-0 flex flex-col items-center justify-center p-2 rounded-xl border border-white/20 bg-black/20 transition-all duration-200 hover:bg-white/10 w-20 h-20';
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
                ${itemCount > 0 ? `<span class="absolute top-1 right-1 text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full bg-[var(--primary-color)] text-white">${itemCount}</span>` : ''}
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
        const type = document.querySelector('.filters button[data-type].active')?.dataset.type || 'all';
        const activeStatuses = [...document.querySelectorAll('.filters button[data-status].active')].map(b => b.dataset.status);
        const search = searchInput.value.toLowerCase();

        itemsByDay = {};
        data.filter(item => {
            if (!item.air_date) return false;
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
            selectedDateKey = itemsByDay[todayKey] ? todayKey : Object.keys(itemsByDay).find(key => {
                const d = new Date(key + "T00:00:00");
                const start = new Date(todayKey);
                start.setDate(start.getDate() - start.getDay());
                start.setHours(0,0,0,0);
                const end = new Date(start);
                end.setDate(start.getDate()+6);
                return d >= start && d <= end;
            }) || todayKey;
            renderContentForDay(selectedDateKey);
        } else {
            weekNav.classList.add('hidden');
            renderMonthView();
        }

        document.querySelectorAll('.filters button').forEach(btn => {
            btn.classList.toggle('active', btn.matches('.active'));
        });
    }

    fetchData();
});

