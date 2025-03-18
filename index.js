const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const port = 8100;

// Função que extrai as transcrições de um vídeo
async function getTranscription(videoId) {
  try {
    // URL do youtubetotranscript com o videoId dinâmico
    const url = `https://youtubetotranscript.com/transcript?v=${videoId}&current_language_code=en`;
    
    // Requisição para pegar o HTML da página
    const response = await axios.get(url);
    
    // Carregar o HTML da resposta
    const $ = cheerio.load(response.data);
    
    // Encontrar todos os <span> com a classe 'transcript-segment' e extrair o texto
    let transcription = '';
    
    $('span.transcript-segment').each((i, element) => {
      transcription += $(element).text() + ' ';
    });
    
    // Retornar o texto completo da transcrição
    return transcription.trim();
  } catch (error) {
    console.error('Erro ao obter a transcrição:', error);
    throw new Error('Não foi possível obter a transcrição do vídeo');
  }
}

// Endpoint que recebe o videoId como parâmetro na URL
app.get('/transcribe/:videoId', async (req, res) => {
  const videoId = req.params.videoId;

  if (!videoId) {
    return res.status(400).json({ error: 'videoId é necessário' });
  }

  try {
    // Chama a função que extrai a transcrição
    const transcription = await getTranscription(videoId);
    return res.json({ transcription });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Iniciar o servidor na porta definida
app.listen(port, () => {
  console.log(`API rodando em http://localhost:${port}`);
});
