# Setup Instructies - Kaaspop Vrijwilligers Formulier

## Stap 1: Google Sheets aanmaken

1. Ga naar [Google Sheets](https://sheets.google.com)
2. Maak een nieuwe spreadsheet aan
3. Geef het een naam, bijvoorbeeld: "Kaaspop Vrijwilligers 2025"

## Stap 2: Google Apps Script toevoegen

1. In je Google Sheet: klik op **Extensies** → **Apps Script**
2. Verwijder de standaard code
3. Kopieer de volledige code uit `google-apps-script.js`
4. Plak deze in de Apps Script editor
5. **Belangrijk:** Pas de configuratie aan bovenaan het script:
   ```javascript
   const CONFIG = {
     organisatieEmail: 'jouw-email@kaaspop.nl', // ← Vervang met jouw email
     sheetName: 'Aanmeldingen',
     emailVanNaam: 'Kaaspop Vrijwilligers',
     emailOnderwerp: 'Bevestiging aanmelding Kaaspop vrijwilliger'
   };
   ```
6. Klik op **Opslaan** (💾 icoon)
7. Geef het project een naam, bijvoorbeeld: "Kaaspop Formulier Backend"

## Stap 3: Script deployen als Web App

1. Klik op **Implementeren** → **Nieuwe implementatie**
2. Klik op het tandwiel ⚙️ icoon naast "Type selecteren"
3. Kies **Web-app**
4. Vul in:
   - **Beschrijving:** "Kaaspop Formulier v1"
   - **Uitvoeren als:** Ik (jouw email)
   - **Wie heeft toegang:** Iedereen
5. Klik op **Implementeren**
6. **Autorisatie vereist** popup verschijnt:
   - Klik op **Toegang autoriseren**
   - Kies je Google account
   - Klik op **Geavanceerd** → **Ga naar [Project naam] (onveilig)**
   - Klik op **Toestaan**
7. **Kopieer de Web-app URL** (eindigt op `/exec`)

## Stap 4: URL toevoegen aan HTML formulier

1. Open `persoonsgegevens-formulier.html`
2. Zoek naar regel met: `const scriptURL = 'VERVANG_MET_JOUW_GOOGLE_APPS_SCRIPT_URL';`
3. Vervang de URL met jouw gekopieerde Web-app URL:
   ```javascript
   const scriptURL = 'https://script.google.com/macros/s/AKfycby.../exec';
   ```
4. Sla het bestand op

## Stap 5: Testen

### Test 1: Script testen in Apps Script
1. Ga terug naar Apps Script editor
2. Selecteer de functie `testScript` in de dropdown
3. Klik op **Uitvoeren** (▶️)
4. Controleer of:
   - Er een nieuwe sheet "Aanmeldingen" is aangemaakt
   - Er een testrij is toegevoegd
   - Je een test email hebt ontvangen

### Test 2: Formulier testen
1. Open `persoonsgegevens-formulier.html` in je browser
2. Vul het formulier in met je eigen gegevens
3. Klik op **Verzenden**
4. Controleer:
   - ✅ Succesbericht verschijnt
   - ✅ Data staat in Google Sheets
   - ✅ Bevestigingsmail ontvangen
   - ✅ Notificatie mail ontvangen (op organisatie email)

## Stap 6: Formulier online zetten

### Optie A: Firebase Hosting (Aanbevolen)

1. Installeer Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Login bij Firebase:
   ```bash
   firebase login
   ```

3. Initialiseer project:
   ```bash
   firebase init hosting
   ```
   - Kies: **Create a new project**
   - Project naam: kaaspop-vrijwilligers
   - Public directory: `.` (huidige map)
   - Single-page app: **No**
   - GitHub deploys: **No**

4. Deploy:
   ```bash
   firebase deploy
   ```

5. Je formulier is nu live op: `https://kaaspop-vrijwilligers.web.app`

### Optie B: Netlify (Simpeler)

1. Ga naar [Netlify](https://www.netlify.com)
2. Sleep `persoonsgegevens-formulier.html` naar de upload zone
3. Klaar! Je krijgt een URL zoals: `https://kaaspop-vrijwilligers.netlify.app`

### Optie C: GitHub Pages (Gratis)

1. Maak een GitHub repository
2. Upload `persoonsgegevens-formulier.html`
3. Ga naar Settings → Pages
4. Selecteer branch: main
5. Formulier is live op: `https://[username].github.io/[repo-name]`

## Stap 7: Custom domein (Optioneel)

Als je een eigen domein wilt zoals `aanmelden.kaaspop.nl`:

1. Koop een domein (bijv. bij TransIP, Hostnet)
2. Voeg DNS records toe:
   - Voor Firebase: A record naar Firebase IP
   - Voor Netlify: CNAME naar Netlify
3. Configureer in Firebase/Netlify dashboard

## Troubleshooting

### "Script niet gevonden" error
- Controleer of de Web-app URL correct is gekopieerd
- Zorg dat de URL eindigt op `/exec` (niet `/dev`)

### Geen emails ontvangen
- Controleer spam folder
- Controleer of `organisatieEmail` correct is ingevuld
- Test met `testScript()` functie

### Data komt niet in Sheets
- Controleer of script is gedeployed als "Iedereen" heeft toegang
- Kijk in Apps Script → Executions voor error logs

### CORS errors in browser console
- Dit is normaal bij `mode: 'no-cors'`
- Data wordt wel verzonden, maar response is niet leesbaar
- Formulier werkt gewoon!

## Extra features toevoegen

### Automatische samenvatting per locatie
Voeg toe aan Apps Script:
```javascript
function createSummary() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const dataSheet = ss.getSheetByName('Aanmeldingen');
  // ... samenvatting logica
}
```

### Export naar Excel
In Google Sheets: **Bestand** → **Downloaden** → **Microsoft Excel**

### Automatische herinneringen
Gebruik Google Apps Script triggers om herinneringsmails te sturen

## Support

Vragen? Check:
- [Google Apps Script Docs](https://developers.google.com/apps-script)
- [Firebase Hosting Docs](https://firebase.google.com/docs/hosting)

Succes met Kaaspop! 🧀🎵
