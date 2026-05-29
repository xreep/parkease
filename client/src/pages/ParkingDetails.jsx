import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom'
import API from '../utils/api'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import NavigationMap from '../components/NavigationMap'

const VEHICLE_LABELS = {
  TWO_WHEELER: 'Two Wheeler',
  FOUR_WHEELER: 'Four Wheeler',
}

const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const SLOT_SIZE_LABELS = {
  COMPACT: 'Compact',
  MEDIUM: 'Medium',
  LARGE: 'Large',
  EXTRA_LARGE: 'Extra Large',
}

const nowLocal = () => {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}
const inTwoHours = () => {
  const d = new Date()
  d.setHours(d.getHours() + 2)
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}
const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'
const formatTime = (iso) =>
  iso ? new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '-'
const formatDatetime = (iso) =>
  iso
    ? new Date(iso).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true,
      })
    : '-'

const inp =
  'w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm'

const STATUS_STYLES = {
  PENDING:   { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', dot: 'bg-yellow-400', label: 'Pending'   },
  CONFIRMED: { bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200',  dot: 'bg-green-500',  label: 'Confirmed' },
  CANCELLED: { bg: 'bg-red-50',    text: 'text-red-600',    border: 'border-red-200',    dot: 'bg-red-400',    label: 'Cancelled' },
  COMPLETED: { bg: 'bg-gray-50',   text: 'text-gray-500',   border: 'border-gray-200',   dot: 'bg-gray-400',   label: 'Completed' },
}

const DetailRow = ({ label, value, href, tel }) => (
  <div className="px-3 py-2.5 flex justify-between gap-4 items-start">
    <span className="text-gray-400 text-xs flex-shrink-0 pt-0.5">{label}</span>
    {href ? (
      <a href={href} target="_blank" rel="noopener noreferrer"
        className="text-xs font-medium text-blue-600 hover:underline text-right break-all" style={{ maxWidth: '60%' }}>
        {value}
      </a>
    ) : tel ? (
      <a href={`tel:${tel}`} className="text-xs font-medium text-blue-600 hover:underline text-right">{value}</a>
    ) : (
      <span className="text-xs text-gray-700 font-medium text-right" style={{ maxWidth: '60%' }}>{value || <span className="text-gray-300">Not available</span>}</span>
    )}
  </div>
)

const ParkingDetails = () => {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [parking, setParking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [bookingError, setBookingError] = useState('')
  const [bookingLoading, setBookingLoading] = useState(false)
  const [confirmedBooking, setConfirmedBooking] = useState(null)
  const [pendingBooking, setPendingBooking] = useState(null)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [blockedSlots, setBlockedSlots] = useState([])
  const [navActive, setNavActive] = useState(false)
  const [distanceInfo, setDistanceInfo] = useState(null)
  const [lightboxIdx, setLightboxIdx] = useState(null)

  const [form, setForm] = useState({
    startTime: nowLocal(),
    endTime: inTwoHours(),
    vehicleType: 'FOUR_WHEELER',
    vehicleNumber: '',
  })

  const isOsm =
    id.startsWith('osm-') ||
    id.startsWith('nom-') ||
    id.startsWith('osm_') ||
    id.startsWith('gen_')

  useEffect(() => {
    if (isOsm) {
      const statePark = location.state?.parking
      if (statePark) setParking(statePark)
      else setError('Parking details not available.')
      setLoading(false)
      return
    }
    API.get(`/parkings/${id}`)
      .then(({ data }) => {
        setParking(data)
        const types = data.supportedVehicleTypes || data.vehicleTypes || []
        if (types.length) setForm(f => ({ ...f, vehicleType: types[0] }))
      })
      .catch(() => setError('Failed to load parking details.'))
      .finally(() => setLoading(false))

    API.get(`/owner/blocked-slots/${id}`)
      .then(({ data }) => setBlockedSlots(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [id])

  useEffect(() => {
    if (!parking?.latitude || !parking?.longitude) return
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude: pLat, longitude: pLng } = parking
          const { latitude: uLat, longitude: uLng } = pos.coords
          const url = `https://router.project-osrm.org/route/v1/driving/${uLng},${uLat};${pLng},${pLat}?overview=false`
          const res = await fetch(url)
          const data = await res.json()
          if (data.routes?.[0]) {
            setDistanceInfo({
              distance: (data.routes[0].distance / 1000).toFixed(1),
              duration: Math.round(data.routes[0].duration / 60),
            })
          }
        } catch { }
      },
      () => { },
      { timeout: 6000 }
    )
  }, [parking?.latitude, parking?.longitude])

  const calcHours = () => {
    if (!form.startTime || !form.endTime) return 0
    const diff = new Date(form.endTime) - new Date(form.startTime)
    return diff > 0 ? diff / 3600000 : 0
  }
  const calcTotal = () =>
    !parking ? 0 : (calcHours() * parseFloat(parking.hourlyPrice)).toFixed(0)

  const checkBlockedOverlap = () => {
    if (!form.startTime || !form.endTime) return null
    const start = new Date(form.startTime)
    const end = new Date(form.endTime)
    return blockedSlots.find(slot => {
      const sStart = new Date(slot.startTime)
      const sEnd = new Date(slot.endTime)
      return start < sEnd && end > sStart
    })
  }

  const handleBook = async (e) => {
    e.preventDefault()
    if (!user) { navigate('/login'); return }

    const start = new Date(form.startTime)
    const end = new Date(form.endTime)

    if (start <= new Date()) { setBookingError('Start time must be in the future.'); return }
    if (end <= start) { setBookingError('End time must be after start time.'); return }
    if (calcHours() < 1) { setBookingError('Minimum booking duration is 1 hour.'); return }
    if (!form.vehicleNumber.trim()) { setBookingError('Please enter your vehicle number.'); return }

    const overlap = checkBlockedOverlap()
    if (overlap) {
      setBookingError(
        `This time is blocked by the owner${overlap.reason ? `: ${overlap.reason}` : ''}. Please choose another time.`
      )
      return
    }

    setBookingError('')
    setBookingLoading(true)
    try {
      const startTime = new Date(form.startTime).toISOString()
      const endTime = new Date(form.endTime).toISOString()

      const vehicleRes = await API.post('/vehicles', {
        vehicleNumber: form.vehicleNumber.trim().toUpperCase(),
        vehicleType: form.vehicleType,
      })
      const vehicleId = vehicleRes.data?.id || vehicleRes.data?.vehicleId

      const bookingRes = await API.post('/bookings', {
        parkingListingId: id,
        vehicleId,
        startTime,
        endTime,
        vehicleType: form.vehicleType,
      })
      setPendingBooking(bookingRes.data)
    } catch (err) {
      setBookingError(err.response?.data?.message || 'Booking failed. Please try again.')
    } finally {
      setBookingLoading(false)
    }
  }

  const handlePayment = async () => {
    setPaymentLoading(true)
    setBookingError('')
    try {
      const totalAmount = parseFloat(pendingBooking.totalAmount)
      const { data: orderData } = await API.post('/payment/create-order', {
        amount: totalAmount,
        bookingId: pendingBooking.id,
      })

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
        amount: orderData.amount,
        currency: 'INR',
        name: 'ParkEase',
        description: 'Parking Booking Payment',
        order_id: orderData.orderId,
        handler: async function (response) {
          try {
            const verifyRes = await API.post('/payment/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              bookingId: pendingBooking.id,
            })
            if (verifyRes.data.success) {
              setConfirmedBooking({
                ...pendingBooking,
                status: 'CONFIRMED',
                paymentId: response.razorpay_payment_id,
              })
              setPendingBooking(null)
            } else {
              setBookingError('Payment verification failed. Please contact support.')
            }
          } catch {
            setBookingError('Payment verification failed. Please contact support.')
          }
          setPaymentLoading(false)
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
        },
        theme: { color: '#2563eb' },
        modal: {
          ondismiss: function () {
            setPaymentLoading(false)
          },
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (err) {
      setBookingError(err.response?.data?.message || 'Could not initiate payment. Please try again.')
      setPaymentLoading(false)
    }
  }

  const blockedOverlap = checkBlockedOverlap()

  if (loading) return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="flex justify-center items-center py-32">
        <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    </div>
  )

  if (error || !parking) return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-500 mb-4 text-sm">{error || 'Parking not found.'}</p>
        <Link to="/search" className="text-blue-600 hover:underline text-sm">Back to search</Link>
      </div>
    </div>
  )

  const vehicleTypes = parking.supportedVehicleTypes || parking.vehicleTypes || []
  const photos = Array.isArray(parking.photos) ? parking.photos.filter(Boolean) : []
  const schedule = Array.isArray(parking.availabilitySchedule) ? parking.availabilitySchedule : []
  const todayDow = new Date().getDay()
  const nowHhmm = `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`

  const renderOsmDetails = () => {
    const typeLabels = {
      'multi-storey': 'Multi-storey', underground: 'Underground',
      surface: 'Surface', street_side: 'Street side', rooftop: 'Rooftop',
    }
    const accessLabels = { public: 'Public', private: 'Private', customers: 'Customers only', yes: 'Public' }
    const feeLabels = { yes: 'Yes', no: 'No', unknown: 'Unknown' }
    const yesNo = (v) => v === 'yes' ? 'Yes' : v === 'no' ? 'No' : v || null

    return (
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Parking details</p>
        </div>
        <div className="divide-y divide-gray-100">
          <DetailRow label="Parking type" value={typeLabels[parking.parkingTypeLabel?.toLowerCase()] || parking.parkingTypeLabel || 'Surface'} />
          <DetailRow label="Access" value={accessLabels[parking.access] || parking.access || 'Public'} />
          <DetailRow label="Fee" value={feeLabels[parking.fee] || parking.fee || null} />
          <DetailRow label="Capacity" value={parking.capacity ? `${parking.capacity} vehicles` : null} />
          <DetailRow label="Covered" value={yesNo(parking.covered)} />
          {parking.openingHours && <DetailRow label="Opening hours" value={parking.openingHours} />}
          {parking.operator && <DetailRow label="Operator" value={parking.operator} />}
          {parking.phone && <DetailRow label="Phone" value={parking.phone} tel={parking.phone} />}
          {parking.website && (
            <DetailRow label="Website" value={parking.website.replace(/^https?:\/\//, '')} href={parking.website} />
          )}
          {parking.maxHeight && <DetailRow label="Max height" value={parking.maxHeight + ' m'} />}
          {parking.maxStay && <DetailRow label="Max stay" value={parking.maxStay} />}
          {parking.wheelchair && <DetailRow label="Wheelchair" value={yesNo(parking.wheelchair)} />}
          {parking.surface && <DetailRow label="Surface" value={parking.surface} />}
        </div>
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
          <p className="text-xs text-gray-400 leading-relaxed">
            Data sourced from OpenStreetMap contributors. Contact the parking operator for current rates and availability.
          </p>
        </div>
      </div>
    )
  }

  const renderBookingPanel = () => {
    if (isOsm) {
      return (
        <div className="space-y-3">
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
            <p className="text-sm font-semibold text-blue-700 mb-1">Public parking</p>
            <p className="text-xs text-blue-600/80 leading-relaxed">
              This is an OpenStreetMap location. Walk-in available — no advance booking required.
            </p>
          </div>
          <Link to="/search" className="block text-center text-sm text-blue-600 hover:underline">
            Find a bookable space
          </Link>
        </div>
      )
    }

    if (confirmedBooking) {
      const bookingHours = (
        (new Date(confirmedBooking.endTime) - new Date(confirmedBooking.startTime)) / 3600000
      ).toFixed(1)
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
            <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Payment successful!</p>
              <p className="text-xs text-gray-400">Your booking is confirmed.</p>
            </div>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg divide-y divide-gray-100 text-xs">
            <div className="px-3 py-2 flex justify-between gap-2">
              <span className="text-gray-400 flex-shrink-0">Booking ID</span>
              <span className="text-gray-700 font-mono text-right">{confirmedBooking.id.slice(0, 14)}...</span>
            </div>
            {confirmedBooking.paymentId && (
              <div className="px-3 py-2 flex justify-between gap-2">
                <span className="text-gray-400 flex-shrink-0">Payment ID</span>
                <span className="text-gray-700 font-mono text-right">{confirmedBooking.paymentId.slice(0, 18)}...</span>
              </div>
            )}
            <div className="px-3 py-2 flex justify-between gap-2">
              <span className="text-gray-400 flex-shrink-0">Parking</span>
              <span className="text-gray-700 font-medium text-right">{parking.title}</span>
            </div>
            <div className="px-3 py-2 flex justify-between gap-2">
              <span className="text-gray-400 flex-shrink-0">Address</span>
              <span className="text-gray-600 text-right">{parking.address}, {parking.city}</span>
            </div>
            <div className="px-3 py-2 flex justify-between gap-2">
              <span className="text-gray-400 flex-shrink-0">Start</span>
              <span className="text-gray-700 text-right">{formatDatetime(confirmedBooking.startTime)}</span>
            </div>
            <div className="px-3 py-2 flex justify-between gap-2">
              <span className="text-gray-400 flex-shrink-0">End</span>
              <span className="text-gray-700 text-right">{formatDatetime(confirmedBooking.endTime)}</span>
            </div>
            <div className="px-3 py-2 flex justify-between gap-2">
              <span className="text-gray-400 flex-shrink-0">Duration</span>
              <span className="text-gray-700">{bookingHours} hrs</span>
            </div>
            <div className="px-3 py-2 flex justify-between gap-2">
              <span className="text-gray-400 flex-shrink-0">Amount paid</span>
              <span className="font-semibold" style={{ color: '#2563eb' }}>
                Rs. {parseFloat(confirmedBooking.totalAmount).toFixed(0)}
              </span>
            </div>
            <div className="px-3 py-2 flex justify-between items-center gap-2">
              <span className="text-gray-400 flex-shrink-0">Status</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border font-medium bg-green-50 text-green-700 border-green-200">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                Confirmed
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Link
              to="/dashboard"
              className="block text-center w-full text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
              style={{ background: '#2563eb' }}
            >
              Go to Dashboard
            </Link>
            <Link
              to="/search"
              className="block text-center w-full text-gray-700 font-semibold py-2.5 rounded-lg text-sm border border-gray-200 hover:border-gray-300 transition-colors"
            >
              Search More Parking
            </Link>
          </div>
        </div>
      )
    }

    if (pendingBooking) {
      const bookingHours = (
        (new Date(pendingBooking.endTime) - new Date(pendingBooking.startTime)) / 3600000
      ).toFixed(1)
      return (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
            <p className="text-sm font-semibold text-blue-700 mb-1">Booking created</p>
            <p className="text-xs text-blue-600/80">Complete payment to confirm your spot.</p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg divide-y divide-gray-100 text-xs">
            <div className="px-3 py-2 flex justify-between gap-2">
              <span className="text-gray-400 flex-shrink-0">Booking ID</span>
              <span className="text-gray-700 font-mono text-right">{pendingBooking.id.slice(0, 14)}...</span>
            </div>
            <div className="px-3 py-2 flex justify-between gap-2">
              <span className="text-gray-400 flex-shrink-0">Duration</span>
              <span className="text-gray-700">{bookingHours} hrs</span>
            </div>
            <div className="px-3 py-2 flex justify-between gap-2">
              <span className="text-gray-400 flex-shrink-0">Amount</span>
              <span className="font-semibold" style={{ color: '#2563eb' }}>
                Rs. {parseFloat(pendingBooking.totalAmount).toFixed(0)}
              </span>
            </div>
          </div>
          {bookingError && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2.5 text-xs leading-relaxed">
              {bookingError}
            </div>
          )}
          <button
            onClick={handlePayment}
            disabled={paymentLoading}
            className="w-full text-white font-semibold py-3 rounded-lg transition-colors text-sm shadow-sm disabled:opacity-60"
            style={{ background: '#2563eb' }}
          >
            {paymentLoading ? 'Opening payment...' : 'Proceed to Payment'}
          </button>
        </div>
      )
    }

    if (!user) {
      return (
        <div className="space-y-3">
          <p className="text-gray-500 text-sm text-center py-2">Please login to book this parking.</p>
          <Link
            to="/login"
            className="block text-center w-full text-white font-semibold py-3 rounded-lg text-sm transition-colors shadow-sm"
            style={{ background: '#2563eb' }}
          >
            Login
          </Link>
        </div>
      )
    }

    if (user.role !== 'USER') {
      return (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-500">Booking is only available for users.</p>
        </div>
      )
    }

    return (
      <form onSubmit={handleBook} className="space-y-3">
        {bookingError && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2.5 text-xs leading-relaxed">
            {bookingError}
          </div>
        )}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Start Date and Time</label>
          <input
            type="datetime-local"
            value={form.startTime}
            onChange={(e) => setForm({ ...form, startTime: e.target.value })}
            className={inp}
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">End Date and Time</label>
          <input
            type="datetime-local"
            value={form.endTime}
            onChange={(e) => setForm({ ...form, endTime: e.target.value })}
            className={inp}
            required
          />
          <p className="text-xs text-gray-400 mt-1">Minimum booking duration is 1 hour.</p>
        </div>
        {blockedOverlap && (
          <div className="bg-red-50 border border-red-100 text-red-600 rounded-lg px-3 py-2 text-xs">
            This time overlaps a blocked slot{blockedOverlap.reason ? `: ${blockedOverlap.reason}` : ''}.
          </div>
        )}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Vehicle Type</label>
          <select
            value={form.vehicleType}
            onChange={(e) => setForm({ ...form, vehicleType: e.target.value })}
            className={inp + ' bg-white'}
          >
            {(vehicleTypes.length ? vehicleTypes : ['TWO_WHEELER', 'FOUR_WHEELER']).map(type => (
              <option key={type} value={type}>{VEHICLE_LABELS[type] || type}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Vehicle Number</label>
          <input
            type="text"
            placeholder="e.g. MH 01 AB 1234"
            value={form.vehicleNumber}
            onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value.toUpperCase() })}
            className={inp}
            required
          />
        </div>
        {calcHours() > 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="flex justify-between text-gray-500 text-xs mb-1.5">
              <span>Duration</span>
              <span>{calcHours().toFixed(1)} hours</span>
            </div>
            <div className="flex justify-between text-gray-500 text-xs mb-1.5">
              <span>Rs. {parking.hourlyPrice} &times; {calcHours().toFixed(1)} hrs</span>
              <span>Rs. {calcTotal()}</span>
            </div>
            <div className="flex justify-between font-semibold text-gray-900 text-sm border-t border-gray-200 pt-2">
              <span>Total Amount</span>
              <span style={{ color: '#2563eb' }}>Rs. {calcTotal()}</span>
            </div>
          </div>
        )}
        <button
          type="submit"
          disabled={bookingLoading || !!blockedOverlap}
          className="w-full text-white font-semibold py-3 rounded-lg transition-colors text-sm shadow-sm disabled:opacity-60"
          style={{ background: '#2563eb' }}
        >
          {bookingLoading ? 'Processing...' : 'Book Now'}
        </button>
      </form>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#f8fafc' }}>
      <Navbar />

      {/* Hero header */}
      {photos.length === 0 && (
        <div
          className="relative"
          style={{
            backgroundImage:
              'linear-gradient(rgba(15,23,42,0.72), rgba(30,58,138,0.72)), url(https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <nav className="flex items-center gap-2 text-sm text-blue-200 mb-4">
              <Link to="/search" className="hover:text-white transition-colors">Search</Link>
              <span>/</span>
              <span className="text-white truncate max-w-xs">{parking.title}</span>
            </nav>
            <h1 className="text-3xl font-bold text-white mb-2">{parking.title}</h1>
            <p className="text-blue-100 text-sm">{parking.address}, {parking.city}</p>
            {distanceInfo && (
              <p className="text-blue-200/80 text-xs mt-1">
                {distanceInfo.distance} km from your location &bull; ~{distanceInfo.duration} min drive
              </p>
            )}
          </div>
        </div>
      )}

      {/* Photo gallery hero */}
      {photos.length > 0 && (
        <div className="bg-gray-900">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-4">
            <nav className="flex items-center gap-2 text-sm text-gray-400 mb-3">
              <Link to="/search" className="hover:text-gray-200 transition-colors">Search</Link>
              <span>/</span>
              <span className="text-gray-200 truncate max-w-xs">{parking.title}</span>
            </nav>
          </div>
          <div className="relative">
            <div className="flex gap-1 overflow-x-auto" style={{ maxHeight: '300px' }}>
              {photos.map((url, idx) => (
                <img
                  key={idx}
                  src={url}
                  alt={`${parking.title} photo ${idx + 1}`}
                  className="object-cover flex-shrink-0 cursor-pointer hover:brightness-90 transition-all"
                  style={{
                    height: '280px',
                    width: idx === 0 ? '55%' : `${Math.min(35, 180 / (photos.length - 1))}%`,
                    minWidth: '120px',
                  }}
                  onClick={() => setLightboxIdx(idx)}
                />
              ))}
            </div>
            <div className="absolute bottom-3 right-3">
              <span className="bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                {photos.length} photo{photos.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <h1 className="text-2xl font-bold text-white mb-1">{parking.title}</h1>
            <p className="text-gray-300 text-sm">{parking.address}, {parking.city}</p>
            {distanceInfo && (
              <p className="text-gray-400 text-xs mt-1">
                {distanceInfo.distance} km from your location &bull; ~{distanceInfo.duration} min drive
              </p>
            )}
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxIdx !== null && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
          onClick={() => setLightboxIdx(null)}
        >
          <button
            className="absolute top-4 right-4 text-white text-2xl font-light w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            onClick={() => setLightboxIdx(null)}
          >
            &times;
          </button>
          {lightboxIdx > 0 && (
            <button
              className="absolute left-4 text-white w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-lg"
              onClick={(e) => { e.stopPropagation(); setLightboxIdx(lightboxIdx - 1) }}
            >
              &#8249;
            </button>
          )}
          {lightboxIdx < photos.length - 1 && (
            <button
              className="absolute right-14 text-white w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-lg"
              onClick={(e) => { e.stopPropagation(); setLightboxIdx(lightboxIdx + 1) }}
            >
              &#8250;
            </button>
          )}
          <img
            src={photos[lightboxIdx]}
            alt=""
            className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="absolute bottom-4 text-gray-400 text-xs">
            {lightboxIdx + 1} / {photos.length}
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 space-y-5">

            {!isOsm && (
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-700 mb-4">Rates</h2>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Per hour</p>
                    <p className="text-2xl font-bold" style={{ color: '#2563eb' }}>Rs. {parking.hourlyPrice}</p>
                  </div>
                  {parking.dailyPrice && (
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Per day</p>
                      <p className="text-xl font-bold text-gray-800">Rs. {parking.dailyPrice}</p>
                    </div>
                  )}
                  {parking.monthlyPrice && (
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Per month</p>
                      <p className="text-xl font-bold text-gray-800">Rs. {parking.monthlyPrice}</p>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-gray-100">
                  {parking.totalSlots > 0 && (
                    <p className="text-xs text-gray-400">{parking.totalSlots} total slots</p>
                  )}
                  {parking.slotSize && (
                    <p className="text-xs text-gray-400">
                      Slot size: <span className="font-medium text-gray-600">{SLOT_SIZE_LABELS[parking.slotSize] || parking.slotSize}</span>
                    </p>
                  )}
                  {typeof parking.autoApproveBookings === 'boolean' && (
                    <p className="text-xs" style={{ color: parking.autoApproveBookings ? '#16a34a' : '#d97706' }}>
                      {parking.autoApproveBookings ? 'Instant confirmation' : 'Manual approval required'}
                    </p>
                  )}
                </div>
              </div>
            )}

            {isOsm && renderOsmDetails()}

            {(vehicleTypes.length > 0 || parking.description) && (
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
                {vehicleTypes.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Vehicles accepted</p>
                    <div className="flex flex-wrap gap-2">
                      {vehicleTypes.map(type => (
                        <span
                          key={type}
                          className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-1 rounded-full font-medium"
                        >
                          {VEHICLE_LABELS[type] || type}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {parking.description && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">About this space</p>
                    <p className="text-sm text-gray-600 leading-relaxed">{parking.description}</p>
                  </div>
                )}
              </div>
            )}

            {/* Availability schedule */}
            {!isOsm && schedule.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Availability</p>
                  {(() => {
                    const today = schedule.find(s => s.dayOfWeek === todayDow)
                    if (!today) return null
                    const isOpen = today.isAvailable && nowHhmm >= today.openingTime && nowHhmm < today.closingTime
                    return (
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={isOpen
                          ? { background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }
                          : { background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }
                        }
                      >
                        {isOpen ? 'Open now' : 'Closed now'}
                      </span>
                    )
                  })()}
                </div>
                <div className="divide-y divide-gray-50">
                  {schedule.map((day) => {
                    const isToday = day.dayOfWeek === todayDow
                    return (
                      <div
                        key={day.dayOfWeek}
                        className="px-5 py-2.5 flex items-center justify-between"
                        style={{ background: isToday ? '#f0f9ff' : 'transparent' }}
                      >
                        <span className={`text-sm ${isToday ? 'font-semibold text-blue-700' : 'text-gray-600'}`}>
                          {DAY_SHORT[day.dayOfWeek]}
                          {isToday && <span className="text-xs text-blue-400 font-normal ml-1">Today</span>}
                        </span>
                        {day.isAvailable ? (
                          <span className="text-xs text-gray-500">
                            {day.openingTime} &ndash; {day.closingTime}
                          </span>
                        ) : (
                          <span className="text-xs text-red-400">Closed</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {!isOsm && blockedSlots.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Unavailable times</p>
                <div className="space-y-2">
                  {blockedSlots.map(slot => (
                    <div
                      key={slot.id}
                      className="flex items-center gap-3 text-sm bg-red-50 border border-red-100 rounded-lg px-3 py-2"
                    >
                      <span className="text-red-400 text-xs font-medium">Blocked</span>
                      <span className="text-gray-600 text-xs">
                        {formatDate(slot.blockedDate)} &bull; {formatTime(slot.startTime)} &ndash; {formatTime(slot.endTime)}
                      </span>
                      {slot.reason && <span className="text-gray-400 text-xs">{slot.reason}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {parking.latitude && parking.longitude && !isOsm && (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Location</p>
                </div>
                <div className="p-4">
                  <NavigationMap latitude={parking.latitude} longitude={parking.longitude} title={parking.title} />
                </div>
              </div>
            )}

            {parking.latitude && parking.longitude && isOsm && (
              navActive ? (
                <NavigationMap
                  latitude={parking.latitude}
                  longitude={parking.longitude}
                  title={parking.title}
                  onStop={() => setNavActive(false)}
                />
              ) : (
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-100">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Navigation</p>
                  </div>
                  <div className="p-5 space-y-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 mb-0.5">{parking.title}</p>
                      <p className="text-xs text-gray-400">{parking.address}{parking.city ? `, ${parking.city}` : ''}</p>
                      {distanceInfo && (
                        <p className="text-xs mt-1" style={{ color: '#2563eb' }}>
                          {distanceInfo.distance} km &bull; ~{distanceInfo.duration} min drive
                        </p>
                      )}
                      {!distanceInfo && (
                        <p className="text-xs text-gray-400 mt-1">Allow location access for distance estimate</p>
                      )}
                    </div>
                    <button
                      onClick={() => setNavActive(true)}
                      className="w-full text-white font-semibold py-2.5 rounded-lg text-sm transition-colors shadow-sm"
                      style={{ background: '#2563eb' }}
                    >
                      Start Navigation
                    </button>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${parking.latitude},${parking.longitude}&travelmode=driving`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-center text-sm text-blue-600 hover:underline"
                    >
                      Get Directions in Google Maps
                    </a>
                  </div>
                </div>
              )
            )}
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm sticky top-20 overflow-hidden">
              <div className="h-1" style={{ background: '#2563eb' }}></div>
              <div className="p-5">
                {!confirmedBooking && !pendingBooking && !isOsm && (
                  <div className="pb-4 mb-4 border-b border-gray-100">
                    <p className="text-3xl font-bold" style={{ color: '#2563eb' }}>
                      Rs. {parking.hourlyPrice}
                      <span className="text-sm font-normal text-gray-400"> / hour</span>
                    </p>
                  </div>
                )}
                {renderBookingPanel()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ParkingDetails
