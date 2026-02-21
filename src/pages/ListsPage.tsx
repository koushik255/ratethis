import { useState } from "react";
import { useQuery } from "convex/react";
import { Link } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import RetroLayout from "../components/RetroLayout";
import { CreateListModal } from "../components/CreateListModal";
import { useConvexAuth } from "convex/react";
import "./ListsPage.css";

function ListsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { isAuthenticated } = useConvexAuth();

  const lists = useQuery(api.lists.getLists, {});

  return (
    <RetroLayout>
      <div className="lists-view animate-fade-in">
        <div className="content-header">
          <h2 className="page-title">lists</h2>
          {isAuthenticated && (
            <button
              className="btn"
              onClick={() => setShowCreateModal(true)}
            >
              + new list
            </button>
          )}
        </div>

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
                className="list-card"
              >
                <div className="list-card-header">
                  <h3 className="list-card-title">{list.title}</h3>
                  {list.isOwner && (
                    <span className="badge badge-success">owned</span>
                  )}
                </div>
                <p className="list-card-desc">
                  {list.description.length > 100
                    ? list.description.substring(0, 100) + "..."
                    : list.description}
                </p>
                <div className="list-card-meta">
                  <span>by {list.authorDisplayName}</span>
                  <span>{list.itemCount} anime</span>
                </div>
                <div className="list-card-action">
                  {list.isOwner ? "edit →" : "view →"}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateListModal onClose={() => setShowCreateModal(false)} />
      )}
    </RetroLayout>
  );
}

export default ListsPage;
