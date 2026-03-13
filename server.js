import express from "express";
import axios from "axios";

const app = express();

app.get("/", (req, res) => {
  res.send("Uploader API is running");
});

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.get("/stream", async (req, res) => {
  try {
    const { fileId } = req.query;

    if (!fileId) {
      return res.status(400).send("Missing fileId parameter");
    }

    const driveUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

    const response = await axios({
      method: "GET",
      url: driveUrl,
      responseType: "stream",
      maxRedirects: 5,
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "*/*",
      },
    });

    const contentType = response.headers["content-type"] || "application/octet-stream";
    if (contentType) {
      res.setHeader("Content-Type", contentType);
    }

    const contentLength = response.headers["content-length"];
    if (contentLength) {
      res.setHeader("Content-Length", contentLength);
    }

    response.data.pipe(res);
  } catch (err) {
    console.error("STREAM ERROR:", err.response?.status, err.response?.statusText, err.message);
    res.status(500).send(`Streaming failed: ${err.response?.status || ""} ${err.response?.statusText || err.message}`);
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Uploader running on port ${PORT}`);
});
