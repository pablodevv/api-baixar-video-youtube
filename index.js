const express = require('express');
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const app = express();

// Função para buscar a transcrição
async function getTranscript(videoId) {
  const url = `https://youtubetotranscript.com/transcript?v=${videoId}&current_language_code=en`;

  // Inicia o Puppeteer
  const browser = await puppeteer.launch({
    headless: true,  // Modo headless (oculto)
    args: ['--no-sandbox', '--disable-setuid-sandbox'],  // Adicionando a flag --no-sandbox
    timeout: 60000,  // Aumentando o timeout para 60 segundos
  });

  const page = await browser.newPage();

  // Desabilitar imagens e outros recursos pesados para acelerar o carregamento
  await page.setRequestInterception(true);
  page.on('request', (request) => {
    if (request.resourceType() === 'image' || request.resourceType() === 'stylesheet' || request.resourceType() === 'font') {
      request.abort();
    } else {
      request.continue();
    }
  });

  // Definindo o tamanho da janela para o Chromium
  await page.setViewport({ width: 1200, height: 800 });

  try {
    // Acessando a URL com tempo limite aumentado
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 90000 });  // Aumentando o tempo limite para 90 segundos

    // Espera a transcrição estar completamente carregada
    await page.waitForSelector('span.transcript-segment', { timeout: 90000 });  // Espera pelo seletor que contém os textos de transcrição

    // Extrai o HTML da página
    const content = await page.content();
    await browser.close();

    // Carrega o HTML com cheerio para parsear e extrair os textos
    const $ = cheerio.load(content);

    // Extrai todos os textos dos spans com a classe 'transcript-segment'
    const transcription = [];
    $('span.transcript-segment').each((index, element) => {
      const text = $(element).text().trim();
      if (text) transcription.push(text);
    });

    // Junta a transcrição, removendo quebras de linha e espaços extras
    const cleanTranscription = transcription.join(' ').replace(/\s+/g, ' ').trim();

    return cleanTranscription;
  } catch (error) {
    console.error('Erro ao carregar a página ou extrair a transcrição:', error);
    throw new Error('Erro ao carregar a página ou extrair a transcrição');
  }
}

// Rota da API para obter a transcrição
app.get('/get-transcript', async (req, res) => {
  const videoId = req.query.videoId;

  if (!videoId) {
    return res.status(400).json({ error: 'Por favor, forneça o videoId na query string.' });
  }

  try {
    const transcript = await getTranscript(videoId);
    res.json({ transcription: transcript });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao extrair a transcrição.' });
  }
});

// Inicia o servidor na porta 8100
app.listen(8100, () => {
  console.log('Servidor rodando na porta 8100');
});
