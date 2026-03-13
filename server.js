import express from "express";
import axios from "axios";
import { google } from "googleapis";

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Uploader API is running");
});

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.post("/upload", async (req, res) => {
  try {
    const { downloadUrl, title } = req.body;

    const youtube = google.youtube({
      version: "v3",
      auth: process.env.YOUTUBE_API_KEY
    });

    const videoStream = await axios({
      url: downloadUrl,
      method: "GET",
      responseType: "stream"
    });

    const response = await youtube.videos.insert({
      part: "snippet,status",
      requestBody: {
        snippet: {
          title: title
        },
        status: {
          privacyStatus: "public"
        }
      },
      media: {
        body: videoStream.data
      }
    });

    res.json(response.data);
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Uploader running on port ${PORT}`);
});
