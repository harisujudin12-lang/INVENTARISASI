# Fix Login Error: Tenant or user not found

Gunakan panduan ini kalau deploy berhasil tetapi login admin menampilkan error database.

## Gejala

- Error di login: `FATAL: Tenant or user not found`
- Error API login dari Prisma saat query `admin.findUnique`

## Penyebab

`DATABASE_URL` pada environment Production tidak valid atau mengarah ke database yang sudah tidak ada.

## Solusi Paling Aman (Neon Free + Prisma)

1. Buat database baru di Neon (free tier).
2. Copy connection string Neon (`postgresql://...`).
3. Di Vercel -> Project -> Settings -> Environment Variables:
   - Update `DATABASE_URL` dengan string Neon baru.
   - Pastikan scope `Production` aktif.
4. Redeploy project.

## Inisialisasi Schema + Data Awal

Setelah `DATABASE_URL` diarahkan ke database baru, jalankan dari lokal:

```bash
npm run db:push
npm run db:seed
```

Data default admin dari seed:

- Username: `admin`
- Password: `admin123`

## Variabel Wajib di Vercel

- `DATABASE_URL`
- `JWT_SECRET`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

## Verifikasi Cepat

1. Buka halaman login admin.
2. Login dengan akun seed default.
3. Jika gagal, cek ulang apakah `DATABASE_URL` sudah tersimpan di **Production** (bukan hanya Preview/Development).
