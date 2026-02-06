import { useState, memo } from "react";
import { useMutation, useQuery } from "convex/react";
import { useConvexAuth } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { WatchModal } from "./WatchModal";
import { AnimeListSelector } from "./AnimeListSelector";
import "./AnimeActions.css";

interface AnimeActionsProps {
  animeId: Id<"anime">;
  animeTitle: string;
  variant?: "inline" | "hover";
}

export const AnimeActions = memo(function AnimeActions({ animeId, animeTitle, variant = "inline" }: AnimeActionsProps) {
  const { isAuthenticated } = useConvexAuth();
  const [showModal, setShowModal] = useState(false);
  
  const status = useQuery(api.userAnime.getUserAnimeStatus, { animeId });
  const toggleFavorite = useMutation(api.userAnime.toggleFavorite);
  const toggleWatched = useMutation(api.userAnime.toggleWatched);

  if (!isAuthenticated) return null;

  const isFavorite = status?.isFavorite ?? false;
  const isWatched = status?.isWatched ?? false;

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    void toggleFavorite({ animeId });
  };

  const handleWatchClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isWatched) {
      // Unwatch immediately
      void toggleWatched({ animeId });
    } else {
      // Show modal for new watch
      setShowModal(true);
    }
  };

  const handleModalSubmit = (comment: string) => {
    void toggleWatched({ animeId, comment: comment || undefined });
    setShowModal(false);
  };

  return (
    <>
      <div className={`anime-actions ${variant}`}>
        <button
          className={`action-button watch ${isWatched ? "active" : ""}`}
          onClick={handleWatchClick}
          title={isWatched ? "unwatch" : "mark as watched"}
        >
          {isWatched ? "👁" : "○"}
        </button>
        <button
          className={`action-button favorite ${isFavorite ? "active" : ""}`}
          onClick={handleFavoriteClick}
          title={isFavorite ? "remove from favorites" : "add to favorites"}
        >
          {isFavorite ? "★" : "☆"}
        </button>
        <AnimeListSelector 
          animeId={animeId}
          animeTitle={animeTitle}
        />
      </div>

      {showModal && (
        <WatchModal
          animeTitle={animeTitle}
          onSubmit={handleModalSubmit}
          onCancel={() => setShowModal(false)}
        />
      )}
    </>
  );
});
