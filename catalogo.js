// --- Constants and Configuration ---
const TMDB_API_KEY = '5e5da432e96174227b25086fe8637985';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/';
const LANGUAGE = 'pt-BR';
const PLACEHOLDER_PERSON_IMAGE = 'p2.png';
const PLAYER_BASE_URL_MOVIE = 'https://playerflixapi.com/filme/';
const PLAYER_BASE_URL_SERIES = 'https://playerflixapi.com/serie/';
const FAVORITES_STORAGE_KEY = 'suquin_favorites_v2';
const WATCH_HISTORY_STORAGE_KEY = 'suquin_watch_history_v1';
const RAFFLE_HISTORY_STORAGE_KEY = 'pickedMediaHistory_v2';
const MAX_RAFFLE_HISTORY_SIZE = 40;
const TMDB_ANIME_KEYWORD_ID = '210024';
const TMDB_JAPAN_COUNTRY_CODE = 'JP';
const companyKeywordMap = {
    'disney': { name: 'Disney', ids: [2, 3, 420, 1] },
    'pixar': { name: 'Pixar', ids: [3] },
    'marvel': { name: 'Marvel', ids: [420] },
    'netflix': { name: 'Netflix', ids: [213] },
    'hbo': { name: 'HBO', ids: [3268, 11073] },
    'warner': { name: 'Warner Bros.', ids: [174, 9993] },
    'universal': { name: 'Universal', ids: [33] },
    'sony': { name: 'Sony', ids: [5] },
    'paramount': { name: 'Paramount', ids: [4] }
};

// --- Firebase Configuration ---
const firebaseConfig = {
    apiKey: "AIzaSyC-D6au6ILZlfQ2hE7oOqnADDwp7BDUrAA",
    authDomain: "suquin-c6eb8.firebaseapp.com",
    projectId: "suquin-c6eb8",
    storageBucket: "suquin-c6eb8.firebasestorage.app",
    messagingSenderId: "464208391390",
    appId: "1:464208391390:web:73711a5a98e6447ccc264f"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
let currentUser = null;

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
const floatingCombinedButton = document.getElementById('floatingCombinedButton');
const searchResultsLoader = document.getElementById('searchResultsLoader');
const popularMoviesLoader = document.getElementById('popularMoviesLoader');
const topRatedTvShowsLoader = document.getElementById('topRatedTvShowsLoader');
const openCalendarBtn = document.getElementById('open-calendar-btn');
const closeCalendarBtn = document.getElementById('close-calendar-btn');
const continueWatchingSection = document.getElementById('continueWatchingSection');
const continueWatchingGrid = document.getElementById('continueWatchingGrid');

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
let watchHistory = [];
let pickedMediaHistory = [];
let currentOpenSwalRef = null;
let popularMoviesCurrentPage = 1;
let popularMoviesTotalPages = 1;
let isLoadingMorePopularMovies = false;
let topRatedTvShowsCurrentPage = 1;
let topRatedTvShowsTotalPages = 1;
let isLoadingMoreTopRatedTvShows = false;

// --- Helper Functions ---
function saveAllUserData() {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
    localStorage.setItem(WATCH_HISTORY_STORAGE_KEY, JSON.stringify(watchHistory));
    localStorage.setItem(RAFFLE_HISTORY_STORAGE_KEY, JSON.stringify(pickedMediaHistory));

    if (currentUser) {
        db.collection("users").doc(currentUser.uid).set({
            favorites,
            watchHistory,
            pickedMediaHistory
        }, { merge: true }).catch(error => {
            console.error("Erro ao salvar dados no Firestore:", error);
        });
    }
}

function mergeArrays(localArr, firebaseArr) {
    const mergedMap = new Map();
    (firebaseArr || []).forEach(item => {
        const key = `${item.id}-${item.media_type}`;
        mergedMap.set(key, item);
    });
    (localArr || []).forEach(item => {
        const key = `${item.id}-${item.media_type}`;
        if (!mergedMap.has(key)) {
            mergedMap.set(key, item);
        }
    });
    return Array.from(mergedMap.values());
}

function mergeHistoryArrays(localArr, firebaseArr, maxSize) {
    const finalMap = new Map();

    // Prioritize local items, as they reflect recent user actions like deletions
    (localArr || []).forEach(item => {
        const key = `${item.id}-${item.type || item.media_type}`;
        finalMap.set(key, item);
    });

    // Merge with Firebase data, but respect local deletions
    (firebaseArr || []).forEach(item => {
        const key = `${item.id}-${item.type || item.media_type}`;
        // If item exists in both, update if the Firebase one is newer
        if (finalMap.has(key)) {
            const localItem = finalMap.get(key);
            if (new Date(item.timestamp || item.date) > new Date(localItem.timestamp || localItem.date)) {
                finalMap.set(key, item);
            }
        } else {
            // If item is only in Firebase, it might be from another device.
            // For this fix, we add it, but the main issue of deletions is handled by prioritizing local.
            // A more robust solution would need tombstones.
            finalMap.set(key, item);
        }
    });

    // After merging, we must re-filter to ensure items deleted locally don't reappear from Firebase.
    const localKeySet = new Set((localArr || []).map(item => `${item.id}-${item.type || item.media_type}`));
    const filteredMerged = Array.from(finalMap.values()).filter(item => {
        const key = `${item.id}-${item.type || item.media_type}`;
        return localKeySet.has(key);
    });


    let merged = filteredMerged;
    merged.sort((a, b) => new Date(b.timestamp || b.date) - new Date(a.timestamp || a.date));
    
    return merged.length > maxSize ? merged.slice(0, maxSize) : merged;
}

// --- Firebase Functions ---
function signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).catch(error => {
        console.error("Erro no Popup, a tentar redirecionar...", error);
        auth.signInWithRedirect(provider);
    });
}

function signOut() {
    auth.signOut();
}

// --- NEW: Password Reset Function ---
function sendPasswordResetEmail() {
    Swal.fire({
        title: 'Redefinir Senha',
        html: 'Digite seu e-mail para receber o link de redefinição.',
        input: 'email',
        inputPlaceholder: 'seu@email.com',
        confirmButtonText: 'Enviar',
        showCancelButton: true,
        cancelButtonText: 'Cancelar',
        customClass: {
            popup: 'login-popup'
        },
        preConfirm: (email) => {
            if (!email) {
                Swal.showValidationMessage('Por favor, digite um e-mail válido.');
                return false;
            }
            return email;
        }
    }).then((result) => {
        if (result.isConfirmed) {
            const email = result.value;
            auth.sendPasswordResetEmail(email)
                .then(() => {
                    Swal.fire({
                        icon: 'success',
                        title: 'E-mail Enviado!',
                        text: 'Verifique sua caixa de entrada (e a pasta de spam) para o link de redefinição.',
                    });
                })
                .catch((error) => {
                    let errorMessage = "Ocorreu um erro. Tente novamente.";
                    if (error.code === 'auth/user-not-found') {
                        errorMessage = 'Nenhuma conta encontrada com este e-mail.';
                    } else if (error.code === 'auth/invalid-email') {
                        errorMessage = 'O formato do e-mail é inválido.';
                    }
                    Swal.fire({
                        icon: 'error',
                        title: 'Erro',
                        text: errorMessage,
                    });
                });
        }
    });
}


// --- Email/Password Auth Functions ---
function createAccountWithEmail() {
    Swal.fire({
        title: 'Criar Conta',
        html: `
            <input type="email" id="swal-email" class="swal2-input" placeholder="Email">
            <input type="password" id="swal-password" class="swal2-input" placeholder="Senha (mín. 6 caracteres)">
        `,
        confirmButtonText: 'Criar',
        focusConfirm: false,
        showCancelButton: true,
        cancelButtonText: 'Cancelar',
        customClass: {
            popup: 'login-popup'
        },
        preConfirm: () => {
            const email = Swal.getPopup().querySelector('#swal-email').value;
            const password = Swal.getPopup().querySelector('#swal-password').value;
            if (!email || !password) {
                Swal.showValidationMessage(`Por favor, preencha todos os campos`);
                return false;
            }
            if (password.length < 6) {
                Swal.showValidationMessage(`A senha deve ter no mínimo 6 caracteres`);
                return false;
            }
            return { email: email, password: password };
        }
    }).then((result) => {
        if (result.isConfirmed) {
            const { email, password } = result.value;
            auth.createUserWithEmailAndPassword(email, password)
                .then((userCredential) => {
                    Swal.fire({
                        icon: 'success',
                        title: 'Conta Criada!',
                        text: 'Login efetuado com sucesso.',
                        timer: 2000,
                        showConfirmButton: false
                    });
                })
                .catch((error) => {
                    let errorMessage = "Ocorreu um erro. Tente novamente.";
                    if (error.code === 'auth/email-already-in-use') {
                        errorMessage = 'Este e-mail já está em uso.';
                    } else if (error.code === 'auth/invalid-email') {
                        errorMessage = 'O formato do e-mail é inválido.';
                    } else if (error.code === 'auth/weak-password') {
                        errorMessage = 'A senha é muito fraca.';
                    }
                    Swal.fire({
                        icon: 'error',
                        title: 'Erro ao Criar Conta',
                        text: errorMessage,
                    });
                });
        }
    });
}


