"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/vote");
  }, [router]);

  return (
    <main className="flex min-h-full flex-1 items-center justify-center bg-zinc-50 px-4 py-16">
      <p className="text-sm text-zinc-600" role="status">
        Mengalihkan ke halaman voting...
      </p>
    </main>
  );
}
