const apiKey = '5e5da432e96174227b25086fe8637985'; // Insira sua chave de API aqui
const baseUrlImagem = 'https://image.tmdb.org/t/p/w500';
const idioma = 'pt-BR';

const sorteioBtn = document.getElementById('sorteioBtn');
const opcoesSorteio = document.getElementById('opcoesSorteio');
const sortearFilmeBtn = document.getElementById('sortearFilmeBtn');
const sortearSerieBtn = document.getElementById('sortearSerieBtn');

let sorteioOpcoesVisiveis = false;

sorteioBtn.addEventListener('click', () => {
    sorteioOpcoesVisiveis = !sorteioOpcoesVisiveis;
    opcoesSorteio.style.display = sorteioOpcoesVisiveis ? 'block' : 'none';
    sortearFilmeBtn.style.display = sorteioOpcoesVisiveis ? 'inline-block' : 'none';
    sortearSerieBtn.style.display = sorteioOpcoesVisiveis ? 'inline-block' : 'none';
});

window.addEventListener('scroll', () => {
    if (sorteioOpcoesVisiveis) {
        opcoesSorteio.style.display = 'none';
        sortearFilmeBtn.style.display = 'none';
        sortearSerieBtn.style.display = 'none';
        sorteioOpcoesVisiveis = false;
    }
});

async function buscarSugestoesTMDb() {
    try {
        const filmesPopularesUrl = `https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&language=${idioma}&page=1`;
        const seriesPopularesUrl = `https://api.themoviedb.org/3/tv/popular?api_key=${apiKey}&language=${idioma}&page=1`;

        const respostaFilmes = await fetch(filmesPopularesUrl);
        const dataFilmes = await respostaFilmes.json();

        const respostaSeries = await fetch(seriesPopularesUrl);
        const dataSeries = await respostaSeries.json();

        if (dataFilmes.results && dataSeries.results) {
            exibirFilmes(dataFilmes.results);
            exibirSeries(dataSeries.results);
        } else {
            document.getElementById("filmes-container").innerHTML = "<p>Erro ao carregar filmes.</p>";
            document.getElementById("series-container").innerHTML = "<p>Erro ao carregar séries.</p>";
        }
    } catch (error) {
        console.error("Erro ao buscar sugestões do TMDb:", error);
        document.getElementById("filmes-container").innerHTML = "<p>Erro ao buscar filmes.</p>";
        document.getElementById("series-container").innerHTML = "<p>Erro ao buscar séries.</p>";
    }
}

function exibirFilmes(filmes) {
    const container = document.getElementById("filmes-container");
    container.innerHTML = "";

    if (filmes && filmes.length > 0) {
        filmes.forEach(filme => {
            const card = document.createElement("div");
            card.classList.add("card");
            card.dataset.filmeId = filme.id;
            const titulo = filme.title || filme.original_title;
            const posterPath = filme.poster_path ? baseUrlImagem + filme.poster_path : 'imagem_nao_disponivel.png';
            const nota = filme.vote_average ? (filme.vote_average * 10).toFixed(0) + '%' : 'N/A';

            card.innerHTML = `
                <img src="${posterPath}" alt="Pôster de ${titulo}">
                <h3 class="titulo">${titulo}</h3>
                <p class="nota">Nota: ${nota}</p>
            `;
            card.addEventListener('click', () => mostrarDetalhesFilme(filme.id));
            container.appendChild(card);
        });
    } else {
        container.innerHTML = "<p>Nenhuma sugestão de filme encontrada.</p>";
    }
}

function exibirSeries(series) {
    const container = document.getElementById("series-container");
    container.innerHTML = "";

    if (series && series.length > 0) {
        series.forEach(serie => {
            const card = document.createElement("div");
            card.classList.add("card");
            card.dataset.serieId = serie.id;
            const titulo = serie.name || serie.original_name;
            const posterPath = serie.poster_path ? baseUrlImagem + serie.poster_path : 'imagem_nao_disponivel.png';
            const nota = serie.vote_average ? (serie.vote_average * 10).toFixed(0) + '%' : 'N/A';

            card.innerHTML = `
                <img src="${posterPath}" alt="Pôster de ${titulo}">
                <h3 class="titulo">${titulo}</h3>
                <p class="nota">Nota: ${nota}</p>
            `;
            card.addEventListener('click', () => mostrarDetalhesSerie(serie.id));
            container.appendChild(card);
        });
    } else {
        container.innerHTML = "<p>Nenhuma sugestão de série encontrada.</p>";
    }
}

