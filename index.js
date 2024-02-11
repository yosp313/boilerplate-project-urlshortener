require("dotenv").config();

const express = require("express");
const cors = require("cors");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const urlParser = require("url");
const dns = require("dns");

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use("/public", express.static(`${process.cwd()}/public`));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to database"))
  .catch((err) => console.log(err));
let id = 0;

const urlSchema = new mongoose.Schema({
  originalUrl: String,
  shortUrl: Number,
});

const Url = mongoose.model("Url", urlSchema);

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Your first API endpoint
app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});

app.post("/api/shorturl", async (req, res) => {
  const url = req.body.url;
  const dnsLookUp = dns.lookup(
    urlParser.parse(url).hostname,
    async (err, address) => {
      if (err) {
        console.log(err);
        return res.json({ error: "invalid url" });
      }
      id++;
      const urlObj = new Url({ originalUrl: url, shortUrl: id });
      await urlObj
        .save()
        .then((data) => {
          console.log("Url saved " + JSON.stringify(data));
        })
        .catch((err) => console.log(err));

      res.json({
        original_url: urlObj.originalUrl,
        short_url: urlObj.shortUrl,
      });
    }
  );
});

app.get("/api/shorturl/:id", async (req, res) => {
  const id = req.params.id;

  await Url.findOne({ shortUrl: id })
    .then((data) => {
      console.log(data);
      return res.redirect("https://" + data.originalUrl);
    })
    .catch((err) => {
      console.log(err);
      return res.json({ error: "invalid url" });
    });
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
