import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { Link } from 'react-router-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const greenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

const blueIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

const MapController = ({ center, zoom }) => {
  const map = useMap()
  const prevCenter = useRef(null)

  useEffect(() => {
    if (!center) return
    const key = `${center[0]},${center[1]}`
    if (prevCenter.current === key) return
    prevCenter.current = key
    map.setView(center, zoom || 13, { animate: true })
  }, [center, zoom, map])

  return null
}

const MapView = ({ parkings = [], center, zoom = 12 }) => {
  const validParkings = parkings.filter(
    (p) => p.latitude && p.longitude && !isNaN(p.latitude) && !isNaN(p.longitude)
  )

  const initialCenter =
    center ||
    (validParkings.length > 0
      ? [validParkings[0].latitude, validParkings[0].longitude]
      : [20.5937, 78.9629])

  const initialZoom = center ? zoom : validParkings.length > 0 ? 12 : 5

  return (
    <div className="w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm" style={{ height: '420px' }}>
      <MapContainer
        center={initialCenter}
        zoom={initialZoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapController center={center} zoom={zoom} />
        {validParkings.map((parking) => {
          const isDb = parking.source === 'db' || (!parking.source && !parking.id?.startsWith('osm'))
          const icon = isDb ? greenIcon : blueIcon
          return (
            <Marker
              key={parking.id}
              position={[parking.latitude, parking.longitude]}
              icon={icon}
            >
              <Popup>
                <div style={{ minWidth: '180px', maxWidth: '220px' }}>
                  <div style={{ marginBottom: '6px' }}>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: '700',
                      padding: '2px 8px',
                      borderRadius: '20px',
                      background: isDb ? '#dcfce7' : '#dbeafe',
                      color: isDb ? '#15803d' : '#1d4ed8',
                      border: `1px solid ${isDb ? '#bbf7d0' : '#bfdbfe'}`,
                    }}>
                      {isDb ? 'Bookable' : 'OpenStreetMap'}
                    </span>
                  </div>
                  <p style={{ fontWeight: '700', fontSize: '13px', marginBottom: '3px', color: '#0f172a' }}>
                    {parking.title}
                  </p>
                  <p style={{ fontSize: '11px', color: '#64748b', marginBottom: '6px' }}>
                    {parking.address}
                  </p>
                  {isDb && parking.hourlyPrice && (
                    <p style={{ fontSize: '13px', fontWeight: '700', color: '#15803d', marginBottom: '3px' }}>
                      Rs. {parking.hourlyPrice}/hr
                    </p>
                  )}
                  {isDb && parking.totalSlots > 0 && (
                    <p style={{ fontSize: '11px', color: '#475569', marginBottom: '6px' }}>
                      {parking.totalSlots} slots available
                    </p>
                  )}
                  {!isDb && parking.capacity && (
                    <p style={{ fontSize: '11px', color: '#475569', marginBottom: '4px' }}>
                      Capacity: {parking.capacity}
                    </p>
                  )}
                  {!isDb && parking.access && (
                    <p style={{ fontSize: '11px', color: '#475569', marginBottom: '4px', textTransform: 'capitalize' }}>
                      Access: {parking.access}
                    </p>
                  )}
                  {(parking.supportedVehicleTypes || parking.vehicleTypes || []).length > 0 && (
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '8px' }}>
                      {(parking.supportedVehicleTypes || parking.vehicleTypes || []).map(t => (
                        <span key={t} style={{ fontSize: '10px', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '1px 6px', borderRadius: '20px', fontWeight: '600' }}>
                          {t === 'TWO_WHEELER' ? '2-Wheeler' : t === 'FOUR_WHEELER' ? '4-Wheeler' : t}
                        </span>
                      ))}
                    </div>
                  )}
                  <a
                    href={`/parking/${parking.id}`}
                    style={{
                      display: 'inline-block',
                      background: isDb ? '#16a34a' : '#1d4ed8',
                      color: '#fff',
                      fontSize: '11px',
                      fontWeight: '700',
                      padding: '5px 12px',
                      borderRadius: '6px',
                      textDecoration: 'none',
                    }}
                  >
                    {isDb ? 'Book Now' : 'View Details'}
                  </a>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )
}

export default MapView
