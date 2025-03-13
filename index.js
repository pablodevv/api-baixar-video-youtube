const express = require('express');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const UserAgent = require('user-agents'); // Para gerar um User-Agent aleatório

puppeteer.use(StealthPlugin());

const app = express();
const port = process.env.PORT || 8100;

// Função para tentar realizar a conversão com retries
async function convertWithRetry(page, videoUrl, maxRetries = 3, retryDelay = 10000) {
    let retries = 0;
    while (retries < maxRetries) {
        try {
            console.log(`Tentativa ${retries + 1}: Enviando URL do vídeo`);
            await page.type('input[name="q"]', videoUrl); // Ajustado para o seletor correto do formulário
            await page.click('input[type="submit"]'); // Clica no botão de conversão
            console.log('Clicando no botão de conversão...');
            await page.waitForNavigation({ waitUntil: 'domcontentloaded' }); // Aguarda o redirecionamento para a página de resultados
            console.log('Página de conversão carregada');
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

// Função para simular o clique no botão de download MP3
async function clickDownloadButton(page) {
    try {
        // Espera o botão de "Download MP3" ficar visível
        console.log('Esperando o botão de "Download MP3" aparecer...');
        await page.waitForSelector('a[style*="background: #36B82A;"]:not([href*="seatslaurelblemish.com"])', { timeout: 60000 });

        // Clica no botão de "Download MP3"
        console.log('Clicando no botão de "Download MP3"...');
        await page.click('a[style*="background: #36B82A;"]:not([href*="seatslaurelblemish.com"])');

        // Espera que o iframe do MP3 carregue
        await page.waitForSelector('iframe[src*="mp3api.ytjar.info"]', { timeout: 60000 });
        console.log('Iframe do MP3 carregado!');

        // Obtém o URL do iframe com o link de download
        const mp3DownloadLink = await page.evaluate(() => {
            const iframe = document.querySelector('iframe[src*="mp3api.ytjar.info"]');
            return iframe ? iframe.src : null;
        });

        return mp3DownloadLink;
    } catch (error) {
        console.error('Erro ao clicar no botão de download:', error);
        throw new Error('Não foi possível encontrar o botão de download ou o link do MP3.');
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

        // Adicionando um User-Agent aleatório para evitar bloqueio por bot
        const userAgent = new UserAgent();
        await page.setUserAgent(userAgent.toString());
        await page.setViewport({ width: 1280, height: 800 });

        console.log('Acessando a página de conversão...');
        await page.goto('https://www.vibbio.com/', { timeout: 60000 });

        console.log('Aguardando carregamento do seletor...');
        await page.waitForSelector('input[name="q"]'); // Espera o carregamento do campo do formulário

        // Executa o processo de conversão
        await convertWithRetry(page, videoUrl);

        // Agora tentamos clicar no botão de "Download MP3" e pegar o link
        const downloadLink = await clickDownloadButton(page);

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
