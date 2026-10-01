import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_STUDENT = [
  { to: '/dashboard',    label: 'Dashboard' },
  { to: '/catalog',      label: 'Course Catalog' },
  { to: '/doubt-solver', label: 'Doubt Solver' },
  { to: '/my-doubts',    label: 'My Doubts' },
];

const NAV_INSTRUCTOR = [
  { to: '/dashboard',    label: 'Dashboard' },
  { to: '/catalog',      label: 'Course Catalog' },
  { to: '/instructor',   label: 'Doubt Inbox' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navLinks = user?.role === 'instructor' ? NAV_INSTRUCTOR : NAV_STUDENT;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <aside className="sidebar">
      <div>
        <div className="sidebar-logo">
          <div className="sidebar-logo-text">LearnAI</div>
          <div className="sidebar-logo-sub">Catalog & Ledger</div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Index</div>
          {navLinks.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
            >
              {link.label}
            </NavLink>
          ))}

          <div className="sidebar-section-label" style={{ marginTop: 24 }}>Session</div>
          <button
            className="sidebar-link"
            style={{ width: '100%', textAlign: 'left', cursor: 'pointer' }}
            onClick={handleLogout}
          >
            Sign out
          </button>
        </nav>
      </div>

      {user && (
        <div className="sidebar-user">
          <div className="sidebar-user-card">
            <div className="avatar">
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="sidebar-user-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.name}
              </div>
              <div className="sidebar-user-role">{user.role}</div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
