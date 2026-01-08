import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Phone, ArrowRight, Zap, ChevronLeft, Shield, UserPlus, LogIn } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useLocationStore } from '@/stores/locationStore';
import { toast } from 'sonner';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

const Auth = () => {
  const navigate = useNavigate();
  const { signInWithOtp, verifyOtp, user } = useAuth();
  const { hasCompletedLocationSelection } = useLocationStore();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isNewUser, setIsNewUser] = useState(true);

  // Redirect if already logged in
  if (user) {
    if (!hasCompletedLocationSelection) {
      navigate('/location', { replace: true });
    } else {
      navigate('/home', { replace: true });
    }
    return null;
  }

  const handlePhoneSubmit = async () => {
    if (phone.length !== 10) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await signInWithOtp(`+91${phone}`);
      if (error) {
        toast.error(error.message || 'Failed to send OTP');
      } else {
        toast.success('OTP sent to your phone! 📱');
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
      const { error } = await verifyOtp(`+91${phone}`, otp);
      if (error) {
        toast.error(error.message || 'Invalid OTP');
      } else {
        toast.success(isNewUser ? 'Account created successfully! 🎉' : 'Welcome back! 👋');
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
      const { error } = await signInWithOtp(`+91${phone}`);
      if (error) {
        toast.error(error.message || 'Failed to resend OTP');
      } else {
        toast.success('OTP resent! 📱');
      }
    } catch (err) {
      toast.error('Failed to resend OTP');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary via-primary to-primary/90 pt-safe relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary-foreground/10 rounded-full" />
        <div className="absolute top-10 -left-10 w-24 h-24 bg-primary-foreground/5 rounded-full" />
        
        <div className="px-4 py-6 relative z-10">
          <AnimatePresence mode="wait">
            {step === 'otp' && (
              <motion.button
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                onClick={() => {
                  setStep('phone');
                  setOtp('');
                }}
                className="mb-4 flex items-center gap-1 text-primary-foreground/80 hover:text-primary-foreground transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
                <span className="text-sm font-medium">Back</span>
              </motion.button>
            )}
          </AnimatePresence>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4"
          >
            <motion.div 
              className="w-14 h-14 rounded-2xl bg-primary-foreground flex items-center justify-center shadow-lg"
              animate={{ 
                boxShadow: [
                  "0 0 20px rgba(255,255,255,0.2)",
                  "0 0 40px rgba(255,255,255,0.4)",
                  "0 0 20px rgba(255,255,255,0.2)",
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Zap className="w-7 h-7 text-primary" fill="currentColor" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold text-primary-foreground">SweeftCom</h1>
              <p className="text-primary-foreground/70 text-sm">⚡ Delivery in minutes</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-8">
        <AnimatePresence mode="wait">
          {step === 'phone' ? (
            <motion.div
              key="phone"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Toggle buttons */}
              <div className="flex gap-2 p-1 bg-secondary rounded-2xl">
                <button
                  onClick={() => setIsNewUser(true)}
                  className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-semibold transition-all ${
                    isNewUser 
                      ? 'bg-primary text-primary-foreground shadow-md' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <UserPlus className="w-4 h-4" />
                  Sign Up
                </button>
                <button
                  onClick={() => setIsNewUser(false)}
                  className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-semibold transition-all ${
                    !isNewUser 
                      ? 'bg-primary text-primary-foreground shadow-md' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <LogIn className="w-4 h-4" />
                  Login
                </button>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  {isNewUser ? 'Create your account' : 'Welcome back!'}
                </h2>
                <p className="text-muted-foreground mt-1">
                  {isNewUser 
                    ? 'Enter your phone number to get started' 
                    : 'Enter your phone number to login'}
                </p>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <div className="flex items-center gap-3 p-4 rounded-2xl border-2 border-border focus-within:border-primary focus-within:shadow-md transition-all bg-card">
                    <div className="flex items-center gap-2 pr-3 border-r border-border">
                      <span className="text-lg">🇮🇳</span>
                      <span className="font-semibold text-foreground">+91</span>
                    </div>
                    <Phone className="w-5 h-5 text-muted-foreground" />
                    <input
                      type="tel"
                      placeholder="Enter phone number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className="flex-1 bg-transparent outline-none text-lg font-medium text-foreground placeholder:text-muted-foreground"
                      autoFocus
                    />
                  </div>
                  {phone.length > 0 && phone.length < 10 && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-muted-foreground mt-2 ml-1"
                    >
                      {10 - phone.length} more digits needed
                    </motion.p>
                  )}
                </div>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handlePhoneSubmit}
                  disabled={phone.length !== 10 || isLoading}
                  className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-shadow"
                >
                  {isLoading ? (
                    <motion.div
                      className="w-6 h-6 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                  ) : (
                    <>
                      <span>{isNewUser ? 'Get OTP' : 'Continue'}</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </motion.button>
              </div>

              <p className="text-sm text-muted-foreground text-center px-4">
                By continuing, you agree to our{' '}
                <span className="text-primary font-medium">Terms of Service</span> and{' '}
                <span className="text-primary font-medium">Privacy Policy</span>
              </p>

              {/* Features highlight for new users */}
              {isNewUser && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-8 space-y-3"
                >
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Why choose SweeftCom?</p>
                  <div className="space-y-2">
                    {[
                      { emoji: '⚡', text: '10-minute delivery' },
                      { emoji: '🛒', text: 'Fresh groceries & essentials' },
                      { emoji: '💰', text: 'Best prices guaranteed' },
                    ].map((item, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + i * 0.1 }}
                        className="flex items-center gap-3 text-foreground"
                      >
                        <span className="text-xl">{item.emoji}</span>
                        <span className="font-medium">{item.text}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="otp"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  Verify your number
                </h2>
                <p className="text-muted-foreground mt-1">
                  Enter the 6-digit OTP sent to{' '}
                  <span className="font-semibold text-foreground">+91 {phone}</span>
                </p>
              </div>

              <div className="space-y-6">
                <motion.div 
                  className="flex justify-center"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
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
                          className="w-12 h-14 text-xl font-bold rounded-xl border-2 focus:border-primary focus:ring-2 focus:ring-primary/20"
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
                  className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-shadow"
                >
                  {isLoading ? (
                    <motion.div
                      className="w-6 h-6 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                  ) : (
                    <>
                      <span>{isNewUser ? 'Create Account' : 'Verify & Login'}</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </motion.button>

                <div className="text-center space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Didn't receive the OTP?
                  </p>
                  <button
                    onClick={handleResendOtp}
                    disabled={isLoading}
                    className="text-primary font-semibold hover:underline disabled:opacity-50"
                  >
                    Resend OTP
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Trust badge */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="px-4 pb-8"
      >
        <div className="flex items-center justify-center gap-2 text-muted-foreground bg-secondary/50 py-3 rounded-xl">
          <Shield className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Your data is 100% secure</span>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;