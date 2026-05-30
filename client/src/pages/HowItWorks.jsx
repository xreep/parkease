import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'

const USER_STEPS = [
  {
    n: '01',
    title: 'Search for parking',
    desc: 'Enter your destination city and select your vehicle type. ParkEase instantly shows you verified listings and public parking locations near you on the map.',
  },
  {
    n: '02',
    title: 'Choose your spot',
    desc: 'Browse results, compare prices and availability, and open the listing page to see full details — address, schedule, slot sizes, and supported vehicles.',
  },
  {
    n: '03',
    title: 'Book and pay',
    desc: 'Select your start and end time, enter your vehicle number, and pay securely. Your booking is confirmed instantly and a receipt is sent to your email.',
  },
  {
    n: '04',
    title: 'Arrive and park',
    desc: 'Navigate directly to the address. Your reserved slot is waiting. No hunting for parking, no uncertainty — just drive straight in.',
  },
]

const OWNER_STEPS = [
  {
    n: '01',
    title: 'Create an owner account',
    desc: 'Sign up and select "List my space" during registration. Your account is set up with owner privileges automatically.',
  },
  {
    n: '02',
    title: 'Submit your listing',
    desc: 'Enter your parking address, supported vehicle types, slot sizes, pricing, photos, and your weekly availability schedule.',
  },
  {
    n: '03',
    title: 'Get approved',
    desc: 'Our team reviews your submission to verify the details. Once approved, your space goes live and starts appearing in search results.',
  },
  {
    n: '04',
    title: 'Earn from bookings',
    desc: 'Drivers book your space and pay upfront. Track your bookings, earnings, and blocked dates from your owner dashboard.',
  },
]

const FAQS = [
  {
    q: 'How do I book a parking slot?',
    a: 'Go to Find Parking, enter your city and vehicle type, and click Search. Open any listing, pick your dates and times, enter your vehicle number, and click Book Now. You will be prompted to pay to confirm the slot.',
  },
  {
    q: 'How does payment work?',
    a: 'Payments are processed securely through Razorpay. You pay at the time of booking using a card, UPI, or net banking. The amount is calculated automatically based on the hourly rate and duration you choose.',
  },
  {
    q: 'Can I cancel my booking?',
    a: 'Yes. You can cancel any PENDING or CONFIRMED booking from your dashboard. Go to My Dashboard, find the booking, and click Cancel. If you have an issue after a completed booking, you can raise a dispute.',
  },
  {
    q: 'How do I list my parking space?',
    a: 'Register as an Owner, then go to your dashboard and click Add Listing. Fill in your address, pricing, photos, vehicle types, and availability schedule. Submit the listing and an admin will review and approve it — typically within 24 hours.',
  },
  {
    q: 'Are all parking spaces verified?',
    a: 'Every bookable listing on ParkEase is reviewed by our team before it appears in search results. We also show public parking locations from OpenStreetMap, which are clearly marked as "OSM" and do not require booking.',
  },
]

const FAQ = ({ q, a }) => {
  const [open, setOpen] = useState(false)
  return (
    <div
      className="border border-gray-200 rounded-2xl overflow-hidden transition-all duration-200"
      style={{ background: '#fff' }}
    >
      <button
        className="w-full flex items-center justify-between px-6 py-4 text-left"
        onClick={() => setOpen(!open)}
      >
        <span className="text-sm font-semibold text-gray-900 pr-4">{q}</span>
        <span
          className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full transition-transform duration-200"
          style={{
            background: open ? '#2563eb' : '#f1f5f9',
            transform: open ? 'rotate(45deg)' : 'none',
          }}
        >
          <svg className="w-3 h-3" fill="none" stroke={open ? '#fff' : '#6b7280'} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
        </span>
      </button>
      {open && (
        <div className="px-6 pb-5 border-t border-gray-100">
          <p className="text-sm text-gray-500 leading-relaxed pt-4">{a}</p>
        </div>
      )}
    </div>
  )
}

const HowItWorks = () => {
  useEffect(() => { document.title = 'How It Works - ParkEase' }, [])

  return (
    <div className="min-h-screen" style={{ background: '#f8fafc' }}>
      <Navbar />

      {/* Hero */}
      <div
        className="py-20 text-center"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #2563eb 100%)' }}
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold text-blue-300 uppercase tracking-widest mb-4">ParkEase Guide</p>
          <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
            How ParkEase Works
          </h1>
          <p className="text-blue-100 text-base max-w-xl mx-auto leading-relaxed">
            From searching to parking — everything is designed to be fast, simple, and reliable.
          </p>
        </div>
      </div>

      {/* For Drivers */}
      <section className="py-20 bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-3">For Drivers</p>
            <h2 className="text-3xl font-bold text-gray-900">Find and book parking in minutes</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            {USER_STEPS.map((s) => (
              <div
                key={s.n}
                className="flex gap-4 p-5 rounded-2xl border border-gray-200 card-hover bg-white"
              >
                <span
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #2563eb, #0ea5e9)' }}
                >
                  {s.n}
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">{s.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link to="/search" className="btn-primary inline-block text-white font-semibold px-7 py-3 rounded-xl text-sm">
              Find Parking Now
            </Link>
          </div>
        </div>
      </section>

      {/* For Owners */}
      <section className="py-20 border-b border-gray-100" style={{ background: '#f0f9ff' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-3">For Space Owners</p>
            <h2 className="text-3xl font-bold text-gray-900">List your space and start earning</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            {OWNER_STEPS.map((s) => (
              <div
                key={s.n}
                className="flex gap-4 p-5 rounded-2xl border border-blue-100 card-hover"
                style={{ background: 'rgba(255,255,255,0.8)' }}
              >
                <span
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #2563eb, #0ea5e9)' }}
                >
                  {s.n}
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">{s.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link to="/register" className="btn-primary inline-block text-white font-semibold px-7 py-3 rounded-xl text-sm">
              List Your Space
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-3">FAQ</p>
            <h2 className="text-3xl font-bold text-gray-900">Frequently asked questions</h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((item) => (
              <FAQ key={item.q} q={item.q} a={item.a} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        className="py-24 text-center"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)' }}
      >
        <div className="max-w-xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-white mb-4">Ready to get started?</h2>
          <p className="text-blue-100 text-sm mb-8">Find a parking spot in seconds or list your space and start earning today.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/search" className="btn-primary inline-block text-white font-semibold px-7 py-3 rounded-xl text-sm">
              Find Parking
            </Link>
            <Link to="/register" className="inline-block border border-white/30 text-white font-semibold px-7 py-3 rounded-xl text-sm hover:bg-white/10 transition-colors duration-200">
              List Your Space
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HowItWorks
