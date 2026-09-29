/**
 * Borang tempahan lencana (Google Apps Script web app).
 *
 * - Borang dipaparkan terus oleh Apps Script (Index.html).
 * - Senarai lencana diurus dalam tab "Senarai Lencana". Untuk buka tempahan
 *   lencana baru, tambah satu baris di situ — tiada kod perlu diubah.
 * - Setiap tempahan disimpan dalam tab "Tempahan".
 * - Resit disimpan dalam folder Google Drive (satu subfolder bagi setiap lencana).
 * - Tempahan ditolak selepas tarikh akhir lencana tersebut.
 *
 * Cara pasang: lihat README.md.
 */

// ====== TETAPAN ======
var BANK = {
  nama: 'PERSEKUTUAN PENGAKAP MALAYSIA DAERAH KINTA UTARA',
  noAkaun: '558172816191',
  bank: 'MAYBANK',
  // Ref 1 = ID lencana dipilih, Ref 2 = nama sekolah (kedua-duanya diisi automatik di borang).
};
var SHEET_LENCANA = 'Senarai Lencana';
var SHEET_TEMPAHAN = 'Tempahan';
var FOLDER_NAME = 'Resit Tempahan Lencana';
var SAIZ_RESIT_MAKS_MB = 5;
// Emel untuk notifikasi setiap tempahan baru. Biarkan '' untuk tidak menghantar emel.
var EMEL_ADMIN = '';
// =====================

var HEADERS_LENCANA = ['ID', 'Nama Lencana', 'Keterangan', 'Harga (RM)', 'Tarikh Akhir', 'Gambar', 'Aktif'];
var HEADERS_TEMPAHAN = [
  'No. Rujukan', 'Tarikh & Masa', 'ID Lencana', 'Nama Lencana', 'Nama Sekolah',
  'Nama Pemimpin', 'No. Telefon', 'Bilangan', 'Harga Seunit (RM)', 'Jumlah (RM)', 'Pautan Resit',
];

// Lencana pertama yang dimasukkan semasa setup(). Isi lajur Gambar dengan pautan Drive kemudian.
var CONTOH_LENCANA = [
  'AKPN26', 'Anugerah Ketua Pengakap Negara 2026', 'Rambu Pengakap Kanak-kanak',
  5, new Date('2026-10-02T23:00:00+08:00'), '', 'YA',
];

