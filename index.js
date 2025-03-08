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
        // Comando atualizado com cookies e parâmetros para extrair o título
        exec(`yt-dlp --cookies /app/cookies_netscape.txt -e ${url}`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing yt-dlp: ${stderr}`);
                return res.status(500).send('Failed to fetch video info');
            }
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

        // Comando atualizado com cookies, intervalo e formato MP3
        const command = `yt-dlp --cookies /app/cookies_netscape.txt --sleep-interval 5 -x --audio-format mp3 --output "${tempFilePath}" ${url}`;

        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing yt-dlp: ${stderr}`);
                return res.status(500).send('Failed to download audio');
            }

            const videoName = path.basename(tempFilePath, '.mp3');
            res.header("Content-Disposition", `attachment; filename="${videoName}.mp3"`);
            res.header("Content-type", "audio/mpeg");

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

app.get("/mp4", async (req, res) => {
    const { url } = req.query;

    if (url) {
        const tempFilePath = path.join(__dirname, 'tmp', 'download.mp4');

        // Comando para baixar o vídeo em mp4 com o melhor áudio e vídeo
        exec(`yt-dlp --cookies /app/cookies_netscape.txt -f bestvideo+bestaudio --merge-output-format mp4 --output "${tempFilePath}" ${url}`, (error, stdout, stderr) => {
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
