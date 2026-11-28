# SARGA — Sistem Inventaris & Peminjaman Komunitas

Platform peminjaman dan pencatatan inventaris barang bersama untuk komunitas, RT/RW, kantor, dan organisasi.

## Struktur Proyek

```
.
├── api/                 # Entrypoint Serverless Function untuk Vercel (/api/*)
├── backend/             # Express + TypeScript + Prisma ORM
├── frontend/            # Angular 19 SPA
├── vercel.json          # Konfigurasi build & routing FE + BE di Vercel
└── README.md
```

## Menjalankan Secara Lokal

### 1. Backend (`backend/`)
```bash
cd backend
npm install
cp .env.example .env
npx prisma generate
npx prisma db push
npm run prisma:seed
npm run dev
```
Backend berjalan di `http://localhost:5000` (`GET /api/health`).

### 2. Frontend (`frontend/`)
```bash
cd frontend
npm install
npm start
```
Frontend berjalan di `http://localhost:4200`.

### 3. Menjalankan Tes Backend
```bash
cd backend
npm test
```

## Deploy Gratis ke Vercel (Frontend + Backend)

Proyek ini sudah dikonfigurasi di `vercel.json` dan `api/index.js` agar **Frontend Angular** dan **Backend Express** berjalan dalam satu proyek Vercel gratis.

> **Penting untuk Vercel Serverless:** Karena Vercel tidak memiliki penyimpanan disk permanen untuk SQLite (`dev.db`) maupun folder `uploads/`, gunakan database **PostgreSQL gratis** (seperti [Neon](https://neon.tech) atau [Supabase](https://supabase.com)).

1. Buat database PostgreSQL gratis di Neon / Supabase dan salin connection string `DATABASE_URL`.
2. Dorong skema PostgreSQL dan seed data awal dari komputer lokal:
   ```bash
   cd backend
   # Set DATABASE_URL ke PostgreSQL production terlebih dahulu
   npx prisma db push --schema=prisma/schema.postgres.prisma
   npx ts-node prisma/seed.ts
   ```
   *(Jika Anda menjalankan `seed.ts` dengan client Postgres, pastikan sudah menjalankan `npx prisma generate --schema=prisma/schema.postgres.prisma` lebih dulu; untuk kembali ke dev lokal jalankan `npx prisma generate`.)*
3. Impor repo ke **Vercel** (Framework Preset: `Other`, Root Directory: `.`) lalu isi **Environment Variables**:
   - `DATABASE_URL` = connection string PostgreSQL
   - `JWT_SECRET` = string acak rahasia
   - *(Opsional)* `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` — jika tidak diisi, unggahan gambar di Vercel otomatis dikompresi sebagai JPEG Data URL agar tetap tersimpan di PostgreSQL.
4. Deploy. Frontend akan tersaji di `/` dan seluruh API di `/api/v1/*`.
