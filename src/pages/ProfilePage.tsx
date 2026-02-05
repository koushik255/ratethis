import { Link } from "react-router-dom";
import { Profile } from "../components/Profile";
import { UserMenu } from "../components/UserMenu";
import "./ProfilePage.css";

function ProfilePage() {
  return (
    <div className="board">
      <header className="board-header">
        <div className="header-left">
          <h1 className="site-title">analog</h1>
          <nav className="board-nav">
            <Link to="/">index</Link>
            <span className="nav-separator">/</span>
            <span className="nav-current">profile</span>
            <span className="nav-separator">/</span>
            <Link to="/log">log</Link>
            <span className="nav-separator">/</span>
            <Link to="/forums">forums</Link>
          </nav>
        </div>
        <div className="header-right">
          <UserMenu />
        </div>
      </header>

      <div className="board-content">
        <Profile />
      </div>

      <footer className="board-footer">
        <p>analog v1.0</p>
      </footer>
    </div>
  );
}

export default ProfilePage;
