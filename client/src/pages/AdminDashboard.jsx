import { useState, useEffect } from 'react'
import API from '../utils/api'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'

const DOT_GRID = {
  backgroundImage: 'radial-gradient(#2563eb15 1px, transparent 1px)',
  backgroundSize: '20px 20px',
}

const STATUS = {
  PENDING:   { dot: 'bg-yellow-400', text: 'text-yellow-700', bg: 'bg-yellow-50',  border: 'border-yellow-200', label: 'Pending'   },
  CONFIRMED: { dot: 'bg-green-500',  text: 'text-green-700',  bg: 'bg-green-50',   border: 'border-green-200',  label: 'Confirmed' },
  CANCELLED: { dot: 'bg-red-400',    text: 'text-red-600',    bg: 'bg-red-50',     border: 'border-red-200',    label: 'Cancelled' },
  COMPLETED: { dot: 'bg-gray-400',   text: 'text-gray-500',   bg: 'bg-gray-50',    border: 'border-gray-200',   label: 'Completed' },
  APPROVED:  { dot: 'bg-green-500',  text: 'text-green-700',  bg: 'bg-green-50',   border: 'border-green-200',  label: 'Approved'  },
  REJECTED:  { dot: 'bg-red-400',    text: 'text-red-600',    bg: 'bg-red-50',     border: 'border-red-200',    label: 'Rejected'  },
  RESOLVED:  { dot: 'bg-green-500',  text: 'text-green-700',  bg: 'bg-green-50',   border: 'border-green-200',  label: 'Resolved'  },
}

const fmt = (iso) => iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'

const TABS = [
  { key: 'pending',  label: 'Pending Review' },
  { key: 'users',    label: 'Users'          },
  { key: 'bookings', label: 'Bookings'       },
  { key: 'disputes', label: 'Disputes'       },
  { key: 'reports',  label: 'Reports'        },
]

const TH = ({ children }) => (
  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap" style={{ background: '#f8fafc' }}>{children}</th>
)

