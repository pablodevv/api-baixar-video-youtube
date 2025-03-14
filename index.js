const axios = require('axios');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const dropboxV2Api = require('dropbox-v2-api');
const express = require('express');
const app = express();
const cors = require('cors');

// Configuração do cliente do Dropbox
const dropbox = dropboxV2Api.authenticate({
  token: 'sl.u.AFnN5jjWuoNG3WYngPTaTlHE0cjkS1wIIuZzeUZPtkzT1qa6pCYgKIoTxqKLwzWl_XJYQD04ed26cyDTvCqQ8uqlFVUXbrcDCc1Zr1J0mrgBf3fkrL4mSvZGGPZZ6y7QU6MG1ALfkWq57aQ1yZO3AhSEGba4fqZGyhCoGmWSLQGmBpvOvPlRK5ZLUD2c8ti0SA1hPy_vJ0VRBaVYXENqm8-DnIkx9oniX2dMsy_wcmnoVH_ig6hrVznoMBPAQcHNmd7P-dwfPYdHVExWfeKY1lzTCRzLKxPpOFNCbS6zsRmcvKM84HH5w5XG02ERWSAD_2ZRhF850O-BQk4lPHVCw6UsnRNF-Unl3c1Tsy9jJL4R57zt7h7iCbelfTrkQw1JhFsgxlF6BuwP6nT7Ehb4u6IH_r_COg3bCNR7FZX4rLuxi0M9fMJt1heoUGWwrNlUW5EYpDSDNW6SvmfD_dt3KTmSEZZAPMXJed2AVlARrsY3irkJVbZ3Z7yNNHukUSXZFKW28VUcIFfZdmJN5guPDCng9wr2HWLFMVV6HjfSsWu-A9wMR-rHOZUvpvv1UO9YoQzYVNOzgHETM90n1WyBi2IbfdngxRgc-nZDqVAr77stubn8vzHXu0PTyVgbPE8uZ5YlPk-IZmOvKBSZfejDsDjM7H6tJQtu0XOPNsSb0KEdkDRUg41zD4PZgsCpGCDsN3jHHTS1udFblyHtv-JS9BNZiPomXIbyfK4Y_p6QcQInjjcYgzgkBk9eTR3uQYZCjHOEjfqZxPy2bG_zyJdc-d6mlLYGYWXBXzWALQqEKfEzachUewsWFR-oFHeUZaamTKh4nALxUAMvl6e38Q2k8FhV2Mw_96qaorzo-tmX6mE84TDg8t_Tr0nvgnHZ-61PrpbalWfu137IX4OcScNaWb5monnOC2bBmlen2gEWif8uu8OWwIvadnHs3u0EEcU56wVkYbgG55DnqOD2cOSOMbOK4305-_FU-_POl02x-5RlxcZKU5ErfQI_EdSSX8jKKtrWYCWSKo5DVFhrgaN0tdr2oMY2Ry8vI2pSI1UnYTUBBOO6-P45dM-6awA7Fi8vEjtjRpgUUGIgtvpnMo6oRDMm7bo2-SFI2ER9dfUqKbBPPCLAqT_u3Ajq6PDf8411PoW1f3130-PPvKhjDLiQLrBDSHcugtnYVAqQp16vxcAx9RCzI3iXfNvE6r12qr0PBz7kQT9kZAQ7KOArpQFo3phqf5kCiqlkPMKhP_r3I1g4kq66BHiPAnnp81vHz_6hG8eUqIcnrMNr9vhA3lx5j6QxA4Z9F3DNQexPZ7PvzMa94Sfte7yakcTU-A_9LV3DY7x5O-w8XRv_XUUnzK6I6bnm_Tx7zerg8gYX13ONPOEouhndsRR_GqZamq-MjRNGn6mgquRFs86-4QIJF-37i9sLxjDJlr0qH4AS2gCZg7EAFDIerRdEi3IVOxlh4Ud1m_Q6DqM1lkNlo2pY4C1x8eig' // Substitua pelo seu token do Dropbox
});

