import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { loggedIn, userName, userRole, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  function isActive(path) {
    return location.pathname === path ? 'active' : ''
  }

  function handleLogout(e) {
    e.preventDefault()
    logout()
    navigate('/')
  }

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark fixed-top shadow-sm">
      <div className="container-fluid px-4">
        <Link className="navbar-brand fw-bold" to="/">
          <i className="fa-solid fa-warehouse me-2"></i>RaktárBérlés
        </Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#menu">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div id="menu" className="collapse navbar-collapse">
          <ul className="navbar-nav ms-auto">
            {loggedIn ? (
              <>
                <li className="nav-item dropdown">
                  <a className="nav-link dropdown-toggle nav-username" href="#" role="button" data-bs-toggle="dropdown">
                    <i className="fa-solid fa-circle-user me-1"></i>{userName || 'Profil'}
                  </a>
                  <ul className="dropdown-menu dropdown-menu-end">
                    <li>
                      <Link className={`dropdown-item ${isActive('/')}`} to="/">
                        <i className="fa-solid fa-house me-2"></i>Főoldal
                      </Link>
                    </li>
                    <li>
                      <Link className={`dropdown-item ${isActive('/dashboard')}`} to="/dashboard">
                        <i className="fa-solid fa-circle-user me-2"></i>Profilom
                      </Link>
                    </li>
                    <li>
                      <Link className={`dropdown-item ${isActive('/tarolok')}`} to="/tarolok">
                        <i className="fa-solid fa-plus me-2"></i>Új tároló bérlése
                      </Link>
                    </li>
                    <li>
                      <Link className={`dropdown-item ${isActive('/berleseim')}`} to="/berleseim">
                        <i className="fa-solid fa-boxes-stacked me-2"></i>Bérléseim
                      </Link>
                    </li>
                    <li>
                      <Link className={`dropdown-item ${isActive('/kapcsolat')}`} to="/kapcsolat">
                        <i className="fa-solid fa-envelope me-2"></i>Kapcsolat
                      </Link>
                    </li>
                    {userRole === 'admin' && (
                      <>
                        <li><hr className="dropdown-divider" /></li>
                        <li>
                          <Link className={`dropdown-item ${isActive('/admin')}`} to="/admin">
                            <i className="fa-solid fa-screwdriver-wrench me-2"></i>Admin
                          </Link>
                        </li>
                      </>
                    )}
                    <li><hr className="dropdown-divider" /></li>
                    <li>
                      <a className="dropdown-item text-danger" href="#" onClick={handleLogout}>
                        <i className="fa-solid fa-right-from-bracket me-2"></i>Kilépés
                      </a>
                    </li>
                  </ul>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <Link className={`nav-link ${isActive('/')}`} to="/">Főoldal</Link>
                </li>
                <li className="nav-item">
                  <Link className={`nav-link ${isActive('/kapcsolat')}`} to="/kapcsolat">Kapcsolat</Link>
                </li>
                <li className="nav-item">
                  <Link className={`nav-link ${isActive('/bejelentkezes')}`} to="/bejelentkezes">Bejelentkezés</Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  )
}
