const feedContainer = document.getElementById('rss-feed');
const feedsFile = 'feeds.txt'; // Nome do arquivo com os URLs dos feeds

async function loadFeedList() {
    try {
        const response = await fetch(feedsFile);
        if (!response.ok) {
            throw new Error(`Erro ao buscar o arquivo de feeds: ${response.status}`);
        }
        const text = await response.text();
        const feedUrls = text.split('\n').map(url => url.trim()).filter(url => url !== '');
        return feedUrls;
    } catch (error) {
        console.error('Erro ao carregar a lista de feeds:', error);
        feedContainer.innerHTML = `<p class="error">Não foi possível carregar a lista de feeds (${feedsFile}). Certifique-se de que o arquivo existe na mesma pasta.</p>`;
        return [];
    }
}

async function loadAndDisplayFeeds() {
    const feedUrls = await loadFeedList();
    if (feedUrls.length > 0) {
        const allFeedItems = [];
        for (const url of feedUrls) {
            try {
                const response = await fetch(url);
                if (!response.ok) {
                    console.error(`Erro ao buscar o feed ${url}: ${response.status}`);
                    continue;
                }
                const xmlText = await response.text();
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
                const feedItems = parseFeed(xmlDoc);
                allFeedItems.push(...feedItems);
            } catch (error) {
                console.error(`Erro ao carregar o feed ${url}:`, error);
            }
        }

        allFeedItems.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
        displayFeedItems(allFeedItems);
    } else if (feedContainer.innerHTML.includes('Carregando feeds...')) {
        feedContainer.innerHTML = '<p>Nenhum feed para carregar.</p>';
    }
}

function parseFeed(xmlDoc) {
    const items = xmlDoc.querySelectorAll('item');
    const feedItems = [];
    items.forEach(item => {
        const title = item.querySelector('title')?.textContent || 'Sem título';
        const link = item.querySelector('link')?.textContent || '#';
        const description = item.querySelector('description')?.textContent || '';
        const pubDate = item.querySelector('pubDate')?.textContent;
        feedItems.push({ title, link, description, pubDate });
    });
    return feedItems;
}

function displayFeedItems(items) {
    feedContainer.innerHTML = ''; // Limpa o container

    const showNewsDetails = (item) => {
        Swal.fire({
            title: item.title,
            html: `
                ${item.pubDate ? `<p style="color: #ccc; border-radius: 30px; font-size: 0.9em; margin-bottom: 10px;">Publicado em: ${new Date(item.pubDate).toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' })}</p>` : ''}
                <div style="color: #eee; line-height: 1.6; margin-bottom: 20px; text-align: left; border-radius: 70px;">${item.description}</div>
                <p><a href="${item.link}" target="_blank" style="color: #593BA2; text-decoration: none;">Ler notícia completa</a></p>
            `,
            confirmButtonText: 'Fechar',
            confirmButtonColor: '#593BA2', // Cor inspirada no seu tema
            background: '#282828', // Fundo escuro
            color: '#fff', // Cor do texto
        });
    };

    items.forEach(item => {
        const ball = document.createElement('div');
        ball.classList.add('news-ball');
        ball.dataset.title = item.title;
        ball.dataset.link = item.link;
        ball.dataset.description = item.description;
        ball.dataset.pubDate = item.pubDate;

        // Adicionar a imagem de enfeite
        const decorationDiv = document.createElement('div');
        decorationDiv.classList.add('ball-decoration');
        // Aqui você pode colocar a lógica para escolher diferentes imagens ou usar uma imagem padrão
        decorationDiv.innerHTML = '<img src="p2.png" alt="Decoração">';
        ball.appendChild(decorationDiv);

        const titleElement = document.createElement('h3');
        titleElement.classList.add('ball-title');
        titleElement.textContent = item.title;
        ball.appendChild(titleElement);

        const descriptionElement = document.createElement('p');
        descriptionElement.classList.add('ball-description');
        descriptionElement.innerHTML = item.description;
        ball.appendChild(descriptionElement);

        const dateElement = document.createElement('p');
        dateElement.classList.add('ball-date');
        if (item.pubDate) {
            const pubDate = new Date(item.pubDate);
            const formattedDate = pubDate.toLocaleDateString('pt-BR', { month: 'short', day: 'numeric', year: 'numeric' });
            dateElement.textContent = formattedDate;
        }
        ball.appendChild(dateElement);

        ball.addEventListener('click', () => {
            showNewsDetails(item);
        });

        feedContainer.appendChild(ball);
    });

    let observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('jump-forward');
                observer.unobserve(entry.target);
            } else {
                entry.target.classList.remove('jump-forward');
            }
        });
    }, {
        rootMargin: '-20% 0px -20% 0px',
    });

    const balls = document.querySelectorAll('.news-ball');
    balls.forEach(ball => {
        observer.observe(ball);
    });
}

// Inicia o carregamento dos feeds quando a página é carregada
loadAndDisplayFeeds();