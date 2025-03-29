const apiKey = '5e5da432e96174227b25086fe8637985'; // Insira sua chave de API aqui
const baseUrlImagem = 'https://image.tmdb.org/t/p/w500';
const idioma = 'pt-BR';
const regiao = 'BR'; // Código de país para o Brasil

const opcoesSorteio = document.getElementById('opcoesSorteio');
const sortearFilmeBtn = document.getElementById('sortearFilmeBtn');
const sortearSerieBtn = document.getElementById('sortearSerieBtn');
const sortearSeriePopularBtn = document.getElementById('sortearSeriePopularBtn');
const sortearSerieTopRatedBtn = document.getElementById('sortearSerieTopRatedBtn');

const tituloImagem = document.querySelector('.titulo-imagem');
const tituloContainer = document.querySelector('.titulo-container');
const seriesCategorias = document.querySelector('.series-categorias');

const handleTituloClick = () => {
    opcoesSorteio.style.display = 'flex';
    seriesCategorias.style.display = 'flex';
    tituloContainer.classList.add('titulo-container-top');
    tituloImagem.removeEventListener('click', handleTituloClick); // Remove o listener após o primeiro clique
};

tituloImagem.addEventListener('click', handleTituloClick);

async function mostrarDetalhesFilme(filmeId) {
    const detalhesUrl = `https://api.themoviedb.org/3/movie/${filmeId}?api_key=${apiKey}&language=${idioma}`;
    const watchProvidersUrl = `https://api.themoviedb.org/3/movie/${filmeId}/watch/providers?api_key=${apiKey}&language=${idioma}`;
    try {
        const respostaDetalhes = await fetch(detalhesUrl);
        const dataDetalhes = await respostaDetalhes.json();

        const respostaProviders = await fetch(watchProvidersUrl);
        const dataProviders = await respostaProviders.json();

        if (dataDetalhes) {
            const dataLancamento = dataDetalhes.release_date ? new Date(dataDetalhes.release_date).toLocaleDateString() : 'Não informado';
            const duracao = dataDetalhes.runtime ? `${dataDetalhes.runtime} minutos` : 'Não informada';

            let htmlDetalhes = `<p>${dataDetalhes.overview || 'Sinopse não disponível.'}</p>`;
            htmlDetalhes += `<p><strong>Data de Lançamento:</strong> ${dataLancamento}</p>`;
            htmlDetalhes += `<p><strong>Duração:</strong> ${duracao}</p>`;

            if (dataProviders && dataProviders.results && dataProviders.results[regiao]) {
                const providers = dataProviders.results[regiao];
                let ondeAssistir = '<p><strong>Onde assistir:</strong></p><ul>';
                if (providers.flatrate) {
                    providers.flatrate.forEach(provider => {
                        ondeAssistir += `<li>${provider.provider_name} (Streaming)</li>`;
                    });
                }
                if (providers.rent) {
                    providers.rent.forEach(provider => {
                        ondeAssistir += `<li>${provider.provider_name} (Aluguel)</li>`;
                    });
                }
                if (providers.buy) {
                    providers.buy.forEach(provider => {
                        ondeAssistir += `<li>${provider.provider_name} (Compra)</li>`;
                    });
                }
                ondeAssistir += '</ul>';
                htmlDetalhes += ondeAssistir;
            } else {
                htmlDetalhes += '<p><strong>Onde assistir:</strong> Informação não disponível para o Brasil.</p>';
            }

            Swal.fire({
                title: dataDetalhes.title || dataDetalhes.original_title,
                imageUrl: dataDetalhes.poster_path ? baseUrlImagem + dataDetalhes.poster_path : 'imagem_nao_disponivel.png',
                imageAlt: `Pôster de ${dataDetalhes.title || dataDetalhes.original_title}`,
                html: htmlDetalhes,
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
    const watchProvidersUrl = `https://api.themoviedb.org/3/tv/${serieId}/watch/providers?api_key=${apiKey}&language=${idioma}`;
    try {
        const respostaDetalhes = await fetch(detalhesUrl);
        const dataDetalhes = await respostaDetalhes.json();

        const respostaProviders = await fetch(watchProvidersUrl);
        const dataProviders = await respostaProviders.json();

        if (dataDetalhes) {
            const dataLancamento = dataDetalhes.first_air_date ? new Date(dataDetalhes.first_air_date).toLocaleDateString() : 'Não informado';
            // Séries não têm duração única como filmes

            let htmlDetalhes = `<p>${dataDetalhes.overview || 'Sinopse não disponível.'}</p>`;
            htmlDetalhes += `<p><strong>Data de Lançamento:</strong> ${dataLancamento}</p>`;

            if (dataProviders && dataProviders.results && dataProviders.results[regiao]) {
                const providers = dataProviders.results[regiao];
                let ondeAssistir = '<p><strong>Onde assistir:</strong></p><ul>';
                if (providers.flatrate) {
                    providers.flatrate.forEach(provider => {
                        ondeAssistir += `<li>${provider.provider_name} (Streaming)</li>`;
                    });
                }
                if (providers.rent) {
                    providers.rent.forEach(provider => {
                        ondeAssistir += `<li>${provider.provider_name} (Aluguel)</li>`;
                    });
                }
                if (providers.buy) {
                    providers.buy.forEach(provider => {
                        ondeAssistir += `<li>${provider.provider_name} (Compra)</li>`;
                    });
                }
                ondeAssistir += '</ul>';
                htmlDetalhes += ondeAssistir;
            } else {
                htmlDetalhes += '<p><strong>Onde assistir:</strong> Informação não disponível para o Brasil.</p>';
            }

            Swal.fire({
                title: dataDetalhes.name || dataDetalhes.original_name,
                imageUrl: dataDetalhes.poster_path ? baseUrlImagem + dataDetalhes.poster_path : 'imagem_nao_disponivel.png',
                imageAlt: `Pôster de ${dataDetalhes.name || dataDetalhes.original_name}`,
                html: htmlDetalhes,
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
    Swal.fire({
        title: 'Sorteando...',
        html: 'Carregando...', // Texto de carregamento simples
        showConfirmButton: false,
        allowOutsideClick: false,
        customClass: {
            popup: 'swal2-popup'
        }
    });
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
            Swal.close();
            mostrarDetalhesFilme(filmeSorteado.id);
        } else {
            Swal.close();
            Swal.fire('Ops!', 'Não foi possível sortear um filme.', 'info');
        }
    } catch (error) {
        console.error("Erro ao sortear filme:", error);
        Swal.close();
        Swal.fire('Erro', 'Erro ao sortear filme.', 'error');
    }
}

async function sortearSerie(categoria = 'discover') {
    Swal.fire({
        title: 'Sorteando...',
        html: 'Carregando...', // Texto de carregamento simples
        showConfirmButton: false,
        allowOutsideClick: false,
        customClass: {
            popup: 'swal2-popup'
        }
    });
    try {
        let url = '';
        let numPages = 20;

        switch (categoria) {
            case 'popular':
                url = `https://api.themoviedb.org/3/tv/popular?api_key=${apiKey}&language=${idioma}&page=`;
                break;
            case 'top_rated':
                url = `https://api.themoviedb.org/3/tv/top_rated?api_key=${apiKey}&language=${idioma}&page=`;
                break;
            case 'discover':
            default:
                url = `https://api.themoviedb.org/3/discover/tv?api_key=${apiKey}&language=${idioma}&sort_by=first_air_date.desc&page=`;
                break;
        }

        let allSeries = [];
        for (let page = 1; page <= numPages; page++) {
            const resposta = await fetch(url + page);
            const data = await resposta.json();
            if (data.results) {
                for (let i = 0; i < data.results.length; i++) {
                    if (data.results[i].poster_path && (data.results[i].name || data.results[i].original_name) && data.results[i].overview && !data.results[i].genre_ids.includes(16)) {
                        allSeries.push(data.results[i]);
                    }
                }
            }
        }

        if (allSeries.length > 0) {
            const serieSorteada = allSeries[Math.floor(Math.random() * allSeries.length)];
            Swal.close();
            mostrarDetalhesSerie(serieSorteada.id);
        } else {
            Swal.close();
            Swal.fire('Ops!', 'Não foi possível sortear uma série com os critérios definidos.', 'info');
        }
    } catch (error) {
        console.error("Erro ao sortear série:", error);
        Swal.close();
        Swal.fire('Erro', 'Erro ao sortear série.', 'error');
    }
}

async function sortearSeriePopular() {
    sortearSerie('popular');
}

async function sortearSerieTopRated() {
    sortearSerie('top_rated');
}

sortearFilmeBtn.addEventListener('click', sortearFilme);
sortearSerieBtn.addEventListener('click', () => sortearSerie('discover'));
sortearSeriePopularBtn.addEventListener('click', sortearSeriePopular);
sortearSerieTopRatedBtn.addEventListener('click', sortearSerieTopRated);