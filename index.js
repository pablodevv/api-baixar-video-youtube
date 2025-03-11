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
        await page.goto('https://ogmp3.cc/');

        // Espera o campo de entrada de URL carregar
        await page.waitForSelector('#url', { timeout: 60000 });

        // Digita a URL e clica no botão de conversão
        await page.type('#url', videoUrl);
        await page.click('#convert-button');

        // Espera o botão de download ficar disponível
        await page.waitForSelector('#download-button', { timeout: 120000 });

        // Extrai o link de download do atributo data-url
        const downloadLink = await page.$eval('#download-button', button => button.getAttribute('data-url'));

        await browser.close();
        res.json({ link: downloadLink });
    } catch (error) {
        console.error('Erro ao processar o download:', error);
        res.status(500).json({ error: 'Erro ao processar o download.' });
    }
});

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
