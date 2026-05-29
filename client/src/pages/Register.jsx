import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import API from '../utils/api'

const Register = () => {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', role: 'USER' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password)) {
      setError('Password must include an uppercase letter, a lowercase letter, and a number.')
      return
    }
    setLoading(true)
    try {
      const { data } = await API.post('/auth/register', form)
      login(data.user, data.token)
      navigate(data.user.role === 'OWNER' ? '/owner/dashboard' : '/dashboard')
    } catch (err) {
      const data = err.response?.data
      if (Array.isArray(data?.errors) && data.errors.length > 0) {
        setError(data.errors.map(e => e.message).join(' '))
      } else {
        setError(data?.message || 'Registration failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const inp = "w-full rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 text-sm input-modern bg-white"

  return (
    <div className="min-h-screen flex">
      {/* Left panel — animated gradient */}
      <div className="hidden lg:flex lg:w-5/12 flex-col justify-between p-12 gradient-animated">
        <Link to="/" className="text-2xl font-bold text-white tracking-tight">ParkEase</Link>
        <div>
          <h2 className="text-3xl font-bold text-white mb-3 leading-tight">Join thousands of drivers</h2>
          <p className="text-blue-100 text-sm leading-relaxed mb-8">
            Whether you need a parking spot or have one to share, ParkEase connects you with the right match instantly.
          </p>
          <div className="space-y-4">
            {[
              'Search and book parking in 100+ Indian cities',
              'List your space and earn steady income',
              'No hidden fees — transparent pricing always',
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
      <div className="flex-1 flex items-center justify-center bg-white px-6 py-10">
        <div className="w-full max-w-sm animate-fadeInUp">
          <div className="mb-7">
            <Link to="/" className="text-xl font-bold lg:hidden mb-6 block" style={{ color: '#2563eb' }}>ParkEase</Link>
            <h1 className="text-2xl font-bold text-gray-900 mb-1.5">Create your account</h1>
            <p className="text-sm text-gray-500">Free to get started — no credit card needed</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-5 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full name</label>
              <input type="text" name="name" required value={form.name} onChange={handleChange}
                placeholder="Rahul Sharma" className={inp} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
              <input type="email" name="email" required value={form.email} onChange={handleChange}
                placeholder="you@example.com" className={inp} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <input type="password" name="password" required value={form.password} onChange={handleChange}
                placeholder="Min. 8 chars, uppercase, lowercase, number" className={inp} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone number</label>
              <input type="tel" name="phone" value={form.phone} onChange={handleChange}
                placeholder="+91 98765 43210" className={inp} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">I want to</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { val: 'USER', label: 'Find parking', sub: 'Book spaces near me' },
                  { val: 'OWNER', label: 'List my space', sub: 'Earn from my parking' },
                ].map((opt) => (
                  <button
                    key={opt.val} type="button"
                    onClick={() => setForm({ ...form, role: opt.val })}
                    className="rounded-xl py-3 px-3 text-left transition-all duration-200 border-2"
                    style={{
                      borderColor: form.role === opt.val ? '#2563eb' : '#e2e8f0',
                      background: form.role === opt.val ? '#eff6ff' : '#fff',
                      boxShadow: form.role === opt.val ? '0 0 0 3px rgba(37,99,235,0.1)' : 'none',
                    }}
                  >
                    <div className="font-semibold text-sm" style={{ color: form.role === opt.val ? '#1d4ed8' : '#374151' }}>{opt.label}</div>
                    <div className="text-xs mt-0.5" style={{ color: form.role === opt.val ? '#3b82f6' : '#9ca3af' }}>{opt.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full text-white font-semibold py-3 rounded-xl text-sm mt-2">
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold hover:underline" style={{ color: '#2563eb' }}>Log in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Register
