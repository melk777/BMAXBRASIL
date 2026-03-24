/**
 * BMAX BRASIL — Webhook para planilha de leads (Lista VIP)
 *
 * Como usar:
 * 1. Abra a planilha do Google Sheets → Extensões → Apps Script.
 * 2. Cole este arquivo (substitua o conteúdo padrão).
 * 3. Salve. Na primeira execução, rode manualmente setupLeadsSheet() uma vez
 *    (selecione a função no menu e clique em Executar) para criar a aba e o cabeçalho.
 * 4. Implantar → Nova implantação → Tipo: App da Web
 *    - Executar como: Eu
 *    - Quem pode acessar: Qualquer pessoa
 * 5. Copie a URL do Web App e cole em window.BMAX_CONFIG.sheetsWebhookUrl no index.html
 *
 * O site envia POST com Content-Type: text/plain e corpo JSON:
 * { "name", "email", "whatsapp", "source" }
 */

var LEADS_SHEET_NAME = 'Leads VIP';

function setupLeadsSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(LEADS_SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(LEADS_SHEET_NAME);
  }
  if (sh.getLastRow() === 0) {
    sh.appendRow(['Data/Hora', 'Nome', 'E-mail', 'WhatsApp', 'Fonte']);
    sh.setFrozenRows(1);
  }
  return sh;
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function normalizeEmail(email) {
  return String(email || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');
}

function findEmailRow(sheet, emailNorm) {
  var last = sheet.getLastRow();
  if (last < 2) return -1;
  // Coluna C = e-mail (índice 3)
  var range = sheet.getRange(2, 3, last, 3);
  var values = range.getValues();
  for (var i = 0; i < values.length; i++) {
    if (normalizeEmail(values[i][0]) === emailNorm) {
      return i + 2;
    }
  }
  return -1;
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ ok: false, error: 'Corpo vazio' });
    }

    var body;
    try {
      body = JSON.parse(e.postData.contents);
    } catch (parseErr) {
      return jsonResponse({ ok: false, error: 'JSON inválido' });
    }

    var name = String(body.name || '').trim();
    var email = String(body.email || '').trim();
    var whatsapp = String(body.whatsapp || '').trim();
    var source = String(body.source || 'landing').trim();

    if (!name || !email || !whatsapp) {
      return jsonResponse({ ok: false, error: 'Preencha nome, e-mail e WhatsApp.' });
    }

    var emailNorm = normalizeEmail(email);
    if (emailNorm.indexOf('@') === -1) {
      return jsonResponse({ ok: false, error: 'E-mail inválido.' });
    }

    var sheet = setupLeadsSheet();
    if (findEmailRow(sheet, emailNorm) !== -1) {
      return jsonResponse({
        ok: true,
        duplicate: true,
        message: 'Este e-mail já está na lista VIP.'
      });
    }

    sheet.appendRow([
      new Date(),
      name,
      email,
      whatsapp,
      source
    ]);

    return jsonResponse({ ok: true, duplicate: false });
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err.message || err) });
  }
}

/** Opcional: teste rápido na barra do navegador após implantar */
function doGet() {
  return ContentService.createTextOutput('BMAX leads webhook ativo. Use POST com JSON.');
}
