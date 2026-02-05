import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useConvexAuth } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import "./AnimeListSelector.css";

interface AnimeListSelectorProps {
  animeId: Id<"anime">;
  animeTitle: string;
}

export function AnimeListSelector({ animeId, animeTitle }: AnimeListSelectorProps) {
  const { isAuthenticated } = useConvexAuth();
  const [showSelector, setShowSelector] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  
  const myLists = useQuery(api.lists.getMyLists);
  const isAnimeInList = useQuery(
    api.lists.isAnimeInList,
    isAuthenticated && myLists?.[0]?._id ? { listId: myLists[0]._id, animeId } : "skip"
  );
  
  const addToList = useMutation(api.lists.addToList);

  if (!isAuthenticated || !myLists || myLists.length === 0) {
    return null;
  }

  const handleAddToList = async (listId: string) => {
    setIsAdding(true);
    try {
      await addToList({ listId: listId as any, animeId });
      setShowSelector(false);
    } catch (error) {
      console.error("Failed to add to list:", error);
      alert("Failed to add to list. This anime might already be in the list.");
    } finally {
      setIsAdding(false);
    }
  };

  const isInFirstList = isAnimeInList || false;

  return (
    <div className="anime-list-selector">
      <button
        className="list-selector-button"
        onClick={() => setShowSelector(!showSelector)}
        disabled={isAdding}
        title={isInFirstList ? "in your list" : "add to list"}
      >
        {isInFirstList ? "📋" : "➕"}
      </button>

      {showSelector && (
        <div className="list-selector-dropdown">
          <div className="list-selector-header">
            add "{animeTitle}" to a list
          </div>
          <div className="list-selector-items">
            {myLists.map((list) => (
              <button
                key={list._id}
                className="list-selector-item"
                onClick={() => handleAddToList(list._id)}
                disabled={isAdding}
              >
                {list.title}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
