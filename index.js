const express = require('express');
const { exec } = require('child_process');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());

app.get("/", (req, res) => {
    const ping = new Date();
    ping.setHours(ping.getHours() - 3);
    console.log(
        `Ping at: ${ping.getUTCHours()}:${ping.getUTCMinutes()}:${ping.getUTCSeconds()}`
    );
    res.sendStatus(200);
});

app.get("/info", async (req, res) => {
    const { url } = req.query;

    if (url) {
        exec(`yt-dlp -e ${url}`, (error, stdout, stderr) => {
            if (error || stderr) {
                console.error(`yt-dlp error: ${stderr}`);
                return res.status(500).send('Failed to fetch video info');
            }
            if (!stdout) {
                return res.status(404).send('Video not found');
            }
            console.log(`Video info: ${stdout.trim()}`); 
            res.json({ title: stdout.trim() });
        });
    } else {
        res.status(400).send("Invalid query");
    }
});


app.get("/mp3", async (req, res) => {
    const { url } = req.query;

    if (url) {
        const tempFilePath = path.join(__dirname, 'tmp', 'download.mp3');

        // Comando para baixar o áudio e convertê-lo para MP3 usando yt-dlp
        exec(`yt-dlp -x --audio-format mp3 --output "${tempFilePath}" ${url}`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing yt-dlp: ${stderr}`);
                return res.status(500).send('Failed to download audio');
            }

            // Extrai o nome do vídeo sem a extensão
            const videoName = path.basename(tempFilePath, '.mp3');
            res.header("Content-Disposition", `attachment; filename="${videoName}.mp3"`);
            res.header("Content-type", "audio/mpeg");

            // Verifica se o arquivo existe antes de enviar
            if (fs.existsSync(tempFilePath)) {
                res.sendFile(tempFilePath, (err) => {
                    if (err) {
                        console.error("Error sending file: ", err);
                        res.status(500).send('Failed to send file');
                    } else {
                        // Deleta o arquivo após o envio
                        fs.unlink(tempFilePath, (unlinkErr) => {
                            if (unlinkErr) {
                                console.error("Error deleting file: ", unlinkErr);
                            }
                        });
                    }
                });
            } else {
                res.status(500).send('File not found');
            }
        });
    } else {
        res.status(400).send("Invalid query");
    }
});

app.get("/mp4", async (req, res) => {
    const { url } = req.query;

    if (url) {
        const tempFilePath = path.join(__dirname, 'tmp', 'download.mp4');

        exec(`yt-dlp -f bestvideo+bestaudio --merge-output-format mp4 --output "${tempFilePath}" ${url}`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing yt-dlp: ${stderr}`);
                return res.status(500).send('Failed to download video');
            }

            const videoName = path.basename(tempFilePath, '.mp4');
            res.header("Content-Disposition", `attachment; filename="${videoName}.mp4"`);
            res.header("Content-type", "video/mp4");

            if (fs.existsSync(tempFilePath)) {
                res.sendFile(tempFilePath, (err) => {
                    if (err) {
                        console.error("Error sending file: ", err);
                        res.status(500).send('Failed to send file');
                    } else {
                        fs.unlink(tempFilePath, (unlinkErr) => {
                            if (unlinkErr) {
                                console.error("Error deleting file: ", unlinkErr);
                            }
                        });
                    }
                });
            } else {
                res.status(500).send('File not found');
            }
        });
    } else {
        res.status(400).send("Invalid query");
    }
});

app.listen(process.env.PORT || 8100, () => {
    console.log("Server on");
});
