import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import API from '../utils/api'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'

const STATUS = {
  PENDING:   { dot: 'bg-yellow-400', text: 'text-yellow-700', bg: 'bg-yellow-50',  border: 'border-yellow-200', label: 'Pending'   },
  CONFIRMED: { dot: 'bg-green-500',  text: 'text-green-700',  bg: 'bg-green-50',   border: 'border-green-200',  label: 'Confirmed' },
  CANCELLED: { dot: 'bg-red-400',    text: 'text-red-600',    bg: 'bg-red-50',     border: 'border-red-200',    label: 'Cancelled' },
  COMPLETED: { dot: 'bg-gray-400',   text: 'text-gray-500',   bg: 'bg-gray-50',    border: 'border-gray-200',   label: 'Completed' },
  APPROVED:  { dot: 'bg-green-500',  text: 'text-green-700',  bg: 'bg-green-50',   border: 'border-green-200',  label: 'Approved'  },
  REJECTED:  { dot: 'bg-red-400',    text: 'text-red-600',    bg: 'bg-red-50',     border: 'border-red-200',    label: 'Rejected'  },
}

const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const defaultSchedule = () =>
  Array.from({ length: 7 }, (_, i) => ({
    dayOfWeek: i,
    openingTime: '06:00',
    closingTime: '22:00',
    isAvailable: true,
  }))

const fmt = (iso) => iso ? new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true }) : '-'
const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'
const fmtTime = (iso) => iso ? new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '-'

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'listings', label: 'Listings' },
  { key: 'bookings', label: 'Bookings' },
  { key: 'earnings', label: 'Earnings' },
  { key: 'block',    label: 'Block Dates' },
]

const inp = 'w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white input-modern'
const inpSm = 'border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white flex-1'

const TH = ({ children }) => (
  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap" style={{ background: '#f8fafc' }}>{children}</th>
)

