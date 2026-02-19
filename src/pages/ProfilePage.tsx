import { Link } from "react-router-dom";
import { Profile } from "../components/Profile";
import { UserMenu } from "../components/UserMenu";
import "../styles.css";
import "./ProfilePage.css";

function ProfilePage() {
  return (
    <div className="page-layout">
      <header className="page-header">
        <div className="header-content">
          <h1 className="site-title">analog</h1>
          <nav className="main-nav">
            <Link to="/" className="nav-link">index</Link>
            <Link to="/profile" className="nav-link active">profile</Link>
            <Link to="/log" className="nav-link">log</Link>
            <Link to="/lists" className="nav-link">lists</Link>
            <Link to="/friends" className="nav-link">friends</Link>
          </nav>
        </div>
        <UserMenu />
      </header>

      <main className="page-content">
        <Profile />
      </main>

      <footer className="page-footer">
        <p>analog v1.0</p>
      </footer>
    </div>
  );
}

export default ProfilePage;
