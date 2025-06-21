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

        // References for local infinite scroll loaders (if used, currently not for main grids)
        const popularMoviesLoader = document.getElementById('popularMoviesLoader');
        const topRatedTvShowsLoader = document.getElementById('topRatedTvShowsLoader');
        const searchResultsLoader = document.getElementById('searchResultsLoader');

        // --- State Variables ---
        let currentFilterTypeSA = 'movie'; // Selected filter type in SweetAlert (movie, tv, or anime)
        let selectedGenreSA = { id: null, name: null, type: null }; // Selected genre in SweetAlert
        let activeAppliedGenre = { id: null, name: null, type: null }; // Currently applied genre in search/filter
        let searchTimeout = null; // Timeout for search debounce function
        let currentOpenSwalRef = null; // Reference to the current SweetAlert instance
        let currentExternalCopyUrl = ''; // URL to be copied to clipboard
        let externalCopyButtonHandler; // Handler for the external copy link button click event

        // Pagination variables for search and filter
        let searchCurrentPage = 1;
        let filterCurrentPage = 1;
        let isLoadingMore = false; // Flag to control if more search/filter results are being loaded
        let totalPages = { search: 1, filter: 1 }; // Total pages for search and filter
        let currentContentContext = 'main'; // Current content context: 'main', 'search', or 'filter'

        // Pagination variables for main page sections (horizontal scroll - kept for reference, but disabled)
        let popularMoviesCurrentPage = 1;
        let popularMoviesTotalPages = 1;
        let isLoadingMorePopularMovies = false;

        let topRatedTvShowsCurrentPage = 1;
        let topRatedTvShowsTotalPages = 1;
        let isLoadingMoreTopRatedTvShows = false;

        // Variables for main page backdrop slideshow
        let mainPageBackdropSlideshowInterval = null; // Interval for slideshow
        let currentMainPageBackdropIndex = 0; // Current image index in slideshow
        let mainPageBackdropPaths = []; // Array of backdrop paths for slideshow

        let favorites = []; // To store favorite items in memory