import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { UserMenu } from "../components/UserMenu";
import "./AnimeDetail.css";

function AnimeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const anime = useQuery(
    api.anime.getById,
    id ? { id: id as any } : "skip"
  );

  if (!anime) {
    return (
      <div className="board">
        <header className="board-header">
          <div className="header-left">
            <h1 className="site-title">analog</h1>
            <nav className="board-nav">
              <Link to="/">index</Link>
            </nav>
          </div>
          <div className="header-right">
            <UserMenu />
          </div>
        </header>
        <div className="loading">
          <p>loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="board">
      <header className="board-header">
        <div className="header-left">
          <h1 className="site-title">analog</h1>
          <nav className="board-nav">
            <Link to="/">index</Link>
            <span className="nav-separator">/</span>
            <span className="nav-current">entry</span>
          </nav>
        </div>
        <div className="header-right">
          <UserMenu />
        </div>
      </header>

      <div className="action-bar">
        <button onClick={() => navigate(-1)} className="raw-button">
          &lt; back
        </button>
      </div>

      <div className="divider">
        {anime.title}
      </div>

      <article className="detail-entry">
        <div className="detail-layout">
          {anime.picture && (
            <div className="detail-image">
              <img 
                src={anime.picture} 
                alt={anime.title}
              />
            </div>
          )}

          <div className="detail-info">
            {anime.synonyms && anime.synonyms.length > 0 && (
              <div className="info-row">
                <span className="info-label">alt:</span>
                <span className="info-value">{anime.synonyms.slice(0, 3).join(", ")}</span>
              </div>
            )}

            <table className="info-table">
              <tbody>
                <tr>
                  <td className="table-label">type</td>
                  <td className="table-value">{anime.type}</td>
                </tr>
                <tr>
                  <td className="table-label">status</td>
                  <td className="table-value">
                    <span className={`status-${anime.status?.toLowerCase().replace(/\s+/g, '-')}`}>
                      {anime.status}
                    </span>
                  </td>
                </tr>
                {anime.episodes && (
                  <tr>
                    <td className="table-label">episodes</td>
                    <td className="table-value">{anime.episodes}</td>
                  </tr>
                )}
                {anime.animeSeason?.year && (
                  <tr>
                    <td className="table-label">year</td>
                    <td className="table-value">{anime.animeSeason.year}</td>
                  </tr>
                )}
                {anime.animeSeason?.season && (
                  <tr>
                    <td className="table-label">season</td>
                    <td className="table-value">{anime.animeSeason.season}</td>
                  </tr>
                )}
                {anime.duration?.value && (
                  <tr>
                    <td className="table-label">duration</td>
                    <td className="table-value">
                      {anime.duration.value} {anime.duration.unit?.toLowerCase()}
                    </td>
                  </tr>
                )}
                {anime.score?.arithmeticMean && (
                  <tr>
                    <td className="table-label">score</td>
                    <td className="table-value score">{anime.score.arithmeticMean.toFixed(2)} / 10</td>
                  </tr>
                )}
              </tbody>
            </table>

            {anime.studios && anime.studios.length > 0 && (
              <div className="detail-section">
                <div className="section-title">studios</div>
                <div className="detail-tags">
                  {anime.studios.map((studio: string, i: number) => (
                    <span key={i} className="detail-tag">{studio}</span>
                  ))}
                </div>
              </div>
            )}

            {anime.producers && anime.producers.length > 0 && (
              <div className="detail-section">
                <div className="section-title">producers</div>
                <div className="detail-tags">
                  {anime.producers.map((producer: string, i: number) => (
                    <span key={i} className="detail-tag">{producer}</span>
                  ))}
                </div>
              </div>
            )}

            {anime.tags && anime.tags.length > 0 && (
              <div className="detail-section">
                <div className="section-title">tags</div>
                <div className="detail-tags">
                  {anime.tags.map((tag: string, i: number) => (
                    <span key={i} className="detail-tag">{tag}</span>
                  ))}
                </div>
              </div>
            )}

            {anime.sources && anime.sources.length > 0 && (
              <div className="detail-section">
                <div className="section-title">sources</div>
                <ul className="source-links">
                  {anime.sources.slice(0, 5).map((source: string, i: number) => (
                    <li key={i}>
                      <a href={source} target="_blank" rel="noopener noreferrer">
                        {source.split('/')[2]}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </article>

      <footer className="board-footer">
        <p>analog v1.0</p>
      </footer>
    </div>
  );
}

export default AnimeDetail;
