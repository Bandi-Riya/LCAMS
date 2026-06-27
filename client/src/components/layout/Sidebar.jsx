import { NavLink, useNavigate } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'

function NavItem({ to, label, icon }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `sidebar-link${isActive ? ' sidebar-link-active' : ''}`
      }
    >
      <span className="sidebar-link-icon" aria-hidden="true">
        {icon}
      </span>
      <span>{label}</span>
    </NavLink>
  )
}

export default function Sidebar() {
  const navigate = useNavigate()
  const { user, logout, isAdmin, isStaff, isMaintenance } = useAuth()

  const roleName = user?.role_id?.role_name || 'Unknown'

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <div className="sidebar-brand" onClick={() => navigate('/dashboard')}>
          <div className="sidebar-brand-title">LCAMS</div>
          <div className="sidebar-brand-subtitle">
            Classroom & Asset Management
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <NavItem to="/dashboard" label="Dashboard" icon="▦" />
        <NavItem to="/infrastructure" label="Infrastructure" icon="⛭" />
        <NavItem to="/assets" label="Assets" icon="▣" />
        <NavItem to="/search" label="Search" icon="⌕" />

        <div className="sidebar-divider" />

        {(isAdmin || isStaff || isMaintenance) && (
          <NavItem to="/maintenance" label="Maintenance" icon="🛠" />
        )}
        {(isAdmin || isStaff) && <NavItem to="/reports" label="Reports" icon="⤓" />}

        <div className="sidebar-divider" />

        {isAdmin && <NavItem to="/users" label="Users" icon="👤" />}

        <div className="sidebar-divider" />

        <NavItem to="/profile" label="Profile" icon="◉" />

        <button
          type="button"
          className="sidebar-link sidebar-logout"
          onClick={logout}
        >
          <span className="sidebar-link-icon" aria-hidden="true">
            ↩
          </span>
          Logout
        </button>
      </nav>

      <div className="sidebar-bottom">
        <div className="sidebar-user">
          <div className="sidebar-user-name">{user?.username || 'User'}</div>
          <div className="sidebar-role-badge">{roleName}</div>
        </div>
      </div>
    </aside>
  )
}

