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
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);

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
          className="fixed inset-0 bg-gradient-to-br from-primary via-primary to-primary/90 flex flex-col items-center justify-center z-50 overflow-hidden"
          exit={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          {/* Animated background circles */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full border border-primary-foreground/10"
                style={{
                  width: `${(i + 1) * 200}px`,
                  height: `${(i + 1) * 200}px`,
                  left: '50%',
                  top: '50%',
                  x: '-50%',
                  y: '-50%',
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                  scale: [1, 1.5, 1],
                  opacity: [0.3, 0.1, 0.3],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: i * 0.4,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>

          {/* Floating particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-primary-foreground/20 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [-20, 20, -20],
                  x: [-10, 10, -10],
                  opacity: [0.2, 0.5, 0.2],
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>

          {/* Main content */}
          <motion.div
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ 
              type: "spring",
              stiffness: 150,
              damping: 12,
              delay: 0.2 
            }}
            className="relative z-10 flex flex-col items-center"
          >
            {/* Glowing backdrop */}
            <motion.div
              className="absolute -inset-20 bg-primary-foreground/10 rounded-full blur-3xl"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />

            {/* Icon container */}
            <motion.div
              initial={{ y: -50, rotateY: -180 }}
              animate={{ y: 0, rotateY: 0 }}
              transition={{ 
                type: "spring",
                stiffness: 120,
                damping: 10,
                delay: 0.4 
              }}
              className="relative"
            >
              {/* Outer ring */}
              <motion.div
                className="absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-primary-foreground/30 to-transparent"
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              />
              
              {/* Main icon box */}
              <motion.div
                className="relative w-28 h-28 rounded-[1.75rem] bg-primary-foreground flex items-center justify-center shadow-2xl"
                animate={{
                  boxShadow: [
                    "0 0 40px rgba(255,255,255,0.3)",
                    "0 0 80px rgba(255,255,255,0.5)",
                    "0 0 40px rgba(255,255,255,0.3)",
                  ],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <motion.div
                  animate={{ 
                    scale: [1, 1.15, 1],
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{ 
                    duration: 1.5, 
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <Zap className="w-14 h-14 text-primary" strokeWidth={2.5} fill="currentColor" />
                </motion.div>
              </motion.div>
            </motion.div>

            {/* Brand name with letter animation */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-8 flex items-center"
            >
              {'SweeftCom'.split('').map((letter, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: 0.8 + i * 0.05,
                    type: "spring",
                    stiffness: 200,
                    damping: 10
                  }}
                  className="text-5xl font-extrabold text-primary-foreground tracking-tight"
                >
                  {letter}
                </motion.span>
              ))}
            </motion.div>

            {/* Tagline with typing effect */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
              className="mt-3 overflow-hidden"
            >
              <motion.p
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                transition={{ delay: 1.3, duration: 0.5, ease: "easeOut" }}
                className="text-primary-foreground/90 text-lg font-medium tracking-wide"
              >
                ⚡ Delivery in minutes
              </motion.p>
            </motion.div>

            {/* Animated loading bar */}
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 200 }}
              transition={{ delay: 1.5, duration: 0.3 }}
              className="mt-10 h-1.5 bg-primary-foreground/20 rounded-full overflow-hidden"
            >
              <motion.div
                className="h-full bg-primary-foreground rounded-full"
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </motion.div>
          </motion.div>

          {/* Bottom city indicator */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.8 }}
            className="absolute bottom-16 flex flex-col items-center gap-2"
          >
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="text-2xl"
            >
              🏙️
            </motion.div>
            <p className="text-primary-foreground/70 text-sm font-medium tracking-wider uppercase">
              Aurangabad
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Splash;