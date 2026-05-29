import { useState, useEffect, useRef, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const destIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
})

const USER_ICON = L.divIcon({
  className: '',
  html: '<div class="user-location-pulse"></div>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
})

const haversineM = (a, b) => {
  const R = 6371000
  const dLat = ((b[0] - a[0]) * Math.PI) / 180
  const dLon = ((b[1] - a[1]) * Math.PI) / 180
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a[0] * Math.PI) / 180) * Math.cos((b[0] * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

const MANEUVER_ICONS = {
  uturn: '\u21A9',
  'sharp right': '\u21B1',
  right: '\u2192',
  'slight right': '\u2197',
  straight: '\u2191',
  'slight left': '\u2196',
  left: '\u2190',
  'sharp left': '\u21B0',
}

const getStepIcon = (type, modifier) => {
  if (type === 'arrive') return '\u2605'
  if (type === 'depart') return '\u2191'
  return MANEUVER_ICONS[modifier] || '\u2191'
}

const getInstruction = (step) => {
  const { type, modifier } = step.maneuver
  const road = step.name ? ` onto ${step.name}` : step.ref ? ` onto ${step.ref}` : ''
  if (type === 'depart') return `Head ${modifier || 'north'}${road}`
  if (type === 'arrive') return 'Arrive at destination'
  if (type === 'turn')
    return modifier === 'straight' ? `Continue straight${road}` : `Turn ${modifier}${road}`
  if (type === 'new name') return `Continue${road}`
  if (type === 'merge') return `Merge ${modifier ? modifier + ' ' : ''}${road}`.trim()
  if (type === 'fork') return `Take the ${modifier || ''} fork${road}`.trim()
  if (type === 'end of road') return `Turn ${modifier || ''} at end of road${road}`.trim()
  if (type === 'continue') return `Continue ${modifier === 'straight' ? 'straight' : modifier || 'straight'}${road}`
  if (type === 'roundabout' || type === 'rotary') return `Enter roundabout${road}`
  if (type === 'roundabout turn') return `At roundabout, take exit${road}`
  return `Continue${road}`
}

const fmtDist = (m) => (m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`)

const MapController = ({ position }) => {
  const map = useMap()
  useEffect(() => {
    if (position) map.panTo(position, { animate: true, duration: 0.8 })
  }, [position, map])
  return null
}

const FitBoundsOnce = ({ positions }) => {
  const map = useMap()
  const done = useRef(false)
  useEffect(() => {
    if (!done.current && positions?.length >= 2) {
      map.fitBounds(positions, { padding: [60, 60] })
      done.current = true
    }
  }, [positions, map])
  return null
}

const NavigationMap = ({ latitude, longitude, title, onStop }) => {
  const [userLocation, setUserLocation] = useState(null)
  const [speed, setSpeed] = useState(null)
  const [route, setRoute] = useState(null)
  const [steps, setSteps] = useState([])
  const [routeInfo, setRouteInfo] = useState(null)
  const [currentStepIdx, setCurrentStepIdx] = useState(0)
  const [locationError, setLocationError] = useState('')
  const [routeLoading, setRouteLoading] = useState(false)
  const [arrived, setArrived] = useState(false)
  const [following, setFollowing] = useState(false)

  const watchIdRef = useRef(null)
  const userLocRef = useRef(null)
  const routeFetchedRef = useRef(false)
  const stepsRef = useRef([])

  const parkingPos = [parseFloat(latitude), parseFloat(longitude)]
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`

  const fetchRoute = useCallback(
    async (lat, lng) => {
      setRouteLoading(true)
      try {
        const [pLat, pLng] = parkingPos
        const url = `https://router.project-osrm.org/route/v1/driving/${lng},${lat};${pLng},${pLat}?overview=full&geometries=geojson&steps=true`
        const res = await fetch(url)
        const data = await res.json()
        if (data.routes?.[0]) {
          const r = data.routes[0]
          const coords = r.geometry.coordinates.map(([ln, la]) => [la, ln])
          setRoute(coords)
          setRouteInfo({
            distance: (r.distance / 1000).toFixed(1),
            duration: Math.round(r.duration / 60),
          })
          const allSteps = r.legs.flatMap((leg) => leg.steps)
          stepsRef.current = allSteps
          setSteps(allSteps)
          setCurrentStepIdx(0)
          setFollowing(true)
        }
      } catch {
        /* silent */
      } finally {
        setRouteLoading(false)
      }
    },
    [latitude, longitude]
  )

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.')
      return
    }
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const loc = [pos.coords.latitude, pos.coords.longitude]
        userLocRef.current = loc
        setUserLocation(loc)
        if (pos.coords.speed != null) setSpeed(Math.round(pos.coords.speed * 3.6))

        if (haversineM(loc, parkingPos) < 50) {
          setArrived(true)
          return
        }

        if (stepsRef.current.length > 0) {
          let nearest = 0
          let nearestDist = Infinity
          stepsRef.current.forEach((step, i) => {
            const sl = [step.maneuver.location[1], step.maneuver.location[0]]
            const d = haversineM(loc, sl)
            if (d < nearestDist) {
              nearestDist = d
              nearest = i
            }
          })
          setCurrentStepIdx(nearest)
        }

        if (!routeFetchedRef.current) {
          routeFetchedRef.current = true
          fetchRoute(pos.coords.latitude, pos.coords.longitude)
        }
      },
      (err) => {
        if (err.code === 1)
          setLocationError('Location access denied. Enable location to use navigation.')
        else setLocationError('Unable to determine your location. Please try again.')
      },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 }
    )
    return () => {
      if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current)
    }
  }, [])

  const handleRecalculate = () => {
    if (userLocRef.current) {
      fetchRoute(userLocRef.current[0], userLocRef.current[1])
    }
  }

  const routeBounds = route && userLocation ? [userLocation, parkingPos] : null

  if (locationError) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-3 text-sm">
          {locationError}
        </div>
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-center w-full text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
          style={{ background: '#2563eb' }}
        >
          Open in Google Maps
        </a>
        {onStop && (
          <button
            onClick={onStop}
            className="block w-full text-center text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            Stop Navigation
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {arrived && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm font-semibold text-center">
          You have arrived at your destination!
        </div>
      )}

      {!arrived && (
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-3">
          {!userLocation ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
              Detecting your location...
            </div>
          ) : (
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex gap-5">
                <div>
                  <p className="text-xl font-bold" style={{ color: '#2563eb' }}>
                    {routeInfo?.distance ?? '...'}
                    <span className="text-xs font-normal text-gray-400 ml-0.5">km</span>
                  </p>
                  <p className="text-xs text-gray-400">Distance</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-800">
                    {routeInfo?.duration ?? '...'}
                    <span className="text-xs font-normal text-gray-400 ml-0.5">min</span>
                  </p>
                  <p className="text-xs text-gray-400">Est. time</p>
                </div>
                {speed != null && (
                  <div>
                    <p className="text-xl font-bold text-gray-800">
                      {speed}
                      <span className="text-xs font-normal text-gray-400 ml-0.5">km/h</span>
                    </p>
                    <p className="text-xs text-gray-400">Speed</p>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleRecalculate}
                  disabled={routeLoading}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-gray-300 transition-colors disabled:opacity-50"
                >
                  {routeLoading ? 'Recalculating...' : 'Recalculate'}
                </button>
                {onStop && (
                  <button
                    onClick={onStop}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Stop
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {!arrived && steps.length > 0 && userLocation && (
        <div
          className="rounded-xl px-4 py-3 flex items-center gap-3"
          style={{ background: '#2563eb' }}
        >
          <span className="text-2xl font-bold w-7 text-center flex-shrink-0 text-white">
            {getStepIcon(
              steps[currentStepIdx]?.maneuver?.type,
              steps[currentStepIdx]?.maneuver?.modifier
            )}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white leading-snug">
              {getInstruction(steps[currentStepIdx])}
            </p>
            {steps[currentStepIdx]?.distance > 0 && (
              <p className="text-xs text-blue-200 mt-0.5">
                {fmtDist(steps[currentStepIdx].distance)}
              </p>
            )}
          </div>
          {currentStepIdx < steps.length - 1 && (
            <div className="text-right flex-shrink-0">
              <p className="text-xs text-blue-200">Then</p>
              <p className="text-xs text-blue-100 font-medium">
                {getStepIcon(
                  steps[currentStepIdx + 1]?.maneuver?.type,
                  steps[currentStepIdx + 1]?.maneuver?.modifier
                )}
              </p>
            </div>
          )}
        </div>
      )}

      <div
        className="rounded-xl overflow-hidden border border-gray-200"
        style={{ height: '400px' }}
      >
        <MapContainer
          center={parkingPos}
          zoom={14}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {routeBounds && <FitBoundsOnce positions={routeBounds} />}
          {following && userLocation && <MapController position={userLocation} />}

          <Marker position={parkingPos} icon={destIcon}>
            <Popup>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{title}</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>Destination</div>
            </Popup>
          </Marker>

          {userLocation && (
            <Marker position={userLocation} icon={USER_ICON}>
              <Popup>
                <div style={{ fontWeight: 600, fontSize: 13, color: '#1d4ed8' }}>
                  Your Location
                </div>
              </Popup>
            </Marker>
          )}

          {route && (
            <Polyline positions={route} color="#2563eb" weight={5} opacity={0.85} />
          )}
        </MapContainer>
      </div>

      {steps.length > 0 && userLocation && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Turn-by-turn directions
            </p>
            <p className="text-xs text-gray-400">{steps.length} steps</p>
          </div>
          <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
            {steps.map((step, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 px-4 py-3 transition-colors ${
                  i === currentStepIdx ? 'bg-blue-50' : ''
                }`}
              >
                <span
                  className="text-base font-bold w-6 text-center flex-shrink-0 mt-0.5"
                  style={{ color: i === currentStepIdx ? '#2563eb' : '#9ca3af' }}
                >
                  {getStepIcon(step.maneuver.type, step.maneuver.modifier)}
                </span>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm leading-snug ${
                      i === currentStepIdx
                        ? 'font-semibold text-gray-900'
                        : 'text-gray-600'
                    }`}
                  >
                    {getInstruction(step)}
                  </p>
                  {step.distance > 0 && (
                    <p className="text-xs text-gray-400 mt-0.5">{fmtDist(step.distance)}</p>
                  )}
                </div>
                {i === currentStepIdx && (
                  <span className="text-xs px-1.5 py-0.5 rounded font-medium bg-blue-100 text-blue-700 flex-shrink-0">
                    Now
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-gray-400 text-center">
        Route via OSRM · OpenStreetMap contributors
      </p>
    </div>
  )
}

export default NavigationMap
