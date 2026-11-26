# Laporan Fitur Antarmuka & Papan Penugasan Tim SARGA (All Feature & Task Board)

Dokumen ini memuat dokumentasi menyeluruh seluruh fitur aplikasi **SARGA** sekaligus berfungsi sebagai **Task List / Work Breakdown Structure (WBS)** untuk tim pengembang yang terdiri dari **4 orang (2 Frontend & 2 Backend)**. Dilengkapi dengan status progres riil hasil analisis kode sumber `frontend/` dan `backend/`, alokasi PIC berbobot 80:20, serta format log pengerjaan.

---

## 1. Dasbor Distribusi Kerja Tim & Progres Proyek

### 1.1. Matriks Distribusi Tim (Aturan Rasio 80 : 20)

| Nama Anggota | Peran | Alokasi Beban | Cakupan Tanggung Jawab Utama | Total Task |
|---|---|---|---|---|
| **Wildan** | Frontend (FE) | **80%** | Alur sirkulasi transaksi inti, peminjaman, monitoring, pusat verifikasi ganda, manajemen anggota & peran, modal dokumen pop-up, dan modul sensor/watermark. | **20 Task** |
| **Filipus** | Frontend (FE) | **20%** | Modul terisolasi/pendukung: Papan pengumuman, bagan struktur organisasi publik, profil & ganti kata sandi, bagan jabatan admin, dan direktori platform. | **5 Task** |
| **Saki** | Backend (BE) | **80%** | Mesin transaksi peminjaman, approval & return serah terima, verifikasi keanggotaan, middleware JWT & hak akses pengurus, manajemen mutasi anggota, audit trail, serta upload & watermark engine. | **16 Task** |
| **Mahendra** | Backend (BE) | **20%** | Modul terisolasi/pendukung: CRUD papan pengumuman, API struktur & bagan organisasi, API direktori organisasi platform, dan utilitas pendukung. | **4 Task** |

---

### 1.2. Ringkasan Status Progres Hasil Audit Codebase

Berdasarkan analisis langsung pada direktori `frontend/` dan `backend/`:
- **Total Task Sistem:** 45 Task (25 Frontend, 20 Backend)
- **Status Selesai (`Selesai`):** **17 Task (37,8%)** *(Fondasi arsitektur, auth, katalog, schema DB, shared components)*
- **Status Dalam Pengerjaan (`In Progress`):** **4 Task (8,9%)**
- **Status Belum Dimulai (`Pending`):** **24 Task (53,3%)**

```
PROGRES PENGEMBANGAN SARGA:
[████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░] 37.8% Selesai (17 / 45 Task)
```

---

## 2. Format Template Log Pengerjaan

Setiap tugas diformat dengan struktur standar di bawah ini agar rekan tim dapat mencatat pembaruan secara langsung:

```markdown
- [x] **KODE-TASK: Judul Fitur / Tugas**
  - **Assignee / PIC:** Nama Pengembang (FE / BE)
  - **Status:** `Selesai` | `Dalam Pengerjaan` | `Belum Dimulai`
  - **Target Selesai:** YYYY-MM-DD
  - **Tanggal Selesai:** YYYY-MM-DD (atau `-`)
  - **Berkas Terkait:** `path/to/source-code`
  - **Catatan Teknis:** Keterangan singkat implementasi atau kendala
```

---

## 3. Rincian Task List Frontend (FE) — 25 Task

### Alokasi Wildan (FE — 80% / 20 Task)

