import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Animated, Platform } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, AnimatedRegion } from 'react-native-maps';
import { supabase } from '../lib/react-native/supabase-client';

interface TrackingMapProps {
  orderId: string;
  riderId: string;
  customerLocation: { latitude: number; longitude: number };
}

/**
 * TrackingMap
 * High-performance live tracking with smooth rider marker animation and auto-zoom.
 * Optimized for React Native using AnimatedRegion and fitToCoordinates.
 */
export const TrackingMap: React.FC<TrackingMapProps> = ({ orderId, riderId, customerLocation }) => {
  const mapRef = useRef<MapView>(null);
  const [riderLocation, setRiderLocation] = useState(customerLocation);

  const riderAnimatedCoordinate = useRef(new AnimatedRegion({
    ...customerLocation,
    latitudeDelta: 0,
    longitudeDelta: 0,
  })).current;

  useEffect(() => {
    // 1. Initial fit to show both points
    fitBounds();

    // 2. Subscribe to real-time location updates
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
            animateMarker(current_lat, current_lng);
            setRiderLocation({ latitude: current_lat, longitude: current_lng });

            // Periodically fit bounds as rider moves
            fitBounds();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [riderId]);

  const fitBounds = () => {
    if (mapRef.current) {
      mapRef.current.fitToCoordinates(
        [riderLocation, customerLocation],
        {
          edgePadding: { top: 100, right: 100, bottom: 100, left: 100 },
          animated: true,
        }
      );
    }
  };

  const animateMarker = (latitude: number, longitude: number) => {
    if (Platform.OS === 'android') {
      if (riderAnimatedCoordinate) {
        (riderAnimatedCoordinate as any).timing({
          latitude,
          longitude,
          duration: 5000,
          useNativeDriver: false,
        }).start();
      }
    } else {
      riderAnimatedCoordinate.timing({
        latitude,
        longitude,
        duration: 5000,
        useNativeDriver: false,
      }).start();
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        customMapStyle={darkMapStyle}
        initialRegion={{
          ...customerLocation,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        <Marker coordinate={customerLocation} title="You" pinColor="blue" />

        <Marker.Animated
          coordinate={riderAnimatedCoordinate as any}
          title="Sweeftcom Rider"
        >
          <View style={styles.riderMarker} />
        </Marker.Animated>

        <Polyline
          coordinates={[riderLocation, customerLocation]}
          strokeColor="#E5F942"
          strokeWidth={3}
          lineDashPattern={[5, 5]}
        />
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { ...StyleSheet.absoluteFillObject },
  map: { ...StyleSheet.absoluteFillObject },
  riderMarker: {
    width: 24,
    height: 24,
    backgroundColor: '#E5F942',
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#000',
    shadowColor: '#E5F942',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
});

const darkMapStyle = [
  { "elementType": "geometry", "stylers": [{ "color": "#1a1a1a" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#746855" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#242f3e" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#38414e" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#17263c" }] }
];
