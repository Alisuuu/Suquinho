// Crie um objeto App.API global se ainda não existir
window.App = window.App || {};
App.API = App.API || {};

// Dependências: App.Constants (definido em script1.js)

App.API.fetchMultiplePages = async (endpoint, baseParams = {}, pagesToFetch = 2) => {
    let allResults = [];
    const promises = [];
    for (let i = 1; i <= pagesToFetch; i++) {
        promises.push(
            fetch(`${App.Constants.TMDB_BASE_URL}/${endpoint}?${new URLSearchParams({ api_key: App.Constants.TMDB_API_KEY, language: 'pt-BR', page: i, ...baseParams })}`)
                .then(response => {
                    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                    return response.json();
                })
        );
    }
    try {
        const pageDataArray = await Promise.all(promises);
        pageDataArray.forEach(pageData => {
            if (pageData?.results) allResults = allResults.concat(pageData.results);
        });
        allResults = allResults.filter((item, index, self) => index === self.findIndex((t) => (t.id === item.id)));
        return { results: allResults };
    } catch (error) {
        console.error(`Failed to fetch multiple pages for ${endpoint}:`, error);
        throw error;
    }
};

App.API.fetchItemDetailsFromApi = async (itemId, mediaType) => {
    const endpoint = `${mediaType}/${itemId}`;
    const paramsToAppend = mediaType === 'tv' ? 'videos,external_ids,aggregate_credits' : 'videos,external_ids';
    const urlParams = new URLSearchParams({ api_key: App.Constants.TMDB_API_KEY, language: 'pt-BR', append_to_response: paramsToAppend });

    try {
        const response = await fetch(`${App.Constants.TMDB_BASE_URL}/${endpoint}?${urlParams}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error(`Failed to fetch item details for ${mediaType}/${itemId}:`, error);
        throw error;
    }
};

App.API.fetchSeasonDetailsFromApi = async (tvId, seasonNumber) => {
    const endpoint = `tv/${tvId}/season/${seasonNumber}`;
    const urlParams = new URLSearchParams({ api_key: App.Constants.TMDB_API_KEY, language: 'pt-BR' });
    try {
        const response = await fetch(`${App.Constants.TMDB_BASE_URL}/${endpoint}?${urlParams}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error(`Failed to fetch season ${seasonNumber} for TV ID ${tvId}:`, error);
        throw error;
    }
};

// REMOVIDO: App.API.fetchGeminiApi não é mais necessário

App.API.checkEmbedderStatus = async (tmdbId, type, season = null, episode = null) => {
    let statusUrl = `https://embedder.net/api/status?tmdb=${tmdbId}&type=${type}`;
    if (type === 'tv' && season && episode) {
        statusUrl += `&sea=${season}&epi=${episode}`;
    }
    try {
        const statusResponse = await fetch(statusUrl);
        if (!statusResponse.ok) throw new Error(`HTTP error! status: ${statusResponse.status}`);
        const statusText = await statusResponse.text();
        return statusText.trim().toLowerCase() === 'true';
    } catch (error) {
        console.error("Falha ao verificar status no Embedder.net:", statusUrl, error);
        throw error;
    }
};
