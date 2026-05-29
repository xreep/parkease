import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import API from '../utils/api'
import Navbar from '../components/Navbar'
import MapView from '../components/MapView'
import { getMunicipalRate } from '../utils/parkingPrices'

const haversineMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371000
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const deduplicateByProximity = (items, thresholdM = 100) => {
  const kept = []
  for (const item of items) {
    const tooClose = kept.some(
      (k) => haversineMeters(k.latitude, k.longitude, item.latitude, item.longitude) < thresholdM
    )
    if (!tooClose) kept.push(item)
  }
  return kept
}

const osmElementToParking = (el, cityName) => {
  const lat = el.lat ?? el.center?.lat
  const lon = el.lon ?? el.center?.lon
  if (!lat || !lon) return null
  const tags = el.tags || {}
  const name = tags.name || tags['name:en'] || null
  const street = tags['addr:street'] || tags['addr:full'] || null
  const suburb = tags['addr:suburb'] || tags['addr:city'] || null
  const address = [street, suburb].filter(Boolean).join(', ') || cityName
  const parkingTag = tags.parking || tags.amenity || ''
  let parkingTypeLabel = 'Parking'
  if (parkingTag === 'multi-storey') parkingTypeLabel = 'Multi-storey'
  else if (parkingTag === 'underground') parkingTypeLabel = 'Underground'
  else if (parkingTag === 'surface') parkingTypeLabel = 'Surface'
  else if (parkingTag === 'street_side') parkingTypeLabel = 'Street side'
  else if (parkingTag === 'motorcycle_parking') parkingTypeLabel = 'Motorcycle'
  const vehicleTypes = []
  if (parkingTag !== 'motorcycle_parking') vehicleTypes.push('FOUR_WHEELER')
  vehicleTypes.push('TWO_WHEELER')
  return {
    id: `osm-${el.id}`,
    title: name || parkingTypeLabel + ' Parking',
    address, city: cityName, latitude: lat, longitude: lon, source: 'osm',
    parkingTypeLabel, access: tags.access || null, fee: tags.fee || null,
    capacity: tags.capacity ? parseInt(tags.capacity) : null, operator: tags.operator || null,
    phone: tags.phone || tags['contact:phone'] || tags['contact:mobile'] || null,
    openingHours: tags['opening_hours'] || null,
    covered: tags.covered || null, surface: tags.surface || null,
    maxHeight: tags['maxheight'] || null, maxStay: tags['maxstay'] || null,
    wheelchair: tags.wheelchair || null, website: tags.website || tags['contact:website'] || null,
    supportedVehicleTypes: vehicleTypes, vehicleTypes,
  }
}

const nominatimToParking = (item, cityName) => {
  const lat = parseFloat(item.lat)
  const lon = parseFloat(item.lon)
  if (!lat || !lon) return null
  return {
    id: `nom-${item.place_id}`,
    title: item.display_name?.split(',')[0] || 'Parking',
    address: item.display_name?.split(',').slice(0, 3).join(', ') || cityName,
    city: cityName, latitude: lat, longitude: lon, source: 'osm',
    parkingTypeLabel: 'Parking', access: null, fee: null, capacity: null, operator: null,
    supportedVehicleTypes: ['TWO_WHEELER', 'FOUR_WHEELER'], vehicleTypes: ['TWO_WHEELER', 'FOUR_WHEELER'],
  }
}

const geocodeCity = async (cityName) => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityName + ' India')}&format=json&limit=1`,
      { headers: { 'Accept-Language': 'en' } }
    )
    const data = await res.json()
    if (data?.[0]) return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) }
  } catch {}
  return null
}

const fetchOverpass = async (lat, lon) => {
  const query = `[out:json][timeout:60];
(
  node["amenity"="parking"](around:15000,${lat},${lon});
  way["amenity"="parking"](around:15000,${lat},${lon});
  relation["amenity"="parking"](around:15000,${lat},${lon});
  node["parking"="surface"](around:15000,${lat},${lon});
  way["parking"="surface"](around:15000,${lat},${lon});
  node["parking"="multi-storey"](around:15000,${lat},${lon});
  way["parking"="multi-storey"](around:15000,${lat},${lon});
  node["parking"="underground"](around:15000,${lat},${lon});
  way["parking"="underground"](around:15000,${lat},${lon});
  node["parking"="street_side"](around:15000,${lat},${lon});
  node["amenity"="motorcycle_parking"](around:15000,${lat},${lon});
  way["amenity"="motorcycle_parking"](around:15000,${lat},${lon});
);
out center;`
  const res = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: query })
  const data = await res.json()
  return Array.isArray(data?.elements) ? data.elements : []
}

const fetchNominatimParking = async (cityName) => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent('parking ' + cityName + ' India')}&format=json&limit=50&addressdetails=1`,
      { headers: { 'Accept-Language': 'en' } }
    )
    return await res.json()
  } catch { return [] }
}

