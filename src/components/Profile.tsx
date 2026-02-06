import { useState } from "react";
import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { api } from "../../convex/_generated/api";
import { SignIn, SignOut } from "./Auth";
import "./Profile.css";

export function Profile() {
  const { isAuthenticated } = useConvexAuth();
  const profile = useQuery(api.userProfiles.getMyProfile);
  const updateProfile = useMutation(api.userProfiles.updateProfile);
  
  const [isEditing, setIsEditing] = useState(false);
  const [profilePicture, setProfilePicture] = useState(profile?.profilePicture || "");
  const [displayName, setDisplayName] = useState(profile?.displayName || "");
  const [bio, setBio] = useState(profile?.bio || "");
  
  const handleSave = async () => {
    await updateProfile({
      profilePicture: profilePicture || undefined,
      displayName: displayName || undefined,
      bio: bio || undefined,
    });
    setIsEditing(false);
  };
  
  const handleCancel = () => {
    setProfilePicture(profile?.profilePicture || "");
    setDisplayName(profile?.displayName || "");
    setBio(profile?.bio || "");
    setIsEditing(false);
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
            <label>bio:</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="something about you..."
              className="raw-textarea"
              rows={3}
            />
          </div>
          
          <div className="form-actions">
            <button onClick={handleSave} className="raw-button">
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
  
  return (
    <div className="profile-container">
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
          <div className="profile-picture-placeholder large">
            no image
          </div>
        )}
        
        <div className="profile-info">
          <h2 className="profile-name">
            {profile?.displayName || "Anonymous"}
          </h2>
          {profile?.bio && (
            <p className="profile-bio">{profile.bio}</p>
          )}
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
