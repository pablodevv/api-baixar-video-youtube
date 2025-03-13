const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const express = require('express');
const UserAgent = require('user-agents');
const fs = require('fs');
const { Dropbox } = require('dropbox');

puppeteer.use(StealthPlugin());

const app = express();
const port = process.env.PORT || 8100;

// 🔹 Substitua pelo seu Access Token do Dropbox
const DROPBOX_ACCESS_TOKEN = 'sl.u.AFl2VACQgzzEC83H2EGa7EtPkayzsRgz6xEnSL6cNx8sKYCNK0eJBYaC4yJpHL-0-_dXCjyx9tMPYTdkHF9-IY6ysZu7ufLPlBSGZFF211_kJmG41zX0WEVXugui0E-oIUssm8HNBoDvn6dnjcBG4zDDZnkuQj1RK3oYoM2zhvNXEEZkLeSiCa7ANZYm37EqvfNPM1EMGxr9EbVocSQf4ITttPrZNBa-amNo1XdGK6L-d9JvvZkBKosFgec1jZb6_Ba6bhQkucEC2M4FUaa6HpuCdBymq-QPpqNDUNg0L0v4ps-PGmA9HTZNJqqrEeYHvpM2TrResMgxFQAiBLiAM0hUk9PNqc_OG-WhvQ035nRXSk9hLSMaVrFAO0L4ko0yiznWHemqWZcm-WMaE6Gd-081VYqwBlUM4v4ci3r1JwyXCl5DjXwKAXTNGLU2E06_cNN_R0qP0RdhSKtSHEbRDcRI65tsh2eRJ8t_hvd4IE5MfI3UCb6Sd0sIorhlJ7c5JrTuTk6xoLGu-6i1SfA8o-6iWe_zsNKAy7SaYw7xRyw8ds7aqT3LXZRVCymEmUK917VRJwd0wjRH4jTRTN0QCOJQsgRQnbDHgUq6uqeUr_oYZZ1UrVi1sZTRe0QL3Wc_USpHqzxDdFtKPh3-r6P_hW6XZRbuqHU_ltYi7TE58vZDl8xchGRHw7oYevRQntGrbql10ztttkWrLuq89GELb0ZAHqVtHMFu5FI1u0LKmUZnt3o__9ExYqO_4pGvxtMRb5qluy7Rd7QWvVeaHwxo-_jc0KKkugXxUTXloM_Zuw25ZimtxXz5JPJCfLdnshwZTqwryRQYfC0UF3lQsRa3BrfrGZIS3u2kygiVO9BqJOv-mqGJZePqIFSguBTiE6Ant32gL9zskVivOou1IqOBU8cfCRXmksQy5Hp-mQUWcyZVs_zz-W2nrxWWJiuXz_b77QrI-qHMMp-CT7ePjzkm8TOE2V3iHv2jVYQv2g8p_Ei2gV22-qa1mnsB5EsFGb1SzYrUjbaT1uJe4ktiD_zW-85o02T7hFS2M0Cu8vvbzRoodLEq0NkegwblLWS2CPZlJG6NGCEZxf0BhcP1G81pjCITgHJAMXkmmAGMRfiaeJoB2MbCeuC_T0AB4b7Aqv_QBNFeXPkcvWcOU73wthgUDQyTuET5M5BSdnV0yGdbXidmyCVYe0zJm41tRseyAZ6TrUtIURCkRgiouz7ILlcOgRhYVimVRNo2rNuXdTsVFednABySr-A8l8YHSNoe5kgbrzN5zPiVTl_AQ9DE9MXUsCUTB-2yBFneRJ_xm9CTIB3_LabtxpaVbVbFzS7jhGnZ-qt6x9cFLaQo7U1bndGPt6ABBpR581I4vPfmYAWdh70TlnKMOR1gRgXQtU4jkLa8vCL-unw3O_eJN8a9xGsAvWU3Os54TaWU4632c4tmgusTBRgmF7e9tDYU8hUf2qHPVhtbferzx2OyfZQnZ801bHkF';
const dropbox = new Dropbox({ accessToken: DROPBOX_ACCESS_TOKEN, fetch: fetch });

async function downloadMP3WithPuppeteer(downloadUrl, filePath) {
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();
    
    await page.setUserAgent(new UserAgent().toString());
    await page.setViewport({ width: 1280, height: 800 });

    console.log('Acessando a página de download...');
    await page.goto(downloadUrl, { waitUntil: 'domcontentloaded' });

    console.log('Aguardando botão de download...');
    await page.waitForSelector('a', { timeout: 60000 });

    // Intercepta requisições para capturar o link real do MP3
    let finalDownloadUrl = null;
    page.on('request', (request) => {
        if (request.url().endsWith('.mp3')) {
            finalDownloadUrl = request.url();
        }
    });

    console.log('Clicando no botão de download...');
    await page.click('a');

    // Espera um tempo para capturar a requisição do MP3
    await page.waitForTimeout(5000);

    await browser.close();

    if (!finalDownloadUrl) {
        throw new Error('Link de MP3 não encontrado após o clique.');
    }

    console.log('Baixando arquivo do link:', finalDownloadUrl);

    // Faz o download do MP3
    const response = await fetch(finalDownloadUrl);
    const buffer = await response.arrayBuffer();
    fs.writeFileSync(filePath, Buffer.from(buffer));

    console.log('Arquivo MP3 baixado:', filePath);
    return filePath;
}

async function uploadToDropbox(localFilePath) {
    try {
        const fileContent = fs.readFileSync(localFilePath);
        const fileName = `video_${Date.now()}.mp3`;
        const dropboxPath = `/Vídeos YT VR System/${fileName}`;

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

app.get('/download', async (req, res) => {
    const videoUrl = req.query.url;
    if (!videoUrl) {
        return res.status(400).json({ error: 'URL do vídeo não fornecida.' });
    }

    try {
        const localFilePath = `./downloads/temp.mp3`;
        await downloadMP3WithPuppeteer(videoUrl, localFilePath);

        const dropboxUrl = await uploadToDropbox(localFilePath);

        res.json({ message: 'Download e upload concluídos!', dropbox_url: dropboxUrl });

    } catch (error) {
        console.error('Erro:', error);
        res.status(500).json({ error: 'Erro ao processar o download.' });
    }
});

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
