const axios = require('axios');
const fs = require('fs');
const path = require('path');
const dropboxV2Api = require('dropbox-v2-api');
const express = require('express');
const app = express();
const cors = require('cors');

// Instanciando o cliente do Dropbox
const dropbox = dropboxV2Api.authenticate({
  token: 'SEU_TOKEN_DO_DROPBOX_AQUI' // Substitua pelo seu token do Dropbox
});

// Configure o Axios para usar o User-Agent necessário
const axiosInstance = axios.create({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
  }
});

// Função para baixar o arquivo MP3 e fazer upload para o Dropbox
const downloadMp3AndUploadToDropbox = async (url, title) => {
  try {
    // Baixando o arquivo MP3 usando o link gerado pelo HireQuotient
    const response = await axiosInstance.get(url, { responseType: 'arraybuffer' });
    
    // Criação do caminho local para salvar o arquivo de áudio
    const audioPath = path.join(__dirname, `${title}.mp3`);
    
    // Escrevendo o arquivo no disco
    fs.writeFileSync(audioPath, response.data);
    console.log(`Áudio baixado com sucesso: ${title}.mp3`);

    // Enviar o arquivo para o Dropbox
    uploadToDropbox(audioPath, `${title}.mp3`);
  } catch (error) {
    console.error('Erro ao baixar o MP3 ou enviar para o Dropbox:', error);
  }
};

// Função para fazer o upload do arquivo para o Dropbox
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
  const { url, title } = req.body;

  if (!url || !title) {
    return res.status(400).send('URL ou título não fornecido');
  }

  try {
    console.log(`Iniciando o download do MP3 para o vídeo: ${title}`);
    await downloadMp3AndUploadToDropbox(url, title);
    res.status(200).send('Áudio em processo de download e upload para o Dropbox');
  } catch (error) {
    res.status(500).send('Erro ao processar o áudio');
  }
});

// Iniciar o servidor
app.listen(3000, () => {
  console.log('Servidor rodando na porta 3000');
});
