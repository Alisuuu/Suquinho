const apiURL = 'https://superflixapi.pw/calendario.php';
let data = [];
let periodo = 'semana';

// Referências para os elementos do modal
const filterModal = document.getElementById('filterModal');
const toggleFiltersBtn = document.getElementById('toggleFiltersBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const calendarElement = document.getElementById('calendar');
const searchInput = document.getElementById('search');

// Função para buscar os dados da API
async function fetchData() {
  try {
    const response = await fetch(apiURL);
    data = await response.json();
    render();
  } catch (error) {
    console.error('Erro ao buscar dados da API:', error);
    // Poderia adicionar um tratamento de erro na UI aqui, se desejar
  }
}

// Função para atualizar as classes 'active' dos botões
function updateButtonActiveState(buttonElement, isActive) {
  if (isActive) {
    buttonElement.classList.add('active');
  } else {
    buttonElement.classList.remove('active');
  }
}

// Adiciona listener para o botão de toggle de filtros (abre o modal)
toggleFiltersBtn.addEventListener('click', () => {
  filterModal.classList.remove('hidden');
  // Sincroniza o estado dos botões do modal com os filtros aplicados
  document.querySelectorAll('#filterModal .filters button[data-type]').forEach(b => {
    const currentActiveType = document.querySelector('.filters button[data-type].active')?.dataset.type;
    updateButtonActiveState(b, b.dataset.type === currentActiveType);
  });
  document.querySelectorAll('#filterModal .filters button[data-status]').forEach(b => {
    const currentActiveStatuses = [...document.querySelectorAll('.filters button[data-status].active')].map(btn => btn.dataset.status);
    updateButtonActiveState(b, currentActiveStatuses.includes(b.dataset.status));
  });
});

// Adiciona listener para o botão de fechar o modal
closeModalBtn.addEventListener('click', () => {
  filterModal.classList.add('hidden');
});

// Adiciona listener para fechar o modal clicando no overlay
filterModal.addEventListener('click', (event) => {
  if (event.target === filterModal) {
    filterModal.classList.add('hidden');
  }
});

// Adiciona listeners para os botões de filtro de tipo e status (dentro do modal)
document.querySelectorAll('#filterModal .filters button').forEach(btn => {
  btn.addEventListener('click', () => {
    if (btn.dataset.type) {
      document.querySelectorAll('#filterModal [data-type]').forEach(b => updateButtonActiveState(b, false));
    }
    if (btn.dataset.status) {
      updateButtonActiveState(btn, !btn.classList.contains('active'));
    } else {
      updateButtonActiveState(btn, true);
    }
    render(); // Re-renderiza o calendário com os novos filtros
  });
});

// Adiciona listeners para os botões de período (Semana/Mês)
document.querySelectorAll('.period button').forEach(btn => {
  btn.addEventListener('click', () => {
    periodo = btn.id;
    document.querySelectorAll('.period button').forEach(b => updateButtonActiveState(b, false));
    updateButtonActiveState(btn, true);
    render();
  });
});

// Adiciona listener para o campo de busca
searchInput.addEventListener('input', render);

function render() {
  // Obtém os filtros ativos dos botões no modal
  const type = document.querySelector('#filterModal .filters button.active[data-type]')?.dataset.type;
  const activeStatuses = [...document.querySelectorAll('#filterModal .filters button.active[data-status]')].map(b => b.dataset.status);
  const search = searchInput.value.toLowerCase();

  const hoje = new Date();
  let start, end;
  if (periodo === 'semana') {
    start = new Date(hoje);
    start.setDate(hoje.getDate() - hoje.getDay()); // Define para o início da semana (Domingo)
    start.setHours(0, 0, 0, 0); // Zera a hora para comparação
    end = new Date(start);
    end.setDate(start.getDate() + 6); // Define para o final da semana (Sábado)
    end.setHours(23, 59, 59, 999); // Define a hora para o final do dia
  } else { // Período 'mes'
    start = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    start.setHours(0, 0, 0, 0);
    end = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0); // Último dia do mês
    end.setHours(23, 59, 59, 999);
  }

  const days = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }

  calendarElement.innerHTML = '';
  days.forEach(day => {
    const dayEl = document.createElement('div');
    dayEl.className = 'day flex flex-col bg-[var(--md-sys-color-surface-container)] rounded-lg border border-[var(--md-sys-color-outline-variant)] shadow-sm min-h-36 overflow-y-auto';
    const label = day.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' });
    dayEl.innerHTML = `<h3 class="text-sm font-semibold px-2 py-1 bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] rounded-t-lg border-b border-[var(--md-sys-color-outline-variant)] sticky top-0 z-10">${label}</h3>`;

    data.filter(item => {
      const itemDate = new Date(item.air_date);
      itemDate.setHours(0, 0, 0, 0); // Zera a hora do item para comparação apenas da data
      
      const matchDate = itemDate.toDateString() === day.toDateString();
      const matchType = (type === 'all' || !type) || (item.type.toString() === type);
      const matchStatus = activeStatuses.length === 0 || activeStatuses.includes(item.status); // Se nenhum status estiver ativo, mostra todos
      const matchSearch = !search || item.title.toLowerCase().includes(search) || item.episode.toLowerCase().includes(search);
      
      return matchDate && matchType && matchStatus && matchSearch;
    }).forEach(item => {
      const ep = document.createElement('div');
      const posterURL = item.poster ? `https://image.tmdb.org/t/p/w185${item.poster}` : 'https://placehold.co/40x60/363636/DDDDDD?text=No+Poster';
      const backdropURL = item.backdrop ? `https://image.tmdb.org/t/p/w500${item.backdrop}` : '';

      ep.className = `item relative flex flex-col rounded-xl overflow-hidden m-1 shadow-md
        transition-transform duration-200 hover:scale-[1.02] cursor-pointer
        ${item.status === 'Atualizado' ? 'border-l-4 border-[var(--md-sys-color-primary)]' : ''}
        ${item.status === 'Hoje' ? 'border-l-4 border-[var(--md-sys-color-tertiary)]' : ''}
        ${item.status === 'Futuro' ? 'border-l-4 border-[var(--md-sys-color-secondary)]' : ''}
        ${item.status === 'Atrasado' ? 'border-l-4 border-[var(--md-sys-color-error)]' : ''}
      `;
      ep.innerHTML = `
        <div class="relative w-full h-[140px] overflow-hidden rounded-t-xl">
          ${backdropURL ? `<img class="absolute inset-0 w-full h-full object-cover opacity-60" src="${backdropURL}" alt="Backdrop de ${item.title}">` : `<div class="absolute inset-0 w-full h-full bg-[var(--md-sys-color-surface-container-high)]"></div>`}
          <div class="absolute inset-0 bg-gradient-to-t from-[var(--md-sys-color-surface-container-high)] to-transparent"></div>
          <img class="absolute left-2 bottom-2 w-20 h-32 object-cover flex-shrink-0 rounded-lg shadow-md border-2 border-[var(--md-sys-color-outline-variant)]" src="${posterURL}" alt="Poster de ${item.title}">
        </div>
        <div class="content p-2 flex flex-col justify-end flex-grow mt-[-60px] z-10 bg-[var(--md-sys-color-surface-container-high)] rounded-b-xl">
          <div class="title font-bold text-[var(--md-sys-color-on-surface)] text-base mb-0.5 leading-tight">${item.title}</div>
          <div class="episode text-[var(--md-sys-color-on-surface-variant)] text-sm leading-tight">${item.episode} (T${item.season}E${item.number})</div>
          <div class="status text-[var(--md-sys-color-on-surface-variant)] text-sm mt-1 leading-tight">${item.status}</div>
        </div>
      `;
      dayEl.appendChild(ep);
    });

    calendarElement.appendChild(dayEl);
  });

  // Garante que o estado inicial dos botões ativos seja configurado na renderização inicial
  // para os botões do modal e período, pois eles controlam o filtro agora
  document.querySelectorAll('#filterModal .filters button[data-type]').forEach(b => {
    const activeType = document.querySelector('#filterModal .filters button[data-type].active')?.dataset.type;
    updateButtonActiveState(b, b.dataset.type === activeType);
  });
  document.querySelectorAll('#filterModal .filters button[data-status]').forEach(b => {
    const activeStatuses = [...document.querySelectorAll('#filterModal .filters button[data-status].active')].map(btn => btn.dataset.status);
    updateButtonActiveState(b, activeStatuses.includes(b.dataset.status));
  });
  document.querySelectorAll('.period button.active').forEach(b => updateButtonActiveState(b, true));
}

// Inicia a busca de dados e a renderização
fetchData();
