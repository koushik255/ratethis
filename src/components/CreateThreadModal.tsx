import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import "./CreateThreadModal.css";

type TagType = "anime" | "manga" | "visual novel";

const TAGS: TagType[] = ["anime", "manga", "visual novel"];

interface CreateThreadModalProps {
  onClose: () => void;
}

export function CreateThreadModal({ onClose }: CreateThreadModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tag, setTag] = useState<TagType>("anime");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createThread = useMutation(api.forums.createThread);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await createThread({
        title: title.trim(),
        content: content.trim(),
        tag,
      });
      onClose();
    } catch (error) {
      console.error("Failed to create thread:", error);
      alert("Failed to create thread. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content thread-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">create new thread</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">tag:</label>
            <select 
              className="form-select"
              value={tag}
              onChange={(e) => setTag(e.target.value as TagType)}
            >
              {TAGS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label className="form-label">title:</label>
            <input
              type="text"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="enter thread title..."
              maxLength={200}
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">content:</label>
            <textarea
              className="form-textarea"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="write your post..."
              rows={6}
              required
            />
          </div>
          
          <div className="modal-actions">
            <button 
              type="button"
              className="modal-button cancel" 
              onClick={onClose}
              disabled={isSubmitting}
            >
              cancel
            </button>
            <button 
              type="submit"
              className="modal-button submit" 
              disabled={isSubmitting || !title.trim() || !content.trim()}
            >
              {isSubmitting ? "creating..." : "create thread"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
