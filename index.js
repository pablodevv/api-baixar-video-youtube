const express = require('express'); 
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const app = express();

async function getTranscript(videoId) {
  const url = `https://youtubetotranscript.com/transcript?v=${videoId}&current_language_code=en`;

  const browser = await puppeteer.launch({
    headless: true,  
    args: ['--no-sandbox', '--disable-setuid-sandbox'],  
    timeout: 60000,  
  });

  const page = await browser.newPage();

  await page.setRequestInterception(true);
  page.on('request', (request) => {
    if (request.resourceType() === 'image' || request.resourceType() === 'stylesheet' || request.resourceType() === 'font') {
      request.abort();
    } else {
      request.continue();
    }
  });

  await page.setViewport({ width: 1200, height: 800 });

  try {
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 90000 });  

    await page.waitForSelector('span.transcript-segment', { timeout: 90000 });  

    const content = await page.content();
    await browser.close();

    const $ = cheerio.load(content);

    const transcription = [];
    $('span.transcript-segment').each((index, element) => {
      const text = $(element).text().trim();
      if (text) transcription.push(text);
    });

    const cleanTranscription = transcription.join(' ').replace(/\s+/g, ' ').trim();

    return cleanTranscription;
  } catch (error) {
    console.error('Erro ao carregar a página ou extrair a transcrição:', error);
    throw new Error('Erro ao carregar a página ou extrair a transcrição');
  }
}

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

app.listen(8100, () => {
  console.log('Servidor rodando na porta 8100');
});
