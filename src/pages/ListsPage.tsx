import { useState } from "react";
import { useQuery } from "convex/react";
import { Link } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import { UserMenu } from "../components/UserMenu";
import { CreateListModal } from "../components/CreateListModal";
import { useConvexAuth } from "convex/react";
import "./ListsPage.css";

function ListsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { isAuthenticated } = useConvexAuth();
  
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
            <span className="nav-separator">/</span>
            <Link to="/friends">friends</Link>
          </nav>
        </div>
        <div className="header-right">
          <UserMenu />
        </div>
      </header>

      <div className="lists-controls">
        {isAuthenticated && (
          <button 
            className="create-list-button"
            onClick={() => setShowCreateModal(true)}
          >
            + new list
          </button>
        )}
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
                to={list.isOwner ? `/lists/${list._id}/edit` : `/lists/${list._id}`}
                className={`list-card-link ${list.isOwner ? 'owned-list' : 'view-list'}`}
              >
                <article className={`list-card ${list.isOwner ? 'owned-card' : 'view-card'}`}>
                  <div className="list-card-header">
                    <h3 className="list-card-title">{list.title}</h3>
                    {list.isOwner && (
                      <span className="owned-badge">owned</span>
                    )}
                  </div>
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
                  <div className="list-card-action">
                    {list.isOwner ? 'edit' : 'view'}
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
