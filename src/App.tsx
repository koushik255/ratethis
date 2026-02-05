import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../convex/_generated/api";
import { UserMenu } from "./components/UserMenu";
import "./App.css";

function App() {
  const [inputValue, setInputValue] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  
  const animes = useQuery(
    api.anime.searchByTitle,
    searchQuery ? { query: searchQuery, limit: 50 } : "skip"
  );

  // Restore search from URL on mount
  useEffect(() => {
    const queryFromUrl = searchParams.get("q");
    if (queryFromUrl) {
      setInputValue(queryFromUrl);
      setSearchQuery(queryFromUrl);
    }
  }, []);

  // Sync search to URL
  useEffect(() => {
    const newParams = new URLSearchParams(searchParams);
    if (searchQuery) {
      newParams.set("q", searchQuery);
    } else {
      newParams.delete("q");
    }
    setSearchParams(newParams);
  }, [searchQuery]);

  // Debounced real-time search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputValue !== searchQuery) {
        setSearchQuery(inputValue);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [inputValue, searchQuery]);

  const handleSearch = () => {
    setSearchQuery(inputValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="board">
      <header className="board-header">
        <div className="header-left">
          <h1 className="site-title">analog</h1>
          <nav className="board-nav">
            <Link to="/">index</Link>
            <span className="nav-separator">/</span>
            <Link to="/profile">profile</Link>
          </nav>
        </div>
        <div className="header-right">
          <UserMenu />
        </div>
      </header>

      <div className="search-container">
        <label className="search-label">search:</label>
        <input
          type="text"
          placeholder="enter title..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="raw-input"
        />
        <button onClick={handleSearch} className="raw-button">
          go
        </button>
      </div>

      <div className="board-content">
        {searchQuery && (
          <>
            <div className="divider">
              {`${animes?.length ?? 0} results for "${searchQuery}"`}
            </div>

            <div className="entry-list">
              {animes?.map((anime, index) => (
                <Link 
                  key={anime._id} 
                  to={`/anime/${anime._id}`}
                  className="entry-link"
                >
                  <article className="entry">
                    {anime.thumbnail && (
                      <div className="entry-thumb">
                        <img 
                          src={anime.thumbnail} 
                          alt={anime.title}
                          className="thumb-img"
                        />
                      </div>
                    )}
                    <div className="entry-body">
                      <span className="entry-id">{String(index + 1).padStart(3, '0')}</span>
                      <h3 className="entry-title">{anime.title}</h3>
                      <div className="entry-meta">
                        <span>{anime.type}</span>
                        <span className={`status-${anime.status?.toLowerCase().replace(/\s+/g, '-')}`}>
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
                    </div>
                  </article>
                </Link>
              ))}
            </div>

            {animes?.length === 0 && (
              <div className="no-results">
                <p>no entries found.</p>
              </div>
            )}
          </>
        )}

        {!searchQuery && (
          <div className="welcome">
            <p className="welcome-text">search above to begin.</p>
          </div>
        )}
      </div>

      <footer className="board-footer">
        <p>analog v1.0</p>
      </footer>
    </div>
  );
}

export default App;
