// Google Apps Script voor Kaaspop Vrijwilligers Formulier
// Deploy als Web App en kopieer de URL naar het HTML formulier

// CONFIGURATIE - PAS DIT AAN
const CONFIG = {
  organisatieEmail: 'vrijwilligers@kaaspop.nl', // Vervang met jouw email
  sheetName: 'Aanmeldingen 2025',
  emailVanNaam: 'Kaaspop Vrijwilligers',
  emailOnderwerp: 'Bevestiging aanmelding Kaaspop vrijwilliger'
};

// Hoofdfunctie die POST requests afhandelt
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    // Check of dit een availability request is
    if (data.action === 'getAvailability') {
      const availability = getAllAvailability();
      return ContentService
        .createTextOutput(JSON.stringify({ success: true, availability: availability }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Check of er nog plek is voor dit tijdslot
    const availabilityCheck = checkAvailability(data.vrijwilligerswerk);
    if (!availabilityCheck.available) {
      return ContentService
        .createTextOutput(JSON.stringify({ 
          success: false, 
          message: availabilityCheck.message 
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Sla data op in Google Sheets
    saveToSheet(data);
    
    // Verstuur bevestigingsmail naar deelnemer
    sendConfirmationEmail(data);
    
    // Verstuur notificatie naar organisatie
    sendNotificationEmail(data);
    
    return ContentService
      .createTextOutput(JSON.stringify({ success: true, message: 'Aanmelding succesvol ontvangen!' }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error:', error);
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, message: 'Er ging iets mis: ' + error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Check of er nog plek is voor een tijdslot
function checkAvailability(vrijwilligerswerk) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Haal aantallen op uit "Aantallen vrijwilligers" sheet
  const aantallenSheet = ss.getSheetByName('Aantallen vrijwilligers');
  if (!aantallenSheet) {
    // Als sheet niet bestaat, sta alles toe
    return { available: true };
  }
  
  // Lees alle data (skip header row)
  const data = aantallenSheet.getRange(2, 1, aantallenSheet.getLastRow() - 1, 2).getValues();
  
  // Zoek het maximum aantal voor dit tijdslot
  let maxAantal = null;
  for (let i = 0; i < data.length; i++) {
    const [plek, aantal] = data[i];
    if (plek && vrijwilligerswerk.includes(plek)) {
      maxAantal = parseInt(aantal);
      break;
    }
  }
  
  // Als geen limiet gevonden, sta toe
  if (maxAantal === null || isNaN(maxAantal)) {
    return { available: true };
  }
  
  // Tel huidige aanmeldingen voor dit tijdslot
  const aanmeldingenSheet = ss.getSheetByName(CONFIG.sheetName);
  if (!aanmeldingenSheet || aanmeldingenSheet.getLastRow() <= 1) {
    // Geen aanmeldingen nog, dus beschikbaar
    return { available: true };
  }
  
  // Tel aanmeldingen (kolom 7 = Vrijwilligerswerk)
  const aanmeldingen = aanmeldingenSheet.getRange(2, 7, aanmeldingenSheet.getLastRow() - 1, 1).getValues();
  let huidigAantal = 0;
  
  for (let i = 0; i < aanmeldingen.length; i++) {
    if (aanmeldingen[i][0] === vrijwilligerswerk) {
      huidigAantal++;
    }
  }
  
  // Check of er nog plek is
  if (huidigAantal >= maxAantal) {
    return {
      available: false,
      message: `Dit tijdslot is helaas vol (${maxAantal}/${maxAantal} plekken bezet). Kies een ander tijdslot.`
    };
  }
  
  return {
    available: true,
    remaining: maxAantal - huidigAantal
  };
}

// Haal alle beschikbaarheden op
function getAllAvailability() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const aantallenSheet = ss.getSheetByName('Aantallen vrijwilligers');
  
  if (!aantallenSheet) {
    return {};
  }
  
  // Lees alle data (skip header row)
  const data = aantallenSheet.getRange(2, 1, aantallenSheet.getLastRow() - 1, 2).getValues();
  const aanmeldingenSheet = ss.getSheetByName(CONFIG.sheetName);
  
  const availability = {};
  
  for (let i = 0; i < data.length; i++) {
    const [plek, maxAantal] = data[i];
    if (!plek) continue;
    
    const max = parseInt(maxAantal);
    if (isNaN(max)) continue;
    
    // Tel huidige aanmeldingen
    let huidigAantal = 0;
    if (aanmeldingenSheet && aanmeldingenSheet.getLastRow() > 1) {
      const aanmeldingen = aanmeldingenSheet.getRange(2, 7, aanmeldingenSheet.getLastRow() - 1, 1).getValues();
      for (let j = 0; j < aanmeldingen.length; j++) {
        if (aanmeldingen[j][0] && aanmeldingen[j][0].includes(plek)) {
          huidigAantal++;
        }
      }
    }
    
    availability[plek] = {
      max: max,
      current: huidigAantal,
      remaining: max - huidigAantal,
      available: huidigAantal < max
    };
  }
  
  return availability;
}

// Sla data op in Google Sheets
function saveToSheet(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(CONFIG.sheetName);
  
  // Maak sheet aan als deze niet bestaat
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.sheetName);
    // Voeg headers toe
    sheet.appendRow([
      'Timestamp',
      'Voornaam',
      'Achternaam',
      'Email',
      'Telefoon',
      'Dieetwensen',
      'Vrijwilligerswerk',
      'Samen met buddy',
      'Buddy naam',
      'Op/Afbouw'
    ]);
    
    // Maak header vet
    sheet.getRange(1, 1, 1, 10).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  
  // Voeg data toe
  const row = sheet.getLastRow() + 1;
  
  // Zorg dat telefoon als tekst wordt opgeslagen
  const telefoonValue = String(data.telefoon);
  
  sheet.appendRow([
    new Date(),
    data.voornaam,
    data.achternaam,
    data.email,
    telefoonValue,
    data.dieetwensen.join(', '),
    data.vrijwilligerswerk,
    data.samenMetBuddy ? 'Ja' : 'Nee',
    data.buddyNaam || '-',
    data.opAfbouw.join(', ')
  ]);
  
  // Formatteer telefoon kolom expliciet als tekst (plain text format)
  const telefoonCell = sheet.getRange(row, 5);
  telefoonCell.setNumberFormat('@STRING@');
  telefoonCell.setValue(telefoonValue);
}

// Verstuur bevestigingsmail naar deelnemer
function sendConfirmationEmail(data) {
  const subject = CONFIG.emailOnderwerp;
  
  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Poppins', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #FDB913; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .header h1 { color: #1a1a1a; margin: 0; font-size: 28px; text-transform: uppercase; }
        .content { background: #f8f8f8; padding: 30px; border-radius: 0 0 10px 10px; }
        .info-box { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #FDB913; }
        .info-label { font-weight: 600; color: #1a1a1a; text-transform: uppercase; font-size: 12px; }
        .info-value { margin-top: 5px; color: #666; }
        .footer { text-align: center; margin-top: 30px; color: #999; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Bedankt voor je aanmelding!</h1>
        </div>
        <div class="content">
          <p>Hoi ${data.voornaam},</p>
          <p>Super dat je wilt helpen bij Kaaspop! We hebben je aanmelding ontvangen.</p>
          
          <div class="info-box">
            <div class="info-label">Jouw gegevens</div>
            <div class="info-value">
              <strong>${data.voornaam} ${data.achternaam}</strong><br>
              ${data.email}<br>
              ${data.telefoon}
            </div>
          </div>
          
          <div class="info-box">
            <div class="info-label">Vrijwilligerswerk</div>
            <div class="info-value">${data.vrijwilligerswerk}</div>
          </div>
          
          ${data.samenMetBuddy ? `
          <div class="info-box">
            <div class="info-label">Buddy</div>
            <div class="info-value">Je werkt samen met: ${data.buddyNaam}</div>
          </div>
          ` : ''}
          
          ${data.opAfbouw.length > 0 && !data.opAfbouw.includes('Nee, dat lukt me niet') ? `
          <div class="info-box">
            <div class="info-label">Op/Afbouw</div>
            <div class="info-value">${data.opAfbouw.join('<br>')}</div>
          </div>
          ` : ''}
          
          <div class="info-box">
            <div class="info-label">Dieetwensen</div>
            <div class="info-value">${data.dieetwensen.join(', ')}</div>
          </div>
          
          <p style="margin-top: 30px;">We nemen binnenkort contact met je op met meer informatie!</p>
          <p>Tot snel bij Kaaspop! 🧀🎵</p>
          
          <div class="footer">
            <p>Vragen? Neem contact op via ${CONFIG.organisatieEmail}</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  
  MailApp.sendEmail({
    to: data.email,
    subject: subject,
    htmlBody: htmlBody,
    name: CONFIG.emailVanNaam,
    from: 'vrijwilligers@kaaspop.nl',
    replyTo: 'vrijwilligers@kaaspop.nl',
    noReply: true
  });
}

// Verstuur notificatie naar organisatie
function sendNotificationEmail(data) {
  const subject = `Nieuwe vrijwilliger aanmelding: ${data.voornaam} ${data.achternaam}`;
  
  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th { background: #FDB913; padding: 10px; text-align: left; font-weight: bold; }
        td { padding: 10px; border-bottom: 1px solid #ddd; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Nieuwe vrijwilliger aanmelding</h2>
        <table>
          <tr><th>Veld</th><th>Waarde</th></tr>
          <tr><td><strong>Naam</strong></td><td>${data.voornaam} ${data.achternaam}</td></tr>
          <tr><td><strong>Email</strong></td><td>${data.email}</td></tr>
          <tr><td><strong>Telefoon</strong></td><td>${data.telefoon}</td></tr>
          <tr><td><strong>Vrijwilligerswerk</strong></td><td>${data.vrijwilligerswerk}</td></tr>
          <tr><td><strong>Buddy</strong></td><td>${data.samenMetBuddy ? 'Ja: ' + data.buddyNaam : 'Nee'}</td></tr>
          <tr><td><strong>Op/Afbouw</strong></td><td>${data.opAfbouw.join(', ')}</td></tr>
          <tr><td><strong>Dieetwensen</strong></td><td>${data.dieetwensen.join(', ')}</td></tr>
        </table>
        <p><a href="${SpreadsheetApp.getActiveSpreadsheet().getUrl()}">Open Google Sheets</a></p>
      </div>
    </body>
    </html>
  `;
  
  MailApp.sendEmail({
    to: CONFIG.organisatieEmail,
    subject: subject,
    htmlBody: htmlBody,
    name: CONFIG.emailVanNaam,
    from: 'thijs@kaaspop.nl',
    replyTo: 'vrijwilligers@kaaspop.nl'
  });
}

// Test functie (optioneel)
function testScript() {
  const testData = {
    voornaam: 'Jan',
    achternaam: 'Jansen',
    email: 'jan@example.com',
    telefoon: '0612345678',
    dieetwensen: ['Vegetarisch'],
    vrijwilligerswerk: 'Kaasmarkt: 13:30-18:00',
    samenMetBuddy: true,
    buddyNaam: 'Piet Pietersen',
    opAfbouw: ['Vrijdag opbouw (met pizza) 18:00-22:00']
  };
  
  saveToSheet(testData);
  sendConfirmationEmail(testData);
  sendNotificationEmail(testData);
  console.log('Test succesvol!');
}

// Test alleen notificatie email
function testNotificationEmail() {
  const testData = {
    voornaam: 'Test',
    achternaam: 'Notificatie',
    email: 'test@example.com',
    telefoon: '0612345678',
    dieetwensen: ['Vegetarisch'],
    vrijwilligerswerk: 'Kaasmarkt: 13:30-18:00',
    samenMetBuddy: false,
    buddyNaam: null,
    opAfbouw: ['Vrijdag opbouw (met pizza) 18:00-22:00']
  };
  
  console.log('Sending notification to:', CONFIG.organisatieEmail);
  sendNotificationEmail(testData);
  console.log('Notification sent!');
}
