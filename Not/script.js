const apiKey = '14d21c9c36a74609be8200f5a3d89bea';
const container = document.getElementById('news-container');
const searchInput = document.getElementById('search');
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modal-title');
const modalDesc = document.getElementById('modal-description');
const modalLink = document.getElementById('modal-link');
const modalClose = document.getElementById('modal-close');

async function fetchNews(query = 'cinema OR filmes OR séries') {
  container.innerHTML = '';
  const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=pt&apiKey=${apiKey}`;
  
  try {
    const res = await fetch(url);
    const data = await res.json();

    if (!Array.isArray(data.articles)) {
      container.innerHTML = '<p>Não foi possível carregar as notícias.</p>';
      return;
    }

    data.articles.slice(0, 10).forEach(article => {
      const div = document.createElement('div');
      div.className = 'news-item';
      div.innerHTML = `<h3>${article.title}</h3>`;
      div.onclick = () => showModal(article);
      container.appendChild(div);
    });
  } catch (error) {
    container.innerHTML = '<p>Erro ao buscar as notícias.</p>';
    console.error(error);
  }
}

function showModal(article) {
  modalTitle.textContent = article.title;
  modalDesc.textContent = article.description || 'Sem descrição.';
  modalLink.href = article.url;
  modal.classList.remove('hidden');
}

modalClose.onclick = () => modal.classList.add('hidden');

searchInput.addEventListener('keypress', e => {
  if (e.key === 'Enter') fetchNews(searchInput.value);
});

fetchNews();
