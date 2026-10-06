import "dotenv/config";

import { db, client } from "./index";
import { candidates, elections, placements, voters } from "./schema";

/**
 * Seed data DEMO: placement (kelas), 3 kandidat, pemilih contoh,
 * dan pengaturan pemilihan (status draft — admin yang membuka).
 * TIDAK membuat admin — gunakan `pnpm run db:seed` untuk itu.
 * Idempotent: aman dijalankan berulang.
 */
async function main() {
  // --- Placement / kelas ---
  const placementNames = [
    "X.1", "X.2", "X.3", "X.4",
    "XI.1", "XI.2", "XI.3", "XI.4",
    "XII.1", "XII.2", "XII.3", "XII.4",
    "GURU",
  ];

  const existingPlacements = await db
    .select({ id: placements.id, name: placements.name })
    .from(placements);
  const byName = new Map(existingPlacements.map((p) => [p.name, p.id]));

  for (const name of placementNames) {
    if (byName.has(name)) continue;
    const [created] = await db
      .insert(placements)
      .values({
        name,
        type: name === "GURU" ? "teacher" : "student",
      })
      .returning({ id: placements.id });
    byName.set(name, created.id);
  }
  console.log(`${placementNames.length} placement siap.`);

  const placementId = (name: string) => byName.get(name)!;

  // --- Kandidat ---
  const candidateCount = await db.select({ id: candidates.id }).from(candidates).limit(1);
  if (candidateCount.length === 0) {
    await db.insert(candidates).values([
      {
        fullName: "Raka Pratama",
        placementId: placementId("XI.1"),
        programKerja:
          "1. Mengaktifkan kembali ekstrakurikuler yang tidur.\n2. Festival seni tahunan.\n3. Kotak aspirasi digital.\n4. Program literasi sekolah.",
        vision:
          "Mewujudkan OSIS yang aktif, kreatif, dan menjadi jembatan antara siswa dan sekolah.",
        mission:
          "1. Mengaktifkan kembali ekstrakurikuler yang tidur.\n2. Festival seni tahunan.\n3. Kotak aspirasi digital.\n4. Program literasi sekolah.",
        status: "active",
      },
      {
        fullName: "Salsabila Putri",
        placementId: placementId("XI.3"),
        programKerja:
          "1. Lomba antar-kelas bulanan.\n2. Program tutor sebaya.\n3. Perbaikan kantin sehat.",
        vision:
          "OSIS yang inklusif dan disiplin, dengan prestasi non-akademik yang meningkat.",
        mission:
          "1. Lomba antar-kelas bulanan.\n2. Program tutor sebaya.\n3. Perbaikan kantin sehat.",
        status: "active",
      },
      {
        fullName: "Dimas Anggara",
        placementId: placementId("XII.2"),
        programKerja:
          "1. Turnamen olahraga antar-kelas.\n2. Kelas musik sore.\n3. Jumat bersih.",
        vision: "Membangun budaya sportivitas dan kebersamaan di sekolah.",
        mission:
          "1. Turnamen olahraga antar-kelas.\n2. Kelas musik sore.\n3. Jumat bersih.",
        status: "active",
      },
    ]);
    console.log("3 kandidat demo dibuat.");
  } else {
    console.log("Kandidat sudah ada, dilewati.");
  }

  // --- Pemilih ---
  const voterCount = await db.select({ id: voters.id }).from(voters).limit(1);
  if (voterCount.length === 0) {
    await db.insert(voters).values([
      { fullName: "Budi Santoso", type: "student", placementId: placementId("XI.1") },
      { fullName: "Siti Aminah", type: "student", placementId: placementId("XI.1") },
      { fullName: "Agus Wijaya", type: "student", placementId: placementId("X.2") },
      { fullName: "Rina Marlina", type: "student", placementId: placementId("XII.2") },
      { fullName: "Andi Kurniawan", type: "teacher", placementId: placementId("GURU") },
      { fullName: "Sari Wulandari", type: "teacher", placementId: placementId("GURU") },
    ]);
    console.log("6 pemilih demo dibuat.");
  } else {
    console.log("Pemilih sudah ada, dilewati.");
  }

  // --- Pengaturan pemilihan ---
  const electionCount = await db.select({ id: elections.id }).from(elections).limit(1);
  if (electionCount.length === 0) {
    const startsAt = new Date();
    startsAt.setHours(8, 0, 0, 0);
    const endsAt = new Date(startsAt);
    endsAt.setHours(16, 0, 0, 0);

    await db.insert(elections).values({
      name: "Pemilihan Ketua OSIS 2026",
      status: "draft",
      startsAt,
      endsAt,
      resultsOpenAt: new Date(endsAt.getTime() + 60_000),
      // Semua kelas siswa + guru ikut (admin bisa ubah di Pengaturan).
      allowedPlacements: ["X.1", "X.2", "X.3", "X.4", "XI.1", "XI.2", "XI.3", "XI.4", "XII.1", "XII.2", "XII.3", "XII.4", "GURU"],
    });
    console.log("Pengaturan pemilihan demo dibuat (status: draft).");
  } else {
    console.log("Pengaturan pemilihan sudah ada, dilewati.");
  }
}

main()
  .then(() => client.end())
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
