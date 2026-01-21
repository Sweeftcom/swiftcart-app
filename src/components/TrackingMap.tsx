import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { supabase } from '../lib/react-native/supabase-client';
import 'leaflet/dist/leaflet.css';

// Fix for Leaflet default icon issues in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface TrackingMapProps {
  orderId: string;
  riderId: string;
  customerLocation: { latitude: number; longitude: number };
}

/**
 * AutoFitBounds Component
 * Automatically fits the map bounds to show all markers.
 */
const AutoFitBounds = ({ points }: { points: [number, number][] }) => {
  const map = useMap();
  useEffect(() => {
    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [points, map]);
  return null;
};

/**
 * TrackingMap
 * High-performance live tracking using Leaflet and OpenStreetMap.
 * Optimized for local testing without Google Maps billing.
 */
export const TrackingMap: React.FC<TrackingMapProps> = ({ orderId, riderId, customerLocation }) => {
  const [riderLocation, setRiderLocation] = useState<[number, number] | null>(null);

  useEffect(() => {
    // Subscribe to real-time location updates from Supabase
    const channel = supabase
      .channel(`rider-location-${riderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'drivers',
          filter: `id=eq.${riderId}`
        },
        (payload) => {
          const { current_lat, current_lng } = payload.new;
          if (current_lat && current_lng) {
            setRiderLocation([current_lat, current_lng]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [riderId]);

  const customerPos: [number, number] = [customerLocation.latitude, customerLocation.longitude];
  const points: [number, number][] = [customerPos];
  if (riderLocation) points.push(riderLocation);

  return (
    <div className="w-full h-full min-h-[400px] rounded-3xl overflow-hidden border border-[#333]">
      <MapContainer
        center={customerPos}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        <Marker position={customerPos}>
          {/* Custom label or popup for Customer */}
        </Marker>

        {riderLocation && (
          <Marker
            position={riderLocation}
            icon={L.divIcon({
              className: 'custom-rider-icon',
              html: '<div style="background-color: #E5F942; width: 24px; height: 24px; borderRadius: 50%; border: 3px solid #000; box-shadow: 0 0 10px #E5F942;"></div>',
              iconSize: [24, 24]
            })}
          />
        )}

        {riderLocation && (
          <Polyline
            positions={[riderLocation, customerPos]}
            color="#E5F942"
            weight={3}
            dashArray="5, 10"
          />
        )}

        <AutoFitBounds points={points} />
      </MapContainer>
    </div>
  );
};
