import { useParams, Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import RetroLayout from "../components/RetroLayout";
import { AnimeLogPanel } from "../components/AnimeLogPanel";
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
      <RetroLayout>
        <div className="loading">
          <p>loading...</p>
        </div>
      </RetroLayout>
    );
  }

  if (!profile) {
    return (
      <RetroLayout>
        <div className="profile-not-found">
          <h2>user not found</h2>
          <p>the user "{username}" does not exist.</p>
          <Link to="/friends" className="btn">search for users</Link>
        </div>
      </RetroLayout>
    );
  }

  return (
    <RetroLayout>
      <div className="public-profile-view animate-fade-in">
        <div className="content-header">
          <h2 className="page-title">{profile.displayName || profile.username || "anonymous"}</h2>
          {profile.username && (
            <span className="profile-username">@{profile.username}</span>
          )}
        </div>

        <div className="profile-header card">
          <div className="profile-identity">
            <div className="profile-avatar">
              {profile.profilePicture ? (
                <img src={profile.profilePicture} alt={profile.displayName || profile.username} />
              ) : (
                <span>{(profile.displayName || profile.username || "?")[0].toUpperCase()}</span>
              )}
            </div>
            <div className="profile-info">
              {profile.bio && <p className="profile-bio">{profile.bio}</p>}
            </div>
          </div>
          <div className="profile-stats">
            <div className="stat-item">
              <span className="stat-num">{stats?.favorites ?? 0}</span>
              <span className="stat-label">favorites</span>
            </div>
            <div className="stat-item">
              <span className="stat-num">{stats?.watched ?? 0}</span>
              <span className="stat-label">watched</span>
            </div>
            <div className="stat-item">
              <span className="stat-num">{stats?.lists ?? 0}</span>
              <span className="stat-label">lists</span>
            </div>
            <div className="stat-item">
              <span className="stat-num">{stats?.friends ?? 0}</span>
              <span className="stat-label">friends</span>
            </div>
          </div>
        </div>

        <div className="profile-content card">
          <AnimeLogPanel
            favorites={favorites}
            watched={watched}
            emptyMessageFavorites="no favorites yet"
            emptyMessageWatched="nothing watched yet"
          />
        </div>
      </div>
    </RetroLayout>
  );
}

export default PublicProfilePage;
