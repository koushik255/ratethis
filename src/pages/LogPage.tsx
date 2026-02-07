import { useState } from "react";
import { useQuery } from "convex/react";
import { Link } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import { UserMenu } from "../components/UserMenu";
import { AnimeLogPanel } from "../components/AnimeLogPanel";
import "./LogPage.css";

type TabType = "favorites" | "watched";

function LogPage() {
  const [activeTab, setActiveTab] = useState<TabType>("favorites");

  const favorites = useQuery(
    api.userAnime.getMyFavorites,
    activeTab === "favorites" ? undefined : "skip"
  );
  const watched = useQuery(
    api.userAnime.getMyWatched,
    activeTab === "watched" ? undefined : "skip"
  );

  return (
    <div className="board">
      <header className="board-header">
        <div className="header-left">
          <h1 className="site-title">analog</h1>
          <nav className="board-nav">
            <Link to="/">index</Link>
            <span className="nav-separator">/</span>
            <Link to="/profile">profile</Link>
            <span className="nav-separator">/</span>
            <span className="nav-current">log</span>
            <span className="nav-separator">/</span>
            <Link to="/forums">forums</Link>
            <span className="nav-separator">/</span>
            <Link to="/lists">lists</Link>
            <span className="nav-separator">/</span>
            <Link to="/friends">friends</Link>
          </nav>
        </div>
        <div className="header-right">
          <UserMenu />
        </div>
      </header>

      <div className="log-tabs">
        <button
          className={`log-tab ${activeTab === "favorites" ? "active" : ""}`}
          onClick={() => setActiveTab("favorites")}
        >
          favorites ({favorites?.length ?? 0})
        </button>
        <button
          className={`log-tab ${activeTab === "watched" ? "active" : ""}`}
          onClick={() => setActiveTab("watched")}
        >
          watched ({watched?.length ?? 0})
        </button>
      </div>

      <div className="board-content">
        <AnimeLogPanel
          favorites={favorites}
          watched={watched}
          showTabs={false}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          emptyMessageFavorites="no favorites yet. search and add some!"
          emptyMessageWatched="no watched anime yet. start watching!"
        />
      </div>

      <footer className="board-footer">
        <p>analog v1.0</p>
      </footer>
    </div>
  );
}

export default LogPage;
