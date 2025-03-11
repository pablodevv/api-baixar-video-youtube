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
        await page.goto('https://y2mate.nu/en-8e01/');

        await page.waitForSelector('#video', { timeout: 60000 });
        await page.type('#video', videoUrl);
        await page.click('button[type="submit"]');

        console.log('Conteúdo da página após conversão:', await page.content());

        const buttonTexts = await page.$$eval('form[method="post"] div[style="justify-content: center;"] button', buttons => buttons.map(button => button.textContent));
        console.log('Textos dos botões de download:', buttonTexts);

        await page.waitForSelector('button:text("Download")', { timeout: 180000 });

        await page.click('button:text("Download")');
        await page.waitForTimeout(5000);

        const downloadLink = await page.evaluate(() => {
            const linkElement = document.querySelector('a[href^="https://dl"]');
            if (linkElement) {
                return linkElement.href;
            }
            return null;
        });

        await browser.close();

        if (downloadLink) {
            res.json({ link: downloadLink });
        } else {
            res.status(500).json({ error: 'Link de download não encontrado.' });
        }

    } catch (error) {
        console.error('Erro ao processar o download:', error);
        res.status(500).json({ error: 'Erro ao processar o download.' });
    }
});

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
