import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../convex/_generated/api";
import RetroLayout from "./components/RetroLayout";
import "./IndexPage.css";

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
  const [searchParams] = useSearchParams();

  const debouncedInput = useDebounce(inputValue, 300);

  const animes = useQuery(
    api.anime.searchByTitle,
    searchQuery ? { query: searchQuery, limit: 50 } : "skip"
  );

  useEffect(() => {
    const queryFromUrl = searchParams.get("q");
    if (queryFromUrl) {
      setInputValue(queryFromUrl);
      setSearchQuery(queryFromUrl);
    }
  }, []);

  useEffect(() => {
    if (debouncedInput !== searchQuery) {
      setSearchQuery(debouncedInput);
    }
  }, [debouncedInput, searchQuery]);

  return (
    <RetroLayout>
      <div className="index-view">
        <div className="content-header">
          <h2 className="page-title">{searchQuery ? "search results" : "browse anime"}</h2>
          {searchQuery && (
            <span className="results-count">
              {animes?.length ?? 0} result{(animes?.length ?? 0) !== 1 ? "s" : ""} for "{searchQuery}"
            </span>
          )}
        </div>

        <div className="filter-bar">
          <span className="filter-label">filter by:</span>
          <select className="select">
            <option>all types</option>
            <option>TV</option>
            <option>Movie</option>
            <option>OVA</option>
            <option>Special</option>
          </select>
          <select className="select">
            <option>all years</option>
            <option>2024</option>
            <option>2023</option>
            <option>2022</option>
            <option>2021</option>
            <option>2020</option>
          </select>
          <select className="select">
            <option>all status</option>
            <option>currently airing</option>
            <option>finished</option>
            <option>not yet aired</option>
          </select>
          {searchQuery && (
            <button className="btn btn-small" onClick={() => setSearchQuery("")}>
              clear search
            </button>
          )}
        </div>

        {searchQuery && animes && animes.length > 0 && (
          <div className="anime-grid animate-slide-up">
            {animes.map((anime, index) => (
              <AnimeCard key={anime._id} anime={anime} index={index} />
            ))}
          </div>
        )}

        {searchQuery && animes && animes.length === 0 && (
          <div className="empty-state">
            <p>no anime found matching your search.</p>
          </div>
        )}

        {!searchQuery && (
          <div className="welcome-area animate-fade-in">
            <div className="welcome-content">
              <h2 className="welcome-title">discover anime</h2>
              <p className="welcome-text">
                search for your favorite anime, track what you've watched,
                and share your lists with friends.
              </p>
              <p className="welcome-hint">↑ use the search bar above to get started</p>
            </div>
          </div>
        )}
      </div>
    </RetroLayout>
  );
}

function AnimeCard({ anime, index }: { anime: any; index: number }) {
  const status = useQuery(api.userAnime.getUserAnimeStatus, { animeId: anime._id });

  return (
    <Link
      to={`/anime/${anime._id}`}
      className="anime-card"
      style={{ animationDelay: `${index * 30}ms` }}
    >
      <div className="card-image">
        {anime.picture ? (
          <img src={anime.picture} alt={anime.title} loading="lazy" />
        ) : (
          <div className="image-placeholder">
            <span className="placeholder-icon">◇</span>
          </div>
        )}
        {status?.isFavorite && <span className="badge badge-favorite">★</span>}
        {status?.isWatched && <span className="badge badge-watched">✓</span>}
      </div>
      <div className="card-body">
        <h3 className="card-title">{anime.title}</h3>
        <div className="card-meta">
          <span className="meta-type">{anime.type}</span>
          <span className="meta-sep">•</span>
          <span className="meta-eps">
            {anime.episodes ? `${anime.episodes} ep${anime.episodes !== 1 ? "s" : ""}` : "?"}
          </span>
          <span className="meta-sep">•</span>
          <span className="meta-year">{anime.animeSeason?.year || "?"}</span>
        </div>
        <div className="card-footer">
          <span className="card-score">
            {anime.score?.arithmeticMean ? anime.score.arithmeticMean.toFixed(2) : "—"}
          </span>
          <span className={`card-status status-${anime.status?.toLowerCase().replace(/\s+/g, "-")}`}>
            {anime.status}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default App;
