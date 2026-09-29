/**
 * Backend borang tempahan lencana AKPN 2026 (Google Apps Script).
 *
 * - Simpan setiap tempahan ke Google Sheet (tab "Tempahan").
 * - Simpan resit bayaran ke folder Google Drive.
 * - Tolak tempahan selepas tarikh akhir (2/10/2026, 11:00 malam).
 *
 * Cara pasang: lihat README.md.
 */

// ====== TETAPAN ======
var SHEET_NAME = 'Tempahan';
var FOLDER_NAME = 'Resit Tempahan Lencana AKPN 2026';
var TARIKH_AKHIR = new Date('2026-10-02T23:00:00+08:00');
var SAIZ_RESIT_MAKS_MB = 5;
var PREFIX_RUJUKAN = 'AKPN';
// Emel untuk notifikasi setiap tempahan baru. Biarkan '' untuk tidak menghantar emel.
var EMEL_ADMIN = '';
// =====================

var HEADERS = [
  'No. Rujukan', 'Tarikh & Masa', 'Nama Sekolah', 'Nama Pemimpin',
  'No. Telefon', 'Bilangan', 'Pautan Resit',
];

function doGet() {
  return json_({ ok: true, dibuka: new Date() <= TARIKH_AKHIR });
}

function doPost(e) {
  try {
    if (new Date() > TARIKH_AKHIR) {
      return json_({ ok: false, error: 'Tempahan telah ditutup (tarikh akhir 2 Oktober 2026, 11:00 malam).' });
    }

    var d = JSON.parse(e.postData.contents);
    var sekolah = clean_(d.sekolah, 150);
    var pemimpin = clean_(d.pemimpin, 120);
    var telefon = String(d.telefon || '').replace(/\D/g, '');
    var bilangan = Number(d.bilangan);

    if (sekolah.length < 3) return json_({ ok: false, error: 'Nama sekolah tidak sah.' });
    if (pemimpin.length < 3) return json_({ ok: false, error: 'Nama pemimpin tidak sah.' });
    if (!/^01\d{8,9}$/.test(telefon)) return json_({ ok: false, error: 'No. telefon tidak sah.' });
    if (!(bilangan >= 1 && bilangan <= 1000 && Math.floor(bilangan) === bilangan)) {
      return json_({ ok: false, error: 'Bilangan lencana tidak sah.' });
    }

    var r = d.resit || {};
    var jenis = String(r.jenis || '');
    if (!r.data || !/^image\/|^application\/pdf$/.test(jenis)) {
      return json_({ ok: false, error: 'Resit mesti gambar atau PDF.' });
    }
    var bytes = Utilities.base64Decode(r.data);
    if (bytes.length > SAIZ_RESIT_MAKS_MB * 1024 * 1024) {
      return json_({ ok: false, error: 'Saiz resit melebihi ' + SAIZ_RESIT_MAKS_MB + ' MB.' });
    }

    var lock = LockService.getScriptLock();
    lock.waitLock(30000);
    try {
      var sheet = getSheet_();
      var id = PREFIX_RUJUKAN + '-' + ('0000' + sheet.getLastRow()).slice(-4);
      var masa = new Date();

      var ext = (String(r.nama || '').match(/\.[A-Za-z0-9]{1,5}$/) || [''])[0];
      var namaFail = id + ' - ' + sekolah.replace(/[\\\/:*?"<>|]/g, '') + ext;
      var fail = getFolder_().createFile(Utilities.newBlob(bytes, jenis, namaFail));

      // Awalan ' supaya nombor telefon kekal bermula dengan 0 dalam Sheet.
      sheet.appendRow([id, masa, sekolah, pemimpin, "'" + telefon, bilangan, fail.getUrl()]);
      SpreadsheetApp.flush();
    } finally {
      lock.releaseLock();
    }

    if (EMEL_ADMIN) {
      MailApp.sendEmail(EMEL_ADMIN, 'Tempahan lencana baru: ' + id + ' (' + sekolah + ')',
        'No. Rujukan: ' + id + '\nSekolah: ' + sekolah + '\nPemimpin: ' + pemimpin +
        '\nTelefon: ' + telefon + '\nBilangan: ' + bilangan + '\nResit: ' + fail.getUrl());
    }

    return json_({ ok: true, id: id, sekolah: sekolah, pemimpin: pemimpin, telefon: telefon, bilangan: bilangan });
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: 'Ralat pelayan. Sila cuba lagi sebentar.' });
  }
}

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function getFolder_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('FOLDER_ID');
  if (id) {
    try { return DriveApp.getFolderById(id); } catch (e) { /* folder dipadam, cipta semula */ }
  }
  var folder = DriveApp.createFolder(FOLDER_NAME);
  props.setProperty('FOLDER_ID', folder.getId());
  return folder;
}

function clean_(v, max) {
  return String(v || '').replace(/\s+/g, ' ').trim().slice(0, max);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/** Jalankan sekali dari editor untuk memberi kebenaran (Sheet, Drive, Mail). */
function setup() {
  getSheet_();
  getFolder_();
}
