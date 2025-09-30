require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const dns = require('dns');

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl', function(req, res) {
  const url = req.body.url;
  const short_url = 15562;

  dns.lookup(url, (err, address, family) => {
    if (err) {
      console.error('DNS lookup failed:', err);
      return;
    }
    console.log('DNS lookup succeeded:', address);
  });

  res.json({ original_url: url, short_url: short_url });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
