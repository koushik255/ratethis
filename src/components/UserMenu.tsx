import { useQuery } from "convex/react";
import { useConvexAuth } from "convex/react";
import { Link } from "react-router-dom";
import { memo } from "react";
import { api } from "../../convex/_generated/api";
import { SignIn, SignOut } from "./Auth";
import "./UserMenu.css";

export const UserMenu = memo(function UserMenu() {
  const { isAuthenticated } = useConvexAuth();
  const profile = useQuery(
    api.userProfiles.getMyProfile,
    isAuthenticated ? undefined : "skip"
  );

  if (!isAuthenticated) {
    return <SignIn />;
  }
  
  return (
    <div className="user-menu">
      <Link to="/profile" className="user-menu-link">
        {profile?.profilePicture ? (
           <img
             src={profile.profilePicture}
             alt="Profile"
             className="user-avatar"
             loading="lazy"
             decoding="async"
           />
        ) : (
          <div className="user-avatar-placeholder">
            me
          </div>
        )}
      </Link>
      <SignOut />
    </div>
  );
});