const OwnerDashboard = () => {
  const { user } = useAuth()
  const [listings, setListings] = useState([])
  const [bookings, setBookings] = useState([])
  const [blockedSlots, setBlockedSlots] = useState([])
  const [earnings, setEarnings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [actionLoading, setActionLoading] = useState(null)
  const [blockForm, setBlockForm] = useState({ parkingListingId: '', blockedDate: '', startTime: '', endTime: '', reason: '' })
  const [blockLoading, setBlockLoading] = useState(false)
  const [blockError, setBlockError] = useState('')
  const [blockSuccess, setBlockSuccess] = useState('')

  const [editScheduleId, setEditScheduleId] = useState(null)
  const [scheduleForm, setScheduleForm] = useState([])
  const [scheduleSaving, setScheduleSaving] = useState(false)
  const [scheduleError, setScheduleError] = useState('')
  const [scheduleSuccess, setScheduleSuccess] = useState('')

  useEffect(() => {
    Promise.all([
      API.get('/parkings/owner/listings').then(({ data }) => setListings(Array.isArray(data) ? data : [])).catch(() => {}),
      API.get('/bookings/owner-bookings').then(({ data }) => setBookings(Array.isArray(data) ? data : [])).catch(() => {}),
      API.get('/owner/blocked-slots').then(({ data }) => setBlockedSlots(Array.isArray(data) ? data : [])).catch(() => {}),
      API.get('/owner/earnings').then(({ data }) => setEarnings(data)).catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [])

  const handleApprove = async (id) => {
    setActionLoading(`approve-${id}`)
    try {
      await API.put(`/bookings/${id}/approve`)
      setBookings(bookings.map(b => b.id === id ? { ...b, status: 'CONFIRMED' } : b))
    } catch { alert('Failed.') } finally { setActionLoading(null) }
  }

  const handleReject = async (id) => {
    setActionLoading(`reject-${id}`)
    try {
      await API.put(`/bookings/${id}/cancel`)
      setBookings(bookings.map(b => b.id === id ? { ...b, status: 'CANCELLED' } : b))
    } catch { alert('Failed.') } finally { setActionLoading(null) }
  }

  const handleBlockSubmit = async (e) => {
    e.preventDefault(); setBlockError(''); setBlockSuccess('')
    if (!blockForm.parkingListingId) { setBlockError('Select a listing.'); return }
    const startDT = new Date(`${blockForm.blockedDate}T${blockForm.startTime}`)
    const endDT = new Date(`${blockForm.blockedDate}T${blockForm.endTime}`)
    if (endDT <= startDT) { setBlockError('End time must be after start time.'); return }
    setBlockLoading(true)
    try {
      const { data } = await API.post('/owner/block-slot', {
        parkingListingId: blockForm.parkingListingId,
        blockedDate: new Date(`${blockForm.blockedDate}T00:00:00`).toISOString(),
        startTime: startDT.toISOString(),
        endTime: endDT.toISOString(),
        reason: blockForm.reason,
      })
      const parking = listings.find(l => l.id === blockForm.parkingListingId)
      setBlockedSlots(prev => [...prev, { ...data, parking: { title: parking?.title || '' } }])
      setBlockSuccess('Slot blocked successfully.')
      setBlockForm(f => ({ ...f, blockedDate: '', startTime: '', endTime: '', reason: '' }))
    } catch (err) {
      setBlockError(err.response?.data?.message || 'Failed to block slot.')
    } finally { setBlockLoading(false) }
  }

  const handleDeleteSlot = async (id) => {
    if (!window.confirm('Remove this blocked slot?')) return
    try {
      await API.delete(`/owner/blocked-slots/${id}`)
      setBlockedSlots(prev => prev.filter(s => s.id !== id))
    } catch { alert('Failed.') }
  }

  const openScheduleEdit = (listing) => {
    if (editScheduleId === listing.id) {
      setEditScheduleId(null)
      return
    }
    const existing = Array.isArray(listing.availabilitySchedule) && listing.availabilitySchedule.length === 7
      ? listing.availabilitySchedule
      : defaultSchedule()
    setScheduleForm(existing.map(d => ({ ...d })))
    setEditScheduleId(listing.id)
    setScheduleError('')
    setScheduleSuccess('')
  }

  const updateScheduleDay = (dayOfWeek, field, value) => {
    setScheduleForm(prev =>
      prev.map(d => d.dayOfWeek === dayOfWeek ? { ...d, [field]: value } : d)
    )
  }

  const handleScheduleSave = async (listingId) => {
    setScheduleSaving(true)
    setScheduleError('')
    setScheduleSuccess('')
    try {
      await API.put(`/parkings/${listingId}`, { availabilitySchedule: scheduleForm })
      setListings(prev =>
        prev.map(l => l.id === listingId ? { ...l, availabilitySchedule: scheduleForm } : l)
      )
      setScheduleSuccess('Schedule saved.')
      setTimeout(() => {
        setEditScheduleId(null)
        setScheduleSuccess('')
      }, 1500)
    } catch (err) {
      setScheduleError(err.response?.data?.message || 'Failed to save schedule.')
    } finally {
      setScheduleSaving(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen" style={{ background: '#f8fafc' }}>
      <Navbar />
      <div className="flex justify-center py-24">
        <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen" style={{ background: '#f8fafc' }}>
      <Navbar />

      {/* Header */}
      <div
        className="border-b border-gray-100"
        style={{
          background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)',
          backgroundImage: 'radial-gradient(#2563eb12 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-7 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 rounded-full" style={{ background: 'linear-gradient(180deg, #2563eb, #0ea5e9)' }}></div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Owner Dashboard</h1>
              <p className="text-sm text-gray-500 mt-0.5">{user?.name}</p>
            </div>
          </div>
          <Link
            to="/owner/add-parking"
            className="btn-primary text-sm text-white px-4 py-2.5 rounded-xl font-medium"
          >
            Add listing
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <div className="flex -mb-px overflow-x-auto">
            {TABS.map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                className="px-5 py-3 text-sm font-medium border-b-2 transition-all duration-200 whitespace-nowrap relative"
                style={{
                  borderBottomColor: activeTab === t.key ? '#2563eb' : 'transparent',
                  color: activeTab === t.key ? '#2563eb' : '#6b7280',
                }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Overview */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Listings', value: listings.length, sub: `${listings.filter(l => l.approvalStatus === 'APPROVED').length} approved`, color: '#2563eb' },
              { label: 'Total bookings', value: bookings.length, sub: `${bookings.filter(b => b.status === 'CONFIRMED').length} active`, color: '#16a34a' },
              { label: 'Total earnings', value: earnings ? `Rs. ${earnings.totalEarnings.toFixed(0)}` : 'Rs. 0', sub: 'Completed bookings', color: '#7c3aed' },
              { label: 'This month', value: earnings ? `Rs. ${earnings.thisMonthEarnings.toFixed(0)}` : 'Rs. 0', sub: earnings ? `Today: Rs. ${earnings.todayEarnings.toFixed(0)}` : '', color: '#d97706' },
            ].map(s => (
              <div key={s.label} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm card-hover"
                style={{ borderTop: `3px solid ${s.color}` }}>
                <p className="text-3xl font-bold mb-0.5 stat-number">{s.value}</p>
                <p className="text-sm font-medium text-gray-600 mt-0.5">{s.label}</p>
                {s.sub && <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>}
              </div>
            ))}
          </div>
        )}

        {/* Listings */}
        {activeTab === 'listings' && (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">My Listings</h2>
            </div>
            {listings.length === 0 ? (
              <div className="text-center py-14">
                <p className="text-gray-400 text-sm mb-4">No listings yet.</p>
                <Link to="/owner/add-parking" className="btn-primary inline-block text-sm text-white px-4 py-2.5 rounded-xl font-medium">Add listing</Link>
              </div>
            ) : (
              <div>
                {listings.map(l => {
                  const s = STATUS[l.approvalStatus || 'PENDING']
                  const isEditing = editScheduleId === l.id
                  return (
                    <div key={l.id} className="border-b border-gray-100 last:border-b-0">
                      <div className="flex items-center hover:bg-gray-50/80 transition-colors duration-150">
                        <div className="px-6 py-4 flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{l.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5 truncate">{l.address}</p>
                        </div>
                        <div className="px-4 py-4 text-gray-600 text-sm hidden sm:block whitespace-nowrap">{l.city}</div>
                        <div className="px-4 py-4 font-semibold whitespace-nowrap hidden sm:block" style={{ color: '#2563eb', fontSize: '0.875rem' }}>Rs. {l.hourlyPrice}/hr</div>
                        <div className="px-4 py-4 text-gray-600 text-sm hidden md:block">{l.totalSlots} slots</div>
                        <div className="px-4 py-4">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${s?.bg || 'bg-gray-50'} ${s?.text || 'text-gray-500'} ${s?.border || 'border-gray-200'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${s?.dot || 'bg-gray-400'}`}></span>
                            {l.approvalStatus || 'PENDING'}
                          </span>
                        </div>
                        <div className="px-4 py-4 flex items-center gap-3">
                          <button
                            onClick={() => openScheduleEdit(l)}
                            className="text-xs font-medium px-2.5 py-1.5 rounded-xl border transition-all duration-200 whitespace-nowrap"
                            style={isEditing
                              ? { background: '#eff6ff', color: '#2563eb', borderColor: '#bfdbfe' }
                              : { background: '#f8fafc', color: '#6b7280', borderColor: '#e5e7eb' }
                            }
                          >
                            {isEditing ? 'Close' : 'Schedule'}
                          </button>
                          <Link to={`/parking/${l.id}`} className="text-xs hover:underline font-medium transition-colors" style={{ color: '#2563eb' }}>View</Link>
                        </div>
                      </div>

                      {isEditing && (
                        <div className="border-t border-blue-100 bg-blue-50/40 px-6 py-5">
                          <p className="text-sm font-semibold text-gray-800 mb-3">Weekly availability schedule</p>
                          {scheduleError && (
                            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-3 py-2 text-xs mb-3">{scheduleError}</div>
                          )}
                          {scheduleSuccess && (
                            <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-3 py-2 text-xs mb-3">{scheduleSuccess}</div>
                          )}
                          <div className="space-y-2 mb-4">
                            {scheduleForm.map((day) => (
                              <div key={day.dayOfWeek} className="flex items-center gap-3">
                                <div className="w-8 text-center">
                                  <span className="text-xs font-semibold text-gray-500">{DAY_SHORT[day.dayOfWeek]}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => updateScheduleDay(day.dayOfWeek, 'isAvailable', !day.isAvailable)}
                                  className="relative flex-shrink-0 w-9 h-5 rounded-full transition-colors duration-200"
                                  style={{ background: day.isAvailable ? '#2563eb' : '#d1d5db' }}
                                >
                                  <span
                                    className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200"
                                    style={{ transform: day.isAvailable ? 'translateX(18px)' : 'translateX(2px)' }}
                                  />
                                </button>
                                {day.isAvailable ? (
                                  <div className="flex items-center gap-2 flex-1">
                                    <input
                                      type="time"
                                      value={day.openingTime}
                                      onChange={(e) => updateScheduleDay(day.dayOfWeek, 'openingTime', e.target.value)}
                                      className={inpSm}
                                    />
                                    <span className="text-gray-400 text-xs">to</span>
                                    <input
                                      type="time"
                                      value={day.closingTime}
                                      onChange={(e) => updateScheduleDay(day.dayOfWeek, 'closingTime', e.target.value)}
                                      className={inpSm}
                                    />
                                  </div>
                                ) : (
                                  <span className="text-xs text-gray-400 flex-1">Closed</span>
                                )}
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleScheduleSave(l.id)}
                              disabled={scheduleSaving}
                              className="btn-primary text-xs text-white font-medium px-4 py-2 rounded-xl disabled:opacity-60"
                            >
                              {scheduleSaving ? 'Saving...' : 'Save schedule'}
                            </button>
                            <button
                              onClick={() => setEditScheduleId(null)}
                              className="text-xs text-gray-500 font-medium px-4 py-2 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Bookings */}
        {activeTab === 'bookings' && (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">Bookings Received</h2>
            </div>
            {bookings.length === 0 ? (
              <div className="text-center py-14 text-gray-400 text-sm">No bookings yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-gray-100"><TH>Parking</TH><TH>Driver</TH><TH>Check-in</TH><TH>Check-out</TH><TH>Amount</TH><TH>Status</TH><TH></TH></tr></thead>
                  <tbody className="divide-y divide-gray-50">
                    {bookings.map(b => {
                      const s = STATUS[b.status] || STATUS.PENDING
                      return (
                        <tr key={b.id} className="hover:bg-gray-50/80 transition-colors duration-150">
                          <td className="px-6 py-4 font-medium text-gray-900">{b.parking?.title || '-'}</td>
                          <td className="px-6 py-4 text-gray-600">{b.user?.name || '-'}</td>
                          <td className="px-6 py-4 text-xs text-gray-500 whitespace-nowrap">{fmt(b.startTime)}</td>
                          <td className="px-6 py-4 text-xs text-gray-400 whitespace-nowrap">{fmt(b.endTime)}</td>
                          <td className="px-6 py-4 font-semibold text-gray-900 whitespace-nowrap">
                            {b.totalAmount ? `Rs. ${parseFloat(b.totalAmount).toFixed(0)}` : '-'}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${s.bg} ${s.text} ${s.border}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`}></span>
                              {s.label}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {b.status === 'PENDING' && (
                              <div className="flex gap-2">
                                <button onClick={() => handleReject(b.id)} disabled={!!actionLoading}
                                  className="text-xs text-gray-500 border border-gray-200 px-2.5 py-1.5 rounded-xl hover:border-red-300 hover:text-red-600 transition-all duration-200 disabled:opacity-50">
                                  {actionLoading === `reject-${b.id}` ? '...' : 'Reject'}
                                </button>
                                <button onClick={() => handleApprove(b.id)} disabled={!!actionLoading}
                                  className="btn-primary text-xs text-white px-2.5 py-1.5 rounded-xl disabled:opacity-50">
                                  {actionLoading === `approve-${b.id}` ? '...' : 'Approve'}
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Earnings */}
        {activeTab === 'earnings' && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Total earnings', value: earnings ? `Rs. ${earnings.totalEarnings.toFixed(0)}` : 'Rs. 0', color: '#2563eb' },
                { label: 'This month', value: earnings ? `Rs. ${earnings.thisMonthEarnings.toFixed(0)}` : 'Rs. 0', color: '#7c3aed' },
                { label: 'Today', value: earnings ? `Rs. ${earnings.todayEarnings.toFixed(0)}` : 'Rs. 0', color: '#d97706' },
                { label: 'Completed bookings', value: earnings?.bookingCount ?? 0, color: '#16a34a' },
              ].map(s => (
                <div key={s.label} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm card-hover"
                  style={{ borderTop: `3px solid ${s.color}` }}>
                  <p className="text-3xl font-bold mb-0.5 stat-number">{s.value}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400">Earnings are calculated from completed bookings only.</p>
          </div>
        )}

        {/* Block Dates */}
        {activeTab === 'block' && (
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Block a time slot</h2>
              <form onSubmit={handleBlockSubmit} className="space-y-3">
                {blockError && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-3 py-2 text-xs">{blockError}</div>}
                {blockSuccess && <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-3 py-2 text-xs">{blockSuccess}</div>}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Listing</label>
                  <select value={blockForm.parkingListingId} onChange={e => setBlockForm(f => ({ ...f, parkingListingId: e.target.value }))} className={inp} required>
                    <option value="">Select listing</option>
                    {listings.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
                  <input type="date" value={blockForm.blockedDate} onChange={e => setBlockForm(f => ({ ...f, blockedDate: e.target.value }))} className={inp} required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Start time</label>
                    <input type="time" value={blockForm.startTime} onChange={e => setBlockForm(f => ({ ...f, startTime: e.target.value }))} className={inp} required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">End time</label>
                    <input type="time" value={blockForm.endTime} onChange={e => setBlockForm(f => ({ ...f, endTime: e.target.value }))} className={inp} required />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Reason (optional)</label>
                  <input type="text" placeholder="e.g. Maintenance" value={blockForm.reason} onChange={e => setBlockForm(f => ({ ...f, reason: e.target.value }))} className={inp} />
                </div>
                <button type="submit" disabled={blockLoading}
                  className="btn-primary w-full text-white text-sm font-medium py-2.5 rounded-xl disabled:opacity-60">
                  {blockLoading ? 'Blocking...' : 'Block slot'}
                </button>
              </form>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-900">Blocked slots</h2>
              </div>
              {blockedSlots.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm">No blocked slots.</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {blockedSlots.map(slot => (
                    <div key={slot.id} className="px-5 py-4 flex items-start justify-between gap-3 hover:bg-gray-50/80 transition-colors">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{slot.parking?.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{fmtDate(slot.blockedDate)} &bull; {fmtTime(slot.startTime)} &ndash; {fmtTime(slot.endTime)}</p>
                        {slot.reason && <p className="text-xs text-gray-400">{slot.reason}</p>}
                      </div>
                      <button onClick={() => handleDeleteSlot(slot.id)}
                        className="text-xs text-gray-400 hover:text-red-500 border border-gray-200 px-2 py-1.5 rounded-xl hover:border-red-300 transition-all duration-200 flex-shrink-0">
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default OwnerDashboard
