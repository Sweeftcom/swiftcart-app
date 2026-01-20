import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { MapPin, Search, Navigation, Clock, ChevronRight, Loader2, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLocationStore } from '@/stores/locationStore';
import { DbAurangabadLocation, DbStore } from '@/lib/supabase-types';
import { toast } from 'sonner';
import { ProfileService } from '@/services/ProfileService';
import { useAuth } from '@/hooks/useAuth';

const Location = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setSelectedLocation, setNearestStore, setHasCompletedLocationSelection } = useLocationStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [manualAddress, setManualAddress] = useState('');
  const [locations, setLocations] = useState<DbAurangabadLocation[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<DbAurangabadLocation[]>([]);
  const [stores, setStores] = useState<DbStore[]>([]);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [isSavingManual, setIsSavingManual] = useState(false);

  useEffect(() => {
    const fetchLocations = async () => {
      const { data, error } = await supabase
        .from('aurangabad_locations')
        .select('*')
        .eq('is_serviceable', true)
        .order('name');

      if (!error && data) {
        setLocations(data as DbAurangabadLocation[]);
        setFilteredLocations(data.slice(0, 8) as DbAurangabadLocation[]);
      }
    };

    const fetchStores = async () => {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('is_open', true);

      if (!error && data) {
        setStores(data as DbStore[]);
      }
    };

    fetchLocations();
    fetchStores();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = locations.filter(
        (loc) =>
          loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (loc.pincode && loc.pincode.includes(searchQuery))
      );
      setFilteredLocations(filtered);
    } else {
      setFilteredLocations(locations.slice(0, 8));
    }
  }, [searchQuery, locations]);

  const findNearestStore = (lat: number, lng: number): DbStore | null => {
    if (stores.length === 0) return null;

    let nearest = stores[0];
    let minDistance = Infinity;

    stores.forEach((store) => {
      const distance = Math.sqrt(
        Math.pow(store.lat - lat, 2) + Math.pow(store.lng - lng, 2)
      );
      if (distance < minDistance) {
        minDistance = distance;
        nearest = store;
      }
    });

    return nearest;
  };

  const handleSelectLocation = async (location: DbAurangabadLocation) => {
    const nearest = findNearestStore(location.lat, location.lng);
    
    setSelectedLocation({
      name: location.name,
      lat: location.lat,
      lng: location.lng,
      pincode: location.pincode || undefined,
      type: location.type,
    });

    if (nearest) {
      setNearestStore(nearest);
    }

    // Save to profile
    if (user) {
      await ProfileService.saveLocation(user.id, location.lat, location.lng, location.name);
    }

    setHasCompletedLocationSelection(true);
    toast.success(`📍 Location set to ${location.name}`);
    navigate('/home', { replace: true });
  };

  const handleSaveManualAddress = async () => {
    if (!manualAddress.trim()) {
      toast.error('Please enter an address');
      return;
    }

    setIsSavingManual(true);
    try {
      if (user) {
        // Saving manual address to profile. Coordinates default to Aurangabad center if unknown.
        await ProfileService.saveLocation(user.id, 19.8762, 75.3433, manualAddress);

        setSelectedLocation({
          name: manualAddress,
          lat: 19.8762,
          lng: 75.3433,
          type: 'area'
        });

        setHasCompletedLocationSelection(true);
        toast.success('Address saved manually! 🏠');
        navigate('/home', { replace: true });
      }
    } catch (err) {
      toast.error('Failed to save address');
    } finally {
      setIsSavingManual(false);
    }
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setIsDetectingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        let nearestLocation = locations[0];
        let minDistance = Infinity;

        locations.forEach((loc) => {
          const distance = Math.sqrt(
            Math.pow(loc.lat - latitude, 2) + Math.pow(loc.lng - longitude, 2)
          );
          if (distance < minDistance) {
            minDistance = distance;
            nearestLocation = loc;
          }
        });

        if (nearestLocation) {
          handleSelectLocation(nearestLocation);
        } else {
          toast.error("Sorry, we don't serve this area yet");
        }
        
        setIsDetectingLocation(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast.error('Failed to detect location. Please select manually.');
        setIsDetectingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  };

  const getLocationIcon = (type: string) => {
    switch (type) {
      case 'colony': return '🏘️';
      case 'society': return '🏢';
      case 'area': return '📍';
      case 'landmark': return '🏛️';
      case 'road': return '🛣️';
      case 'gully': return '🚶';
      default: return '📍';
    }
  };

  const getLocationLabel = (type: string) => {
    switch (type) {
      case 'colony': return 'Colony';
      case 'society': return 'Society';
      case 'area': return 'Area';
      case 'landmark': return 'Landmark';
      case 'road': return 'Main Road';
      case 'gully': return 'Gully';
      default: return 'Location';
    }
  };

  return (
    <div className="min-h-screen bg-background pb-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary via-primary to-primary/90 pt-safe pb-8 relative overflow-hidden">
        <div className="px-4 pt-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-12 h-12 bg-primary-foreground/20 rounded-full flex items-center justify-center mb-4"
            >
              <MapPin className="w-6 h-6 text-primary-foreground" />
            </motion.div>
            <h1 className="text-2xl font-bold text-primary-foreground">
              Select your location
            </h1>
            <p className="text-primary-foreground/70 mt-1">
              Serving Aurangabad city lightning fast ⚡
            </p>
          </motion.div>
        </div>
      </div>

      {/* Manual Override & Search */}
      <div className="px-4 -mt-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl shadow-lg p-4 mb-4 border-2 border-primary/10"
        >
          <div className="flex flex-col gap-3">
             <div className="flex items-center gap-3 bg-secondary/30 p-3 rounded-xl">
               <MapPin className="w-5 h-5 text-primary" />
               <input
                 placeholder="Type area manually (e.g. Nirala Bazar)"
                 value={manualAddress}
                 onChange={(e) => setManualAddress(e.target.value)}
                 className="bg-transparent outline-none flex-1 font-medium"
               />
               <button
                 onClick={handleSaveManualAddress}
                 disabled={isSavingManual}
                 className="bg-primary text-primary-foreground px-4 py-1.5 rounded-lg font-bold text-sm"
               >
                 {isSavingManual ? '...' : 'SAVE'}
               </button>
             </div>
             <div className="h-[1px] bg-border my-1" />
             <div className="flex items-center gap-3 px-2">
                <Search className="w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Or search popular colonies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
                />
             </div>
          </div>
        </motion.div>

        {/* Detect location button */}
        <button
          onClick={handleDetectLocation}
          disabled={isDetectingLocation}
          className="w-full bg-card rounded-2xl shadow-lg p-4 mb-6 flex items-center gap-4 border-2 border-primary/20 hover:border-primary/40 transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            {isDetectingLocation ? <Loader2 className="w-5 h-5 text-primary animate-spin" /> : <Navigation className="w-5 h-5 text-primary" />}
          </div>
          <div className="flex-1 text-left">
            <p className="font-semibold">Use GPS location</p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>

        {/* Locations list */}
        <div className="mb-4">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">
            {searchQuery ? 'Search Results' : 'Serviceable Areas'}
          </h3>
          
          <div className="space-y-2">
            {filteredLocations.map((location, index) => (
              <button
                key={location.id}
                onClick={() => handleSelectLocation(location)}
                className="w-full bg-card rounded-xl p-4 flex items-center gap-4 text-left hover:bg-secondary/50 transition-colors"
              >
                <div className="text-xl">{getLocationIcon(location.type)}</div>
                <div className="flex-1">
                  <p className="font-medium">{location.name}</p>
                  <p className="text-xs text-muted-foreground">{getLocationLabel(location.type)}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Location;
