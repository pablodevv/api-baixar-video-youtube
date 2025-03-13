const express = require('express');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const axios = require('axios');
const { Dropbox } = require('dropbox');
const fetch = require('node-fetch'); // Import necessário para Dropbox

puppeteer.use(StealthPlugin());

const app = express();
const port = process.env.PORT || 8100;

// 🔹 Substitua pelo seu Access Token do Dropbox
const DROPBOX_ACCESS_TOKEN = 'SUA_ACCESS_TOKEN_DO_DROPBOX_AQUI';
const dropbox = new Dropbox({ accessToken: DROPBOX_ACCESS_TOKEN, fetch: fetch });

const DOWNLOAD_DIR = './downloads';

// Criar a pasta downloads se não existir
if (!fs.existsSync(DOWNLOAD_DIR)) {
    fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

// 🔹 Função para obter o título do vídeo
async function getVideoTitle(page) {
    try {
        return await page.evaluate(() => document.title.replace(' - YouTube', '').trim());
    } catch (error) {
        console.error('Erro ao obter título do vídeo:', error);
        return `video_${Date.now()}`;
    }
}

// 🔹 Função para converter o vídeo no Brewsique
async function convertVideo(page, videoUrl) {
    try {
        console.log('Inserindo URL do vídeo...');
        await page.type('input[name="q"]', videoUrl);
        await page.click('input[type="submit"]');

        console.log('Aguardando redirecionamento para conversão...');
        await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 120000 });
    } catch (error) {
        throw new Error('Erro ao iniciar conversão: ' + error.message);
    }
}

// 🔹 Função para clicar no primeiro botão disponível na tabela
async function clickFirstDownloadButton(page) {
    try {
        console.log('Procurando primeiro botão de download...');

        // Espera qualquer botão dentro da tabela aparecer
        await page.waitForSelector('table tbody tr td button', { timeout: 10000 });

        // Pega todos os botões da tabela
        const buttons = await page.$$('table tbody tr td button');

        if (buttons.length > 0) {
            console.log('Clicando no primeiro botão de conversão...');
            await buttons[0].click();
        } else {
            throw new Error('Nenhum botão de download encontrado.');
        }
    } catch (error) {
        throw new Error('Erro ao clicar no botão de download: ' + error.message);
    }
}

// 🔹 Função para aguardar o status "completed" e pegar o link de download
async function getDownloadLink(page) {
    try {
        console.log('Aguardando status "completed"...');
        await page.waitForFunction(() => {
            return document.body.innerText.includes("Status: completed");
        }, { timeout: 120000 });

        console.log('Procurando link de download...');
        const downloadLink = await page.evaluate(() => {
            const linkElement = document.querySelector('a[href*="bucket.cdnframe.com"]');
            return linkElement ? linkElement.href : null;
        });

        if (!downloadLink) throw new Error('Link de download não encontrado.');
        return downloadLink;
    } catch (error) {
        throw new Error('Erro ao obter link de download: ' + error.message);
    }
}

// 🔹 Função para baixar o MP3 localmente
async function downloadMP3(downloadUrl, filePath) {
    try {
        console.log('Baixando arquivo do link:', downloadUrl);
        const response = await axios.get(downloadUrl, { responseType: 'arraybuffer' });
        fs.writeFileSync(filePath, response.data);
        console.log('Arquivo MP3 baixado:', filePath);
        return filePath;
    } catch (error) {
        console.error('Erro ao baixar MP3:', error);
        return null;
    }
}

// 🔹 Função para enviar o MP3 para o Dropbox
async function uploadToDropbox(localFilePath, fileName) {
    try {
        const fileContent = fs.readFileSync(localFilePath);
        const dropboxPath = `/Vídeos YT VR System/${fileName}.mp3`;

        await dropbox.filesUpload({
            path: dropboxPath,
            contents: fileContent,
            mode: 'overwrite'
        });

        console.log('Arquivo enviado para o Dropbox:', dropboxPath);
        return `https://www.dropbox.com/home${dropboxPath}`;
    } catch (error) {
        console.error('Erro ao enviar para o Dropbox:', error);
        throw error;
    }
}

// 🔹 Rota para baixar e enviar o MP3
app.get('/download', async (req, res) => {
    const videoUrl = req.query.url;
    if (!videoUrl) {
        return res.status(400).json({ error: 'URL do vídeo não fornecida.' });
    }

    try {
        const browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();

        console.log('Acessando a página de conversão...');
        await page.goto('https://www.brewsique.fr/', { timeout: 120000 });

        await page.waitForSelector('input[name="q"]');
        await convertVideo(page, videoUrl);

        const videoTitle = await getVideoTitle(page);
        const fileName = `${videoTitle}.mp3`;

        await clickFirstDownloadButton(page); // 🔹 Alterado para clicar no primeiro botão disponível!

        const downloadLink = await getDownloadLink(page);
        console.log('Link de download obtido:', downloadLink);

        const localFilePath = `${DOWNLOAD_DIR}/${fileName}`;
        const downloadSuccess = await downloadMP3(downloadLink, localFilePath);

        await browser.close();

        if (!downloadSuccess) {
            return res.status(500).json({ error: 'Erro ao baixar o MP3.' });
        }

        const dropboxUrl = await uploadToDropbox(localFilePath, videoTitle);

        res.json({ message: 'Download e upload concluídos!', dropbox_url: dropboxUrl });

    } catch (error) {
        console.error('Erro ao processar o download:', error);
        res.status(500).json({ error: 'Erro ao processar o download.' });
    }
});

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
