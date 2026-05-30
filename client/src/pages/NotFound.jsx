import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'

const NotFound = () => {
  useEffect(() => { document.title = 'Page Not Found - ParkEase' }, [])

  return (
    <div className="min-h-screen" style={{ background: '#f8fafc' }}>
      <Navbar />
      <div className="flex flex-col items-center justify-center px-4 py-32 text-center">
        <p
          className="text-8xl font-bold mb-4 leading-none"
          style={{
            background: 'linear-gradient(135deg, #2563eb, #0ea5e9)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          404
        </p>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Page not found</h1>
        <p className="text-gray-500 text-sm max-w-xs leading-relaxed mb-8">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link to="/" className="btn-primary inline-block text-white font-semibold px-6 py-3 rounded-xl text-sm">
          Go to Home
        </Link>
      </div>
    </div>
  )
}

export default NotFound
