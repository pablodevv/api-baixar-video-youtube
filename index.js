const axios = require('axios');
const fs = require('fs');
const path = require('path');
const ytdl = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const dropboxV2Api = require('dropbox-v2-api');
const express = require('express');
const app = express();
const cors = require('cors');

// Configure o Axios para usar o User-Agent necessário
const instance = axios.create({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
  }
});

// Instanciando o cliente do Dropbox
const dropbox = dropboxV2Api.authenticate({
  token: 'sl.u.AFnN5jjWuoNG3WYngPTaTlHE0cjkS1wIIuZzeUZPtkzT1qa6pCYgKIoTxqKLwzWl_XJYQD04ed26cyDTvCqQ8uqlFVUXbrcDCc1Zr1J0mrgBf3fkrL4mSvZGGPZZ6y7QU6MG1ALfkWq57aQ1yZO3AhSEGba4fqZGyhCoGmWSLQGmBpvOvPlRK5ZLUD2c8ti0SA1hPy_vJ0VRBaVYXENqm8-DnIkx9oniX2dMsy_wcmnoVH_ig6hrVznoMBPAQcHNmd7P-dwfPYdHVExWfeKY1lzTCRzLKxPpOFNCbS6zsRmcvKM84HH5w5XG02ERWSAD_2ZRhF850O-BQk4lPHVCw6UsnRNF-Unl3c1Tsy9jJL4R57zt7h7iCbelfTrkQw1JhFsgxlF6BuwP6nT7Ehb4u6IH_r_COg3bCNR7FZX4rLuxi0M9fMJt1heoUGWwrNlUW5EYpDSDNW6SvmfD_dt3KTmSEZZAPMXJed2AVlARrsY3irkJVbZ3Z7yNNHukUSXZFKW28VUcIFfZdmJN5guPDCng9wr2HWLFMVV6HjfSsWu-A9wMR-rHOZUvpvv1UO9YoQzYVNOzgHETM90n1WyBi2IbfdngxRgc-nZDqVAr77stubn8vzHXu0PTyVgbPE8uZ5YlPk-IZmOvKBSZfejDsDjM7H6tJQtu0XOPNsSb0KEdkDRUg41zD4PZgsCpGCDsN3jHHTS1udFblyHtv-JS9BNZiPomXIbyfK4Y_p6QcQInjjcYgzgkBk9eTR3uQYZCjHOEjfqZxPy2bG_zyJdc-d6mlLYGYWXBXzWALQqEKfEzachUewsWFR-oFHeUZaamTKh4nALxUAMvl6e38Q2k8FhV2Mw_96qaorzo-tmX6mE84TDg8t_Tr0nvgnHZ-61PrpbalWfu137IX4OcScNaWb5monnOC2bBmlen2gEWif8uu8OWwIvadnHs3u0EEcU56wVkYbgG55DnqOD2cOSOMbOK4305-_FU-_POl02x-5RlxcZKU5ErfQI_EdSSX8jKKtrWYCWSKo5DVFhrgaN0tdr2oMY2Ry8vI2pSI1UnYTUBBOO6-P45dM-6awA7Fi8vEjtjRpgUUGIgtvpnMo6oRDMm7bo2-SFI2ER9dfUqKbBPPCLAqT_u3Ajq6PDf8411PoW1f3130-PPvKhjDLiQLrBDSHcugtnYVAqQp16vxcAx9RCzI3iXfNvE6r12qr0PBz7kQT9kZAQ7KOArpQFo3phqf5kCiqlkPMKhP_r3I1g4kq66BHiPAnnp81vHz_6hG8eUqIcnrMNr9vhA3lx5j6QxA4Z9F3DNQexPZ7PvzMa94Sfte7yakcTU-A_9LV3DY7x5O-w8XRv_XUUnzK6I6bnm_Tx7zerg8gYX13ONPOEouhndsRR_GqZamq-MjRNGn6mgquRFs86-4QIJF-37i9sLxjDJlr0qH4AS2gCZg7EAFDIerRdEi3IVOxlh4Ud1m_Q6DqM1lkNlo2pY4C1x8eig' // Substitua pelo seu token do Dropbox
});

// Função para baixar o áudio do vídeo utilizando o link correto
const downloadAudio = async (url) => {
  try {
    // Baixando o arquivo de vídeo com ytdl-core
    const videoStream = ytdl(url, { quality: 'highestaudio' });

    // Criando um nome de arquivo único baseado no título do vídeo
    const videoTitle = await ytdl.getBasicInfo(url).then(info => info.videoDetails.title);
    const audioFileName = `${videoTitle}.mp3`;
    const audioPath = path.join(__dirname, audioFileName);

    // Usando o ffmpeg para extrair o áudio do vídeo e salvar como arquivo mp3
    ffmpeg(videoStream)
      .audioCodec('libmp3lame')
      .audioBitrate(192)
      .on('end', () => {
        console.log(`Áudio extraído e salvo como ${audioFileName}`);
        uploadToDropbox(audioPath, audioFileName); // Carregar para o Dropbox após a conversão
      })
      .save(audioPath);

  } catch (error) {
    console.error('Erro ao baixar o áudio:', error);
  }
};

// Função para enviar o arquivo de áudio para o Dropbox
const uploadToDropbox = (filePath, fileName) => {
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
      }
    });
  });
};

// Rota para receber o link do HireQuotient
app.use(cors());
app.use(express.json());

app.post('/baixar-audio', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).send('URL do vídeo não fornecida');
  }

  try {
    console.log(`Iniciando o download do áudio para o vídeo: ${url}`);
    await downloadAudio(url);
    res.status(200).send('Áudio em processo de conversão e upload para o Dropbox');
  } catch (error) {
    res.status(500).send('Erro ao processar o vídeo');
  }
});

// Iniciar o servidor
app.listen(3000, () => {
  console.log('Servidor rodando na porta 3000');
});
