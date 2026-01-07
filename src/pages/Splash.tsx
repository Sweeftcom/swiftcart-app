import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLocationStore } from '@/stores/locationStore';
import { Zap } from 'lucide-react';

const Splash = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const { hasCompletedLocationSelection } = useLocationStore();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Show splash for at least 2 seconds
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!showSplash && !isLoading) {
      if (!user) {
        navigate('/auth', { replace: true });
      } else if (!hasCompletedLocationSelection) {
        navigate('/location', { replace: true });
      } else {
        navigate('/home', { replace: true });
      }
    }
  }, [showSplash, isLoading, user, hasCompletedLocationSelection, navigate]);

  return (
    <AnimatePresence>
      {showSplash && (
        <motion.div
          className="fixed inset-0 bg-primary flex flex-col items-center justify-center z-50"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Background pattern */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              className="absolute -top-1/4 -left-1/4 w-[150%] h-[150%]"
              animate={{ rotate: 360 }}
              transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
            >
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-96 h-1 bg-primary-foreground/5"
                  style={{
                    top: '50%',
                    left: '50%',
                    transformOrigin: 'left center',
                    transform: `rotate(${i * 45}deg)`,
                  }}
                />
              ))}
            </motion.div>
          </div>

          {/* Logo */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ 
              type: "spring",
              stiffness: 200,
              damping: 15,
              delay: 0.2 
            }}
            className="relative z-10 flex flex-col items-center"
          >
            {/* Icon */}
            <motion.div
              initial={{ y: -20 }}
              animate={{ y: 0 }}
              transition={{ delay: 0.4 }}
              className="w-24 h-24 rounded-3xl bg-primary-foreground flex items-center justify-center mb-6 shadow-2xl"
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                }}
                transition={{ 
                  duration: 1.5, 
                  repeat: Infinity,
                  repeatType: "loop" 
                }}
              >
                <Zap className="w-12 h-12 text-primary" strokeWidth={2.5} />
              </motion.div>
            </motion.div>

            {/* Brand name */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-4xl font-extrabold text-primary-foreground tracking-tight"
            >
              SweeftCom
            </motion.h1>

            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-primary-foreground/80 mt-2 text-sm font-medium"
            >
              Delivery in minutes
            </motion.p>

            {/* Loading dots */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="flex items-center gap-1.5 mt-8"
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full bg-primary-foreground"
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    delay: i * 0.15,
                  }}
                />
              ))}
            </motion.div>
          </motion.div>

          {/* City */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="absolute bottom-12 text-primary-foreground/60 text-sm"
          >
            🏙️ Aurangabad
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Splash;
