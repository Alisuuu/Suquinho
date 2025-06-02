// --- Script 1: Constants, Configuration, DOM Refs, State ---
// --- Constants and Configuration ---
const TMDB_API_KEY = '5e5da432e96174227b25086fe8637985'; // IMPORTANTE: Substitua pela sua chave de API real do TMDB.
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
const loader = document.getElementById('loader');
const externalCopyButtonContainer = document.getElementById('externalCopyButtonContainer');
const externalCopyLinkButton = document.getElementById('externalCopyLinkButton');

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
let currentContentContext = 'main';
let totalPages = { search: 1, filter: 1 };

let mainPageBackdropSlideshowInterval = null;
let currentMainPageBackdropIndex = 0;
let mainPageBackdropPaths = [];
