import { useParams, Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { UserMenu } from "../components/UserMenu";
import { AnimeLogPanel } from "../components/AnimeLogPanel";
import "./PublicProfilePage.css";

function PublicProfilePage() {
  const { username } = useParams<{ username: string }>();
  const normalizedUsername = username?.toLowerCase() || "";

  const profile = useQuery(
    api.userProfiles.getProfileByUsername,
    normalizedUsername ? { username: normalizedUsername } : "skip"
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
      <div className="board">
        <header className="board-header">
          <div className="header-left">
            <h1 className="site-title">analog</h1>
            <nav className="board-nav">
              <Link to="/">index</Link>
              <span className="nav-separator">/</span>
              <Link to="/profile">profile</Link>
              <span className="nav-separator">/</span>
              <Link to="/log">log</Link>
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
        <div className="board-content">
          <div className="loading">
            <p>loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
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
              <Link to="/log">log</Link>
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
        <div className="board-content">
          <div className="profile-not-found">
            <h2>user not found</h2>
            <p>the user &ldquo;{username}&rdquo; does not exist.</p>
            <Link to="/friends" className="back-link">
              search for users
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
            <Link to="/log">log</Link>
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

      <div className="public-profile">
        <div className="public-profile-header">
          <div className="public-profile-avatar">
            {profile.profilePicture ? (
              <img
                src={profile.profilePicture}
                alt={profile.displayName || profile.username}
                className="public-profile-avatar-img"
              />
            ) : (
              <div className="public-profile-avatar-placeholder">
                {(profile.displayName || profile.username || "?").charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="public-profile-info">
            <h2 className="public-profile-name">
              {profile.displayName || profile.username || "anonymous"}
            </h2>
            {profile.username && (
              <span className="public-profile-username">@{profile.username}</span>
            )}
            {profile.bio && (
              <p className="public-profile-bio">{profile.bio}</p>
            )}
          </div>
        </div>

        <div className="public-profile-content">
          <AnimeLogPanel
            favorites={favorites}
            watched={watched}
            emptyMessageFavorites={`${profile.displayName || "this user"} hasn't added any favorites yet.`}
            emptyMessageWatched={`${profile.displayName || "this user"} hasn't marked any anime as watched yet.`}
          />
        </div>
      </div>

      <footer className="board-footer">
        <p>analog v1.0</p>
      </footer>
    </div>
  );
}

export default PublicProfilePage;
