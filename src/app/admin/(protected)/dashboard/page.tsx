import { CircleDot } from "lucide-react";
import Link from "next/link";

import { Card, StatusBadge } from "@/components/ui";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getActiveCandidates } from "@/lib/queries/candidates";
import { getActiveElection } from "@/lib/queries/election";
import { getElectionResults } from "@/lib/queries/results";

export const metadata = {
  title: "Beranda",
};

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await requireAdmin();

  // Semua data diambil paralel di server — satu round-trip render.
  const [election, activeCandidates, results] = await Promise.all([
    getActiveElection(),
    getActiveCandidates(),
    getElectionResults(),
  ]);

  const stats = [
    { label: "Kandidat Aktif", value: activeCandidates.length },
    { label: "Pemilih Terdaftar", value: results.totalVoters },
    { label: "Suara Masuk", value: results.totalVotes },
    { label: "Partisipasi", value: `${results.turnoutPercent}%` },
  ];

  return (
    <section className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Selamat datang, {session.name}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Panel administrasi sistem pemilihan Ketua OSIS.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-4">
            <p className="text-xs uppercase tracking-wide text-zinc-400">
              {stat.label}
            </p>
            <p className="mt-1 text-2xl font-semibold text-zinc-900">
              {stat.value}
            </p>
          </Card>
        ))}
      </div>

      {election ? (
        <Card className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-medium text-zinc-900">{election.name}</h2>
              <StatusBadge status={election.status} />
            </div>
            <p className="mt-1 text-sm text-zinc-500">
              {new Intl.DateTimeFormat("id-ID", {
                dateStyle: "long",
                timeStyle: "short",
              }).format(election.startsAt)}
              {" — "}
              {new Intl.DateTimeFormat("id-ID", {
                dateStyle: "long",
                timeStyle: "short",
              }).format(election.endsAt)}
            </p>
          </div>
          <Link
            href="/admin/election"
            className="flex items-center gap-1.5 rounded-md border border-zinc-200 px-3.5 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
          >
            <CircleDot aria-hidden className="size-4" />
            Kelola Status
          </Link>
        </Card>
      ) : (
        <Card className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div>
            <h2 className="font-medium text-zinc-900">
              Belum ada pengaturan pemilihan
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Atur periode dan target pemilih sebelum membuka pemilihan.
            </p>
          </div>
          <Link
            href="/admin/election"
            className="rounded-md bg-zinc-900 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
          >
            Atur Sekarang
          </Link>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            href: "/admin/candidates",
            title: "Kandidat",
            description: "Kelola data calon Ketua OSIS.",
          },
          {
            href: "/admin/voters",
            title: "Pemilih",
            description: "Kelola daftar pemilih terdaftar.",
          },
          {
            href: "/admin/election",
            title: "Pengaturan",
            description: "Atur periode & aturan pemilihan.",
          },
          {
            href: "/admin/results",
            title: "Hasil",
            description: "Lihat rekap suara real-time.",
          },
        ].map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="h-full p-5 transition-colors hover:border-zinc-300">
              <h3 className="font-medium text-zinc-900">{item.title}</h3>
              <p className="mt-1 text-sm text-zinc-500">{item.description}</p>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