function signInWithEmail() {
    Swal.fire({
        title: 'Login com E-mail',
        html: `
            <input type="email" id="swal-email" class="swal2-input" placeholder="Email">
            <input type="password" id="swal-password" class="swal2-input" placeholder="Senha">
            <a href="#" id="forgot-password-link" class="forgot-password-link">Esqueceu a senha?</a>
            <div class="swal-footer-actions">
                <button id="create-account-button" class="swal-create-account-button">Não tem uma conta? Crie uma!</button>
            </div>
        `,
        confirmButtonText: 'Entrar',
        focusConfirm: false,
        showCancelButton: true,
        cancelButtonText: 'Cancelar',
        customClass: {
            popup: 'login-popup'
        },
        didOpen: () => {
            Swal.getPopup().querySelector('#create-account-button').addEventListener('click', (e) => {
                e.preventDefault();
                Swal.close(); // Fecha o modal de login
                createAccountWithEmail(); // Abre o modal de criação de conta
            });
             Swal.getPopup().querySelector('#forgot-password-link').addEventListener('click', (e) => {
                e.preventDefault();
                Swal.close();
                sendPasswordResetEmail();
            });
        },
        preConfirm: () => {
            const email = Swal.getPopup().querySelector('#swal-email').value;
            const password = Swal.getPopup().querySelector('#swal-password').value;
            if (!email || !password) {
                Swal.showValidationMessage(`Por favor, preencha todos os campos`);
            }
            return { email: email, password: password };
        }
    }).then((result) => {
        if (result.isConfirmed) {
            const { email, password } = result.value;
            auth.signInWithEmailAndPassword(email, password)
                .then((userCredential) => {
                    Swal.close();
                     showCustomToast('Login efetuado com sucesso!', 'success');
                })
                .catch((error) => {
                    let errorMessage = "Ocorreu um erro. Tente novamente.";
                    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                        errorMessage = 'E-mail ou senha incorretos.';
                    } else if (error.code === 'auth/invalid-email') {
                        errorMessage = 'O formato do e-mail é inválido.';
                    }
                    Swal.fire({
                        icon: 'error',
                        title: 'Erro de Login',
                        text: errorMessage,
                    });
                });
        }
    });
}


auth.getRedirectResult()
    .then((result) => {
        if (result.user) {
            console.log("Utilizador com sessão iniciada via redirecionamento:", result.user.displayName);
        }
    }).catch((error) => {
        console.error("Erro no getRedirectResult:", error);
    });

auth.onAuthStateChanged(async user => {
    currentUser = user;
    const floatingCombinedButton = document.getElementById("floatingCombinedButton");

    if (user) {
        // User is signed in.
        const photoURL = user.photoURL || `https://ui-avatars.com/api/?name=${user.email.split('@')[0]}&background=random&color=fff`;
        if (floatingCombinedButton) {
            floatingCombinedButton.innerHTML = `<img src="${photoURL}" alt="Avatar" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover; display: block;">`;
            floatingCombinedButton.title = user.displayName || user.email;
        }

        let localFavorites = JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY)) || [];
        let localWatchHistory = JSON.parse(localStorage.getItem(WATCH_HISTORY_STORAGE_KEY)) || [];
        let localRaffleHistory = JSON.parse(localStorage.getItem(RAFFLE_HISTORY_STORAGE_KEY)) || [];

        try {
            const doc = await db.collection("users").doc(user.uid).get();
            if (doc.exists) {
                const data = doc.data();
                const firebaseFavorites = data.favorites || [];
                const firebaseWatchHistory = data.watchHistory || [];
                const firebaseRaffleHistory = data.pickedMediaHistory || [];

                // Priorize os favoritos locais para respeitar as remoções
                const firebaseFavoritesSet = new Set(firebaseFavorites.map(fav => `${fav.id}-${fav.media_type}`));
                const localFavoritesSet = new Set(localFavorites.map(fav => `${fav.id}-${fav.media_type}`));

                // Itens do Firebase que não foram removidos localmente
                const mergedFirebaseFavorites = firebaseFavorites.filter(fav => localFavoritesSet.has(`${fav.id}-${fav.media_type}`));

                // Adiciona os favoritos locais que não estão no Firebase (novos favoritos adicionados localmente)
                const finalFavorites = [...mergedFirebaseFavorites];
                localFavorites.forEach(fav => {
                    if (!firebaseFavoritesSet.has(`${fav.id}-${fav.media_type}`)) {
                        finalFavorites.push(fav);
                    }
                });
                favorites = finalFavorites;

                watchHistory = mergeHistoryArrays(localWatchHistory, firebaseWatchHistory, 100);
                pickedMediaHistory = mergeHistoryArrays(localRaffleHistory, firebaseRaffleHistory, MAX_RAFFLE_HISTORY_SIZE);
            } else {
                favorites = localFavorites;
                watchHistory = localWatchHistory;
                pickedMediaHistory = localRaffleHistory;
            }
            saveAllUserData();
        } catch (error) {
            console.error("Error loading Firebase data, using local data as fallback:", error);
            favorites = localFavorites;
            watchHistory = localWatchHistory;
            pickedMediaHistory = localRaffleHistory;
        }

    } else {
        // User is signed out.
        if (floatingCombinedButton) {
            floatingCombinedButton.innerHTML = `<i class="fas fa-list-alt"></i>`;
            floatingCombinedButton.title = "Meus Salvos";
        }
        favorites = JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY)) || [];
        watchHistory = JSON.parse(localStorage.getItem(WATCH_HISTORY_STORAGE_KEY)) || [];
        pickedMediaHistory = JSON.parse(localStorage.getItem(RAFFLE_HISTORY_STORAGE_KEY)) || [];
    }
    updateHistoryButtonVisibility();
    displayContinueWatching();
    updateAllFavoriteButtonsUI();
});


// --- Main Logic ---
function getCompanyConfigForQuery(query) {
    const normalizedQuery = query.toLowerCase().trim();
    if (typeof companyKeywordMap === 'undefined') {
        return null;
    }
    for (const keyword in companyKeywordMap) {
        if (normalizedQuery.includes(keyword)) {
            return companyKeywordMap[keyword];
        }
    }
    return null;
}

function stopMainPageBackdropSlideshow() {
    clearInterval(mainPageBackdropSlideshowInterval);
    mainPageBackdropSlideshowInterval = null;
}

function startMainPageBackdropSlideshow() {
    stopMainPageBackdropSlideshow();
    if (mainPageBackdropPaths.length === 0) {
        updatePageBackground(null);
        return;
    }
    updatePageBackground(mainPageBackdropPaths[currentMainPageBackdropIndex]);
    mainPageBackdropSlideshowInterval = setInterval(() => {
        currentMainPageBackdropIndex = (currentMainPageBackdropIndex + 1) % mainPageBackdropPaths.length;
        updatePageBackground(mainPageBackdropPaths[currentMainPageBackdropIndex]);
    }, 8000);
}

async function fetchTMDB(endpoint, params = {}) {
    const urlParams = new URLSearchParams({ api_key: TMDB_API_KEY, language: LANGUAGE, include_adult: 'false', ...params });
    const url = `${TMDB_BASE_URL}${endpoint}?${urlParams}`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ status_message: response.statusText || "Unknown API Error" }));
            return { error: true, status: response.status, message: errorData.status_message };
        }
        return await response.json();
    } catch (error) {
        console.error('Fetch error:', error);
        throw error;
    }
}

