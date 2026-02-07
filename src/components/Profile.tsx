import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Link } from "react-router-dom";
import { SignIn, SignOut } from "./Auth";
import "./Profile.css";

const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;
const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 20;

export function Profile() {
  const { isAuthenticated } = useConvexAuth();
  const profile = useQuery(api.userProfiles.getMyProfile);
  const updateProfile = useMutation(api.userProfiles.updateProfile);

  const [isEditing, setIsEditing] = useState(false);
  const [profilePicture, setProfilePicture] = useState(profile?.profilePicture || "");
  const [displayName, setDisplayName] = useState(profile?.displayName || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [username, setUsername] = useState(profile?.username || "");
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Update local state when profile loads
  useEffect(() => {
    if (profile) {
      setProfilePicture(profile.profilePicture || "");
      setDisplayName(profile.displayName || "");
      setBio(profile.bio || "");
      setUsername(profile.username || "");
    }
  }, [profile]);

  // Validate username format
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

  // Validate username on change
  useEffect(() => {
    const normalizedUsername = username.toLowerCase().trim();
    
    // Skip if username hasn't changed or is empty
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
    setUsernameError(null);
    setSaveError(null);
    setIsEditing(false);
  };

  const canChangeUsername = useCallback(() => {
    if (!profile?.username) return true;
    if (!profile?.usernameLastChangedAt) return true;
    const cooldownPeriod = 7 * 24 * 60 * 60 * 1000; // 7 days
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
      <div className="profile-container">
        <h2 className="profile-title">edit profile</h2>

        <div className="profile-form">
          <div className="form-group">
            <label>profile picture url:</label>
            <input
              type="text"
              value={profilePicture}
              onChange={(e) => setProfilePicture(e.target.value)}
              placeholder="https://..."
              className="raw-input"
            />
          </div>

          <div className="form-group">
            <label>display name:</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="your name"
              className="raw-input"
            />
          </div>

          <div className="form-group">
            <label>username:</label>
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
            <label>bio:</label>
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

      <div className="profile-header">
        {profile?.profilePicture ? (
          <img
            src={profile.profilePicture}
            alt="Profile"
            className="profile-picture large"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="profile-picture-placeholder large">no image</div>
        )}

        <div className="profile-info">
          <h2 className="profile-name">{profile?.displayName || "Anonymous"}</h2>
          {hasUsername && (
            <Link to={`/profile/${profile.username}`} className="profile-username">
              @{profile.username}
            </Link>
          )}
          {profile?.bio && <p className="profile-bio">{profile.bio}</p>}
        </div>
      </div>

      <div className="profile-actions">
        <button onClick={() => setIsEditing(true)} className="raw-button">
          edit profile
        </button>
        <SignOut />
      </div>
    </div>
  );
}
