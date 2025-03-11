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
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });

        const page = await browser.newPage();
        await page.goto('https://en.savefrom.net/');

        // Espera o formulário carregar
        await page.waitForSelector('#sf_form', { timeout: 15000 });

        // Espera o elemento de input carregar
        await page.waitForSelector('#sf_url', { timeout: 15000 });

        await page.type('#sf_url', videoUrl);
        await page.click('#sf_submit');

        // Espera o conteúdo da página mudar após o submit
        await page.waitForTimeout(10000);

        // Extrai os links de download
        const pageContent = await page.content();
        const downloadLinks = extractDownloadLinks(pageContent);

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
