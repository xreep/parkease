import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import API from '../utils/api'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'

const DOT_GRID = {
  backgroundImage: 'radial-gradient(#2563eb15 1px, transparent 1px)',
  backgroundSize: '20px 20px',
}

const STATUS = {
  PENDING:   { dot: 'bg-yellow-400', label: 'Pending',   bg: 'bg-yellow-50',  text: 'text-yellow-700', border: 'border-yellow-200' },
  CONFIRMED: { dot: 'bg-green-500',  label: 'Confirmed', bg: 'bg-green-50',   text: 'text-green-700',  border: 'border-green-200'  },
  CANCELLED: { dot: 'bg-red-400',    label: 'Cancelled', bg: 'bg-red-50',     text: 'text-red-600',    border: 'border-red-200'    },
  COMPLETED: { dot: 'bg-gray-400',   label: 'Completed', bg: 'bg-gray-50',    text: 'text-gray-500',   border: 'border-gray-200'   },
}

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'

const fmtTime = (iso) =>
  iso ? new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '-'

const fmtRange = (start, end) => {
  if (!start || !end) return '-'
  const startDate = fmtDate(start)
  const endDate = fmtDate(end)
  const startTime = fmtTime(start)
  const endTime = fmtTime(end)
  if (startDate === endDate) {
    return `${startDate}, ${startTime} - ${endTime}`
  }
  return `${startDate}, ${startTime} - ${endDate}, ${endTime}`
}

const calcDuration = (start, end) => {
  if (!start || !end) return null
  const hrs = (new Date(end) - new Date(start)) / 3600000
  return hrs > 0 ? hrs.toFixed(1) : null
}

