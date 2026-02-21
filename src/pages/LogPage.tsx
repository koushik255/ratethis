import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import RetroLayout from "../components/RetroLayout";
import { AnimeLogPanel } from "../components/AnimeLogPanel";
import { DiaryFeed } from "../components/DiaryFeed";
import "./LogPage.css";

type TabType = "favorites" | "watched" | "diary";

function LogPage() {
  const [activeTab, setActiveTab] = useState<TabType>("diary");

  const favorites = useQuery(
    api.userAnime.getMyFavorites,
    activeTab === "favorites" ? undefined : "skip"
  );
  const watched = useQuery(
    api.userAnime.getMyWatched,
    activeTab === "watched" ? undefined : "skip"
  );
  const diaryLogs = useQuery(
    api.episodeLogs.getMyEpisodeLogs,
    activeTab === "diary" ? undefined : "skip"
  );

  const stats = {
    episodes: diaryLogs?.length ?? 0,
    favorites: favorites?.length ?? 0,
    watched: watched?.length ?? 0,
  };

  return (
    <RetroLayout>
      <div className="log-view">
        <div className="content-header">
          <h2 className="page-title">my log</h2>
          <div className="tabs">
            <button
              className={`tab ${activeTab === "diary" ? "active" : ""}`}
              onClick={() => setActiveTab("diary")}
            >
              diary ({diaryLogs?.length ?? 0})
            </button>
            <button
              className={`tab ${activeTab === "favorites" ? "active" : ""}`}
              onClick={() => setActiveTab("favorites")}
            >
              favorites ({favorites?.length ?? 0})
            </button>
            <button
              className={`tab ${activeTab === "watched" ? "active" : ""}`}
              onClick={() => setActiveTab("watched")}
            >
              watched ({watched?.length ?? 0})
            </button>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-num">{stats.episodes}</span>
            <span className="stat-label">episodes logged</span>
          </div>
          <div className="stat-card">
            <span className="stat-num">{stats.favorites}</span>
            <span className="stat-label">favorites</span>
          </div>
          <div className="stat-card">
            <span className="stat-num">{stats.watched}</span>
            <span className="stat-label">completed</span>
          </div>
        </div>

        <div className="log-content card animate-fade-in">
          {activeTab === "diary" ? (
            <DiaryFeed
              logs={diaryLogs}
              emptyMessage="no episode logs yet. search for anime and start tracking your progress!"
            />
          ) : (
            <AnimeLogPanel
              favorites={favorites}
              watched={watched}
              showTabs={false}
              activeTab={activeTab as "favorites" | "watched"}
              onTabChange={(tab) => setActiveTab(tab)}
              emptyMessageFavorites="no favorites yet. search for anime and add some!"
              emptyMessageWatched="no watched anime yet. mark anime as watched to track them!"
            />
          )}
        </div>
      </div>
    </RetroLayout>
  );
}

export default LogPage;
