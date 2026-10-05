import { redirect } from "next/navigation";

import { getSession } from "./session";

/**
 * Guard untuk Server Component/Action di area admin.
 * Redirect ke /admin/login jika belum login.
 */
export async function requireAdmin() {
  const session = await getSession();
  if (!session) {
    redirect("/admin/login");
  }
  return session;
}
