import { redirect } from "next/navigation";

export const metadata = {
  title: "Pemilihan Ketua OSIS",
  description:
    "Sistem pemilihan Ketua OSIS SMAN 10 Kota Bekasi — sederhana, cepat, dan aman.",
};

export default async function LandingPage() {
  return redirect("/vote");
}
