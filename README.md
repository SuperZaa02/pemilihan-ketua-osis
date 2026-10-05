# Pemilihan Ketua OSIS — SMAN 10 Kota Bekasi

Sistem pemilihan Ketua OSIS: Next.js (App Router) + TypeScript + PostgreSQL + Drizzle ORM + Tailwind CSS.

## Fitur

- **Autentikasi admin** — login/logout, session cookie signed HMAC (httpOnly), proteksi route 2 lapis (proxy + layout guard), **ganti password** dari halaman Pengaturan.
- **Manajemen kelas/penempatan (placement)** — tabel `placements` tersendiri: buat kelas (`X.1`, `XI.3`, `XII.5`, ...), import massal, hapus. Strict & unique — tidak ada kelas duplikat/typo. Kandidat & pemilih **wajib** memilih dari daftar ini.
- **Manajemen kandidat** — tambah, **edit**, hapus, upload foto (JPG/PNG/WebP/GIF, max 25 MB) ke S3-compatible object storage, program kerja wajib, aktif/nonaktif.
- **Manajemen pemilih** — tambah satuan, import massal (`Nama | KELAS` / `Nama` saja untuk guru), pencarian, hapus, **reset pilihan** pemilih tertentu.
- **Pengaturan pemilihan** — nama, periode (mulai/selesai), **dropdown checklist kelas yang boleh memilih** (bisa ditambah/dihapus kapan saja), status draft/open/closed, **hapus semua data pemilihan** (kandidat + pemilih + suara).
- **Alur voting publik** (`/vote`) — pilih kelas dan nama pemilih dari daftar → daftar kandidat → detail + visi misi → konfirmasi pilihan → suara tercatat.
- **Anti double-voting (anti race condition)** — dicek di 3 lapis: logika aplikasi, voting session, dan `UNIQUE(voter_id)` di tabel `votes` (level database — lapisan terakhir yang tidak bisa ditembus request paralel).
- **Eligibility otomatis** — pemilih divalidasi terhadap status pemilihan, waktu, dan daftar kelas yang diizinkan di setiap tahap (server-side). Guru ikut aturan yang sama: cukup centang placement `GURU` di pengaturan.
- **Caching cerdas** — halaman publik memakai cache (tag `election`/`candidates`, revalidate 10 detik) yang otomatis diperbarui saat admin mengubah data; **halaman admin selalu data terbaru per request** (tanpa cache).

## Tech Stack

- **Next.js 16** (App Router, Server Components, Server Actions)
- **TypeScript** (strict)
- **PostgreSQL 16** (Docker: `pilketos`, port `5433`)
- **Drizzle ORM** + `postgres-js`
- **Tailwind CSS v4** · **Lucide React** (icon) · **Zod** (validasi)
- Password hashing & session signing memakai `node:crypto` (scrypt + HMAC-SHA256).

## Setup

1. Install dependency:

   ```bash
   pnpm install
   ```

2. Salin environment variables:

   ```bash
   cp .env.example .env
   ```

   Lalu sesuaikan `DATABASE_URL`, `SESSION_SECRET`, dan konfigurasi S3-compatible storage:
   `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, serta
   `S3_SECRET_ACCESS_KEY`. `S3_PUBLIC_URL` opsional untuk URL publik bucket/CDN;
   jika kosong, aplikasi menggunakan `S3_ENDPOINT/S3_BUCKET`. Bucket atau domain
   publiknya harus dapat dibaca browser agar foto kandidat (termasuk GIF animasi)
   dapat ditampilkan. Jangan mengisi credential storage ke source code.
   **Credential admin TIDAK di env** — dibuat lewat script interaktif (langkah 3).

3. Jalankan migration & buat admin:

   ```bash
   pnpm run db:migrate
   pnpm run db:seed          # interaktif: minta email, username, nama lengkap, password
   pnpm run db:seed:demo     # opsional: data demo (placement, kandidat, pemilih, pengaturan)
   ```

   Deployment dengan database kosong? Cukup `db:migrate` → `db:seed` → aplikasi siap.
   Data pemilihan (kelas, kandidat, pemilih) diinput lewat panel admin.

4. Jalankan development server:

   ```bash
   pnpm run dev
   ```

## Scripts

| Script                       | Fungsi                                                                |
| ---------------------------- | --------------------------------------------------------------------- |
| `pnpm run dev`               | Development server                                                     |
| `pnpm run build`             | Production build                                                       |
| `pnpm run start`             | Menjalankan production build                                           |
| `pnpm run lint`              | ESLint                                                                 |
| `pnpm run typecheck`         | TypeScript (no emit)                                                   |
| `pnpm run db:generate`       | Generate migration dari schema Drizzle                                 |
| `pnpm run db:migrate`        | Terapkan migration ke database                                         |
| `pnpm run db:push`           | Push schema langsung (tanpa file migration)                            |
| `pnpm run db:studio`         | Drizzle Studio                                                         |
| `pnpm run db:seed`           | **Buat admin** (interaktif — email, username, nama, password)          |
| `pnpm run db:seed:demo`      | Seed data demo (idempotent)                                            |
| `pnpm run db:seed:delete-admin` | **Hapus admin** (interaktif, dengan konfirmasi)                     |

## Alur Pemilih

```
Landing (/) → /vote → pilih kelas
  → pilih nama pemilih dari kelas tersebut
  → /vote/candidates (daftar kandidat aktif)
  → /vote/candidates/[id] (detail + visi misi + konfirmasi)
  → submit vote (transaksional) → /vote/done
```

Eligibility dicek ulang di server pada setiap tahap: status pemilihan
(draft/open/closed), waktu mulai/selesai, dan keanggotaan kelas dalam daftar
kelas yang diizinkan. Pemilih yang sudah memilih langsung diarahkan ke `/vote/done`.

## Struktur Project

```
src/
├── app/
│   ├── page.tsx                  # Landing page (cached)
│   ├── vote/                     # Alur pemilih (identitas, kandidat, done)
│   └── admin/
│       ├── login/                # Halaman login admin
│       └── (protected)/          # Area admin (wajib session, tanpa cache)
│           ├── layout.tsx        # Shell dashboard + guard requireAdmin()
│           ├── dashboard/        # Statistik real-time
│           ├── candidates/       # CRUD kandidat (+ edit via ?edit=<id>)
│           ├── voters/           # CRUD + import + reset pilihan pemilih
│           ├── election/         # Pengaturan, kelas, ganti password, zona bahaya
│           └── results/          # Rekap suara
├── components/                   # admin/* (form CRUD), vote/*, ui.tsx
├── db/
│   ├── index.ts                  # Koneksi postgres-js + Drizzle
│   ├── schema/                   # enums, auth, candidate, election, placement, voter, vote
│   ├── migrations/               # Migration SQL (generated)
│   ├── seed.ts                   # Buat admin (interaktif)
│   ├── seed-demo.ts              # Seed data demo
│   └── delete-admin.ts           # Hapus admin (interaktif)
├── lib/
│   ├── actions/                  # Server Actions (auth, placements, candidates, voters, election, vote)
│   ├── auth/                     # password, session admin, voter session, guard
│   ├── queries/                  # Data access (election, placements, candidates, voters, eligibility, results, cached)
│   ├── env.ts                    # Validasi env server (zod)
│   └── validation.ts             # Skema validasi input (zod)
└── proxy.ts                      # Route protection /admin/* (edge)
```

## Catatan Keamanan

- **Server-first**: semua query database di Server Components/Server Actions; tidak ada client-side fetching.
- **Eligibility selalu dihitung ulang di server** — state dari client tidak pernah dipercaya.