- [x] **FE-WLD-01: Inisialisasi Arsitektur Angular 19 & Design Tokens Civic Registry**
  - **Assignee / PIC:** Wildan (FE)
  - **Status:** `Selesai`
  - **Target Selesai:** 2026-11-18
  - **Tanggal Selesai:** 2026-11-18
  - **Berkas Terkait:** [frontend/src/styles.css](file:///c:/Users/KallKun/Desktop/Sarga%20DOC/WEB%20MOCKUP/frontend/src/styles.css), `app.config.ts`, `app.routes.ts`
  - **Catatan Teknis:** Menetapkan palet emerald `#0f766e`, paper `#fffefb`, tipografi Epilogue, serta setup standalone components.

- [x] **FE-WLD-02: Core Interceptor JWT & Route Guards**
  - **Assignee / PIC:** Wildan (FE)
  - **Status:** `Selesai`
  - **Target Selesai:** 2026-11-18
  - **Tanggal Selesai:** 2026-11-18
  - **Berkas Terkait:** [jwt.interceptor.ts](file:///c:/Users/KallKun/Desktop/Sarga%20DOC/WEB%20MOCKUP/frontend/src/app/core/interceptors/jwt.interceptor.ts), `auth.guard.ts`, `admin.guard.ts`
  - **Catatan Teknis:** Injeksi otomatis token Bearer & header `x-organization-id` pada setiap HTTP request, serta proteksi rute admin.

- [x] **FE-WLD-03: Halaman Masuk Akun / Login (`#/login`)**
  - **Assignee / PIC:** Wildan (FE)
  - **Status:** `Selesai`
  - **Target Selesai:** 2026-11-18
  - **Tanggal Selesai:** 2026-11-18
  - **Berkas Terkait:** [login.component.ts](file:///c:/Users/KallKun/Desktop/Sarga%20DOC/WEB%20MOCKUP/frontend/src/app/features/auth/login.component.ts)
  - **Catatan Teknis:** Form login nomor WhatsApp & kata sandi sesuai SRS v1.2, lengkap dengan tombol bantuan akun demo.

- [x] **FE-WLD-04: Halaman Pendaftaran Anggota 2-Tahap (`#/daftar`)**
  - **Assignee / PIC:** Wildan (FE)
  - **Status:** `Selesai`
  - **Target Selesai:** 2026-11-18
  - **Tanggal Selesai:** 2026-11-18
  - **Berkas Terkait:** [register.component.ts](file:///c:/Users/KallKun/Desktop/Sarga%20DOC/WEB%20MOCKUP/frontend/src/app/features/auth/register.component.ts)
  - **Catatan Teknis:** Tahap 1 kunci kode undangan $\rightarrow$ validasi $\rightarrow$ Tahap 2 pembukaan form data diri & pemilihan dokumen verifikasi (KTP/KTA).

- [x] **FE-WLD-05: Halaman Katalog Barang & Bilah Pencarian (`#/katalog`)**
  - **Assignee / PIC:** Wildan (FE)
  - **Status:** `Selesai`
  - **Target Selesai:** 2026-11-18
  - **Tanggal Selesai:** 2026-11-18
  - **Berkas Terkait:** [catalog.component.ts](file:///c:/Users/KallKun/Desktop/Sarga%20DOC/WEB%20MOCKUP/frontend/src/app/features/catalog/catalog.component.ts)
  - **Catatan Teknis:** Grid kartu alat responsif, pencarian realtime nama/kode (kategori dihilangkan sesuai permintaan), dan badge ketersediaan.

- [x] **FE-WLD-06: Halaman Rincian Lengkap Barang (`#/detail-barang`)**
  - **Assignee / PIC:** Wildan (FE)
  - **Status:** `Selesai`
  - **Target Selesai:** 2026-11-18
  - **Tanggal Selesai:** 2026-11-18
  - **Berkas Terkait:** [item-detail.component.ts](file:///c:/Users/KallKun/Desktop/Sarga%20DOC/WEB%20MOCKUP/frontend/src/app/features/catalog/item-detail.component.ts)
  - **Catatan Teknis:** Detail alat, checklist kelengkapan barang, instruksi keselamatan, kontak WhatsApp pemilik, dan histori sirkulasi.

- [x] **FE-WLD-07: Halaman Daftarkan Barang Baru (`#/tambah-barang`)**
  - **Assignee / PIC:** Wildan (FE)
  - **Status:** `Selesai`
  - **Target Selesai:** 2026-11-18
  - **Tanggal Selesai:** 2026-11-18
  - **Berkas Terkait:** [item-create.component.ts](file:///c:/Users/KallKun/Desktop/Sarga%20DOC/WEB%20MOCKUP/frontend/src/app/features/items/item-create.component.ts)
  - **Catatan Teknis:** Penomoran otomatis kode alat, validasi durasi (1-14 hari), lokasi penyimpanan, parsing kelengkapan baris demi baris, dan upload foto.

- [x] **FE-WLD-08: Halaman Beranda Publik & Live Inventory Board (`#/beranda`)**
  - **Assignee / PIC:** Wildan (FE)
  - **Status:** `Selesai`
  - **Target Selesai:** 2026-11-25
  - **Tanggal Selesai:** 2026-11-24
  - **Berkas Terkait:** [home.component.ts](file:///c:/Users/wilda/SARGA-WEB-MOCKUP/frontend/src/app/features/home/home.component.ts)
  - **Catatan Teknis:** Hero banner kontekstual, showcase kartu alat berstatus Tersedia di organisasi aktif, dan penjelasan 3 langkah pinjam.

- [x] **FE-WLD-09: Halaman Status Akun & Linimasa Pendaftaran (`#/status-akun`)**
  - **Assignee / PIC:** Wildan (FE)
  - **Status:** `Selesai`
  - **Target Selesai:** 2026-11-26
  - **Tanggal Selesai:** 2026-11-24
  - **Berkas Terkait:** [status-akun.component.ts](file:///c:/Users/wilda/SARGA-WEB-MOCKUP/frontend/src/app/features/auth/status-akun.component.ts)
  - **Catatan Teknis:** Linimasa 3 tahap, banner kuning untuk status Menunggu, banner merah untuk Ditolak (disertai alasan transparan & tombol *Ajukan Ulang*), banner hijau untuk Aktif.

- [x] **FE-WLD-10: Formulir & Modal Gabung Organisasi Tambahan (`#/gabung`)**
  - **Assignee / PIC:** Wildan (FE)
  - **Status:** `Selesai`
  - **Target Selesai:** 2026-11-26
  - **Tanggal Selesai:** 2026-11-25
  - **Berkas Terkait:** [gabung.component.ts](file:///c:/Users/wilda/SARGA-WEB-MOCKUP/frontend/src/app/features/auth/gabung.component.ts)
  - **Catatan Teknis:** Modal kirim data diri dan foto identitas ke organisasi lain menggunakan kode undangan baru tanpa input kata sandi baru.

- [x] **FE-WLD-11: Modal Masuk Cepat dengan Kode OTP WhatsApp**
  - **Assignee / PIC:** Wildan (FE)
  - **Status:** `Selesai`
  - **Target Selesai:** 2026-11-27
  - **Tanggal Selesai:** 2026-11-25
  - **Berkas Terkait:** [otp-modal.component.ts](file:///c:/Users/wilda/SARGA-WEB-MOCKUP/frontend/src/app/shared/otp-modal/otp-modal.component.ts)
  - **Catatan Teknis:** Dialog input 6 angka verifikasi OTP WhatsApp sebagai alternatif login tanpa kata sandi.

- [x] **FE-WLD-12: Halaman Formulir Pengajuan Pinjaman & Validasi Tanggal (`#/form-pengajuan`)**
  - **Assignee / PIC:** Wildan (FE)
  - **Status:** `Selesai`
  - **Target Selesai:** 2026-11-27
  - **Tanggal Selesai:** 2026-11-25
  - **Berkas Terkait:** [loan-request.component.ts](file:///c:/Users/wilda/SARGA-WEB-MOCKUP/frontend/src/app/features/loans/loan-request.component.ts)
  - **Catatan Teknis:** Pemilihan rentang tanggal, validasi `maxDays`, validasi tanggal tidak boleh lampau, input keperluan, dan proteksi meminjam alat milik sendiri.

- [x] **FE-WLD-13: Halaman "Pinjaman Saya" & Tab Filter Status (`#/pinjaman-saya`)**
  - **Assignee / PIC:** Wildan (FE)
  - **Status:** `Selesai`
  - **Target Selesai:** 2026-11-28
  - **Tanggal Selesai:** 2026-11-25
  - **Berkas Terkait:** [my-loans.component.ts](file:///c:/Users/wilda/SARGA-WEB-MOCKUP/frontend/src/app/features/loans/my-loans.component.ts)
  - **Catatan Teknis:** Tab filter status (Semua, Menunggu, Aktif, Selesai, Ditolak, Dibatalkan), badge keterlambatan (*overdue*), dan tombol batalkan pengajuan mandiri.

- [x] **FE-WLD-14: Modal Dialog Rincian Transaksi & Linimasa Jejak Audit (`openLoanModal`)**
  - **Assignee / PIC:** Wildan (FE)
  - **Status:** `Selesai`
  - **Target Selesai:** 2026-11-28
  - **Tanggal Selesai:** 2026-11-25
  - **Berkas Terkait:** [loan-modal.component.ts](file:///c:/Users/wilda/SARGA-WEB-MOCKUP/frontend/src/app/shared/loan-modal/loan-modal.component.ts)
  - **Catatan Teknis:** Linimasa audit transaksi (pengajuan $\rightarrow$ persetujuan $\rightarrow$ pengembalian), serta tombol aksi dinamis (*Setujui*, *Tolak*, *Kembalikan*).

- [x] **FE-WLD-15: Dashboard "Barang Saya" & Kotak Permintaan Masuk (`#/barang-saya`)**
  - **Assignee / PIC:** Wildan (FE)
  - **Status:** `Selesai`
  - **Target Selesai:** 2026-11-29
  - **Tanggal Selesai:** 2026-11-25
  - **Berkas Terkait:** [my-items.component.ts](file:///c:/Users/wilda/SARGA-WEB-MOCKUP/frontend/src/app/features/items/my-items.component.ts)
  - **Catatan Teknis:** Daftar alat pribadi, penanganan permohonan pinjaman masuk dari anggota lain, aksi setujui/tolak langsung, serta fitur tarik/arsipkan barang (`archive-item` & `restore-item`).

- [x] **FE-WLD-16: Halaman Ubah Data Barang (`#/edit-barang`)**
  - **Assignee / PIC:** Wildan (FE)
  - **Status:** `Selesai`
  - **Target Selesai:** 2026-11-29
  - **Tanggal Selesai:** 2026-11-25
  - **Berkas Terkait:** `frontend/src/app/features/items/item-edit.component.ts`
  - **Catatan Teknis:** Pembaruan informasi barang, kelengkapan, dan status alat oleh pemilik atau pengurus.

- [x] **FE-WLD-17: Halaman Monitoring Sirkulasi Terpusat (`#/admin-monitoring`)**
  - **Assignee / PIC:** Wildan (FE)
  - **Status:** `Selesai`
  - **Target Selesai:** 2026-11-30
  - **Tanggal Selesai:** 2026-11-25
  - **Berkas Terkait:** `frontend/src/app/features/admin/monitoring.component.ts`
  - **Catatan Teknis:** Strip metrik statistik (Total, Menunggu, Berjalan, Terlambat), pencarian sirkulasi, dan tabel transaksi komprehensif.

- [x] **FE-WLD-18: Pusat Verifikasi Calon Anggota & Modal Dokumen Penuh (`#/admin-verifikasi`)**
  - **Assignee / PIC:** Wildan (FE)
  - **Status:** `Selesai`
  - **Target Selesai:** 2026-12-01
  - **Tanggal Selesai:** 2026-11-25
  - **Berkas Terkait:** `frontend/src/app/features/admin/verification.component.ts`, `member-doc-modal.component.ts`
  - **Catatan Teknis:** Kartu antrean pendaftar, tombol cek detail, tombol setujui/tolak, serta **Modal Pop-Up Resolusi Penuh Foto Dokumen Identitas KTP/KTA** lengkap dengan acuan pemeriksaan pengurus.

- [x] **FE-WLD-19: Manajemen Anggota Organisasi & Ubah Peran (`#/admin-anggota`)**
  - **Assignee / PIC:** Wildan (FE)
  - **Status:** `Selesai`
  - **Target Selesai:** 2026-12-02
  - **Tanggal Selesai:** 2026-11-25
  - **Berkas Terkait:** `frontend/src/app/features/admin/members.component.ts`, `member-add.component.ts`
  - **Catatan Teknis:** Filter status anggota, pencarian, modal edit peran/jabatan, penambahan anggota manual oleh pengurus, dan proteksi pengurus tunggal.

- [x] **FE-WLD-20: Komponen Sensor & Watermark Dokumen Identitas (Canvas Pre-processing)**
  - **Assignee / PIC:** Wildan (FE)
  - **Status:** `Selesai`
  - **Target Selesai:** 2026-12-03
  - **Tanggal Selesai:** 2026-11-25
  - **Berkas Terkait:** `frontend/src/app/shared/components/id-watermark-canvas/id-watermark-canvas.component.ts`
  - **Catatan Teknis:** Tool sensor redaksi hitam/blur pada NIK & tanda tangan, serta pembakaran watermark permanen melintang (nama organisasi, nama & kontak penanggung jawab, tanggal) sebelum dikirim ke backend.

---

### Alokasi Filipus (FE — 20% / 5 Task)

- [x] **FE-FLP-01: Halaman Struktur Organisasi Komunitas (`#/struktur`)**
  - **Assignee / PIC:** Filipus (FE)
  - **Status:** `Selesai`
  - **Target Selesai:** 2026-11-26
  - **Tanggal Selesai:** 2026-11-24
  - **Berkas Terkait:** [structure.component.ts](file:///c:/Users/HP/Desktop/SARGA-WEB-MOCKUP/frontend/src/app/features/structure/structure.component.ts)
  - **Catatan Teknis:** Visualisasi kartu daftar pengurus inti (Ketua, Sekretaris, Bendahara) dan anggota aktif beserta tautan langsung WhatsApp.

- [x] **FE-FLP-02: Halaman Papan Pengumuman Organisasi (`#/pengumuman`)**
  - **Assignee / PIC:** Filipus (FE)
  - **Status:** `Selesai`
  - **Target Selesai:** 2026-11-27
  - **Tanggal Selesai:** 2026-11-25
  - **Berkas Terkait:** `frontend/src/app/features/announcements/announcements.component.ts`
  - **Catatan Teknis:** Tampilan daftar pengumuman berurut waktu, form tambah pengumuman (khusus pengurus), dan tombol hapus pengumuman. Dihubungkan ke GET/POST/DELETE `/announcements`; validasi judul 3-120 & isi 5-2000 karakter; hapus memakai dialog konfirmasi.

- [x] **FE-FLP-03: Halaman Profil Akun, Switcher Organisasi & Ganti Sandi (`#/profil`)**
  - **Assignee / PIC:** Filipus (FE)
  - **Status:** `Selesai`
  - **Target Selesai:** 2026-11-28
  - **Tanggal Selesai:** 2026-11-25
  - **Berkas Terkait:** `frontend/src/app/features/profile/profile.component.ts`
  - **Catatan Teknis:** Data diri pengguna, tombol lihat dokumen pendaftaran saya (`openMyDocModal`), selector ganti organisasi aktif, dan form ubah kata sandi. Switcher organisasi memakai `setActiveOrg`. Ubah kata sandi baru divalidasi di sisi klien; endpoint server belum tersedia sehingga ditampilkan sebagai segera hadir. Dokumen pendaftaran tampil bila `documentUrl` tersedia.

- [ ] **FE-FLP-04: Halaman Bagan & Penugasan Jabatan Pengurus (`#/admin-bagan`)**
  - **Assignee / PIC:** Filipus (FE)
  - **Status:** `Belum Dimulai`
  - **Target Selesai:** 2026-11-29
  - **Tanggal Selesai:** -
  - **Berkas Terkait:** `frontend/src/app/features/admin/structure-matrix.component.ts`
  - **Catatan Teknis:** Matriks pengelompokan divisi dan penugasan peran/jabatan anggota di portal pengurus.

- [ ] **FE-FLP-05: Halaman Direktori Seluruh Organisasi Admin Platform (`#/admin-direktori`)**
  - **Assignee / PIC:** Filipus (FE)
  - **Status:** `Belum Dimulai`
  - **Target Selesai:** 2026-11-30
  - **Tanggal Selesai:** -
  - **Berkas Terkait:** `frontend/src/app/features/admin/platform-directory.component.ts`
  - **Catatan Teknis:** Tampilan kartu seluruh organisasi untuk akun platform admin, pencarian nama/alamat, serta tombol kelola organisasi.

---

## 4. Rincian Task List Backend (BE) — 20 Task

### Alokasi Saki (BE — 80% / 16 Task)

- [x] **BE-SKI-01: Inisialisasi Database SQLite & Skema Relasional Prisma**
  - **Assignee / PIC:** Saki (BE)
  - **Status:** `Selesai`
  - **Target Selesai:** 2026-11-18
  - **Tanggal Selesai:** 2026-11-18
  - **Berkas Terkait:** [backend/prisma/schema.prisma](file:///c:/Users/KallKun/Desktop/Sarga%20DOC/WEB%20MOCKUP/backend/prisma/schema.prisma)
  - **Catatan Teknis:** Pemodelan 7 tabel relasional lengkap: `Organization`, `User`, `Membership`, `Item`, `LoanTransaction`, `AuditLog`, `Announcement`.

- [x] **BE-SKI-02: Endpoint Registrasi Calon Anggota (`POST /api/v1/auth/register`)**
  - **Assignee / PIC:** Saki (BE)
  - **Status:** `Selesai`
  - **Target Selesai:** 2026-11-18
  - **Tanggal Selesai:** 2026-11-18
  - **Berkas Terkait:** [auth.controller.ts](file:///c:/Users/KallKun/Desktop/Sarga%20DOC/WEB%20MOCKUP/backend/src/controllers/auth.controller.ts)
  - **Catatan Teknis:** Validasi kode undangan, hashing bcrypt, pembuatan akun dan keanggotaan berstatus `MENUNGGU_VERIFIKASI`.

- [x] **BE-SKI-03: Endpoint Masuk / Login Nomor WhatsApp & JWT (`POST /api/v1/auth/login`)**
  - **Assignee / PIC:** Saki (BE)
  - **Status:** `Selesai`
  - **Target Selesai:** 2026-11-18
  - **Tanggal Selesai:** 2026-11-18
  - **Berkas Terkait:** [auth.controller.ts](file:///c:/Users/KallKun/Desktop/Sarga%20DOC/WEB%20MOCKUP/backend/src/controllers/auth.controller.ts)
  - **Catatan Teknis:** Verifikasi nomor WA & sandi, pembuatan token JWT (masa aktif 7 hari), penyertaan data keanggotaan.

- [x] **BE-SKI-04: Middleware Autentikasi JWT & Isolasi Organisasi Header**
  - **Assignee / PIC:** Saki (BE)
  - **Status:** `Selesai`
  - **Target Selesai:** 2026-11-18
  - **Tanggal Selesai:** 2026-11-18
  - **Berkas Terkait:** [auth.middleware.ts](file:///c:/Users/KallKun/Desktop/Sarga%20DOC/WEB%20MOCKUP/backend/src/middlewares/auth.middleware.ts)
  - **Catatan Teknis:** Ekstraksi token Bearer, validasi payload user, membaca header `x-organization-id`, dan verifikasi role `ADMIN`/`ANGGOTA`.

- [x] **BE-SKI-05: Endpoint Katalog Inventaris Organisasi (`GET /api/v1/items`)**
  - **Assignee / PIC:** Saki (BE)
  - **Status:** `Selesai`
  - **Target Selesai:** 2026-11-18
  - **Tanggal Selesai:** 2026-11-18
  - **Berkas Terkait:** [item.controller.ts](file:///c:/Users/KallKun/Desktop/Sarga%20DOC/WEB%20MOCKUP/backend/src/controllers/item.controller.ts)
  - **Catatan Teknis:** Filter inventaris berdasarkan `orgId`, pengecualian status diarsipkan, pencarian nama/kode, relasi data pemilik.

- [x] **BE-SKI-06: Endpoint Rincian Barang (`GET /api/v1/items/:id`)**
  - **Assignee / PIC:** Saki (BE)
  - **Status:** `Selesai`
  - **Target Selesai:** 2026-11-18
  - **Tanggal Selesai:** 2026-11-18
  - **Berkas Terkait:** [item.controller.ts](file:///c:/Users/KallKun/Desktop/Sarga%20DOC/WEB%20MOCKUP/backend/src/controllers/item.controller.ts)
  - **Catatan Teknis:** Informasi kelengkapan, instruksi, data pemilik, serta riwayat sirkulasi barang.

- [x] **BE-SKI-07: Endpoint Daftarkan Barang Baru (`POST /api/v1/items`)**
  - **Assignee / PIC:** Saki (BE)
  - **Status:** `Selesai`
  - **Target Selesai:** 2026-11-18
  - **Tanggal Selesai:** 2026-11-18
  - **Berkas Terkait:** [item.controller.ts](file:///c:/Users/KallKun/Desktop/Sarga%20DOC/WEB%20MOCKUP/backend/src/controllers/item.controller.ts)
  - **Catatan Teknis:** Auto generate kode unik `ITM-xxx`, validasi batas hari pinjam, penyimpanan JSON kelengkapan, pencatatan log audit.

- [x] **BE-SKI-08: Database Seeding & Konfigurasi Server / CORS**
  - **Assignee / PIC:** Saki (BE)
  - **Status:** `Selesai`
  - **Target Selesai:** 2026-11-18
  - **Tanggal Selesai:** 2026-11-18
  - **Berkas Terkait:** [seed.ts](file:///c:/Users/KallKun/Desktop/Sarga%20DOC/WEB%20MOCKUP/backend/prisma/seed.ts), [app.ts](file:///c:/Users/KallKun/Desktop/Sarga%20DOC/WEB%20MOCKUP/backend/src/app.ts)
  - **Catatan Teknis:** Seeding data 2 organisasi, akun demo pengurus & anggota, 5 alat inventaris awal, serta penanganan CORS preflight OPTIONS.

- [x] **BE-SKI-09: Endpoint Pengajuan Pinjaman Barang (`POST /api/v1/loans`)**
  - **Assignee / PIC:** Saki (BE)
  - **Status:** `Selesai`
  - **Target Selesai:** 2026-11-25
  - **Tanggal Selesai:** 2026-11-23
  - **Berkas Terkait:** `backend/src/controllers/loan.controller.ts`, `loan.routes.ts`
  - **Catatan Teknis:** Validasi ketersediaan barang, validasi rentang tanggal terhadap `maxDays`, pencegahan permohonan ganda, status awal `MENUNGGU`. Respons memakai bentuk `{ success, loan, message }`.

- [x] **BE-SKI-10: Endpoint Riwayat Pinjaman Saya (`GET /api/v1/loans/me`) & Monitoring Admin (`GET /api/v1/loans`)**
  - **Assignee / PIC:** Saki (BE)
  - **Status:** `Selesai`
  - **Target Selesai:** 2026-11-26
  - **Tanggal Selesai:** 2026-11-23
  - **Berkas Terkait:** `backend/src/controllers/loan-query.controller.ts`, `backend/src/services/loan.service.ts`
  - **Catatan Teknis:** Filter status, pencarian `q` untuk monitoring admin, penanda `isOverdue` dan `daysOverdue` tanpa mengubah status tersimpan, serta otorisasi pengurus. Respons list memakai `{ success, count, loans }`.

- [x] **BE-SKI-11: Endpoint Persetujuan Pinjaman (`PATCH /api/v1/loans/:id/approve`)**
  - **Assignee / PIC:** Saki (BE)
  - **Status:** `Selesai`
  - **Target Selesai:** 2026-11-26
  - **Tanggal Selesai:** 2026-11-23
  - **Berkas Terkait:** `backend/src/controllers/loan-decision.controller.ts`, `backend/src/routes/loan.routes.ts`
  - **Catatan Teknis:** Diizinkan untuk pemilik barang atau admin organisasi. Transaksi atomik Prisma mengubah `MENUNGGU` → `AKTIF` dan barang `TERSEDIA` → `DIPINJAM` serta menulis audit `Menyetujui pinjaman`; kegagalan salah satu mutasi memicu rollback 409. Loan lintas organisasi → 404, aktor tanpa izin → 403.

- [x] **BE-SKI-12: Endpoint Penolakan Pinjaman (`PATCH /api/v1/loans/:id/reject`) & Pembatalan (`cancel`)**
  - **Assignee / PIC:** Saki (BE)
  - **Status:** `Selesai`
  - **Target Selesai:** 2026-11-27
  - **Tanggal Selesai:** 2026-11-23
  - **Berkas Terkait:** `backend/src/controllers/loan-decision.controller.ts`, `backend/src/routes/loan.routes.ts`
  - **Catatan Teknis:** Reject oleh pemilik/admin dengan `rejectionReason` minimal 5 karakter; cancel hanya oleh peminjam. Keduanya hanya untuk `MENUNGGU`, tidak mengubah status barang, dan menulis audit `Menolak pinjaman` / `Membatalkan pinjaman`. Loan lintas org → 404, state salah → 409.

- [x] **BE-SKI-13: Endpoint Konfirmasi Pengembalian Alat (`PATCH /api/v1/loans/:id/return`)**
  - **Assignee / PIC:** Saki (BE)
  - **Status:** `Selesai`
  - **Target Selesai:** 2026-11-27
  - **Tanggal Selesai:** 2026-11-23
  - **Berkas Terkait:** `backend/src/controllers/loan-return.controller.ts`, `backend/src/routes/loan.routes.ts`
  - **Catatan Teknis:** Dipicu pemilik barang atau admin organisasi. Transaksi atomik mengubah `AKTIF` → `SELESAI`, mencatat `returnConfirmedAt`, mengembalikan barang ke `TERSEDIA`, dan menulis audit `Mengonfirmasi pengembalian`. Kegagalan mutasi barang memicu rollback 409. Loan lintas org → 404; peminjam → 403.

- [x] **BE-SKI-14: Endpoint Pusat Verifikasi Calon Anggota (`GET /pending`, `PATCH /verify`, `PATCH /reject`)**
  - **Assignee / PIC:** Saki (BE)
  - **Status:** `Selesai`
  - **Target Selesai:** 2026-11-28
  - **Tanggal Selesai:** 2026-11-23
  - **Berkas Terkait:** `backend/src/controllers/membership.controller.ts`, `backend/src/routes/membership.routes.ts`
  - **Catatan Teknis:** Router dipasang di `/api/v1/memberships`. Admin melihat `MENUNGGU_VERIFIKASI` beserta data user dan dokumen; verify → `TERVERIFIKASI` dengan `rejectionReason = null`; reject → `DITOLAK` dengan alasan minimal 5 karakter. Audit `Memverifikasi anggota` / `Menolak anggota`; target lintas org → 404, state lain → 409.

- [x] **BE-SKI-15: Endpoint Manajemen Anggota & Proteksi Pengurus Tunggal (`PUT /memberships/:id`)**
  - **Assignee / PIC:** Saki (BE)
  - **Status:** `Selesai`
  - **Target Selesai:** 2026-11-29
  - **Tanggal Selesai:** 2026-11-23
  - **Berkas Terkait:** `backend/src/controllers/membership.controller.ts`, `backend/src/routes/membership.routes.ts`
  - **Catatan Teknis:** Admin mengubah `role` (ADMIN/ANGGOTA) dan `position` (1–50 karakter). Proteksi menolak penurunan admin terverifikasi terakhir dengan 409. Target lintas org → 404, input tidak valid → 400, audit `Mengubah peran anggota`. Respons `{ success, membership, message }`.

- [x] **BE-SKI-16: Middleware Pemrosesan Citra & Watermark Forensik (`upload.middleware.ts`)**
  - **Assignee / PIC:** Saki (BE)
  - **Status:** `Selesai`
  - **Target Selesai:** 2026-11-30
  - **Tanggal Selesai:** 2026-11-23
  - **Berkas Terkait:** `backend/src/middlewares/upload.middleware.ts`, `backend/src/controllers/upload.controller.ts`, `backend/src/routes/upload.routes.ts`
  - **Catatan Teknis:** `POST /api/v1/uploads` menerima `multipart/form-data` field `image` (JPEG/PNG/WebP, maksimal 5 MB). `sharp` menyematkan watermark diagonal permanen berisi nama organisasi, nama & WA penanggung jawab, serta timestamp WIB, lalu menyimpan JPEG ke `backend/uploads/<orgId>/<uuid>.jpg`. Penanggung jawab: uploader jika admin, admin terverifikasi pertama jika bukan admin, atau `Organization.contact` jika tidak ada admin. Respons `{ success, image: { path, url, name, watermarkText }, message }`; hasil dapat diakses lewat `/uploads/<orgId>/<nama>`.

---

### Alokasi Mahendra (BE — 20% / 4 Task)

- [x] **BE-MHD-01: API CRUD Papan Pengumuman Organisasi (`/api/v1/announcements`)**
  - **Assignee / PIC:** Mahendra (BE)
  - **Status:** `Selesai`
  - **Target Selesai:** 2026-11-26
  - **Tanggal Selesai:** 2026-11-23
  - **Berkas Terkait:** `backend/src/controllers/announcement.controller.ts`, `backend/src/routes/announcement.routes.ts`, `backend/test/announcement.test.ts`
  - **Catatan Teknis:** Endpoint `GET /` (anggota terverifikasi), `POST /` (khusus pengurus), dan `DELETE /:id` (khusus pengurus) dengan isolasi `orgId` dari header `x-organization-id`. Tidak ada endpoint update karena model `Announcement` tidak memiliki `updatedAt` dan spesifikasi hanya meminta GET/POST/DELETE. `orgId` dan `authorId` selalu diambil dari konteks autentikasi, bukan body.

- [x] **BE-MHD-02: API Struktur Organisasi & Penugasan Jabatan (`/api/v1/organizations/:id/structure`)**
  - **Assignee / PIC:** Mahendra (BE)
  - **Status:** `Selesai`
  - **Target Selesai:** 2026-11-27
  - **Tanggal Selesai:** 2026-11-23
  - **Berkas Terkait:** `backend/src/controllers/organization.controller.ts`, `backend/src/routes/organization.routes.ts`, `backend/test/organization-structure.test.ts`
  - **Catatan Teknis:** `GET /:id/structure` mengembalikan data organisasi, `leaders` (role `ADMIN`), dan `members` (role `ANGGOTA`) dari keanggotaan `TERVERIFIKASI`. `:id` wajib sama dengan header `x-organization-id`. Jabatan dan label divisi memakai `Membership.position` (misalnya `Koordinator Divisi B` → `Divisi B`); `Membership.address` tidak diekspos karena dapat berisi alamat rumah. Urutan Ketua → Sekretaris → Bendahara → lainnya. Tanpa model `Division` baru karena schema maupun mockup belum mendukung hierarki bertingkat.

- [ ] **BE-MHD-03: API Pengaturan Organisasi & Acak Kode Undangan (`/api/v1/organizations/:id/regenerate-invite`)**
  - **Assignee / PIC:** Mahendra (BE)
  - **Status:** `Belum Dimulai`
  - **Target Selesai:** 2026-11-28
  - **Tanggal Selesai:** -
  - **Berkas Terkait:** `backend/src/controllers/organization.controller.ts`
  - **Catatan Teknis:** Update profil organisasi, generate kode undangan unik baru, status aktif/nonaktif, dan audit log mutasi.

- [ ] **BE-MHD-04: API Direktori & Pembuatan Organisasi Platform Admin (`/api/v1/platform/organizations`)**
  - **Assignee / PIC:** Mahendra (BE)
  - **Status:** `Belum Dimulai`
  - **Target Selesai:** 2026-11-29
  - **Tanggal Selesai:** -
  - **Berkas Terkait:** `backend/src/controllers/platform.controller.ts`
  - **Catatan Teknis:** Khusus `platformAdmin`, menampilkan seluruh entitas organisasi terdaftar dan endpoint pembuatan organisasi baru beserta penunjukan Pengurus pertama.

---

## 5. Spesifikasi Detail Fitur Keamanan: Sensor & Watermark Identitas

```
                                  ALUR KEAMANAN DOKUMEN IDENTITAS
                                  
  [Foto KTP/KTA Asli]
          │
          ▼
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │ 1. CLIENT-SIDE CANVAS REDACTION (PIC: Wildan)                               │
  │    • Sensor kotak hitam / blur pada area NIK (kecuali 4 digit terakhir)     │
  │    • Sensor tanda tangan basah & nomor seri dokumen                         │
  │    • Hanya Nama Lengkap, Foto Wajah, & Penerbit yang dibiarkan terlihat    │
  └──────────────────────────────────────┬──────────────────────────────────────┘
                                         │
                                         ▼
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │ 2. DYNAMIC FORENSIC WATERMARKING (PIC: Wildan di FE & Saki di BE)           │
  │    • Watermark diagonal semi-transparan dibakar permanen ke piksel gambar:  │
  │      "HANYA UNTUK VERIFIKASI KEANGGOTAAN SARGA [NAMA ORGANISASI]"           │
  │    • Informasi Penanggung Jawab Resmi:                                      │
  │      "PENANGGUNG JAWAB: [NAMA KETUA / PENGURUS UTAMA]"                      │
  │      "KONTAK WA RESMI: [NOMOR HP PENGURUS]"                                 │
  │    • Timestamp Pengajuan Presisi: [YYYY-MM-DD HH:mm:ss WIB]                 │
  │    • Hash Sidik Jari Digital / UUID Dokumen                                 │
  └──────────────────────────────────────┬──────────────────────────────────────┘
                                         │
                                         ▼
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │ 3. PENYIMPANAN TERENKRIPSI & DISTRIBUSI TERKONTROL (PIC: Saki)              │
  │    • Disimpan ke Backend terenkripsi / direktori storage private            │
  │    • Hanya dapat diakses oleh Pengurus terverifikasi via Signed URL         │
  │    • Log Audit mencatat setiap kali Pengurus membuka/meninjau foto dokumen │
  └─────────────────────────────────────────────────────────────────────────────┘
```

### Format Stempel Watermark Permanen:
```
========================================================================
HANYA UNTUK VERIFIKASI KEANGGOTAAN SARGA [NAMA ORGANISASI]
PENANGGUNG JAWAB : [NAMA PENGURUS UTAMA / KETUA, e.g. H. Sudirman Santoso]
KONTAK RESMI     : [NOMOR WHATSAPP PENGURUS, e.g. 0812-0000-0001]
TANGGAL PENGAJUAN: [YYYY-MM-DD HH:mm:ss UTC+7]
KODE VERIFIKASI  : [UUID DOKUMEN / HASH SHA-256]
DILARANG KERAS MENYALAHGUNAKAN DOKUMEN INI UNTUK TUJUAN LAIN!
========================================================================
```

---
*Dokumen ini diperbarui secara berkala sebagai papan acuan sprint harian tim SARGA.*
