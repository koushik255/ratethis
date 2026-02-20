import { useState, memo } from "react";
import { useMutation, useQuery } from "convex/react";
import { useConvexAuth } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import "./EpisodeLogger.css";

interface EpisodeLoggerProps {
  animeId: Id<"anime">;
  animeTitle: string;
  totalEpisodes?: number;
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export const EpisodeLogger = memo(function EpisodeLogger({
  animeId,
  animeTitle,
  totalEpisodes,
}: EpisodeLoggerProps) {
  const { isAuthenticated } = useConvexAuth();
  const [episodeNumber, setEpisodeNumber] = useState<string>("");
  const [comment, setComment] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const progress = useQuery(api.episodeLogs.getMyProgressForAnime, { animeId });
  const logEpisode = useMutation(api.episodeLogs.logEpisode);
  const removeEpisodeLog = useMutation(api.episodeLogs.removeEpisodeLog);

  if (!isAuthenticated) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const epNum = parseInt(episodeNumber, 10);
    if (isNaN(epNum) || epNum < 1) return;
    if (totalEpisodes && epNum > totalEpisodes) return;

    setIsSubmitting(true);
    try {
      await logEpisode({
        animeId,
        animeTitle,
        episodeNumber: epNum,
        comment: comment.trim() || undefined,
      });
      setEpisodeNumber("");
      setComment("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async (episodeNum: number) => {
    await removeEpisodeLog({ animeId, episodeNumber: episodeNum });
  };

  const maxEp = totalEpisodes || 9999;

  return (
    <section className="episode-logger">
      <div className="logger-header">
        <span className="logger-label">episode log</span>
        {totalEpisodes && (
          <span className="logger-meta">
            {progress?.length || 0} / {totalEpisodes} logged
          </span>
        )}
      </div>

      <form className="logger-form" onSubmit={handleSubmit}>
        <div className="logger-row">
          <div className="episode-input-group">
            <label htmlFor="episode-number" className="input-label">
              ep.
            </label>
            <input
              id="episode-number"
              type="number"
              min={1}
              max={maxEp}
              value={episodeNumber}
              onChange={(e) => setEpisodeNumber(e.target.value)}
              placeholder="1"
              className="episode-number-input"
              disabled={isSubmitting}
            />
          </div>

          <div className="comment-input-group">
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="add a note (optional)"
              className="comment-input"
              disabled={isSubmitting}
            />
          </div>

          <button
            type="submit"
            className="log-submit"
            disabled={isSubmitting || !episodeNumber}
          >
            {isSubmitting ? "..." : "log"}
          </button>
        </div>
      </form>

      {progress && progress.length > 0 && (
        <div className="progress-section">
          <div className="progress-header">your progress</div>
          <ul className="progress-list">
            {progress.map((log) => (
              <li key={log._id} className="progress-item">
                <div className="progress-episode">
                  <span className="ep-badge">ep. {log.episodeNumber}</span>
                  <span className="ep-date">{formatDate(log.loggedAt)}</span>
                </div>
                {log.comment && (
                  <p className="ep-comment">&ldquo;{log.comment}&rdquo;</p>
                )}
                <button
                  className="remove-btn"
                  onClick={() => handleRemove(log.episodeNumber)}
                  title="remove log"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
});
