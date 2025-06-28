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
const floatingFavoritesButton = document.getElementById('floatingFavoritesButton');
const searchResultsLoader = document.getElementById('searchResultsLoader');
const openCalendarBtn = document.getElementById('open-calendar-panel-btn');
const closeCalendarBtn = document.getElementById('close-calendar-panel-btn');

// --- State Variables ---
let activeAppliedGenre = { id: null, name: null, type: null };
let currentFilterTypeSA = 'movie'; 
let selectedGenreSA = { id: null, name: null, type: null }; 
let searchTimeout = null;
let searchCurrentPage = 1;
let filterCurrentPage = 1;
let isLoadingMore = false;
let totalPages = { search: 1, filter: 1 };
let currentContentContext = 'main';
let mainPageBackdropSlideshowInterval = null;
let currentMainPageBackdropIndex = 0;
let mainPageBackdropPaths = [];
let favorites = [];
let currentOpenSwalRef = null;

// State variables for main page content (scrolling)
let popularMoviesCurrentPage = 1;
let popularMoviesTotalPages = 1;
let isLoadingMorePopularMovies = false;
let topRatedTvShowsCurrentPage = 1;
let topRatedTvShowsTotalPages = 1;
let isLoadingMoreTopRatedTvShows = false;

// State for item modal's copy button
let currentExternalCopyUrl = '';
let externalCopyButtonHandler = null;