// Tetapan borang tempahan lencana.
// Senarai lencana, harga dan tarikh akhir diurus dalam Google Sheet
// (tab "Senarai Lencana"), bukan di sini. Lihat README.md.
window.CONFIG = {
  // URL Web App Google Apps Script (lihat README.md, langkah "Pasang backend").
  // Contoh: "https://script.google.com/macros/s/AKfycb.../exec"
  SCRIPT_URL: "",

  // Maklumat akaun bank untuk bayaran.
  BANK: {
    nama: "PERSEKUTUAN PENGAKAP MALAYSIA DAERAH KINTA UTARA",
    noAkaun: "558172816191",
    bank: "MAYBANK",
  },

  // Saiz maksimum fail resit (MB).
  SAIZ_RESIT_MAKS_MB: 5,
};
