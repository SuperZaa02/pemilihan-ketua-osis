import { redirect } from "next/navigation";

export const metadata = {
  title: "Pemilihan Ketua OSIS",
};

export default function HomePage() {
  redirect("/vote");
}
