import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { useConvexAuth } from "convex/react";
import { api } from "../../convex/_generated/api";
import RetroLayout from "../components/RetroLayout";
import { EpisodeLogger } from "../components/EpisodeLogger";
import "./AnimeDetail.css";

function AnimeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useConvexAuth();

  const anime = useQuery(
    api.anime.getById,
    id ? { id: id as any } : "skip"
  );

  const status = useQuery(
    api.userAnime.getUserAnimeStatus,
    id && isAuthenticated ? { animeId: id as any } : "skip"
  );

  const toggleFavorite = useMutation(api.userAnime.toggleFavorite);
  const toggleWatched = useMutation(api.userAnime.toggleWatched);

  if (!anime) {
    return (
      <RetroLayout hideSearch>
        <div className="loading">
          <p>loading...</p>
        </div>
      </RetroLayout>
    );
  }

  const handleFavorite = () => {
    void toggleFavorite({ animeId: anime._id });
  };

  const handleWatched = () => {
    void toggleWatched({ animeId: anime._id });
  };

  return (
    <RetroLayout hideSearch>
      <div className="entry-view animate-fade-in">
        <nav className="breadcrumb">
          <Link to="/">index</Link>
          <span className="breadcrumb-sep">»</span>
          <Link to={`/?type=${anime.type}`}>{anime.type}</Link>
          <span className="breadcrumb-sep">»</span>
          {anime.animeSeason?.year && (
            <>
              <Link to={`/?year=${anime.animeSeason.year}`}>{anime.animeSeason.year}</Link>
              <span className="breadcrumb-sep">»</span>
            </>
          )}
          <span className="breadcrumb-current">{anime.title}</span>
        </nav>

        <div className="entry-main">
          <div className="entry-poster">
            {anime.picture ? (
              <img src={anime.picture} alt={anime.title} className="poster-image" />
            ) : (
              <div className="poster-placeholder">
                <span>no image</span>
              </div>
            )}
            {isAuthenticated && (
              <div className="poster-actions">
                <button
                  className={`poster-btn ${status?.isFavorite ? "active" : ""}`}
                  onClick={handleFavorite}
                >
                  {status?.isFavorite ? "★ favorited" : "☆ favorite"}
                </button>
                <button
                  className={`poster-btn ${status?.isWatched ? "active" : ""}`}
                  onClick={handleWatched}
                >
                  {status?.isWatched ? "✓ watched" : "○ mark watched"}
                </button>
              </div>
            )}
          </div>

          <div className="entry-content">
            <div className="entry-header">
              <h1 className="entry-title">{anime.title}</h1>
              {anime.animeSeason?.year && (
                <span className="entry-year">{anime.animeSeason.year}</span>
              )}
            </div>

            <div className="entry-meta-row">
              <div className="meta-item">
                <span className="meta-label">type</span>
                <span className="meta-value">{anime.type}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">episodes</span>
                <span className="meta-value">{anime.episodes || "?"}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">status</span>
                <span className={`meta-value status-${anime.status?.toLowerCase().replace(/\s+/g, "-")}`}>
                  {anime.status}
                </span>
              </div>
              {anime.animeSeason?.season && (
                <div className="meta-item">
                  <span className="meta-label">season</span>
                  <span className="meta-value">{anime.animeSeason.season}</span>
                </div>
              )}
              {anime.duration?.value && (
                <div className="meta-item">
                  <span className="meta-label">duration</span>
                  <span className="meta-value">
                    {anime.duration.value} {anime.duration.unit?.toLowerCase()}
                  </span>
                </div>
              )}
            </div>

            {anime.score?.arithmeticMean && (
              <div className="entry-score-box">
                <span className="score-label">score</span>
                <span className="score-value">{anime.score.arithmeticMean.toFixed(2)}</span>
                <span className="score-max">/ 10</span>
              </div>
            )}

            {anime.studios && anime.studios.length > 0 && (
              <div className="entry-section">
                <span className="section-label">studios</span>
                <div className="entry-tags">
                  {anime.studios.map((studio: string, i: number) => (
                    <span key={i} className="tag">{studio}</span>
                  ))}
                </div>
              </div>
            )}

            {anime.producers && anime.producers.length > 0 && (
              <div className="entry-section">
                <span className="section-label">producers</span>
                <div className="entry-tags">
                  {anime.producers.map((producer: string, i: number) => (
                    <span key={i} className="tag">{producer}</span>
                  ))}
                </div>
              </div>
            )}

            {anime.synonyms && anime.synonyms.length > 0 && (
              <div className="entry-section">
                <span className="section-label">alternative titles</span>
                <p className="synonyms">{anime.synonyms.slice(0, 3).join(", ")}</p>
              </div>
            )}
          </div>
        </div>

        <EpisodeLogger
          animeId={anime._id}
          animeTitle={anime.title}
          totalEpisodes={anime.episodes ?? undefined}
        />

        {anime.sources && anime.sources.length > 0 && (
          <div className="entry-links card">
            <div className="card-header">external links</div>
            <div className="card-body">
              <div className="links-row">
                {anime.sources.slice(0, 5).map((source: string, i: number) => (
                  <a
                    key={i}
                    href={source}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ext-link"
                  >
                    {source.split("/")[2]} →
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="entry-nav">
          <button className="btn" onClick={() => navigate(-1)}>
            ← back
          </button>
        </div>
      </div>
    </RetroLayout>
  );
}

export default AnimeDetail;
