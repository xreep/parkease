import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'

const STEPS = [
  { n: '01', title: 'Search your city', desc: 'Enter your city and vehicle type to instantly see verified listings and public OpenStreetMap locations nearby.' },
  { n: '02', title: 'Book your spot', desc: 'Pick a space, choose your date and time, enter your vehicle number, and confirm. It takes under a minute.' },
  { n: '03', title: 'Drive in and park', desc: 'Navigate to the address. Your slot is reserved. No circling, no guessing, no wasted time.' },
]

const FEATURES = [
  {
    title: 'Real-time availability',
    desc: 'See which slots are open right now. Our listings sync live so you never arrive at a full lot.',
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: 'Verified listings',
    desc: 'Every bookable space is reviewed by our team before it goes live. Park with confidence.',
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    title: 'Instant confirmation',
    desc: 'Receive a booking confirmation by email the moment you pay. No waiting for owner approval.',
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
]

const CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata', 'Ahmedabad']

const STATS = [
  { value: '5+', label: 'Cities covered' },
  { value: '500+', label: 'Verified listings' },
  { value: '10K+', label: 'Bookings made' },
  { value: '4.8', label: 'Average rating' },
]

const Home = () => {
  const [city, setCity] = useState('')
  const [vehicleType, setVehicleType] = useState('FOUR_WHEELER')
  const navigate = useNavigate()

  const handleSearch = (e) => {
    e.preventDefault()
    if (city.trim()) navigate(`/search?city=${encodeURIComponent(city.trim())}&vehicleType=${vehicleType}`)
  }

  const handleCityClick = (c) => {
    navigate(`/search?city=${encodeURIComponent(c)}&vehicleType=${vehicleType}`)
  }

  return (
    <div className="min-h-screen font-sans" style={{ background: '#f8fafc' }}>
      <Navbar />

      {/* Hero */}
      <section
        className="relative flex items-center"
        style={{
          minHeight: '92vh',
          backgroundImage: 'linear-gradient(rgba(15,23,42,0.75), rgba(30,58,138,0.85)), url(https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=1920&q=80)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-24">
          <div className="max-w-2xl animate-fadeInUp">
            <span className="inline-block text-xs font-semibold tracking-widest uppercase text-blue-300 mb-5 opacity-90">India's parking platform</span>
            <h1 className="text-5xl sm:text-6xl font-bold leading-tight mb-5">
              <span style={{
                background: 'linear-gradient(135deg, #ffffff, #93c5fd)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                Find Parking.<br />Book Instantly.
              </span>
            </h1>
            <p className="text-lg text-blue-100 mb-10 leading-relaxed max-w-xl opacity-90">
              Search verified parking spaces and public locations across Indian cities. Reserve your spot before you leave.
            </p>

            {/* Glass morphism search bar */}
            <form
              onSubmit={handleSearch}
              className="flex flex-col sm:flex-row gap-2 max-w-xl p-2 rounded-2xl"
              style={{
                background: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderRadius: '16px',
                boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.5)',
              }}
            >
              <input
                type="text"
                placeholder="Enter city — Mumbai, Delhi, Bangalore..."
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="flex-1 px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none text-sm rounded-xl bg-transparent"
              />
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                className="sm:border-l border-gray-200 px-3 py-3 text-gray-700 focus:outline-none bg-transparent text-sm rounded-xl"
              >
                <option value="FOUR_WHEELER">4-Wheeler</option>
                <option value="TWO_WHEELER">2-Wheeler</option>
              </select>
              <button
                type="submit"
                className="btn-primary text-white font-semibold px-6 py-3 rounded-xl text-sm whitespace-nowrap"
              >
                Search
              </button>
            </form>

            {/* City quick-select pills */}
            <div className="flex flex-wrap gap-2 mt-5">
              {CITIES.map((c) => (
                <button
                  key={c}
                  onClick={() => handleCityClick(c)}
                  className="text-xs font-medium px-3 py-1.5 rounded-full transition-all duration-200 hover:scale-105"
                  style={{
                    background: 'rgba(255,255,255,0.12)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(147,197,253,0.35)',
                    color: '#bfdbfe',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.22)'
                    e.currentTarget.style.borderColor = 'rgba(147,197,253,0.7)'
                    e.currentTarget.style.color = '#ffffff'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.12)'
                    e.currentTarget.style.borderColor = 'rgba(147,197,253,0.35)'
                    e.currentTarget.style.color = '#bfdbfe'
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Decorative bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, transparent, #0f172a)' }}></div>
      </section>

      {/* Stats section */}
      <section style={{ background: '#0f172a' }} className="py-16 border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
            {STATS.map((s, i) => (
              <div key={s.label} className={`text-center animate-fadeInUp-${Math.min(i + 1, 3)}`}>
                <p className="text-4xl font-bold mb-1 stat-number">{s.value}</p>
                <p className="text-sm text-slate-400">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 border-b border-gray-100" style={{ background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #f0f9ff 100%)' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-3">How it works</p>
              <h2 className="text-3xl font-bold text-gray-900 mb-10">Park in three simple steps</h2>
              <div className="space-y-6">
                {STEPS.map((s, idx) => (
                  <div
                    key={s.n}
                    className="flex gap-5 p-5 rounded-2xl card-hover"
                    style={{
                      background: 'rgba(255,255,255,0.7)',
                      backdropFilter: 'blur(12px)',
                      border: '1px solid rgba(255,255,255,0.8)',
                      boxShadow: '0 4px 20px rgba(37,99,235,0.06)',
                    }}
                  >
                    <span
                      className="text-lg font-bold flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm"
                      style={{ background: 'linear-gradient(135deg, #2563eb, #0ea5e9)' }}
                    >
                      {idx + 1}
                    </span>
                    <div>
                      <h3 className="text-base font-semibold text-gray-900 mb-1">{s.title}</h3>
                      <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl overflow-hidden shadow-2xl ring-1 ring-blue-100">
              <img
                src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80"
                alt="Parking lot"
                className="w-full h-80 lg:h-96"
                style={{ objectFit: 'cover' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 border-b border-gray-100 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-3">Why ParkEase</p>
            <h2 className="text-3xl font-bold text-gray-900">Built for Indian drivers</h2>
            <p className="text-gray-500 mt-3 text-sm max-w-md mx-auto">Everything you need to find, book, and park — with confidence.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className="rounded-2xl p-7 shadow-sm card-hover border"
                style={{
                  borderColor: '#e2e8f0',
                  background: '#ffffff',
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: 'linear-gradient(135deg, #2563eb, #0ea5e9)' }}
                >
                  {f.icon}
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Owner CTA */}
      <section
        className="py-28"
        style={{
          backgroundImage: 'linear-gradient(rgba(15,23,42,0.9), rgba(15,23,42,0.9)), url(https://images.unsplash.com/photo-1573375004773-64e5c8d7d859?w=800&q=80)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-xl">
            <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-3">For space owners</p>
            <h2 className="text-3xl font-bold text-white mb-4 leading-tight">Turn your unused space into steady income</h2>
            <p className="text-blue-100/80 text-sm leading-relaxed mb-8">
              Have a garage, driveway, or empty plot? List it on ParkEase and earn from drivers who need a reliable spot. Free to list — no upfront cost.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/register"
                className="btn-primary inline-block text-white font-semibold px-7 py-3 rounded-xl text-sm"
              >
                List your space
              </Link>
              <Link
                to="/search"
                className="inline-block border text-white font-semibold px-7 py-3 rounded-xl transition-all duration-200 text-sm hover:bg-white/10"
                style={{ borderColor: 'rgba(255,255,255,0.3)' }}
              >
                Find parking
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: '#0f172a' }} className="py-10 border-t border-white/5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span
            className="text-base font-bold text-white transition-all duration-200 hover:opacity-80"
            style={{ textShadow: '0 0 20px rgba(37,99,235,0.5)' }}
          >
            ParkEase
          </span>
          <div className="flex gap-7 text-sm text-slate-400">
            <Link to="/search" className="hover:text-white transition-colors duration-200">Find Parking</Link>
            <Link to="/login" className="hover:text-white transition-colors duration-200">Log in</Link>
            <Link to="/register" className="hover:text-white transition-colors duration-200">Sign up</Link>
          </div>
          <p className="text-xs text-slate-500">&copy; {new Date().getFullYear()} ParkEase India</p>
        </div>
      </footer>
    </div>
  )
}

export default Home
