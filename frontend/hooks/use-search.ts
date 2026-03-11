"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import FlexSearch, { Index as FlexIndex } from "flexsearch";

export interface SearchResult {
  id: string;
  title: string;
  date: string;
  speakers: string[];
  text: string;
  folder_id: string | null;
}

interface SearchIndexItem {
  id: string;
  title: string;
  date: string;
  speakers: string[];
  text: string;
  folder_id: string | null;
}

interface SearchIndexResponse {
  version: string;
  items: SearchIndexItem[];
}

const VERSION_KEY = "speechai_search_index_version";

export function useSearch() {
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const indexRef = useRef<FlexIndex | null>(null);
  const itemsRef = useRef<Map<number, SearchIndexItem>>(new Map());

  useEffect(() => {
    let cancelled = false;

    async function buildIndex() {
      setLoading(true);
      try {
        const res = await fetch("/api/search-index");
        if (!res.ok) throw new Error("Failed to fetch search index");
        const data: SearchIndexResponse = await res.json();

        if (cancelled) return;

        // Check cache version
        const cachedVersion = localStorage.getItem(VERSION_KEY);
        if (cachedVersion === data.version && indexRef.current) {
          setLoading(false);
          setInitialized(true);
          return;
        }

        // Build new index
        const index = new FlexIndex({
          tokenize: "forward",
          resolution: 9,
        });

        const items = new Map<number, SearchIndexItem>();
        data.items.forEach((item, i) => {
          items.set(i, item);
          index.add(i, `${item.title} ${item.text}`);
        });

        if (cancelled) return;

        indexRef.current = index;
        itemsRef.current = items;

        localStorage.setItem(VERSION_KEY, data.version);
        setInitialized(true);
      } catch {
        // silently fail
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    buildIndex();
    return () => {
      cancelled = true;
    };
  }, []);

  const search = useCallback(
    (query: string): SearchResult[] => {
      if (!indexRef.current || !query.trim()) return [];

      const ids = indexRef.current.search(query, { limit: 50 }) as number[];

      return ids.map((numId) => {
        const item = itemsRef.current.get(numId)!;
        // Find matching snippet
        const lowerText = item.text.toLowerCase();
        const lowerQuery = query.toLowerCase();
        const matchIdx = lowerText.indexOf(lowerQuery);
        let snippet = item.text;
        if (matchIdx >= 0) {
          const start = Math.max(0, matchIdx - 60);
          const end = Math.min(item.text.length, matchIdx + query.length + 60);
          snippet =
            (start > 0 ? "..." : "") +
            item.text.slice(start, end) +
            (end < item.text.length ? "..." : "");
        } else if (item.text.length > 150) {
          snippet = item.text.slice(0, 150) + "...";
        }

        return {
          id: item.id,
          title: item.title,
          date: item.date,
          speakers: item.speakers,
          text: snippet,
          folder_id: item.folder_id,
        };
      });
    },
    []
  );

  return { search, loading, initialized };
}
