import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import RetroLayout from "../components/RetroLayout";
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
      <RetroLayout>
        <div className="loading">
          <p>loading...</p>
        </div>
      </RetroLayout>
    );
  }

  return (
    <RetroLayout>
      <div className="list-view animate-fade-in">
        <nav className="breadcrumb">
          <Link to="/lists">lists</Link>
          <span className="breadcrumb-sep">»</span>
          <span className="breadcrumb-current">{list.title}</span>
        </nav>

        <div className="content-header">
          <h2 className="page-title">{list.title}</h2>
          <div className="list-actions">
            <button className="btn" onClick={() => navigate("/lists")}>
              ← back
            </button>
            {list.isOwner && (
              <button
                className="btn"
                onClick={() => navigate(`/lists/${id}/edit`)}
              >
                edit
              </button>
            )}
          </div>
        </div>

        <div className="list-info card">
          <p className="list-description">{list.description}</p>
          <div className="list-meta">
            <span>by {list.authorDisplayName}</span>
            <span>{list.itemCount} anime</span>
          </div>
        </div>

        {list.items.length === 0 ? (
          <div className="empty-state">
            <p>this list is empty.</p>
          </div>
        ) : (
          <div className="list-anime-grid">
            {list.items.map((anime) => (
              <Link
                key={anime._id}
                to={`/anime/${anime._id}`}
                className="list-anime-card"
              >
                {anime.picture ? (
                  <img src={anime.picture} alt={anime.title} className="list-anime-img" />
                ) : (
                  <div className="list-anime-placeholder">
                    <span>no image</span>
                  </div>
                )}
                <div className="list-anime-info">
                  <h3 className="list-anime-title">{anime.title}</h3>
                  <div className="list-anime-meta">
                    <span>{anime.type}</span>
                    {anime.score?.arithmeticMean && (
                      <span className="list-anime-score">
                        {anime.score.arithmeticMean.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="list-comments card">
          <div className="card-header">comments</div>
          <div className="card-body">
            <CommentSection listId={id!} />
          </div>
        </div>
      </div>
    </RetroLayout>
  );
}

export default ListView;
