import { useState } from "react";
import { useQuery } from "convex/react";
import { Link } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import { UserMenu } from "../components/UserMenu";
import { Doc } from "../../convex/_generated/dataModel";
import "./LogPage.css";

type TabType = "favorites" | "watched";

interface WatchedAnime extends Doc<"anime"> {
  watchedAt: number;
  watchedComment?: string;
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

function LogPage() {
  const [activeTab, setActiveTab] = useState<TabType>("favorites");
  
  const favorites = useQuery(api.userAnime.getMyFavorites);
  const watched = useQuery(api.userAnime.getMyWatched);

  const displayItems = activeTab === "favorites" ? favorites : watched;

  return (
    <div className="board">
      <header className="board-header">
        <div className="header-left">
          <h1 className="site-title">analog</h1>
          <nav className="board-nav">
            <Link to="/">index</Link>
            <span className="nav-separator">/</span>
            <Link to="/profile">profile</Link>
            <span className="nav-separator">/</span>
            <span className="nav-current">log</span>
            <span className="nav-separator">/</span>
            <Link to="/forums">forums</Link>
            <span className="nav-separator">/</span>
            <Link to="/lists">lists</Link>
            <span className="nav-separator">/</span>
            <Link to="/friends">friends</Link>
          </nav>
        </div>
        <div className="header-right">
          <UserMenu />
        </div>
      </header>

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

      <div className="board-content">
        {displayItems === undefined ? (
          <div className="loading">
            <p>loading...</p>
          </div>
        ) : displayItems.length === 0 ? (
          <div className="empty-state">
            <p>
              {activeTab === "favorites" 
                ? "no favorites yet. search and add some!" 
                : "no watched anime yet. start watching!"}
            </p>
          </div>
        ) : (
          <div className="entry-list">
            {displayItems.map((anime, index) => (
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
                    <span className="entry-id">{String(index + 1).padStart(3, "0")}</span>
                    <h3 className="entry-title">{anime.title}</h3>
                    <div className="entry-meta">
                      <span>{anime.type}</span>
                      <span className={`status-${anime.status?.toLowerCase().replace(/\s+/g, "-")}`}>
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
                    {activeTab === "watched" && isWatchedAnime(anime) && (
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
            ))}
          </div>
        )}
      </div>

      <footer className="board-footer">
        <p>analog v1.0</p>
      </footer>
    </div>
  );
}

export default LogPage;
