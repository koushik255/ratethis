import { useState } from "react";
import { useQuery } from "convex/react";
import { Link } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import { UserMenu } from "../components/UserMenu";
import { AnimeLogPanel } from "../components/AnimeLogPanel";
import "../styles.css";
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
    <div className="page-layout">
      <header className="page-header">
        <div className="header-content">
          <h1 className="site-title">analog</h1>
          <nav className="main-nav">
            <Link to="/" className="nav-link">index</Link>
            <Link to="/profile" className="nav-link">profile</Link>
            <Link to="/log" className="nav-link active">log</Link>
            <Link to="/lists" className="nav-link">lists</Link>
            <Link to="/friends" className="nav-link">friends</Link>
          </nav>
        </div>
        <UserMenu />
      </header>

      <main className="page-content">
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

        <AnimeLogPanel
          favorites={favorites}
          watched={watched}
          showTabs={false}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          emptyMessageFavorites="no favorites yet. search and add some!"
          emptyMessageWatched="no watched anime yet. start watching!"
        />
      </main>

      <footer className="page-footer">
        <p>analog v1.0</p>
      </footer>
    </div>
  );
}

export default LogPage;
