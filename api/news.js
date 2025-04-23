import fetch from 'node-fetch';

export default async function handler(request, response) {
    const apiKey = process.env.NEWS_API_KEY;

    if (!apiKey) {
        return response.status(500).json({ error: 'NEWS_API_KEY não configurada.' });
    }

    try {
        // 1. Configurar URL para busca de notícias sobre filmes e séries
        const apiUrl = new URL('https://newsapi.org/v2/everything');
        const params = {
            q: 'cinema OR filme OR série OR hollywood OR crítica',  // Usando palavras-chave para cinema, filmes e séries
            language: 'pt',
            apiKey: apiKey
        };
        Object.keys(params).forEach(key => apiUrl.searchParams.append(key, params[key]));

        const apiResponse = await fetch(apiUrl.toString());
        const apiData = await apiResponse.json();

        if (apiData.status === 'ok' && apiData.articles && apiData.articles.length > 0) {
            response.status(200).json({
                status: 'ok',
                count: apiData.articles.length,
                articles: apiData.articles
            });
        } else {
            response.status(200).json({
                status: 'ok',
                count: 0,
                articles: []
            });
        }

    } catch (error) {
        console.error('Erro:', error);
        response.status(500).json({ error: 'Erro ao buscar notícias' });
    }
}
