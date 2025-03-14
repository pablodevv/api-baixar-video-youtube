const express = require('express');
const axios = require('axios');
const puppeteer = require('puppeteer');
const fs = require('fs');
const dropboxV2Api = require('dropbox-v2-api');
const cors = require('cors');

// Configuração do Dropbox API
const dropbox = dropboxV2Api.authenticate({
  token: 'sl.u.AFnN5jjWuoNG3WYngPTaTlHE0cjkS1wIIuZzeUZPtkzT1qa6pCYgKIoTxqKLwzWl_XJYQD04ed26cyDTvCqQ8uqlFVUXbrcDCc1Zr1J0mrgBf3fkrL4mSvZGGPZZ6y7QU6MG1ALfkWq57aQ1yZO3AhSEGba4fqZGyhCoGmWSLQGmBpvOvPlRK5ZLUD2c8ti0SA1hPy_vJ0VRBaVYXENqm8-DnIkx9oniX2dMsy_wcmnoVH_ig6hrVznoMBPAQcHNmd7P-dwfPYdHVExWfeKY1lzTCRzLKxPpOFNCbS6zsRmcvKM84HH5w5XG02ERWSAD_2ZRhF850O-BQk4lPHVCw6UsnRNF-Unl3c1Tsy9jJL4R57zt7h7iCbelfTrkQw1JhFsgxlF6BuwP6nT7Ehb4u6IH_r_COg3bCNR7FZX4rLuxi0M9fMJt1heoUGWwrNlUW5EYpDSDNW6SvmfD_dt3KTmSEZZAPMXJed2AVlARrsY3irkJVbZ3Z7yNNHukUSXZFKW28VUcIFfZdmJN5guPDCng9wr2HWLFMVV6HjfSsWu-A9wMR-rHOZUvpvv1UO9YoQzYVNOzgHETM90n1WyBi2IbfdngxRgc-nZDqVAr77stubn8vzHXu0PTyVgbPE8uZ5YlPk-IZmOvKBSZfejDsDjM7H6tJQtu0XOPNsSb0KEdkDRUg41zD4PZgsCpGCDsN3jHHTS1udFblyHtv-JS9BNZiPomXIbyfK4Y_p6QcQInjjcYgzgkBk9eTR3uQYZCjHOEjfqZxPy2bG_zyJdc-d6mlLYGYWXBXzWALQqEKfEzachUewsWFR-oFHeUZaamTKh4nALxUAMvl6e38Q2k8FhV2Mw_96qaorzo-tmX6mE84TDg8t_Tr0nvgnHZ-61PrpbalWfu137IX4OcScNaWb5monnOC2bBmlen2gEWif8uu8OWwIvadnHs3u0EEcU56wVkYbgG55DnqOD2cOSOMbOK4305-_FU-_POl02x-5RlxcZKU5ErfQI_EdSSX8jKKtrWYCWSKo5DVFhrgaN0tdr2oMY2Ry8vI2pSI1UnYTUBBOO6-P45dM-6awA7Fi8vEjtjRpgUUGIgtvpnMo6oRDMm7bo2-SFI2ER9dfUqKbBPPCLAqT_u3Ajq6PDf8411PoW1f3130-PPvKhjDLiQLrBDSHcugtnYVAqQp16vxcAx9RCzI3iXfNvE6r12qr0PBz7kQT9kZAQ7KOArpQFo3phqf5kCiqlkPMKhP_r3I1g4kq66BHiPAnnp81vHz_6hG8eUqIcnrMNr9vhA3lx5j6QxA4Z9F3DNQexPZ7PvzMa94Sfte7yakcTU-A_9LV3DY7x5O-w8XRv_XUUnzK6I6bnm_Tx7zerg8gYX13ONPOEouhndsRR_GqZamq-MjRNGn6mgquRFs86-4QIJF-37i9sLxjDJlr0qH4AS2gCZg7EAFDIerRdEi3IVOxlh4Ud1m_Q6DqM1lkNlo2pY4C1x8eig'
});

const app = express();
const port = 8100;

// Middleware CORS
app.use(cors());

// Rota para baixar o MP3 e fazer o upload no Dropbox
app.get('/download', async (req, res) => {
  const videoUrl = req.query.url;  // URL do vídeo que será convertido para MP3

  if (!videoUrl) {
    return res.status(400).send('URL do vídeo é necessária.');
  }

  try {
    // Abertura do navegador e processo do Hirequotient
    const browser = await puppeteer.launch({
      headless: true,  // Executa sem abrir a interface gráfica
      args: ['--no-sandbox', '--disable-setuid-sandbox']  // Necessário para rodar no Docker como root
    });
    const page = await browser.newPage();

    await page.goto('https://www.hirequotient.com/', { waitUntil: 'domcontentloaded' });

    // Inserir o URL do vídeo no campo e enviar o formulário
    await page.type('input[placeholder="Enter YouTube URL"]', videoUrl);
    await page.click('button[type="submit"]');

    // Aguardar a barra de progresso e o carregamento do áudio
    await page.waitForSelector('audio');
    const audioSrc = await page.$eval('audio', (el) => el.src);
    const title = await page.title();  // Pega o título da página (título do vídeo)

    console.log(`Título do vídeo: ${title}`);
    console.log(`URL do áudio: ${audioSrc}`);

    // Fazer o download do arquivo MP3 usando o axios
    const response = await axios.get(audioSrc, { responseType: 'arraybuffer' });

    // Salvar o arquivo MP3 temporariamente
    const filePath = `/tmp/${title}.mp3`;
    fs.writeFileSync(filePath, response.data);

    // Upload para o Dropbox
    const fileStream = fs.createReadStream(filePath);
    const dropboxPath = `/Vídeos YT VR System/${title}.mp3`;

    dropbox.filesUpload({ path: dropboxPath, contents: fileStream })
      .then(() => {
        console.log(`Arquivo ${title}.mp3 enviado com sucesso para o Dropbox!`);
        res.send(`Arquivo ${title}.mp3 enviado com sucesso para o Dropbox!`);
      })
      .catch((error) => {
        console.error('Erro no upload para o Dropbox:', error);
        res.status(500).send('Erro ao enviar para o Dropbox.');
      })
      .finally(() => {
        fs.unlinkSync(filePath);  // Limpa o arquivo temporário
        browser.close();  // Fecha o navegador
      });

  } catch (error) {
    console.error('Erro ao processar o vídeo:', error);
    res.status(500).send('Erro ao processar o vídeo.');
  }
});

// Iniciar o servidor
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
