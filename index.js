const express = require("express");
const app = express();
<<<<<<< HEAD
const cors = require("cors");
const { exec } = require("child_process");

const corsOptions = {
  origin: "https://api-baixar-video-youtube.onrender.com",
=======
const ytdl = require("ytdl-core");
const cors = require("cors");

const corsOptions = {
  origin: "https://api-baixar-video-youtube.onrender.com", 
>>>>>>> 67dfbb3c2ccddd1085dc1a9bf0c785b32fecf5fc
  credentials: true,
  optionSuccessStatus: 200,
  exposedHeaders: "**",
};

app.use(cors(corsOptions));

app.get("/baixar", async (req, res, next) => {
  console.log(req.query.url);
  try {
    const videoUrl = req.query.url;
<<<<<<< HEAD

    // Comando do yt-dlp para pegar o melhor áudio
    const command = `yt-dlp -f bestaudio --extract-audio --audio-format mp3 --quiet --no-warnings ${videoUrl}`;

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
=======
    const videoInfo = await ytdl.getInfo(videoUrl);
    const audioFormats = ytdl.filterFormats(videoInfo.formats, "audioonly");
    console.log(audioFormats);
    audioFormats.map((item) => {
      res.send(item.url);
>>>>>>> 67dfbb3c2ccddd1085dc1a9bf0c785b32fecf5fc
    });
  } catch (error) {
    next(error);
  }
});

app.listen(process.env.PORT || 8100, () => {
<<<<<<< HEAD
  console.log("Server on");
});
=======
    console.log("Server on");
});
>>>>>>> 67dfbb3c2ccddd1085dc1a9bf0c785b32fecf5fc
