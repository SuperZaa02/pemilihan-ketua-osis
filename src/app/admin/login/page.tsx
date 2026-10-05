import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { School } from "lucide-react";

import { LoginForm } from "@/components/admin/login-form";
import { getSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Login Admin",
};

export default async function AdminLoginPage() {
  // Defense in depth: proxy sudah redirect, ini lapisan kedua.
  const session = await getSession();
  if (session) {
    redirect("/admin");
  }

  return (
    <main className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-zinc-900">
            <School aria-hidden className="size-6 text-white" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900">
            Pemilihan Ketua OSIS
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Masuk untuk mengelola sistem pemilihan
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