async function mostrarDetalhesFilme(filmeId) {
    const detalhesUrl = `https://api.themoviedb.org/3/movie/${filmeId}?api_key=${apiKey}&language=${idioma}`;
    try {
        const resposta = await fetch(detalhesUrl);
        const data = await resposta.json();
        if (data) {
            Swal.fire({
                title: data.title || data.original_title,
                imageUrl: data.poster_path ? baseUrlImagem + data.poster_path : 'imagem_nao_disponivel.png',
                imageAlt: `Pôster de ${data.title || data.original_title}`,
                text: data.overview || 'Sinopse não disponível.',
                confirmButtonColor: '#593BA2',
                customClass: {
                    popup: 'swal2-popup'
                }
            });
        } else {
            Swal.fire('Erro', 'Não foi possível carregar os detalhes do filme.', 'error');
        }
    } catch (error) {
        console.error("Erro ao buscar detalhes do filme:", error);
        Swal.fire('Erro', 'Erro ao buscar os detalhes do filme.', 'error');
    }
}

async function mostrarDetalhesSerie(serieId) {
    const detalhesUrl = `https://api.themoviedb.org/3/tv/${serieId}?api_key=${apiKey}&language=${idioma}`;
    try {
        const resposta = await fetch(detalhesUrl);
        const data = await resposta.json();
        if (data) {
            Swal.fire({
                title: data.name || data.original_name,
                imageUrl: data.poster_path ? baseUrlImagem + data.poster_path : 'imagem_nao_disponivel.png',
                imageAlt: `Pôster de ${data.name || data.original_name}`,
                text: data.overview || 'Sinopse não disponível.',
                confirmButtonColor: '#593BA2',
                customClass: {
                    popup: 'swal2-popup'
                }
            });
        } else {
            Swal.fire('Erro', 'Não foi possível carregar os detalhes da série.', 'error');
        }
    } catch (error) {
        console.error("Erro ao buscar detalhes da série:", error);
        Swal.fire('Erro', 'Erro ao buscar os detalhes da série.', 'error');
    }
}

async function sortearFilme() {
    try {
        const numPages = 5;
        let allFilmes = [];
        for (let page = 1; page <= numPages; page++) {
            const url = `https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&language=${idioma}&page=${page}`;
            const resposta = await fetch(url);
            const data = await resposta.json();
            if (data.results) {
                allFilmes = allFilmes.concat(data.results);
            }
        }

        if (allFilmes.length > 0) {
            const filmeSorteado = allFilmes[Math.floor(Math.random() * allFilmes.length)];
            mostrarDetalhesFilme(filmeSorteado.id);
        } else {
            Swal.fire('Ops!', 'Não foi possível sortear um filme.', 'info');
        }
    } catch (error) {
        console.error("Erro ao sortear filme:", error);
        Swal.fire('Erro', 'Erro ao sortear filme.', 'error');
    }
}

async function sortearSerie() {
    try {
        const numPages = 5;
        let allSeries = [];
        for (let page = 1; page <= numPages; page++) {
            const url = `https://api.themoviedb.org/3/tv/popular?api_key=${apiKey}&language=${idioma}&page=${page}`;
            const resposta = await fetch(url);
            const data = await resposta.json();
            if (data.results) {
                allSeries = allSeries.concat(data.results);
            }
        }

        if (allSeries.length > 0) {
            const serieSorteada = allSeries[Math.floor(Math.random() * allSeries.length)];
            mostrarDetalhesSerie(serieSorteada.id);
        } else {
            Swal.fire('Ops!', 'Não foi possível sortear uma série.', 'info');
        }
    } catch (error) {
        console.error("Erro ao sortear série:", error);
        Swal.fire('Erro', 'Erro ao sortear série.', 'error');
    }
}

sortearFilmeBtn.addEventListener('click', sortearFilme);
sortearSerieBtn.addEventListener('click', sortearSerie);

buscarSugestoesTMDb();