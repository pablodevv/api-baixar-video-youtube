const express = require('express');
const axios = require('axios');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
const port = 8100;

// Middleware CORS
app.use(cors());

// Rota para converter o vídeo em áudio e retornar o link do áudio
app.get('/download', async (req, res) => {
  const videoUrl = req.query.url;  // URL do vídeo que será convertido para MP3
  const fileName = req.query.name;  // Nome do arquivo MP3 (título do vídeo)

  if (!videoUrl || !fileName) {
    return res.status(400).send('URL do vídeo e nome do vídeo são necessários.');
  }

  try {
    // Abertura do navegador e processo do Hirequotient
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();

    console.log(`Acessando o site de conversão...`);

    await page.goto('https://www.hirequotient.com/youtube-to-mp3', { waitUntil: 'domcontentloaded' });

    console.log(`Preenchendo URL do vídeo...`);

    // Inserir o URL do vídeo no campo de entrada
    await page.type('input[placeholder="Enter YouTube URL"]', videoUrl);
    
    console.log(`Clicando no botão para converter...`);

    // Clicar no botão de conversão
    await page.click('button[type="submit"]');

    // Aguardar a barra de progresso e o carregamento do áudio
    await page.waitForSelector('audio');
    const audioSrc = await page.$eval('audio', (el) => el.src);

    console.log(`Título do vídeo: ${fileName}`);
    console.log(`URL do áudio: ${audioSrc}`);

    // Retornar o link de áudio em formato JSON
    res.json({
      success: true,
      message: 'Áudio convertido com sucesso!',
      audio_url: audioSrc
    });

    browser.close();  // Fecha o navegador

  } catch (error) {
    console.error('Erro ao processar o vídeo:', error);
    res.status(500).send('Erro ao processar o vídeo.');
  }
});

// Iniciar o servidor
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
