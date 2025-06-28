// --- Constants and Configuration ---
const TMDB_API_KEY = '5e5da432e96174227b25086fe8637985';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/';
const LANGUAGE = 'pt-BR';
const PLACEHOLDER_PERSON_IMAGE = 'https://placehold.co/185x278/0F071A/F3F4F6?text=Sem+Foto&font=inter';
const PLAYER_BASE_URL_MOVIE = 'https://playerflixapi.com/filme/';
const PLAYER_BASE_URL_SERIES = 'https://playerflixapi.com/serie/';
const FAVORITES_STORAGE_KEY = 'suquin_favorites_v2';
const TMDB_ANIME_KEYWORD_ID = '210024';
const TMDB_JAPAN_COUNTRY_CODE = 'JP';

// ADICIONADO: Mapa de palavras-chave para busca por estúdio/produtora. Estava faltando e causando erro na busca.
const companyKeywordMap = {
    'disney': { name: 'Disney', ids: [2, 3, 420, 1] }, // Inclui Disney, Pixar, Marvel, Lucasfilm
    'pixar': { name: 'Pixar', ids: [3] },
    'marvel': { name: 'Marvel', ids: [420] },
    'netflix': { name: 'Netflix', ids: [213] },
    'hbo': { name: 'HBO', ids: [3268, 11073] },
    'warner': { name: 'Warner Bros.', ids: [174, 9993] },
    'universal': { name: 'Universal', ids: [33] },
    'sony': { name: 'Sony', ids: [5] },
    'paramount': { name: 'Paramount', ids: [4] }
};