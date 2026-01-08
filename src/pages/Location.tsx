import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { MapPin, Search, Navigation, Clock, ChevronRight, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLocationStore } from '@/stores/locationStore';
import { DbAurangabadLocation, DbStore } from '@/lib/supabase-types';
import { toast } from 'sonner';

const Location = () => {
  const navigate = useNavigate();
  const { setSelectedLocation, setNearestStore, setHasCompletedLocationSelection } = useLocationStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [locations, setLocations] = useState<DbAurangabadLocation[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<DbAurangabadLocation[]>([]);
  const [stores, setStores] = useState<DbStore[]>([]);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

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

  const handleSelectLocation = (location: DbAurangabadLocation) => {
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

    setHasCompletedLocationSelection(true);
    toast.success(`📍 Location set to ${location.name}`);
    navigate('/home', { replace: true });
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
        {/* Decorative elements */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary-foreground/10 rounded-full" />
        <div className="absolute bottom-0 -left-10 w-24 h-24 bg-primary-foreground/5 rounded-full" />
        
        <div className="px-4 pt-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="w-12 h-12 bg-primary-foreground/20 rounded-full flex items-center justify-center mb-4"
            >
              <MapPin className="w-6 h-6 text-primary-foreground" />
            </motion.div>
            <h1 className="text-2xl font-bold text-primary-foreground">
              Select your location
            </h1>
            <p className="text-primary-foreground/70 mt-1">
              To find dark stores near you in Aurangabad
            </p>
          </motion.div>
        </div>
      </div>

      {/* Search & Actions */}
      <div className="px-4 -mt-4">
        {/* Search bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl shadow-lg p-1 mb-4"
        >
          <div className="flex items-center gap-3 px-4 py-3">
            <Search className="w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search colony, society, gully, landmark..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
              autoFocus
            />
            {searchQuery && (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                onClick={() => setSearchQuery('')}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* Detect location button */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={handleDetectLocation}
          disabled={isDetectingLocation}
          className="w-full bg-card rounded-2xl shadow-lg p-4 mb-6 flex items-center gap-4 border-2 border-primary/20 hover:border-primary/40 transition-colors"
        >
          <motion.div 
            className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center"
            animate={isDetectingLocation ? { rotate: 360 } : {}}
            transition={{ duration: 2, repeat: isDetectingLocation ? Infinity : 0, ease: "linear" }}
          >
            {isDetectingLocation ? (
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            ) : (
              <Navigation className="w-6 h-6 text-primary" />
            )}
          </motion.div>
          <div className="flex-1 text-left">
            <p className="font-semibold text-foreground">
              {isDetectingLocation ? 'Detecting your location...' : 'Use current location'}
            </p>
            <p className="text-sm text-muted-foreground">
              {isDetectingLocation ? 'Please wait' : 'Get location automatically via GPS'}
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </motion.button>

        {/* Locations list */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
            <span>{searchQuery ? '🔍 Search Results' : '⭐ Popular Locations'}</span>
            {filteredLocations.length > 0 && (
              <span className="text-xs bg-secondary px-2 py-0.5 rounded-full">
                {filteredLocations.length}
              </span>
            )}
          </h3>
          
          <AnimatePresence mode="popLayout">
            <div className="space-y-2">
              {filteredLocations.map((location, index) => (
                <motion.button
                  key={location.id}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ delay: index * 0.03 }}
                  whileHover={{ scale: 1.01, x: 4 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => handleSelectLocation(location)}
                  className="w-full bg-card rounded-xl p-4 flex items-center gap-4 text-left hover:bg-secondary/50 transition-colors shadow-sm hover:shadow-md"
                >
                  <div className="w-11 h-11 rounded-full bg-secondary flex items-center justify-center text-xl">
                    {getLocationIcon(location.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{location.name}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="bg-secondary/70 px-2 py-0.5 rounded text-xs font-medium">
                        {getLocationLabel(location.type)}
                      </span>
                      {location.pincode && (
                        <>
                          <span>•</span>
                          <span>{location.pincode}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                </motion.button>
              ))}

              {filteredLocations.length === 0 && searchQuery && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <div className="text-4xl mb-3">🔍</div>
                  <p className="text-foreground font-medium">No locations found</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Try searching for a different area or colony
                  </p>
                </motion.div>
              )}
            </div>
          </AnimatePresence>
        </div>

        {/* Service area notice */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-r from-accent/20 to-accent/10 rounded-xl p-4 flex items-start gap-3 border border-accent/20"
        >
          <div className="w-10 h-10 rounded-full bg-accent/30 flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5 text-accent-foreground" />
          </div>
          <div>
            <p className="font-semibold text-foreground">
              🏙️ Serving Aurangabad City
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              CIDCO, Garkheda, Osmanpura, Jalna Road, Kranti Chowk, Shahnoorwadi, and 50+ more areas!
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Location;