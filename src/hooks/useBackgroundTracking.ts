import { useEffect, useRef } from 'react';
import { supabase } from '../lib/react-native/supabase-client';

/**
 * useBackgroundTracking
 * Handles the foreground/background location tracking for Riders.
 * NOTE: For production React Native, use 'react-native-geolocation-service'
 * and 'react-native-foreground-service' (Android) to ensure tracking survives OS suspension.
 */
export const useBackgroundTracking = (driverId: string | undefined, isOnline: boolean) => {
  const trackingInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!driverId || !isOnline) {
      if (trackingInterval.current) {
        clearInterval(trackingInterval.current);
      }
      return;
    }

    const startTracking = () => {
      // PRO TIP: In a real mobile environment, you must use a Native Module
      // for location to keep the GPS active when the screen is off.

      trackingInterval.current = setInterval(async () => {
        // Mocking GPS coordinate movement for development/simulation
        const lat = 19.8762 + (Math.random() - 0.5) * 0.005;
        const lng = 75.3433 + (Math.random() - 0.5) * 0.005;

        const { error } = await supabase
          .from('drivers')
          .update({
            current_lat: lat,
            current_lng: lng,
            updated_at: new Date().toISOString()
          })
          .eq('id', driverId);

        if (error) console.error('Tracking update failed:', error.message);

      }, 5000);
    };

    startTracking();

    return () => {
      if (trackingInterval.current) {
        clearInterval(trackingInterval.current);
      }
    };
  }, [driverId, isOnline]);
};
