import { useState } from "react";
import { useQuery } from "convex/react";
import { Link } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import { UserMenu } from "../components/UserMenu";
import { CreateListModal } from "../components/CreateListModal";
import "./ListsPage.css";

function ListsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const lists = useQuery(api.lists.getLists, {});

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
            <span className="nav-current">lists</span>
          </nav>
        </div>
        <div className="header-right">
          <UserMenu />
        </div>
      </header>

      <div className="lists-controls">
        <button 
          className="create-list-button"
          onClick={() => setShowCreateModal(true)}
        >
          + new list
        </button>
      </div>

      <div className="board-content">
        {lists === undefined ? (
          <div className="loading">
            <p>loading...</p>
          </div>
        ) : lists.length === 0 ? (
          <div className="empty-state">
            <p>no lists yet. create your first list!</p>
          </div>
        ) : (
          <div className="lists-grid">
            {lists.map((list) => (
              <Link 
                key={list._id} 
                to={`/lists/${list._id}/edit`}
                className="list-card-link"
              >
                <article className="list-card">
                  <h3 className="list-card-title">{list.title}</h3>
                  <p className="list-card-description">
                    {list.description.length > 100 
                      ? list.description.substring(0, 100) + "..." 
                      : list.description}
                  </p>
                  <div className="list-card-meta">
                    <span className="list-card-author">
                      by {list.authorDisplayName}
                    </span>
                    <span className="list-card-count">
                      {list.itemCount} {list.itemCount === 1 ? "anime" : "anime"}
                    </span>
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

      {showCreateModal && (
        <CreateListModal
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}

export default ListsPage;
