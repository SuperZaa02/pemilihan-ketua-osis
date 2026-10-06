import { BarChart } from "lucide-react";

export function LinkToResultButton() {
  return (
    <a
      href="/results"
      className="group mt-4 inline-flex items-center gap-1.5 rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-all hover:border-indigo-500 hover:bg-indigo-50 hover:text-indigo-700 disabled:hover:border-indigo-500 disabled:hover:bg-indigo-50 disabled:hover:text-indigo-700"
    >
      <BarChart className="h-4 w-4 transition-colors group-hover:text-indigo-700" aria-hidden />
      Lihat Hasil
    </a>
  );
}