require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const dns = require("dns");

// Basic Configuration
const port = process.env.PORT || 3000;

const db = {};
let urlnum = 1;

// Middleware: validate URL format and DNS resolution
function validateUrl(req, res, next) {
  const inputUrl = req.body.url;

  let parsed;
  try {
    parsed = new URL(inputUrl);


    if (!/^https?:$/.test(parsed.protocol)) {
      return res.json({ error: "invalid url" });
    }
  } catch {
    return res.json({ error: "invalid url" });
  }


  dns.lookup(parsed.hostname, (err) => {
    if (err) {
      return res.json({ error: "invalid url" });
    }

    next();
  });
}


function saveRecord(url) {

  for (const key in db) {
    if (db[key].original_url === url) {
      return Number(key);
    }
  }

  const shortUrl = urlnum++;
  db[shortUrl] = {
    original_url: url,
    short_url: shortUrl.toString()
  };

  return shortUrl;
}


app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.post("/api/shorturl", validateUrl, (req, res) => {
  saveRecord(req.body.url)
  console.log(db);

  res.json({
    original_url: req.body.url,
    short_url: db[saveRecord(req.body.url)].short_url
  });
});

app.get('/api/shorturl/:short?', (req, res) => {
  const short = req.params.short;
  const original = db[short].original_url;

  if (!original) {
    return res.json({ error: 'No short URL found' });
  }

  res.redirect(original);
});


app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
