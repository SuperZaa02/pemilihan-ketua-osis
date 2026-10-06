import { LoaderCircle } from "lucide-react";

export default function Loading() {
  return (
    <main
      className="flex flex-1 items-center justify-center px-4 py-12"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-2 text-sm text-zinc-600">
        <LoaderCircle aria-hidden className="size-5 animate-spin" />
        Memuat halaman...
      </div>
    </main>
  );
}
