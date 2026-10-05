import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-zinc-200 bg-white shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-zinc-500">{description}</p>
        )}
      </div>
      {action}
    </header>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center">
      <p className="text-sm text-zinc-500">{message}</p>
    </div>
  );
}

export function StatusBadge({
  status,
}: {
  status: "active" | "inactive" | "draft" | "open" | "closed";
}) {
  const styles: Record<string, string> = {
    active: "bg-emerald-50 text-emerald-700 border-emerald-200",
    inactive: "bg-zinc-100 text-zinc-500 border-zinc-200",
    open: "bg-emerald-50 text-emerald-700 border-emerald-200",
    closed: "bg-red-50 text-red-700 border-red-200",
    draft: "bg-amber-50 text-amber-700 border-amber-200",
  };

  const labels: Record<string, string> = {
    active: "Aktif",
    inactive: "Nonaktif",
    open: "Buka",
    closed: "Tutup",
    draft: "Draft",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}
