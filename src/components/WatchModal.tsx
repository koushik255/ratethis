import { useState } from "react";
import "./WatchModal.css";

interface WatchModalProps {
  animeTitle: string;
  onSubmit: (comment: string) => void;
  onCancel: () => void;
}

export function WatchModal({ animeTitle, onSubmit, onCancel }: WatchModalProps) {
  const [comment, setComment] = useState("");

  const wordCount = comment.trim().split(/\s+/).filter(word => word.length > 0).length;
  const isOverLimit = wordCount > 200;

  const handleSubmit = () => {
    if (!isOverLimit) {
      onSubmit(comment.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onCancel();
    }
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">add your thoughts on &quot;{animeTitle}&quot;</h3>
        <textarea
          className="modal-textarea"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="what did you think? (optional)"
          rows={4}
        />
        <div className={`modal-wordcount ${isOverLimit ? "over-limit" : ""}`}>
          {wordCount}/200 words
        </div>
        <div className="modal-actions">
          <button 
            className="modal-button cancel" 
            onClick={onCancel}
          >
            cancel
          </button>
          <button 
            className="modal-button submit" 
            onClick={handleSubmit}
            disabled={isOverLimit}
          >
            mark as watched
          </button>
        </div>
      </div>
    </div>
  );
}
