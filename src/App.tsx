import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../convex/_generated/api";
import { UserMenu } from "./components/UserMenu";
import { AnimeActions } from "./components/AnimeActions";
import "./styles.css";
import "./App.css";

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

function App() {
  const [inputValue, setInputValue] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  
  const debouncedInput = useDebounce(inputValue, 300);
  
  const animes = useQuery(
    api.anime.searchByTitle,
    searchQuery ? { query: searchQuery, limit: 50 } : "skip"
  );

  const topRated = useQuery(api.anime.getTopRatedCurrentSeason);
  const refreshCache = useMutation(api.anime.refreshTopAnimeCache);

  useEffect(() => {
    if (topRated?.needsRefresh) {
      refreshCache().catch(console.error);
    }
  }, [topRated?.needsRefresh, refreshCache]);

  useEffect(() => {
    const queryFromUrl = searchParams.get("q");
    if (queryFromUrl) {
      setInputValue(queryFromUrl);
      setSearchQuery(queryFromUrl);
    }
  }, []);

  useEffect(() => {
    const newParams = new URLSearchParams(searchParams);
    if (searchQuery) {
      newParams.set("q", searchQuery);
    } else {
      newParams.delete("q");
    }
    setSearchParams(newParams);
  }, [searchQuery, searchParams, setSearchParams]);

  useEffect(() => {
    if (debouncedInput !== searchQuery) {
      setSearchQuery(debouncedInput);
    }
  }, [debouncedInput, searchQuery]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      setSearchQuery(inputValue);
    }
  };

  return (
    <div className="index-page">
      <header className="index-header">
        <div className="header-content">
          <h1 className="site-title">analog</h1>
          <nav className="main-nav">
            <Link to="/" className="nav-link active">index</Link>
            <Link to="/profile" className="nav-link">profile</Link>
            <Link to="/log" className="nav-link">log</Link>
            <Link to="/lists" className="nav-link">lists</Link>
            <Link to="/friends" className="nav-link">friends</Link>
          </nav>
        </div>
        <UserMenu />
      </header>

      <main className="index-main">
        <aside className="index-sidebar">
          <div className="sidebar-section">
            <h2 className="sidebar-title">
              <span className="season-badge">{topRated?.season?.toUpperCase()}</span>
              <span className="season-year">{topRated?.year}</span>
            </h2>
            <p className="sidebar-subtitle">top rated · currently airing</p>
          </div>

          <div className="top-rated-list">
            {topRated?.anime.map((anime, index) => (
              <Link
                key={anime._id}
                to={`/anime/${anime._id}`}
                className="top-rated-card"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <div className="card-rank">
                  <span className="rank-num">{String(index + 1).padStart(2, '0')}</span>
                </div>
                {anime.thumbnail && (
                  <div className="card-thumb">
                    <img
                      src={anime.thumbnail}
                      alt={anime.title}
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                )}
                <div className="card-info">
                  <h3 className="card-title">{anime.title}</h3>
                  <div className="card-meta">
                    <span className="card-type">{anime.type}</span>
                    {anime.score?.arithmeticMean && (
                      <span className="card-score">
                        {anime.score.arithmeticMean.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
            
            {(!topRated || topRated.anime.length === 0) && (
              <div className="sidebar-empty">
                <p>loading seasonal anime...</p>
              </div>
            )}
          </div>
        </aside>

        <section className="index-content">
          <div className="search-area">
            <div className="search-box">
              <input
                type="text"
                placeholder="search anime..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="search-input"
              />
              {inputValue && (
                <button 
                  className="search-clear"
                  onClick={() => {
                    setInputValue("");
                    setSearchQuery("");
                  }}
                >
                  clear
                </button>
              )}
            </div>
          </div>

          {searchQuery && (
            <div className="results-area">
              <div className="results-header">
                <span className="results-count">
                  {animes?.length ?? 0} result{(animes?.length ?? 0) !== 1 ? 's' : ''} for "{searchQuery}"
                </span>
              </div>

              {animes && animes.length > 0 ? (
                <div className="results-grid">
                  {animes.map((anime, index) => (
                    <Link
                      key={anime._id}
                      to={`/anime/${anime._id}`}
                      className="result-card"
                      style={{ animationDelay: `${index * 40}ms` }}
                    >
                      {anime.thumbnail && (
                        <div className="result-thumb">
                          <img
                            src={anime.thumbnail}
                            alt={anime.title}
                            loading="lazy"
                            decoding="async"
                          />
                        </div>
                      )}
                      <div className="result-info">
                        <h3 className="result-title">{anime.title}</h3>
                        <div className="result-meta">
                          <span className="result-type">{anime.type}</span>
                          <span className={`result-status status-${anime.status?.toLowerCase().replace(/\s+/g, '-')}`}>
                            {anime.status}
                          </span>
                          {anime.animeSeason?.year && (
                            <span className="result-year">{anime.animeSeason.year}</span>
                          )}
                        </div>
                        {anime.score?.arithmeticMean && (
                          <div className="result-score">
                            <span className="score-value">{anime.score.arithmeticMean.toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                      <div className="result-actions">
                        <AnimeActions 
                          animeId={anime._id} 
                          animeTitle={anime.title}
                          variant="hover"
                        />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="no-results">
                  <p>no anime found matching your search.</p>
                </div>
              )}
            </div>
          )}

          {!searchQuery && (
            <div className="welcome-area">
              <div className="welcome-content">
                <h2 className="welcome-title">discover anime</h2>
                <p className="welcome-text">
                  search for your favorite anime, track what you've watched, 
                  and share your lists with friends.
                </p>
              </div>
            </div>
          )}
        </section>
      </main>

      <footer className="index-footer">
        <p>analog v1.0</p>
      </footer>
    </div>
  );
}

export default App;
