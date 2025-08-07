"use client"

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet'
import { LatLngExpression } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/marker-icon-2x.png',
  iconUrl: '/marker-icon.png',
  shadowUrl: '/marker-shadow.png',
})

interface DeliveryPoint {
  id: string
  name: string
  address: string
  coordinates: LatLngExpression
  type: 'pickup' | 'delivery' | 'depot'
  status: 'pending' | 'in_progress' | 'completed'
  estimatedTime?: string
}

interface DeliveryRoute {
  id: string
  name: string
  points: DeliveryPoint[]
  routeCoordinates: LatLngExpression[]
  driver?: {
    name: string
    phone: string
    currentLocation?: LatLngExpression
  }
  status: 'planned' | 'in_progress' | 'completed'
  totalDistance?: number
  estimatedDuration?: number
}

interface DeliveryMapProps {
  routes: DeliveryRoute[]
  center?: LatLngExpression
  zoom?: number
  height?: string
}

export default function DeliveryMap({ 
  routes, 
  center = [-23.5505, -46.6333] as LatLngExpression, // São Paulo coordinates
  zoom = 12,
  height = '500px' 
}: DeliveryMapProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const getMarkerColor = (type: string, status: string) => {
    if (type === 'pickup') return status === 'completed' ? 'green' : 'orange'
    if (type === 'delivery') return status === 'completed' ? 'green' : 'blue'
    if (type === 'depot') return 'red'
    return 'gray'
  }

  const getRouteColor = (status: string) => {
    switch (status) {
      case 'completed': return 'green'
      case 'in_progress': return 'orange'
      default: return 'blue'
    }
  }

  if (!isClient) {
    return (
      <div className="bg-gray-100 rounded-lg flex items-center justify-center" style={{ height }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando mapa...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg overflow-hidden border" style={{ height }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {routes.map((route) => (
          <div key={route.id}>
            {/* Route line */}
            {route.routeCoordinates.length > 1 && (
              <Polyline
                positions={route.routeCoordinates}
                color={getRouteColor(route.status)}
                weight={4}
                opacity={0.8}
              />
            )}
            
            {/* Driver current location */}
            {route.driver?.currentLocation && (
              <Marker
                position={route.driver.currentLocation}
                icon={L.divIcon({
                  className: 'custom-div-icon',
                  html: '<div style="background-color: #8B5CF6; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
                  iconSize: [20, 20],
                  iconAnchor: [10, 10]
                })}
              >
                <Popup>
                  <div className="text-sm">
                    <strong>Motorista:</strong> {route.driver.name}<br />
                    <strong>Telefone:</strong> {route.driver.phone}<br />
                    <strong>Status:</strong> Em entrega
                  </div>
                </Popup>
              </Marker>
            )}
            
            {/* Route points */}
            {route.points.map((point) => (
              <Marker
                key={point.id}
                position={point.coordinates}
                icon={L.divIcon({
                  className: 'custom-div-icon',
                  html: `<div style="background-color: ${getMarkerColor(point.type, point.status)}; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
                  iconSize: [16, 16],
                  iconAnchor: [8, 8]
                })}
              >
                <Popup>
                  <div className="text-sm">
                    <strong>{point.name}</strong><br />
                    <strong>Tipo:</strong> {point.type === 'pickup' ? 'Coleta' : point.type === 'delivery' ? 'Entrega' : 'Base'}<br />
                    <strong>Endereço:</strong> {point.address}<br />
                    <strong>Status:</strong> {point.status === 'completed' ? 'Concluído' : point.status === 'in_progress' ? 'Em andamento' : 'Pendente'}<br />
                    {point.estimatedTime && (
                      <>
                        <strong>Previsão:</strong> {point.estimatedTime}
                      </>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
          </div>
        ))}
      </MapContainer>
    </div>
  )
}