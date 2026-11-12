import { Link, NavLink, Outlet } from 'react-router-dom'
import { useStore } from '../lib/store'

export function Layout() {
  const { currentUser, logout } = useStore()

  const dash =
    currentUser?.role === 'customer'
      ? '/customer'
      : currentUser?.role === 'artisan'
        ? '/artisan'
        : currentUser?.role === 'verifier' || currentUser?.role === 'admin'
          ? '/admin'
          : '/'

  return (
    <div className="app-shell">
      <header className="nav">
        <div className="container nav-inner">
          <Link to="/" className="brand">
            TRUSTA <span>Buea pilot</span>
          </Link>
          <div className="nav-actions">
            {currentUser ? (
              <>
                <NavLink to={dash} className="btn btn-secondary btn-sm">
                  Dashboard
                </NavLink>
                <span className="muted" style={{ fontSize: '0.9rem' }}>
                  {currentUser.name} · {currentUser.role}
                </span>
                <button type="button" className="btn btn-ghost btn-sm" onClick={logout}>
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-secondary btn-sm">
                  Sign in
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm">
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
      <footer className="footer">
        <div className="container">
          TRUSTA · Making skills visible. Making trust verifiable. · Pilot: plumbers in Buea
          (fictional demo data).
        </div>
      </footer>
    </div>
  )
}
