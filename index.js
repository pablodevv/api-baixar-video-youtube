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

        await Promise.all([
            page.goto('https://ogmp3.cc/'),
            page.waitForNavigation({ waitUntil: 'networkidle2' }),
        ]);

        console.log('Conteúdo do body:', await page.$eval('body', body => body.outerHTML));
        console.log('Elementos dentro do form:', await page.$$eval('#form *', elements => elements.map(el => el.tagName)));

        await page.waitForSelector('#url', { timeout: 120000 });
        await page.type('#url', videoUrl);
        await page.click('#convert-button');

        await page.waitForSelector('#download-button', { timeout: 120000 });

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