async function loadMainPageContent() {
    showLoader();
    if (defaultContentSections) defaultContentSections.style.display = 'block';
    if (singleResultsSection) singleResultsSection.style.display = 'none';
    if (filterToggleButton) filterToggleButton.classList.remove('active');
    activeAppliedGenre = { id: null, name: null, type: null };
    selectedGenreSA = { id: null, name: null, type: null };
    currentContentContext = 'main';

    popularMoviesCurrentPage = 1; popularMoviesTotalPages = 1; isLoadingMorePopularMovies = false;
    topRatedTvShowsCurrentPage = 1; topRatedTvShowsTotalPages = 1; isLoadingMoreTopRatedTvShows = false;
    if (moviesResultsGrid) moviesResultsGrid.innerHTML = '';
    if (tvShowsResultsGrid) tvShowsResultsGrid.innerHTML = '';
    mainPageBackdropPaths = []; currentMainPageBackdropIndex = 0;

    const moviesPromise = fetchTMDB(`/movie/popular`, { page: popularMoviesCurrentPage });
    const tvShowsPromise = fetchTMDB(`/tv/top_rated`, { page: topRatedTvShowsCurrentPage });
    const [moviesData, tvShowsData] = await Promise.all([moviesPromise, tvShowsPromise]);

    if (moviesResultsGrid) {
        if (moviesData && !moviesData.error && moviesData.results) {
            popularMoviesTotalPages = moviesData.total_pages || 1;
            displayResults(moviesData.results, 'movie', moviesResultsGrid, true);
            moviesData.results.forEach(movie => { if (movie.backdrop_path) mainPageBackdropPaths.push(movie.backdrop_path); });
        } else { moviesResultsGrid.innerHTML = `<p class="text-center col-span-full text-[var(--text-secondary)] py-5">Não foi possível carregar os filmes populares. ${moviesData?.message || ''}</p>`; }
    }
    if (tvShowsResultsGrid) {
        if (tvShowsData && !tvShowsData.error && tvShowsData.results) {
            topRatedTvShowsTotalPages = tvShowsData.total_pages || 1;
            displayResults(tvShowsData.results, 'tv', tvShowsResultsGrid, true);
            tvShowsData.results.forEach(show => { if (show.backdrop_path) mainPageBackdropPaths.push(show.backdrop_path); });
        } else { tvShowsResultsGrid.innerHTML = `<p class="text-center col-span-full text-[var(--text-secondary)] py-5">Não foi possível carregar as séries populares. ${tvShowsData?.message || ''}</p>`; }
    }
    if (typeof shuffleArray === "function") shuffleArray(mainPageBackdropPaths);
    startMainPageBackdropSlideshow();
    hideLoader();
}

async function loadMorePopularMovies() {
    if (isLoadingMorePopularMovies || popularMoviesCurrentPage >= popularMoviesTotalPages) return;
    isLoadingMorePopularMovies = true;
    if (popularMoviesLoader) popularMoviesLoader.classList.add('loading');

    try {
        popularMoviesCurrentPage++;
        const data = await fetchTMDB('/movie/popular', { page: popularMoviesCurrentPage });
        if (data && !data.error && data.results && data.results.length > 0) {
            displayResults(data.results, 'movie', moviesResultsGrid, false);
            data.results.forEach(movie => { if (movie.backdrop_path && !mainPageBackdropPaths.includes(movie.backdrop_path)) mainPageBackdropPaths.push(movie.backdrop_path); });
            popularMoviesTotalPages = data.total_pages || popularMoviesTotalPages;
        } else if (data && data.error) {
            popularMoviesCurrentPage--;
        }
    } catch (error) {
        console.error("Erro ao carregar mais filmes populares:", error);
        popularMoviesCurrentPage--;
    } finally {
        if (popularMoviesLoader) popularMoviesLoader.classList.remove('loading');
        isLoadingMorePopularMovies = false;
    }
}

async function loadMoreTopRatedTvShows() {
    if (isLoadingMoreTopRatedTvShows || topRatedTvShowsCurrentPage >= topRatedTvShowsTotalPages) return;
    isLoadingMoreTopRatedTvShows = true;
    if (topRatedTvShowsLoader) topRatedTvShowsLoader.classList.add('loading');

    try {
        topRatedTvShowsCurrentPage++;
        const data = await fetchTMDB('/tv/top_rated', { page: topRatedTvShowsCurrentPage });
        if (data && !data.error && data.results && data.results.length > 0) {
            displayResults(data.results, 'tv', tvShowsResultsGrid, false);
            data.results.forEach(show => { if (show.backdrop_path && !mainPageBackdropPaths.includes(show.backdrop_path)) mainPageBackdropPaths.push(show.backdrop_path); });
            topRatedTvShowsTotalPages = data.total_pages || topRatedTvShowsTotalPages;
        } else if (data && data.error) {
            topRatedTvShowsCurrentPage--;
        }
    } catch (error) {
        console.error("Erro ao carregar mais séries populares:", error);
        topRatedTvShowsCurrentPage--;
    } finally {
        if (topRatedTvShowsLoader) topRatedTvShowsLoader.classList.remove('loading');
        isLoadingMoreTopRatedTvShows = false;
    }
}

async function performSearch(query) {
    const trimmedQuery = query ? query.trim().toLowerCase() : '';

    if (continueWatchingSection) {
        if (trimmedQuery) {
            continueWatchingSection.style.display = 'none';
        } else {
            displayContinueWatching();
        }
    }

    if (trimmedQuery === 'sq') { window.location.href = '../Hyper/hyper.html'; return; }
    if (trimmedQuery === 'yt') { window.location.href = '../Yt/yt.html'; return; }
    if (trimmedQuery === 'suquin') { window.location.href = '../game/index.html'; return; }
    if (trimmedQuery === 'lk') { window.location.href = '../links/links.html'; return; }

    stopMainPageBackdropSlideshow();
    if (pageBackdrop.style.opacity !== '0') updatePageBackground(null);
    showLoader();
    activeAppliedGenre = { id: null, name: null, type: null };
    selectedGenreSA = { id: null, name: null, type: null };
    if (filterToggleButton) filterToggleButton.classList.remove('active');
    searchCurrentPage = 1;
    totalPages.search = 1;
    currentContentContext = 'search';
    isLoadingMore = false;

    if (!query || !query.trim()) {
        loadMainPageContent();
        hideLoader();
        return;
    }

    if (defaultContentSections) defaultContentSections.style.display = 'none';
    if (singleResultsSection) singleResultsSection.style.display = 'block';
    if (singleResultsGrid) singleResultsGrid.innerHTML = '';

    let finalDisplayResults = [];
    let searchTitle = `Resultados para: "${query}"`;
    const companyConfig = getCompanyConfigForQuery(query);
    const fetchPromises = [fetchTMDB('/search/multi', { query: query, page: searchCurrentPage })];
    if (companyConfig) {
        searchTitle = `Conteúdo de ${companyConfig.name} (e mais resultados para "${query}")`;
        const companyIdsString = companyConfig.ids.join('|');
        fetchPromises.push(fetchTMDB(`/discover/movie`, { with_companies: companyIdsString, page: 1, sort_by: 'popularity.desc' }));
        fetchPromises.push(fetchTMDB(`/discover/tv`, { with_companies: companyIdsString, page: 1, sort_by: 'popularity.desc' }));
    }
    if (singleSectionTitleEl) singleSectionTitleEl.textContent = searchTitle;

    try {
        const [multiSearchData, companyMovieData, companyTvData] = await Promise.all(fetchPromises);
        
        if (multiSearchData && !multiSearchData.error && multiSearchData.results) {
            finalDisplayResults.push(...multiSearchData.results.filter(item => (item.media_type === 'movie' || item.media_type === 'tv')));
            totalPages.search = multiSearchData.total_pages || 1;
        }

        if (companyMovieData && !companyMovieData.error && companyMovieData.results) {
            finalDisplayResults.push(...companyMovieData.results.map(item => ({ ...item, media_type: 'movie' })));
        }

        if (companyTvData && !companyTvData.error && companyTvData.results) {
            finalDisplayResults.push(...companyTvData.results.map(item => ({ ...item, media_type: 'tv' })));
        }

        const uniqueResults = Array.from(new Map(finalDisplayResults.map(item => [item.id + (item.media_type || ''), item])).values());
        uniqueResults.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

        if (singleResultsGrid) {
            displayResults(uniqueResults, null, singleResultsGrid, true);
            if (uniqueResults.length === 0) {
                const baseErrorMsg = companyConfig ? `Nenhum conteúdo de ${companyConfig.name} ou resultados diretos encontrados.` : `Nenhum filme ou série relevante encontrado.`;
                singleResultsGrid.innerHTML = `<p class="text-center col-span-full">${multiSearchData?.error ? multiSearchData.message : baseErrorMsg}</p>`;
            }
        }
    } catch (error) {
        if (singleResultsGrid) singleResultsGrid.innerHTML = `<p class="text-center col-span-full">Não foi possível realizar a busca. ${error.message || 'Tente novamente.'}</p>`;
    } finally {
        hideLoader();
    }
}

