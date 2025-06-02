// --- Script 1: Constants, Configuration, DOM Refs, State ---
// --- Constants and Configuration ---
const TMDB_API_KEY = '5e5da432e96174227b25086fe8637985';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/';
const TMDB_BACKDROP_BASE_URL = 'https://image.tmdb.org/t/p/original';
const LANGUAGE = 'pt-BR';
const PLACEHOLDER_PERSON_IMAGE = 'https://placehold.co/185x278/0F071A/F3F4F6?text=Sem+Foto&font=inter';
const PLAYER_BASE_URL_MOVIE = 'https://superflixapi.wales/filme/';
const PLAYER_BASE_URL_SERIES = 'https://superflixapi.wales/serie/';

// --- DOM Element References ---
const pageBackdrop = document.getElementById('pageBackdrop');
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const filterToggleButton = document.getElementById('filterToggleButton');
const defaultContentSections = document.getElementById('defaultContentSections');
const moviesResultsGrid = document.getElementById('moviesResultsGrid');
const tvShowsResultsGrid = document.getElementById('tvShowsResultsGrid');
const singleResultsSection = document.getElementById('singleResultsSection');
const singleSectionTitleEl = document.getElementById('singleSectionTitle');
const singleResultsGrid = document.getElementById('singleResultsGrid');
const loader = document.getElementById('loader'); // Loader global
const externalCopyButtonContainer = document.getElementById('externalCopyButtonContainer');
const externalCopyLinkButton = document.getElementById('externalCopyLinkButton');

// Referências para os loaders locais de scroll infinito
const popularMoviesLoader = document.getElementById('popularMoviesLoader');
const topRatedTvShowsLoader = document.getElementById('topRatedTvShowsLoader');
const searchResultsLoader = document.getElementById('searchResultsLoader');

// --- State Variables ---
let currentFilterTypeSA = 'movie';
let selectedGenreSA = { id: null, name: null, type: null };
let activeAppliedGenre = { id: null, name: null, type: null };
let searchTimeout = null;
let currentOpenSwalRef = null;
let currentExternalCopyUrl = '';
let externalCopyButtonHandler;

let searchCurrentPage = 1;
let filterCurrentPage = 1;
let isLoadingMore = false; 
let totalPages = { search: 1, filter: 1 };
let currentContentContext = 'main';

// Para scroll infinito HORIZONTAL (agora desativado por JS, mas vars podem ser úteis se reativado)
let popularMoviesCurrentPage = 1;
let popularMoviesTotalPages = 1;
let isLoadingMorePopularMovies = false;

let topRatedTvShowsCurrentPage = 1;
let topRatedTvShowsTotalPages = 1;
let isLoadingMoreTopRatedTvShows = false;

// Para slideshow de backdrop da página principal
let mainPageBackdropSlideshowInterval = null;
let currentMainPageBackdropIndex = 0;
let mainPageBackdropPaths = [];
