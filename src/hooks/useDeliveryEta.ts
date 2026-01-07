import { useMemo } from 'react';
import { useLocationStore } from '@/stores/locationStore';

// Haversine formula to calculate distance between two coordinates
const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Average bike speed in km/h for delivery in urban areas
const AVG_DELIVERY_SPEED_KMH = 25;

export const useDeliveryEta = () => {
  const { currentAddress, nearestStore, selectedLocation } = useLocationStore();

  const eta = useMemo(() => {
    // Get user location - prefer current address, then selected location
    const userLat = currentAddress?.lat || selectedLocation?.lat;
    const userLng = currentAddress?.lng || selectedLocation?.lng;
    
    if (!nearestStore || !userLat || !userLng) {
      // Default ETA when location not available
      return {
        minutes: 12,
        text: '10-15 min',
        distance: null,
      };
    }

    const distance = calculateDistance(
      userLat,
      userLng,
      nearestStore.lat,
      nearestStore.lng
    );

    // Calculate travel time in minutes
    const travelTimeMinutes = (distance / AVG_DELIVERY_SPEED_KMH) * 60;
    
    // Total ETA = store handling time + travel time + buffer
    const baseHandling = nearestStore.base_handling_minutes || 5;
    const buffer = 2; // Buffer for traffic, packaging, etc.
    const totalMinutes = Math.ceil(baseHandling + travelTimeMinutes + buffer);

    // Clamp between 8 and 45 minutes for realistic ETA
    const clampedMinutes = Math.min(Math.max(totalMinutes, 8), 45);

    // Generate display text with range
    const minTime = Math.max(clampedMinutes - 2, 8);
    const maxTime = clampedMinutes + 3;

    return {
      minutes: clampedMinutes,
      text: `${minTime}-${maxTime} min`,
      distance: distance.toFixed(1),
    };
  }, [currentAddress, nearestStore, selectedLocation]);

  return eta;
};

export const calculateEtaFromStore = (
  storeLat: number,
  storeLng: number,
  userLat: number,
  userLng: number,
  handlingMinutes: number = 5
) => {
  const distance = calculateDistance(storeLat, storeLng, userLat, userLng);
  const travelTimeMinutes = (distance / AVG_DELIVERY_SPEED_KMH) * 60;
  const buffer = 2;
  const totalMinutes = Math.ceil(handlingMinutes + travelTimeMinutes + buffer);
  const clampedMinutes = Math.min(Math.max(totalMinutes, 8), 45);
  const minTime = Math.max(clampedMinutes - 2, 8);
  const maxTime = clampedMinutes + 3;

  return {
    minutes: clampedMinutes,
    text: `${minTime}-${maxTime} min`,
    distance: distance.toFixed(1),
  };
};