// Configurações do Puppeteer para acessar o HireQuotient
const puppeteerOptions = {
  headless: true, // Defina como `false` se você quiser ver o processo no navegador
  executablePath: '/usr/bin/chromium', // Caminho do Chromium, se estiver rodando no Docker
  args: ['--no-sandbox', '--disable-setuid-sandbox']
};

// Função para interagir com o HireQuotient
const getAudioLinkFromHireQuotient = async (videoUrl) => {
  console.log(`Iniciando o processo de conversão do vídeo: ${videoUrl}`);

  const browser = await puppeteer.launch(puppeteerOptions);
  const page = await browser.newPage();
  
  // Navega para a página do HireQuotient
  await page.goto('https://www.hirequotient.com/');
  console.log('Página do HireQuotient carregada');

  // Preenche o campo de URL do vídeo com o link do YouTube
  await page.type('input[name="videoUrl"]', videoUrl); // Certifique-se de que o seletor está correto
  console.log('URL do vídeo inserido no campo de entrada');

  await page.click('button[type="submit"]'); // Clica no botão de "Converter"
  console.log('Botão de conversão clicado');
  
  // Aguarda até que o áudio esteja disponível
  await page.waitForSelector('audio'); // Aguarda o áudio aparecer
  console.log('Áudio encontrado na página');

  // Pega o link do áudio
  const audioUrl = await page.$eval('audio', (audio) => audio.src);
  
  await browser.close();
  console.log(`Link do áudio obtido: ${audioUrl}`);
  return audioUrl;
};

// Função para baixar o MP3 e fazer o upload para o Dropbox
const downloadMp3AndUploadToDropbox = async (url, title) => {
  console.log(`Iniciando o download do áudio: ${title}`);
  
  try {
    // Baixando o arquivo MP3
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    console.log('Arquivo MP3 baixado com sucesso');

    // Salva o arquivo MP3 localmente
    const audioPath = path.join(__dirname, `${title}.mp3`);
    fs.writeFileSync(audioPath, response.data);
    console.log(`Áudio salvo como: ${title}.mp3`);

    // Enviar para o Dropbox
    uploadToDropbox(audioPath, `${title}.mp3`);
  } catch (error) {
    console.error('Erro ao baixar o MP3 ou enviar para o Dropbox:', error);
  }
};

// Função para fazer o upload do arquivo para o Dropbox
const uploadToDropbox = (filePath, fileName) => {
  console.log(`Iniciando o upload do arquivo ${fileName} para o Dropbox...`);
  
  fs.readFile(filePath, (err, data) => {
    if (err) {
      console.error('Erro ao ler o arquivo:', err);
      return;
    }

    dropbox.filesUpload({
      path: `/Vídeos YT VR System/${fileName}`,
      contents: data
    }, (err, response) => {
      if (err) {
        console.error('Erro ao enviar para o Dropbox:', err);
      } else {
        console.log(`Arquivo enviado para o Dropbox com sucesso!`);
        // Remove o arquivo local após o upload
        fs.unlinkSync(filePath);
        console.log(`Arquivo ${fileName} removido localmente após upload.`);
      }
    });
  });
};

// Rota para fazer o processo de download e upload para o Dropbox
app.use(cors());

app.get('/download', async (req, res) => {
  const videoUrl = req.query.url;
  
  if (!videoUrl) {
    console.log('URL do vídeo não fornecida');
    return res.status(400).send('URL do vídeo não fornecida');
  }

  try {
    console.log(`Iniciando o processo para o vídeo: ${videoUrl}`);
    
    // Obtenha o link do áudio gerado pelo HireQuotient
    const audioUrl = await getAudioLinkFromHireQuotient(videoUrl);
    
    // O título pode ser extraído do vídeo ou ser passado como parâmetro
    const title = `Audio_${Date.now()}`;
    
    // Baixe o MP3 e envie para o Dropbox
    await downloadMp3AndUploadToDropbox(audioUrl, title);
    
    res.status(200).send('Áudio em processo de download e upload para o Dropbox');
  } catch (error) {
    console.error('Erro ao processar o áudio', error);
    res.status(500).send('Erro ao processar o áudio');
  }
});

// Iniciar o servidor
app.listen(3000, () => {
  console.log('Servidor rodando na porta 3000');
});
