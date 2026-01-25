import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowRight, Zap, Shield } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useLocationStore } from '@/stores/locationStore';
import { blink } from '@/lib/blink';

const Auth = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasCompletedLocationSelection } = useLocationStore();

  // Redirect if already logged in
  if (user) {
    if (!hasCompletedLocationSelection) {
      navigate('/location', { replace: true });
    } else {
      navigate('/home', { replace: true });
    }
    return null;
  }

  const handleLogin = () => {
    blink.auth.login(window.location.origin + '/location');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/20 flex flex-col overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 -left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl"
          animate={{
            x: [0, 30, 0],
            y: [0, -20, 0],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-40 -right-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl"
          animate={{
            x: [0, -40, 0],
            y: [0, 30, 0],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 px-6 relative z-10 flex flex-col justify-center">
        <motion.div
          key="welcome"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col h-full max-w-md mx-auto w-full pt-20"
        >
          {/* Logo & Branding */}
          <motion.div variants={itemVariants} className="text-center mb-12">
            <motion.div 
              className="w-24 h-24 mx-auto rounded-[2rem] bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-2xl shadow-primary/30 mb-8"
              animate={{ 
                boxShadow: [
                  "0 25px 50px -12px rgba(var(--primary), 0.2)",
                  "0 25px 50px -12px rgba(var(--primary), 0.4)",
                  "0 25px 50px -12px rgba(var(--primary), 0.2)",
                ]
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Zap className="w-12 h-12 text-primary-foreground" fill="currentColor" />
            </motion.div>
            <h1 className="text-5xl font-bold tracking-tight text-foreground mb-3">SweeftCom</h1>
            <p className="text-muted-foreground text-xl">Lightning-fast delivery ⚡</p>
          </motion.div>

          {/* Features */}
          <motion.div variants={itemVariants} className="space-y-4 mb-16">
            {[
              { emoji: '🚀', text: 'Delivery in 10 minutes' },
              { emoji: '🥬', text: 'Fresh daily essentials' },
              { emoji: '💰', text: 'Lowest prices guaranteed' },
            ].map((item, i) => (
              <motion.div
                key={i}
                className="flex items-center gap-5 bg-card/40 backdrop-blur-md p-5 rounded-3xl border border-border/40 shadow-sm"
              >
                <span className="text-3xl">{item.emoji}</span>
                <span className="font-semibold text-lg text-foreground">{item.text}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* Auth Buttons */}
          <motion.div variants={itemVariants} className="space-y-5 mt-auto pb-12">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleLogin}
              className="w-full py-5 rounded-[1.5rem] bg-primary text-primary-foreground font-bold text-xl flex items-center justify-center gap-3 shadow-2xl shadow-primary/30 hover:bg-primary/90 transition-all"
            >
              <Mail className="w-6 h-6" />
              <span>Get Started</span>
              <ArrowRight className="w-6 h-6 ml-1" />
            </motion.button>

            <p className="text-sm text-center text-muted-foreground">
              By continuing, you agree to our{' '}
              <span className="text-primary font-medium">Terms</span> &{' '}
              <span className="text-primary font-medium">Privacy Policy</span>
            </p>
          </motion.div>
        </motion.div>
      </div>

      {/* Trust badge */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="px-6 pb-10 relative z-10"
      >
        <div className="flex items-center justify-center gap-3 text-muted-foreground bg-card/30 backdrop-blur-md py-4 rounded-3xl border border-border/30 max-w-md mx-auto">
          <Shield className="w-5 h-5 text-primary" />
          <span className="text-sm font-semibold">Secure & encrypted payments</span>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
