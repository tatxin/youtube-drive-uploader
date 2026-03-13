import express from "express";
import axios from "axios";

const app = express();

app.get("/", (req, res) => {
  res.send("Uploader API is running");
});

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

/*
STREAM VIDEO FROM GOOGLE DRIVE
*/
app.get("/stream", async (req, res) => {
  try {

    const { url } = req.query;

    const response = await axios({
      method: "GET",
      url: url,
      responseType: "stream"
    });

    res.setHeader("Content-Type", "video/mp4");

    response.data.pipe(res);

  } catch (err) {
    console.error(err);
    res.status(500).send("Streaming failed");
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Uploader running on port ${PORT}`);
});
