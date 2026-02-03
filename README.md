# Sistem Request Barang & Inventory Gudang

Aplikasi web untuk mengelola request barang dan inventory gudang berbasis Next.js 14.

## Fitur

### Publik
- ✅ Form request barang dengan pilihan divisi dan barang
- ✅ Tracking status request via link unik
- ✅ Max 10 jenis barang per request
- ✅ Validasi qty tidak melebihi stok

### Admin
- ✅ Dashboard dengan statistik dan notifikasi
- ✅ Manajemen request (approve/reject dengan partial qty)
- ✅ Manajemen inventory (CRUD, update stok, catat barang rusak)
- ✅ Manajemen divisi
- ✅ Form builder (field dinamis)
- ✅ Riwayat perubahan stok dengan export Excel/CSV

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Styling**: Tailwind CSS
- **Auth**: JWT (jose library)
- **Export**: xlsx library

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- npm atau yarn

### Instalasi

1. Clone repository dan install dependencies:

```bash
cd INVENTARISASI
npm install
```

2. Setup environment variables:

```bash
cp .env.example .env
```

Edit file `.env` dan isi dengan konfigurasi database:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/inventory_db"
JWT_SECRET="your-secret-key-min-32-characters-long"
```

3. Setup database:

```bash
# Generate Prisma client
npx prisma generate

# Migrate database
npx prisma migrate dev --name init

# Seed data awal (admin, divisi, barang)
npx prisma db seed
```

4. Jalankan development server:

```bash
npm run dev
```

5. Buka aplikasi di browser:
   - Public: http://localhost:3000
   - Admin: http://localhost:3000/admin

### Default Admin

- Username: `admin`
- Password: `admin123`

> ⚠️ Segera ganti password setelah login pertama kali!

## Struktur Folder

```
src/
├── app/
│   ├── api/              # API Routes
│   │   ├── admin/        # Admin APIs (protected)
│   │   └── public/       # Public APIs
│   ├── admin/            # Admin pages
│   └── (public)/         # Public pages
├── components/
│   └── ui/               # Reusable UI components
├── lib/
│   ├── auth.ts          # JWT authentication
│   ├── constants.ts     # App constants
│   ├── prisma.ts        # Prisma client
│   └── utils.ts         # Utility functions
├── services/            # Business logic
└── types/               # TypeScript types
```

## Database Schema

### Models

- **Admin**: User admin
- **Division**: Divisi/departemen
- **Item**: Barang inventory
- **FormField**: Field dinamis form
- **Request**: Request barang
- **RequestItem**: Item dalam request
- **StockHistory**: Riwayat perubahan stok
- **Notification**: Notifikasi admin
- **RequestCounter**: Counter nomor request per tahun

## API Endpoints

### Public

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | /api/public/form | Get form data (divisi, barang, fields) |
| POST | /api/public/requests | Submit request baru |
| GET | /api/public/track/[token] | Track status request |

### Admin

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | /api/auth/login | Login admin |
| POST | /api/auth/logout | Logout admin |
| GET | /api/admin/dashboard | Dashboard data |
| GET/POST | /api/admin/requests | List/create requests |
| GET | /api/admin/requests/[id] | Detail request |
| POST | /api/admin/requests/[id]/approve | Approve request |
| POST | /api/admin/requests/[id]/reject | Reject request |
| GET/POST | /api/admin/items | List/create items |
| PUT | /api/admin/items/[id] | Update item |
| PUT | /api/admin/items/[id]/stock | Update stok |
| POST | /api/admin/items/[id]/damaged | Catat rusak |
| GET/POST | /api/admin/divisions | List/create divisi |
| PUT/DELETE | /api/admin/divisions/[id] | Update/delete divisi |
| GET/POST | /api/admin/form-fields | List/create field |
| PUT/DELETE | /api/admin/form-fields/[id] | Update/delete field |
| GET | /api/admin/history | Riwayat stok |
| GET | /api/admin/history/export | Export riwayat |
| GET | /api/admin/notifications | List notifikasi |
| POST | /api/admin/notifications/[id]/read | Tandai dibaca |
| POST | /api/admin/notifications/read-all | Tandai semua dibaca |

## Deployment (Vercel)

1. Push ke GitHub repository

2. Import project di Vercel

3. Set environment variables di Vercel:
   - `DATABASE_URL`: Vercel Postgres connection string
   - `JWT_SECRET`: Random secret key

4. Deploy!

## License

MIT License
