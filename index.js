const express = require('express');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const axios = require('axios');
const { Dropbox } = require('dropbox');

puppeteer.use(StealthPlugin());

const app = express();
const port = process.env.PORT || 8100;

// 🔹 Substitua pelo seu Access Token do Dropbox
const DROPBOX_ACCESS_TOKEN = 'sl.u.AFl2VACQgzzEC83H2EGa7EtPkayzsRgz6xEnSL6cNx8sKYCNK0eJBYaC4yJpHL-0-_dXCjyx9tMPYTdkHF9-IY6ysZu7ufLPlBSGZFF211_kJmG41zX0WEVXugui0E-oIUssm8HNBoDvn6dnjcBG4zDDZnkuQj1RK3oYoM2zhvNXEEZkLeSiCa7ANZYm37EqvfNPM1EMGxr9EbVocSQf4ITttPrZNBa-amNo1XdGK6L-d9JvvZkBKosFgec1jZb6_Ba6bhQkucEC2M4FUaa6HpuCdBymq-QPpqNDUNg0L0v4ps-PGmA9HTZNJqqrEeYHvpM2TrResMgxFQAiBLiAM0hUk9PNqc_OG-WhvQ035nRXSk9hLSMaVrFAO0L4ko0yiznWHemqWZcm-WMaE6Gd-081VYqwBlUM4v4ci3r1JwyXCl5DjXwKAXTNGLU2E06_cNN_R0qP0RdhSKtSHEbRDcRI65tsh2eRJ8t_hvd4IE5MfI3UCb6Sd0sIorhlJ7c5JrTuTk6xoLGu-6i1SfA8o-6iWe_zsNKAy7SaYw7xRyw8ds7aqT3LXZRVCymEmUK917VRJwd0wjRH4jTRTN0QCOJQsgRQnbDHgUq6uqeUr_oYZZ1UrVi1sZTRe0QL3Wc_USpHqzxDdFtKPh3-r6P_hW6XZRbuqHU_ltYi7TE58vZDl8xchGRHw7oYevRQntGrbql10ztttkWrLuq89GELb0ZAHqVtHMFu5FI1u0LKmUZnt3o__9ExYqO_4pGvxtMRb5qluy7Rd7QWvVeaHwxo-_jc0KKkugXxUTXloM_Zuw25ZimtxXz5JPJCfLdnshwZTqwryRQYfC0UF3lQsRa3BrfrGZIS3u2kygiVO9BqJOv-mqGJZePqIFSguBTiE6Ant32gL9zskVivOou1IqOBU8cfCRXmksQy5Hp-mQUWcyZVs_zz-W2nrxWWJiuXz_b77QrI-qHMMp-CT7ePjzkm8TOE2V3iHv2jVYQv2g8p_Ei2gV22-qa1mnsB5EsFGb1SzYrUjbaT1uJe4ktiD_zW-85o02T7hFS2M0Cu8vvbzRoodLEq0NkegwblLWS2CPZlJG6NGCEZxf0BhcP1G81pjCITgHJAMXkmmAGMRfiaeJoB2MbCeuC_T0AB4b7Aqv_QBNFeXPkcvWcOU73wthgUDQyTuET5M5BSdnV0yGdbXidmyCVYe0zJm41tRseyAZ6TrUtIURCkRgiouz7ILlcOgRhYVimVRNo2rNuXdTsVFednABySr-A8l8YHSNoe5kgbrzN5zPiVTl_AQ9DE9MXUsCUTB-2yBFneRJ_xm9CTIB3_LabtxpaVbVbFzS7jhGnZ-qt6x9cFLaQo7U1bndGPt6ABBpR581I4vPfmYAWdh70TlnKMOR1gRgXQtU4jkLa8vCL-unw3O_eJN8a9xGsAvWU3Os54TaWU4632c4tmgusTBRgmF7e9tDYU8hUf2qHPVhtbferzx2OyfZQnZ801bHkF';
const dropbox = new Dropbox({ accessToken: DROPBOX_ACCESS_TOKEN, fetch: fetch });

const DOWNLOAD_DIR = './downloads';

// Criar a pasta downloads se não existir
if (!fs.existsSync(DOWNLOAD_DIR)) {
    fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

// 🔹 Função para pegar o título do vídeo no YouTube
async function getVideoTitle(page) {
    try {
        return await page.evaluate(() => document.title.replace(' - YouTube', '').trim());
    } catch (error) {
        console.error('Erro ao obter título do vídeo:', error);
        return `video_${Date.now()}`; // Nome genérico caso falhe
    }
}

// 🔹 Função para converter vídeo para MP3
async function convertWithRetry(page, videoUrl, maxRetries = 3, retryDelay = 10000) {
    let retries = 0;
    while (retries < maxRetries) {
        try {
            console.log(`Tentativa ${retries + 1}: Enviando URL do vídeo`);
            await page.type('input[name="q"]', videoUrl);
            await page.click('input[type="submit"]');
            await page.waitForNavigation({ waitUntil: 'domcontentloaded' });
            return;
        } catch (error) {
            console.error(`Erro na conversão (tentativa ${retries + 1}):`, error);
            retries++;
            if (retries < maxRetries) {
                console.log('Tentando novamente após 10 segundos...');
                await new Promise(resolve => setTimeout(resolve, retryDelay));
                await page.reload();
            } else {
                throw error;
            }
        }
    }
}

// 🔹 Função para obter o link real de download do MP3
async function getDownloadLink(page) {
    return await page.evaluate(() => {
        const downloadMp3Button = document.querySelector('a[style*="background: #36B82A;"]:not([href*="seatslaurelblemish.com"])');
        if (downloadMp3Button) return downloadMp3Button.href;
        const iframeButton = document.querySelector('iframe[src*="mp3api.ytjar.info"]');
        return iframeButton ? iframeButton.src : null;
    });
}

// 🔹 Função para baixar o MP3 localmente no Render
async function downloadMP3(page, downloadUrl, filePath) {
    try {
        console.log('Acessando o link de download MP3:', downloadUrl);
        await page.goto(downloadUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

        await page.waitForSelector('a', { timeout: 60000 });

        let finalDownloadUrl = null;
        page.on('request', (request) => {
            if (request.url().endsWith('.mp3')) {
                finalDownloadUrl = request.url();
            }
        });

        console.log('Clicando no botão de download...');
        await page.click('a');

        await page.waitForTimeout(5000);

        if (!finalDownloadUrl) {
            throw new Error('Link de MP3 não encontrado após o clique.');
        }

        console.log('Baixando arquivo do link:', finalDownloadUrl);

        const response = await axios.get(finalDownloadUrl, { responseType: 'arraybuffer' });
        fs.writeFileSync(filePath, response.data);

        console.log('Arquivo MP3 baixado:', filePath);
        return filePath;
    } catch (error) {
        console.error('Erro ao processar o download do MP3:', error);
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
        await page.goto('https://www.vibbio.com/', { timeout: 60000 });

        await page.waitForSelector('input[name="q"]');

        await convertWithRetry(page, videoUrl);

        const videoTitle = await getVideoTitle(page);
        const fileName = `${videoTitle}.mp3`;

        const downloadLink = await getDownloadLink(page);
        if (!downloadLink) {
            await browser.close();
            return res.status(500).json({ error: 'Link de download não encontrado.' });
        }

        console.log('Link de download encontrado:', downloadLink);

        const localFilePath = `${DOWNLOAD_DIR}/${fileName}`;
        const downloadSuccess = await downloadMP3(page, downloadLink, localFilePath);

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
