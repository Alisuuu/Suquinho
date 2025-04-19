const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

const API_KEY = 'YOUR_API_KEY'; // Substitua pelo seu API Key da Webz.io

// Middleware para permitir CORS, se necessário
app.use(express.json());
app.use(express.static('public')); // Para servir os arquivos estáticos

// Rota para buscar notícias
app.get('/api/news', async (req, res) => {
  const query = req.query.query || 'cinema'; // Parâmetro de consulta, 'cinema' por padrão

  const url = `https://api.webz.io/filterWebContent?token=${API_KEY}&q=${encodeURIComponent(query)}&language=pt`;

  try {
    const response = await axios.get(url);
    res.json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao buscar notícias' });
  }
});

// Inicia o servidor
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
