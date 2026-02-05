import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { useConvexAuth } from "convex/react";
import { api } from "../../convex/_generated/api";
import { UserMenu } from "../components/UserMenu";
import "./ThreadView.css";

function ThreadView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useConvexAuth();
  const [replyContent, setReplyContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const thread = useQuery(
    api.forums.getThread,
    id ? { threadId: id as any } : "skip"
  );
  
  const replies = useQuery(
    api.forums.getThreadReplies,
    id ? { threadId: id as any } : "skip"
  );

  const createReply = useMutation(api.forums.createReply);

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || !id || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await createReply({
        threadId: id as any,
        content: replyContent.trim(),
      });
      setReplyContent("");
    } catch (error) {
      console.error("Failed to post reply:", error);
      alert("Failed to post reply. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!thread) {
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
        <button onClick={() => navigate("/forums")} className="raw-button">
          &lt; back to forums
        </button>
      </div>

      <article className="thread-view">
        <div className="thread-view-header">
          <span className={`thread-view-tag ${thread.tag.replace(" ", "-")}`}>
            {thread.tag}
          </span>
          <h1 className="thread-view-title">{thread.title}</h1>
          <div className="thread-view-meta">
            <span className="thread-view-author">
              by {thread.authorDisplayName}
            </span>
            <span className="thread-view-date">
              {new Date(thread.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
        
        <div className="thread-view-content">
          {thread.content}
        </div>
      </article>

      <div className="replies-section">
        <div className="replies-header">
          <span className="replies-count">
            {thread.replyCount} {thread.replyCount === 1 ? "reply" : "replies"}
          </span>
        </div>

        <div className="replies-list">
          {replies?.map((reply) => (
            <div key={reply._id} className="reply-card">
              <div className="reply-header">
                <span className="reply-author">
                  {reply.authorDisplayName}
                </span>
                <span className="reply-date">
                  {new Date(reply.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="reply-content">
                {reply.content}
              </div>
            </div>
          ))}
        </div>

        {isAuthenticated && (
          <form className="reply-form" onSubmit={handleReplySubmit}>
            <textarea
              className="reply-textarea"
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="write a reply..."
              rows={4}
              required
            />
            <button 
              type="submit" 
              className="reply-submit"
              disabled={isSubmitting || !replyContent.trim()}
            >
              {isSubmitting ? "posting..." : "post reply"}
            </button>
          </form>
        )}
      </div>

      <footer className="board-footer">
        <p>analog v1.0</p>
      </footer>
    </div>
  );
}

export default ThreadView;
