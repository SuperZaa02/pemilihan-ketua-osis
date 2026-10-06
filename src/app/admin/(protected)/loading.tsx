import { LoaderCircle } from "lucide-react";

export default function AdminLoading() {
  return (
    <section
      className="flex min-h-48 items-center justify-center"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-2 text-sm text-zinc-600">
        <LoaderCircle aria-hidden className="size-5 animate-spin" />
        Memuat halaman admin...
      </div>
    </section>
  );
}
