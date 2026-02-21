import { useState, useCallback } from "react";

export interface TopAnimeEntry {
  rank: number;
  title: string;
  url: string;
  image_url: string;
  type: string;
  episodes: number | null;
  score: number | null;
  members: number;
  malId: string;
}

interface TopAnimeData {
  scraped_at: string;
  total_entries: number;
  entries: Array<{
    rank: number;
    title: string;
    url: string;
    image_url: string;
    type: string;
    episodes: number | null;
    start_date: string | null;
    end_date: string | null;
    score: number | null;
    members: number;
  }>;
}

let cachedData: TopAnimeEntry[] | null = null;
let loadPromise: Promise<TopAnimeEntry[]> | null = null;

function extractMalId(url: string): string {
  const match = url.match(/\/anime\/(\d+)\//);
  return match ? match[1] : "";
}

async function loadTopAnimeData(): Promise<TopAnimeEntry[]> {
  if (cachedData) {
    return cachedData;
  }

  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = (async () => {
    const response = await fetch(new URL("../data/top_3000_anime.json", import.meta.url).href);
    const data: TopAnimeData = await response.json();
    
    cachedData = data.entries.map((entry) => ({
      ...entry,
      malId: extractMalId(entry.url),
    }));
    
    return cachedData;
  })();

  return loadPromise;
}

export function useTopAnimeSearch() {
  const [isLoaded, setIsLoaded] = useState(cachedData !== null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const ensureLoaded = useCallback(async () => {
    if (cachedData) {
      setIsLoaded(true);
      return true;
    }

    setIsLoading(true);
    setError(null);

    try {
      await loadTopAnimeData();
      setIsLoaded(true);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load anime data"));
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const searchLocal = useCallback((query: string, limit: number = 20): TopAnimeEntry[] => {
    if (!cachedData || !query.trim()) {
      return [];
    }

    const normalizedQuery = query.toLowerCase().trim();
    
    const results = cachedData.filter((anime) => {
      const titleMatch = anime.title.toLowerCase().includes(normalizedQuery);
      return titleMatch;
    });

    return results.slice(0, limit);
  }, []);

  return {
    isLoaded,
    isLoading,
    error,
    ensureLoaded,
    searchLocal,
  };
}
