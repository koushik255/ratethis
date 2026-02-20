import { useState } from "react";
import { Link } from "react-router-dom";
import { Doc } from "../../convex/_generated/dataModel";
import "./AnimeLogPanel.css";

type TabType = "favorites" | "watched" | "diary";

interface WatchedAnime extends Doc<"anime"> {
  watchedAt?: number;
  watchedComment?: string;
}

interface AnimeLogPanelProps {
  favorites: (Doc<"anime"> | null)[] | undefined;
  watched: (WatchedAnime | null)[] | undefined;
  loading?: boolean;
  emptyMessageFavorites?: string;
  emptyMessageWatched?: string;
  showTabs?: boolean;
  activeTab?: TabType;
  onTabChange?: (tab: TabType) => void;
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function isWatchedAnime(anime: Doc<"anime"> | WatchedAnime): anime is WatchedAnime {
  return "watchedAt" in anime;
}

export function AnimeLogPanel({
  favorites,
  watched,
  loading = false,
  emptyMessageFavorites = "no favorites yet.",
  emptyMessageWatched = "no watched anime yet.",
  showTabs = true,
  activeTab: controlledActiveTab,
  onTabChange,
}: AnimeLogPanelProps) {
  const [internalActiveTab, setInternalActiveTab] = useState<TabType>("favorites");
  
  const activeTab = controlledActiveTab ?? internalActiveTab;
  const setActiveTab = onTabChange ?? setInternalActiveTab;

  const displayItems = activeTab === "favorites" ? favorites : watched;
  const isLoading = loading || displayItems === undefined;

  return (
    <div className="anime-log-panel">
      {showTabs && (
        <div className="log-tabs">
          <button
            className={`log-tab ${activeTab === "favorites" ? "active" : ""}`}
            onClick={() => setActiveTab("favorites")}
          >
            favorites ({favorites?.length ?? 0})
          </button>
          <button
            className={`log-tab ${activeTab === "watched" ? "active" : ""}`}
            onClick={() => setActiveTab("watched")}
          >
            watched ({watched?.length ?? 0})
          </button>
        </div>
      )}

      <div className="log-content">
        {isLoading ? (
          <div className="loading">
            <p>loading...</p>
          </div>
        ) : displayItems?.length === 0 ? (
          <div className="empty-state">
            <p>
              {activeTab === "favorites" ? emptyMessageFavorites : emptyMessageWatched}
            </p>
          </div>
        ) : (
          <div className="entry-list">
            {displayItems?.map((anime, index) =>
              anime ? (
                <Link
                  key={anime._id}
                  to={`/anime/${anime._id}`}
                  className="entry-link"
                >
                  <article className="entry">
                    {anime.picture && (
                      <div className="entry-thumb">
                        <img
                          src={anime.picture}
                          alt={anime.title}
                          className="thumb-img"
                          loading="lazy"
                          decoding="async"
                        />
                      </div>
                    )}
                    <div className="entry-body">
                      <span className="entry-id">
                        {String(index + 1).padStart(3, "0")}
                      </span>
                      <h3 className="entry-title">{anime.title}</h3>
                      <div className="entry-meta">
                        <span>{anime.type}</span>
                        <span
                          className={`status-${anime.status?.toLowerCase().replace(/\s+/g, "-")}`}
                        >
                          {anime.status}
                        </span>
                        {anime.animeSeason?.year && (
                          <span>{anime.animeSeason.year}</span>
                        )}
                        {anime.score?.arithmeticMean && (
                          <span className="entry-score">
                            {anime.score.arithmeticMean.toFixed(2)}
                          </span>
                        )}
                      </div>
                      {activeTab === "watched" && isWatchedAnime(anime) && anime.watchedAt && (
                        <div className="watched-info">
                          <span className="watched-date">
                            watched on {formatDate(anime.watchedAt)}
                          </span>
                          {anime.watchedComment && (
                            <p className="watched-comment">
                              &ldquo;{anime.watchedComment}&rdquo;
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </article>
                </Link>
              ) : null
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AnimeLogPanel;