async function applyGenreFilterFromSA() {
    stopMainPageBackdropSlideshow();
    if (pageBackdrop.style.opacity !== '0') updatePageBackground(null);
    if (!selectedGenreSA.id && selectedGenreSA.type !== 'anime') {
        activeAppliedGenre = { id: null, name: null, type: null };
        if (filterToggleButton) filterToggleButton.classList.remove('active');
        loadMainPageContent(); return;
    }
    showLoader();
    activeAppliedGenre = { ...selectedGenreSA };
    filterCurrentPage = 1; totalPages.filter = 1; currentContentContext = 'filter';
    isLoadingMore = false;
    if (defaultContentSections) defaultContentSections.style.display = 'none';
    if (singleResultsSection) singleResultsSection.style.display = 'block';
    if (singleResultsGrid) singleResultsGrid.innerHTML = '';

    let params = { sort_by: 'popularity.desc', page: filterCurrentPage };
    let endpointType = activeAppliedGenre.type === 'movie' ? 'movie' : 'tv';
    let titlePrefix = activeAppliedGenre.type === 'movie' ? 'Filmes' : 'Séries';

    if (activeAppliedGenre.id) params.with_genres = activeAppliedGenre.id;
    if (activeAppliedGenre.type === 'anime') {
        titlePrefix = 'Animes';
        params.with_origin_country = TMDB_JAPAN_COUNTRY_CODE;
        params.with_keywords = TMDB_ANIME_KEYWORD_ID;
    }
    
    if (singleSectionTitleEl) singleSectionTitleEl.textContent = `${titlePrefix} do Gênero: ${activeAppliedGenre.name || 'Todos'}`;
    
    const data = await fetchTMDB(`/discover/${endpointType}`, params);

    if (singleResultsGrid) {
        if (data && data.results) {
            displayResults(data.results, activeAppliedGenre.type, singleResultsGrid, true);
            if (data.results.length === 0) {
                singleResultsGrid.innerHTML = `<p class="text-center col-span-full">Nenhum item encontrado para o gênero ${activeAppliedGenre.name || 'selecionado'}.</p>`;
            } else {
                totalPages.filter = data.total_pages || 1;
            }
        } else {
            singleResultsGrid.innerHTML = `<p class="text-center col-span-full">Erro ao carregar itens. ${data?.message || ''}</p>`;
        }
    }
    hideLoader();
    if (filterToggleButton) filterToggleButton.classList.add('active');
}

async function getItemDetails(itemId, mediaType) {
    return await fetchTMDB(`/${mediaType}/${itemId}`, { 
        append_to_response: 'external_ids,credits,videos,images',
        include_image_language: 'pt,en,null' 
    });
}

function selectBestLogo(logos) {
    if (!logos || logos.length === 0) return null;
    const getScore = (logo) => {
        let score = 0;
        if (logo.file_path.endsWith('.png')) score += 100;
        else if (logo.file_path.endsWith('.svg')) score += 90;
        if (logo.iso_639_1 === 'pt') score += 50;
        else if (logo.iso_639_1 === 'en') score += 40;
        else if (logo.iso_639_1 === null) score += 30; 
        score += (logo.vote_average || 0);
        if (logo.aspect_ratio > 1) score += logo.aspect_ratio;
        return score;
    };
    const scoredLogos = logos.map(logo => ({ ...logo, score: getScore(logo) }));
    scoredLogos.sort((a, b) => b.score - a.score);
    return scoredLogos[0].file_path;
}

function findBestTrailer(videos) {
    if (!videos || !videos.results || videos.results.length === 0) {
        return null;
    }
    const trailers = videos.results.filter(video => video.site === 'YouTube' && video.type === 'Trailer');
    if (trailers.length === 0) {
        const anyVideo = videos.results.find(video => video.site === 'YouTube');
        return anyVideo ? anyVideo.key : null;
    }
    const officialTrailer = trailers.find(t => t.official);
    return officialTrailer ? officialTrailer.key : trailers[0].key;
}

async function fetchAndDisplayEpisodes(tvId, seasonNumber, container) {
    container.innerHTML = '<div class="loader mx-auto my-3" style="width: 30px; height: 30px; border-width: 3px;"></div>';
    const seasonDetails = await fetchTMDB(`/tv/${tvId}/season/${seasonNumber}`);

    if (!seasonDetails || seasonDetails.error || !seasonDetails.episodes) {
        container.innerHTML = `<p class="text-xs text-center text-[var(--text-secondary)]">Não foi possível carregar os episódios.</p>`;
        return;
    }

    const episodesHTML = seasonDetails.episodes.map(episode => `
        <div class="episode-item">
            <span class="episode-number">${episode.episode_number}.</span>
            <div class="episode-info">
                <div class="episode-title">${episode.name || 'Episódio ' + episode.episode_number}</div>
            </div>
            <div class="episode-actions">
                <button class="episode-play-button" data-episode-number="${episode.episode_number}" title="Assistir Episódio ${episode.episode_number}">
                    <i class="fas fa-play"></i>
                </button>
            </div>
        </div>
    `).join('');

    container.innerHTML = `<div class="episodes-list">${episodesHTML}</div>`;

    container.querySelectorAll('.episode-play-button').forEach(button => {
        button.addEventListener('click', () => {
            const episodeNumber = button.dataset.episodeNumber;
            const episodeData = seasonDetails.episodes.find(e => e.episode_number == episodeNumber);
            const seriesData = currentOpenSwalRef.seriesData; 

            if (episodeData && seriesData) {
                const playerUrl = `${PLAYER_BASE_URL_SERIES}${seriesData.id}/${seasonDetails.season_number}/${episodeData.episode_number}`;
                const logoPath = selectBestLogo(seriesData.images?.logos);
                launchAdvancedPlayer(playerUrl, logoPath, seriesData, 'tv', seasonDetails, episodeData);
            }
        });
    });
}

