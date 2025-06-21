// --- Script 1: Constants, Configuration, DOM Refs, State ---
// --- Constants and Configuration ---
const TMDB_API_KEY = '5e5da432e96174227b25086fe8637985'; // Sua chave da API do TMDB
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/'; // Base para posters e backdrops de diferentes tamanhos
const TMDB_BACKDROP_BASE_URL = 'https://image.tmdb.org/t/p/original'; // Base específica para backdrops grandes
const LANGUAGE = 'pt-BR';
const PLACEHOLDER_PERSON_IMAGE = 'https://placehold.co/185x278/0F071A/F3F4F6?text=Sem+Foto&font=inter';
const PLAYER_BASE_URL_MOVIE = 'https://superflixapi.pw//filme/';
const PLAYER_BASE_URL_SERIES = 'https://superflixapi.pw//serie/';

// NOVO: Chave para armazenamento local de favoritos
const FAVORITES_KEY = 'suquinFavorites';

// Mapeamento de empresas para busca combinada (configuração global)
const companyKeywordMap = {
    'netflix': { name: 'Netflix', ids: ['213', '1024'] }, // Exemplo de IDs TMDB para Netflix
    'disney': { name: 'Disney+', ids: ['2739', '2'] }, // Exemplo de IDs TMDB para Disney+ e Walt Disney Pictures
    'amazon': { name: 'Amazon Prime Video', ids: ['6735'] }, // Exemplo de ID TMDB para Amazon Studios
    'hbo': { name: 'HBO Max', ids: ['49', '3268'] }, // HBO e HBO Max
    'apple': { name: 'Apple TV+', ids: ['6082'] }, // Apple TV+
    'paramount': { name: 'Paramount+', ids: ['4'] }, // Paramount Pictures
    // Adicione mais empresas conforme necessário com seus respectivos IDs do TMDB
};


// --- DOM Element References ---
const pageBackdrop = document.getElementById('pageBackdrop');
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const filterToggleButton = document.getElementById('filterToggleButton');
// NOVO: Referência para o botão de favoritos
const favoritesButton = document.getElementById('favoritesButton');
const defaultContentSections = document.getElementById('defaultContentSections');
const moviesResultsGrid = document.getElementById('moviesResultsGrid');
const tvShowsResultsGrid = document.getElementById('tvShowsResultsGrid');
const singleResultsSection = document.getElementById('singleResultsSection');
const singleSectionTitleEl = document.getElementById('singleSectionTitle');
const singleResultsGrid = document.getElementById('singleResultsGrid');
const loader = document.getElementById('loader'); // Loader global (seu original usava 'loader')
const externalCopyButtonContainer = document.getElementById('externalCopyButtonContainer');
const externalCopyLinkButton = document.getElementById('externalCopyLinkButton');

// Referências para os loaders locais de scroll infinito
const popularMoviesLoader = document.getElementById('popularMoviesLoader');
const topRatedTvShowsLoader = document.getElementById('topRatedTvShowsLoader');
const searchResultsLoader = document.getElementById('searchResultsLoader');

// --- State Variables ---
let currentFilterTypeSA = 'movie'; // Tipo de filtro selecionado no SweetAlert (filme, série ou anime)
let selectedGenreSA = { id: null, name: null, type: null }; // Gênero selecionado no SweetAlert
let activeAppliedGenre = { id: null, name: null, type: null }; // Gênero atualmente aplicado na busca/filtro
let searchTimeout = null; // Timeout para a função de debounce da busca
let currentOpenSwalRef = null; // Referência para a instância atual do SweetAlert aberta
let currentExternalCopyUrl = ''; // URL que será copiada para o clipboard
let externalCopyButtonHandler; // Handler para o evento de clique do botão de copiar link externo

// Variáveis de paginação para busca e filtro
let searchCurrentPage = 1;
let filterCurrentPage = 1;
let isLoadingMore = false; // Flag para controlar se está carregando mais resultados de busca/filtro
let totalPages = { search: 1, filter: 1 }; // Total de páginas para busca e filtro
let currentContentContext = 'main'; // Contexto atual do conteúdo: 'main', 'search', 'filter', ou 'favorites'

// NOVO: Variável de estado para a visualização de favoritos
let favoritesActive = false;

// Variáveis de paginação para as seções da página principal (scroll horizontal - mantido para referência, mas desativado)
let popularMoviesCurrentPage = 1;
let popularMoviesTotalPages = 1;
let isLoadingMorePopularMovies = false;

let topRatedTvShowsCurrentPage = 1;
let topRatedTvShowsTotalPages = 1;
let isLoadingMoreTopRatedTvShows = false;

// NOVO: Variáveis de paginação específicas para o filtro de Animes (combinado)
let animeMoviesCurrentPage = 1;
let animeMoviesTotalPages = 1;
let animeTvCurrentPage = 1;
let animeTvTotalPages = 1;
let isLoadingMoreAnime = false; // Flag para controlar se está carregando mais resultados de anime

// Variáveis para o slideshow de backdrop da página principal
let mainPageBackdropSlideshowInterval = null; // Intervalo para o slideshow
let currentMainPageBackdropIndex = 0; // Índice da imagem atual no slideshow
let mainPageBackdropPaths = []; // Array de caminhos de backdrop para o slideshow