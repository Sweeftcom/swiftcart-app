import { useEffect, useRef } from 'react';
import { blink } from '../lib/blink';
import { Logger } from '../lib/monitoring/Logger';

const GEOFENCE_CLUSTERS = [
  { name: 'Nirala Bazar', lat: 19.8762, lng: 75.3433 },
  { name: 'CIDCO N-Series', lat: 19.8821, lng: 75.3670 }
];

/**
 * useBackgroundTracking
 * Hardened for Tier-2 shadow zones and hyper-local geofencing.
 * Powered by Blink SDK.
 */
export const useBackgroundTracking = (driverId: string | undefined, isOnline: boolean) => {
  const trackingInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!driverId || !isOnline) {
      if (trackingInterval.current) clearInterval(trackingInterval.current);
      return;
    }

    const startTracking = () => {
      trackingInterval.current = setInterval(async () => {
        // 1. Mock GPS Logic (Simulation for Aurangabad Pilot)
        const lat = 19.8762 + (Math.random() - 0.5) * 0.005;
        const lng = 75.3433 + (Math.random() - 0.5) * 0.005;
        const timestamp = new Date().toISOString();

        // 2. Geofencing Logic (100m check)
        const isAtStore = GEOFENCE_CLUSTERS.some(cluster => {
          const distance = calculateDistance(lat, lng, cluster.lat, cluster.lng);
          return distance <= 0.1; // 100 meters
        });

        try {
          // 3. Attempt Live Sync
          await blink.db.drivers.update(driverId, {
            currentLat: lat,
            currentLng: lng,
            isAtStore: isAtStore ? "1" : "0",
            updatedAt: timestamp
          });

          // Publish real-time location for customers
          await blink.realtime.publish(`driver-location-${driverId}`, 'location_update', { lat, lng });

        } catch (err) {
          Logger.log('Location sync failed. Driver might be in a shadow zone.');
        }

      }, 5000);
    };

    startTracking();

    return () => {
      if (trackingInterval.current) clearInterval(trackingInterval.current);
    };
  }, [driverId, isOnline]);
};

/**
 * Helper: Calculate distance in KM using Haversine
 */
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};
