import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import "./CreateListModal.css";

interface CreateListModalProps {
  onClose: () => void;
}

export function CreateListModal({ onClose }: CreateListModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createList = useMutation(api.lists.createList);

  const wordCount = description.trim().split(/\s+/).filter(word => word.length > 0).length;
  const isOverLimit = wordCount > 300;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || isSubmitting || isOverLimit) return;

    setIsSubmitting(true);
    try {
      await createList({
        title: title.trim(),
        description: description.trim(),
      });
      onClose();
    } catch (error) {
      console.error("Failed to create list:", error);
      alert("Failed to create list. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content list-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">create new list</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">title:</label>
            <input
              type="text"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="enter list title..."
              maxLength={200}
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">description:</label>
            <textarea
              className="form-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="describe your list..."
              rows={6}
              required
            />
            <div className={`word-count ${isOverLimit ? "over-limit" : ""}`}>
              {wordCount}/300 words
            </div>
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
              disabled={isSubmitting || !title.trim() || !description.trim() || isOverLimit}
            >
              {isSubmitting ? "creating..." : "create list"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
