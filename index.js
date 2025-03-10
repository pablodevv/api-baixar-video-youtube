const express = require("express");
const app = express();
const ytdl = require("ytdl-core");
const cors = require("cors");

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
    const videoInfo = await ytdl.getInfo(videoUrl);
    const audioFormats = ytdl.filterFormats(videoInfo.formats, "audioonly");
    console.log(audioFormats);
    audioFormats.map((item) => {
      res.send(item.url);
    });
  } catch (error) {
    next(error);
  }
});

app.listen(8100, () => {
  console.log("Server running on port 8100");
});