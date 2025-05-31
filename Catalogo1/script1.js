// --- Constants and Configuration ---
const TMDB_API_KEY = '5e5da432e96174227b25086fe8637985'; // IMPORTANT: Replace with your actual TMDB API Key
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/';
const TMDB_BACKDROP_BASE_URL = 'https://image.tmdb.org/t/p/original';
const LANGUAGE = 'pt-BR';
const PLACEHOLDER_PERSON_IMAGE = 'https://placehold.co/185x278/0F071A/F3F4F6?text=Sem+Foto&font=inter';
const PLAYER_BASE_URL_MOVIE = 'https://superflixapi.wales//filme/'; 
const PLAYER_BASE_URL_SERIES = 'https://superflixapi.wales//serie/'; 

// Lista de códigos de idiomas e países asiáticos para bloqueio
const ASIAN_LANGUAGES_TO_BLOCK = ['ja', 'ko', 'zh', 'hi', 'th', 'vi', 'ms', 'id', 'fa', 'ar', 'tr', 'mn', 'tl', 'ur', 'bn', 'pa', 'te', 'ta', 'ml', 'kn', 'gu', 'mr', 'ne', 'km', 'lo', 'my', 'dz', 'ug', 'ps', 'sd'];
const ASIAN_ORIGIN_COUNTRIES_TO_BLOCK = ['JP', 'KR', 'CN', 'HK', 'TW', 'IN', 'TH', 'VN', 'MY', 'ID', 'IR', 'SA', 'TR', 'MN', 'PH', 'SG', 'PK', 'BD', 'LK', 'NP', 'AF', 'IQ', 'SY', 'YE', 'AE', 'OM', 'QA', 'KW', 'BH', 'JO', 'LB', 'CY', 'GE', 'AM', 'AZ', 'KZ', 'UZ', 'TM', 'KG', 'TJ', 'BT', 'BN', 'KH', 'LA', 'MM'];


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
