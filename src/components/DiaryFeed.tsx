import { memo } from "react";
import { Link } from "react-router-dom";
import { Doc } from "../../convex/_generated/dataModel";
import "./DiaryFeed.css";

type EpisodeLog = Doc<"episodeLogs">;

interface DiaryFeedProps {
  logs: EpisodeLog[] | undefined;
  loading?: boolean;
  emptyMessage?: string;
}

function getDateLabel(timestamp: number): string {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const isToday = date.toDateString() === today.toDateString();
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) return "today";
  if (isYesterday) return "yesterday";

  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
  });
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function groupLogsByDate(logs: EpisodeLog[]): Map<string, EpisodeLog[]> {
  const groups = new Map<string, EpisodeLog[]>();

  for (const log of logs) {
    const label = getDateLabel(log.loggedAt);
    if (!groups.has(label)) {
      groups.set(label, []);
    }
    groups.get(label)!.push(log);
  }

  return groups;
}

export const DiaryFeed = memo(function DiaryFeed({
  logs,
  loading = false,
  emptyMessage = "no episode logs yet. start tracking your progress!",
}: DiaryFeedProps) {
  if (loading || logs === undefined) {
    return (
      <div className="diary-feed">
        <div className="diary-loading">
          <p>loading diary...</p>
        </div>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="diary-feed">
        <div className="diary-empty">
          <p>{emptyMessage}</p>
        </div>
      </div>
    );
  }

  const groupedLogs = groupLogsByDate(logs);
  const entries = Array.from(groupedLogs.entries());

  return (
    <div className="diary-feed">
      {entries.map(([dateLabel, dateLogs], groupIndex) => (
        <div
          key={dateLabel}
          className="diary-group"
          style={{ animationDelay: `${groupIndex * 50}ms` }}
        >
          <div className="diary-date-header">
            <span className="date-label">{dateLabel}</span>
            <span className="date-count">{dateLogs.length} entries</span>
          </div>

          <ul className="diary-entries">
            {dateLogs.map((log, logIndex) => (
              <li
                key={log._id}
                className="diary-entry"
                style={{ animationDelay: `${groupIndex * 50 + logIndex * 30}ms` }}
              >
                <Link to={`/anime/${log.animeId}`} className="entry-link">
                  <article className="entry-content">
                    <div className="entry-header">
                      <span className="entry-episode">ep. {log.episodeNumber}</span>
                      <span className="entry-time">{formatTime(log.loggedAt)}</span>
                    </div>
                    <h3 className="entry-title">{log.animeTitle}</h3>
                    {log.comment && (
                      <p className="entry-comment">&ldquo;{log.comment}&rdquo;</p>
                    )}
                  </article>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
});
