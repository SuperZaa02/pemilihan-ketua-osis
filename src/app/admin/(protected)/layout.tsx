import { ChartColumn, Settings, Users, Vote } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { LogoutButton } from "@/components/admin/logout-button";
import { requireAdmin } from "@/lib/auth/require-admin";

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: ChartColumn },
  { href: "/admin/candidates", label: "Kandidat", icon: Vote },
  { href: "/admin/voters", label: "Pemilih", icon: Users },
  { href: "/admin/election", label: "Pengaturan", icon: Settings },
] as const;

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await requireAdmin();

  return (
    <div className="flex min-h-dvh flex-col bg-zinc-50">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-4 px-4">
          <Link
            href="/admin/dashboard"
            className="text-sm font-semibold tracking-tight text-zinc-900"
          >
            Pilketos OSIS
          </Link>

          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
              >
                <item.icon aria-hidden className="size-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-zinc-500 md:inline">
              {session.name}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        {children}
      </main>
    </div>
  );
}
