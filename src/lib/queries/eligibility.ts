import type { Election } from "@/db/schema";

export type EligibilityResult =
  | { eligible: true }
  | { eligible: false; reason: string };

/** Data minimum pemilih untuk cek eligibility. */
export type EligibilityVoter = {
  type: "student" | "teacher";
  placementName: string;
};

/**
 * Tentukan apakah seorang pemilih berhak memilih pada pemilihan tertentu.
 * Dipanggil di server pada setiap tahap alur voting — jangan pernah
 * percaya state eligibility dari client.
 *
 * Placement pemilih strict (FK ke tabel placements). Pemilihan menyimpan
 * daftar NAMA placement (kelas) yang boleh memilih di
 * election.allowedPlacements; guru ikut aturan yang sama (placement
 * "GURU" tinggal dimasukkan ke daftar tersebut).
 */
export function checkEligibility(
  voter: EligibilityVoter,
  election: Election,
  now: Date = new Date(),
): EligibilityResult {
  if (election.status !== "open") {
    return {
      eligible: false,
      reason:
        election.status === "draft"
          ? "Pemilihan belum dibuka."
          : "Pemilihan sudah ditutup.",
    };
  }

  if (now < election.startsAt) {
    return {
      eligible: false,
      reason: "Pemilihan belum dimulai.",
    };
  }

  if (now > election.endsAt) {
    return {
      eligible: false,
      reason: "Periode pemilihan sudah berakhir.",
    };
  }

  if (election.allowedPlacements.length === 0) {
    // Kosong = belum ada placement yang diizinkan (admin belum mengatur).
    return {
      eligible: false,
      reason:
        "Belum ada kelas/penempatan yang diizinkan memilih pada pemilihan ini.",
    };
  }

  const placement = voter.placementName?.trim().toUpperCase() ?? "";

  const allowed = election.allowedPlacements.some(
    (c) => c.trim().toUpperCase() === placement,
  );

  if (!allowed) {
    return {
      eligible: false,
      reason:
        voter.type === "teacher"
          ? "Guru tidak termasuk yang diizinkan memilih pada pemilihan ini."
          : `Kelas ${placement || "-"} tidak diizinkan memilih pada pemilihan ini.`,
    };
  }

  return { eligible: true };
}
