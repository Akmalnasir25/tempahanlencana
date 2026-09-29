// Tetapan borang tempahan lencana.
// Ubah nilai di bawah mengikut keperluan, kemudian simpan.
window.CONFIG = {
  // URL Web App Google Apps Script (lihat README.md, langkah "Pasang backend").
  // Contoh: "https://script.google.com/macros/s/AKfycb.../exec"
  SCRIPT_URL: "",

  // Harga seunit lencana (RM). Letak 0 jika tidak mahu paparkan jumlah bayaran.
  HARGA_SEUNIT: 0,

  // Tarikh akhir tempahan: 2 Oktober 2026, jam 11:00 malam (waktu Malaysia).
  TARIKH_AKHIR: "2026-10-02T23:00:00+08:00",

  // Maklumat akaun bank untuk bayaran.
  BANK: {
    nama: "PERSEKUTUAN PENGAKAP MALAYSIA DAERAH KINTA UTARA",
    noAkaun: "558172816191",
    bank: "MAYBANK",
  },

  // Saiz maksimum fail resit (MB).
  SAIZ_RESIT_MAKS_MB: 5,
};
