import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Link } from "react-router-dom";
import { SignIn, SignOut } from "./Auth";
import { AnimeLogPanel } from "./AnimeLogPanel";
import "../styles.css";
import "./Profile.css";

const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;
const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 20;
const TOOLS_URL = "http://localhost:3001";

interface SyncResult {
  success: boolean;
  imported: number;
  skipped: number;
  notFound: string[];
  total: number;
  error?: string;
}

export function Profile() {
  const { isAuthenticated } = useConvexAuth();
  const profile = useQuery(api.userProfiles.getMyProfile);
  const stats = useQuery(api.userProfiles.getMyStats);
  const updateProfile = useMutation(api.userProfiles.updateProfile);
  
  const favorites = useQuery(api.userAnime.getMyFavorites);
  const watched = useQuery(api.userAnime.getMyWatched);

  const [isEditing, setIsEditing] = useState(false);
  const [profilePicture, setProfilePicture] = useState(profile?.profilePicture || "");
  const [displayName, setDisplayName] = useState(profile?.displayName || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [username, setUsername] = useState(profile?.username || "");
  const [malUsername, setMalUsername] = useState(profile?.malUsername || "");
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<SyncResult | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setProfilePicture(profile.profilePicture || "");
      setDisplayName(profile.displayName || "");
      setBio(profile.bio || "");
      setUsername(profile.username || "");
      setMalUsername(profile.malUsername || "");
    }
  }, [profile]);

  const validateUsernameFormat = useCallback((value: string): string | null => {
    if (!value) return null;
    if (value.length < USERNAME_MIN_LENGTH) {
      return `Username must be at least ${USERNAME_MIN_LENGTH} characters`;
    }
    if (value.length > USERNAME_MAX_LENGTH) {
      return `Username must be at most ${USERNAME_MAX_LENGTH} characters`;
    }
    if (!USERNAME_REGEX.test(value)) {
      return "Username can only contain letters, numbers, and underscores";
    }
    return null;
  }, []);

  useEffect(() => {
    const normalizedUsername = username.toLowerCase().trim();
    
    if (!normalizedUsername || normalizedUsername === profile?.username) {
      setUsernameError(null);
      return;
    }

    const formatError = validateUsernameFormat(normalizedUsername);
    setUsernameError(formatError);
  }, [username, profile?.username, validateUsernameFormat]);

  const handleSave = async () => {
    setSaveError(null);
    
    try {
      await updateProfile({
        profilePicture: profilePicture || undefined,
        displayName: displayName || undefined,
        bio: bio || undefined,
        username: username ? username.toLowerCase().trim() : undefined,
        malUsername: malUsername.trim() || undefined,
      });
      setIsEditing(false);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Failed to save profile");
    }
  };

  const handleCancel = () => {
    setProfilePicture(profile?.profilePicture || "");
    setDisplayName(profile?.displayName || "");
    setBio(profile?.bio || "");
    setUsername(profile?.username || "");
    setMalUsername(profile?.malUsername || "");
    setUsernameError(null);
    setSaveError(null);
    setIsEditing(false);
  };

  const canChangeUsername = useCallback(() => {
    if (!profile?.username) return true;
    if (!profile?.usernameLastChangedAt) return true;
    const cooldownPeriod = 7 * 24 * 60 * 60 * 1000;
    const timeSinceChange = Date.now() - profile.usernameLastChangedAt;
    return timeSinceChange >= cooldownPeriod;
  }, [profile]);

  const getDaysUntilChange = useCallback(() => {
    if (!profile?.usernameLastChangedAt) return 0;
    const cooldownPeriod = 7 * 24 * 60 * 60 * 1000;
    const timeSinceChange = Date.now() - profile.usernameLastChangedAt;
    const remaining = cooldownPeriod - timeSinceChange;
    return Math.ceil(remaining / (24 * 60 * 60 * 1000));
  }, [profile]);

  const handleMalImport = async () => {
    if (!malUsername.trim()) {
      setImportError("enter your MAL username first");
      return;
    }
    
    if (!profile?.userId) {
      setImportError("profile not loaded");
      return;
    }
    
    setIsImporting(true);
    setImportError(null);
    setImportResult(null);
    
    try {
      const response = await fetch(`${TOOLS_URL}/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          malUsername: malUsername.trim(),
          userId: profile.userId,
        }),
      });
      
      const result: SyncResult = await response.json();
      
      if (result.success) {
        setImportResult(result);
        
        await updateProfile({
          malUsername: malUsername.trim(),
        });
      } else {
        setImportError(result.error || "import failed");
      }
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "failed to connect to import service");
    } finally {
      setIsImporting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="profile-container">
        <p className="profile-message">sign in to view your profile</p>
        <SignIn />
      </div>
    );
  }

  if (isEditing) {
    const showUsernameCooldown = profile?.username && !canChangeUsername();

    return (
      <div className="profile-edit-mode">
        <div className="profile-edit-header">
          <h2>edit profile</h2>
        </div>

        <div className="profile-edit-form">
          <div className="form-group">
            <label>profile picture url</label>
            <input
              type="text"
              value={profilePicture}
              onChange={(e) => setProfilePicture(e.target.value)}
              placeholder="https://..."
              className="raw-input"
            />
          </div>

          <div className="form-group">
            <label>display name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="your name"
              className="raw-input"
            />
          </div>

          <div className="form-group">
            <label>username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setUsernameError(null);
              }}
              placeholder="your_username"
              className={`raw-input ${usernameError ? "error" : ""}`}
              disabled={showUsernameCooldown ? true : undefined}
            />
            {usernameError && <span className="field-error">{usernameError}</span>}
            {showUsernameCooldown && (
              <span className="field-info">
                you can change your username again in {getDaysUntilChange()} days
              </span>
            )}
            <span className="field-help">
              3-20 characters, letters, numbers, and underscores only
            </span>
          </div>

          <div className="form-group">
            <label>bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="something about you..."
              className="raw-textarea"
              rows={3}
            />
          </div>

          {saveError && <div className="form-error">{saveError}</div>}

          <div className="form-actions">
            <button 
              onClick={handleSave} 
              className="raw-button"
              disabled={!!usernameError}
            >
              save
            </button>
            <button onClick={handleCancel} className="raw-button secondary">
              cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  const hasUsername = !!profile?.username;

  return (
    <div className="profile-container">
      {!hasUsername && (
        <div className="username-prompt">
          <p>add a username so people can see your profile</p>
          <button onClick={() => setIsEditing(true)} className="raw-button small">
            add username
          </button>
        </div>
      )}

      <div className="user-profile-header">
        <div className="user-profile-identity">
          <div className="user-avatar">
            {profile?.profilePicture ? (
              <img
                src={profile.profilePicture}
                alt={profile.displayName || profile.username || "Profile"}
              />
            ) : (
              <span className="user-avatar-placeholder">
                {(profile?.displayName || profile?.username || "?").charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="user-info">
            <h2 className="user-name">{profile?.displayName || "anonymous"}</h2>
            {hasUsername && (
              <Link to={`/profile/${profile.username}`} className="user-username">
                @{profile.username}
              </Link>
            )}
          </div>
          <div className="profile-header-actions">
            <button onClick={() => setIsEditing(true)} className="raw-button small">
              edit
            </button>
            <SignOut />
          </div>
        </div>

        {profile?.bio && (
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
          emptyMessageFavorites="no favorites yet"
          emptyMessageWatched="nothing watched yet"
        />
      </div>

      <div className="mal-import-section">
        <h3 className="mal-import-title">import from myanimelist</h3>
        <p className="mal-import-desc">
          import your completed anime from MAL to your watched list
        </p>
        
        <div className="mal-import-form">
          <input
            type="text"
            value={malUsername}
            onChange={(e) => setMalUsername(e.target.value)}
            placeholder="MAL username"
            className="raw-input"
            disabled={isImporting}
          />
          <button
            onClick={handleMalImport}
            className="raw-button"
            disabled={isImporting || !malUsername.trim()}
          >
            {isImporting ? "importing..." : "import"}
          </button>
        </div>
        
        {importError && (
          <div className="mal-import-error">{importError}</div>
        )}
        
        {importResult && (
          <div className="mal-import-result">
            <p className="mal-import-success">
              imported {importResult.imported} anime
              {importResult.skipped > 0 && ` (${importResult.skipped} already watched)`}
            </p>
            {importResult.notFound.length > 0 && (
              <div className="mal-not-found">
                <p>{importResult.notFound.length} not found in database:</p>
                <ul>
                  {importResult.notFound.slice(0, 10).map((title, i) => (
                    <li key={i}>{title}</li>
                  ))}
                  {importResult.notFound.length > 10 && (
                    <li>...and {importResult.notFound.length - 10} more</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
