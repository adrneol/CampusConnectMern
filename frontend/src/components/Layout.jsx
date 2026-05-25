import { Link, NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { BookOpen, FileText, GraduationCap, Home, Inbox, LogIn, LogOut, Moon, PlusCircle, Sparkles, Sun, Users, UserPlus } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../store/authSlice";
import { clearNotes } from "../store/notesSlice";
import { apiRequest } from "../store/api";

export default function Layout({ children }) {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(localStorage.getItem("campusConnectTheme") || "light");
  const [unreadTotal, setUnreadTotal] = useState(0);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("campusConnectTheme", theme);
  }, [theme]);

  useEffect(() => {
    if (!user) {
      setUnreadTotal(0);
      return undefined;
    }
    const loadUnread = () => {
      apiRequest("/messages")
        .then((summary) => setUnreadTotal(summary.totalUnread || 0))
        .catch(() => setUnreadTotal(0));
    };
    loadUnread();
    const timer = setInterval(loadUnread, 15000);
    return () => clearInterval(timer);
  }, [user]);

  const handleLogout = () => {
    dispatch(logout());
    dispatch(clearNotes());
    navigate("/");
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="brand" to="/">
          <BookOpen size={28} aria-hidden="true" />
          <span>Campus Connect</span>
        </Link>
        <nav className="nav-links" aria-label="Primary navigation">
          <NavLink to="/"><Home size={16} aria-hidden="true" /><span>Courses</span></NavLink>
          {user && <NavLink to="/my-courses"><GraduationCap size={16} aria-hidden="true" /><span>My courses</span></NavLink>}
          {user && <NavLink to="/friend-courses"><GraduationCap size={16} aria-hidden="true" /><span>Friend courses</span></NavLink>}
          {user && <NavLink to="/dashboard"><FileText size={16} aria-hidden="true" /><span>Notes</span></NavLink>}
          {user && <NavLink to="/users"><Users size={16} aria-hidden="true" /><span>Users</span></NavLink>}
          {user && <NavLink to="/my-friends"><Users size={16} aria-hidden="true" /><span>My friends</span></NavLink>}
          {user && <NavLink to="/posts"><BookOpen size={16} aria-hidden="true" /><span>Posts</span></NavLink>}
          {user && <NavLink to="/my-posts"><BookOpen size={16} aria-hidden="true" /><span>My posts</span></NavLink>}
          {user && (
            <NavLink to="/inbox" className="nav-badge-link">
              <Inbox size={16} aria-hidden="true" /><span>Inbox</span>
              {unreadTotal > 0 && <strong>{unreadTotal} unread</strong>}
            </NavLink>
          )}
          {user && <NavLink to="/profile">Profile</NavLink>}
        </nav>
        <div className="auth-actions">
          <div className="theme-picker" aria-label="Theme">
            <button className={theme === "light" ? "active" : ""} type="button" onClick={() => setTheme("light")} title="Light theme">
              <Sun size={16} aria-hidden="true" />
            </button>
            <button className={theme === "dark" ? "active" : ""} type="button" onClick={() => setTheme("dark")} title="Dark theme">
              <Moon size={16} aria-hidden="true" />
            </button>
            <button className={theme === "neon" ? "active" : ""} type="button" onClick={() => setTheme("neon")} title="Neon blue theme">
              <Sparkles size={16} aria-hidden="true" />
            </button>
          </div>
          {user ? (
            <>
              <Link className="user-chip" to="/profile">
                <span className="avatar small">{user.avatar ? <img src={user.avatar} alt="" /> : user.name.charAt(0)}</span>
                {user.name}
              </Link>
              <button className="icon-button" type="button" onClick={handleLogout} title="Log out">
                <LogOut size={18} aria-hidden="true" />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link className="icon-button ghost" to="/login">
                <LogIn size={18} aria-hidden="true" />
                <span>Login</span>
              </Link>
              <Link className="icon-button" to="/signup">
                <UserPlus size={18} aria-hidden="true" />
                <span>Sign up</span>
              </Link>
            </>
          )}
        </div>
      </header>
      <main>{children}</main>
      {user && (
        <Link className="floating-add" to="/dashboard" title="Add notes">
          <PlusCircle size={24} aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}
