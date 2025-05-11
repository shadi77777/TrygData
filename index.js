// Importerer nødvendige moduler
const express = require('express'); // Webserver framework
const nlp = require('compromise');  // NLP-bibliotek til at finde navne
const path = require('path');       // Hjælper med filstier

const app = express();
app.use(express.json());            // Middleware til at parse JSON-requests
app.use(express.static('public'));  // Server statiske filer fra 'public'-mappen

// --- REGEX TIL PII-DETEKTION ---
const cprRegex     = /\b\d{6}-\d{4}\b|\b\d{10}\b/g; // CPR med eller uden bindestreg
const emailRegex   = /\b[\w.%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g; // E-mails
const phoneRegex   = /(?:\+45\s?)?(?:\d{2}\s?){4}\b/g;              // Danske telefonnumre med/uden +45
const addressRegex = /\b(?:[A-ZÆØÅ][a-zæøå]+(?:\s[A-ZÆØÅ][a-zæøå]+)*\s\d{1,3}[A-Za-z]?)\b/g; // En simpel adresse-detektor

// --- GYLDIGHEDSTJEK PÅ CPR ---
function isValidCpr(value) {
  const digits = value.replace('-', '');               // Fjerner evt. bindestreg
  const day = parseInt(digits.substring(0, 2));        // Uddrag dag
  const month = parseInt(digits.substring(2, 4));      // Uddrag måned
  return day >= 1 && day <= 31 && month >= 1 && month <= 12; // Simpelt tjek på gyldig dato
}

// --- PII-DETEKTION ---
function detectPII(text) {
  const hits = []; // Her gemmes fundne personoplysninger
  let match;

  // Matcher CPR-numre og validerer dem
  while ((match = cprRegex.exec(text)) !== null) {
    if (isValidCpr(match[0])) {
      hits.push({ type: 'CPR-nummer', value: match[0], gdpr: 'personoplysning' });
    }
  }

  // Matcher e-mails
  while ((match = emailRegex.exec(text)) !== null)
    hits.push({ type: 'E-mail', value: match[0], gdpr: 'personoplysning' });

  // Matcher telefonnumre
  while ((match = phoneRegex.exec(text)) !== null)
    hits.push({ type: 'Telefonnummer', value: match[0], gdpr: 'personoplysning' });

  // Matcher adresser
  while ((match = addressRegex.exec(text)) !== null)
    hits.push({ type: 'Adresse', value: match[0], gdpr: 'personoplysning' });

  // Matcher navne via NLP (compromise)
  const doc = nlp(text);
  doc.people().out('array').forEach(name => {
    hits.push({ type: 'Navn', value: name, gdpr: 'personoplysning' });
  });

  return hits;
}

// --- PII-MIDDLEWARE ---
function piiMiddleware(req, res, next) {
  const text = req.body.text;

  // Validerer input: skal være ikke-tom streng
  if (typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'Teksten mangler eller er ugyldig.' });
  }

  // Maks længde på 10.000 tegn
  if (text.length > 10000) {
    return res.status(413).json({ error: 'Teksten er for lang (max 10.000 tegn).' });
  }

  // Detekter PII
  const hits = detectPII(text);
  if (hits.length > 0) {
    // Samler statistik pr. type
    const stats = {};
    hits.forEach(h => {
      const key = h.type.toLowerCase();
      stats[key] = (stats[key] || 0) + 1;
    });

    // Returnerer fejlmeddelelse med detaljer
    return res.status(400).json({
      error: 'Følsomme personoplysninger fundet.',
      details: hits,
      stats: {
        total: hits.length,
        byType: stats
      }
    });
  }

  next(); // Ingen PII fundet – fortsæt til næste handler
}

// --- POST /chat ---
app.post('/chat', piiMiddleware, (req, res) => {
  const text = req.body.text;
  const wordCount = text.trim().split(/\s+/).length; // Tæl antal ord

  // Svar hvis alt OK
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
  res.sendFile(path.join(__dirname, 'public/index.html')); // Server forsiden
});

// --- START SERVER ---
const PORT = process.env.PORT || 3000; // Brug miljøvariabel eller default 3000
app.listen(PORT, () => {
  console.log(`✅ PII-scanner kører på http://localhost:${PORT}`);
});