const UserDashboard = () => {
  const { user } = useAuth()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cancelling, setCancelling] = useState(null)
  const [disputes, setDisputes] = useState({})
  const [disputeFor, setDisputeFor] = useState(null)
  const [disputeMsg, setDisputeMsg] = useState('')
  const [disputeLoading, setDisputeLoading] = useState(false)
  const [disputeError, setDisputeError] = useState('')

  const fetchBookings = () => {
    setLoading(true)
    API.get('/bookings/my-bookings')
      .then(({ data }) => setBookings(Array.isArray(data) ? data : []))
      .catch(() => setError('Failed to load bookings.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchBookings()
    API.get('/disputes/my')
      .then(({ data }) => {
        const map = {}
        if (Array.isArray(data)) data.forEach(d => { map[d.bookingId] = d.status })
        setDisputes(map)
      })
      .catch(() => {})
  }, [])

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this booking?')) return
    setCancelling(id)
    try {
      await API.put(`/bookings/${id}/cancel`)
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'CANCELLED' } : b))
    } catch {
      alert('Failed to cancel booking.')
    } finally {
      setCancelling(null)
    }
  }

  const handleDisputeSubmit = async (e) => {
    e.preventDefault()
    if (!disputeMsg.trim()) { setDisputeError('Please enter a message.'); return }
    setDisputeLoading(true); setDisputeError('')
    try {
      await API.post('/disputes', { bookingId: disputeFor, message: disputeMsg.trim() })
      setDisputes(prev => ({ ...prev, [disputeFor]: 'PENDING' }))
      setDisputeFor(null)
    } catch (err) {
      setDisputeError(err.response?.data?.message || 'Failed to submit dispute.')
    } finally {
      setDisputeLoading(false)
    }
  }

  const stats = [
    { label: 'Total bookings', value: bookings.length, color: '#2563eb' },
    { label: 'Confirmed',      value: bookings.filter(b => b.status === 'CONFIRMED').length, color: '#16a34a' },
    { label: 'Pending',        value: bookings.filter(b => b.status === 'PENDING').length,   color: '#d97706' },
    { label: 'Completed',      value: bookings.filter(b => b.status === 'COMPLETED').length, color: '#6b7280' },
  ]

  return (
    <div className="min-h-screen" style={{ background: '#f8fafc' }}>
      <Navbar />

      <div className="bg-white border-b border-gray-200" style={DOT_GRID}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6" style={{ borderLeft: '3px solid #2563eb' }}>
          <h1 className="text-xl font-bold text-gray-900">My Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">{user?.name} &bull; {user?.email}</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-7">
          {stats.map(s => (
            <div
              key={s.label}
              className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm"
              style={{ borderTop: `3px solid ${s.color}` }}
            >
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {disputeFor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 px-4">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 w-full max-w-md shadow-xl">
              <h3 className="font-semibold text-gray-900 mb-1">Raise a dispute</h3>
              <p className="text-xs text-gray-500 mb-4">Describe the issue. An admin will review it.</p>
              {disputeError && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm mb-3">
                  {disputeError}
                </div>
              )}
              <form onSubmit={handleDisputeSubmit} className="space-y-3">
                <textarea
                  value={disputeMsg}
                  onChange={e => setDisputeMsg(e.target.value)}
                  rows={4}
                  placeholder="Describe the issue..."
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  required
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setDisputeFor(null)}
                    className="flex-1 border border-gray-300 text-gray-700 text-sm font-medium py-2 rounded-lg hover:border-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={disputeLoading}
                    className="flex-1 text-white text-sm font-medium py-2 rounded-lg transition-colors shadow-sm disabled:opacity-60"
                    style={{ background: '#2563eb' }}
                  >
                    {disputeLoading ? 'Submitting...' : 'Submit dispute'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">My Bookings</h2>
            <Link to="/search" className="text-xs font-medium hover:underline" style={{ color: '#2563eb' }}>
              Find parking
            </Link>
          </div>

          {loading && (
            <div className="flex justify-center py-14">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}

          {error && <p className="px-6 py-4 text-sm text-red-600">{error}</p>}

          {!loading && bookings.length === 0 && !error && (
            <div className="text-center py-16">
              <p className="text-gray-400 text-sm mb-4">No bookings yet.</p>
              <Link
                to="/search"
                className="text-sm text-white px-4 py-2 rounded-lg font-medium shadow-sm"
                style={{ background: '#2563eb' }}
              >
                Find parking
              </Link>
            </div>
          )}

          {!loading && bookings.length > 0 && (
            <div className="divide-y divide-gray-100">
              {bookings.map(b => {
                const s = STATUS[b.status] || STATUS.PENDING
                const disputeStatus = disputes[b.id]
                const duration = calcDuration(b.startTime, b.endTime)
                const canCancel = b.status === 'PENDING' || b.status === 'CONFIRMED'
                return (
                  <div key={b.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-gray-900 text-sm truncate">
                            {b.parking?.title || `Booking #${b.id.slice(0, 8)}`}
                          </p>
                          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border flex-shrink-0 ${s.bg} ${s.text} ${s.border}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`}></span>
                            {s.label}
                          </span>
                        </div>
                        {b.parking?.address && (
                          <p className="text-xs text-gray-400 mb-2 truncate">
                            {b.parking.address}{b.parking.city ? `, ${b.parking.city}` : ''}
                          </p>
                        )}
                        <p className="text-xs text-gray-600 mb-1">
                          {fmtRange(b.startTime, b.endTime)}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-gray-400">
                          {duration && <span>{duration} hrs</span>}
                          {b.totalAmount != null && (
                            <span className="font-semibold text-gray-900">
                              Rs. {parseFloat(b.totalAmount).toFixed(0)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        {canCancel && (
                          <button
                            onClick={() => handleCancel(b.id)}
                            disabled={cancelling === b.id}
                            className="text-xs text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:border-red-300 hover:text-red-600 transition-colors disabled:opacity-50"
                          >
                            {cancelling === b.id ? 'Cancelling...' : 'Cancel'}
                          </button>
                        )}
                        {b.status === 'COMPLETED' && (
                          disputeStatus ? (
                            <span className={`text-xs font-medium ${disputeStatus === 'RESOLVED' ? 'text-green-600' : 'text-yellow-600'}`}>
                              Dispute: {disputeStatus}
                            </span>
                          ) : (
                            <button
                              onClick={() => { setDisputeFor(b.id); setDisputeMsg(''); setDisputeError('') }}
                              className="text-xs text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:border-gray-300 transition-colors"
                            >
                              Dispute
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default UserDashboard
