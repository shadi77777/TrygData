#TrygData – Prototype til PII-scanning for Domstolsstyrelsen

TrygData er et simpelt og brugervenligt værktøj udviklet til Danmarks Domstole. Det gør det muligt at analysere tekst for følsomme personoplysninger (PII), såsom CPR-numre, e-mails, adresser og navne, før de bruges i AI-værktøjer som Copilot eller ChatGPT.


## 🔐 Funktioner

* Automatisk detektion af:

  * CPR-numre (med validering)
  * Telefonnummer
  * E-mailadresser
  * Adresser
  * Navne
* Webgrænseflade: Brugere kan indsætte tekst og få analyseresultater direkte.
* Fejlhåndtering og tydelig feedback.
* Resultater vises med tydelige markeringer, hvis PII opdages.

## 🖥️ Sådan kommer du i gang (for begyndere)

Du behøver ikke være udvikler – følg bare disse trin:

### 1. Hent og udpak (spring over hvis du allerede har koden)
1. Gå til GitHub-projektet: [TrygData på GitHub](https://github.com/shadi77777/TrygData)
2. Klik på "Code" > "Download ZIP"
3. Udpak ZIP-filen på din computer

### 2. Installer Node.js
Hvis du ikke allerede har det:

* Gå til [https://nodejs.org](https://nodejs.org)
* Download og installer den nyeste LTS-version

### 3. Åbn projektet i en terminal

1. Åbn mappen `TrygData` i Stifinder
2. Højreklik i mappen og vælg “Åbn i Terminal” eller “Åbn i Kommandoprompt”
3. Skriv:

```bash
npm install
```

### 4. Start programmet

Når installationen er færdig, kør:

```bash
node server.js
```

Du vil se beskeden:

```
✅ PII-scanner kører på http://localhost:3000
```

### 5. Brug det i browseren

1. Åbn din browser
2. Gå til: `http://localhost:3000`
3. Indsæt tekst og klik “Analyser”


## 📘 Teknologier brugt

* Node.js (Express)
* NLP via `compromise`
* Regex til CPR-, e-mail- og telefonmatch