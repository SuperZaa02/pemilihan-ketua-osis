import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { votes } from "@/db/schema";
import { submitVoteAction } from "@/lib/actions/vote";
import { getVoterSession } from "@/lib/auth/voter-session";
import { getActiveCandidateById } from "@/lib/queries/candidates";

export const metadata: Metadata = {
  title: "Konfirmasi Pilihan | Pemilihan Ketua OSIS",
};

export const dynamic = "force-dynamic";

export default async function VoteConfirmPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // UUID valid? kalau tidak, tolak sebelum query.
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    redirect("/vote/candidates");
  }

  const voterSession = await getVoterSession();
  if (!voterSession) {
    redirect("/vote");
  }

  const candidate = await getActiveCandidateById(id);
  if (!candidate) {
    redirect("/vote/candidates?error=candidate");
  }

  // Sudah memilih? tidak boleh lagi.
  const [existingVote] = await db
    .select({ id: votes.id })
    .from(votes)
    .where(eq(votes.voterId, voterSession.vid))
    .limit(1);

  if (existingVote) {
    redirect("/vote/done");
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
      <Link
        href="/vote/candidates"
        className="mb-4 inline-flex items-center gap-1 text-sm text-zinc-500 transition-colors hover:text-zinc-900"
      >
        ← Kembali ke daftar kandidat
      </Link>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="flex items-center gap-4 border-b border-zinc-100 p-5">
          <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-zinc-100">
            {candidate.photoUrl ? (
              <Image
                src={candidate.photoUrl}
                alt={candidate.fullName}
                fill
                className="object-cover"
                sizes="64px"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-xl font-semibold text-zinc-400">
                {candidate.fullName.charAt(0)}
              </div>
            )}
          </div>
          <div>
            <h1 className="text-lg font-semibold text-zinc-900">
              {candidate.fullName}
            </h1>
            <p className="text-sm text-zinc-500">{candidate.className}</p>
          </div>
        </div>

        <div className="flex flex-col gap-4 p-5">
          {candidate.bio && (
            <div>
              <h2 className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                Identitas
              </h2>
              <p className="mt-1 text-sm text-zinc-700">{candidate.bio}</p>
            </div>
          )}

          <div>
            <h2 className="text-xs font-medium uppercase tracking-wide text-zinc-400">
              Visi
            </h2>
            <p className="mt-1 text-sm text-zinc-700">{candidate.vision}</p>
          </div>

          <div>
            <h2 className="text-xs font-medium uppercase tracking-wide text-zinc-400">
              Misi
            </h2>
            <p className="mt-1 whitespace-pre-line text-sm text-zinc-700">
              {candidate.mission}
            </p>
          </div>
        </div>

        <form
          action={submitVoteAction}
          className="flex flex-col gap-3 border-t border-zinc-100 bg-zinc-50 p-5"
        >
          <input type="hidden" name="candidateId" value={candidate.id} />
          <label className="flex items-start gap-2 text-sm text-zinc-700">
            <input
              type="checkbox"
              name="confirm"
              required
              className="mt-0.5 size-4 rounded border-zinc-300"
            />
            Saya menyatakan memilih{" "}
            <strong>{candidate.fullName}</strong> secara sadar dan tanpa paksaan.
            Pilihan ini tidak dapat diubah.
          </label>
          <button
            type="submit"
            className="h-10 w-full rounded-md bg-zinc-900 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
          >
            Kirim Suara
          </button>
        </form>
      </div>
    </main>
  );
}
