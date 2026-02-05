import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { UserMenu } from "../components/UserMenu";
import { AnimeSearchPanel } from "../components/AnimeSearchPanel";
import "./ListBuilder.css";

function ListBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showSearchPanel, setShowSearchPanel] = useState(false);
  
  const list = useQuery(
    api.lists.getList,
    id ? { listId: id as any } : "skip"
  );

  const removeFromList = useMutation(api.lists.removeFromList);

  const handleRemove = async (animeId: string) => {
    if (!id || !window.confirm("Remove this anime from the list?")) return;
    
    try {
      await removeFromList({ 
        listId: id as any, 
        animeId: animeId as any 
      });
    } catch (error) {
      console.error("Failed to remove:", error);
      alert("Failed to remove anime.");
    }
  };

  const handleAddToList = () => {
    setShowSearchPanel(true);
  };

  const handleCloseSearch = () => {
    setShowSearchPanel(false);
  };

  const handleAnimeAdded = () => {
    setShowSearchPanel(false);
  };

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

      <div className="list-builder-header">
        <h1 className="list-builder-title">{list.title}</h1>
        <p className="list-builder-description">{list.description}</p>
        <div className="list-builder-meta">
          <span className="list-builder-count">
            {list.itemCount} {list.itemCount === 1 ? "anime" : "anime"}
          </span>
          <button 
            className="add-anime-button"
            onClick={handleAddToList}
          >
            + add anime
          </button>
        </div>
      </div>

      <div className="list-builder-content">
        {list.items.length === 0 ? (
          <div className="empty-state">
            <button 
              className="empty-add-button"
              onClick={handleAddToList}
            >
              +
            </button>
            <p>start adding anime to your list</p>
          </div>
        ) : (
          <div className="list-grid">
            {list.items.map((anime) => (
              <div key={anime._id} className="list-grid-item">
                <div className="list-item-image">
                  {anime.picture && (
                    <img 
                      src={anime.picture} 
                      alt={anime.title}
                      className="list-item-img"
                    />
                  )}
                </div>
                <div className="list-item-content">
                  <h3 className="list-item-title">{anime.title}</h3>
                  <div className="list-item-meta">
                    <span className="list-item-type">{anime.type}</span>
                    {anime.score?.arithmeticMean && (
                      <span className="list-item-score">
                        {anime.score.arithmeticMean.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  className="remove-item-button"
                  onClick={() => handleRemove(anime._id)}
                  title="Remove from list"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showSearchPanel && (
        <AnimeSearchPanel
          listId={id!}
          onClose={handleCloseSearch}
          onAnimeAdded={handleAnimeAdded}
        />
      )}

      <footer className="board-footer">
        <p>analog v1.0</p>
      </footer>
    </div>
  );
}

export default ListBuilder;
