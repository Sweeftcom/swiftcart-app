import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowRight, Zap, ChevronLeft, Shield, Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useLocationStore } from '@/stores/locationStore';
import { toast } from 'sonner';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

const Auth = () => {
  const navigate = useNavigate();
  const { sendEmailOtp, verifyEmailOtp, user } = useAuth();
  const { hasCompletedLocationSelection } = useLocationStore();
  const [step, setStep] = useState<'welcome' | 'email' | 'otp'>('welcome');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExistingUser, setIsExistingUser] = useState(false);

  // Redirect if already logged in
  if (user) {
    if (!hasCompletedLocationSelection) {
      navigate('/location', { replace: true });
    } else {
      navigate('/home', { replace: true });
    }
    return null;
  }

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleEmailSubmit = async () => {
    if (!isValidEmail(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      const { error, isExistingUser: existing } = await sendEmailOtp(email);
      if (error) {
        toast.error(error.message || 'Failed to send OTP');
      } else {
        setIsExistingUser(existing || false);
        if (existing) {
          toast.success('Welcome back! OTP sent to your email 📧');
        } else {
          toast.success('OTP sent to your email! 📧');
        }
        setStep('otp');
      }
    } catch (err) {
      toast.error('Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async () => {
    if (otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    setIsLoading(true);
    try {
      const { error, isNewUser } = await verifyEmailOtp(email, otp);
      if (error) {
        toast.error(error.message || 'Invalid OTP');
      } else {
        toast.success(isNewUser ? 'Welcome to SweeftCom! 🎉' : 'Welcome back! 👋');
        navigate('/location', { replace: true });
      }
    } catch (err) {
      toast.error('Invalid OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setIsLoading(true);
    try {
      const { error } = await sendEmailOtp(email);
      if (error) {
        toast.error(error.message || 'Failed to resend OTP');
      } else {
        toast.success('OTP resent! 📧');
      }
    } catch (err) {
      toast.error('Failed to resend OTP');
    } finally {
      setIsLoading(false);
    }
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
        <motion.div
          className="absolute top-1/2 left-1/2 w-64 h-64 bg-primary/5 rounded-full blur-2xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Header */}
      <div className="relative z-10 pt-safe">
        <div className="px-6 py-8">
          <AnimatePresence mode="wait">
            {step !== 'welcome' && (
              <motion.button
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                onClick={() => {
                  if (step === 'otp') {
                    setStep('email');
                    setOtp('');
                  } else {
                    setStep('welcome');
                    setEmail('');
                  }
                }}
                className="mb-6 flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
                <span className="text-sm font-medium">Back</span>
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 relative z-10">
        <AnimatePresence mode="wait">
          {step === 'welcome' && (
            <motion.div
              key="welcome"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, x: -50 }}
              className="flex flex-col h-full"
            >
              {/* Logo & Branding */}
              <motion.div variants={itemVariants} className="text-center mb-8">
                <motion.div 
                  className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-2xl shadow-primary/30 mb-6"
                  animate={{ 
                    boxShadow: [
                      "0 25px 50px -12px rgba(var(--primary), 0.2)",
                      "0 25px 50px -12px rgba(var(--primary), 0.4)",
                      "0 25px 50px -12px rgba(var(--primary), 0.2)",
                    ]
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <Zap className="w-10 h-10 text-primary-foreground" fill="currentColor" />
                </motion.div>
                <h1 className="text-4xl font-bold text-foreground mb-2">SweeftCom</h1>
                <p className="text-muted-foreground text-lg">Delivery in minutes ⚡</p>
              </motion.div>

              {/* Features */}
              <motion.div variants={itemVariants} className="space-y-3 mb-10">
                {[
                  { emoji: '🚀', text: '10-minute lightning delivery' },
                  { emoji: '🥬', text: 'Fresh groceries & essentials' },
                  { emoji: '💎', text: 'Best prices, always' },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                    className="flex items-center gap-4 bg-card/50 backdrop-blur-sm p-4 rounded-2xl border border-border/50"
                  >
                    <span className="text-2xl">{item.emoji}</span>
                    <span className="font-medium text-foreground">{item.text}</span>
                  </motion.div>
                ))}
              </motion.div>

              {/* Auth Buttons */}
              <motion.div variants={itemVariants} className="space-y-4 mt-auto pb-8">
                {/* Email Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setStep('email')}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary to-primary/90 text-primary-foreground font-semibold text-lg flex items-center justify-center gap-3 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
                >
                  <Mail className="w-5 h-5" />
                  <span>Continue with Email</span>
                </motion.button>

                <p className="text-xs text-center text-muted-foreground pt-2">
                  By continuing, you agree to our{' '}
                  <span className="text-primary">Terms</span> &{' '}
                  <span className="text-primary">Privacy Policy</span>
                </p>
              </motion.div>
            </motion.div>
          )}

          {step === 'email' && (
            <motion.div
              key="email"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-6"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <Sparkles className="w-6 h-6 text-primary" />
                  <h2 className="text-3xl font-bold text-foreground">
                    Let's get started
                  </h2>
                </div>
                <p className="text-muted-foreground text-lg">
                  Enter your email and we'll send you a magic code
                </p>
              </motion.div>

              <motion.div 
                className="space-y-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-accent rounded-2xl opacity-0 group-focus-within:opacity-100 blur transition-all duration-300" />
                  <div className="relative flex items-center gap-3 p-4 rounded-2xl border-2 border-border focus-within:border-transparent bg-card transition-all">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                    <input
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value.toLowerCase().trim())}
                      onKeyDown={(e) => e.key === 'Enter' && handleEmailSubmit()}
                      className="flex-1 bg-transparent outline-none text-lg font-medium text-foreground placeholder:text-muted-foreground"
                      autoFocus
                    />
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handleEmailSubmit}
                  disabled={!isValidEmail(email) || isLoading}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary to-primary/90 text-primary-foreground font-semibold text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20 hover:shadow-xl transition-all"
                >
                  {isLoading ? (
                    <motion.div
                      className="w-6 h-6 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                  ) : (
                    <>
                      <span>Send Magic Code</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </motion.button>
              </motion.div>
            </motion.div>
          )}

          {step === 'otp' && (
            <motion.div
              key="otp"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-6"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h2 className="text-3xl font-bold text-foreground mb-2">
                  {isExistingUser ? 'Welcome back! 👋' : 'Check your inbox ✉️'}
                </h2>
                <p className="text-muted-foreground">
                  {isExistingUser ? (
                    <>We found your account! Enter the code sent to <span className="font-semibold text-foreground">{email}</span></>
                  ) : (
                    <>Enter the 6-digit code sent to <span className="font-semibold text-foreground">{email}</span></>
                  )}
                </p>
              </motion.div>

              <motion.div 
                className="space-y-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <motion.div 
                  className="flex justify-center"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                >
                  <InputOTP
                    value={otp}
                    onChange={setOtp}
                    maxLength={6}
                  >
                    <InputOTPGroup className="gap-2">
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <InputOTPSlot
                          key={i}
                          index={i}
                          className="w-12 h-14 text-xl font-bold rounded-xl border-2 bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </motion.div>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handleOtpSubmit}
                  disabled={otp.length !== 6 || isLoading}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary to-primary/90 text-primary-foreground font-semibold text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20 hover:shadow-xl transition-all"
                >
                  {isLoading ? (
                    <motion.div
                      className="w-6 h-6 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                  ) : (
                    <>
                      <span>{isExistingUser ? 'Sign In' : 'Create Account'}</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </motion.button>

                <motion.div 
                  className="text-center space-y-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <p className="text-sm text-muted-foreground">
                    Didn't receive the code?
                  </p>
                  <button
                    onClick={handleResendOtp}
                    disabled={isLoading}
                    className="text-primary font-semibold hover:underline disabled:opacity-50 transition-all"
                  >
                    Resend Code
                  </button>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Trust badge */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="px-6 pb-8 relative z-10"
      >
        <div className="flex items-center justify-center gap-2 text-muted-foreground bg-card/50 backdrop-blur-sm py-3 rounded-2xl border border-border/50">
          <Shield className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Your data is 100% secure</span>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
