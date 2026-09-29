# Tempahan Lencana Pengakap

Borang tempahan lencana untuk sekolah di bawah Pengakap Daerah Kinta Utara. Borang yang sama boleh digunakan berulang kali: setiap lencana baru hanya perlu ditambah sebagai satu baris dalam Google Sheet.

Guru mengisi:

1. Nama sekolah
2. Nama pemimpin
3. No. telefon pemimpin
4. Bilangan lencana (jumlah bayaran dikira automatik)
5. Resit bayaran (selepas pindahan ke akaun di bawah)

| | |
|---|---|
| Nama akaun | PERSEKUTUAN PENGAKAP MALAYSIA DAERAH KINTA UTARA |
| No. akaun | 558172816191 |
| Bank | MAYBANK |

Selepas tempahan berjaya, guru menerima nombor rujukan (contoh `AKPN26-0001`).

## Struktur fail

| Fail | Kegunaan |
|---|---|
| `index.html`, `style.css`, `script.js` | Laman borang |
| `config.js` | URL backend dan maklumat akaun bank |
| `apps-script/Code.gs` | Backend Google Apps Script |
| `apps-script/appsscript.json` | Tetapan Apps Script (zon waktu Malaysia) |
| `assets/` | Gambar lencana |

## Cara pasang (sekali sahaja)

### 1. Pasang backend (Google Sheet + Apps Script)

1. Buka [sheets.new](https://sheets.new) untuk cipta Google Sheet baru, contohnya "Tempahan Lencana".
2. Menu **Extensions → Apps Script**.
3. Padam kod sedia ada, tampal seluruh kandungan `apps-script/Code.gs`, dan simpan.
4. (Pilihan) Isi `EMEL_ADMIN` dengan emel anda untuk dapat notifikasi setiap tempahan.
5. Pilih fungsi `setup` di bar atas, tekan **Run**, dan benarkan akses (Sheet, Drive).
   Ini akan mencipta:
   - Tab **Senarai Lencana**, yang sudah berisi lencana AKPN 2026 (RM 5.00, tutup 2/10/2026 jam 11:00 malam)
   - Tab **Tempahan**
   - Folder Drive **Resit Tempahan Lencana**
6. **Deploy → New deployment** → jenis **Web app**:
   - Execute as: **Me**
   - Who has access: **Anyone**
7. Salin **Web app URL** (berakhir dengan `/exec`).

### 2. Sambungkan borang

Buka `config.js` dan isi `SCRIPT_URL` dengan URL tadi:

```js
SCRIPT_URL: "https://script.google.com/macros/s/XXXX/exec",
```

### 3. Terbitkan laman (GitHub Pages)

Repo **Settings → Pages** → Source: *Deploy from a branch* → pilih branch dan folder `/ (root)`.
Pautan borang akan jadi `https://<username>.github.io/tempahanlencana/`.

## Tambah tempahan lencana baru

Tiada kod perlu diubah. Cuma tambah satu baris dalam tab **Senarai Lencana**:

| Lajur | Contoh | Nota |
|---|---|---|
| ID | `HPN26` | Pendek, tiada ruang. Digunakan untuk no. rujukan (`HPN26-0001`) dan pautan terus. |
| Nama Lencana | Hari Pengakap Negara 2026 | |
| Keterangan | Semua unit | Pilihan |
| Harga (RM) | 5 | Harga seunit |
| Tarikh Akhir | 15/11/2026 11:00 PM | Borang tutup automatik selepas masa ini (waktu Malaysia) |
| Gambar | `assets/hpn26.jpg` | Letak gambar dalam folder `assets/` repo ini, atau guna pautan penuh `https://...` |
| Aktif | YA | Tukar kepada `TIDAK` untuk sembunyikan lencana lama dari borang |

Bagaimana borang memaparkannya:

- **Satu lencana aktif**: borang terus dibuka untuk lencana itu.
- **Lebih daripada satu**: guru memilih lencana dahulu. Lencana yang sudah tamat tarikh akhir dipaparkan sebagai "Ditutup".
- **Pautan terus** ke satu lencana: `https://<username>.github.io/tempahanlencana/?lencana=HPN26`, sesuai untuk dikongsi dalam WhatsApp.

## Semakan tempahan

Semua tempahan (semua lencana) ada dalam tab **Tempahan**:

`No. Rujukan | Tarikh & Masa | ID Lencana | Nama Lencana | Nama Sekolah | Nama Pemimpin | No. Telefon | Bilangan | Harga Seunit (RM) | Jumlah (RM) | Pautan Resit`

Guna **Data → Create a filter** dan tapis lajur *ID Lencana* untuk melihat tempahan satu lencana sahaja.
Resit disimpan dalam subfolder mengikut lencana di dalam folder **Resit Tempahan Lencana**.

> Jika anda mengubah `Code.gs` selepas deploy, buat **Deploy → Manage deployments → Edit → Version: New version** supaya perubahan berkuat kuasa. Menambah baris dalam Sheet tidak memerlukan deploy semula.
