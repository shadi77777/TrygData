const express = require('express');
const nlp = require('compromise');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static('public'));

// --- REGEX TIL PII-DETEKTION ---
const cprRegex     = /\b\d{6}-\d{4}\b|\b\d{10}\b/g;
const emailRegex   = /\b[\w.%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
const phoneRegex   = /(?:\+45\s?)?(?:\d{2}\s?){4}\b/g;
const addressRegex = /\b(?:[A-ZÆØÅ][a-zæøå]+(?:\s[A-ZÆØÅ][a-zæøå]+)*\s\d{1,3}[A-Za-z]?)\b/g;

// --- GYLDIGHEDSTJEK PÅ CPR ---
function isValidCpr(value) {
  const digits = value.replace('-', '');
  const day = parseInt(digits.substring(0, 2));
  const month = parseInt(digits.substring(2, 4));
  return day >= 1 && day <= 31 && month >= 1 && month <= 12;
}

// --- PII-DETEKTION ---
function detectPII(text) {
  const hits = [];
  let match;

  while ((match = cprRegex.exec(text)) !== null) {
    if (isValidCpr(match[0])) {
      hits.push({ type: 'CPR-nummer', value: match[0], gdpr: 'personoplysning' });
    }
  }

  while ((match = emailRegex.exec(text)) !== null)
    hits.push({ type: 'E-mail', value: match[0], gdpr: 'personoplysning' });

  while ((match = phoneRegex.exec(text)) !== null)
    hits.push({ type: 'Telefonnummer', value: match[0], gdpr: 'personoplysning' });

  while ((match = addressRegex.exec(text)) !== null)
    hits.push({ type: 'Adresse', value: match[0], gdpr: 'personoplysning' });

  const doc = nlp(text);
  doc.people().out('array').forEach(name => {
    hits.push({ type: 'Navn', value: name, gdpr: 'personoplysning' });
  });

  return hits;
}

// --- PII-MIDDLEWARE ---
function piiMiddleware(req, res, next) {
  const text = req.body.text;

  if (typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'Teksten mangler eller er ugyldig.' });
  }

  if (text.length > 10000) {
    return res.status(413).json({ error: 'Teksten er for lang (max 10.000 tegn).' });
  }

  const hits = detectPII(text);
  if (hits.length > 0) {
    const stats = {};
    hits.forEach(h => {
      const key = h.type.toLowerCase();
      stats[key] = (stats[key] || 0) + 1;
    });

    return res.status(400).json({
      error: 'Følsomme personoplysninger fundet.',
      details: hits,
      stats: {
        total: hits.length,
        byType: stats
      }
    });
  }

  next();
}

// --- POST /chat ---
app.post('/chat', piiMiddleware, (req, res) => {
  const text = req.body.text;
  const wordCount = text.trim().split(/\s+/).length;
  res.json({
    reply: `Teksten blev analyseret uden fund af følsomme oplysninger.`,
    stats: {
      wordCount: wordCount,
      piiDetected: false
    }
  });
});

// --- Fallback GET / til HTML ---
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// --- START SERVER ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ PII-scanner kører på http://localhost:${PORT}`);
});
