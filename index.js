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

        // Espera o campo de entrada de URL carregar
        await page.waitForSelector('#video', { timeout: 60000 });

        // Digita a URL e clica no botão de conversão
        await page.type('#video', videoUrl);
        await page.click('button[type="submit"]');

        // Espera o botão de download ficar disponível
        await page.waitForSelector('button:text("Download")', { timeout: 120000 });

        // Clica no botão de download
        await page.click('button:text("Download")');

        // Espera um pouco para o download iniciar (pode precisar ajustar o tempo)
        await page.waitForTimeout(5000);

        // Extrai a URL de download (pode precisar adaptar a lógica)
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
