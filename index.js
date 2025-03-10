require('dotenv').config(); // Carrega as variáveis de ambiente do arquivo .env

const express = require("express");
const { google } = require("googleapis");
const app = express();
const cors = require("cors");
const { exec } = require("child_process");
const fs = require('fs');
const path = require("path");

const corsOptions = {
  origin: "https://api-baixar-video-youtube.onrender.com", // Ajuste conforme sua origem
  credentials: true,
  optionSuccessStatus: 200,
  exposedHeaders: "**",
};

app.use(cors(corsOptions));

// Configurações do OAuth 2.0 usando variáveis de ambiente
const OAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID, // Carrega o client_id do arquivo .env
  process.env.GOOGLE_CLIENT_SECRET, // Carrega o client_secret do arquivo .env
  process.env.REDIRECT_URI // Carrega a URL de callback do arquivo .env
);

const SCOPES = ['https://www.googleapis.com/auth/youtube.readonly']; // Escopo necessário para acessar a API do YouTube

// Rota para iniciar o processo de autenticação
app.get("/auth", (req, res) => {
  const authUrl = OAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  res.redirect(authUrl); // Redireciona o usuário para o login do Google
});

// Rota de callback do OAuth2
app.get("/oauth2callback", async (req, res) => {
  const { code } = req.query; // O código de autorização que vem na URL

  try {
    const { tokens } = await OAuth2Client.getToken(code); // Troca o código por tokens
    OAuth2Client.setCredentials(tokens); // Armazena os tokens na sessão (ou onde preferir)
    console.log("Tokens de acesso obtidos com sucesso");

    // Agora você pode usar o OAuth2Client para acessar a API do YouTube ou gerar cookies

    // Retorna ao usuário uma confirmação ou mensagem
    res.send("Autenticação bem-sucedida! Agora você pode usar a API.");

  } catch (error) {
    console.error("Erro ao obter os tokens: ", error);
    res.status(500).send("Erro durante o processo de autenticação");
  }
});

// Rota para baixar o vídeo
app.get("/baixar", async (req, res, next) => {
  console.log(req.query.url);

  try {
    const videoUrl = req.query.url;

    // Caminho para o arquivo de cookies
    const cookiesPath = "/app/cookies_netscape.txt";

    // Verifica se o arquivo de cookies existe
    fs.access(cookiesPath, fs.constants.F_OK, (err) => {
      if (err) {
        console.error(`Arquivo de cookies não encontrado: ${cookiesPath}`);
        return res.status(500).send("Arquivo de cookies não encontrado");
      } else {
        console.log(`Arquivo de cookies encontrado: ${cookiesPath}`);
      }
    });

    // Testa se o yt-dlp está instalado corretamente
    exec('yt-dlp --version', (error, stdout, stderr) => {
      if (error) {
        console.error(`Erro ao verificar yt-dlp: ${error.message}`);
        return res.status(500).send("Erro ao verificar yt-dlp");
      }
      console.log(`yt-dlp versão: ${stdout}`);
    });

    // Comando do yt-dlp para pegar o melhor áudio, utilizando os cookies e configurando a linguagem para português
    const command = `yt-dlp -f bestaudio --extract-audio --audio-format mp3 --quiet --no-warnings --cookies ${cookiesPath} --user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36" --referer "https://www.youtube.com/" --add-header "Accept-Language:pt-BR" --verbose ${videoUrl}`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Erro na execução do yt-dlp: ${error.message}`);
        return res.status(500).send("Erro ao baixar o áudio");
      }

      if (stderr) {
        console.error(`stderr: ${stderr}`);
        return res.status(500).send("Erro ao baixar o áudio");
      }

      console.log(`stdout: ${stdout}`); // Logando a saída
      res.send(stdout); // Envia a resposta
    });
  } catch (error) {
    next(error);
  }
});

app.listen(process.env.PORT || 8100, () => {
  console.log("Server on");
});