/** Paparkan borang, atau paparan admin jika URL berakhir dengan ?admin */
function doGet(e) {
  if (e && e.parameter && e.parameter.admin !== undefined) {
    var t = HtmlService.createTemplateFromFile('Admin');
    t.mode = 'tempahan';
    return t.evaluate()
      .setTitle('Admin Tempahan Lencana')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Tempahan Lencana Pengakap')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/** Dipanggil oleh borang: maklumat bank dan senarai lencana aktif. */
function getData() {
  try {
    var now = new Date();
    var list = getLencana_().filter(function (l) { return l.aktif; }).map(function (l) {
      return {
        id: l.id, nama: l.nama, keterangan: l.keterangan, harga: l.harga,
        tarikhAkhir: l.tarikhAkhir.toISOString(), gambar: gambarSrc_(l.gambar),
        dibuka: now <= l.tarikhAkhir,
      };
    });
    return { ok: true, bank: BANK, saizResitMaksMB: SAIZ_RESIT_MAKS_MB, lencana: list };
  } catch (err) {
    console.error(err);
    return { ok: false, error: 'Gagal memuatkan senarai lencana.' };
  }
}

/** Dipanggil oleh borang: terima tempahan baru. */
function hantarTempahan(d) {
  try {
    d = d || {};
    var lencana = getLencana_().filter(function (l) { return l.aktif && l.id === String(d.lencanaId); })[0];
    if (!lencana) return { ok: false, error: 'Lencana tidak dijumpai atau tidak lagi dibuka.' };
    if (new Date() > lencana.tarikhAkhir) {
      return { ok: false, error: 'Tempahan untuk lencana ini telah ditutup.' };
    }

    var sekolah = clean_(d.sekolah, 150);
    var pemimpin = clean_(d.pemimpin, 120);
    var telefon = String(d.telefon || '').replace(/\D/g, '');
    var bilangan = Number(d.bilangan);

    if (sekolah.length < 3) return { ok: false, error: 'Nama sekolah tidak sah.' };
    if (pemimpin.length < 3) return { ok: false, error: 'Nama pemimpin tidak sah.' };
    if (!/^01\d{8,9}$/.test(telefon)) return { ok: false, error: 'No. telefon tidak sah.' };
    if (!(bilangan >= 1 && bilangan <= 1000 && Math.floor(bilangan) === bilangan)) {
      return { ok: false, error: 'Bilangan lencana tidak sah.' };
    }

    var r = d.resit || {};
    var jenis = String(r.jenis || '');
    if (!r.data || !/^image\/|^application\/pdf$/.test(jenis)) {
      return { ok: false, error: 'Resit mesti gambar atau PDF.' };
    }
    var bytes = Utilities.base64Decode(r.data);
    if (bytes.length > SAIZ_RESIT_MAKS_MB * 1024 * 1024) {
      return { ok: false, error: 'Saiz resit melebihi ' + SAIZ_RESIT_MAKS_MB + ' MB.' };
    }

    var jumlah = Math.round(bilangan * lencana.harga * 100) / 100;
    var id, fail;

    var lock = LockService.getScriptLock();
    lock.waitLock(30000);
    try {
      id = nextRujukan_(lencana.id);

      var ext = (String(r.nama || '').match(/\.[A-Za-z0-9]{1,5}$/) || [''])[0];
      var namaFail = id + ' - ' + sekolah.replace(/[\\\/:*?"<>|]/g, '') + ext;
      fail = getFolder_(lencana).createFile(Utilities.newBlob(bytes, jenis, namaFail));

      // Awalan ' supaya nombor telefon kekal bermula dengan 0 dalam Sheet.
      getTempahanSheet_().appendRow([
        id, new Date(), lencana.id, lencana.nama, sekolah, pemimpin, "'" + telefon,
        bilangan, lencana.harga, jumlah, fail.getUrl(),
      ]);
      SpreadsheetApp.flush();
    } finally {
      lock.releaseLock();
    }

    if (EMEL_ADMIN) {
      MailApp.sendEmail(EMEL_ADMIN, 'Tempahan lencana baru: ' + id + ' (' + sekolah + ')',
        'No. Rujukan: ' + id + '\nLencana: ' + lencana.nama + '\nSekolah: ' + sekolah +
        '\nPemimpin: ' + pemimpin + '\nTelefon: ' + telefon + '\nBilangan: ' + bilangan +
        '\nJumlah: RM ' + jumlah.toFixed(2) + '\nResit: ' + fail.getUrl());
    }

    return {
      ok: true, id: id, lencana: lencana.nama, sekolah: sekolah, pemimpin: pemimpin,
      telefon: telefon, bilangan: bilangan, jumlah: jumlah,
    };
  } catch (err) {
    console.error(err);
    return { ok: false, error: 'Ralat pelayan. Sila cuba lagi sebentar.' };
  }
}

/** Baca tab "Senarai Lencana" dan pulangkan baris yang lengkap. */
function getLencana_() {
  var sheet = getLencanaSheet_();
  if (sheet.getLastRow() < 2) return [];
  return sheet.getRange(2, 1, sheet.getLastRow() - 1, HEADERS_LENCANA.length).getValues()
    .map(function (row) {
      return {
        id: String(row[0]).trim(),
        nama: String(row[1]).trim(),
        keterangan: String(row[2]).trim(),
        harga: Number(row[3]),
        tarikhAkhir: row[4] instanceof Date ? row[4] : new Date(row[4]),
        gambar: String(row[5]).trim(),
        aktif: /^(ya|y|yes|true|1)$/i.test(String(row[6]).trim()),
      };
    })
    .filter(function (l) {
      return l.id && l.nama && l.harga > 0 && !isNaN(l.tarikhAkhir.getTime());
    });
}

/**
 * Lajur Gambar boleh diisi dengan pautan fail Google Drive (atau ID fail),
 * atau pautan gambar biasa (https://...). Gambar Drive dihantar sebagai data URI
 * supaya tidak perlu dikongsi secara umum.
 */
function gambarSrc_(v) {
  if (!v) return '';
  var m = v.match(/\/d\/([\w-]{20,})/) || v.match(/[?&]id=([\w-]{20,})/) || v.match(/^([\w-]{20,})$/);
  if (!m) return /^https?:\/\//.test(v) ? v : '';
  try {
    var blob = DriveApp.getFileById(m[1]).getBlob();
    return 'data:' + blob.getContentType() + ';base64,' + Utilities.base64Encode(blob.getBytes());
  } catch (e) {
    console.warn('Gambar tidak dapat dibaca: ' + v);
    return '';
  }
}

/** No. rujukan berjujukan bagi setiap lencana, cth. AKPN26-0001. Mesti dipanggil dalam lock. */
function nextRujukan_(lencanaId) {
  var props = PropertiesService.getScriptProperties();
  var key = 'SEQ_' + lencanaId;
  var n = Number(props.getProperty(key) || 0) + 1;
  props.setProperty(key, String(n));
  return lencanaId + '-' + ('0000' + n).slice(-4);
}

function getLencanaSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_LENCANA);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_LENCANA, 0);
    sheet.appendRow(HEADERS_LENCANA);
    sheet.appendRow(CONTOH_LENCANA);
    styleHeader_(sheet, HEADERS_LENCANA.length);
    sheet.getRange('D:D').setNumberFormat('0.00');
    sheet.getRange('E:E').setNumberFormat('d/m/yyyy h:mm am/pm');
    sheet.getRange('G2:G').setDataValidation(
      SpreadsheetApp.newDataValidation().requireValueInList(['YA', 'TIDAK']).build());
  }
  return sheet;
}

function getTempahanSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_TEMPAHAN);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_TEMPAHAN);
    sheet.appendRow(HEADERS_TEMPAHAN);
    styleHeader_(sheet, HEADERS_TEMPAHAN.length);
    sheet.getRange('B:B').setNumberFormat('d/m/yyyy h:mm am/pm');
    sheet.getRange('I:J').setNumberFormat('0.00');
  }
  return sheet;
}

/** Folder resit utama, dengan subfolder bagi setiap lencana. */
function getFolder_(lencana) {
  var props = PropertiesService.getScriptProperties();
  var root = null;
  var rootId = props.getProperty('FOLDER_ID');
  if (rootId) {
    try { root = DriveApp.getFolderById(rootId); } catch (e) { /* folder dipadam, cipta semula */ }
  }
  if (!root) {
    root = DriveApp.createFolder(FOLDER_NAME);
    props.setProperty('FOLDER_ID', root.getId());
  }
  if (!lencana) return root;

  var name = lencana.id + ' - ' + lencana.nama;
  var it = root.getFoldersByName(name);
  return it.hasNext() ? it.next() : root.createFolder(name);
}

function styleHeader_(sheet, n) {
  sheet.getRange(1, 1, 1, n).setFontWeight('bold').setBackground('#13288a').setFontColor('#ffffff');
  sheet.setFrozenRows(1);
}

function clean_(v, max) {
  return String(v || '').replace(/\s+/g, ' ').trim().slice(0, max);
}

/** Jalankan sekali dari editor untuk cipta tab/folder dan memberi kebenaran. */
function setup() {
  pastikanAdmin_();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.setSpreadsheetTimeZone('Asia/Kuala_Lumpur');
  // Format tarikh hari/bulan/tahun supaya 2/10/2026 dibaca sebagai 2 Oktober.
  ss.setSpreadsheetLocale('en_GB');
  getLencanaSheet_();
  getTempahanSheet_();
  getFolder_();
}

// =====================================================================
// Menu "Lencana" dalam Google Sheet (untuk admin sahaja)
// =====================================================================

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Lencana')
    .addItem('Paparan admin (senarai tempahan)', 'menuPaparanAdmin')
    .addItem('Tambah lencana baru', 'menuTambahLencana')
    .addItem('Tukar / muat naik gambar lencana', 'menuTukarGambar')
    .addToUi();
}

function menuPaparanAdmin() { bukaAdmin_('tempahan', 'Paparan admin'); }
function menuTambahLencana() { bukaAdmin_('tambah', 'Tambah lencana baru'); }
function menuTukarGambar() { bukaAdmin_('gambar', 'Tukar / muat naik gambar lencana'); }

function bukaAdmin_(mode, tajuk) {
  var t = HtmlService.createTemplateFromFile('Admin');
  t.mode = mode;
  var html = t.evaluate().setWidth(mode === 'tempahan' ? 1000 : 480).setHeight(680);
  SpreadsheetApp.getUi().showModelessDialog(html, tajuk);
}

/** Dipanggil oleh dialog admin: senarai semua lencana dalam Sheet. */
function adminSenarai() {
  pastikanAdmin_();
  var sheet = getLencanaSheet_();
  if (sheet.getLastRow() < 2) return [];
  return sheet.getRange(2, 1, sheet.getLastRow() - 1, 2).getValues()
    .filter(function (r) { return String(r[0]).trim(); })
    .map(function (r) { return { id: String(r[0]).trim(), nama: String(r[1]).trim() }; });
}

