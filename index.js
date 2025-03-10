const express = require("express");
const app = express();
const cors = require("cors");
const { exec } = require("child_process");

const corsOptions = {
  origin: "https://api-baixar-video-youtube.onrender.com",
  credentials: true,
  optionSuccessStatus: 200,
  exposedHeaders: "**",
};

app.use(cors(corsOptions));

app.get("/baixar", async (req, res, next) => {
  console.log(req.query.url);
  try {
    const videoUrl = req.query.url;

    // Caminho para o arquivo de cookies
    const cookiesPath = "/app/cookies_netscape.txt";

    // Comando do yt-dlp para pegar o melhor áudio, utilizando cookies e User-Agent
    const command = `yt-dlp -f bestaudio --extract-audio --audio-format mp3 --quiet --no-warnings --cookies ${cookiesPath} --user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36" --verbose ${videoUrl}`;

    // Executando o comando yt-dlp
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        return res.status(500).send("Erro ao baixar o áudio");
      }

      if (stderr) {
        console.error(`stderr: ${stderr}`);
      }

      // A resposta pode ser o link do áudio ou algo gerado após o download
      console.log(`stdout: ${stdout}`);
      res.send(stdout); // Ajuste conforme necessário (por exemplo, retornando o URL do áudio ou o caminho do arquivo)
    });
  } catch (error) {
    next(error);
  }
});

app.listen(process.env.PORT || 8100, () => {
  console.log("Server on");
});
