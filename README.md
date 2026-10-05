# Pemilihan Ketua OSIS — SMAN 10 Kota Bekasi

Sistem pemilihan Ketua OSIS: Next.js (App Router) + TypeScript + PostgreSQL + Drizzle ORM + Tailwind CSS.

## Tech Stack

- **Next.js 16** (App Router, Server Components, Server Actions)
- **TypeScript** (strict)
- **PostgreSQL 16** (Docker: `pilketos`, port `5433`)
- **Drizzle ORM** + `postgres-js`
- **Tailwind CSS v4**
- **Lucide React** (icon)
- Password hashing & session signing memakai `node:crypto` (scrypt + HMAC-SHA256) — tanpa dependency tambahan.

## Setup

1. Install dependency:

   ```bash
   pnpm install
   ```

2. Salin environment variables:

   ```bash
   cp .env.example .env
   ```

   Lalu sesuaikan `SESSION_SECRET`, `ADMIN_USERNAME`, dan `ADMIN_PASSWORD`.

3. Jalankan migration & seed admin:

   ```bash
   pnpm run db:migrate
   pnpm run db:seed
   ```

4. Jalankan development server:

   ```bash
   pnpm run dev
   ```

## Scripts

| Script                | Fungsi                                        |
| --------------------- | --------------------------------------------- |
| `pnpm run dev`        | Development server                            |
| `pnpm run build`      | Production build                              |
| `pnpm run start`      | Menjalankan production build                  |
| `pnpm run lint`       | ESLint                                        |
| `pnpm run typecheck`  | TypeScript (no emit)                          |
| `pnpm run db:generate`| Generate migration dari schema Drizzle        |
| `pnpm run db:migrate` | Terapkan migration ke database                |
| `pnpm run db:push`    | Push schema langsung (tanpa file migration)   |
| `pnpm run db:studio`  | Drizzle Studio                                |
| `pnpm run db:seed`    | Seed/update admin awal (idempotent)           |

## Struktur Project

```
src/
├── app/
│   ├── page.tsx                  # Landing page (pintu masuk pemilih)
│   ├── vote/                     # Placeholder alur pemilih
│   └── admin/
│       ├── login/                # Halaman login admin
│       └── (protected)/          # Area admin (wajib session)
│           ├── layout.tsx        # Shell dashboard + guard requireAdmin()
│           ├── dashboard/
│           ├── candidates/       # Placeholder (tahap berikutnya)
│           ├── voters/           # Placeholder (tahap berikutnya)
│           └── election/         # Placeholder (tahap berikutnya)
├── components/admin/             # Client components (login form, logout)
├── db/
│   ├── index.ts                  # Koneksi postgres-js + Drizzle
│   ├── schema/                   # Drizzle schema (auth, voter, election)
│   ├── migrations/               # Migration SQL (generated)
│   └── seed.ts                   # Seed admin awal
├── lib/
│   ├── actions/auth.ts           # Server Actions: login & logout
│   ├── auth/
│   │   ├── password.ts           # Hash/verify scrypt
│   │   ├── session.ts            # Cookie session signed HMAC
│   │   └── require-admin.ts      # Guard halaman admin
│   ├── env.ts                    # Validasi env server (zod)
│   └── validation.ts             # Skema validasi input (zod)
└── proxy.ts                      # Route protection /admin/* (edge)
```

## Catatan Arsitektur

- **Server-first**: semua query database berjalan di Server Components/Server Actions. Tidak ada client-side fetching.
- **Session**: cookie `httpOnly` + `sameSite=lax` + `secure` di production, payload signed HMAC-SHA256, kedaluwarsa 8 jam. Secret hanya ada di server.
- **Password**: scrypt (N=16384) dengan salt per-user, format self-describing agar parameter bisa dinaikkan di masa depan.
- **Route protection**: dua lapis — `proxy.ts` (edge, cek cookie) dan `requireAdmin()` di layout (verifikasi signature).
- **Validasi**: semua input divalidasi di server dengan zod; validasi HTML di form hanya untuk UX.
- **Desain anti double-voting**: tabel `voters` unik per (nama, penempatan); kolom `has_voted` akan dipakai oleh fitur voting nantinya.

## Credential Admin Awal

Diatur lewat `.env` (lihat `.env.example`), dipakai oleh `pnpm run db:seed`:

```
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="change-this-password"
ADMIN_NAME="Administrator"
```

Seed idempotent: jika admin sudah ada, password & nama diperbarui.
