const express = require("express");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const fs = require("fs");
const axios = require("axios");
const { Dropbox } = require("dropbox");
const fetch = require("node-fetch");

puppeteer.use(StealthPlugin());

const app = express();
const port = process.env.PORT || 8100;

const DROPBOX_ACCESS_TOKEN = "sl.u.AFl2VACQgzzEC83H2EGa7EtPkayzsRgz6xEnSL6cNx8sKYCNK0eJBYaC4yJpHL-0-_dXCjyx9tMPYTdkHF9-IY6ysZu7ufLPlBSGZFF211_kJmG41zX0WEVXugui0E-oIUssm8HNBoDvn6dnjcBG4zDDZnkuQj1RK3oYoM2zhvNXEEZkLeSiCa7ANZYm37EqvfNPM1EMGxr9EbVocSQf4ITttPrZNBa-amNo1XdGK6L-d9JvvZkBKosFgec1jZb6_Ba6bhQkucEC2M4FUaa6HpuCdBymq-QPpqNDUNg0L0v4ps-PGmA9HTZNJqqrEeYHvpM2TrResMgxFQAiBLiAM0hUk9PNqc_OG-WhvQ035nRXSk9hLSMaVrFAO0L4ko0yiznWHemqWZcm-WMaE6Gd-081VYqwBlUM4v4ci3r1JwyXCl5DjXwKAXTNGLU2E06_cNN_R0qP0RdhSKtSHEbRDcRI65tsh2eRJ8t_hvd4IE5MfI3UCb6Sd0sIorhlJ7c5JrTuTk6xoLGu-6i1SfA8o-6iWe_zsNKAy7SaYw7xRyw8ds7aqT3LXZRVCymEmUK917VRJwd0wjRH4jTRTN0QCOJQsgRQnbDHgUq6uqeUr_oYZZ1UrVi1sZTRe0QL3Wc_USpHqzxDdFtKPh3-r6P_hW6XZRbuqHU_ltYi7TE58vZDl8xchGRHw7oYevRQntGrbql10ztttkWrLuq89GELb0ZAHqVtHMFu5FI1u0LKmUZnt3o__9ExYqO_4pGvxtMRb5qluy7Rd7QWvVeaHwxo-_jc0KKkugXxUTXloM_Zuw25ZimtxXz5JPJCfLdnshwZTqwryRQYfC0UF3lQsRa3BrfrGZIS3u2kygiVO9BqJOv-mqGJZePqIFSguBTiE6Ant32gL9zskVivOou1IqOBU8cfCRXmksQy5Hp-mQUWcyZVs_zz-W2nrxWWJiuXz_b77QrI-qHMMp-CT7ePjzkm8TOE2V3iHv2jVYQv2g8p_Ei2gV22-qa1mnsB5EsFGb1SzYrUjbaT1uJe4ktiD_zW-85o02T7hFS2M0Cu8vvbzRoodLEq0NkegwblLWS2CPZlJG6NGCEZxf0BhcP1G81pjCITgHJAMXkmmAGMRfiaeJoB2MbCeuC_T0AB4b7Aqv_QBNFeXPkcvWcOU73wthgUDQyTuET5M5BSdnV0yGdbXidmyCVYe0zJm41tRseyAZ6TrUtIURCkRgiouz7ILlcOgRhYVimVRNo2rNuXdTsVFednABySr-A8l8YHSNoe5kgbrzN5zPiVTl_AQ9DE9MXUsCUTB-2yBFneRJ_xm9CTIB3_LabtxpaVbVbFzS7jhGnZ-qt6x9cFLaQo7U1bndGPt6ABBpR581I4vPfmYAWdh70TlnKMOR1gRgXQtU4jkLa8vCL-unw3O_eJN8a9xGsAvWU3Os54TaWU4632c4tmgusTBRgmF7e9tDYU8hUf2qHPVhtbferzx2OyfZQnZ801bHkF";

// Função para iniciar o Puppeteer
async function iniciarNavegador() {
    return await puppeteer.launch({
        headless: "new",
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-cache"],
        protocolTimeout: 300000, // Aumenta o timeout geral
    });
}

// Função para tentar abrir a página até funcionar
async function acessarPaginaComRetry(page, url, tentativas = 3) {
    for (let i = 0; i < tentativas; i++) {
        try {
            console.log(`🔹 Tentando acessar: ${url} (Tentativa ${i + 1})`);
            await page.goto(url, { waitUntil: "networkidle2", timeout: 120000 });
            console.log("✅ Página carregada com sucesso!");
            return;
        } catch (error) {
            console.error(`❌ Erro ao acessar página (tentativa ${i + 1}):`, error);
            if (i === tentativas - 1) throw error;
            await page.reload({ waitUntil: "networkidle2" });
        }
    }
}

// Função para tentar converter o vídeo
async function convertVideo(page, videoUrl) {
    try {
        console.log("🔹 Esperando input de URL...");
        await page.waitForSelector('input[placeholder="Enter YouTube URL"]', { timeout: 20000 });

        console.log(`🔹 Inserindo URL: ${videoUrl}`);
        await page.type('input[placeholder="Enter YouTube URL"]', videoUrl);

        console.log("🔹 Clicando no botão 'Convert'...");
        await page.click('button[type="submit"]');

        console.log("🔹 Aguardando progresso...");
        await page.waitForSelector('div[style*="opacity: 1;"]', { timeout: 300000 });

        console.log("🔹 Esperando aparecer o áudio...");
        await page.waitForSelector("audio source", { timeout: 300000 });

        console.log("✅ Conversão concluída!");
        return await page.evaluate(() => document.querySelector("audio source")?.src);
    } catch (error) {
        throw new Error(`Erro ao converter vídeo: ${error.message}`);
    }
}

// Rota de download
app.get("/download", async (req, res) => {
    const videoUrl = req.query.url;
    if (!videoUrl) return res.status(400).json({ error: "URL do vídeo não fornecida." });

    let browser;
    try {
        browser = await iniciarNavegador();
        const page = await browser.newPage();

        console.log("🔹 Acessando HireQuotient...");
        await acessarPaginaComRetry(page, "https://www.hirequotient.com/youtube-to-mp3");

        const downloadLink = await convertVideo(page, videoUrl);
        await browser.close();

        if (!downloadLink) throw new Error("Link de download não encontrado.");

        console.log(`✅ Link obtido: ${downloadLink}`);
        
        // Fazendo upload para Dropbox
        const mp3Data = await axios.get(downloadLink, { responseType: "arraybuffer" });
        const dropbox = new Dropbox({ accessToken: DROPBOX_ACCESS_TOKEN, fetch });
        const dropboxPath = `/videos/${Date.now()}.mp3`;

        await dropbox.filesUpload({ path: dropboxPath, contents: mp3Data.data });
        const sharedLink = await dropbox.sharingCreateSharedLinkWithSettings({ path: dropboxPath });

        console.log("✅ Arquivo salvo no Dropbox!");
        res.json({ link: sharedLink.url.replace("?dl=0", "?dl=1") });

    } catch (error) {
        console.error("❌ Erro geral:", error);
        res.status(500).json({ error: error.message });
    } finally {
        if (browser) await browser.close();
    }
});

// Inicia o servidor
app.listen(port, () => console.log(`🔥 Servidor rodando na porta ${port}`));
