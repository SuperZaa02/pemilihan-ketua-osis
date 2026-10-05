import "dotenv/config";

import { db, client } from "./index";
import { candidates, elections, voters, admins } from "./schema";
import { hashPassword } from "../lib/auth/password";

/**
 * Seed data demo lengkap: admin, 3 kandidat, pemilih contoh,
 * dan pengaturan pemilihan (status draft — admin yang membuka).
 * Idempotent: aman dijalankan berulang.
 */
async function main() {
  // --- Admin ---
  const username = (process.env.ADMIN_USERNAME ?? "admin").toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "admin12345";
  const name = process.env.ADMIN_NAME ?? "Administrator";

  const existingAdmin = await db.select({ id: admins.id }).from(admins).limit(1);

  if (existingAdmin.length === 0) {
    await db
      .insert(admins)
      .values({ username, passwordHash: hashPassword(password), name });
    console.log(`Admin "${username}" dibuat.`);
  } else {
    console.log("Admin sudah ada, dilewati.");
  }

  // --- Kandidat ---
  const candidateCount = await db.select({ id: candidates.id }).from(candidates).limit(1);
  if (candidateCount.length === 0) {
    await db.insert(candidates).values([
      {
        fullName: "Raka Pratama",
        className: "XI RPL 1",
        bio: "Putra dari pasangan Bpk. Hendra & Ibu Wati. Aktif di ekstrakurikuler basket dan OSIS.",
        vision:
          "Mewujudkan OSIS yang aktif, kreatif, dan menjadi jembatan antara siswa dan sekolah.",
        mission:
          "1. Mengaktifkan kembali ekstrakurikuler yang tidur.\n2. Festival seni tahunan.\n3. Kotak aspirasi digital.\n4. Program literasi sekolah.",
        status: "active",
      },
      {
        fullName: "Salsabila Putri",
        className: "XI MIPA 2",
        bio: "Putri dari pasangan Bpk. Ahmad & Iu Rina. Ketua kelas 2 periode, aktif debat.",
        vision: "OSIS yang inklusif dan disiplin, dengan prestasi non-akademik yang meningkat.",
        mission:
          "1. Lomba antar-kelas bulanan.\n2. Program tutor sebaya.\n3.perbaikan kantin sehat.",
        status: "active",
      },
      {
        fullName: "Dimas Anggara",
        className: "X IPS 1",
        bio: "Putra dari pasangan Bpk. Surya & Ibu Melati. Atlet renang provinsi.",
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
      { fullName: "Budi Santoso", type: "student", placement: "XI RPL 1" },
      { fullName: "Siti Aminah", type: "student", placement: "XI RPL 1" },
      { fullName: "Agus Wijaya", type: "student", placement: "X TKJ 2" },
      { fullName: "Rina Marlina", type: "student", placement: "X IPS 1" },
      { fullName: "Pak Andi", type: "teacher", placement: "GURU" },
      { fullName: "Bu Sari", type: "teacher", placement: "GURU" },
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
      allowedClasses: ["X", "XI", "XII"],
      allowTeachers: true,
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
