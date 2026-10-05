import { redirect } from "next/navigation";

export const metadata = {
  title: "Mengalihkan...",
  description:
    "Sistem pemilihan Ketua OSIS SMAN 10 Kota Bekasi — sederhana, cepat, dan aman.",
};

export default async function LandingPage() {
  return redirect("/vote");
}
