import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useConvexAuth } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
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
  
  const searchResults = useQuery(
    api.anime.searchByTitle,
    searchQuery ? { query: searchQuery, limit: 20 } : "skip"
  );

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
    } catch (error) {
      console.error("Failed to add anime:", error);
      alert("Failed to add anime. This anime might already be in the list.");
    }
  };

  const handleSelectAnime = (animeId: Id<"anime">) => {
    setSelectedAnime(animeId);
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
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="search anime..."
            autoFocus
          />

          <div className="search-panel-results">
            {searchResults === undefined ? (
              <div className="search-loading">
                <p>searching...</p>
              </div>
            ) : searchResults && searchResults.length > 0 ? (
              <div className="search-results-list">
                {searchResults.map((anime) => (
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
            ) : searchQuery ? (
              <div className="search-no-results">
                <p>no results found</p>
              </div>
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
