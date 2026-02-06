import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useConvexAuth } from "convex/react";
import "./CommentForm.css";

interface CommentFormProps {
  listId: string;
  parentCommentId?: string;
  initialContent?: string;
  isEditing?: boolean;
  commentId?: string;
  onSuccess?: () => void;
}

export function CommentForm({
  listId,
  parentCommentId,
  initialContent = "",
  isEditing = false,
  commentId,
  onSuccess,
}: CommentFormProps) {
  const [content, setContent] = useState(initialContent);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isAuthenticated } = useConvexAuth();

  const createComment = useMutation(api.listComments.createComment);
  const editComment = useMutation(api.listComments.editComment);

  if (!isAuthenticated) {
    return (
      <div className="comment-form-login">
        <p>please sign in to comment</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (isEditing && commentId) {
        await editComment({
          commentId: commentId as any,
          content: content.trim(),
        });
      } else {
        await createComment({
          listId: listId as any,
          content: content.trim(),
          parentCommentId: parentCommentId ? parentCommentId as any : undefined,
        });
      }
      setContent("");
      onSuccess?.();
    } catch (error) {
      console.error("Failed to save comment:", error);
      alert("Failed to save comment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="comment-form">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={
          parentCommentId 
            ? "write a reply..." 
            : isEditing 
            ? "edit your comment..." 
            : "write a comment..."
        }
        className="comment-textarea"
        rows={3}
        maxLength={2000}
      />
      
      <div className="comment-form-actions">
        <div className="comment-char-count">
          {content.length}/2000
        </div>
        
        <div className="comment-form-buttons">
          {isEditing && (
            <button
              type="button"
              onClick={() => {
                setContent(initialContent);
                onSuccess?.();
              }}
              className="comment-cancel-button"
              disabled={isSubmitting}
            >
              cancel
            </button>
          )}
          
          <button
            type="submit"
            disabled={!content.trim() || isSubmitting}
            className="comment-submit-button"
          >
            {isSubmitting ? "saving..." : isEditing ? "update" : "comment"}
          </button>
        </div>
      </div>
    </form>
  );
}