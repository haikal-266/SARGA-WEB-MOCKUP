# Laporan Pengujian Sistem SARGA (`Test Report`)

**Tanggal Pengujian:** 2026-11-27  
**Cakupan:** `backend/` (kompilasi TypeScript + 14 suite integrasi API Vitest/Supertest) dan `frontend/` (build produksi Angular 19 AOT + audit statis rute/layanan + **Live Browser E2E Web Crawler** di `http://localhost:4201` terhubung ke backend `http://localhost:5000`, untuk Desktop `1280×800` dan Mobile `375×812`)  
**Daftar Defect:** [qa-defects.md](file:///c:/Users/KallKun/Desktop/Sarga%20DOC/WEB%20MOCKUP/docs/qa-defects.md)

---

## 1. Ringkasan Eksekusi

| Lapisan | Jenis Pengujian | Hasil | Rincian |
|---|---|---|---|
| **Backend API (`tsc`)** | Kompilasi TypeScript (`npm --prefix backend run build`) | **PASS** | `0` error |
| **Backend Integration (`vitest`)** | Suite API + Prisma SQLite `test.db` (`npm --prefix backend test`) | **PASS** | **14 file uji**, **119 skenario tes lulus** (`49.38s`) |
| **Frontend Build (`ng build`)** | Kompilasi AOT & bundling produksi (`npm --prefix frontend run build`) | **PASS** | `0` error (`577.08 kB` initial, `27.58 kB` CSS) |
| **Audit Statis Rute & API** | Cross-check `app.routes.ts`, semua `routerLink`/`navigate`, service HTTP vs rute Express, & error handler | **PASS** | `0` tautan mati; seluruh endpoint cocok; state `loading`/`busy`/`saving`/`submitting` ter-reset di `error:` |
| **Live Browser E2E Crawl (Chrome/Brave)** | Crawl lintas peran (Tamu, Anggota, Pengurus) di `http://localhost:4201` + Desktop `1280×800` & Mobile `375×812` | **PASS** | Seluruh `DEF-01` s.d. `DEF-11` diperbaiki & diverifikasi ulang; `0` JS error, `0` HTTP `401`/`404`/`500`/CORS error |
| **Frontend Unit Tests (`ng test`)** | Unit test komponen/service | **TIDAK TERSEDIA** | Belum ada berkas `*.spec.ts` di [frontend/src](file:///c:/Users/KallKun/Desktop/Sarga%20DOC/WEB%20MOCKUP/frontend/src) |

---

## 2. Rincian Hasil Uji Integrasi Backend (`14 File Uji / 119 Tes — 100% Lulus`)

Seluruh suite dijalankan menggunakan `vitest run` terhadap basis data uji terisolasi (`backend/prisma/test.db`):

| File Uji | Jml Tes | Durasi | Fitur & Aturan Bisnis yang Terverifikasi |
|---|---|---|---|
| [auth-items.test.ts](file:///c:/Users/KallKun/Desktop/Sarga%20DOC/WEB%20MOCKUP/backend/test/auth-items.test.ts) | **6** | `1204ms` | `GET /api/health`, `GET /api/v1/auth/invite/:code` (prioritas `Ketua`, tolak org nonaktif `404` & kode kedaluwarsa `400`), `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `PUT /auth/password`, `POST /items`, `GET /items?q=`, validasi `isSafeAndReady` & `maxDays` (`1–14`), `GET /items/:id`. |
| [org-isolation.test.ts](file:///c:/Users/KallKun/Desktop/Sarga%20DOC/WEB%20MOCKUP/backend/test/org-isolation.test.ts) | **3** | `700ms` | Isolasi katalog & detail barang lintas organisasi (`x-organization-id`). |
| [loan.test.ts](file:///c:/Users/KallKun/Desktop/Sarga%20DOC/WEB%20MOCKUP/backend/test/loan.test.ts) | **9** | `2310ms` | `POST /api/v1/loans`: status awal `MENUNGGU`, blokir pinjam milik sendiri, batas `maxDays`, tanggal lampau, item `DIPINJAM`, pengajuan ganda. |
| [loan-list.test.ts](file:///c:/Users/KallKun/Desktop/Sarga%20DOC/WEB%20MOCKUP/backend/test/loan-list.test.ts) | **6** | `2025ms` | `GET /loans/me` & `GET /loans`, filter status/cari, flag `isOverdue`/`daysOverdue`, isolasi organisasi. |
| [loan-approve.test.ts](file:///c:/Users/KallKun/Desktop/Sarga%20DOC/WEB%20MOCKUP/backend/test/loan-approve.test.ts) | **8** | `3134ms` | `PATCH /loans/:id/approve` oleh pemilik/admin, transaksi atomik (`AKTIF` + `DIPINJAM`), rollback `409`, audit log. |
| [loan-decision.test.ts](file:///c:/Users/KallKun/Desktop/Sarga%20DOC/WEB%20MOCKUP/backend/test/loan-decision.test.ts) | **12** | `5803ms` | `PATCH /loans/:id/reject` (alasan ≥ 5 karakter) & `/cancel` oleh peminjam, otorisasi peran, audit log. |
| [loan-return.test.ts](file:///c:/Users/KallKun/Desktop/Sarga%20DOC/WEB%20MOCKUP/backend/test/loan-return.test.ts) | **8** | `3835ms` | `PATCH /loans/:id/return` oleh pemilik/admin, barang kembali `TERSEDIA`, rollback `409`, audit log. |
| [membership-verification.test.ts](file:///c:/Users/KallKun/Desktop/Sarga%20DOC/WEB%20MOCKUP/backend/test/membership-verification.test.ts) | **10** | `2891ms` | `GET /memberships/pending`, `PATCH /memberships/verify`, `PATCH /memberships/reject` + alasan & audit log. |
| [membership-management.test.ts](file:///c:/Users/KallKun/Desktop/Sarga%20DOC/WEB%20MOCKUP/backend/test/membership-management.test.ts) | **10** | `3169ms` | `PUT /memberships/:id` mutasi peran/jabatan, panjang jabatan ≤ 50, proteksi konkurensi pengurus tunggal (`409`). |
| [upload.test.ts](file:///c:/Users/KallKun/Desktop/Sarga%20DOC/WEB%20MOCKUP/backend/test/upload.test.ts) | **7** | `1690ms` | `POST /api/v1/uploads` watermark `sharp` + kontak PJ otomatis, penolakan non-gambar, berkas korup, dan batas `5 MB`. |
| [announcement.test.ts](file:///c:/Users/KallKun/Desktop/Sarga%20DOC/WEB%20MOCKUP/backend/test/announcement.test.ts) | **9** | `2141ms` | `GET/POST/DELETE /api/v1/announcements`, pembatasan admin, isolasi organisasi. |
| [organization-structure.test.ts](file:///c:/Users/KallKun/Desktop/Sarga%20DOC/WEB%20MOCKUP/backend/test/organization-structure.test.ts) | **9** | `2172ms` | `GET /organizations/:id/structure`, urutan Ketua→Sekretaris→Bendahara, ekstraksi divisi, privasi `address`. |
| [organization-management.test.ts](file:///c:/Users/KallKun/Desktop/Sarga%20DOC/WEB%20MOCKUP/backend/test/organization-management.test.ts) | **11** | `2278ms` | `GET/PUT /organizations/:id`, `POST regenerate-invite`, `PATCH status`, isolasi & audit log. |
| [platform-admin.test.ts](file:///c:/Users/KallKun/Desktop/Sarga%20DOC/WEB%20MOCKUP/backend/test/platform-admin.test.ts) | **11** | `3284ms` | `GET/POST /api/v1/platform/organizations` khusus `isPlatformAdmin`, penolakan pengurus biasa `403`, audit log. |

---

## 3. Ringkasan Perbaikan Defect (`DEF-01` s.d. `DEF-11` — Terverifikasi Ulang)

Rincian akar masalah dan status masing-masing defect dicatat lengkap pada [qa-defects.md](file:///c:/Users/KallKun/Desktop/Sarga%20DOC/WEB%20MOCKUP/docs/qa-defects.md):

1. **`DEF-01` (`/struktur`):** Fallback `inviteCode`/`inviteExpires` ke `activeMembership()?.organization` ([structure.component.ts](file:///c:/Users/KallKun/Desktop/Sarga%20DOC/WEB%20MOCKUP/frontend/src/app/features/structure/structure.component.ts#L808-L821), [models/index.ts](file:///c:/Users/KallKun/Desktop/Sarga%20DOC/WEB%20MOCKUP/frontend/src/app/core/models/index.ts#L32-L41)) serta perbaikan link mati `/admin-organisasi` -> `/admin-tambah-anggota`.
2. **`DEF-02` (`/admin-bagan`):** Menyetel `activeMembership` sebelum `userSubject.next` pada [auth.service.ts](file:///c:/Users/KallKun/Desktop/Sarga%20DOC/WEB%20MOCKUP/frontend/src/app/core/services/auth.service.ts#L176-L216) sehingga navigasi langsung dan hard refresh menampilkan anggota organisasi.
3. **`DEF-03` & `DEF-10` (`/assets/img/sample-ktp.svg`):** Mengganti `&nbsp;` menjadi `&#160;` dan menyesuaikan `font-size`/`letter-spacing` baris NIK pada [sample-ktp.svg](file:///c:/Users/KallKun/Desktop/Sarga%20DOC/WEB%20MOCKUP/frontend/src/assets/img/sample-ktp.svg#L36) agar tampil utuh tanpa tumpang tindih dengan bingkai pas foto.
4. **`DEF-04` (`/` & `/form-pengajuan`):** Memakai `normalizeItemImagePath` dari [item.service.ts](file:///c:/Users/KallKun/Desktop/Sarga%20DOC/WEB%20MOCKUP/frontend/src/app/core/services/item.service.ts#L65-L76) pada [home.component.ts](file:///c:/Users/KallKun/Desktop/Sarga%20DOC/WEB%20MOCKUP/frontend/src/app/features/home/home.component.ts#L379-L382) dan [loan-request.component.ts](file:///c:/Users/KallKun/Desktop/Sarga%20DOC/WEB%20MOCKUP/frontend/src/app/features/loans/loan-request.component.ts#L501-L503).
5. **`DEF-05` (`/beranda` Tamu):** Membatasi pemuatan katalog di [home.component.ts](file:///c:/Users/KallKun/Desktop/Sarga%20DOC/WEB%20MOCKUP/frontend/src/app/features/home/home.component.ts#L349-L361) hanya bagi anggota `TERVERIFIKASI` (`0` request `401`).
6. **`DEF-05B` (Backend API):** Menyelaraskan validasi register organisasi nonaktif/kedaluwarsa ([auth.controller.ts](file:///c:/Users/KallKun/Desktop/Sarga%20DOC/WEB%20MOCKUP/backend/src/controllers/auth.controller.ts)) dan rentang bilangan bulat `maxDays` `1–14` ([item.controller.ts](file:///c:/Users/KallKun/Desktop/Sarga%20DOC/WEB%20MOCKUP/backend/src/controllers/item.controller.ts)).
7. **`DEF-06` (`/katalog`):** Menambahkan `gap`, `min-width: 0`, dan `white-space: nowrap` di [catalog.component.ts](file:///c:/Users/KallKun/Desktop/Sarga%20DOC/WEB%20MOCKUP/frontend/src/app/features/catalog/catalog.component.ts#L212-L236) agar `"Lihat detail"` tidak terbungkus 2 baris.
8. **`DEF-07` (`/auth/register`):** Mengubah baris dokumen menjadi 1 kolom di [register.component.html](file:///c:/Users/KallKun/Desktop/Sarga%20DOC/WEB%20MOCKUP/frontend/src/app/features/auth/register.component.html#L201) dan merapatkan `*` pada [form-field.component.ts](file:///c:/Users/KallKun/Desktop/Sarga%20DOC/WEB%20MOCKUP/frontend/src/app/shared/form-field/form-field.component.ts#L12).
9. **`DEF-08` (Mobile `375×812`):** Menambahkan `flex-wrap: wrap` pada `.chips` di [forms-tables.css](file:///c:/Users/KallKun/Desktop/Sarga%20DOC/WEB%20MOCKUP/frontend/src/styles/forms-tables.css#L258-L262) agar seluruh chip filter tampil tanpa terpotong.
10. **`DEF-09` (`/edit-barang/:id`):** Mempertahankan opsi `"Foto unggahan barang"` pada `populateForm()` ([item-edit.component.ts](file:///c:/Users/KallKun/Desktop/Sarga%20DOC/WEB%20MOCKUP/frontend/src/app/features/items/item-edit.component.ts#L304-L320)) serta menambah input unggah foto baru ke [item-edit.component.html](file:///c:/Users/KallKun/Desktop/Sarga%20DOC/WEB%20MOCKUP/frontend/src/app/features/items/item-edit.component.html#L179-L195).
11. **`DEF-11` (`autocomplete` & Konsistensi Seed):** Menambahkan `autocomplete` pada field form auth ([register.component.html](file:///c:/Users/KallKun/Desktop/Sarga%20DOC/WEB%20MOCKUP/frontend/src/app/features/auth/register.component.html), [gabung.component.ts](file:///c:/Users/KallKun/Desktop/Sarga%20DOC/WEB%20MOCKUP/frontend/src/app/features/auth/gabung.component.ts)) dan melengkapi admin `PT Nusantara Digital` (`Siti Rahayu`) serta transaksi pinjaman aktif `ITM-003` pada [seed.ts](file:///c:/Users/KallKun/Desktop/Sarga%20DOC/WEB%20MOCKUP/backend/prisma/seed.ts) & `dev.db`. Modal `"Rincian transaksi"` `/pinjaman-saya` dan modal `"Rincian"` `/admin-monitoring` (`Escape` & tutup) terverifikasi berjalan mulus di browser.
12. **`DEF-12` (Kanvas Pratinjau Upload ID Kosong di `/auth/register` & `/gabung`):** Memperbaiki race condition antara `setTimeout` dan `provideZoneChangeDetection({ eventCoalescing: true })` di [id-watermark-canvas.component.ts](file:///c:/Users/KallKun/Desktop/Sarga%20DOC/WEB%20MOCKUP/frontend/src/app/shared/components/id-watermark-canvas/id-watermark-canvas.component.ts#L117-L202) (serta `height: auto` di [id-watermark-canvas.component.css](file:///c:/Users/KallKun/Desktop/Sarga%20DOC/WEB%20MOCKUP/frontend/src/app/shared/components/id-watermark-canvas/id-watermark-canvas.component.css#L251-L257)) dengan memanggil `this.cdr.detectChanges()` secara sinkron di dalam `this.ngZone.run(...)` sebelum `renderAndEmit()`. Kompilasi `ng build` PASS (`0` error); verifikasi visual pasca-unggah file perlu dicek langsung di browser karena `chrome_devtools/upload_file` diblokir sandbox MCP.

---

## 4. Keterbatasan Uji & Catatan Arsitektur

- `chrome_devtools/upload_file` ditolak sandbox MCP (`Access denied: path ... is not within any of the configured workspace roots`) dan `evaluate_script` diblokir aturan izin pengguna; unggah `<canvas>` browser tidak bisa dieksekusi otomatis *(endpoint `/api/v1/uploads` lulus 7 skenario tes backend di [upload.test.ts](file:///c:/Users/KallKun/Desktop/Sarga%20DOC/WEB%20MOCKUP/backend/test/upload.test.ts))*.
- Form mutasi permanen (`register`, `create item`, `create/approve/return loan`) tidak di-submit langsung via UI agar `dev.db` tetap rapi; seluruh transisi status diuji lewat 43 tes `loan*.test.ts`.
- DevTools masih mencatat 1 hint atribut `autocomplete` di luar form auth (pada halaman `/edit-barang/...`).
- [gabung.component.ts](file:///c:/Users/KallKun/Desktop/Sarga%20DOC/WEB%20MOCKUP/frontend/src/app/features/auth/gabung.component.ts), [item-edit.component.html](file:///c:/Users/KallKun/Desktop/Sarga%20DOC/WEB%20MOCKUP/frontend/src/app/features/items/item-edit.component.html), dan [member-add.component.ts](file:///c:/Users/KallKun/Desktop/Sarga%20DOC/WEB%20MOCKUP/frontend/src/app/features/admin/member-add.component.ts) masih memakai penyimpanan lokal `localStorage`; [platform-directory.component.ts](file:///c:/Users/KallKun/Desktop/Sarga%20DOC/WEB%20MOCKUP/frontend/src/app/features/admin/platform-directory.component.ts) belum menyediakan UI buat organisasi baru.
