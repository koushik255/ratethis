import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { CommentForm } from "./CommentForm";
import { ReplyForm } from "./ReplyForm";
import "./CommentSection.css";

interface Comment {
  _id: string;
  content: string;
  authorId: string;
  authorDisplayName: string;
  authorProfilePicture?: string;
  createdAt: number;
  updatedAt: number;
  replyCount: number;
  parentCommentId?: string;
  isDeleted: boolean;
}

interface CommentSectionProps {
  listId: string;
}

export function CommentSection({ listId }: CommentSectionProps) {
  const [showReplyForm, setShowReplyForm] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);

  const comments = useQuery(
    api.listComments.getListComments,
    { listId: listId as any }
  );

  const commentCount = useQuery(
    api.listComments.getListCommentCount,
    { listId: listId as any }
  );

  const canComment = useQuery(
    api.listComments.canUserComment,
    { listId: listId as any }
  );

  const deleteCommentMutation = useMutation(api.listComments.deleteComment);

  const handleDelete = async (commentId: string) => {
    if (!window.confirm("Delete this comment?")) return;
    
    try {
      await deleteCommentMutation({ commentId: commentId as any });
    } catch (error) {
      console.error("Failed to delete comment:", error);
      alert("Failed to delete comment.");
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return "just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  if (!comments || commentCount === undefined || canComment === undefined) {
    return <div className="loading">loading comments...</div>;
  }

  return (
    <div className="comment-section">
      <div className="comment-header">
        <h3 className="comment-title">
          {commentCount === 1 ? "1 comment" : `${commentCount} comments`}
        </h3>
      </div>

      {canComment && (
        <CommentForm
          listId={listId}
          onSuccess={() => setShowReplyForm(null)}
        />
      )}

      <div className="comment-list">
        {comments.map((comment: Comment) => (
          <div key={comment._id} className="comment">
            <div className="comment-avatar">
              {comment.authorProfilePicture ? (
                <img 
                  src={comment.authorProfilePicture} 
                  alt={comment.authorDisplayName}
                  className="avatar-img"
                />
              ) : (
                <div className="avatar-placeholder">
                  {comment.authorDisplayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div className="comment-body">
              <div className="comment-meta">
                <span className="comment-author">{comment.authorDisplayName}</span>
                <span className="comment-time">
                  {formatTimestamp(comment.createdAt)}
                </span>
                {comment.updatedAt > comment.createdAt && (
                  <span className="comment-edited">(edited)</span>
                )}
              </div>

              {editingComment === comment._id ? (
                <CommentForm
                  listId={listId}
                  parentCommentId={comment._id}
                  initialContent={comment.content}
                  isEditing={true}
                  commentId={comment._id}
                  onSuccess={() => {
                    setEditingComment(null);
                    setShowReplyForm(null);
                  }}
                />
              ) : (
                <div className="comment-content">
                  {comment.content}
                </div>
              )}

              <div className="comment-actions">
                {!comment.isDeleted && (
                  <>
                    <button
                      className="comment-action-button"
                      onClick={() => setShowReplyForm(
                        showReplyForm === comment._id ? null : comment._id
                      )}
                    >
                      reply
                    </button>
                    
                    {/* Add edit/delete buttons for own comments */}
                    {/* TODO: Check if current user is comment author */}
                    {false && (
                      <>
                        <button
                          className="comment-action-button"
                          onClick={() => setEditingComment(
                            editingComment === comment._id ? null : comment._id
                          )}
                        >
                          edit
                        </button>
                        <button
                          className="comment-action-button comment-delete"
                          onClick={() => handleDelete(comment._id)}
                        >
                          delete
                        </button>
                      </>
                    )}
                  </>
                )}

                {comment.replyCount > 0 && (
                  <span className="reply-count">
                    {comment.replyCount} {comment.replyCount === 1 ? "reply" : "replies"}
                  </span>
                )}
              </div>

              {showReplyForm === comment._id && (
                <ReplyForm
                  listId={listId}
                  parentCommentId={comment._id}
                  onCancel={() => setShowReplyForm(null)}
                  onSuccess={() => setShowReplyForm(null)}
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {comments.length === 0 && (
        <div className="no-comments">
          <p>no comments yet add one!</p>
        </div>
      )}
    </div>
  );
}