async function openItemModal(itemId, mediaType, backdropPath = null, fromSorteio = false) {
    stopMainPageBackdropSlideshow();
    updatePageBackground(backdropPath);

    currentOpenSwalRef = Swal.fire({
        title: 'A carregar detalhes...',
        html: '<div class="loader mx-auto my-10" style="width: 40px; height: 40px; border-width: 4px;"></div>',
        showConfirmButton: false, showCloseButton: true, allowOutsideClick: true,
        customClass: { popup: 'swal2-popup swal-details-popup' },
        willClose: () => {
            updatePageBackground(null);
            currentOpenSwalRef = null;
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.has('type') && urlParams.has('id')) {
                window.history.replaceState({}, document.title, window.location.pathname);
                if (defaultContentSections.style.display === 'none' && singleResultsSection.style.display === 'none') {
                    loadMainPageContent();
                } else if (defaultContentSections.style.display === 'block') {
                    startMainPageBackdropSlideshow();
                }
            } else if (defaultContentSections.style.display === 'block') {
                startMainPageBackdropSlideshow();
            }
        }
    });

    const details = await getItemDetails(itemId, mediaType);
    if (!Swal.isVisible()) return;
    if (!details || details.error) {
        Swal.update({ title: 'Erro', html: `<p class="text-red-400 text-center py-10">${details?.message || 'Não foi possível carregar os detalhes.'}</p>`, showConfirmButton: true, confirmButtonText: 'Fechar' });
        return;
    }
    
    if (Swal.isVisible()) {
        currentOpenSwalRef.seriesData = mediaType === 'tv' ? details : null;
    }
    
    if (!backdropPath && details.backdrop_path) updatePageBackground(details.backdrop_path);

    const isTV = mediaType === 'tv';
    const imdbId = details.external_ids?.imdb_id;
    const mainPlayerUrl = !isTV && imdbId ? `${PLAYER_BASE_URL_MOVIE}${imdbId}` : null;
    
    const shareUrl = `https://alisuuu.github.io/Suquinho/?pagina=Catalogo1%2Findex.html%3Ftype%3D${mediaType}%26id%3D${itemId}`;
    
    const titleText = details.title || details.name || "N/A";
    const coverImagePath = details.backdrop_path ? `${TMDB_IMAGE_BASE_URL}w780${details.backdrop_path}` : (details.poster_path ? `${TMDB_IMAGE_BASE_URL}w780${details.poster_path}` : 'https://placehold.co/1280x720/0A0514/F0F0F0?text=Indispon%C3%ADvel');
    const logoPathForPlayer = selectBestLogo(details.images?.logos);
    const logoHTML = logoPathForPlayer ? `<div class="details-logo-container"><img src="${TMDB_IMAGE_BASE_URL}w500${logoPathForPlayer}" class="details-logo-img" alt="Logo"></div>` : '';
    
    const headerContentHTML = `<div class="details-trailer-container"><div class="trailer-cover"><img src="${coverImagePath}" alt="Capa" class="trailer-cover-img">${logoHTML}<div class="cover-elements-overlay"><div id="modal-play-button" class="play-icon-wrapper" style="${isTV ? 'display: none;' : ''}"><i class="fas fa-play"></i></div></div></div></div>`;
    
    const overview = details.overview || 'Sinopse não disponível.';
    const releaseDate = details.release_date || details.first_air_date;
    const rating = details.vote_average ? details.vote_average.toFixed(1) : 'N/A';
    const genres = details.genres?.map(g => g.name).join(', ') || 'N/A';
    const runtime = details.runtime || details.episode_run_time?.[0] || null;
    const castSectionHTML = details.credits?.cast?.length > 0 ? `<div class="details-cast-section"><h3 class="details-section-subtitle">Elenco</h3><div class="details-cast-scroller">${details.credits.cast.slice(0, 15).map(p => `<div class="cast-member-card"><img src="${p.profile_path ? TMDB_IMAGE_BASE_URL + 'w185' + p.profile_path : PLACEHOLDER_PERSON_IMAGE}" alt="${p.name}" class="cast-member-photo"><p class="cast-member-name">${p.name}</p><p class="cast-member-character">${p.character}</p></div>`).join('')}</div></div>` : '';
    const isFav = isFavorite(itemId, mediaType);
    
    const favoriteButtonHTML = `<button id="modalFavoriteButton" class="modal-favorite-button ${isFav ? 'active' : ''}" data-id="${itemId}" data-type="${mediaType}" title="Favoritos">${isFav ? '<i class="fas fa-heart"></i>' : '<i class="far fa-heart"></i>'}</button>`;
    const copyLinkButtonHTML = `<button id="modalCopyLinkButton" class="modal-copy-link-button" title="Copiar Link"><i class="fas fa-link"></i></button>`;
    const trailerKey = findBestTrailer(details.videos);
    const trailerButtonHTML = trailerKey ? `<button id="modalTrailerButton" class="modal-trailer-button" title="Ver Trailer"><i class="fas fa-film"></i> Trailer</button>` : '';

    let seasonsSectionHTML = '';
    if (isTV && details.seasons && details.seasons.length > 0) {
        const validSeasons = details.seasons.filter(s => s.season_number > 0 && s.episode_count > 0);
        if (validSeasons.length > 0) {
            seasonsSectionHTML = `
                <div class="details-seasons-section">
                    <h3 class="details-section-subtitle">Temporadas</h3>
                    <div class="season-tabs">
                        ${validSeasons.map((season, index) => `
                            <button class="season-tab ${index === 0 ? 'active' : ''}" data-season-number="${season.season_number}">
                                ${season.name}
                            </button>
                        `).join('')}
                    </div>
                    <div id="episodes-list-container"></div>
                </div>
            `;
        }
    }

    const detailsHTML = `
        <div class="swal-details-content">
            ${headerContentHTML}
            <div class="details-info-area">
                <h2 class="details-content-title">${titleText}</h2>
                <div class="details-meta-info">
                    ${releaseDate ? `<span><i class="fas fa-calendar-alt"></i> ${new Date(releaseDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</span>` : ''}
                    ${rating !== 'N/A' ? `<span><i class="fas fa-star"></i> ${rating}/10</span>` : ''}
                    ${runtime ? `<span><i class="fas fa-clock"></i> ${runtime} min</span>` : ''}
                </div>
                <p class="details-genres"><strong>Gêneros:</strong> ${genres}</p>
                <div class="modal-actions-wrapper">${favoriteButtonHTML}${copyLinkButtonHTML}${trailerButtonHTML}</div>
                <div id="trailer-container"></div>
                <h3 class="details-section-subtitle" style="padding-left:0; margin-top: 16px;">Sinopse</h3>
                <p class="details-overview">${overview}</p>
            </div>
            ${castSectionHTML}
            ${seasonsSectionHTML}
        </div>`;

    Swal.update({ title: '', html: detailsHTML, showConfirmButton: false });

    // --- CORRECTED: Dynamic Download Button Logic ---
    if (!isTV && imdbId) {
        const favoriteBtn = document.getElementById('modalFavoriteButton');
        if (favoriteBtn) {
            const downloadUrl = `http://fhd4.oneplayer.site/343rt342wtg34wetg34retg4rgh5kh4/FHD4/${imdbId}.mp4`;
            const downloadLink = document.createElement('a');
            downloadLink.href = downloadUrl;
            downloadLink.className = 'modal-download-button';
            downloadLink.title = 'Baixar Filme (FHD)';
            downloadLink.innerHTML = '<i class="fas fa-download"></i>';
            const fileName = `${titleText.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.mp4`;
            downloadLink.setAttribute('download', fileName);
            
            // Insert the download link after the favorite button
            favoriteBtn.after(downloadLink);
        }
    }

    if (fromSorteio && typeof lastPickedMediaType !== 'undefined' && lastPickedMediaType !== null) {
        const swalPopup = Swal.getPopup();
        if (swalPopup) {
            const sortAgainButton = document.createElement('button');
            sortAgainButton.id = 'modalSortAgainButton';
            sortAgainButton.className = 'modal-action-button swal-sort-again-button';
            sortAgainButton.innerHTML = '<i class="fas fa-redo"></i> Sortear Novamente';
            sortAgainButton.addEventListener('click', () => {
                Swal.close();
                pickRandomMedia(lastPickedMediaType);
            });
            swalPopup.appendChild(sortAgainButton);
        }
    }

    const playButton = document.getElementById('modal-play-button');
    if (playButton && mainPlayerUrl) {
         playButton.addEventListener('click', () => {
            launchAdvancedPlayer(mainPlayerUrl, logoPathForPlayer, details, 'movie');
        });
    }

    document.getElementById('modalFavoriteButton')?.addEventListener('click', () => toggleFavorite(details, mediaType));
    document.getElementById('modalCopyLinkButton')?.addEventListener('click', () => copyToClipboard(shareUrl));

    if (trailerKey) {
        document.getElementById('modalTrailerButton')?.addEventListener('click', () => {
            const trailerContainer = document.getElementById('trailer-container');
            if (trailerContainer) {
                if (trailerContainer.classList.contains('visible')) {
                    trailerContainer.classList.remove('visible');
                    setTimeout(() => { trailerContainer.innerHTML = ''; }, 300);
                } else {
                    trailerContainer.innerHTML = `<iframe src="https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
                    void trailerContainer.offsetWidth; 
                    trailerContainer.classList.add('visible');
                }
            }
        });
    }

    if (isTV && document.getElementById('episodes-list-container')) {
        const seasonTabs = document.querySelectorAll('.season-tab');
        const episodesContainer = document.getElementById('episodes-list-container');
        
        seasonTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                seasonTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                const seasonNumber = tab.dataset.seasonNumber;
                fetchAndDisplayEpisodes(itemId, seasonNumber, episodesContainer);
            });
        });

        if (seasonTabs.length > 0) {
            seasonTabs[0].click();
        }
    }
}

// --- Player Functions ---

function closeAdvancedPlayer() {
    const wrapper = document.getElementById('player-fullscreen-wrapper');
    if (wrapper) {
        wrapper.style.display = 'none';
        wrapper.innerHTML = ''; 
    }

    const swalContainer = Swal.getContainer();
    if (swalContainer) {
        swalContainer.style.display = '';
    }
    document.body.classList.remove('player-active');
}

function launchAdvancedPlayer(url, logoPath, itemData, mediaType, seasonInfo = null, episodeInfo = null) {
    addToWatchHistory(itemData, mediaType, seasonInfo, episodeInfo);

    const wrapper = document.getElementById('player-fullscreen-wrapper');
    if (!wrapper) {
        showCustomToast('Erro Crítico: Componente do leitor ausente.', 'info');
        return;
    }

    const logoForPlayerHTML = logoPath 
        ? `<img src="${TMDB_IMAGE_BASE_URL}w300${logoPath}" id="player-logo" alt="logo">`
        : '';

    wrapper.innerHTML = `
        <iframe src="${url}" allowfullscreen sandbox="allow-scripts allow-same-origin allow-presentation" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;"></iframe>
        <button id="player-close-btn" title="Voltar"><i class="fas fa-arrow-left"></i></button>
        ${logoForPlayerHTML}`;

    const swalContainer = Swal.getContainer();
    if (swalContainer) {
        swalContainer.style.display = 'none';
    }

    wrapper.style.display = 'flex';
    wrapper.style.zIndex = '9999';
    document.body.classList.add('player-active');

    document.getElementById('player-close-btn')?.addEventListener('click', e => {
        e.stopPropagation();
        closeAdvancedPlayer();
    });
}


async function openFilterSweetAlert() {
    const swalHTML = `<div class="swal-genre-filter-type-selector mb-4"><button id="swalMovieGenreTypeButton" data-type="movie" class="${currentFilterTypeSA === 'movie' ? 'active' : ''}">Filmes</button><button id="swalTvGenreTypeButton" data-type="tv" class="${currentFilterTypeSA === 'tv' ? 'active' : ''}">Séries</button><button id="swalAnimeGenreTypeButton" data-type="anime" class="${currentFilterTypeSA === 'anime' ? 'active' : ''}">Animes</button></div><div id="swalGenreButtonsPanel" class="swal-genre-buttons-panel my-4">A carregar...</div>`;
    Swal.fire({
        title: 'Filtrar por Gênero', html: swalHTML, showCloseButton: true, showDenyButton: true,
        denyButtonText: 'Limpar Filtro', confirmButtonText: 'Aplicar Filtro',
        customClass: { popup: 'swal2-popup' },
        didOpen: () => {
            const genrePanel = document.getElementById('swalGenreButtonsPanel');
            document.getElementById('swalMovieGenreTypeButton')?.addEventListener('click', () => fetchAndDisplayGenresInSA('movie', genrePanel));
            document.getElementById('swalTvGenreTypeButton')?.addEventListener('click', () => fetchAndDisplayGenresInSA('tv', genrePanel));
            document.getElementById('swalAnimeGenreTypeButton')?.addEventListener('click', () => fetchAndDisplayGenresInSA('anime', genrePanel));
            fetchAndDisplayGenresInSA(currentFilterTypeSA, genrePanel);
        },
        preConfirm: () => selectedGenreSA,
    }).then(async (result) => {
        if (result.isConfirmed) applyGenreFilterFromSA();
        else if (result.isDenied) {
            selectedGenreSA = { id: null, name: null, type: null };
            activeAppliedGenre = { id: null, name: null, type: null };
            if (filterToggleButton) filterToggleButton.classList.remove('active');
            loadMainPageContent();
        }
    });
}

async function fetchAndDisplayGenresInSA(mediaType, genrePanelElement) {
    if (!genrePanelElement) return;
    currentFilterTypeSA = mediaType;
    document.querySelectorAll('.swal-genre-filter-type-selector button').forEach(btn => btn.classList.toggle('active', btn.dataset.type === mediaType));
    genrePanelElement.innerHTML = '<div class="loader mx-auto my-3"></div>';
    const genresToFetchType = mediaType === 'anime' ? 'tv' : mediaType;
    const data = await fetchTMDB(`/genre/${genresToFetchType}/list`);
    genrePanelElement.innerHTML = '';
    if (data && !data.error && data.genres) {
        if (mediaType === 'anime') {
            const allBtn = document.createElement('button');
            allBtn.textContent = 'Todos os Animes'; allBtn.dataset.genreId = '';
            allBtn.onclick = () => { selectedGenreSA = { id: null, name: 'Todos', type: 'anime' }; updateGenreButtonsInSAUI(genrePanelElement); };
            genrePanelElement.appendChild(allBtn);
        }
        data.genres.forEach(genre => {
            const button = document.createElement('button');
            button.textContent = genre.name; button.dataset.genreId = genre.id;
            button.onclick = () => { selectedGenreSA = { id: genre.id, name: genre.name, type: mediaType }; updateGenreButtonsInSAUI(genrePanelElement); };
            genrePanelElement.appendChild(button);
        });
        updateGenreButtonsInSAUI(genrePanelElement);
    } else {
        genrePanelElement.innerHTML = `<p class="text-xs text-center">Gêneros não encontrados.</p>`;
    }
}

function updateGenreButtonsInSAUI(panel) {
    if (!panel) return;
    panel.querySelectorAll('button').forEach(btn => {
        const btnId = btn.dataset.genreId ? parseInt(btn.dataset.genreId, 10) : null;
        const isActive = (selectedGenreSA.id === null && btnId === null && selectedGenreSA.type === 'anime') || (btnId === selectedGenreSA.id);
        btn.classList.toggle('active', isActive);
    });
}

async function loadMoreItems() {
    if (isLoadingMore) return;
    isLoadingMore = true;
    if (searchResultsLoader) searchResultsLoader.style.display = 'block';
    let nextPageData = null;
    try {
        if (currentContentContext === 'search' && searchCurrentPage < totalPages.search) {
            searchCurrentPage++;
            nextPageData = await fetchTMDB('/search/multi', { query: searchInput.value, page: searchCurrentPage });
            if (nextPageData && !nextPageData.error && nextPageData.results) {
                totalPages.search = nextPageData.total_pages || totalPages.search;
                displayResults(nextPageData.results, null, singleResultsGrid, false);
            } else { searchCurrentPage--; }
        } else if (currentContentContext === 'filter' && filterCurrentPage < totalPages.filter) {
            filterCurrentPage++;
            const endpointType = activeAppliedGenre.type === 'movie' ? 'movie' : 'tv';
            let params = { sort_by: 'popularity.desc', page: filterCurrentPage };
            if (activeAppliedGenre.id) params.with_genres = activeAppliedGenre.id;
            if (activeAppliedGenre.type === 'anime') {
                params.with_origin_country = TMDB_JAPAN_COUNTRY_CODE;
                params.with_keywords = TMDB_ANIME_KEYWORD_ID;
            }
            nextPageData = await fetchTMDB(`/discover/${endpointType}`, params);
            if (nextPageData && !nextPageData.error && nextPageData.results) {
                totalPages.filter = nextPageData.total_pages || totalPages.filter;
                displayResults(nextPageData.results, activeAppliedGenre.type, singleResultsGrid, false);
            } else { filterCurrentPage--; }
        }
    } catch (error) {
        console.error("Erro ao carregar mais itens:", error);
    } finally {
        if (searchResultsLoader) searchResultsLoader.style.display = 'none';
        isLoadingMore = false;
    }
}

function showCustomToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `custom-toast custom-toast--${type}`;
    toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}"></i><span>${message}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 400); }, 2500);
}

function shuffleArray(array) { for (let i = array.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[array[i], array[j]] = [array[j], array[i]]; } }
function showLoader() { if (loader) loader.style.display = 'flex'; }
function hideLoader() { if (loader) loader.style.display = 'none'; }
function updatePageBackground(path) { if (pageBackdrop) pageBackdrop.style.backgroundImage = path ? `url(${TMDB_IMAGE_BASE_URL}w1280${path})` : ''; }

function isFavorite(id, type) {
    return favorites.some(fav => fav.id.toString() === id.toString() && fav.media_type === type);
}

function toggleFavorite(item, type) {
    const itemId = item.id.toString();
    const index = favorites.findIndex(fav => fav.id.toString() === itemId && fav.media_type === type);
    if (index > -1) {
        favorites.splice(index, 1);
        showCustomToast('Removido dos Favoritos', 'info');
    } else {
        favorites.unshift({ id: item.id, media_type: type, title: item.title || item.name, poster_path: item.poster_path, backdrop_path: item.backdrop_path });
        showCustomToast('Adicionado aos Favoritos', 'success');
    }
    saveAllUserData();
    updateFavoriteButtonsState(item.id, type);
}

function updateFavoriteButtonsState(id, type) {
    const isFav = isFavorite(id, type);
    document.querySelectorAll(`.favorite-button[data-id="${id}"][data-type="${type}"]`).forEach(btn => {
        btn.classList.toggle('active', isFav);
        btn.innerHTML = isFav ? '<i class="fas fa-heart"></i>' : '<i class="far fa-heart"></i>';
    });
    const modalBtn = document.getElementById('modalFavoriteButton');
    if (modalBtn && modalBtn.dataset.id == id && modalBtn.dataset.type == type) {
        modalBtn.classList.toggle('active', isFav);
        modalBtn.title = isFav ? 'Remover dos Favoritos' : 'Adicionar aos Favoritos';
        modalBtn.innerHTML = isFav ? '<i class="fas fa-heart"></i>' : '<i class="far fa-heart"></i>';
    }
}

function updateAllFavoriteButtonsUI() {
    document.querySelectorAll('.favorite-button').forEach(btn => {
        const id = btn.dataset.id;
        const type = btn.dataset.type;
        if (id && type) {
            const isFav = isFavorite(id, type);
            btn.classList.toggle('active', isFav);
            btn.innerHTML = isFav ? '<i class="fas fa-heart"></i>' : '<i class="far fa-heart"></i>';
        }
    });
}

// --- Funções de Gerenciamento do Histórico de Exibição ---
function displayContinueWatching() {
    if (!continueWatchingSection || !continueWatchingGrid) return;

    if (watchHistory && watchHistory.length > 0) {
        continueWatchingSection.style.display = 'block';
        continueWatchingGrid.innerHTML = '';

        const fragment = document.createDocumentFragment();
        watchHistory.forEach(item => {
            const card = document.createElement('div');
            card.className = 'content-card';
            card.onclick = () => openItemModal(item.id, item.media_type, item.backdrop_path);

            const title = item.title || item.name || 'Título';
            const imageUrl = item.poster_path
                ? `${TMDB_IMAGE_BASE_URL}w400${item.poster_path}`
                : `https://placehold.co/400x600/0F071A/F3F4F6?text=${encodeURIComponent(title)}&font=inter`;

            const detailText = item.media_type === 'tv' && item.season && item.episode
                ? `T${item.season} E${item.episode}`
                : `Visto em ${new Date(item.date).toLocaleDateString('pt-BR')}`;

            card.innerHTML = `
                <img src="${imageUrl}" alt="${title}">
                <div class="title-overlay">
                    <div class="title">${title}</div>
                    <div class="subtitle">${detailText}</div>
                </div>
                <button class="remove-history-button" data-id="${item.id}" title="Remover do histórico">
                    <i class="fas fa-times-circle"></i>
                </button>`;

            card.querySelector('.remove-history-button').onclick = (e) => {
                e.stopPropagation();
                removeFromWatchHistory(item.id);
                displayContinueWatching();
            };
            fragment.appendChild(card);
        });
        continueWatchingGrid.appendChild(fragment);
    } else {
        continueWatchingSection.style.display = 'none';
        continueWatchingGrid.innerHTML = '';
    }
}

function addToWatchHistory(item, mediaType, seasonInfo = null, episodeInfo = null) {
    const entry = {
        id: item.id,
        title: item.title || item.name || "",
        poster_path: item.poster_path || "",
        media_type: mediaType,
        date: new Date().toISOString(),
        season: seasonInfo?.season_number || null,
        episode: episodeInfo?.episode_number || null
    };
    watchHistory = watchHistory.filter(h => !(h.id === entry.id && h.media_type === entry.media_type));
    watchHistory.unshift(entry);
    if (watchHistory.length > 100) watchHistory.pop();
    saveAllUserData();
    updateHistoryButtonVisibility();
    displayContinueWatching();
}

function removeFromWatchHistory(itemId) {
    watchHistory = watchHistory.filter(h => h.id.toString() !== itemId.toString());
    saveAllUserData();
    showCustomToast('Removido do histórico', 'info');
    displayContinueWatching();
}

function updateHistoryButtonVisibility() {
    if (floatingCombinedButton) {
        floatingCombinedButton.style.display = 'flex';
    }
}

function displayResults(items, defaultType, targetEl, replace) {
    if (!targetEl) return;
    if (replace) targetEl.innerHTML = '';
    const fragment = document.createDocumentFragment();
    if (!items || items.length === 0) { if (replace) targetEl.innerHTML = `<p class="col-span-full text-center">Nenhum item para exibir.</p>`; return; }
    
    items.forEach(item => {
        const mediaType = item.media_type || defaultType;
        if (!mediaType) return;
        
        const card = document.createElement('div'); 
        card.className = 'content-card';
        card.onclick = () => openItemModal(item.id, mediaType, item.backdrop_path);
        
        const isFav = isFavorite(item.id, mediaType);
        const title = item.title || item.name || 'Título';
        const imageUrl = item.poster_path
            ? `${TMDB_IMAGE_BASE_URL}w400${item.poster_path}`
            : `https://placehold.co/400x600/0F071A/F3F4F6?text=${encodeURIComponent(title)}&font=inter`;

        card.innerHTML = `
            <img src="${imageUrl}" alt="${title}">
            <div class="title-overlay"><div class="title">${title}</div></div>
            <button class="favorite-button ${isFav ? 'active' : ''}" data-id="${item.id}" data-type="${mediaType}">
                <i class="${isFav ? 'fas fa-heart' : 'far fa-heart'}"></i>
            </button>`;
            
        card.querySelector('.favorite-button').onclick = (e) => { e.stopPropagation(); toggleFavorite(item, mediaType); };
        fragment.appendChild(card);
    });
    
    targetEl.appendChild(fragment);
}

function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => {
            showCustomToast('Link copiado!', 'success');
        }).catch(() => {
            showCustomToast('Erro ao copiar.', 'info');
        });
    } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            showCustomToast('Link copiado!', 'success');
        } catch (err) {
            showCustomToast('Erro ao copiar.', 'info');
        } finally {
            document.body.removeChild(textArea);
        }
    }
}

