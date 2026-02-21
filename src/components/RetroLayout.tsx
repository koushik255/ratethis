import { ReactNode } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import "./RetroLayout.css";

interface RetroLayoutProps {
  children: ReactNode;
  hideSearch?: boolean;
}

function RetroLayout({ children, hideSearch = false }: RetroLayoutProps) {
  const location = useLocation();
  const { isAuthenticated } = useConvexAuth();
  const profile = useQuery(api.userProfiles.getMyProfile);
  
  const navItems = [
    { path: "/", label: "index", icon: "◆" },
    { path: "/log", label: "diary", icon: "◆" },
    { path: "/lists", label: "lists", icon: "◆" },
    { path: "/friends", label: "friends", icon: "◆" },
  ];

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <div className="retro-app">
      <aside className="sidebar">
        <div className="sidebar-header">
          <Link to="/" className="site-logo-link">
            <h1 className="site-logo">anime<span className="logo-accent">log</span></h1>
          </Link>
          <span className="site-version">v1.0</span>
        </div>

        {isAuthenticated && (
          <div className="sidebar-user">
            <Link to="/profile" className="user-avatar">
              {profile?.profilePicture ? (
                <img src={profile.profilePicture} alt="" />
              ) : (
                <span>{(profile?.displayName || profile?.username || "U")[0].toUpperCase()}</span>
              )}
            </Link>
            <div className="user-info">
              <Link to="/profile" className="user-name">
                {profile?.displayName || profile?.username || "user"}
              </Link>
              <span className="user-status">
                <Link to="/log">view log »</Link>
              </span>
            </div>
          </div>
        )}

        {!isAuthenticated && (
          <div className="sidebar-auth">
            <Link to="/profile" className="btn btn-small">login / register</Link>
          </div>
        )}

        <nav className="sidebar-nav">
          <div className="nav-section">
            <span className="nav-section-title">browse</span>
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive(item.path) ? "active" : ""}`}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      </aside>

      <main className="main-content">
        <header className="top-bar">
          {!hideSearch && <SearchBar />}
          <div className="top-bar-right">
            {!isAuthenticated && (
              <Link to="/profile" className="profile-link">login »</Link>
            )}
            {isAuthenticated && (
              <Link to="/profile" className="profile-link">profile »</Link>
            )}
          </div>
        </header>

        <div className="content-area">
          {children}
        </div>
      </main>
    </div>
  );
}

function SearchBar() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const currentQuery = searchParams.get("q") || "";
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const query = formData.get("search") as string;
    
    if (query.trim()) {
      setSearchParams({ q: query.trim() });
      if (window.location.pathname !== "/") {
        navigate(`/?q=${encodeURIComponent(query.trim())}`);
      }
    }
  };

  return (
    <form className="search-bar" onSubmit={handleSubmit}>
      <input
        type="text"
        name="search"
        className="global-search"
        placeholder="search anime..."
        defaultValue={currentQuery}
      />
      <button type="submit" className="search-btn">search</button>
    </form>
  );
}

export default RetroLayout;