/** Dipanggil oleh paparan admin: semua lencana dan tempahan. */
function adminTempahan() {
  pastikanAdmin_();
  var lencana = getLencana_().map(function (l) {
    return { id: l.id, nama: l.nama, harga: l.harga, tarikhAkhir: l.tarikhAkhir.toISOString(), aktif: l.aktif };
  });
  var sheet = getTempahanSheet_();
  var tempahan = sheet.getLastRow() < 2 ? [] :
    sheet.getRange(2, 1, sheet.getLastRow() - 1, HEADERS_TEMPAHAN.length).getValues()
      .filter(function (r) { return r[0]; })
      .map(function (r) {
        return {
          rujukan: String(r[0]), masa: r[1] instanceof Date ? r[1].toISOString() : String(r[1]),
          lencanaId: String(r[2]), lencana: String(r[3]), sekolah: String(r[4]), pemimpin: String(r[5]),
          telefon: String(r[6]), bilangan: Number(r[7]) || 0, jumlah: Number(r[9]) || 0, resit: String(r[10]),
        };
      });
  return { lencana: lencana, tempahan: tempahan, sheetUrl: SpreadsheetApp.getActiveSpreadsheet().getUrl() };
}

/** Dipanggil oleh dialog admin: tambah satu baris lencana baru. */
function tambahLencana(d) {
  pastikanAdmin_();
  var id = String(d.id || '').trim().toUpperCase();
  var nama = clean_(d.nama, 150);
  var keterangan = clean_(d.keterangan, 200);
  var harga = Math.round(Number(d.harga) * 100) / 100;
  var tarikhAkhir = new Date(d.tarikh + 'T' + d.masa + ':00+08:00');

  if (!/^[A-Z0-9]{2,15}$/.test(id)) throw new Error('ID mesti 2-15 huruf/nombor tanpa ruang.');
  if (nama.length < 3) throw new Error('Sila masukkan nama lencana.');
  if (!(harga > 0)) throw new Error('Harga tidak sah.');
  if (isNaN(tarikhAkhir.getTime())) throw new Error('Tarikh akhir tidak sah.');
  if (!d.gambar) throw new Error('Sila pilih gambar lencana.');

  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var ada = adminSenarai().some(function (l) { return l.id.toUpperCase() === id; });
    if (ada) throw new Error('ID "' + id + '" sudah digunakan. Sila guna ID lain.');
    var url = simpanGambar_(id, d.gambar);
    getLencanaSheet_().appendRow([id, nama, keterangan, harga, tarikhAkhir, url, 'YA']);
  } finally {
    lock.releaseLock();
  }
  return { id: id, nama: nama };
}

/** Dipanggil oleh dialog admin: tukar gambar bagi lencana sedia ada. */
function tukarGambar(id, gambar) {
  pastikanAdmin_();
  if (!gambar) throw new Error('Sila pilih gambar lencana.');
  var sheet = getLencanaSheet_();
  var ids = sheet.getRange(2, 1, Math.max(sheet.getLastRow() - 1, 1), 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]).trim() === id) {
      sheet.getRange(i + 2, 6).setValue(simpanGambar_(id, gambar));
      return { id: id };
    }
  }
  throw new Error('Lencana "' + id + '" tidak dijumpai.');
}

/** Simpan gambar lencana ke folder Drive "Gambar Lencana" dan pulangkan pautannya. */
function simpanGambar_(id, g) {
  var jenis = String(g.jenis || '');
  if (!/^image\//.test(jenis) || !g.data) throw new Error('Fail mesti gambar.');
  var bytes = Utilities.base64Decode(g.data);
  if (bytes.length > 2 * 1024 * 1024) throw new Error('Saiz gambar melebihi 2 MB.');

  var root = getFolder_();
  var it = root.getFoldersByName('Gambar Lencana');
  var folder = it.hasNext() ? it.next() : root.createFolder('Gambar Lencana');
  var ext = jenis === 'image/png' ? '.png' : '.jpg';
  return folder.createFile(Utilities.newBlob(bytes, jenis, id + ext)).getUrl();
}

/**
 * Fungsi admin hanya boleh digunakan oleh editor Sheet ini.
 * (Pengguna borang awam tidak log masuk, jadi emel mereka kosong.)
 */
function pastikanAdmin_() {
  var email = Session.getActiveUser().getEmail();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ok = !!email && (email === Session.getEffectiveUser().getEmail() ||
    ss.getEditors().some(function (u) { return u.getEmail() === email; }));
  if (!ok) throw new Error('Tiada kebenaran.');
}
