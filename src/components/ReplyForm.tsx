import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useConvexAuth } from "convex/react";
import "./ReplyForm.css";

interface ReplyFormProps {
  listId: string;
  parentCommentId: string;
  onCancel: () => void;
  onSuccess?: () => void;
}

export function ReplyForm({ listId, parentCommentId, onCancel, onSuccess }: ReplyFormProps) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isAuthenticated } = useConvexAuth();

  const createComment = useMutation(api.listComments.createComment);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting || !isAuthenticated) return;

    setIsSubmitting(true);
    try {
      await createComment({
        listId: listId as any,
        content: content.trim(),
        parentCommentId: parentCommentId as any,
      });
      setContent("");
      onSuccess?.();
      onCancel();
    } catch (error) {
      console.error("Failed to create reply:", error);
      alert("Failed to create reply. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="reply-form-login">
        <p>please sign in to reply</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="reply-form">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="write a reply..."
        className="reply-textarea"
        rows={2}
        maxLength={2000}
        disabled={isSubmitting}
      />
      
      <div className="reply-form-actions">
        <div className="reply-char-count">
          {content.length}/2000
        </div>
        
        <div className="reply-form-buttons">
          <button
            type="button"
            onClick={onCancel}
            className="reply-cancel-button"
            disabled={isSubmitting}
          >
            cancel
          </button>
          
          <button
            type="submit"
            disabled={!content.trim() || isSubmitting}
            className="reply-submit-button"
          >
            {isSubmitting ? "posting..." : "reply"}
          </button>
        </div>
      </div>
    </form>
  );
}