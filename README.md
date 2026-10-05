# Pemilihan Ketua OSIS — SMAN 10 Kota Bekasi

Sistem pemilihan Ketua OSIS: Next.js (App Router) + TypeScript + PostgreSQL + Drizzle ORM + Tailwind CSS.

## Fitur (MVP)

- **Autentikasi admin** — login/logout, session cookie signed HMAC (httpOnly), proteksi route 2 lapis (proxy + layout guard).
- **Manajemen kandidat** — CRUD lengkap + upload foto (JPG/PNG/WebP, max 2 MB) + aktif/nonaktif.
- **Manajemen pemilih** — tambah satuan, import massal (`Nama | student | KELAS` / `Nama | teacher`), pencarian, hapus.
- **Pengaturan pemilihan** — nama, periode (mulai/selesai), kelas yang boleh memilih, izin guru, status draft/open/closed.
- **Alur voting publik** (`/vote`) — identitas → konfirmasi → daftar kandidat → detail + visi misi → konfirmasi pilihan → suara tercatat.
- **Anti double-voting** — dicek di 3 lapis: logika aplikasi, voting session, dan `UNIQUE(voter_id)` di tabel `votes` (level database).
- **Eligibility otomatis** — pemilih divalidasi terhadap status pemilihan, waktu, tingkat kelas, dan izin guru di setiap tahap (server-side).
- **Hasil real-time** — rekap suara per kandidat, partisipasi, suara guru, reset hasil.

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

   Lalu sesuaikan `SESSION_SECRET`, `ADMIN_USERNAME`, dan `ADMIN_PASSWORD`.

3. Jalankan migration & seed:

   ```bash
   pnpm run db:migrate
   pnpm run db:seed          # admin awal
   pnpm run db:seed:demo     # opsional: 3 kandidat + 6 pemilih + pengaturan demo
   ```

4. Jalankan development server:

   ```bash
   pnpm run dev
   ```

## Scripts

| Script                 | Fungsi                                      |
| ---------------------- | ------------------------------------------- |
| `pnpm run dev`         | Development server                          |
| `pnpm run build`       | Production build                            |
| `pnpm run start`       | Menjalankan production build                |
| `pnpm run lint`        | ESLint                                      |
| `pnpm run typecheck`   | TypeScript (no emit)                        |
| `pnpm run db:generate` | Generate migration dari schema Drizzle      |
| `pnpm run db:migrate`  | Terapkan migration ke database              |
| `pnpm run db:push`     | Push schema langsung (tanpa file migration) |
| `pnpm run db:studio`   | Drizzle Studio                              |
| `pnpm run db:seed`     | Seed/update admin awal (idempotent)         |
| `pnpm run db:seed:demo`| Seed data demo (idempotent)                 |

## Alur Pemilih

```
Landing (/) → /vote → isi nama + kelas
  → validasi & konfirmasi identitas
  → /vote/candidates (daftar kandidat aktif)
  → /vote/candidates/[id] (detail + visi misi + konfirmasi)
  → submit vote (transaksional) → /vote/done
```

Eligibility dicek ulang di server pada setiap tahap: status pemilihan
(draft/open/closed), waktu mulai/selesai, tingkat kelas, dan izin guru.
Pemilih yang sudah memilih langsung diarahkan ke `/vote/done`.

## Struktur Project

```
src/
├── app/
│   ├── page.tsx                  # Landing page
│   ├── vote/                     # Alur pemilih (identitas, kandidat, done)
│   └── admin/
│       ├── login/                # Halaman login admin
│       └── (protected)/          # Area admin (wajib session)
│           ├── layout.tsx        # Shell dashboard + guard requireAdmin()
│           ├── dashboard/        # Statistik real-time
│           ├── candidates/       # CRUD kandidat
│           ├── voters/           # CRUD + import pemilih
│           ├── election/         # Pengaturan & status pemilihan
│           └── results/          # Rekap suara
├── components/                   # admin/* (form CRUD), vote/*, ui.tsx
├── db/
│   ├── index.ts                  # Koneksi postgres-js + Drizzle
│   ├── schema/                   # enums, auth, candidate, election, voter, vote
│   ├── migrations/               # Migration SQL (generated)
│   ├── seed.ts                   # Seed admin
│   └── seed-demo.ts              # Seed data demo
├── lib/
│   ├── actions/                  # Server Actions (auth, candidates, voters, election, vote)
│   ├── auth/                     # password, session admin, voter session, guard
│   ├── queries/                  # Data access (election, candidates, voters, eligibility, results)
│   ├── env.ts                    # Validasi env server (zod)
│   └── validation.ts             # Skema validasi input (zod)
└── proxy.ts                      # Route protection /admin/* (edge)
```

## Catatan Keamanan

- **Server-first**: semua query database di Server Components/Server Actions; tidak ada client-side fetching.
- **Eligibility selalu dihitung ulang di server** — state dari client tidak pernah dipercaya.
- **Password**: scrypt (N=16384) + salt per-user, format self-describing.
- **Session**: cookie `httpOnly` + `sameSite=lax` + `secure` di production, signed HMAC-SHA256, exp 8 jam (admin) / 30 menit (voter).
- **Upload foto**: validasi tipe MIME & ukuran di server, nama file digenerate server (UUID).
- **Semua query parameterized** melalui Drizzle; input divalidasi zod di server.
- **Satu pemilih satu suara** dijamin `UNIQUE(voter_id)` di level database.
