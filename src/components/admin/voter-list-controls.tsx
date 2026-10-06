"use client";

import { LoaderCircle, Play, RefreshCcw, Search } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import {
type FormEvent,
useEffect,
useRef,
useState,
useTransition,
} from "react";

const pageSizeOptions = [20, 40, 60, 80, 100] as const;

type VoterListControlsProps = {
search: string;
placementId: string;
sort: "asc" | "desc";
pageSize: number;
placements: { id: string; name: string }[];
};

export function VoterListControls({
search: initialSearch,
placementId: initialPlacementId,
sort: initialSort,
pageSize: initialPageSize,
placements,
}: VoterListControlsProps) {
const router = useRouter();
const pathname = usePathname();

const [search, setSearch] = useState(initialSearch);
const [placementId, setPlacementId] = useState(initialPlacementId);
const [sort, setSort] = useState(initialSort);
const [pageSize, setPageSize] = useState(String(initialPageSize));
const [isDebouncing, setIsDebouncing] = useState(false);
const [isApplyingFilters, startApplyingFilters] = useTransition();
const [isRefreshing, startRefreshing] = useTransition();

const timeoutRef = useRef<number | null>(null);

useEffect(() => {
return () => {
if (timeoutRef.current !== null) {
window.clearTimeout(timeoutRef.current);
}
};
}, []);

function buildParams() {
const params = new URLSearchParams();

if (search) params.set("q", search);
if (placementId) params.set("placementId", placementId);

params.set("sort", sort);
params.set("pageSize", pageSize);
params.set("page", "1");

return params;


}

function updateSearch(value: string) {
setSearch(value);

if (timeoutRef.current !== null) {
  window.clearTimeout(timeoutRef.current);
}

if (value === initialSearch) {
  setIsDebouncing(false);
  return;
}

setIsDebouncing(true);

const params = new URLSearchParams();

if (value) params.set("q", value);
if (placementId) params.set("placementId", placementId);

params.set("sort", sort);
params.set("pageSize", pageSize);
params.set("page", "1");

timeoutRef.current = window.setTimeout(() => {
  timeoutRef.current = null;
  setIsDebouncing(false);

  startApplyingFilters(() => {
    router.replace(`${pathname}?${params.toString()}`, {
      scroll: false,
    });
  });
}, 400);


}

function applyFilters(event: FormEvent<HTMLFormElement>) {
event.preventDefault();

if (timeoutRef.current !== null) {
  window.clearTimeout(timeoutRef.current);
  timeoutRef.current = null;
}

setIsDebouncing(false);

const params = buildParams();

startApplyingFilters(() => {
  router.push(`${pathname}?${params.toString()}`, {
    scroll: false,
  });
});


}

function clearPendingSearch() {
if (timeoutRef.current !== null) {
window.clearTimeout(timeoutRef.current);
timeoutRef.current = null;
}

setIsDebouncing(false);


}

function handleRefresh() {
if (timeoutRef.current !== null) {
window.clearTimeout(timeoutRef.current);
timeoutRef.current = null;
}

setIsDebouncing(false);

startRefreshing(() => {
  router.refresh();
});


}

return (
<div className="border-b border-zinc-200 bg-white p-3.5 sm:p-4">
<form onSubmit={applyFilters} className="flex flex-col gap-3 lg:flex-row lg:items-end" >
{/* Search */}
<label className="flex min-w-0 flex-1 flex-col gap-1.5 text-xs font-medium text-zinc-600">
<span>Cari</span>

      <div className="relative">
        <Search
          aria-hidden
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400"
        />

        <input
          name="q"
          value={search}
          onChange={(event) => updateSearch(event.target.value)}
          placeholder="Cari nama atau kelas..."
          className="h-10 w-full rounded-md border border-zinc-300 bg-white pl-9 pr-3 text-sm font-normal text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 hover:border-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
        />
      </div>
    </label>

    {/* Filters */}
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:flex lg:items-end">
      {/* Kelas */}
      <label className="flex min-w-0 flex-col gap-1.5 text-xs font-medium text-zinc-600">
        <span>Kelas</span>

        <select
          name="placementId"
          value={placementId}
          onChange={(event) => {
            clearPendingSearch();
            setPlacementId(event.target.value);
          }}
          className="h-10 min-w-36 rounded-md border border-zinc-300 bg-white px-2.5 text-sm font-normal text-zinc-900 outline-none transition-colors hover:border-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
        >
          <option value="">Semua</option>

          {placements.map((placement) => (
            <option key={placement.id} value={placement.id}>
              {placement.name}
            </option>
          ))}
        </select>
      </label>

      {/* Urutan */}
      <label className="flex min-w-0 flex-col gap-1.5 text-xs font-medium text-zinc-600">
        <span>Urutan</span>

        <select
          name="sort"
          value={sort}
          onChange={(event) => {
            clearPendingSearch();
            setSort(
              event.target.value === "desc" ? "desc" : "asc",
            );
          }}
          className="h-10 min-w-24 rounded-md border border-zinc-300 bg-white px-2.5 text-sm font-normal text-zinc-900 outline-none transition-colors hover:border-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
        >
          <option value="asc">A–Z</option>
          <option value="desc">Z–A</option>
        </select>
      </label>

      {/* Page Size */}
      <label className="flex min-w-0 flex-col gap-1.5 text-xs font-medium text-zinc-600">
        <span>Per halaman</span>

        <select
          name="pageSize"
          value={pageSize}
          onChange={(event) => {
            clearPendingSearch();
            setPageSize(event.target.value);
          }}
          className="h-10 min-w-24 rounded-md border border-zinc-300 bg-white px-2.5 text-sm font-normal text-zinc-900 outline-none transition-colors hover:border-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
        >
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </label>

      {/* Actions */}
      <div className="col-span-2 grid grid-cols-2 gap-2 sm:col-span-1 sm:flex sm:items-end">
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-700 outline-none transition-colors hover:border-zinc-400 hover:bg-zinc-50 hover:text-zinc-900 focus-visible:ring-2 focus-visible:ring-zinc-900/10 disabled:cursor-wait disabled:opacity-60"
        >
          <RefreshCcw
            aria-hidden
            className={`size-3.5 ${
              isRefreshing ? "animate-spin" : ""
            }`}
          />
        </button>

        <button
          type="submit"
          disabled={isApplyingFilters}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-zinc-900 px-4 text-sm font-medium text-white outline-none transition-colors hover:bg-zinc-800 focus-visible:ring-2 focus-visible:ring-zinc-900/20 disabled:cursor-wait disabled:opacity-60"
        >
          {isApplyingFilters && (
            <LoaderCircle
              aria-hidden
              className="size-3.5 animate-spin"
            />
          )}
          {!isApplyingFilters && (
            <Play
              aria-hidden
              className={"size-3.5"}
            />
          )}
        </button>
      </div>
    </div>
  </form>

  {/* Status */}
  {(isApplyingFilters || isRefreshing || isDebouncing) && (
    <div
      className="mt-2 flex items-center gap-1.5 text-[11px] text-zinc-500"
      role="status"
      aria-live="polite"
    >
      {isRefreshing ? (
        <>
          <LoaderCircle
            aria-hidden
            className="size-3 animate-spin text-zinc-500"
          />
          <span>Menyegarkan data pemilih...</span>
        </>
      ) : isApplyingFilters ? (
        <>
          <LoaderCircle
            aria-hidden
            className="size-3 animate-spin text-zinc-500"
          />
          <span>Menerapkan filter...</span>
        </>
      ) : (
        <span>Pencarian dimulai sebentar lagi...</span>
      )}
    </div>
  )}
</div>


);
}