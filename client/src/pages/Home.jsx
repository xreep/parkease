import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'

const STEPS = [
  { n: '01', title: 'Search your city', desc: 'Enter your city and vehicle type to instantly see verified listings and public OpenStreetMap locations nearby.' },
  { n: '02', title: 'Book your spot', desc: 'Pick a space, choose your date and time, enter your vehicle number, and confirm. It takes under a minute.' },
  { n: '03', title: 'Drive in and park', desc: 'Navigate to the address. Your slot is reserved. No circling, no guessing, no wasted time.' },
]

const FEATURES = [
  { title: 'Real-time availability', desc: 'See which slots are open right now. Our listings sync live so you never arrive at a full lot.' },
  { title: 'Verified listings', desc: 'Every bookable space is reviewed by our team before it goes live. Park with confidence.' },
  { title: 'Instant confirmation', desc: 'Receive a booking confirmation by email the moment you pay. No waiting for owner approval.' },
]

const CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata', 'Ahmedabad']

const DOT_GRID = {
  backgroundImage: 'radial-gradient(#2563eb22 1px, transparent 1px)',
  backgroundSize: '20px 20px',
}

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
          minHeight: '90vh',
          backgroundImage: 'linear-gradient(rgba(15,23,42,0.72), rgba(30,58,138,0.82)), url(https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=1920&q=80)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-24">
          <div className="max-w-2xl">
            <span className="inline-block text-xs font-semibold tracking-widest uppercase text-blue-300 mb-5">India's parking platform</span>
            <h1 className="text-5xl sm:text-6xl font-bold text-white leading-tight mb-5">
              Find Parking.<br />Book Instantly.
            </h1>
            <p className="text-lg text-blue-100 mb-10 leading-relaxed max-w-xl">
              Search verified parking spaces and public locations across Indian cities. Reserve your spot before you leave.
            </p>

            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 max-w-xl bg-white rounded-xl p-2 shadow-2xl">
              <input
                type="text"
                placeholder="Enter city — Mumbai, Delhi, Bangalore..."
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="flex-1 px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none text-sm rounded-lg"
              />
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                className="sm:border-l border-gray-200 px-3 py-3 text-gray-700 focus:outline-none bg-white text-sm rounded-lg"
              >
                <option value="FOUR_WHEELER">4-Wheeler</option>
                <option value="TWO_WHEELER">2-Wheeler</option>
              </select>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors text-sm whitespace-nowrap"
              >
                Search
              </button>
            </form>

            <div className="flex flex-wrap gap-2 mt-6">
              {CITIES.map((c) => (
                <button
                  key={c}
                  onClick={() => handleCityClick(c)}
                  className="text-xs text-blue-200 border border-blue-400/40 hover:border-blue-300 hover:text-white px-3 py-1.5 rounded-full transition-colors"
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-white py-24 border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-3">How it works</p>
              <h2 className="text-3xl font-bold text-gray-900 mb-10">Park in three simple steps</h2>
              <div className="space-y-8">
                {STEPS.map((s) => (
                  <div key={s.n} className="flex gap-5">
                    <span className="text-2xl font-bold text-blue-100 leading-none flex-shrink-0 w-10 pt-0.5">{s.n}</span>
                    <div>
                      <h3 className="text-base font-semibold text-gray-900 mb-1">{s.title}</h3>
                      <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl overflow-hidden shadow-xl">
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
      <section className="py-24 border-b border-gray-100" style={{ background: '#eff6ff', ...DOT_GRID }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-3">Why ParkEase</p>
            <h2 className="text-3xl font-bold text-gray-900">Built for Indian drivers</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-white border border-blue-100 rounded-2xl p-7 shadow-sm hover:shadow-md transition-shadow">
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
          backgroundImage: 'linear-gradient(rgba(15,23,42,0.88), rgba(15,23,42,0.88)), url(https://images.unsplash.com/photo-1573375004773-64e5c8d7d859?w=800&q=80)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-xl">
            <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-3">For space owners</p>
            <h2 className="text-3xl font-bold text-white mb-4">Turn your unused space into steady income</h2>
            <p className="text-blue-100 text-sm leading-relaxed mb-8">
              Have a garage, driveway, or empty plot? List it on ParkEase and earn from drivers who need a reliable spot. Free to list — no upfront cost.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/register"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-7 py-3 rounded-lg transition-colors text-sm shadow-lg"
              >
                List your space
              </Link>
              <Link
                to="/search"
                className="inline-block border border-white/30 text-white hover:border-white/60 font-semibold px-7 py-3 rounded-lg transition-colors text-sm"
              >
                Find parking
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: '#1e293b' }} className="py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-base font-bold text-white">ParkEase</span>
          <div className="flex gap-7 text-sm text-slate-400">
            <Link to="/search" className="hover:text-white transition-colors">Find Parking</Link>
            <Link to="/login" className="hover:text-white transition-colors">Log in</Link>
            <Link to="/register" className="hover:text-white transition-colors">Sign up</Link>
          </div>
          <p className="text-xs text-slate-500">&copy; {new Date().getFullYear()} ParkEase India</p>
        </div>
      </footer>
    </div>
  )
}

export default Home
