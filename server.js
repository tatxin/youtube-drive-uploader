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

    const apiKey = process.env.GDRIVE_API_KEY;
    if (!apiKey) {
      return res.status(500).send("Missing GDRIVE_API_KEY");
    }

    const driveApiUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${apiKey}`;

    const fileResp = await axios.get(driveApiUrl, {
      responseType: "stream",
      maxRedirects: 5,
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "*/*"
      }
    });

    if (fileResp.headers["content-type"]) {
      res.setHeader("Content-Type", fileResp.headers["content-type"]);
    }
    if (fileResp.headers["content-length"]) {
      res.setHeader("Content-Length", fileResp.headers["content-length"]);
    }

    fileResp.data.pipe(res);
  } catch (err) {
    console.error(
      "STREAM ERROR:",
      err.response?.status,
      err.response?.data || err.message
    );
    res.status(err.response?.status || 500).send("Streaming failed");
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Uploader running on port ${PORT}`);
});
