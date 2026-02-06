import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { UserMenu } from "../components/UserMenu";
import { CommentSection } from "../components/CommentSection";
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
        {list.isOwner && (
          <button 
            onClick={() => navigate(`/lists/${id}/edit`)} 
            className="raw-button"
          >
            edit this list
          </button>
        )}
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
          <div className="archive-grid">
            {list.items.map((anime) => (
              <Link 
                key={anime._id} 
                to={`/anime/${anime._id}`}
                className="poster-item"
              >
                {anime.picture && (
                  <img 
                    src={anime.picture} 
                    alt={anime.title}
                    className="poster-image"
                  />
                )}
                <div className="poster-overlay">
                  <h3 className="poster-title">{anime.title}</h3>
                  <div className="poster-meta">
                    <span className="poster-type">{anime.type}</span>
                    {anime.score?.arithmeticMean && (
                      <span className="poster-score">
                        {anime.score.arithmeticMean.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Comments Section - Only in view mode, below the anime grid */}
      <div className="list-comments-section">
        <CommentSection listId={id!} />
      </div>

      <footer className="board-footer">
        <p>analog v1.0</p>
      </footer>
    </div>
  );
}

export default ListView;
