import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { MapPin, Search, Navigation, Clock, ChevronRight, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLocationStore } from '@/stores/locationStore';
import { DbStore } from '@/lib/supabase-types';
import { toast } from 'sonner';
import { ProfileService } from '@/services/ProfileService';
import { useAuth } from '@/hooks/useAuth';

const Location = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setSelectedLocation, setNearestStore, setHasCompletedLocationSelection } = useLocationStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [manualAddress, setManualAddress] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [stores, setStores] = useState<DbStore[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  useEffect(() => {
    const fetchStores = async () => {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('is_open', true);

      if (!error && data) {
        setStores(data as DbStore[]);
      }
    };
    fetchStores();
  }, []);

  // Nominatim Address Search Logic
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length > 2) {
        setIsSearching(true);
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery + ', Aurangabad')}&limit=5`
          );
          const data = await response.json();
          setSearchResults(data);
        } catch (error) {
          console.error('Nominatim error:', error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const findNearestStore = (lat: number, lng: number): DbStore | null => {
    if (stores.length === 0) return null;
    let nearest = stores[0];
    let minDistance = Infinity;
    stores.forEach((store) => {
      const distance = Math.sqrt(Math.pow(store.lat - lat, 2) + Math.pow(store.lng - lng, 2));
      if (distance < minDistance) {
        minDistance = distance;
        nearest = store;
      }
    });
    return nearest;
  };

  const handleSelectLocation = async (name: string, lat: number, lng: number) => {
    const nearest = findNearestStore(lat, lng);
    
    setSelectedLocation({ name, lat, lng, type: 'area' });
    if (nearest) setNearestStore(nearest);

    if (user) {
      await ProfileService.saveLocation(user.id, lat, lng, name);
    }

    setHasCompletedLocationSelection(true);
    toast.success(`📍 Location set to ${name}`);
    navigate('/home', { replace: true });
  };

  const handleManualSave = async () => {
    if (!manualAddress.trim()) return;
    // Default to Aurangabad coordinates if manual entry
    await handleSelectLocation(manualAddress, 19.8762, 75.3433);
  };

  return (
    <div className="min-h-screen bg-background pb-6">
      <div className="bg-primary pt-safe pb-8 px-4 text-primary-foreground relative overflow-hidden">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-4">
            <MapPin className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold">Where to deliver?</h1>
          <p className="opacity-70">Switching to Free Maps (OSM) for Aurangabad ⚡</p>
        </motion.div>
      </div>

      <div className="px-4 -mt-4">
        <div className="bg-card rounded-2xl shadow-lg p-4 mb-4 border border-border">
          <div className="flex flex-col gap-3">
             <div className="flex items-center gap-3 bg-secondary/50 p-3 rounded-xl">
               <MapPin className="w-5 h-5 text-primary" />
               <input
                 placeholder="Manual address (e.g. Nirala Bazar)"
                 value={manualAddress}
                 onChange={(e) => setManualAddress(e.target.value)}
                 className="bg-transparent outline-none flex-1 font-medium"
               />
               <button onClick={handleManualSave} className="bg-primary text-primary-foreground px-4 py-1.5 rounded-lg font-bold text-xs">
                 SAVE
               </button>
             </div>
             <div className="h-[1px] bg-border my-1" />
             <div className="flex items-center gap-3 px-2">
                <Search className="w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search for area (OSM)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-sm"
                />
                {isSearching && <Loader2 className="w-4 h-4 animate-spin" />}
             </div>
          </div>
        </div>

        <div className="space-y-2">
          {searchResults.map((result, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectLocation(result.display_name, parseFloat(result.lat), parseFloat(result.lon))}
              className="w-full bg-card border border-border rounded-xl p-4 flex items-center gap-4 text-left hover:bg-secondary/30"
            >
              <div className="text-xl">📍</div>
              <div className="flex-1">
                <p className="font-medium text-sm line-clamp-1">{result.display_name}</p>
                <p className="text-xs text-muted-foreground">Search via Nominatim</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Location;
