const express = require('express');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

const app = express();
const port = process.env.PORT || 8100;

async function getVideoDuration(videoUrl) {
    // Aqui você pode usar uma API para pegar a duração do vídeo.
    // Para fins de exemplo, vamos assumir que a duração é de 1200 segundos (20 minutos).
    return 1200; // Duração do vídeo em segundos.
}

async function downloadChunk(videoUrl, start, end) {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-cache'],
    });
    const page = await browser.newPage();

    await page.goto('https://app.aiseo.ai/tools/youtube-to-mp3', { timeout: 60000 });
    await page.waitForSelector('input[placeholder="Enter Youtube URL"]');

    // Modificar a URL do vídeo com os parâmetros start e end
    const chunkVideoUrl = `${videoUrl}?start=${start}&end=${end}`;

    // Processar a conversão do vídeo
    await page.type('input[placeholder="Enter Youtube URL"]', chunkVideoUrl);
    await page.click('button[class*="bg-[#4F46E5]"]');
    await page.waitForSelector('audio source', { timeout: 60000 });

    const downloadLink = await page.evaluate(() => {
        const audioSource = document.querySelector('audio source');
        return audioSource ? audioSource.src : null;
    });

    await browser.close();

    if (downloadLink) {
        return downloadLink;
    } else {
        throw new Error('Link de download não encontrado.');
    }
}

async function convertVideoInChunks(videoUrl, chunkDuration = 600) {
    const videoDuration = await getVideoDuration(videoUrl);
    const chunkSize = chunkDuration * 60; // 10 minutos por chunk
    const chunks = Math.ceil(videoDuration / chunkSize);
    let allChunksDownloaded = [];

    // Processar cada chunk separadamente
    for (let i = 0; i < chunks; i++) {
        const start = i * chunkSize;
        const end = (i + 1) * chunkSize;
        try {
            const chunkLink = await downloadChunk(videoUrl, start, end);
            allChunksDownloaded.push(chunkLink);
        } catch (error) {
            console.error(`Erro ao baixar o segmento ${i + 1}:`, error);
            throw error;
        }
    }

    return allChunksDownloaded; // Retorne os links dos chunks ou combine conforme necessário
}

app.get('/download', async (req, res) => {
    const videoUrl = req.query.url;
    if (!videoUrl) {
        return res.status(400).json({ error: 'URL do vídeo não fornecida.' });
    }

    try {
        const videoLinks = await convertVideoInChunks(videoUrl); // Processa o vídeo em partes
        const combinedLink = videoLinks.join(','); // Combine ou faça conforme necessário

        res.json({ message: 'Download iniciado.', links: videoLinks });
    } catch (error) {
        console.error('Erro ao processar o download:', error);
        res.status(500).json({ error: 'Erro ao processar o download.' });
    }
});

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
