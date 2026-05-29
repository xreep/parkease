import { useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import API from '../utils/api'
import Navbar from '../components/Navbar'

const DOT_GRID = {
  backgroundImage: 'radial-gradient(#2563eb15 1px, transparent 1px)',
  backgroundSize: '20px 20px',
}

const VEHICLE_OPTIONS = [
  { value: 'FOUR_WHEELER', label: 'Four Wheeler (Car / SUV)' },
  { value: 'TWO_WHEELER', label: 'Two Wheeler (Bike / Scooter)' },
]

const SLOT_SIZES = [
  { value: 'SMALL', label: 'Small', desc: 'Motorcycles and scooters' },
  { value: 'MEDIUM', label: 'Medium', desc: 'Hatchbacks and sedans' },
  { value: 'LARGE', label: 'Large', desc: 'SUVs and MUVs' },
  { value: 'EXTRA_LARGE', label: 'Extra Large', desc: 'Trucks and buses' },
]

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const defaultSchedule = () =>
  Array.from({ length: 7 }, (_, i) => ({
    dayOfWeek: i,
    openingTime: '06:00',
    closingTime: '22:00',
    isAvailable: true,
  }))

const inp = 'w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm'

const Field = ({ label, required, hint, children }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1.5">
      {label}{required && <span className="text-gray-400 ml-0.5 font-normal"> *</span>}
    </label>
    {children}
    {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
  </div>
)

const Card = ({ title, children }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
    <h2 className="text-sm font-semibold text-gray-800 pb-3 border-b border-gray-100">{title}</h2>
    {children}
  </div>
)

const AddParking = () => {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const [form, setForm] = useState({
    title: '', description: '', address: '', city: '',
    latitude: '', longitude: '', totalSlots: '',
    vehicleTypes: ['FOUR_WHEELER'],
    hourlyPrice: '', dailyPrice: '', monthlyPrice: '',
    autoApproveBookings: true,
    slotSize: 'MEDIUM',
    availabilitySchedule: defaultSchedule(),
  })
  const [photoFiles, setPhotoFiles] = useState([])
  const [photoPreviews, setPhotoPreviews] = useState([])
  const [photoNotice, setPhotoNotice] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value })
  }

  const toggleVehicle = (val) => {
    setForm((prev) => ({
      ...prev,
      vehicleTypes: prev.vehicleTypes.includes(val)
        ? prev.vehicleTypes.filter((v) => v !== val)
        : [...prev.vehicleTypes, val],
    }))
  }

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files || []).slice(0, 6)
    setPhotoFiles(files)
    const previews = files.map(f => URL.createObjectURL(f))
    setPhotoPreviews(previews)
    setPhotoNotice('')
  }

  const removePhoto = (idx) => {
    const newFiles = photoFiles.filter((_, i) => i !== idx)
    const newPreviews = photoPreviews.filter((_, i) => i !== idx)
    URL.revokeObjectURL(photoPreviews[idx])
    setPhotoFiles(newFiles)
    setPhotoPreviews(newPreviews)
  }

  const updateScheduleDay = (dayOfWeek, field, value) => {
    setForm(prev => ({
      ...prev,
      availabilitySchedule: prev.availabilitySchedule.map(d =>
        d.dayOfWeek === dayOfWeek ? { ...d, [field]: value } : d
      ),
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.vehicleTypes.length) { setError('Select at least one vehicle type.'); return }
    if (!form.hourlyPrice) { setError('Hourly price is required.'); return }
    setLoading(true)
    try {
      let photoUrls = []
      if (photoFiles.length > 0) {
        try {
          const fd = new FormData()
          photoFiles.forEach(f => fd.append('photos', f))
          const { data: uploadData } = await API.post('/parkings/upload-photos', fd, {
            headers: { 'Content-Type': 'multipart/form-data' },
          })
          if (Array.isArray(uploadData.urls)) photoUrls = uploadData.urls
          if (uploadData.message && uploadData.urls?.length === 0) {
            setPhotoNotice(uploadData.message)
          }
        } catch {
          setPhotoNotice('Photo upload failed — listing will be saved without photos.')
        }
      }

      await API.post('/parkings', {
        title: form.title,
        description: form.description,
        address: form.address,
        city: form.city,
        latitude: parseFloat(form.latitude) || 0,
        longitude: parseFloat(form.longitude) || 0,
        totalSlots: parseInt(form.totalSlots) || 1,
        vehicleTypes: form.vehicleTypes,
        supportedVehicleTypes: form.vehicleTypes,
        hourlyPrice: parseFloat(form.hourlyPrice),
        dailyPrice: form.dailyPrice ? parseFloat(form.dailyPrice) : null,
        monthlyPrice: form.monthlyPrice ? parseFloat(form.monthlyPrice) : null,
        autoApproveBookings: form.autoApproveBookings,
        slotSize: form.slotSize,
        availabilitySchedule: form.availabilitySchedule,
        photos: photoUrls,
      })
      setSuccess(true)
      setTimeout(() => navigate('/owner/dashboard'), 2000)
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.message || 'Failed to submit. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) return (
    <div className="min-h-screen" style={{ background: '#f8fafc' }}>
      <Navbar />
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="bg-white border border-gray-200 rounded-2xl p-10 shadow-sm">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Listing submitted</h2>
          <p className="text-gray-500 text-sm mb-7 leading-relaxed">
            Your parking space has been submitted. An admin will review and approve it shortly.
          </p>
          <div className="flex justify-center gap-3">
            <Link to="/owner/dashboard" className="text-white font-semibold px-5 py-2 rounded-lg text-sm shadow-sm" style={{ background: '#2563eb' }}>
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen" style={{ background: '#f8fafc' }}>
      <Navbar />

      <div className="bg-white border-b border-gray-200" style={DOT_GRID}>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link to="/owner/dashboard" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
            &larr; Back to dashboard
          </Link>
          <h1 className="text-xl font-bold text-gray-900 mt-2">List your parking space</h1>
          <p className="text-sm text-gray-500 mt-1">Fill in the details below. Your listing goes live after admin review.</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-5 text-sm">
            {error}
          </div>
        )}
        {photoNotice && (
          <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-lg px-4 py-3 mb-5 text-sm">
            {photoNotice}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <Card title="Basic information">
            <Field label="Listing title" required>
              <input type="text" name="title" required value={form.title} onChange={handleChange}
                placeholder="e.g. Covered parking near Connaught Place" className={inp} />
            </Field>
            <Field label="Description">
              <textarea name="description" value={form.description} onChange={handleChange} rows={3}
                placeholder="Security features, amenities, access instructions..."
                className={inp + ' resize-none'} />
            </Field>
          </Card>

          {/* Photos */}
          <Card title="Photos">
            <p className="text-xs text-gray-400 -mt-2">Upload up to 6 photos. Supports JPG, PNG, WebP.</p>
            {photoPreviews.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-1">
                {photoPreviews.map((src, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 group">
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                {photoPreviews.length < 6 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                )}
              </div>
            )}
            {photoPreviews.length === 0 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-gray-300 rounded-xl py-8 flex flex-col items-center gap-2 text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors"
              >
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4-4a3 3 0 014.24 0L16 16m-2-2l1.59-1.59a3 3 0 014.24 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm">Click to add photos</span>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handlePhotoChange}
            />
          </Card>

          <Card title="Location">
            <Field label="Street address" required>
              <input type="text" name="address" required value={form.address} onChange={handleChange}
                placeholder="e.g. 14, Linking Road, Bandra West" className={inp} />
            </Field>
            <Field label="City" required>
              <input type="text" name="city" required value={form.city} onChange={handleChange}
                placeholder="e.g. Mumbai" className={inp} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Latitude" hint="Optional — for map pin">
                <input type="number" name="latitude" step="any" value={form.latitude} onChange={handleChange}
                  placeholder="e.g. 19.0596" className={inp} />
              </Field>
              <Field label="Longitude" hint="Optional — for map pin">
                <input type="number" name="longitude" step="any" value={form.longitude} onChange={handleChange}
                  placeholder="e.g. 72.8295" className={inp} />
              </Field>
            </div>
          </Card>

          <Card title="Capacity and vehicles">
            <Field label="Total parking slots" required>
              <input type="number" name="totalSlots" required min="1" value={form.totalSlots} onChange={handleChange}
                placeholder="e.g. 5" className={inp} />
            </Field>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle types accepted</label>
              <div className="space-y-2">
                {VEHICLE_OPTIONS.map((opt) => (
                  <label key={opt.value}
                    className="flex items-center gap-3 border-2 rounded-xl px-4 py-3 cursor-pointer transition-all"
                    style={{
                      borderColor: form.vehicleTypes.includes(opt.value) ? '#2563eb' : '#e5e7eb',
                      background: form.vehicleTypes.includes(opt.value) ? '#eff6ff' : '#fff',
                    }}>
                    <input
                      type="checkbox"
                      checked={form.vehicleTypes.includes(opt.value)}
                      onChange={() => toggleVehicle(opt.value)}
                      className="w-4 h-4 accent-blue-600"
                    />
                    <span className="text-sm font-medium"
                      style={{ color: form.vehicleTypes.includes(opt.value) ? '#1d4ed8' : '#374151' }}>
                      {opt.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Slot size</label>
              <div className="grid grid-cols-2 gap-2">
                {SLOT_SIZES.map((s) => (
                  <label key={s.value}
                    className="flex items-start gap-2.5 border-2 rounded-xl px-3 py-2.5 cursor-pointer transition-all"
                    style={{
                      borderColor: form.slotSize === s.value ? '#2563eb' : '#e5e7eb',
                      background: form.slotSize === s.value ? '#eff6ff' : '#fff',
                    }}>
                    <input
                      type="radio"
                      name="slotSize"
                      value={s.value}
                      checked={form.slotSize === s.value}
                      onChange={handleChange}
                      className="mt-0.5 accent-blue-600"
                    />
                    <div>
                      <p className="text-sm font-medium" style={{ color: form.slotSize === s.value ? '#1d4ed8' : '#374151' }}>{s.label}</p>
                      <p className="text-xs text-gray-400">{s.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </Card>

          <Card title="Pricing (in Rs.)">
            <div className="grid sm:grid-cols-3 gap-3">
              <Field label="Hourly rate" required>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-400 text-sm">Rs.</span>
                  <input type="number" name="hourlyPrice" required min="0" step="0.01" value={form.hourlyPrice} onChange={handleChange}
                    placeholder="50" className={inp + ' pl-10'} />
                </div>
              </Field>
              <Field label="Daily rate">
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-400 text-sm">Rs.</span>
                  <input type="number" name="dailyPrice" min="0" step="0.01" value={form.dailyPrice} onChange={handleChange}
                    placeholder="400" className={inp + ' pl-10'} />
                </div>
              </Field>
              <Field label="Monthly rate">
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-400 text-sm">Rs.</span>
                  <input type="number" name="monthlyPrice" min="0" step="0.01" value={form.monthlyPrice} onChange={handleChange}
                    placeholder="5000" className={inp + ' pl-10'} />
                </div>
              </Field>
            </div>
          </Card>

          {/* Availability schedule */}
          <Card title="Availability schedule">
            <p className="text-xs text-gray-400 -mt-2">Set hours for each day of the week. Bookings outside these hours will be blocked.</p>
            <div className="space-y-2">
              {form.availabilitySchedule.map((day) => (
                <div key={day.dayOfWeek} className="flex items-center gap-3">
                  <div className="w-8 text-center">
                    <span className="text-xs font-semibold text-gray-500">{DAY_SHORT[day.dayOfWeek]}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateScheduleDay(day.dayOfWeek, 'isAvailable', !day.isAvailable)}
                    className="relative flex-shrink-0 w-9 h-5 rounded-full transition-colors"
                    style={{ background: day.isAvailable ? '#2563eb' : '#d1d5db' }}
                  >
                    <span
                      className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform"
                      style={{ transform: day.isAvailable ? 'translateX(18px)' : 'translateX(2px)' }}
                    />
                  </button>
                  {day.isAvailable ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="time"
                        value={day.openingTime}
                        onChange={(e) => updateScheduleDay(day.dayOfWeek, 'openingTime', e.target.value)}
                        className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
                      />
                      <span className="text-gray-400 text-xs">to</span>
                      <input
                        type="time"
                        value={day.closingTime}
                        onChange={(e) => updateScheduleDay(day.dayOfWeek, 'closingTime', e.target.value)}
                        className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
                      />
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400 flex-1">Closed</span>
                  )}
                </div>
              ))}
            </div>
          </Card>

          <Card title="Settings">
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                className="w-10 h-5 rounded-full relative transition-colors flex-shrink-0"
                style={{ background: form.autoApproveBookings ? '#2563eb' : '#d1d5db' }}
                onClick={() => setForm({ ...form, autoApproveBookings: !form.autoApproveBookings })}
              >
                <div className="w-4 h-4 bg-white rounded-full absolute top-0.5 shadow transition-transform"
                  style={{ transform: form.autoApproveBookings ? 'translateX(20px)' : 'translateX(2px)' }}></div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">Auto-approve bookings</p>
                <p className="text-xs text-gray-400 mt-0.5">Bookings are confirmed instantly without manual review</p>
              </div>
            </label>
          </Card>

          <button type="submit" disabled={loading}
            className="w-full text-white font-semibold py-3 rounded-xl transition-colors text-sm shadow-sm disabled:opacity-60"
            style={{ background: loading ? '#6b7280' : '#2563eb' }}>
            {loading ? 'Submitting...' : 'Submit listing for approval'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default AddParking
