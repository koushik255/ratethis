import { ReactNode, useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useTopAnimeSearch } from "../hooks/useTopAnimeSearch";
import "./RetroLayout.css";

interface RetroLayoutProps {
  children: ReactNode;
  hideSearch?: boolean;
}

function RetroLayout({ children, hideSearch = false }: RetroLayoutProps) {
  const location = useLocation();
  const { isAuthenticated } = useConvexAuth();
  const profile = useQuery(api.userProfiles.getMyProfile);
  
  const navItems = [
    { path: "/", label: "index", icon: "◆" },
    { path: "/log", label: "diary", icon: "◆" },
    { path: "/lists", label: "lists", icon: "◆" },
    { path: "/friends", label: "friends", icon: "◆" },
  ];

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <div className="retro-app">
      <aside className="sidebar">
        <div className="sidebar-header">
          <Link to="/" className="site-logo-link">
            <h1 className="site-logo">anime<span className="logo-accent">log</span></h1>
          </Link>
          <span className="site-version">v1.0</span>
        </div>

        {isAuthenticated && (
          <div className="sidebar-user">
            <Link to="/profile" className="user-avatar">
              {profile?.profilePicture ? (
                <img src={profile.profilePicture} alt="" />
              ) : (
                <span>{(profile?.displayName || profile?.username || "U")[0].toUpperCase()}</span>
              )}
            </Link>
            <div className="user-info">
              <Link to="/profile" className="user-name">
                {profile?.displayName || profile?.username || "user"}
              </Link>
              <span className="user-status">
                <Link to="/log">view log »</Link>
              </span>
            </div>
          </div>
        )}

        {!isAuthenticated && (
          <div className="sidebar-auth">
            <Link to="/profile" className="btn btn-small">login / register</Link>
          </div>
        )}

        <nav className="sidebar-nav">
          <div className="nav-section">
            <span className="nav-section-title">browse</span>
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive(item.path) ? "active" : ""}`}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      </aside>

      <main className="main-content">
        <header className="top-bar">
          {!hideSearch && <SearchBar />}
          <div className="top-bar-right">
            {!isAuthenticated && (
              <Link to="/profile" className="profile-link">login »</Link>
            )}
            {isAuthenticated && (
              <Link to="/profile" className="profile-link">profile »</Link>
            )}
          </div>
        </header>

        <div className="content-area">
          {children}
        </div>
      </main>
    </div>
  );
}

function SearchBar() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [inputValue, setInputValue] = useState(searchParams.get("q") || "");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { isLoaded, isLoading: isCacheLoading, ensureLoaded, searchLocal } = useTopAnimeSearch();

  useEffect(() => {
    const urlQuery = searchParams.get("q") || "";
    setInputValue(urlQuery);
  }, [searchParams]);

  useEffect(() => {
    if (inputValue.trim()) {
      ensureLoaded();
    }
  }, [inputValue, ensureLoaded]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const localResults = useTopAnimeSearchResults(inputValue, isLoaded, searchLocal);
  
  const localMalIds = localResults.map((a) => a.malId).filter((id) => id);
  const localAnimeFromDb = useQuery(
    api.anime.getByMalIds,
    localMalIds.length > 0 ? { malIds: localMalIds } : "skip"
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setShowDropdown(value.trim().length > 0);
    setSelectedIndex(-1);
  };

  const handleFocus = () => {
    if (inputValue.trim().length > 0) {
      setShowDropdown(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedValue = inputValue.trim();
    
    if (trimmedValue) {
      setShowDropdown(false);
      setSearchParams({ q: trimmedValue });
      if (location.pathname !== "/") {
        navigate(`/?q=${encodeURIComponent(trimmedValue)}`);
      }
    }
  };

  const handleClear = () => {
    setInputValue("");
    setShowDropdown(false);
    setSearchParams({});
    if (location.pathname !== "/") {
      navigate("/");
    }
  };

  const handleSelectAnime = (animeId: Id<"anime">) => {
    setShowDropdown(false);
    setInputValue("");
    navigate(`/anime/${animeId}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || !localAnimeFromDb || localAnimeFromDb.length === 0) return;
    
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => 
        prev < localAnimeFromDb!.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      handleSelectAnime(localAnimeFromDb[selectedIndex]._id);
    } else if (e.key === "Escape") {
      setShowDropdown(false);
      setSelectedIndex(-1);
    }
  };

  const showLoading = !isLoaded && isCacheLoading;
  const hasResults = localAnimeFromDb && localAnimeFromDb.length > 0;

  return (
    <form className="search-bar" onSubmit={handleSubmit} ref={wrapperRef}>
      <input
        ref={inputRef}
        type="text"
        className="global-search"
        placeholder="search anime..."
        value={inputValue}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
      />
      <button type="submit" className="search-btn">search</button>
      {inputValue && (
        <button type="button" className="search-clear-btn" onClick={handleClear}>
          ×
        </button>
      )}
      
      {showDropdown && (
        <div className="search-dropdown">
          {showLoading ? (
            <div className="search-dropdown-loading">loading...</div>
          ) : hasResults ? (
            <>
              {localAnimeFromDb!.slice(0, 8).map((anime, idx) => (
                <div
                  key={anime._id}
                  className={`search-dropdown-item ${selectedIndex === idx ? "selected" : ""}`}
                  onClick={() => handleSelectAnime(anime._id)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  {anime.thumbnail && (
                    <img src={anime.thumbnail} alt="" className="search-dropdown-thumb" />
                  )}
                  <div className="search-dropdown-content">
                    <span className="search-dropdown-title">{anime.title}</span>
                    <span className="search-dropdown-meta">
                      {anime.type} {anime.score?.arithmeticMean ? `• ${anime.score.arithmeticMean.toFixed(1)}` : ""}
                    </span>
                  </div>
                </div>
              ))}
              <div 
                className="search-dropdown-item search-all-item"
                onClick={handleSubmit}
              >
                <span className="search-dropdown-title">search all 40,000 anime...</span>
              </div>
            </>
          ) : inputValue.trim() ? (
            <div 
              className="search-dropdown-item search-all-item"
              onClick={handleSubmit}
            >
              <span className="search-dropdown-title">not in top 3000 • search all anime...</span>
            </div>
          ) : null}
        </div>
      )}
    </form>
  );
}

function useTopAnimeSearchResults(
  query: string, 
  isLoaded: boolean, 
  searchLocal: (q: string, limit: number) => { malId: string }[]
) {
  const [results, setResults] = useState<{ malId: string }[]>([]);
  
  useEffect(() => {
    if (!isLoaded || !query.trim()) {
      setResults([]);
      return;
    }
    
    const searchResults = searchLocal(query, 10);
    setResults(searchResults);
  }, [query, isLoaded, searchLocal]);
  
  return results;
}

export default RetroLayout;
