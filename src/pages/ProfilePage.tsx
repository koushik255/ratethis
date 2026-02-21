import RetroLayout from "../components/RetroLayout";
import { Profile } from "../components/Profile";
import "./ProfilePage.css";

function ProfilePage() {
  return (
    <RetroLayout>
      <div className="profile-view animate-fade-in">
        <div className="content-header">
          <h2 className="page-title">profile</h2>
        </div>
        <div className="profile-content card">
          <Profile />
        </div>
      </div>
    </RetroLayout>
  );
}

export default ProfilePage;
