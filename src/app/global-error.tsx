"use client";

import { ErrorState } from "@/components/error-state";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="id">
      <body className="min-h-screen flex flex-col bg-zinc-50 antialiased">
        <ErrorState error={error} reset={reset} />
      </body>
    </html>
  );
}
