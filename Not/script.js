const newsContainer = document.querySelector('.news-articles');
const loadingMessage = document.getElementById('loading-message');
const errorMessage = document.createElement('p');
errorMessage.id = 'error-message';

function fetchNews() {
    fetch('https://rss.app/feeds/oXAvfy93n2v1WNW4.xml')
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao buscar notícias.');
            }
            return response.text();
        })
        .then(str => new window.DOMParser().parseFromString(str, "text/xml"))
        .then(data => {
            const items = data.querySelectorAll("item");
            if (items.length === 0) {
                throw new Error('Nenhuma notícia encontrada.');
            }
            let html = ``;
            items.forEach(el => {
                const title = el.querySelector("title").textContent;
                const link = el.querySelector("link").textContent;
                const description = el.querySelector("description").textContent;

                html += `
                  <article class="news-article">
                    <h2 class="article-title"><a href="${link}" target="_blank" rel="noopener noreferrer">${title}</a></h2>
                    <p class="article-summary">${description}</p>
                    <a href="${link}" class="read-more" target="_blank" rel="noopener noreferrer">Leia Mais</a>
                  </article>
                `;
            });
            newsContainer.innerHTML = html;
        })
        .catch(error => {
            errorMessage.textContent = `Erro ao carregar notícias: ${error.message}`;
            newsContainer.innerHTML = '';
            newsContainer.appendChild(errorMessage);
        })
        .finally(() => {
            loadingMessage.style.display = 'none';
        });
}

fetchNews();