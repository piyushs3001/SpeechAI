"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { Search as SearchIcon } from "lucide-react";
import { useSearch, SearchResult } from "@/hooks/use-search";
import { useAppStore } from "@/lib/store";
import { LoadingSpinner } from "@/components/loading-spinner";
import { EmptyState } from "@/components/empty-state";

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx < 0) return text;
  return (
    <>
      {text.slice(0, idx)}
      <span className="font-semibold text-[#2563eb]">
        {text.slice(idx, idx + query.length)}
      </span>
      {text.slice(idx + query.length)}
    </>
  );
}

export default function SearchPage() {
  const { search, loading, initialized } = useSearch();
  const folders = useAppStore((s) => s.folders);
  const fetchFolders = useAppStore((s) => s.fetchFolders);

  const [query, setQuery] = useState("");
  const [speakerFilter, setSpeakerFilter] = useState("");
  const [folderFilter, setFolderFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  const rawResults = useMemo(() => {
    if (!query.trim()) return [];
    return search(query);
  }, [query, search]);

  const results = useMemo(() => {
    let filtered = rawResults;

    if (speakerFilter) {
      filtered = filtered.filter((r) =>
        r.speakers.some((s) =>
          s.toLowerCase().includes(speakerFilter.toLowerCase())
        )
      );
    }

    if (folderFilter) {
      filtered = filtered.filter((r) => r.folder_id === folderFilter);
    }

    if (dateFrom) {
      const from = new Date(dateFrom);
      filtered = filtered.filter((r) => new Date(r.date) >= from);
    }

    if (dateTo) {
      const to = new Date(dateTo);
      to.setDate(to.getDate() + 1);
      filtered = filtered.filter((r) => new Date(r.date) < to);
    }

    return filtered;
  }, [rawResults, speakerFilter, folderFilter, dateFrom, dateTo]);

  // Collect unique speakers from results for display
  const allSpeakers = useMemo(() => {
    const set = new Set<string>();
    rawResults.forEach((r) => r.speakers.forEach((s) => set.add(s)));
    return Array.from(set).sort();
  }, [rawResults]);

  return (
    <div className="mx-auto max-w-4xl">
      {/* Search input */}
      <div className="relative mb-6">
        <SearchIcon
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search across all your meeting transcripts..."
          className="w-full rounded-xl border border-white/5 bg-white/[0.03] py-3 pl-11 pr-4 text-[15px] text-white placeholder-gray-500 outline-none transition-colors focus:border-[#2563eb]/40 focus:bg-white/[0.04]"
          autoFocus
        />
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-2.5">
        <input
          type="text"
          value={speakerFilter}
          onChange={(e) => setSpeakerFilter(e.target.value)}
          placeholder="Filter by speaker"
          className="rounded-lg border border-white/5 bg-white/[0.03] px-3 py-1.5 text-[13px] text-white placeholder-gray-500 outline-none focus:border-[#2563eb]/40"
          list="speaker-suggestions"
        />
        <datalist id="speaker-suggestions">
          {allSpeakers.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>

        <select
          value={folderFilter}
          onChange={(e) => setFolderFilter(e.target.value)}
          className="rounded-lg border border-white/5 bg-white/[0.03] px-3 py-1.5 text-[13px] text-white outline-none focus:border-[#2563eb]/40"
        >
          <option value="">All folders</option>
          {folders.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-2 text-[13px] text-gray-500">
          <span>From</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-lg border border-white/5 bg-white/[0.03] px-3 py-1.5 text-[13px] text-white outline-none focus:border-[#2563eb]/40"
          />
          <span>To</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-lg border border-white/5 bg-white/[0.03] px-3 py-1.5 text-[13px] text-white outline-none focus:border-[#2563eb]/40"
          />
        </div>
      </div>

      {/* Results */}
      {loading && !initialized ? (
        <LoadingSpinner message="Building search index..." />
      ) : !query.trim() ? (
        <EmptyState
          icon={<SearchIcon size={36} className="text-gray-600" />}
          message="Search across all your meeting transcripts"
        />
      ) : results.length === 0 ? (
        <EmptyState
          message={`No results found for "${query}"`}
        />
      ) : (
        <div className="flex flex-col">
          <p className="mb-3 text-[12px] text-gray-500">
            {results.length} result{results.length !== 1 ? "s" : ""}
          </p>
          <div className="rounded-xl border border-white/5 overflow-hidden">
            {results.map((result) => (
              <Link
                key={result.id}
                href={`/transcript/${result.id}`}
                className="block border-b border-white/5 last:border-b-0 px-4 py-3.5 transition-colors hover:bg-white/[0.03]"
              >
                <h3 className="text-[15px] font-medium text-white">
                  {result.title}
                </h3>
                <p className="mt-1 text-[13px] leading-relaxed text-gray-400">
                  {highlightMatch(result.text, query)}
                </p>
                <div className="mt-2 flex items-center gap-3 text-[12px] text-gray-500">
                  <span>{formatDate(result.date)}</span>
                  {result.speakers.length > 0 && (
                    <span>{result.speakers.join(", ")}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