const AdminDashboard = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [pendingListings, setPendingListings] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [allBookings, setAllBookings] = useState([])
  const [disputes, setDisputes] = useState([])
  const [reports, setReports] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('pending')
  const [actionLoading, setActionLoading] = useState(null)

  useEffect(() => {
    Promise.all([
      API.get('/admin/dashboard').then(({ data }) => setStats(data)).catch(() => {}),
      API.get('/admin/parkings/pending').then(({ data }) => setPendingListings(Array.isArray(data) ? data : [])).catch(() => {}),
      API.get('/admin/users').then(({ data }) => setAllUsers(Array.isArray(data) ? data : [])).catch(() => {}),
      API.get('/admin/bookings').then(({ data }) => setAllBookings(Array.isArray(data) ? data : [])).catch(() => {}),
      API.get('/disputes').then(({ data }) => setDisputes(Array.isArray(data) ? data : [])).catch(() => {}),
      API.get('/admin/reports').then(({ data }) => setReports(data)).catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [])

  const handleApprove = async (id) => {
    setActionLoading(`approve-${id}`)
    try {
      await API.put(`/admin/parkings/${id}/approve`)
      setPendingListings(pendingListings.filter(l => l.id !== id))
    } catch { alert('Failed.') } finally { setActionLoading(null) }
  }

  const handleReject = async (id) => {
    setActionLoading(`reject-${id}`)
    try {
      await API.put(`/admin/parkings/${id}/reject`)
      setPendingListings(pendingListings.filter(l => l.id !== id))
    } catch { alert('Failed.') } finally { setActionLoading(null) }
  }

  const handleResolveDispute = async (id) => {
    setActionLoading(`resolve-${id}`)
    try {
      await API.put(`/disputes/${id}/resolve`)
      setDisputes(disputes.map(d => d.id === id ? { ...d, status: 'RESOLVED' } : d))
    } catch { alert('Failed.') } finally { setActionLoading(null) }
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
      <div className="bg-white border-b border-gray-200" style={DOT_GRID}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">{user?.name} &bull; {user?.email}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-7">
          {[
            { label: 'Users',          value: stats?.totalUsers ?? allUsers.filter(u => u.role === 'USER').length, color: '#2563eb' },
            { label: 'Owners',         value: stats?.totalOwners ?? allUsers.filter(u => u.role === 'OWNER').length, color: '#7c3aed' },
            { label: 'Listings',       value: stats?.totalListings ?? '-', color: '#16a34a' },
            { label: 'Bookings',       value: stats?.totalBookings ?? allBookings.length, color: '#d97706' },
            { label: 'Pending review', value: pendingListings.length, color: pendingListings.length > 0 ? '#dc2626' : '#6b7280', warn: true },
          ].map(s => (
            <div key={s.label} className={`rounded-xl p-4 shadow-sm border ${s.warn && pendingListings.length > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}
              style={{ borderTop: `3px solid ${s.color}` }}>
              <p className="text-2xl font-bold" style={{ color: s.warn && pendingListings.length > 0 ? '#dc2626' : '#0f172a' }}>{s.value}</p>
              <p className="text-xs mt-0.5" style={{ color: s.warn && pendingListings.length > 0 ? '#b91c1c' : '#94a3b8' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <div className="flex -mb-px overflow-x-auto">
            {TABS.map(t => {
              const badge = t.key === 'pending' ? pendingListings.length
                : t.key === 'disputes' ? disputes.filter(d => d.status === 'PENDING').length : 0
              return (
                <button key={t.key} onClick={() => setActiveTab(t.key)}
                  className="px-5 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap"
                  style={{
                    borderBottomColor: activeTab === t.key ? '#2563eb' : 'transparent',
                    color: activeTab === t.key ? '#2563eb' : '#6b7280',
                  }}>
                  {t.label}
                  {badge > 0 && (
                    <span className="text-xs text-white px-1.5 py-0.5 rounded-full leading-none font-medium" style={{ background: '#f59e0b' }}>{badge}</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Pending listings */}
        {activeTab === 'pending' && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">Pending Listings</h2>
              <p className="text-xs text-gray-400 mt-0.5">Review and approve owner submissions before they go live.</p>
            </div>
            {pendingListings.length === 0 ? (
              <div className="text-center py-14 text-gray-400 text-sm">No listings pending review.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-gray-100"><TH>Title</TH><TH>Owner</TH><TH>City</TH><TH>Price</TH><TH>Vehicles</TH><TH></TH></tr></thead>
                  <tbody className="divide-y divide-gray-50">
                    {pendingListings.map(l => (
                      <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900">{l.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5 max-w-xs truncate">{l.address}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-gray-700">{l.owner?.name}</p>
                          <p className="text-xs text-gray-400">{l.owner?.email}</p>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{l.city}</td>
                        <td className="px-6 py-4 font-semibold whitespace-nowrap" style={{ color: '#2563eb' }}>Rs. {l.hourlyPrice}/hr</td>
                        <td className="px-6 py-4 text-xs text-gray-500">
                          {(l.supportedVehicleTypes || []).map(t => t === 'TWO_WHEELER' ? '2W' : '4W').join(', ')}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button onClick={() => handleReject(l.id)} disabled={!!actionLoading}
                              className="text-xs text-gray-500 border border-gray-200 px-2.5 py-1.5 rounded-lg hover:border-red-300 hover:text-red-600 transition-colors disabled:opacity-50">
                              {actionLoading === `reject-${l.id}` ? '...' : 'Reject'}
                            </button>
                            <button onClick={() => handleApprove(l.id)} disabled={!!actionLoading}
                              className="text-xs text-white px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50 shadow-sm"
                              style={{ background: '#2563eb' }}>
                              {actionLoading === `approve-${l.id}` ? '...' : 'Approve'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Users */}
        {activeTab === 'users' && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">All Users</h2>
              <p className="text-xs text-gray-400 mt-0.5">{allUsers.length} registered accounts</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-gray-100"><TH>Name</TH><TH>Email</TH><TH>Phone</TH><TH>Role</TH><TH>Joined</TH></tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {allUsers.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{u.name}</td>
                      <td className="px-6 py-4 text-gray-600">{u.email}</td>
                      <td className="px-6 py-4 text-gray-400">{u.phone || '-'}</td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full border"
                          style={u.role === 'ADMIN'
                            ? { background: '#eff6ff', color: '#1d4ed8', borderColor: '#bfdbfe' }
                            : u.role === 'OWNER'
                              ? { background: '#f5f3ff', color: '#7c3aed', borderColor: '#ddd6fe' }
                              : { background: '#f1f5f9', color: '#475569', borderColor: '#e2e8f0' }
                          }>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-xs">{fmt(u.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Bookings */}
        {activeTab === 'bookings' && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">All Bookings</h2>
              <p className="text-xs text-gray-400 mt-0.5">{allBookings.length} total</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-gray-100"><TH>Parking</TH><TH>Driver</TH><TH>Date</TH><TH>Amount</TH><TH>Status</TH></tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {allBookings.map(b => {
                    const s = STATUS[b.status] || STATUS.PENDING
                    return (
                      <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900">{b.parking?.title || '-'}</p>
                          <p className="text-xs text-gray-400">{b.parking?.city}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-gray-700">{b.user?.name || '-'}</p>
                          <p className="text-xs text-gray-400">{b.user?.email}</p>
                        </td>
                        <td className="px-6 py-4 text-gray-500 text-xs">{fmt(b.startTime)}</td>
                        <td className="px-6 py-4 font-semibold text-gray-900">
                          {b.totalAmount ? `Rs. ${parseFloat(b.totalAmount).toFixed(0)}` : '-'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${s.bg} ${s.text} ${s.border}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`}></span>
                            {s.label}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Disputes */}
        {activeTab === 'disputes' && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">Disputes</h2>
              <p className="text-xs text-gray-400 mt-0.5">{disputes.length} total &bull; {disputes.filter(d => d.status === 'PENDING').length} open</p>
            </div>
            {disputes.length === 0 ? (
              <div className="text-center py-14 text-gray-400 text-sm">No disputes filed.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-gray-100"><TH>User</TH><TH>Parking</TH><TH>Message</TH><TH>Filed</TH><TH>Status</TH><TH></TH></tr></thead>
                  <tbody className="divide-y divide-gray-50">
                    {disputes.map(d => {
                      const s = STATUS[d.status] || STATUS.PENDING
                      return (
                        <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-medium text-gray-900">{d.user?.name || '-'}</p>
                            <p className="text-xs text-gray-400">{d.user?.email}</p>
                          </td>
                          <td className="px-6 py-4 text-gray-600 text-xs">{d.booking?.parking?.title || '-'}</td>
                          <td className="px-6 py-4 max-w-xs">
                            <p className="text-gray-600 text-xs line-clamp-2">{d.message}</p>
                          </td>
                          <td className="px-6 py-4 text-gray-400 text-xs">{fmt(d.createdAt)}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${s.bg} ${s.text} ${s.border}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`}></span>
                              {s.label}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {d.status === 'PENDING' && (
                              <button onClick={() => handleResolveDispute(d.id)} disabled={!!actionLoading}
                                className="text-xs text-white px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50 shadow-sm"
                                style={{ background: '#2563eb' }}>
                                {actionLoading === `resolve-${d.id}` ? '...' : 'Resolve'}
                              </button>
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

        {/* Reports */}
        {activeTab === 'reports' && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Total revenue', value: reports ? `Rs. ${reports.totalRevenue.toFixed(0)}` : 'Rs. 0', color: '#2563eb' },
                { label: 'This month', value: reports ? `Rs. ${reports.thisMonthRevenue.toFixed(0)}` : 'Rs. 0', color: '#7c3aed' },
                { label: 'Completed', value: reports?.bookingsByStatus?.COMPLETED ?? 0, color: '#16a34a' },
                { label: 'Cancelled', value: reports?.bookingsByStatus?.CANCELLED ?? 0, color: '#dc2626' },
              ].map(s => (
                <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm"
                  style={{ borderTop: `3px solid ${s.color}` }}>
                  <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {reports?.bookingsByStatus && (
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Bookings by status</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {Object.entries(reports.bookingsByStatus).map(([status, count]) => {
                    const s = STATUS[status] || STATUS.PENDING
                    return (
                      <div key={status} className={`border rounded-xl p-4 text-center ${s.bg} ${s.border}`}>
                        <p className={`text-2xl font-bold mb-1 ${s.text}`}>{count}</p>
                        <span className={`text-xs font-medium ${s.text}`}>{s.label}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-5">
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900">Top cities</h3>
                </div>
                {!reports?.topCities?.length ? (
                  <div className="text-center py-10 text-gray-400 text-sm">No data yet.</div>
                ) : (
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-gray-100"><TH>City</TH><TH>Bookings</TH></tr></thead>
                    <tbody className="divide-y divide-gray-50">
                      {reports.topCities.map((c, i) => (
                        <tr key={c.city} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-3 text-gray-700">
                            <span className="text-gray-300 mr-2 text-xs font-medium">{i + 1}</span>{c.city}
                          </td>
                          <td className="px-6 py-3 font-semibold text-gray-900">{c.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900">Top listings</h3>
                </div>
                {!reports?.topListings?.length ? (
                  <div className="text-center py-10 text-gray-400 text-sm">No data yet.</div>
                ) : (
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-gray-100"><TH>Listing</TH><TH>Bookings</TH></tr></thead>
                    <tbody className="divide-y divide-gray-50">
                      {reports.topListings.map((l, i) => (
                        <tr key={l.title} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-3 text-gray-700">
                            <span className="text-gray-300 mr-2 text-xs font-medium">{i + 1}</span>{l.title}
                          </td>
                          <td className="px-6 py-3 font-semibold text-gray-900">{l.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminDashboard
