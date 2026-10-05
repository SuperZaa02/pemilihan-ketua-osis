import { unstable_cache } from "next/cache";

import { getActiveCandidates, getActiveCandidateById } from "./candidates";
import { getActiveElection } from "./election";
import type { Election } from "@/db/schema";
import type { CandidateWithPlacement } from "./candidates";

/**
 * Data untuk halaman PUBLIK (pemilih) dibungkus unstable_cache dengan tag,
 * bukan force-dynamic:
 *  - tag "election"   -> di-update setiap data pemilihan berubah.
 *  - tag "candidates" -> di-update setiap data kandidat berubah.
 * revalidate: 10 sebagai fallback agar perubahan dari luar aplikasi
 * (mis. DB diubah manual) tetap tampil maksimal 10 detik kemudian.
 * Halaman admin TIDAK memakai fungsi ini — mereka selalu query langsung
 * agar setiap request menampilkan data terbaru (tanpa cache).
 */

export const getCachedActiveElection = unstable_cache(
  async (): Promise<Election | null> => getActiveElection(),
  ["active-election"],
  { tags: ["election"], revalidate: 10 },
);

export const getCachedActiveCandidates = unstable_cache(
  async (): Promise<CandidateWithPlacement[]> => getActiveCandidates(),
  ["active-candidates"],
  { tags: ["candidates"], revalidate: 10 },
);

export const getCachedActiveCandidateById = unstable_cache(
  async (id: string): Promise<CandidateWithPlacement | null> =>
    getActiveCandidateById(id),
  ["active-candidate-by-id"],
  { tags: ["candidates"], revalidate: 10 },
);
