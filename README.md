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
| Ref 1 | ID lencana yang dipilih, cth. `LencanaAKPNPKK26` (diisi automatik) |
| Ref 2 | NAMA SEKOLAH (diisi automatik daripada nama sekolah yang ditaip) |

Selepas tempahan berjaya, guru menerima nombor rujukan (contoh `LencanaAKPNPKK26-0001`).
Sekolah yang sama boleh membuat tempahan tambahan. Halaman kejayaan akan menunjukkan jumlah keseluruhan lencana sekolah itu bagi semua tempahannya.

## Struktur fail

| Fail | Kegunaan |
|---|---|
| `apps-script/Code.gs` | Kod pelayan: paparkan borang, simpan tempahan, akaun bank |
| `apps-script/Index.html` | Borang tempahan untuk guru |
| `apps-script/Admin.html` | Paparan admin: senarai tempahan, tambah lencana, gambar lencana |
| `apps-script/appsscript.json` | Tetapan projek (zon waktu Malaysia) |
| `assets/lencana.jpg` | Gambar lencana AKPN 2026, untuk dimuat naik ke Google Drive |

## Cara deploy (sekali sahaja)

1. Buka [sheets.new](https://sheets.new) untuk cipta Google Sheet baru, contohnya "Tempahan Lencana".
2. Menu **Extensions → Apps Script**.
3. Dalam fail `Code.gs`, padam kod sedia ada dan tampal seluruh kandungan `apps-script/Code.gs`.
4. Tekan **+** (sebelah *Files*) → **HTML**, namakan fail `Index` (tepat begitu), dan tampal seluruh kandungan `apps-script/Index.html`.
5. Ulang langkah 4 untuk fail HTML kedua bernama `Admin`, dan tampal `apps-script/Admin.html`.
6. Tekan **Save**.
7. Pilih fungsi `setup` di bar atas, tekan **Run**, dan benarkan akses (Sheet, Drive).
   Ini akan mencipta:
   - Tab **Senarai Lencana**, yang sudah berisi lencana `LencanaAKPNPKK26` (AKPN 2026 RM 5.00, tutup 2/10/2026 jam 11:00 malam)
   - Tab **Tempahan**
   - Folder Drive **Resit Tempahan Lencana**
8. Muat semula (refresh) Google Sheet. Menu baru **Lencana** akan muncul di bar menu.
   Pilih **Lencana → Sunting / padam lencana**, pilih LencanaAKPNPKK26, dan muat naik `assets/lencana.jpg`.
9. **Deploy → New deployment** → ikon gear → **Web app**:
   - Execute as: **Me**
   - Who has access: **Anyone**
10. Tekan **Deploy**, kemudian salin **Web app URL** (berakhir dengan `/exec`). Inilah pautan borang untuk dikongsi kepada guru.

> Jika anda mengubah `Code.gs`, `Index.html` atau `Admin.html` selepas deploy, buat **Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy**. Pautan kekal sama.
> Menambah atau mengubah baris dalam Sheet tidak memerlukan deploy semula.

Untuk menukar akaun bank, ubah `BANK` di bahagian atas `Code.gs`, kemudian deploy versi baru.
Untuk notifikasi emel setiap tempahan, isi `EMEL_ADMIN`.

## Paparan admin

Paparan admin menunjukkan:

- jumlah tempahan, jumlah lencana dan jumlah bayaran
- ringkasan mengikut lencana
- **ringkasan mengikut sekolah**: sekolah yang membuat tempahan tambahan dijumlahkan menjadi satu baris bagi setiap lencana. Nama yang ditaip sedikit berbeza, contohnya "SK Taman Rapat" dan "sk. taman rapat", dikira sebagai sekolah yang sama.
- senarai semua tempahan (sekolah, bilangan, jumlah, pautan resit, telefon dengan pautan WhatsApp)

Ia juga boleh ditapis mengikut lencana dan dicari mengikut nama sekolah.

Cara membukanya:

- **Dari borang tempahan**: tekan butang **🔒 Admin** di penjuru kanan atas, kemudian masukkan kata laluan admin. Cara ini sesuai untuk telefon.
- **Dari Google Sheet (komputer)**: pilih **Lencana → Paparan admin (senarai tempahan)**. Editor Sheet tidak perlu kata laluan.

### Kata laluan admin

1. Tetapkan kata laluan kali pertama dalam Google Sheet: **Lencana → Tetapkan kata laluan admin** (sekurang-kurangnya 6 aksara).
2. Selepas itu, kata laluan boleh ditukar dalam paparan admin, di tab **Kata laluan**.

Ciri keselamatan:

- Sesi log masuk tamat selepas 6 jam.
- Selepas 10 cubaan salah, log masuk dikunci selama 15 minit.
- Menukar kata laluan akan melog keluar semua sesi admin yang lain.
- Kata laluan disimpan dalam bentuk hash (SHA-256) dalam Script Properties, bukan dalam kod atau Sheet.

Jika anda terlupa kata laluan, tetapkan semula melalui menu **Lencana → Tetapkan kata laluan admin**.

## Tambah, sunting atau padam lencana

**Tambah:** dalam paparan admin, buka tab **Tambah lencana** (atau menu **Lencana → Tambah lencana baru** dalam Google Sheet). Isi ID, nama, harga, tarikh akhir dan pilih gambar. Lencana terus dibuka untuk tempahan, dan gambar disimpan dalam folder Drive *Resit Tempahan Lencana/Gambar Lencana*.

**Sunting atau padam:** dalam paparan admin, buka tab **Urus lencana** (atau menu **Lencana → Sunting / padam lencana**), kemudian pilih lencana.

- **Sunting:** nama, keterangan, harga, tarikh akhir, status *Aktif* dan gambar boleh diubah. ID juga boleh ditukar selagi belum ada tempahan untuk lencana itu (ID digunakan dalam no. rujukan).
- **Tutup tempahan tanpa memadam:** nyahtanda *Aktif* dan simpan. Lencana tidak lagi dipaparkan di borang.
- **Padam:** lencana dibuang dari tab *Senarai Lencana* dan dari borang. Tempahan dan resit yang sudah diterima **tidak** dipadam, dan masih kelihatan dalam senarai tempahan.

Anda juga boleh menambah atau mengubah baris terus dalam tab **Senarai Lencana**:

| Lajur | Contoh | Nota |
|---|---|---|
| ID | `LencanaHPN26` | 2-20 huruf/nombor, tiada ruang. Digunakan sebagai Ref 1 bayaran, no. rujukan (`LencanaHPN26-0001`) dan pautan terus. |
| Nama Lencana | Hari Pengakap Negara 2026 | |
| Keterangan | Semua unit | Pilihan |
| Harga (RM) | 5 | Harga seunit |
| Tarikh Akhir | 15/11/2026 23:00 | Hari/bulan/tahun. Borang tutup automatik selepas masa ini (waktu Malaysia). |
| Gambar | pautan Google Drive | Diisi automatik jika guna menu. Atau tampal pautan fail Drive (tak perlu dikongsi umum) / pautan gambar `https://...`. |
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
