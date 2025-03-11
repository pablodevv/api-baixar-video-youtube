const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const port = process.env.PORT || 8100;

app.get('/download', async (req, res) => {
  const videoUrl = req.query.url;

  if (!videoUrl) {
    return res.status(400).json({ error: 'URL do vídeo não fornecida.' });
  }

  try {
    const browser = await puppeteer.launch({
      headless: 'new', // Use 'new' para o novo modo headless
      args: ['--no-sandbox', '--disable-setuid-sandbox'], // Necessário no Render
    });

    const page = await browser.newPage();
    await page.goto('https://en.savefrom.net/');

    await page.type('#sf_url', videoUrl);
    await page.click('#sf_submit');

    // Espera o iframe carregar (pode precisar ajustar o tempo)
    await page.waitForTimeout(10000);

    const frame = await page.frames().find((frame) => frame.name() === 'sf_frame');
    const frameContent = await frame.content();

    const downloadLinks = extractDownloadLinks(frameContent);

    await browser.close();

    res.json({ links: downloadLinks });
  } catch (error) {
    console.error('Erro ao processar o download:', error);
    res.status(500).json({ error: 'Erro ao processar o download.' });
  }
});

function extractDownloadLinks(html) {
  const regex = /href="(https:\/\/[^"]+videoplayback[^"]+)"/g;
  const links = [];
  let match;

  while ((match = regex.exec(html)) !== null) {
    links.push(match[1]);
  }

  return links;
}

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
