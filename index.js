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
const dropbox = new Dropbox({ accessToken: DROPBOX_ACCESS_TOKEN, fetch: fetch });

const DOWNLOAD_DIR = "./downloads";
if (!fs.existsSync(DOWNLOAD_DIR)) fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });

async function convertWithRetry(page, videoUrl, maxRetries = 3, retryDelay = 10000) {
    let retries = 0;
    while (retries < maxRetries) {
        try {
            await page.type('input[placeholder="Enter Youtube URL"]', videoUrl);
            await page.click('button[class*="bg-[#4F46E5]"]');
            await page.waitForSelector("audio source", { timeout: 300000 });

            return; // Conversão bem-sucedida
        } catch (error) {
            console.error(`Erro na conversão (tentativa ${retries + 1}):`, error);
            retries++;
            if (retries < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, retryDelay));
                await page.reload(); // Recarrega a página antes de tentar novamente
            } else {
                throw error; // Todas as tentativas falharam
            }
        }
    }
}

async function downloadMP3(downloadUrl, filePath) {
    try {
        console.log("🔹 Baixando MP3...");
        const response = await axios.get(downloadUrl, { responseType: "arraybuffer" });
        fs.writeFileSync(filePath, response.data);
        console.log("✅ MP3 baixado:", filePath);
        return filePath;
    } catch (error) {
        console.error("❌ Erro ao baixar MP3:", error);
        return null;
    }
}

async function uploadToDropbox(localFilePath, fileName) {
    try {
        const fileContent = fs.readFileSync(localFilePath);
        const dropboxPath = `/YT Downloads/${fileName}.mp3`;

        await dropbox.filesUpload({
            path: dropboxPath,
            contents: fileContent,
            mode: "overwrite",
        });

        console.log("✅ Enviado para o Dropbox:", dropboxPath);
        return `https://www.dropbox.com/home${dropboxPath}`;
    } catch (error) {
        console.error("❌ Erro ao enviar para o Dropbox:", error);
        throw error;
    }
}

app.get("/download", async (req, res) => {
    const videoUrl = req.query.url;

    if (!videoUrl) {
        return res.status(400).json({ error: "URL do vídeo não fornecida." });
    }

    let browser;
    try {
        console.log("🔹 Iniciando Puppeteer...");
        browser = await puppeteer.launch({
            headless: "new",
            args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-cache"],
            protocolTimeout: 300000, // Aumenta o tempo limite
        });

        const page = await browser.newPage();
        await page.goto("https://app.aiseo.ai/tools/youtube-to-mp3", { timeout: 60000 });

        await page.waitForSelector('input[placeholder="Enter Youtube URL"]');

        await convertWithRetry(page, videoUrl);

        const downloadLink = await page.evaluate(() => {
            const audioSource = document.querySelector("audio source");
            return audioSource ? audioSource.src : null;
        });

        if (!downloadLink) {
            throw new Error("Link de download não encontrado.");
        }

        console.log("✅ Link do MP3 capturado:", downloadLink);
        const videoTitle = "video_" + Date.now();
        const fileName = `${videoTitle}.mp3`;
        const localFilePath = `${DOWNLOAD_DIR}/${fileName}`;

        await downloadMP3(downloadLink, localFilePath);
        await browser.close();

        const dropboxUrl = await uploadToDropbox(localFilePath, videoTitle);
        res.json({ success: true, downloadUrl: dropboxUrl });
    } catch (error) {
        console.error("❌ Erro ao processar o download:", error);
        if (browser) await browser.close();
        res.status(500).json({ error: "Erro ao processar o download." });
    }
});

app.listen(port, () => {
    console.log(`🔥 Servidor rodando na porta ${port}`);
});
