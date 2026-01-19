import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { HeatmapLayer } from 'react-leaflet-heatmap-layer-v3';
import { supabase } from '../lib/react-native/supabase-client';
import 'leaflet/dist/leaflet.css';

/**
 * AdminHeatmap
 * Visualizes live rider density and clusters in Aurangabad.
 */
export const Heatmap = () => {
  const [points, setPoints] = useState<any[]>([]);
  const AURANGABAD_CENTER: [number, number] = [19.8762, 75.3433];

  useEffect(() => {
    const fetchLocations = async () => {
      const { data } = await supabase
        .from('drivers')
        .select('current_lat, current_lng, id')
        .eq('status', 'online')
        .not('current_lat', 'is', null);

      if (data) {
        setPoints(data.map(d => [d.current_lat, d.current_lng, 1])); // [lat, lng, intensity]
      }
    };

    fetchLocations();

    const channel = supabase
      .channel('live-heat')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'drivers' }, () => {
        fetchLocations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="h-screen w-full bg-[#0A0A0A] p-4">
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-[#E5F942] tracking-widest">AURANGABAD LOGISTICS HEATMAP</h2>
        <span className="text-gray-500 font-mono">Live Clusters: {points.length}</span>
      </div>

      <div className="h-[90%] w-full rounded-3xl overflow-hidden border border-[#333]">
        <MapContainer
          center={AURANGABAD_CENTER}
          zoom={13}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          <HeatmapLayer
            points={points}
            longitudeExtractor={(m: any) => m[1]}
            latitudeExtractor={(m: any) => m[0]}
            intensityExtractor={(m: any) => m[2]}
            radius={25}
            blur={15}
            max={1}
          />

          {points.map((p, idx) => (
            <Marker key={idx} position={[p[0], p[1]]}>
               <Popup>Rider Active</Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default Heatmap;