function openCombinedModal() {
    const userSectionHTML = currentUser ? `
        <div class="user-profile-section">
            <img src="${currentUser.photoURL || `https://ui-avatars.com/api/?name=${currentUser.email.split('@')[0]}&background=random&color=fff`}" alt="User Avatar" class="user-avatar"/>
            <span class="user-name">${currentUser.displayName || currentUser.email}</span>
            <button id="modalSignOutButton" class="modal-action-button"><i class="fas fa-sign-out-alt"></i> Sair</button>
        </div>
    ` : `
        <div class="user-profile-section no-user">
            <p>Faça login para sincronizar seus dados!</p>
            <button id="modalLoginButton" class="modal-action-button"><i class="fab fa-google"></i> Login com Google</button>
            <button id="modalLoginEmailButton" class="modal-action-button email-login"><i class="fas fa-envelope"></i> Login com Email</button>
        </div>
    `;

    const modalHTML = `
        ${userSectionHTML}
        <div class="swal-tabs">
            <button class="swal-tab-button active" data-tab="favorites"><i class="fas fa-heart"></i> Favoritos</button>
            <button class="swal-tab-button" data-tab="history"><i class="fas fa-history"></i> Histórico</button>
        </div>
        <div id="swal-tab-content"></div>
    `;

    Swal.fire({
        title: 'Perfil',
        html: modalHTML,
        showConfirmButton: false,
        showCloseButton: true,
        customClass: { popup: 'swal-combined-popup' },
        didOpen: () => {
            const tabButtons = document.querySelectorAll('.swal-tab-button');
            const tabContent = document.getElementById('swal-tab-content');

            if (currentUser) {
                document.getElementById('modalSignOutButton')?.addEventListener('click', signOut);
            } else {
                document.getElementById('modalLoginButton')?.addEventListener('click', signInWithGoogle);
                document.getElementById('modalLoginEmailButton')?.addEventListener('click', signInWithEmail);
            }

            const showTab = (tab) => {
                tabButtons.forEach(btn => btn.classList.remove('active'));
                document.querySelector(`.swal-tab-button[data-tab="${tab}"]`).classList.add('active');

                if (tab === 'favorites') {
                    let favsHtml = '<p class="text-center text-gray-400 py-5">Não tem favoritos.</p>';
                    if (favorites && favorites.length > 0) {
                        favsHtml = `<div class="favorites-grid">${favorites.map(item => {
                            const title = item.title || '';
                            const imageUrl = item.poster_path 
                                ? `${TMDB_IMAGE_BASE_URL}w342${item.poster_path}`
                                : `https://placehold.co/342x513/0F071A/F3F4F6?text=${encodeURIComponent(title)}&font=inter`;
                            return `
                            <div class="content-card favorite-card" onclick="Swal.close(); openItemModal(${item.id}, '${item.media_type}', '${item.backdrop_path || ''}')">
                                <img src="${imageUrl}" alt="${title}">
                                <div class="title-overlay"><div class="title">${title}</div></div>
                                <button class="remove-favorite-button" data-id="${item.id}" data-type="${item.media_type}"><i class="fas fa-times-circle"></i></button>
                            </div>`}).join('')}</div>`;
                    }
                    tabContent.innerHTML = favsHtml;
                    document.querySelectorAll('.remove-favorite-button').forEach(button => {
                        button.addEventListener('click', e => {
                            e.stopPropagation();
                            const itemToRemove = favorites.find(fav => fav.id.toString() === button.dataset.id && fav.media_type === button.dataset.type);
                            if (itemToRemove) {
                                toggleFavorite(itemToRemove, itemToRemove.media_type);
                                const card = button.closest('.favorite-card');
                                card.style.transition = 'opacity 0.3s';
                                card.style.opacity = '0';
                                setTimeout(() => card.remove(), 300);
                            }
                        });
                    });
                } else if (tab === 'history') {
                    let historyItemsHTML = '<p class="text-center text-gray-400 py-5">O seu histórico está vazio.</p>';
                    if (watchHistory && watchHistory.length > 0) {
                        historyItemsHTML = watchHistory.map(item => {
                            const title = item.title || 'Título';
                            const imageUrl = item.poster_path 
                                ? `${TMDB_IMAGE_BASE_URL}w92${item.poster_path}`
                                : `https://placehold.co/92x138/0F071A/F3F4F6?text=${encodeURIComponent(title)}&font=inter`;
                            const detailText = item.media_type === 'tv' && item.season && item.episode
                                ? `T${item.season} E${item.episode}`
                                : `Visto em ${new Date(item.date).toLocaleDateString('pt-BR')}`;

                            return `
                                <div class="history-list-item" data-id="${item.id}" data-type="${item.media_type}">
                                    <img src="${imageUrl}" alt="Poster" class="history-list-poster">
                                    <div class="history-list-info">
                                        <div class="history-list-title">${title}</div>
                                        <div class="history-list-details">${detailText}</div>
                                    </div>
                                    <div class="history-list-actions">
                                        <button class="remove-history-button" data-id="${item.id}" title="Remover do histórico">
                                            <i class="fas fa-times"></i>
                                        </button>
                                    </div>
                                </div>
                            `;
                        }).join('');
                    }
                    tabContent.innerHTML = `<div class="history-list">${historyItemsHTML}</div>`;
                    document.querySelectorAll('.history-list-item').forEach(itemEl => {
                        itemEl.addEventListener('click', (e) => {
                            if (e.target.closest('.remove-history-button')) return;
                            Swal.close();
                            openItemModal(itemEl.dataset.id, itemEl.dataset.type);
                        });
                    });
                    document.querySelectorAll('.remove-history-button').forEach(button => {
                        button.addEventListener('click', (e) => {
                            e.stopPropagation();
                            const itemId = button.dataset.id;
                            const itemEl = button.closest('.history-list-item');
                            itemEl.style.transition = 'opacity 0.3s, transform 0.3s';
                            itemEl.style.opacity = '0';
                            itemEl.style.transform = 'translateX(-20px)';
                            setTimeout(() => {
                                itemEl.remove();
                                removeFromWatchHistory(itemId);
                                if (document.querySelector('.history-list').children.length === 0) {
                                    document.querySelector('.history-list').innerHTML = '<p class="text-center text-gray-400 py-5">O seu histórico está vazio.</p>';
                                }
                            }, 300);
                        });
                    });
                }
            };

            tabButtons.forEach(button => {
                button.addEventListener('click', () => {
                    showTab(button.dataset.tab);
                });
            });

            showTab('favorites');
        }
    });
}

