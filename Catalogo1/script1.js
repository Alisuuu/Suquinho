// --- Constants and Configuration ---
        const TMDB_API_KEY = '5e5da432e96174227b25086fe8637985'; // Sua chave da API do TMDB
        const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
        const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/'; // Base para posters e backdrops de diferentes tamanhos
        const TMDB_BACKDROP_BASE_URL = 'https://image.tmdb.org/t/p/original'; // Base específica para backdrops grandes
        const LANGUAGE = 'pt-BR';
        const PLACEHOLDER_PERSON_IMAGE = 'https://placehold.co/185x278/0F071A/F3F4F6?text=Sem+Foto&font=inter';
        const PLAYER_BASE_URL_MOVIE = 'https://superflixapi.lat//filme/';
        const PLAYER_BASE_URL_SERIES = 'https://superflixapi.lat//serie/';

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

        const FAVORITES_STORAGE_KEY = 'suquin_favorites';
        const TMDB_ANIME_KEYWORD_ID = '210024'; // Keyword ID for 'anime' on TMDB
        const TMDB_JAPAN_COUNTRY_CODE = 'JP'; // Country code for Japan
