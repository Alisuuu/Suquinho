import fetch from 'node-fetch';

export default async function handler(request, response) {
    const apiKey = process.env.NEWS_API_KEY;

    // Pega o termo de busca da query string (ex: /api/news?q=avatar)
    const { q: searchQuery } = request.query;

    if (!apiKey) {
        return response.status(500).json({
            status: 'error',
            message: 'A chave da API (NEWS_API_KEY) não está configurada no ambiente.'
        });
    }

    try {
        const apiUrl = new URL('https://newsapi.org/v2/everything');

        // Se uma busca foi feita, usa o termo. Senão, usa a query padrão.
        const query = searchQuery ?
            `"${searchQuery}"` : // Busca pelo termo exato para mais relevância
            '"cinema" OR "filme" OR "série" OR "estreia" OR "marvel" OR "dc" OR "netflix" OR "streaming"';

        const params = {
            q: query,
            language: 'pt',
            sortBy: searchQuery ? 'relevancy' : 'publishedAt', // Ordena por relevância na busca
            pageSize: 40, // Pede mais artigos para ter margem para filtrar
            apiKey: apiKey
        };

        Object.keys(params).forEach(key => {
            apiUrl.searchParams.append(key, params[key]);
        });

        const apiResponse = await fetch(apiUrl.toString());
        const apiData = await apiResponse.json();

        if (apiData.status === 'ok') {
            const termsToExclude = [
                'futebol', 'novela', 'bbb', 'tecnologia', 'política', 'esportes',
                'globo', 'musica', 'eua', 'papa', 'tv', 'bet', 'games',
                'geopolitica', 'teatro', 'eleições', 'religião', 'dorama',
                'anvisa', 'moda', 'veículos', 'economia', 'saúde'
            ];
            
            // Se for uma busca específica do usuário, o filtro pode ser mais leve.
            // Se for a busca geral, o filtro é mais rigoroso.
            const requiredTerms = searchQuery ? 
                [searchQuery.toLowerCase()] :
                ['cinema', 'filme', 'série', 'marvel', 'dc', 'netflix', 'prime video', 'disney plus', 'hbo', 'ator', 'atriz', 'bilheteria', 'streaming'];


            const filteredArticles = apiData.articles.filter(article => {
                const lowerCaseTitle = article.title ? article.title.toLowerCase() : '';
                const lowerCaseDescription = article.description ? article.description.toLowerCase() : '';
                const sourceName = article.source?.name?.toLowerCase() || '';
                
                // Ignora artigos sem título ou descrição
                if (!lowerCaseTitle || !lowerCaseDescription) return false;

                // Primeiro: excluir se contiver termos proibidos no título ou fonte.
                const containsExcludedTerm = termsToExclude.some(term =>
                    lowerCaseTitle.includes(term) ||
                    sourceName.includes(term)
                );
                if (containsExcludedTerm) return false;

                // Segundo: garantir que o título ou descrição tenha algum termo obrigatório
                const containsRequiredTerm = requiredTerms.some(term =>
                    lowerCaseTitle.includes(term) ||
                    lowerCaseDescription.includes(term)
                );
                
                // Em uma busca específica, o termo pesquisado deve estar presente
                if(searchQuery){
                    return lowerCaseTitle.includes(searchQuery.toLowerCase()) || lowerCaseDescription.includes(searchQuery.toLowerCase());
                }

                return containsRequiredTerm;
            });

            response.status(200).json({
                status: 'ok',
                count: filteredArticles.length,
                articles: filteredArticles
            });

        } else {
            console.error('Erro da API:', apiData.code, apiData.message);
            response.status(apiResponse.status).json({
                status: 'error',
                code: apiData.code,
                message: apiData.message || 'Erro retornado pela API de notícias.'
            });
        }

    } catch (error) {
        console.error('Erro geral ao buscar notícias:', error);
        response.status(500).json({
            status: 'error',
            message: 'Erro interno do servidor ao processar a requisição.'
        });
    }
}
