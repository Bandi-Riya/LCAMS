import { Link, useLocation } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'

const TITLES = [
  { prefix: '/dashboard', title: 'Dashboard' },
  { prefix: '/infrastructure', title: 'Infrastructure' },
  { prefix: '/rooms', title: 'Room Detail' },
  { prefix: '/assets', title: 'Assets' },
  { prefix: '/maintenance', title: 'Maintenance' },
  { prefix: '/search', title: 'Search' },
  { prefix: '/reports', title: 'Reports' },
  { prefix: '/users', title: 'Users' },
  { prefix: '/profile', title: 'Profile' },
]

function getTitle(pathname) {
  const match =
    TITLES.find((t) => pathname === t.prefix) ||
    TITLES.find((t) => pathname.startsWith(t.prefix + '/')) ||
    TITLES.find((t) => pathname.startsWith(t.prefix))
  return match?.title || 'LCAMS'
}

function initials(name) {
  const s = (name || '').trim()
  if (!s) return 'U'
  const parts = s.split(/\s+/).slice(0, 2)
  return parts.map((p) => p[0]?.toUpperCase()).join('')
}

export default function Navbar() {
  const location = useLocation()
  const { user } = useAuth()

  return (
    <header className="navbar">
      <div className="navbar-left">
        <div className="navbar-title">{getTitle(location.pathname)}</div>
      </div>

      <div className="navbar-right">
        <Link to="/search" className="navbar-icon-btn" aria-label="Search">
          ⌕
        </Link>
        <div className="navbar-avatar" title={user?.username || 'User'}>
          {initials(user?.username)}
        </div>
      </div>
    </header>
  )
}

