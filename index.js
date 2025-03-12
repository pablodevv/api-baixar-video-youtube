const express = require('express');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

const app = express();
const port = process.env.PORT || 8100;

async function convertWithRetry(page, videoUrl, maxRetries = 3, retryDelay = 10000) {
    let retries = 0;
    while (retries < maxRetries) {
        try {
            console.log(`Tentativa ${retries + 1}: Enviando URL do vídeo`);
            await page.type('input[placeholder="Enter Youtube URL"]', videoUrl);
            await page.click('button[class*="bg-[#4F46E5]"]');
            console.log('Clicando no botão de conversão...');
            await page.waitForSelector('audio source', { timeout: 600000 }); // Aumentando o tempo de espera para 10 minutos
            console.log('Link de áudio encontrado!');
            return; // Conversão bem-sucedida
        } catch (error) {
            console.error(`Erro na conversão (tentativa ${retries + 1}):`, error);
            retries++;
            if (retries < maxRetries) {
                console.log('Tentando novamente após 10 segundos...');
                await new Promise(resolve => setTimeout(resolve, retryDelay));
                await page.reload(); // Recarrega a página antes de tentar novamente
            } else {
                throw error; // Todas as tentativas falharam
            }
        }
    }
}

app.get('/download', async (req, res) => {
    const videoUrl = req.query.url;

    if (!videoUrl) {
        return res.status(400).json({ error: 'URL do vídeo não fornecida.' });
    }

    try {
        const browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-cache'],
            protocolTimeout: 600000, // Aumenta o protocolTimeout para 10 minutos
        });
        const page = await browser.newPage();

        console.log('Acessando a página de conversão...');
        await page.goto('https://app.aiseo.ai/tools/youtube-to-mp3', { timeout: 60000 });

        console.log('Aguardando carregamento do seletor...');
        await page.waitForSelector('input[placeholder="Enter Youtube URL"]');

        await convertWithRetry(page, videoUrl);

        const downloadLink = await page.evaluate(() => {
            const audioSource = document.querySelector('audio source');
            return audioSource ? audioSource.src : null;
        });

        await browser.close();

        if (downloadLink) {
            console.log('Link de download encontrado:', downloadLink);
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
