# Tempahan Lencana AKPN 2026

Borang tempahan lencana **Anugerah Ketua Pengakap Negara 2026** (Rambu Pengakap Kanak-kanak) untuk sekolah di bawah Pengakap Daerah Kinta Utara.

Guru mengisi:

1. Nama sekolah
2. Nama pemimpin
3. No. telefon pemimpin
4. Bilangan lencana
5. Resit bayaran (selepas pindahan ke akaun di bawah)

| | |
|---|---|
| Nama akaun | PERSEKUTUAN PENGAKAP MALAYSIA DAERAH KINTA UTARA |
| No. akaun | 558172816191 |
| Bank | MAYBANK |

**Tarikh akhir:** 2 Oktober 2026, jam 11:00 malam. Borang akan ditutup secara automatik (di laman web dan di backend).

Semua tempahan disimpan dalam Google Sheet, dan resit disimpan dalam folder Google Drive.

## Struktur fail

| Fail | Kegunaan |
|---|---|
| `index.html`, `style.css`, `script.js` | Laman borang |
| `config.js` | Tetapan (URL backend, harga, akaun bank, tarikh akhir) |
| `apps-script/Code.gs` | Backend Google Apps Script |
| `assets/lencana.jpg` | Gambar lencana |

## Cara pasang

### 1. Pasang backend (Google Sheet + Apps Script)

1. Buka [sheets.new](https://sheets.new) untuk cipta Google Sheet baru, contohnya "Tempahan Lencana AKPN 2026".
2. Menu **Extensions → Apps Script**.
3. Padam kod sedia ada, tampal seluruh kandungan `apps-script/Code.gs`, dan simpan.
4. (Pilihan) Isi `EMEL_ADMIN` dengan emel anda untuk dapat notifikasi setiap tempahan.
5. Pilih fungsi `setup` di bar atas, tekan **Run**, dan benarkan akses (Sheet, Drive).
   Tab "Tempahan" dan folder Drive "Resit Tempahan Lencana AKPN 2026" akan dicipta.
6. **Deploy → New deployment** → jenis **Web app**:
   - Execute as: **Me**
   - Who has access: **Anyone**
7. Salin **Web app URL** (berakhir dengan `/exec`).

### 2. Sambungkan borang

Buka `config.js` dan isi:

```js
SCRIPT_URL: "https://script.google.com/macros/s/XXXX/exec",
HARGA_SEUNIT: 0,   // tukar kepada harga seunit (RM) untuk paparkan jumlah bayaran
```

### 3. Terbitkan laman (GitHub Pages)

Repo **Settings → Pages** → Source: *Deploy from a branch* → pilih branch dan folder `/ (root)`.
Pautan borang akan jadi `https://<username>.github.io/tempahanlencana/`.

> Jika anda mengubah `Code.gs` selepas deploy, buat **Deploy → Manage deployments → Edit → Version: New version** supaya perubahan berkuat kuasa.

## Semakan tempahan

Semua tempahan ada dalam tab **Tempahan** di Google Sheet:

`No. Rujukan | Tarikh & Masa | Nama Sekolah | Nama Pemimpin | No. Telefon | Bilangan | Pautan Resit`

Guru akan menerima nombor rujukan (contoh `AKPN-0001`) selepas tempahan berjaya.
