require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const dns = require('dns');
const sqlite3 = require('better-sqlite3');
const crypto = require('crypto');

// Basic Configuration
const port = process.env.PORT || 4000;

// Using sqlite3
let db;
try {
  db = new sqlite3('./database.db');
  console.log('Connected to the database.'); 
} catch (err) {
  console.error(err.message);
}

// SQL statement to create a table named 'users'
const createTableSql = `
  CREATE TABLE IF NOT EXISTS shortlinks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    original_url TEXT NOT NULL UNIQUE,
    short_url TEXT NOT NULL
  )
`;

// Execute the SQL statement to create the table
try {
  db.exec(createTableSql);
  console.log('Table "users" created successfully.');
} catch (error) {
  console.error('Error creating table:', error.message);
}

function generateSecureRandomNumber(min, max) {
  if (min >= max) {
    throw new Error('Min must be less than max');
  }
  const range = max - min + 1;
  const numBytes = Math.ceil(Math.log2(range) / 8);
  const randomBytes = crypto.randomBytes(numBytes);
  const randomNumber = randomBytes.readUIntBE(0, numBytes) % range;
  return min + randomNumber;
}

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

// Use express.json() to parse JSON request bodies
app.use(express.json());

// Use express.urlencoded() to parse URL-encoded request bodies (e.g., from forms)
// The { extended: true } option allows for parsing rich objects and arrays
app.use(express.urlencoded({ extended: true }));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl', (req, res) => {
  const url = req.body['url'];
  const short_url = String(generateSecureRandomNumber(10000, 99999));

  const urlRegex = new RegExp("^https?://");
  console.log(url);
  console.log(urlRegex.test(url));
  if (!urlRegex.test(url)) {
    // console.log('invalid url');
    return res.status(400).json({ error: 'invalid url' });
  }

  // dns.lookup(url, (err, address, family) => {
  //   if (err) {
  //     console.error('DNS lookup failed:', err);
  //     return;
  //   }
  //   console.log('DNS lookup succeeded:', address);
  // });
  
  const insert = db.prepare('INSERT INTO shortlinks (original_url, short_url) VALUES (?, ?)');
  
  try {
    const info = insert.run(url, short_url);
    console.log(info.changes); // Number of rows changed
  } catch (err) {
    console.error(err.message);
  }

  res.json({ original_url: url, short_url: short_url });
});

app.get('/api/shorturl/:short_url', function(req, res) {
  const short_url = String(req.params.short_url);
  const getByShort = db.prepare('SELECT original_url FROM shortlinks WHERE short_url = ?');
  console.log(short_url);
  let original_url
  try {
    original_url = getByShort.get(short_url);
    console.log(original_url);
  } catch (err) {
    console.error(err.message);
  }

  res.redirect(original_url.original_url)
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