const isOpenNow = (schedule) => {
  if (!Array.isArray(schedule) || schedule.length === 0) return null
  const now = new Date()
  const dow = now.getDay()
  const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  const today = schedule.find(s => s.dayOfWeek === dow)
  if (!today) return null
  if (!today.isAvailable) return false
  return hhmm >= today.openingTime && hhmm < today.closingTime
}

const VEHICLE_LABELS = { TWO_WHEELER: '2-Wheeler', FOUR_WHEELER: '4-Wheeler' }

const SearchParking = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [city, setCity] = useState(searchParams.get('city') || '')
  const [vehicleType, setVehicleType] = useState(searchParams.get('vehicleType') || '')
  const [date, setDate] = useState(searchParams.get('date') || '')
  const [startTime, setStartTime] = useState(searchParams.get('startTime') || '')
  const [endTime, setEndTime] = useState(searchParams.get('endTime') || '')
  const [results, setResults] = useState([])
  const [mapCenter, setMapCenter] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('')
  const [osmLoading, setOsmLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState('')

  const buildApiParams = (v, d, st, et) => {
    const p = {}
    if (v) p.vehicleType = v
    if (d) p.date = d
    if (st) p.startTime = st
    if (et) p.endTime = et
    return p
  }

  const fetchDbOnly = async (v, d, st, et) => {
    setLoading(true); setLoadingMsg('Loading parking spaces...'); setError('')
    try {
      const { data } = await API.get('/parkings', { params: buildApiParams(v, d, st, et) })
      let list = Array.isArray(data) ? data : (Array.isArray(data?.parkings) ? data.parkings : [])
      list = list.map(p => ({ ...p, source: 'db' }))
      setResults(list)
    } catch {
      setError('Could not load parking spaces.'); setResults([])
    } finally {
      setLoading(false); setSearched(true); setLoadingMsg('')
    }
  }

  const fetchSearch = async (c, v, d, st, et) => {
    if (!c.trim()) { fetchDbOnly(v, d, st, et); return }
    setLoading(true); setLoadingMsg('Loading parking spaces...'); setError(''); setResults([])
    let dbList = []
    let coords = null
    try {
      const apiParams = { city: c, ...buildApiParams(v, d, st, et) }
      const [coordsResult, dbRes] = await Promise.all([
        geocodeCity(c),
        API.get('/parkings/search', { params: apiParams }).catch(() => ({ data: [] })),
      ])
      coords = coordsResult
      dbList = (Array.isArray(dbRes.data) ? dbRes.data : []).map(p => ({ ...p, source: 'db' }))
      if (coords) setMapCenter([coords.lat, coords.lon])
      setResults(dbList)
      setLoading(false)
      setSearched(true)
      setLoadingMsg('')
      if (!coords && dbList.length === 0) {
        setError(`Could not locate "${c}" on the map. Try a major city name.`)
        return
      }
    } catch {
      setError('Could not fetch parking data. Please try again.')
      setResults([])
      setLoading(false)
      setSearched(true)
      setLoadingMsg('')
      return
    }
    if (!coords) return
    setOsmLoading(true)
    try {
      const [overpassEls, nominatimItems] = await Promise.all([
        fetchOverpass(coords.lat, coords.lon),
        fetchNominatimParking(c),
      ])
      const osmFromOverpass = overpassEls.map(el => osmElementToParking(el, c)).filter(Boolean)
      const osmFromNominatim = (Array.isArray(nominatimItems) ? nominatimItems : [])
        .filter(item => item.type === 'parking' || item.class === 'amenity' || item.display_name?.toLowerCase().includes('park'))
        .map(item => nominatimToParking(item, c)).filter(Boolean)
      let osmAll = deduplicateByProximity([...osmFromOverpass, ...osmFromNominatim], 100)
      if (v) osmAll = osmAll.filter(p => (p.supportedVehicleTypes || []).includes(v))
      const dbLatLons = dbList.filter(p => p.latitude && p.longitude)
      const osmFiltered = osmAll.filter(osmP =>
        !dbLatLons.some(dbP => haversineMeters(dbP.latitude, dbP.longitude, osmP.latitude, osmP.longitude) < 100)
      )
      setResults([...dbList, ...osmFiltered])
    } catch {
    } finally {
      setOsmLoading(false)
    }
  }

  useEffect(() => {
    const c = searchParams.get('city')
    const v = searchParams.get('vehicleType') || ''
    const d = searchParams.get('date') || ''
    const st = searchParams.get('startTime') || ''
    const et = searchParams.get('endTime') || ''
    if (c) { setCity(c); setVehicleType(v); setDate(d); setStartTime(st); setEndTime(et); fetchSearch(c, v, d, st, et) }
    else fetchDbOnly(v, d, st, et)
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    const params = {}
    if (city) params.city = city
    if (vehicleType) params.vehicleType = vehicleType
    if (date) params.date = date
    if (startTime) params.startTime = startTime
    if (endTime) params.endTime = endTime
    setSearchParams(params)
    fetchSearch(city, vehicleType, date, startTime, endTime)
  }

  const mapParkings = results.filter(p => p.latitude && p.longitude)
  const dbResults = results.filter(p => p.source === 'db')
  const osmResults = results.filter(p => p.source === 'osm')
  const hasTimeFilter = date || startTime || endTime

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      {/* Search bar */}
      <div className="bg-white border-b border-gray-200 py-4 flex-shrink-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row sm:items-end gap-2">
            <div className="flex flex-col gap-1 flex-1 min-w-0">
              <label className="text-xs font-medium text-gray-500">City</label>
              <input
                type="text"
                placeholder="Mumbai, Delhi, Bangalore..."
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">Vehicle</label>
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
              >
                <option value="">All vehicles</option>
                <option value="TWO_WHEELER">Two Wheeler</option>
                <option value="FOUR_WHEELER">Four Wheeler</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">From</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">To</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
              />
            </div>
            {hasTimeFilter && (
              <button
                type="button"
                onClick={() => { setDate(''); setStartTime(''); setEndTime('') }}
                className="text-xs text-gray-400 hover:text-gray-600 underline whitespace-nowrap sm:mb-0.5"
              >
                Clear
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold px-6 py-2 rounded-lg transition-colors text-sm whitespace-nowrap shadow-sm"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </form>
        </div>
      </div>

      {/* Info banner */}
      {searched && !loading && (results.length > 0 || osmLoading) && (
        <div className="flex-shrink-0" style={{ background: '#2563eb' }}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-blue-100">
              {osmLoading ? 'Showing verified listings — also searching OpenStreetMap...' : 'Showing verified listings and OpenStreetMap locations'}
              {city && ` near ${city}`}
              {hasTimeFilter && date && ` on ${date}`}
              {hasTimeFilter && startTime && endTime && ` from ${startTime} to ${endTime}`}
            </p>
            <div className="flex items-center gap-3 text-xs text-blue-100">
              {dbResults.length > 0 && <span>{dbResults.length} bookable</span>}
              {osmResults.length > 0 && <span>{osmResults.length} from OSM</span>}
              {osmLoading && (
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 border border-blue-200 border-t-transparent rounded-full animate-spin inline-block"></span>
                  Loading OSM...
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-24 gap-3 flex-1">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" style={{ borderWidth: '3px' }}></div>
          <p className="text-gray-400 text-sm">{loadingMsg || 'Searching...'}</p>
        </div>
      )}

      {!loading && error && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="border border-amber-200 bg-amber-50 text-amber-800 rounded-lg px-4 py-3 text-sm">{error}</div>
        </div>
      )}

      {/* Split layout */}
      {!loading && searched && (results.length > 0 || osmLoading) && (
        <div className="flex-1 flex overflow-hidden" style={{ height: 'calc(100vh - 185px)' }}>

          {/* Left: scrollable cards */}
          <div className="w-full lg:w-[55%] overflow-y-auto border-r border-gray-200 bg-gray-50 flex-shrink-0">
            <div className="p-4 space-y-3">
              {results.map((spot) => {
                const types = spot.supportedVehicleTypes || spot.vehicleTypes || []
                const isDb = spot.source === 'db'
                const munRate = !isDb ? getMunicipalRate(spot.city || city) : null
                const openStatus = isDb ? isOpenNow(spot.availabilitySchedule) : null

                return (
                  <div
                    key={spot.id}
                    className="bg-white rounded-xl p-4 hover:shadow-md transition-all cursor-pointer"
                    style={{
                      border: '1px solid #e2e8f0',
                      borderLeft: isDb ? '3px solid #16a34a' : '3px solid #2563eb',
                    }}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h3 className="font-semibold text-gray-900 text-sm leading-snug flex-1">{spot.title}</h3>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {isDb && openStatus !== null && (
                          <span
                            className="text-xs px-1.5 py-0.5 rounded font-medium"
                            style={openStatus
                              ? { background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }
                              : { background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }
                            }
                          >
                            {openStatus ? 'Open' : 'Closed'}
                          </span>
                        )}
                        <span
                          className="text-xs px-1.5 py-0.5 rounded font-medium"
                          style={{
                            background: isDb ? '#f0fdf4' : '#eff6ff',
                            color: isDb ? '#16a34a' : '#2563eb',
                            border: `1px solid ${isDb ? '#bbf7d0' : '#bfdbfe'}`,
                          }}
                        >
                          {isDb ? 'Bookable' : 'OSM'}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-gray-400 mb-3 truncate">{spot.address}</p>

                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {types.map(t => (
                        <span key={t} className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                          {VEHICLE_LABELS[t] || t}
                        </span>
                      ))}
                      {!isDb && spot.parkingTypeLabel && spot.parkingTypeLabel !== 'Parking' && (
                        <span className="text-xs text-gray-400 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full">{spot.parkingTypeLabel}</span>
                      )}
                      {isDb && spot.slotSize && (
                        <span className="text-xs text-gray-400 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full">
                          {({ SMALL: 'Small', COMPACT: 'Small', MEDIUM: 'Medium', LARGE: 'Large', EXTRA_LARGE: 'Extra Large' })[spot.slotSize] || spot.slotSize} slots
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        {isDb ? (
                          <span className="text-base font-bold" style={{ color: '#2563eb' }}>
                            Rs. {spot.hourlyPrice}<span className="text-xs font-normal text-gray-400">/hr</span>
                          </span>
                        ) : (
                          <div>
                            <span className="text-sm font-bold" style={{ color: '#2563eb' }}>Rs. {munRate.fourWheeler}/hr</span>
                            <span className="text-xs text-gray-400 ml-1">{munRate.authority}</span>
                          </div>
                        )}
                      </div>
                      <Link
                        to={`/parking/${spot.id}`}
                        state={{ parking: spot }}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                        style={isDb
                          ? { background: '#2563eb', color: '#fff' }
                          : { border: '1px solid #d1d5db', color: '#374151' }
                        }
                      >
                        {isDb ? 'Book now' : 'View'}
                      </Link>
                    </div>

                    {isDb && spot.totalSlots > 0 && (
                      <p className="text-xs text-gray-400 mt-1.5">{spot.totalSlots} slots available</p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right: sticky map */}
          <div className="hidden lg:block flex-1 bg-gray-100 relative">
            {mapParkings.length > 0 ? (
              <MapView
                parkings={mapParkings}
                center={mapCenter || [mapParkings[0].latitude, mapParkings[0].longitude]}
                zoom={mapCenter ? 13 : 12}
                style={{ height: '100%', width: '100%' }}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">No map data</div>
            )}
          </div>
        </div>
      )}

      {/* Mobile map */}
      {!loading && searched && (results.length > 0 || osmLoading) && mapParkings.length > 0 && (
        <div className="lg:hidden border-t border-gray-200" style={{ height: '300px' }}>
          <MapView
            parkings={mapParkings}
            center={mapCenter || [mapParkings[0].latitude, mapParkings[0].longitude]}
            zoom={mapCenter ? 12 : 11}
            style={{ height: '100%', width: '100%' }}
          />
        </div>
      )}

      {!loading && searched && results.length === 0 && !error && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center py-20">
            <p className="text-gray-900 font-semibold mb-1">No parking data found</p>
            <p className="text-gray-400 text-sm max-w-xs mx-auto">
              Try a nearby major city or a different vehicle type.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default SearchParking
