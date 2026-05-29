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

  const inputClass = "w-full rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 text-sm input-modern bg-white"

  return (
    <div className="min-h-screen flex">
      {/* Left panel — animated gradient */}
      <div
        className="hidden lg:flex lg:w-5/12 flex-col justify-between p-12 gradient-animated"
      >
        <Link to="/" className="text-2xl font-bold text-white tracking-tight">ParkEase</Link>
        <div>
          <h2 className="text-3xl font-bold text-white mb-3 leading-tight">Park smarter across India</h2>
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
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5 backdrop-blur-sm">
                  <div className="w-2 h-2 rounded-full bg-white"></div>
                </div>
                <span className="text-sm text-blue-100 leading-relaxed">{point}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-blue-300/70 text-xs">&copy; {new Date().getFullYear()} ParkEase India</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-sm animate-fadeInUp">
          <div className="mb-8">
            <Link to="/" className="text-xl font-bold lg:hidden mb-6 block" style={{ color: '#2563eb' }}>ParkEase</Link>
            <h1 className="text-2xl font-bold text-gray-900 mb-1.5">Welcome back</h1>
            <p className="text-sm text-gray-500">Log in to your ParkEase account</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-5 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
              <input
                type="email" name="email" required value={form.email} onChange={handleChange}
                placeholder="you@example.com"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <input
                type="password" name="password" required value={form.password} onChange={handleChange}
                placeholder="Enter your password"
                className={inputClass}
              />
            </div>
            <button
              type="submit" disabled={loading}
              className="btn-primary w-full text-white font-semibold py-3 rounded-xl text-sm mt-2"
            >
              {loading ? 'Logging in...' : 'Log in'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            No account yet?{' '}
            <Link to="/register" className="font-semibold hover:underline" style={{ color: '#2563eb' }}>
              Sign up free
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
