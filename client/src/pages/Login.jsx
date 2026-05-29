import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import API from '../utils/api'

const Login = () => {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await API.post('/auth/login', form)
      login(data.user, data.token)
      const role = data.user.role
      if (role === 'OWNER') navigate('/owner/dashboard')
      else if (role === 'ADMIN') navigate('/admin/dashboard')
      else navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div
        className="hidden lg:flex lg:w-5/12 flex-col justify-between p-12"
        style={{
          backgroundImage: 'linear-gradient(rgba(30,58,138,0.92), rgba(37,99,235,0.92)), url(https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800&q=80)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <Link to="/" className="text-2xl font-bold text-white tracking-tight">ParkEase</Link>
        <div>
          <h2 className="text-3xl font-bold text-white mb-3">Park smarter across India</h2>
          <p className="text-blue-100 text-sm leading-relaxed mb-8">
            Find and book parking in Mumbai, Delhi, Bangalore, and 100+ Indian cities — all in one place.
          </p>
          <div className="space-y-4">
            {[
              'Verified listings from trusted owners',
              'Real-time slot availability',
              'Instant booking confirmation by email',
            ].map((point) => (
              <div key={point} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-blue-400/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-blue-200"></div>
                </div>
                <span className="text-sm text-blue-100">{point}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-blue-300 text-xs">&copy; {new Date().getFullYear()} ParkEase India</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <Link to="/" className="text-xl font-bold lg:hidden mb-6 block" style={{ color: '#2563eb' }}>ParkEase</Link>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h1>
            <p className="text-sm text-gray-500">Log in to your ParkEase account</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-5 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
              <input
                type="email" name="email" required value={form.email} onChange={handleChange}
                placeholder="you@example.com"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <input
                type="password" name="password" required value={form.password} onChange={handleChange}
                placeholder="Enter your password"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full text-white font-semibold py-2.5 rounded-lg transition-colors text-sm shadow-sm disabled:opacity-60"
              style={{ background: loading ? '#6b7280' : '#2563eb' }}
            >
              {loading ? 'Logging in...' : 'Log in'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            No account yet?{' '}
            <Link to="/register" className="font-medium hover:underline" style={{ color: '#2563eb' }}>
              Sign up free
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
