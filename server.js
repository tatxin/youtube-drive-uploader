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

    const client = axios.create({
      maxRedirects: 5,
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "*/*",
      },
      validateStatus: () => true,
    });

    const firstUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
    const firstResp = await client.get(firstUrl, {
      responseType: "text",
    });

    const contentType = firstResp.headers["content-type"] || "";

    // If Google already returned the file directly
    if (!contentType.includes("text/html")) {
      const fileResp = await client.get(firstUrl, {
        responseType: "stream",
      });

      if (fileResp.headers["content-type"]) {
        res.setHeader("Content-Type", fileResp.headers["content-type"]);
      }
      if (fileResp.headers["content-length"]) {
        res.setHeader("Content-Length", fileResp.headers["content-length"]);
      }

      return fileResp.data.pipe(res);
    }

    const html = firstResp.data || "";

    // Try to extract the confirm token from the HTML
    const confirmMatch =
      html.match(/confirm=([0-9A-Za-z_]+)&/) ||
      html.match(/name="confirm" value="([0-9A-Za-z_]+)"/) ||
      html.match(/confirm=([0-9A-Za-z_]+)/);

    if (!confirmMatch) {
      console.error("Could not find confirm token in Google Drive response");
      return res.status(500).send("Could not extract Google Drive confirm token");
    }

    const confirmToken = confirmMatch[1];

    // Reuse cookies from the first response
    const cookies = (firstResp.headers["set-cookie"] || [])
      .map((c) => c.split(";")[0])
      .join("; ");

    const secondUrl = `https://drive.google.com/uc?export=download&confirm=${confirmToken}&id=${fileId}`;

    const fileResp = await client.get(secondUrl, {
      responseType: "stream",
      headers: {
        Cookie: cookies,
      },
    });

    if ((fileResp.headers["content-type"] || "").includes("text/html")) {
      console.error("Google Drive still returned HTML instead of the file");
      return res.status(500).send("Google Drive returned HTML instead of file");
    }

    if (fileResp.headers["content-type"]) {
      res.setHeader("Content-Type", fileResp.headers["content-type"]);
    }
    if (fileResp.headers["content-length"]) {
      res.setHeader("Content-Length", fileResp.headers["content-length"]);
    }

    fileResp.data.pipe(res);
  } catch (err) {
    console.error("STREAM ERROR:", err.response?.status, err.message);
    res.status(500).send("Streaming failed");
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Uploader running on port ${PORT}`);
});
