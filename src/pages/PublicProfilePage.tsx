import { useParams, Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { UserMenu } from "../components/UserMenu";
import { AnimeLogPanel } from "../components/AnimeLogPanel";
import "../styles.css";
import "./PublicProfilePage.css";

function PublicProfilePage() {
  const { username } = useParams<{ username: string }>();
  const normalizedUsername = username?.toLowerCase() || "";

  const profile = useQuery(
    api.userProfiles.getProfileByUsername,
    normalizedUsername ? { username: normalizedUsername } : "skip"
  );

  const stats = useQuery(
    api.userProfiles.getUserStats,
    profile?.userId ? { userId: profile.userId } : "skip"
  );

  const favorites = useQuery(
    api.userAnime.getUserFavorites,
    profile?.userId ? { userId: profile.userId } : "skip"
  );

  const watched = useQuery(
    api.userAnime.getUserWatched,
    profile?.userId ? { userId: profile.userId } : "skip"
  );

  const isLoading = profile === undefined;

  if (isLoading) {
    return (
      <div className="page-layout">
        <header className="page-header">
          <div className="header-content">
            <h1 className="site-title">analog</h1>
            <nav className="main-nav">
              <Link to="/" className="nav-link">index</Link>
              <Link to="/profile" className="nav-link">profile</Link>
              <Link to="/log" className="nav-link">log</Link>
              <Link to="/lists" className="nav-link">lists</Link>
              <Link to="/friends" className="nav-link">friends</Link>
            </nav>
          </div>
          <UserMenu />
        </header>
        <main className="page-content">
          <div className="loading-state">
            <p>loading...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="page-layout">
        <header className="page-header">
          <div className="header-content">
            <h1 className="site-title">analog</h1>
            <nav className="main-nav">
              <Link to="/" className="nav-link">index</Link>
              <Link to="/profile" className="nav-link">profile</Link>
              <Link to="/log" className="nav-link">log</Link>
              <Link to="/lists" className="nav-link">lists</Link>
              <Link to="/friends" className="nav-link">friends</Link>
            </nav>
          </div>
          <UserMenu />
        </header>
        <main className="page-content">
          <div className="profile-not-found">
            <h2>user not found</h2>
            <p>the user "{username}" does not exist.</p>
            <Link to="/friends" className="back-link">
              search for users
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="page-layout">
      <header className="page-header">
        <div className="header-content">
          <h1 className="site-title">analog</h1>
          <nav className="main-nav">
            <Link to="/" className="nav-link">index</Link>
            <Link to="/profile" className="nav-link">profile</Link>
            <Link to="/log" className="nav-link">log</Link>
            <Link to="/lists" className="nav-link">lists</Link>
            <Link to="/friends" className="nav-link">friends</Link>
          </nav>
        </div>
        <UserMenu />
      </header>

      <main className="page-content wide">
        <div className="user-profile-header">
          <div className="user-profile-identity">
            <div className="user-avatar">
              {profile.profilePicture ? (
                <img
                  src={profile.profilePicture}
                  alt={profile.displayName || profile.username}
                />
              ) : (
                <span className="user-avatar-placeholder">
                  {(profile.displayName || profile.username || "?").charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="user-info">
              <h2 className="user-name">{profile.displayName || profile.username || "anonymous"}</h2>
              {profile.username && (
                <span className="user-username">@{profile.username}</span>
              )}
            </div>
          </div>

          {profile.bio && (
            <p className="user-bio">{profile.bio}</p>
          )}

          <div className="user-stats">
            <div className="stat-item">
              <span className="stat-value">{stats?.favorites ?? 0}</span>
              <span className="stat-label">favorites</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{stats?.watched ?? 0}</span>
              <span className="stat-label">watched</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{stats?.lists ?? 0}</span>
              <span className="stat-label">lists</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{stats?.friends ?? 0}</span>
              <span className="stat-label">friends</span>
            </div>
          </div>
        </div>

        <div className="user-content">
          <AnimeLogPanel
            favorites={favorites}
            watched={watched}
            emptyMessageFavorites={`no favorites yet`}
            emptyMessageWatched={`nothing watched yet`}
          />
        </div>
      </main>

      <footer className="page-footer">
        <p>analog v1.0</p>
      </footer>
    </div>
  );
}

export default PublicProfilePage;
