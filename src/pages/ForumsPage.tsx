import { useState } from "react";
import { useQuery } from "convex/react";
import { Link } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import { UserMenu } from "../components/UserMenu";
import { CreateThreadModal } from "../components/CreateThreadModal";
import "./ForumsPage.css";

type TagType = "all" | "anime" | "manga" | "visual novel";

const TAGS: TagType[] = ["all", "anime", "manga", "visual novel"];

function ForumsPage() {
  const [activeTag, setActiveTag] = useState<TagType>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const threads = useQuery(
    api.forums.getThreads, 
    activeTag === "all" ? {} : { tag: activeTag }
  );

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
            <span className="nav-current">forums</span>
            <span className="nav-separator">/</span>
            <Link to="/lists">lists</Link>
            <span className="nav-separator">/</span>
            <Link to="/friends">friends</Link>
          </nav>
        </div>
        <div className="header-right">
          <UserMenu />
        </div>
      </header>

      <div className="forums-controls">
        <div className="tag-filter">
          {TAGS.map((tag) => (
            <button
              key={tag}
              className={`tag-button ${activeTag === tag ? "active" : ""}`}
              onClick={() => setActiveTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
        <button 
          className="create-thread-button"
          onClick={() => setShowCreateModal(true)}
        >
          + new thread
        </button>
      </div>

      <div className="board-content">
        {threads === undefined ? (
          <div className="loading">
            <p>loading...</p>
          </div>
        ) : threads.length === 0 ? (
          <div className="empty-state">
            <p>no threads yet. be the first to post!</p>
          </div>
        ) : (
          <div className="thread-list">
            {threads.map((thread) => (
              <Link 
                key={thread._id} 
                to={`/forums/thread/${thread._id}`}
                className="thread-link"
              >
                <article className="thread-card">
                  <div className="thread-header">
                    <span className={`thread-tag ${thread.tag.replace(" ", "-")}`}>
                      {thread.tag}
                    </span>
                    <span className="thread-replies">
                      {thread.replyCount} {thread.replyCount === 1 ? "reply" : "replies"}
                    </span>
                  </div>
                  <h3 className="thread-title">{thread.title}</h3>
                  <p className="thread-preview">{thread.preview}</p>
                  <div className="thread-meta">
                    <span className="thread-author">
                      by {thread.authorDisplayName}
                    </span>
                    <span className="thread-date">
                      {new Date(thread.updatedAt).toLocaleDateString()}
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
        <CreateThreadModal
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}

export default ForumsPage;
