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

let filmesSorteados = [];
let seriesSorteadas = [];

// Garantindo que o ouvinte de clique esteja aqui
tituloImagem.addEventListener('click', () => {
    console.log('A imagem do título foi clicada!'); // Para verificar no console
    opcoesSorteio.style.display = 'flex';
    seriesCategorias.style.display = 'flex';
    tituloContainer.classList.add('titulo-container-top');
});

// Mapeamento de nomes de provedores para classes de ícones do Font Awesome (adicione mais conforme necessário)
const providerIcons = {
    'Netflix': 'fa-brands fa-netflix',
    'Amazon Prime Video': 'fa-brands fa-amazon',
    'Disney+': 'fa-brands fa-disney',
    'HBO Max': 'fa-solid fa-play', // Exemplo, procure um ícone melhor se houver
    // Adicione outros provedores e suas classes de ícones aqui
};

async function fetchData(url) {
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (!response.ok) {
            throw new Error(`Erro ao buscar dados: ${response.status}`);
        }
        return data.results || [];
    } catch (error) {
        console.error("Erro ao buscar dados:", error);
        Swal.fire('Erro', 'Erro ao buscar dados do servidor.', 'error');
        return [];
    }
}

async function mostrarDetalhesFilme(filmeId) {
    console.log('Mostrar detalhes do filme com ID:', filmeId);
    const detalhesUrl = `https://api.themoviedb.org/3/movie/${filmeId}?api_key=${apiKey}&language=${idioma}`;
    const watchProvidersUrl = `https://api.themoviedb.org/3/movie/${filmeId}/watch/providers?api_key=${apiKey}&language=${idioma}`;
    const creditsUrl = `https://api.themoviedb.org/3/movie/${filmeId}/credits?api_key=${apiKey}&language=${idioma}`;
    try {
        const respostaDetalhes = await fetch(detalhesUrl);
        const dataDetalhes = await respostaDetalhes.json();
        console.log('Detalhes do Filme:', dataDetalhes);

        const respostaProviders = await fetch(watchProvidersUrl);
        const dataProviders = await respostaProviders.json();
        console.log('Provedores do Filme:', dataProviders);

        const respostaCredits = await fetch(creditsUrl);
        const dataCredits = await respostaCredits.json();
        console.log('Créditos do Filme:', dataCredits);

        if (dataDetalhes) {
            const dataLancamento = dataDetalhes.release_date ? new Date(dataDetalhes.release_date).toLocaleDateString() : 'Não informado';
            const duracao = dataDetalhes.runtime ? `${dataDetalhes.runtime} minutos` : 'Não informada';

            let htmlDetalhes = `<p>${dataDetalhes.overview || 'Sinopse não disponível.'}</p>`;
            htmlDetalhes += `<p><strong>Data de Lançamento:</strong> ${dataLancamento}</p>`;
            htmlDetalhes += `<p><strong>Duração:</strong> ${duracao}</p>`;

            if (dataCredits && dataCredits.cast && dataCredits.cast.length > 0) {
                let elencoHTML = '<p><strong>Elenco:</strong></p><div style="display: flex; overflow-x: auto;">';
                dataCredits.cast.slice(0, 10).forEach(ator => { // Mostrar até 10 atores
                    const fotoUrl = ator.profile_path ? baseUrlImagem + ator.profile_path : 'p2.png'; // Use uma imagem padrão se não houver foto
                    elencoHTML += `<div style="margin-right: 10px; text-align: center;">
                                    <img src="${fotoUrl}" alt="${ator.name}" style="width: 70px; height: 70px; border-radius: 50%; object-fit: cover; margin-bottom: 5px;">
                                    <p style="font-size: 0.8em;">${ator.name}</p>
                                </div>`;
                });
                elencoHTML += '</div>';
                htmlDetalhes += elencoHTML;
            }

            if (dataProviders && dataProviders.results && dataProviders.results[regiao]) {
                const providers = dataProviders.results[regiao];
                let ondeAssistir = '<p><strong>Onde assistir:</strong></p><div style="display: flex; flex-wrap: wrap; gap: 10px;">';
                const addProviders = (providerArray, type) => {
                    if (providerArray) {
                        providerArray.forEach(provider => {
                            const iconClass = providerIcons[provider.provider_name];
                            if (iconClass) {
                                ondeAssistir += `<i class="${iconClass}" title="${provider.provider_name} (${type})" style="font-size: 1.5em;"></i>`;
                            } else {
                                ondeAssistir += `<span title="${provider.provider_name} (${type})">${provider.provider_name}</span>`;
                            }
                        });
                    }
                };
                addProviders(providers.flatrate, 'Streaming');
                addProviders(providers.rent, 'Aluguel');
                addProviders(providers.buy, 'Compra');
                ondeAssistir += '</div>';
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
    console.log('Mostrar detalhes da série com ID:', serieId);
    const detalhesUrl = `https://api.themoviedb.org/3/tv/${serieId}?api_key=${apiKey}&language=${idioma}`;
    const watchProvidersUrl = `https://api.themoviedb.org/3/tv/${serieId}/watch/providers?api_key=${apiKey}&language=${idioma}`;
    const creditsUrl = `https://api.themoviedb.org/3/tv/${serieId}/credits?api_key=${apiKey}&language=${idioma}`;
    try {
        const respostaDetalhes = await fetch(detalhesUrl);
        const dataDetalhes = await respostaDetalhes.json();
        console.log('Detalhes da Série:', dataDetalhes);

        const respostaProviders = await fetch(watchProvidersUrl);
        const dataProviders = await respostaProviders.json();
        console.log('Provedores da Série:', dataProviders);

        const respostaCredits = await fetch(creditsUrl);
        const dataCredits = await respostaCredits.json();
        console.log('Créditos da Série:', dataCredits);

        if (dataDetalhes) {
            const dataLancamento = dataDetalhes.first_air_date ? new Date(dataDetalhes.first_air_date).toLocaleDateString() : 'Não informado';
            // Séries não têm duração única como filmes

            let htmlDetalhes = `<p>${dataDetalhes.overview || 'Sinopse não disponível.'}</p>`;
            htmlDetalhes += `<p><strong>Data de Lançamento:</strong> ${dataLancamento}</p>`;

            if (dataCredits && dataCredits.cast && dataCredits.cast.length > 0) {
                let elencoHTML = '<p><strong>Elenco:</strong></p><div style="display: flex; overflow-x: auto;">';
                dataCredits.cast.slice(0, 10).forEach(ator => { // Mostrar até 10 atores
                    const fotoUrl = ator.profile_path ? baseUrlImagem + ator.profile_path : 'p2.png'; // Use uma imagem padrão se não houver foto
                    elencoHTML += `<div style="margin-right: 10px; text-align: center;">
                                    <img src="${fotoUrl}" alt="${ator.name}" style="width: 70px; height: 70px; border-radius: 50%; object-fit: cover; margin-bottom: 5px;">
                                    <p style="font-size: 0.8em;">${ator.name}</p>
                                </div>`;
                });
                elencoHTML += '</div>';
                htmlDetalhes += elencoHTML;
            }

            if (dataProviders && dataProviders.results && dataProviders.results[regiao]) {
                const providers = dataProviders.results[regiao];
                let ondeAssistir = '<p><strong>Onde assistir:</strong></p><div style="display: flex; flex-wrap: wrap; gap: 10px;">';
                const addProviders = (providerArray, type) => {
                    if (providerArray) {
                        providerArray.forEach(provider => {
                            const iconClass = providerIcons[provider.provider_name];
                            if (iconClass) {
                                ondeAssistir += `<i class="${iconClass}" title="${provider.provider_name} (${type})" style="font-size: 1.5em;"></i>`;
                            } else {
                                ondeAssistir += `<span title="${provider.provider_name} (${type})">${provider.provider_name}</span>`;
                            }
                        });
                    }
                };
                addProviders(providers.flatrate, 'Streaming');
                addProviders(providers.rent, 'Aluguel');
                addProviders(providers.buy, 'Compra');
                ondeAssistir += '</div>';
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
    Swal.fire({ title: 'Sorteando...', html: 'Carregando...', showConfirmButton: false, allowOutsideClick: false, customClass: { popup: 'swal2-popup' } });
    try {
        const numPages = 5;
        let allFilmes = [];
        for (let page = 1; page <= numPages; page++) {
            const url = `https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&language=${idioma}&page=${page}`;
            const results = await fetchData(url);
            allFilmes = allFilmes.concat(results);
        }

        if (allFilmes.length > 0) {
            let filmeSorteado;
            let tentativas = 0;
            const maxTentativas = allFilmes.length;
            do {
                filmeSorteado = allFilmes[Math.floor(Math.random() * allFilmes.length)];
                tentativas++;
                if (tentativas > maxTentativas) {
                    Swal.close();
                    Swal.fire('Ops!', 'Não foi possível sortear um filme inédito (todos já foram mostrados).', 'info');
                    return;
                }
            } while (filmesSorteados.includes(filmeSorteado.id));
            filmesSorteados.push(filmeSorteado.id);
            setBackgroundPoster(filmeSorteado.poster_path);
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
    Swal.fire({ title: 'Sorteando...', html: 'Carregando...', showConfirmButton: false, allowOutsideClick: false, customClass: { popup: 'swal2-popup' } });
    try {
        let urlBase = '';
        let params = '';
        let numPages = 20;

        switch (categoria) {
            case 'popular':
                urlBase = `https://api.themoviedb.org/3/tv/popular`;
                params = `api_key=${apiKey}&language=${idioma}&page=`;
                break;
            case 'top_rated':
                urlBase = `https://api.themoviedb.org/3/tv/top_rated`;
                params = `api_key=${apiKey}&language=${idioma}&page=`;
                break;
            case 'discover':
            default:
                urlBase = `https://api.themoviedb.org/3/discover/tv`;
                params = `api_key=${apiKey}&language=${idioma}&sort_by=first_air_date.desc&page=`;
                break;
        }

        let allSeries = [];
        for (let page = 1; page <= numPages; page++) {
            const url = `${urlBase}?${params}${page}`;
            const results = await fetchData(url);
            results.forEach(serie => {
                if (serie.poster_path && (serie.name || serie.original_name) && serie.overview && !serie.genre_ids.includes(16)) {
                    allSeries.push(serie);
                }
            });
        }

        if (allSeries.length > 0) {
            let serieSorteada;
            let tentativas = 0;
            const maxTentativas = allSeries.length;
            do {
                serieSorteada = allSeries[Math.floor(Math.random() * allSeries.length)];
                tentativas++;
                if (tentativas > maxTentativas) {
                    Swal.close();
                    Swal.fire('Ops!', 'Não foi possível sortear uma série inédita (todas já foram mostradas).', 'info');
                    return;
                }
            } while (seriesSorteadas.includes(serieSorteada.id));
            seriesSorteadas.push(serieSorteada.id);
            setBackgroundPoster(serieSorteada.poster_path);
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

async function setInitialButtonBackground(buttonElement, apiUrl) {
    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        if (data.results && data.results.length > 0 && buttonElement) {
            const posterPath = data.results[0].poster_path;
            buttonElement.style.backgroundImage = `url("${baseUrlImagem}${posterPath}")`;
            buttonElement.style.backgroundSize = 'cover';
            buttonElement.style.backgroundRepeat = 'no-repeat';
            buttonElement.style.color = '#fff'; // Adjust as needed
        }
    } catch (error) {
        console.error(`Erro ao buscar pôster inicial para ${buttonElement.id}:`, error);
    }
}

async function setInitialButtonBackgrounds() {
    setInitialButtonBackground(sortearFilmeBtn, `https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&language=${idioma}&page=1`);
    setInitialButtonBackground(sortearSerieBtn, `https://api.themoviedb.org/3/discover/tv?api_key=${apiKey}&language=${idioma}&sort_by=first_air_date.desc&page=1`);
    setInitialButtonBackground(sortearSeriePopularBtn, `https://api.themoviedb.org/3/tv/popular?api_key=${apiKey}&language=${idioma}&page=1`);
    setInitialButtonBackground(sortearSerieTopRatedBtn, `https://api.themoviedb.org/3/tv/top_rated?api_key=${apiKey}&language=${idioma}&page=1`);
}

function setBackgroundPoster(posterPath) {
    if (posterPath) {
        document.body.style.backgroundImage = `url("${baseUrlImagem}${posterPath}")`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundRepeat = 'no-repeat';
        document.body.style.backgroundAttachment = 'fixed'; // Para manter o fundo fixo durante a rolagem
    } else {
        document.body.style.backgroundImage = ''; // Remove o fundo
    }
}

// Inicializar os fundos dos botões
document.addEventListener('DOMContentLoaded', function() {
    setInitialButtonBackgrounds();
});
