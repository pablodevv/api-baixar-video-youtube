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
            page.goto('https://en.savefrom.net/'),
            page.waitForNavigation({ waitUntil: 'networkidle2' }),
        ]);

        console.log('URL da página:', page.url());
        console.log('Conteúdo do formulário:', await page.$eval('#sf_form', form => form.outerHTML));

        await page.waitForSelector('#sf_url', { timeout: 30000 });
        await page.type('#sf_url', videoUrl);
        await page.click('#sf_submit');

        await page.waitForTimeout(10000);

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