function debounce(func, delay) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}

document.addEventListener('DOMContentLoaded', () => {
    const apiKeyIsValid = typeof TMDB_API_KEY !== 'undefined' && TMDB_API_KEY.length > 10;
    if (!apiKeyIsValid) {
        document.body.innerHTML = `<div style="color:red;padding:2rem;text-align:center;">Erro: Chave da API não configurada.</div>`;
        return;
    }
    
    if (searchInput) searchInput.addEventListener('input', debounce(() => performSearch(searchInput.value), 500));
    if (searchButton) searchButton.addEventListener('click', () => performSearch(searchInput.value));
    if (filterToggleButton) filterToggleButton.addEventListener('click', openFilterSweetAlert);
    if (floatingCombinedButton) floatingCombinedButton.addEventListener('click', openCombinedModal);
    const homeFloatingButton = document.getElementById('homeFloatingButton');
    if (homeFloatingButton) {
        homeFloatingButton.addEventListener('click', () => {
            window.parent.location.href = '../index.html'; // Redireciona para o index.html pai
        });
    }

    const toggleSorteioButtons = document.getElementById('toggleSorteioButtons');
    const sorteioButtonsContainer = document.getElementById('sorteioButtonsContainer');

    if (toggleSorteioButtons && sorteioButtonsContainer) {
        toggleSorteioButtons.addEventListener('click', (e) => {
            e.stopPropagation();
            const isVisible = sorteioButtonsContainer.style.display === 'flex';
            sorteioButtonsContainer.style.display = isVisible ? 'none' : 'flex';
        });

        document.addEventListener('click', (e) => {
            if (!sorteioButtonsContainer.contains(e.target) && !toggleSorteioButtons.contains(e.target)) {
                sorteioButtonsContainer.style.display = 'none';
            }
        });
    }

    updateHistoryButtonVisibility();

    const mainContent = document.getElementById('main-content');
    const toggleCalendarBtn = document.getElementById('toggle-calendar-btn');

    if (toggleCalendarBtn) {
        toggleCalendarBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            document.body.classList.toggle('calendar-open');

            const isCalendarOpen = document.body.classList.contains('calendar-open');
            const icon = toggleCalendarBtn.querySelector('i');

            if (isCalendarOpen) {
                icon.classList.remove('fa-calendar-alt');
                icon.classList.add('fa-times');
                toggleCalendarBtn.setAttribute('aria-label', 'Fechar Calendário');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-calendar-alt');
                toggleCalendarBtn.setAttribute('aria-label', 'Abrir Calendário');
            }
        });
    }

    if (mainContent) mainContent.addEventListener('click', () => { 
        if (document.body.classList.contains('calendar-open')) {
            document.body.classList.remove('calendar-open');
            const icon = toggleCalendarBtn.querySelector('i');
            icon.classList.remove('fa-times');
            icon.classList.add('fa-calendar-alt');
            toggleCalendarBtn.setAttribute('aria-label', 'Abrir Calendário');
        }
    });

    const debouncedLoadMoreMovies = debounce(loadMorePopularMovies, 300);
    const debouncedLoadMoreShows = debounce(loadMoreTopRatedTvShows, 300);
    const debouncedLoadMoreItems = debounce(loadMoreItems, 300);

    if(moviesResultsGrid) moviesResultsGrid.addEventListener('scroll', () => {
        if (defaultContentSections?.style.display === 'block' && !isLoadingMorePopularMovies && popularMoviesCurrentPage < popularMoviesTotalPages && (moviesResultsGrid.scrollLeft + moviesResultsGrid.clientWidth >= moviesResultsGrid.scrollWidth - 200)) {
            debouncedLoadMoreMovies();
        }
    });

    if(tvShowsResultsGrid) tvShowsResultsGrid.addEventListener('scroll', () => {
        if (defaultContentSections?.style.display === 'block' && !isLoadingMoreTopRatedTvShows && topRatedTvShowsCurrentPage < topRatedTvShowsTotalPages && (tvShowsResultsGrid.scrollLeft + tvShowsResultsGrid.clientWidth >= tvShowsResultsGrid.scrollWidth - 200)) {
            debouncedLoadMoreShows();
        }
    });

    // --- CORREÇÃO: Lógica de Scroll Infinito para a página de resultados ---
    const scrollContainer = document.getElementById('main-content');
    if (scrollContainer) {
        scrollContainer.addEventListener('scroll', () => {
            // Verifica se a seção de resultados únicos está visível e se não há carregamento em andamento
            const isSingleSectionVisible = singleResultsSection?.style.display === 'block';
            if (!isSingleSectionVisible || isLoadingMore) return;
    
            const offset = 300; // Carrega mais itens quando faltarem 300px para o final
            const scrolledToEnd = (scrollContainer.scrollTop + scrollContainer.clientHeight) >= scrollContainer.scrollHeight - offset;
    
            if (scrolledToEnd) {
                debouncedLoadMoreItems();
            }
        });
    }


    document.addEventListener('fullscreenchange', () => {
        if (!document.fullscreenElement) {
            closeAdvancedPlayer();
        }
    });

    const urlParams = new URLSearchParams(window.location.search);
    const typeParam = urlParams.get('type');
    const idParam = urlParams.get('id');
    if (typeParam && idParam) openItemModal(idParam, typeParam);
    else loadMainPageContent();

    displayContinueWatching();
});