import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { UserMenu } from "../components/UserMenu";
import "./ListView.css";

function ListView() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const list = useQuery(
    api.lists.getList,
    id ? { listId: id as any } : "skip"
  );

  if (!list) {
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
              <Link to="/log">log</Link>
              <span className="nav-separator">/</span>
              <Link to="/forums">forums</Link>
              <span className="nav-separator">/</span>
              <Link to="/lists">lists</Link>
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
            <Link to="/profile">profile</Link>
            <span className="nav-separator">/</span>
            <Link to="/log">log</Link>
            <span className="nav-separator">/</span>
            <Link to="/forums">forums</Link>
            <span className="nav-separator">/</span>
            <Link to="/lists">lists</Link>
          </nav>
        </div>
        <div className="header-right">
          <UserMenu />
        </div>
      </header>

      <div className="action-bar">
        <button onClick={() => navigate("/lists")} className="raw-button">
          &lt; back to lists
        </button>
      </div>

      <div className="list-view-header">
        <h1 className="list-view-title">{list.title}</h1>
        <p className="list-view-description">{list.description}</p>
        <div className="list-view-meta">
          <span className="list-view-author">by {list.authorDisplayName}</span>
          <span className="list-view-count">
            {list.itemCount} {list.itemCount === 1 ? "anime" : "anime"}
          </span>
        </div>
      </div>

      <div className="board-content">
        {list.items.length === 0 ? (
          <div className="empty-state">
            <p>this list is empty. add some anime!</p>
          </div>
        ) : (
          <div className="entry-list">
            {list.items.map((anime, index) => (
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

export default ListView;
