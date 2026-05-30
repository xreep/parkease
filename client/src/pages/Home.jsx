import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'

const WHY_CARDS = [
  {
    title: 'Real-time Availability',
    desc: 'See live parking availability before you go. Our listings sync in real time so you never arrive at a full lot.',
    icon: (
      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: 'Advance Booking',
    desc: 'Reserve your spot hours or days in advance. Walk in with confidence knowing your slot is secured.',
    icon: (
      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    title: 'Verified Listings',
    desc: 'Every bookable parking space is reviewed by our team before it goes live. Park with complete confidence.',
    icon: (
      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    title: 'Secure Payments',
    desc: 'Safe and secure payment processing via Razorpay. Pay with UPI, card, or net banking — no hidden charges.',
    icon: (
      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
  },
]

const HOW_STEPS = [
  { n: 1, title: 'Search', desc: 'Enter your destination city and find nearby parking options on the map.' },
  { n: 2, title: 'Book',   desc: 'Select your preferred slot, choose your time, and pay securely in seconds.' },
  { n: 3, title: 'Park',   desc: 'Arrive at the address. Your slot is reserved and waiting for you.' },
]

const CITIES = [
  'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Pune',
  'Kolkata', 'Ahmedabad', 'Jaipur', 'Lucknow', 'Noida', 'Gurugram',
  'Chandigarh', 'Indore', 'Bhopal',
]

const TESTIMONIALS = [
  {
    quote: 'Found a covered spot in Bandra in under two minutes. The booking process is straightforward and the slot was exactly as described. Will use every time I visit Mumbai.',
    name: 'Arjun Mehta',
    city: 'Pune',
    stars: 5,
  },
  {
    quote: 'I listed my garage on ParkEase and within a week I was getting regular bookings. The dashboard makes it easy to track everything. Great for earning passive income.',
    name: 'Sunita Rao',
    city: 'Bangalore',
    stars: 5,
  },
  {
    quote: 'Parked near Connaught Place without driving around for 20 minutes like usual. The OpenStreetMap locations are also a great touch for when you just need a quick reference.',
    name: 'Vikram Singh',
    city: 'Delhi',
    stars: 5,
  },
]

const OWNER_BENEFITS = [
  'Set your own hours and pricing',
  'Instant booking notifications',
  'Earn from otherwise empty space',
  'Admin-reviewed listings for trust',
  'Full control via owner dashboard',
]

const FOOTER_LINKS = {
  Product: [
    { label: 'Find Parking', to: '/search' },
    { label: 'List Your Space', to: '/register' },
    { label: 'How It Works', to: '/how-it-works' },
    { label: 'Pricing', to: '#' },
  ],
  Company: [
    { label: 'About', to: '#' },
    { label: 'Blog', to: '#' },
    { label: 'Careers', to: '#' },
    { label: 'Contact', to: '#' },
  ],
  Support: [
    { label: 'Help Center', to: '#' },
    { label: 'Safety', to: '#' },
    { label: 'Terms', to: '#' },
    { label: 'Privacy', to: '#' },
  ],
}

const Home = () => {
  const [city, setCity] = useState('')
  const [vehicleType, setVehicleType] = useState('FOUR_WHEELER')
  const navigate = useNavigate()

  useEffect(() => { document.title = 'ParkEase - Find & Book Parking in India' }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (city.trim()) navigate(`/search?city=${encodeURIComponent(city.trim())}&vehicleType=${vehicleType}`)
  }

  const handleCityClick = (c) => navigate(`/search?city=${encodeURIComponent(c)}&vehicleType=${vehicleType}`)

  return (
    <div className="min-h-screen font-sans" style={{ background: '#f8fafc' }}>
      <Navbar />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
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

            <form
              onSubmit={handleSearch}
              className="flex flex-col sm:flex-row gap-2 max-w-xl p-2 rounded-2xl"
              style={{
                background: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
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

            <div className="flex flex-wrap gap-2 mt-5">
              {['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Pune'].map((c) => (
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
        <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, transparent, #0f172a)' }}></div>
      </section>

      {/* ── Stats strip ──────────────────────────────────────────────────── */}
      <section style={{ background: '#0f172a' }} className="py-12 border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
            {[
              { value: '15+', label: 'Cities covered' },
              { value: '500+', label: 'Verified listings' },
              { value: '10K+', label: 'Bookings made' },
              { value: '4.8', label: 'Average rating' },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-4xl font-bold mb-1 stat-number">{s.value}</p>
                <p className="text-sm text-slate-400">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why Choose ParkEase ───────────────────────────────────────────── */}
      <section className="py-24 bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-3">Benefits</p>
            <h2 className="text-3xl font-bold text-gray-900">Why Choose ParkEase?</h2>
            <p className="text-gray-500 mt-3 text-sm max-w-md mx-auto">The smarter way to find and book parking across India</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {WHY_CARDS.map((c) => (
              <div
                key={c.title}
                className="bg-white border border-gray-200 rounded-2xl p-6 card-hover"
                style={{ borderTop: '3px solid #2563eb' }}
              >
                <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                  {c.icon}
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">{c.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 border-b border-gray-100" style={{ background: '#eff6ff' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-3">Process</p>
            <h2 className="text-3xl font-bold text-gray-900">How It Works</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {HOW_STEPS.map((s, i) => (
              <div
                key={s.n}
                className={`rounded-2xl p-7 card-hover border animate-fadeInUp-${Math.min(i + 1, 3)}`}
                style={{
                  background: 'rgba(255,255,255,0.8)',
                  backdropFilter: 'blur(12px)',
                  borderColor: '#bfdbfe',
                }}
              >
                <span
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-base font-bold mb-4"
                  style={{ background: 'linear-gradient(135deg, #2563eb, #0ea5e9)' }}
                >
                  {s.n}
                </span>
                <h3 className="text-base font-semibold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link to="/how-it-works" className="text-sm font-semibold text-blue-600 hover:underline transition-colors">
              Learn more about how it works &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* ── For Parking Owners ───────────────────────────────────────────── */}
      <section
        className="py-28 border-b border-white/5"
        style={{
          backgroundImage: 'linear-gradient(rgba(15,23,42,0.92), rgba(15,23,42,0.92)), url(https://images.unsplash.com/photo-1573375004773-64e5c8d7d859?w=800&q=80)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-3">For Space Owners</p>
              <h2 className="text-3xl font-bold text-white mb-4 leading-tight">Earn from your unused parking space</h2>
              <p className="text-blue-100/80 text-sm leading-relaxed mb-7">
                Have a garage, driveway, or empty plot? List it on ParkEase and earn from drivers who need a reliable spot. Free to list — no upfront cost.
              </p>
              <ul className="space-y-3 mb-8">
                {OWNER_BENEFITS.map((b) => (
                  <li key={b} className="flex items-center gap-3 text-sm text-blue-100">
                    <span className="w-5 h-5 rounded-full bg-blue-600/30 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    {b}
                  </li>
                ))}
              </ul>
              <Link
                to="/register"
                className="btn-primary inline-block text-white font-semibold px-7 py-3 rounded-xl text-sm"
              >
                List Your Space
              </Link>
            </div>
            <div className="hidden lg:grid grid-cols-2 gap-4">
              {[
                { label: 'Active listings', value: '500+' },
                { label: 'Cities covered', value: '15+' },
                { label: 'Owner payouts', value: 'Monthly' },
                { label: 'Setup time', value: '< 10 min' },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl p-5 border border-white/10 text-center"
                  style={{ background: 'rgba(255,255,255,0.05)' }}
                >
                  <p className="text-2xl font-bold text-white mb-1">{item.value}</p>
                  <p className="text-xs text-blue-300">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Cities We Cover ──────────────────────────────────────────────── */}
      <section className="py-20 bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-3">Coverage</p>
            <h2 className="text-3xl font-bold text-gray-900">Cities We Cover</h2>
            <p className="text-gray-500 mt-3 text-sm">Click any city to see parking near you</p>
          </div>
          <div className="flex flex-wrap justify-center gap-2.5">
            {CITIES.map((c) => (
              <button
                key={c}
                onClick={() => handleCityClick(c)}
                className="text-sm font-medium px-4 py-2 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 transition-all duration-200 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700"
                style={{ transition: 'all 0.2s ease' }}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────────── */}
      <section className="py-24 border-b border-gray-100" style={{ background: '#f8fafc' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-3">Testimonials</p>
            <h2 className="text-3xl font-bold text-gray-900">What our users say</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.name}
                className="bg-white border border-gray-200 rounded-2xl p-6 card-hover"
                style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
              >
                <div className="flex items-center gap-0.5 mb-4">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <div key={i} className="w-4 h-4 rounded-full" style={{ background: '#f59e0b' }}></div>
                  ))}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed mb-5">"{t.quote}"</p>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.city}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer style={{ background: '#1e293b' }} className="pt-14 pb-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-12">
            {/* Brand */}
            <div className="col-span-2 sm:col-span-1">
              <span className="text-xl font-bold text-white block mb-2" style={{ textShadow: '0 0 20px rgba(37,99,235,0.5)' }}>ParkEase</span>
              <p className="text-xs text-slate-400 leading-relaxed max-w-xs">
                The smarter way to find and book parking across India.
              </p>
            </div>

            {/* Link columns */}
            {Object.entries(FOOTER_LINKS).map(([group, links]) => (
              <div key={group}>
                <p className="text-xs font-semibold text-slate-300 uppercase tracking-widest mb-4">{group}</p>
                <ul className="space-y-2.5">
                  {links.map((link) => (
                    <li key={link.label}>
                      <Link
                        to={link.to}
                        className="text-sm text-slate-400 hover:text-white transition-colors duration-200"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-slate-500">Copyright {new Date().getFullYear()} ParkEase. All rights reserved.</p>
            <div className="flex gap-5 text-xs text-slate-500">
              <Link to="#" className="hover:text-slate-300 transition-colors">Terms</Link>
              <Link to="#" className="hover:text-slate-300 transition-colors">Privacy</Link>
              <Link to="#" className="hover:text-slate-300 transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Home
