import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { db } from "@/db";
import { votes } from "@/db/schema";
import { submitVoteAction } from "@/lib/actions/vote";
import { getVoterSession } from "@/lib/auth/voter-session";
import { getCachedActiveCandidateById } from "@/lib/queries/cached";
import { VoteConfirmationControls } from "./submit-vote-button";

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
    <main className="min-h-dvh bg-zinc-50 px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col">
        {/* Main Card */}
        <div className="overflow-hidden rounded-3xl bg-white shadow-[0_20px_60px_-25px_rgba(0,0,0,0.18)] ring-1 ring-zinc-200/80">
          <div className="grid lg:grid-cols-[38%_62%]">
            {/* Candidate */}
            <section className="border-b border-zinc-200/70 bg-zinc-50 p-5 sm:p-7 lg:border-b-0 lg:border-r lg:p-8">
              <div className="flex h-full flex-col">
                <div>
                  <div className="mb-5">
                    <Link
                      href="/vote/candidates"
                      className="group inline-flex items-center gap-2 mb-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400 transition-colors hover:text-zinc-900"
                    >
                      <ArrowLeft className="size-4 transition-transform duration-200 group-hover:-translate-x-1" />
                      <span>Kembali ke kandidat</span>
                    </Link>

                    <h1 className="text-xl font-bold tracking-tight text-zinc-950 sm:text-2xl">
                      Konfirmasi Pilihan
                    </h1>

                    <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-zinc-500 sm:text-sm">
                      Pastikan profil kandidat dan pilihanmu sudah sesuai sebelum
                      mengirim suara.
                    </p>
                  </div>

                  {/* Photo */}
                  <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-zinc-200 shadow-sm ring-1 ring-black/5">
                    {candidate.photoUrl ? (
                      <Image
                        src={candidate.photoUrl}
                        alt={candidate.fullName}
                        fill
                        priority
                        className="object-cover object-top"
                        sizes="(max-width: 1024px) 100vw, 38vw"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200">
                        <span className="text-7xl font-bold tracking-tight text-zinc-300 sm:text-8xl">
                          {candidate.fullName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}

                    <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

                    <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                      <h2 className="text-lg font-bold leading-tight text-white sm:text-xl">
                        {candidate.fullName}
                      </h2>

                      <p className="mt-1 text-xs font-medium text-zinc-200">
                        Kelas {candidate.placementName}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Details */}
            <section className="p-5 sm:p-7 lg:max-h-[calc(100dvh-7rem)] lg:overflow-y-auto lg:p-8">
              <div className="space-y-7">
                {/* Program Kerja */}
                <div>
                  <SectionLabel>Program Kerja</SectionLabel>

                  <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/70 p-4 sm:p-5">
                    <p className="whitespace-pre-line text-sm leading-6 text-zinc-700">
                      {candidate.programKerja}
                    </p>
                  </div>
                </div>

                {/* Visi & Misi */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col">
                    <SectionLabel>Visi</SectionLabel>

                    <div className="h-full rounded-2xl border border-zinc-200/80 bg-zinc-50/70 p-4 sm:p-5">
                      <p className="text-sm leading-6 text-zinc-700">
                        {candidate.vision}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <SectionLabel>Misi</SectionLabel>

                    <div className="h-full rounded-2xl border border-zinc-200/80 bg-zinc-50/70 p-4 sm:p-5">
                      <p className="whitespace-pre-line text-sm leading-6 text-zinc-700">
                        {candidate.mission}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Confirmation */}
                <form
                  action={submitVoteAction}
                  className="rounded-2xl bg-zinc-950 p-4 text-white shadow-lg shadow-zinc-950/10 sm:p-5"
                >
                  <input
                    type="hidden"
                    name="candidateId"
                    value={candidate.id}
                  />
                  <VoteConfirmationControls
                    candidateName={candidate.fullName}
                  />
                </form>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400">
      {children}
    </h3>
  );
}
