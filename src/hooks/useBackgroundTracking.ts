import { useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/react-native/supabase-client';
import { Logger } from '../lib/monitoring/Logger';

const OFFLINE_BUFFER_KEY = '@sweeftcom_offline_pings';
const GEOFENCE_CLUSTERS = [
  { name: 'Nirala Bazar', lat: 19.8762, lng: 75.3433 },
  { name: 'CIDCO N-Series', lat: 19.8821, lng: 75.3670 }
];

/**
 * useBackgroundTracking
 * Hardened for Tier-2 shadow zones and hyper-local geofencing.
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
          const { error } = await supabase
            .from('drivers')
            .update({
              current_lat: lat,
              current_lng: lng,
              is_at_store: isAtStore,
              updated_at: timestamp
            })
            .eq('id', driverId);

          if (error) throw error;

          // 4. If sync succeeded, check for and flush offline buffer
          await flushOfflineBuffer(driverId);

        } catch (err) {
          // 5. Resilience: Save to Local Buffer on failure (Shadow Zone)
          Logger.log('Shadow zone detected. Buffering coordinate locally.');
          await bufferCoordinateLocally({ lat, lng, timestamp });
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

/**
 * Persistence: Buffer coordinates in AsyncStorage
 */
const bufferCoordinateLocally = async (coord: any) => {
  try {
    const existing = await AsyncStorage.getItem(OFFLINE_BUFFER_KEY);
    const buffer = existing ? JSON.parse(existing) : [];
    buffer.push(coord);
    // Limit buffer to 100 pings to prevent storage bloat
    const limitedBuffer = buffer.slice(-100);
    await AsyncStorage.setItem(OFFLINE_BUFFER_KEY, JSON.stringify(limitedBuffer));
  } catch (e) {
    Logger.error(e as Error, 'bufferCoordinateLocally');
  }
};

/**
 * Sync: Push buffered coordinates when signal returns
 */
const flushOfflineBuffer = async (driverId: string) => {
  try {
    const existing = await AsyncStorage.getItem(OFFLINE_BUFFER_KEY);
    if (!existing) return;

    const buffer = JSON.parse(existing);
    if (buffer.length === 0) return;

    Logger.log(`Re-connected. Flushing ${buffer.length} pings from CIDCO shadow zone.`);

    const { error } = await supabase.rpc('sync_offline_coordinates', {
      p_driver_id: driverId,
      p_coordinates: buffer
    });

    if (!error) {
      await AsyncStorage.removeItem(OFFLINE_BUFFER_KEY);
    }
  } catch (e) {
    Logger.error(e as Error, 'flushOfflineBuffer');
  }
};
