import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { useConvexAuth } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useTopAnimeSearch } from "../hooks/useTopAnimeSearch";
import "./AnimeSearchPanel.css";

interface AnimeSearchPanelProps {
  listId: string;
  onClose: () => void;
  onAnimeAdded: () => void;
}

export function AnimeSearchPanel({ listId, onClose, onAnimeAdded }: AnimeSearchPanelProps) {
  const { isAuthenticated } = useConvexAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAnime, setSelectedAnime] = useState<Id<"anime"> | null>(null);
  const [searchAllMode, setSearchAllMode] = useState(false);
  
  const { isLoaded, isLoading: isCacheLoading, ensureLoaded, searchLocal } = useTopAnimeSearch();

  useEffect(() => {
    if (searchQuery.trim()) {
      ensureLoaded();
    }
  }, [searchQuery, ensureLoaded]);

  const localResults = useMemo(() => {
    if (!isLoaded || !searchQuery.trim()) return [];
    return searchLocal(searchQuery, 20);
  }, [isLoaded, searchQuery, searchLocal]);

  const localMalIds = useMemo(() => 
    localResults.map((anime) => anime.malId).filter((id) => id),
    [localResults]
  );

  const localAnimeFromDb = useQuery(
    api.anime.getByMalIds,
    localMalIds.length > 0 ? { malIds: localMalIds } : "skip"
  );

  const fallbackResults = useQuery(
    api.anime.searchByTitle,
    searchAllMode && searchQuery.trim() ? { query: searchQuery, limit: 20 } : "skip"
  );

  const displayResults = useMemo(() => {
    if (searchAllMode && fallbackResults && localAnimeFromDb) {
      const localIds = new Set(localAnimeFromDb.map((a) => a._id));
      const uniqueFallback = fallbackResults.filter((a) => !localIds.has(a._id));
      return [...localAnimeFromDb, ...uniqueFallback].slice(0, 20);
    }
    return localAnimeFromDb || null;
  }, [searchAllMode, fallbackResults, localAnimeFromDb]);

  const showLoading = !isLoaded && isCacheLoading;
  const showFallbackLoading = searchAllMode && fallbackResults === undefined;
  const hasAnyResults = (displayResults?.length ?? 0) > 0;

  const addToList = useMutation(api.lists.addToList);

  const handleAddAnime = async () => {
    if (!selectedAnime || !isAuthenticated) return;
    
    try {
      await addToList({
        listId: listId as Id<"animeLists">,
        animeId: selectedAnime,
      });
      onAnimeAdded();
      setSearchQuery("");
      setSelectedAnime(null);
      setSearchAllMode(false);
    } catch (error) {
      console.error("Failed to add anime:", error);
      alert("Failed to add anime. This anime might already be in the list.");
    }
  };

  const handleSelectAnime = (animeId: Id<"anime">) => {
    setSelectedAnime(animeId);
  };

  const handleSearchAll = () => {
    setSearchAllMode(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "Enter" && selectedAnime) {
      handleAddAnime();
    }
  };

  return (
    <div className="anime-search-overlay" onClick={onClose}>
      <div className="anime-search-panel" onClick={(e) => e.stopPropagation()}>
        <div className="search-panel-header">
          <h3 className="search-panel-title">add anime to list</h3>
        </div>
        
        <div className="search-panel-content">
          <input
            type="text"
            className="search-panel-input"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSearchAllMode(false);
            }}
            onKeyDown={handleKeyDown}
            placeholder="search anime..."
            autoFocus
          />

          <div className="search-panel-results">
            {showLoading ? (
              <div className="search-loading">
                <p>loading anime database...</p>
              </div>
            ) : showFallbackLoading ? (
              <div className="search-loading">
                <p>searching all anime...</p>
              </div>
            ) : hasAnyResults ? (
              <>
                <div className="search-results-list">
                  {displayResults?.map((anime) => (
                    <div
                      key={anime._id}
                      className={`search-result-item ${selectedAnime === anime._id ? "selected" : ""}`}
                      onClick={() => handleSelectAnime(anime._id)}
                    >
                      {anime.thumbnail && (
                        <div className="search-result-thumb">
                          <img
                            src={anime.thumbnail}
                            alt={anime.title}
                            className="search-result-img"
                            loading="lazy"
                            decoding="async"
                          />
                        </div>
                      )}
                      <div className="search-result-content">
                        <div className="search-result-title">{anime.title}</div>
                        <div className="search-result-meta">
                          <span className="search-result-type">{anime.type}</span>
                          {anime.score?.arithmeticMean && (
                            <span className="search-result-score">
                              {anime.score.arithmeticMean.toFixed(1)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {!searchAllMode && (
                  <button className="search-all-btn" onClick={handleSearchAll}>
                    search all 40,000 anime
                  </button>
                )}
              </>
            ) : searchQuery.trim() ? (
              <>
                <div className="search-no-results">
                  <p>no results in top 3000</p>
                </div>
                {!searchAllMode && (
                  <button className="search-all-btn" onClick={handleSearchAll}>
                    search all 40,000 anime
                  </button>
                )}
                {searchAllMode && (
                  <div className="search-no-results">
                    <p>no results found</p>
                  </div>
                )}
              </>
            ) : (
              <div className="search-prompt">
                <p>type to search for anime</p>
              </div>
            )}
          </div>

          <div className="search-panel-actions">
            <button 
              className="search-panel-cancel"
              onClick={onClose}
            >
              cancel
            </button>
            <button 
              className="search-panel-add"
              onClick={handleAddAnime}
              disabled={!selectedAnime || !isAuthenticated}
            >
              add to list
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
