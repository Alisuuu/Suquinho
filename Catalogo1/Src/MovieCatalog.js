const API_KEY = '5e5da432e96174227b25086fe8637985';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w185';
const POSTER_BG_BASE_URL = 'https://image.tmdb.org/t/p/w500';

function MovieCatalog() {
  const [popularMovies, setPopularMovies] = React.useState([]);
  const [topRatedMovies, setTopRatedMovies] = React.useState([]);
  const [popularSeries, setPopularSeries] = React.useState([]);
  const [topRatedSeries, setTopRatedSeries] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [searchTerm, setSearchTerm] = React.useState('');
  const searchInputRef = React.useRef(null);

  React.useEffect(() => {
    fetchData(`${BASE_URL}/movie/popular?api_key=${API_KEY}&language=pt-BR`, setPopularMovies, 'popularMovies');
    fetchData(`${BASE_URL}/movie/top_rated?api_key=${API_KEY}&language=pt-BR`, setTopRatedMovies, 'topRatedMovies');
    fetchData(`${BASE_URL}/tv/popular?api_key=${API_KEY}&language=pt-BR`, setPopularSeries, 'popularSeries');
    fetchData(`${BASE_URL}/tv/top_rated?api_key=${API_KEY}&language=pt-BR`, setTopRatedSeries, 'topRatedSeries');
  }, []);

  const fetchData = async (url, setState, categoryName) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Erro ao buscar dados de ${categoryName}: ${response.status}`);
      const data = await response.json();
      let results = data.results;
      if (categoryName === 'popularMovies') {
        results = results.map(item => ({ ...item, media_type: 'movie' }));
        console.log("Dados de Filmes Populares (com media_type corrigido):", results);
      }
      setState(results);
      setLoading(false);
    } catch (error) {
      setError(error);
      setLoading(false);
      console.error(`Erro ao buscar dados de ${categoryName}:`, error);
    }
  };

  React.useEffect(() => {
    const fetchSearchedItems = async () => {
      if (searchTerm) {
        try {
          const response = await fetch(`${BASE_URL}/search/multi?api_key=${API_KEY}&language=pt-BR&query=${searchTerm}`);
          if (response.ok) {
            const data = await response.json();
            setPopularMovies(data.results.filter(item => item.media_type === 'movie'));
            setPopularSeries(data.results.filter(item => item.media_type === 'tv'));
          } else {
            console.error("Erro na busca:", response.status);
          }
        } catch (error) {
          console.error("Erro na busca:", error);
        }
      } else {
        fetchData(`${BASE_URL}/movie/popular?api_key=${API_KEY}&language=pt-BR`, setPopularMovies, 'popularMovies');
        fetchData(`${BASE_URL}/movie/top_rated?api_key=${API_KEY}&language=pt-BR`, setTopRatedMovies, 'topRatedMovies');
        fetchData(`${BASE_URL}/tv/popular?api_key=${API_KEY}&language=pt-BR`, setPopularSeries, 'popularSeries');
        fetchData(`${BASE_URL}/tv/top_rated?api_key=${API_KEY}&language=pt-BR`, setTopRatedSeries, 'topRatedSeries');
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchSearchedItems();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleSearchChange = (event) => {
    event.preventDefault();
    setSearchTerm(event.target.value);
  };

  const getItemTitle = (item) => {
    return item.title || item.name;
  };

  const getItemPoster = (item) => {
    return item.poster_path ? `${IMAGE_BASE_URL.replace('w185', 'w342')}${item.poster_path}` : 'placeholder_image_url';
  };

  const showDetails = async (item) => {
    const itemId = item.id;
    const itemType = item.media_type === 'movie' ? 'movie' : 'tv';
    const posterBackgroundUrl = item.backdrop_path ? `url(${POSTER_BG_BASE_URL}${item.backdrop_path})` : 'none';

    try {
      const detailsResponse = await fetch(`${BASE_URL}/${itemType}/${itemId}?api_key=${API_KEY}&language=pt-BR`);
      if (!detailsResponse.ok) throw new Error(`Erro ao buscar detalhes: ${detailsResponse.status}`);
      const detailsData = await detailsResponse.json();

      const creditsResponse = await fetch(`${BASE_URL}/${itemType}/${itemId}/credits?api_key=${API_KEY}&language=pt-BR`);
      const creditsData = creditsResponse.ok ? await creditsResponse.json() : { cast: [] };
      const castList = creditsData.cast.map(actor => `
        <div style="display: inline-block; margin-right: 15px; width: 100px; text-align: center;">
          <img src="${actor.profile_path ? IMAGE_BASE_URL.replace('w185', 'w185') + actor.profile_path : './p2.png'}" alt="${actor.name}" style="width: 70px; height: 70px; border-radius: 50%; object-fit: cover; margin-bottom: 5px;">
          <div style="font-size: 0.9em;">${actor.name}</div>
        </div>
      `).join('');

      const watchProvidersResponse = await fetch(`${BASE_URL}/${itemType}/${itemId}/watch/providers?api_key=${API_KEY}`);
      const watchProvidersData = watchProvidersResponse.ok ? await watchProvidersResponse.json() : { results: {} };
      const providersBR = watchProvidersData.results?.BR || {};
      let watchProvidersHTML = '';
      if (providersBR.flatrate) {
        watchProvidersHTML += `<p><strong>Streaming:</strong> ${providersBR.flatrate.map(p => p.provider_name).join(', ')}</p>`;
      }
      if (providersBR.buy) {
        watchProvidersHTML += `<p><strong>Comprar:</strong> ${providersBR.buy.map(p => p.provider_name).join(', ')}</p>`;
      }
      if (providersBR.rent) {
        watchProvidersHTML += `<p><strong>Alugar:</strong> ${providersBR.rent.map(p => p.provider_name).join(', ')}</p>`;
      }
      if (!providersBR.flatrate && !providersBR.buy && !providersBR.rent) {
        watchProvidersHTML += '<p>Nenhuma informação de streaming ou compra disponível para o Brasil.</p>';
      }

      Swal.fire({
        title: getItemTitle(item),
        html: `
          <div style="padding: 20px; border-radius: 10px; color: #f0f0f0;">
            <p><strong>Sinopse:</strong> ${detailsData.overview || 'Sinopse não disponível.'}</p>
            ${castList ? `<h3>Elenco Principal</h3><div style="overflow-x: auto; white-space: nowrap; padding-bottom: 10px;">${castList}</div>` : ''}
            ${watchProvidersHTML ? `<h3>Onde Assistir (Brasil)</h3>${watchProvidersHTML}` : '<p>Informações sobre onde assistir não disponíveis.</p>'}
          </div>
        `,
        imageUrl: getItemPoster(item),
        imageAlt: getItemTitle(item),
        imageHeight: '300px',
        customClass: {
          popup: 'swal2-popup-dark',
          image: 'swal2-image-custom'
        },
        background: '#372948',
        showCloseButton: true,
        confirmButtonText: 'Fechar',
        confirmButtonColor: '#5e35b1'
      });

    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Erro',
        text: `Falha ao carregar detalhes: ${error.message}`,
        confirmButtonColor: '#d33',
        background: '#121212',
        color: '#f0f0f0'
      });
    }
  };

  if (loading) {
    return <div className="loading">Carregando filmes e séries...</div>;
  }

  if (error) {
    return <div className="error">Erro ao carregar filmes e séries: {error.message}</div>;
  }

  return (
    <div className="movie-catalog">
      <h1>Catálogo suquin</h1>
      <div className="search-bar">
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Buscar filmes e séries..."
          value={searchTerm}
          onChange={handleSearchChange}
        />
      </div>

      {/* Categorias de Filmes */}
      <section>
        <h2>Filmes Populares</h2>
        <div className="item-list-container">
          <ul className="item-list horizontal-scroll">
            {popularMovies.map((movie) => (
              <li key={movie.id} className="item-card" onClick={() => showDetails(movie)}>
                <img src={getItemPoster(movie)} alt={getItemTitle(movie)} className="item-poster" />
                <div className="item-info">
                  <h2 className="item-title">{getItemTitle(movie)}</h2>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section>
        <h2>Filmes Mais Bem Avaliados</h2>
        <div className="item-list-container">
          <ul className="item-list horizontal-scroll">
            {topRatedMovies.map((movie) => (
              <li key={movie.id} className="item-card" onClick={() => showDetails(movie)}>
                <img src={getItemPoster(movie)} alt={getItemTitle(movie)} className="item-poster" />
                <div className="item-info">
                  <h2 className="item-title">{getItemTitle(movie)}</h2>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Categorias de Séries */}
      <section>
        <h2>Séries Populares</h2>
        <div className="item-list-container">
          <ul className="item-list horizontal-scroll">
            {popularSeries.map((series) => (
              <li key={series.id} className="item-card" onClick={() => showDetails(series)}>
                <img src={getItemPoster(series)} alt={getItemTitle(series)} className="item-poster" />
                <div className="item-info">
                  <h2 className="item-title">{getItemTitle(series)}</h2>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section>
        <h2>Séries Mais Bem Avaliadas</h2>
        <div className="item-list-container">
          <ul className="item-list horizontal-scroll">
            {topRatedSeries.map((series) => (
              <li key={series.id} className="item-card" onClick={() => showDetails(series)}>
                <img src={getItemPoster(series)} alt={getItemTitle(series)} className="item-poster" />
                <div className="item-info">
                  <h2 className="item-title">{getItemTitle(series)}</h2>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}