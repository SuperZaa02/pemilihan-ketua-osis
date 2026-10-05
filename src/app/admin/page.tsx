import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth/session";

export default async function AdminIndexPage() {
  const session = await getSession();
  if (!session) {
    redirect("/admin/login");
  }
  redirect("/admin/dashboard");
}
