import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Navbar = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const getDashboardLink = () => {
    if (user?.role === 'OWNER') return '/owner/dashboard'
    if (user?.role === 'ADMIN') return '/admin/dashboard'
    return '/dashboard'
  }

  const getDashboardLabel = () => {
    if (user?.role === 'OWNER') return 'Dashboard'
    if (user?.role === 'ADMIN') return 'Admin'
    return 'Dashboard'
  }

  return (
    <nav
      className={`bg-white border-b border-gray-200 sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'navbar-scrolled border-transparent' : ''}`}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">

          <Link
            to="/"
            className="text-xl font-bold tracking-tight transition-all duration-200 hover:opacity-80"
            style={{ color: '#2563eb', textShadow: scrolled ? '0 0 20px rgba(37,99,235,0.3)' : 'none' }}
          >
            ParkEase
          </Link>

          <div className="hidden md:flex items-center gap-7">
            <Link
              to="/search"
              className="text-sm text-gray-600 font-medium relative group py-1"
            >
              <span className="transition-colors duration-200 group-hover:text-blue-600">Find Parking</span>
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-200 rounded-full"></span>
            </Link>
            <a
              href="/#how-it-works"
              className="text-sm text-gray-600 font-medium relative group py-1"
            >
              <span className="transition-colors duration-200 group-hover:text-blue-600">How it works</span>
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-200 rounded-full"></span>
            </a>
            {user?.role === 'OWNER' && (
              <Link
                to="/owner/add-parking"
                className="text-sm text-gray-600 font-medium relative group py-1"
              >
                <span className="transition-colors duration-200 group-hover:text-blue-600">List your space</span>
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-200 rounded-full"></span>
              </Link>
            )}
          </div>

          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <>
                <Link
                  to={getDashboardLink()}
                  className="text-sm text-gray-700 hover:text-blue-600 font-medium px-3 py-1.5 transition-colors duration-200"
                >
                  {getDashboardLabel()}
                </Link>
                <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded font-semibold border border-blue-100">
                  {user.role}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-600 border border-gray-300 px-3 py-1.5 rounded-lg hover:border-gray-400 hover:text-gray-900 transition-all duration-200"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm text-gray-700 border border-gray-300 px-4 py-1.5 rounded-lg hover:border-blue-400 hover:text-blue-600 transition-all duration-200 font-medium"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="btn-primary text-sm text-white px-4 py-1.5 rounded-lg font-medium"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>

          <button
            className="md:hidden p-2 text-gray-500 hover:text-gray-900 transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              }
            </svg>
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 py-2 bg-white">
            <Link to="/search" onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">Find Parking</Link>
            {user ? (
              <>
                <Link to={getDashboardLink()} onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">{getDashboardLabel()}</Link>
                {user?.role === 'OWNER' && (
                  <Link to="/owner/add-parking" onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">List your space</Link>
                )}
                <button onClick={() => { handleLogout(); setMenuOpen(false) }} className="block w-full text-left px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">Log out</button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">Log in</Link>
                <Link to="/register" onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 text-sm text-blue-600 font-medium hover:bg-gray-50 rounded-lg transition-colors">Sign up</Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar
