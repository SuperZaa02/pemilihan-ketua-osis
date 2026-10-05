import type { Election, Voter } from "@/db/schema";

export type EligibilityResult =
  | { eligible: true }
  | { eligible: false; reason: string };

/**
 * Tentukan apakah seorang pemilih berhak memilih pada pemilihan tertentu.
 * Dipanggil di server pada setiap tahap alur voting — jangan pernah
 * percaya state eligibility dari client.
 */
export function checkEligibility(
  voter: Pick<Voter, "type" | "placement">,
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

  if (voter.type === "teacher") {
    if (!election.allowTeachers) {
      return {
        eligible: false,
        reason: "Guru tidak terdaftar sebagai pemilih pada pemilihan ini.",
      };
    }
    return { eligible: true };
  }

  // Pemilih siswa: cek apakah tingkat kelasnya diizinkan.
  // Placement contoh: "XI RPL 1" -> tingkat "XI".
  const grade = voter.placement.trim().split(/\s+/)[0]?.toUpperCase() ?? "";

  if (election.allowedClasses.length === 0) {
    // Kosong = tidak ada siswa yang diizinkan (admin belum mengatur).
    return {
      eligible: false,
      reason: "Belum ada kelas yang diizinkan memilih pada pemilihan ini.",
    };
  }

  const allowed = election.allowedClasses.some(
    (c) => c.trim().toUpperCase() === grade,
  );

  if (!allowed) {
    return {
      eligible: false,
      reason: `Kelas ${grade || "-"} tidak diizinkan memilih pada pemilihan ini.`,
    };
  }

  return { eligible: true };
}
