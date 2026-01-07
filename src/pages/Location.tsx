import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
  const [detectedLocation, setDetectedLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    // Fetch Aurangabad locations
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

    // Fetch stores
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
    toast.success(`Location set to ${location.name}`);
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
        setDetectedLocation({ lat: latitude, lng: longitude });
        
        // Find nearest location from our list
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
          toast.error('Sorry, we don\'t serve this area yet');
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
      default: return '📍';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary pt-safe pb-6">
        <div className="px-4 pt-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-2xl font-bold text-primary-foreground">
              Select your location
            </h1>
            <p className="text-primary-foreground/70 mt-1">
              To find stores near you in Aurangabad
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
          className="bg-card rounded-2xl shadow-lg p-4 mb-4"
        >
          <div className="flex items-center gap-3">
            <Search className="w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search for area, colony, landmark..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
              autoFocus
            />
          </div>
        </motion.div>

        {/* Detect location button */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleDetectLocation}
          disabled={isDetectingLocation}
          className="w-full bg-card rounded-2xl shadow-lg p-4 mb-6 flex items-center gap-4 border-2 border-primary/20"
        >
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            {isDetectingLocation ? (
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            ) : (
              <Navigation className="w-6 h-6 text-primary" />
            )}
          </div>
          <div className="flex-1 text-left">
            <p className="font-semibold text-foreground">
              {isDetectingLocation ? 'Detecting...' : 'Use current location'}
            </p>
            <p className="text-sm text-muted-foreground">
              Get location automatically via GPS
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </motion.button>

        {/* Locations list */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            {searchQuery ? 'Search Results' : 'Popular Locations'}
          </h3>
          <div className="space-y-2">
            {filteredLocations.map((location, index) => (
              <motion.button
                key={location.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelectLocation(location)}
                className="w-full bg-card rounded-xl p-4 flex items-center gap-4 text-left hover:bg-secondary/50 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-lg">
                  {getLocationIcon(location.type)}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{location.name}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="capitalize">{location.type}</span>
                    {location.pincode && (
                      <>
                        <span>•</span>
                        <span>{location.pincode}</span>
                      </>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </motion.button>
            ))}

            {filteredLocations.length === 0 && searchQuery && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No locations found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Try searching for a different area
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Service area notice */}
        <div className="bg-accent/10 rounded-xl p-4 flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
            <Clock className="w-4 h-4 text-accent-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              Currently serving Aurangabad city
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              We deliver to CIDCO, Garkheda, Osmanpura, Jalna Road, and more areas!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Location;
