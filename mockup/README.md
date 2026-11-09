# SARGA Mockup

Mockup antarmuka statis untuk **SARGA**, sistem inventaris dan peminjaman alat antar-anggota organisasi. Semua data disimpan di peramban lewat `localStorage`; tidak ada server, build tool, atau basis data nyata.

## Menjalankan

Buka `index.html` langsung di peramban. Tidak perlu memasang apa pun.

Beberapa peramban membatasi `file://`. Bila halaman kosong, jalankan server statis dari folder ini:

```powershell
python -m http.server 8080
```

Lalu buka `http://localhost:8080`.

## Akun Demo

Semua akun contoh memakai kata sandi **`rahasia123`**. Akun yang ditambahkan pengurus lewat portal memakai **`sarga123`**.

| Akun                | Peran                                           | Keadaan                                                      |
| ------------------- | ----------------------------------------------- | ------------------------------------------------------------ |
| Bambang Irawan      | Pengurus Komunitas Graha Indah, admin platform  | Bisa meminjam, menayangkan alat, dan membuka portal pengurus |
| H. Sudirman Santoso | Pengurus (Ketua) Komunitas Graha Indah, admin   | Persetujuan anggota dan pengaturan organisasi                |
| Agus Setiawan, S.T. | Anggota baru                                    | Menunggu verifikasi pengurus                                 |
| Rian Hidayat        | Anggota baru                                    | Pendaftaran ditolak, bisa diajukan ulang                     |
| Maya Putri          | Pengurus (Ketua) PT Nusantara Digital           | Contoh organisasi kantor                                     |
| Dewi Lestari        | Pengurus (Ketua) RT 05 / RW 08 Sukamaju         | Contoh organisasi RT/RW                                      |

Panel **Data demo** di kiri bawah bisa mengganti akun, menampilkan akun menunggu atau ditolak, membuka akun pengurus, dan mereset seluruh data.

## Kode Undangan

| Organisasi             | Kode                             |
| ---------------------- | -------------------------------- |
| Komunitas Graha Indah  | `GRAHA2026`                      |
| RT 05 / RW 08 Sukamaju | `RT05-2026`                      |
| PT Nusantara Digital   | `NUSANTARA2026`                  |
| Karawitan Argo Budoyo  | `ARGO2026` (organisasi nonaktif) |

## Halaman

**Umum dan akun**

- Beranda, masuk (kata sandi dan OTP demo), daftar dengan kode undangan
- Status pendaftaran: menunggu, ditolak dengan alasan, ajukan ulang
- Gabung organisasi lain, profil, ganti kata sandi

**Anggota**

- Katalog dengan pencarian nama atau kode alat
- Rincian barang, pengajuan pinjaman dengan validasi tanggal
- Pinjaman saya dengan filter status dan rincian transaksi
- Barang saya, permintaan masuk, tambah dan ubah barang, tarik/tayangkan lagi
- Struktur organisasi dan pengumuman

**Pengurus**

- Monitoring sirkulasi dengan pencarian
- Verifikasi anggota dan pengajuan pinjaman
- Profil organisasi, kode undangan, status organisasi, aktivitas terakhir
- Anggota: daftar, filter status, rincian, ubah peran, tambah manual
- Bagan dan peran anggota

**Admin platform**

- Direktori seluruh organisasi
- Buat organisasi baru beserta Pengurus pertama

## Alur yang Dicakup

- Pendaftaran mandiri dengan kode undangan, lalu verifikasi pengurus
- Penolakan dengan alasan dan pengajuan ulang
- Satu akun untuk beberapa organisasi dengan peran berbeda
- Pengajuan pinjaman, persetujuan pemilik atau pengurus, penolakan beralasan, pembatalan, dan konfirmasi pengembalian
- Perubahan status barang mengikuti pinjaman yang disetujui atau dikembalikan
- Pencatatan aktivitas organisasi dan jejak transaksi
- Pembuatan organisasi hanya oleh admin platform
- Penambahan anggota manual oleh pengurus

## Data dan Reset

- Kunci penyimpanan: `sarga_db_v5`
- Kunci sesi: `sarga_session_v1`
- Reset lewat panel **Data demo**, atau hapus dua kunci tersebut dari penyimpanan peramban

Data awal berisi empat organisasi, 18 akun, sepuluh barang, dan sembilan transaksi pinjaman. Tanggal demo mengikuti November 2026; transaksi `ln-9` sengaja terlambat.

## Berkas

| Berkas                        | Isi                                                                              |
| ----------------------------- | -------------------------------------------------------------------------------- |
| Berkas / Direktori            | Isi                                                                              |
| ----------------------------- | -------------------------------------------------------------------------------- |
| `index.html`                  | Titik masuk utama: kerangka header, navigasi, breadcrumb, footer, wadah modal     |
| `css/styles.css`              | Token desain, tipografi lokal Epilogue, komponen kartu, tabel, dan responsif     |
| `js/data.js`                 | Penyimpanan `SARGA_DB` di localStorage, relasi multi-organisasi, audit & barang |
| `js/app.js`                  | Router berbasis hash, session controller, dynamic step unlock, demo dock & toast  |
| `js/forms.js`                | Validasi formulir pendaftaran 2 tahap, modal verifikasi dokumen, tolak/setujui   |
| `js/actions.js`              | Dispatcher event: tinjau dokumen modal, persetujuan anggota, switch demo user     |
| `js/pages/pages-public.js`    | Halaman publik: Beranda, Masuk (Password/OTP), Daftar (2 tahap), Status Akun     |
| `js/pages/pages-member.js`    | Halaman anggota: Katalog, Rincian, Pinjaman Saya, Barang Saya, Bagan Struktur    |
| `js/pages/pages-admin.js`     | Halaman pengurus: Monitoring sirkulasi, Panel verifikasi dokumen, Manajemen user |
| `fonts/`                     | Berkas webfont lokal (Epilogue 400, 500, 600, 700)                               |
| `img/`                       | Asset gambar contoh: SVG KTP, SVG Kartu Tanda Anggota, dan foto demo             |
| `image.png`                  | Logo resmi SARGA untuk favicon & header brand                                    |

## Batasan

- Pemeriksaan akses berjalan di peramban dan hanya membentuk alur prototipe, bukan keamanan nyata.
- Unggahan dokumen hanya menyimpan nama berkas.
- Foto barang dipilih dari daftar contoh; unggahan foto asli belum disimpan.
- Notifikasi WhatsApp hanya berupa tautan `wa.me`; tidak ada pengiriman pesan.
- Kata sandi tersimpan apa adanya di `localStorage` karena ini data demo.
