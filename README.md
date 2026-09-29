# Tempahan Lencana Pengakap

Borang tempahan lencana untuk sekolah di bawah Pengakap Daerah Kinta Utara, dideploy terus sebagai **Google Apps Script web app**. Borang yang sama boleh digunakan berulang kali: setiap lencana baru hanya perlu ditambah sebagai satu baris dalam Google Sheet.

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
| `apps-script/Code.gs` | Kod pelayan: paparkan borang, simpan tempahan, akaun bank |
| `apps-script/Index.html` | Borang (HTML, CSS, JS dalam satu fail) |
| `apps-script/appsscript.json` | Tetapan projek (zon waktu Malaysia) |
| `assets/lencana.jpg` | Gambar lencana AKPN 2026, untuk dimuat naik ke Google Drive |

## Cara deploy (sekali sahaja)

1. Buka [sheets.new](https://sheets.new) untuk cipta Google Sheet baru, contohnya "Tempahan Lencana".
2. Menu **Extensions → Apps Script**.
3. Dalam fail `Code.gs`, padam kod sedia ada dan tampal seluruh kandungan `apps-script/Code.gs`.
4. Tekan **+** (sebelah *Files*) → **HTML**, namakan fail `Index` (tepat begitu), dan tampal seluruh kandungan `apps-script/Index.html`.
5. Tekan **Save**.
6. Pilih fungsi `setup` di bar atas, tekan **Run**, dan benarkan akses (Sheet, Drive).
   Ini akan mencipta:
   - Tab **Senarai Lencana**, yang sudah berisi lencana AKPN 2026 (RM 5.00, tutup 2/10/2026 jam 11:00 malam)
   - Tab **Tempahan**
   - Folder Drive **Resit Tempahan Lencana**
7. Gambar lencana:
   1. Muat naik `assets/lencana.jpg` ke Google Drive anda.
   2. Klik kanan pada fail itu → **Share → Copy link**.
   3. Tampal pautan itu dalam lajur **Gambar** di tab *Senarai Lencana*.
8. **Deploy → New deployment** → ikon gear → **Web app**:
   - Execute as: **Me**
   - Who has access: **Anyone**
9. Tekan **Deploy**, kemudian salin **Web app URL** (berakhir dengan `/exec`). Inilah pautan borang untuk dikongsi kepada guru.

> Jika anda mengubah `Code.gs` atau `Index.html` selepas deploy, buat **Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy**. Pautan kekal sama.
> Menambah atau mengubah baris dalam Sheet tidak memerlukan deploy semula.

Untuk menukar akaun bank, ubah `BANK` di bahagian atas `Code.gs`, kemudian deploy versi baru.
Untuk notifikasi emel setiap tempahan, isi `EMEL_ADMIN`.

## Tambah tempahan lencana baru

Tiada kod perlu diubah. Cuma tambah satu baris dalam tab **Senarai Lencana**:

| Lajur | Contoh | Nota |
|---|---|---|
| ID | `HPN26` | Pendek, tiada ruang. Digunakan untuk no. rujukan (`HPN26-0001`) dan pautan terus. |
| Nama Lencana | Hari Pengakap Negara 2026 | |
| Keterangan | Semua unit | Pilihan |
| Harga (RM) | 5 | Harga seunit |
| Tarikh Akhir | 15/11/2026 23:00 | Hari/bulan/tahun. Borang tutup automatik selepas masa ini (waktu Malaysia). |
| Gambar | pautan Google Drive | Pautan fail Drive (tak perlu dikongsi umum) atau pautan gambar `https://...`. Guna gambar kurang 1 MB supaya borang cepat dibuka. |
| Aktif | YA | Tukar kepada `TIDAK` untuk sembunyikan lencana lama dari borang |

Bagaimana borang memaparkannya:

- **Satu lencana aktif**: borang terus dibuka untuk lencana itu.
- **Lebih daripada satu**: guru memilih lencana dahulu. Lencana yang sudah tamat tarikh akhir dipaparkan sebagai "Ditutup".
- **Pautan terus** ke satu lencana: tambah `?lencana=ID` pada Web app URL, contohnya `https://script.google.com/macros/s/XXXX/exec?lencana=HPN26`. Sesuai untuk dikongsi dalam WhatsApp.

## Semakan tempahan

Semua tempahan (semua lencana) ada dalam tab **Tempahan**:

`No. Rujukan | Tarikh & Masa | ID Lencana | Nama Lencana | Nama Sekolah | Nama Pemimpin | No. Telefon | Bilangan | Harga Seunit (RM) | Jumlah (RM) | Pautan Resit`

Guna **Data → Create a filter** dan tapis lajur *ID Lencana* untuk melihat tempahan satu lencana sahaja.
Resit disimpan dalam subfolder mengikut lencana di dalam folder **Resit Tempahan Lencana**.
