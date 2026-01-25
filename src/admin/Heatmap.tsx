import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { HeatmapLayer } from 'react-leaflet-heatmap-layer-v3';
import { blink } from '@/lib/blink';
import 'leaflet/dist/leaflet.css';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

/**
 * AdminHeatmap
 * Visualizes live rider density and clusters in Aurangabad.
 */
export const Heatmap = () => {
  const navigate = useNavigate();
  const [points, setPoints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const AURANGABAD_CENTER: [number, number] = [19.8762, 75.3433];

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const drivers = await blink.db.drivers.list({
          where: {
            AND: [
              { status: 'online' },
              { currentLat: { NE: null } }
            ]
          }
        });

        if (drivers) {
          setPoints(drivers.map((d: any) => [d.currentLat, d.currentLng, 1]));
        }
      } catch (error) {
        console.error('Error fetching heatmap data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();

    const unsubscribe = blink.realtime.subscribe('live-heat', () => {
      fetchLocations();
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <div className="h-screen w-full bg-background p-4 flex flex-col">
      <div className="mb-6 flex justify-between items-center px-2">
        <div className="flex items-center gap-4">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate('/profile')}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          <h2 className="text-2xl font-black text-primary tracking-widest uppercase italic">Logistics Heatmap</h2>
        </div>
        <div className="flex items-center gap-2">
          {loading && <Loader2 className="w-4 h-4 text-primary animate-spin" />}
          <span className="text-muted-foreground font-mono text-xs font-bold uppercase tracking-widest bg-secondary px-3 py-1.5 rounded-lg border border-border/40 shadow-inner">
            Live Clusters: {points.length}
          </span>
        </div>
      </div>

      <div className="flex-1 w-full rounded-[2.5rem] overflow-hidden border-2 border-border/60 shadow-2xl relative">
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
            radius={30}
            blur={20}
            max={1}
          />

          {points.map((p, idx) => (
            <Marker key={idx} position={[p[0], p[1]]}>
               <Popup>
                 <div className="p-1 font-bold text-primary uppercase text-xs tracking-widest">Active Pilot</div>
               </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default Heatmap;
