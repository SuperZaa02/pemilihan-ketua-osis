import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

import { db } from "@/db";
import { votes } from "@/db/schema";
import { submitVoteAction } from "@/lib/actions/vote";
import { getVoterSession } from "@/lib/auth/voter-session";
import { getCachedActiveCandidateById } from "@/lib/queries/cached";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return { title: "Kandidat" };
  }

  const candidate = await getCachedActiveCandidateById(id);

  return {
    title: candidate ? `Pilih ${candidate.fullName}` : "Kandidat",
  };
}

export default async function VoteConfirmPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    redirect("/vote/candidates");
  }

  const voterSession = await getVoterSession();

  if (!voterSession) {
    redirect("/vote");
  }

  const candidate = await getCachedActiveCandidateById(id);

  if (!candidate) {
    redirect("/vote/candidates?error=candidate");
  }

  const [existingVote] = await db
    .select({ id: votes.id })
    .from(votes)
    .where(eq(votes.voterId, voterSession.vid))
    .limit(1);

  if (existingVote) {
    redirect("/vote/done");
  }

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 flex flex-col min-h-screen justify-center">
      
      {/* Tombol Kembali & Header Ringkas */}
      <div className="mb-4 flex items-center justify-between">
        <Link
          href="/vote/candidates"
          className="group inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-950"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          Kembali ke kandidat
        </Link>
      </div>

      {/* CV Style Container (Simetris & Konsisten) */}
      <div className="bg-white rounded-3xl shadow-xl ring-1 ring-zinc-200/80 overflow-hidden flex flex-col lg:flex-row">
        
        {/* Kolom Kiri: Foto & Identitas Kandidat (Menyesuaikan Tinggi / Flex-1 agar simetris) */}
        <div className="lg:w-[38%] bg-zinc-50 p-6 sm:p-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-zinc-200/60">
          <div className="space-y-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-950">
                Konfirmasi Pilihan
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-zinc-500">
                Tinjau kembali profil dan visi misi kandidat dengan teliti.
              </p>
            </div>

            {/* Foto Card */}
            <div className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden bg-zinc-200 shadow-inner">
              {candidate.photoUrl ? (
                <Image
                  src={candidate.photoUrl}
                  alt={candidate.fullName}
                  fill
                  className="object-cover object-top"
                  sizes="(max-width: 1024px) 100vw, 35vw"
                  unoptimized
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200">
                  <span className="text-7xl font-bold tracking-tight text-zinc-300">
                    {candidate.fullName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                <h2 className="text-base sm:text-lg font-bold leading-snug">
                  {candidate.fullName}
                </h2>
                <p className="text-xs text-zinc-200 font-medium">
                  Kelas {candidate.placementName}
                </p>
              </div>
            </div>
          </div>

          <div className="hidden lg:block mt-6 text-[11px] text-zinc-400 text-center">
            Konfirmasi Pilihan OSIS
          </div>
        </div>

        {/* Kolom Kanan: Detail Program Kerja, Visi, Misi & Form Konfirmasi (Bisa di-scroll jika konten panjang) */}
        <div className="lg:w-[62%] max-h-[85vh] overflow-y-auto p-6 sm:p-8 space-y-6 custom-scrollbar">
          
          {/* Program Kerja */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">
              Program Kerja
            </h3>
            <div className="text-xs sm:text-sm leading-relaxed text-zinc-700 bg-zinc-50/80 p-4 rounded-xl border border-zinc-100 whitespace-pre-line">
              {candidate.programKerja}
            </div>
          </div>

          {/* Visi & Misi (Grid dalam Kolom Kanan) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                Visi
              </h3>
              <div className="text-xs sm:text-sm leading-relaxed text-zinc-700 bg-zinc-50/80 p-4 rounded-xl border border-zinc-100 h-full">
                {candidate.vision}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                Misi
              </h3>
              <div className="text-xs sm:text-sm leading-relaxed text-zinc-700 bg-zinc-50/80 p-4 rounded-xl border border-zinc-100 whitespace-pre-line h-full">
                {candidate.mission}
              </div>
            </div>
          </div>

          {/* Form Konfirmasi Suara */}
          <form
            action={submitVoteAction}
            className="rounded-2xl bg-zinc-950 p-5 sm:p-6 text-white shadow-md space-y-4"
          >
            <input
              type="hidden"
              name="candidateId"
              value={candidate.id}
            />

            <div>
              <h3 className="text-sm sm:text-base font-bold flex items-center gap-2 text-white">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                Siap memberikan suara?
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-zinc-400 leading-normal">
                Pastikan pilihan Anda sudah tepat. Suara yang dikirim tidak dapat diubah kembali.
              </p>
            </div>

            <label className="group flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3.5 transition-colors hover:bg-white/[0.08]">
              <input
                type="checkbox"
                name="confirm"
                required
                className="mt-0.5 size-4 shrink-0 rounded border-white/30 bg-transparent accent-white"
              />
              <span className="text-xs sm:text-sm leading-normal text-zinc-300">
                Saya menyatakan memilih{" "}
                <strong className="font-semibold text-white">
                  {candidate.fullName}
                </strong>{" "}
                secara sadar, jujur, dan tanpa paksaan.
              </span>
            </label>

            <button
              type="submit"
              className="h-11 w-full rounded-xl bg-white px-5 text-xs sm:text-sm font-semibold text-zinc-950 transition-all hover:bg-zinc-100 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
            >
              Konfirmasi &amp; Kirim Suara
            </button>
          </form>

        </div>

      </div>
    </main>
  );
}