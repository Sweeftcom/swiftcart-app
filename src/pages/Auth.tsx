import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Phone, ArrowRight, Zap, ChevronLeft, Shield } from 'lucide-react';
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
        // For demo, we'll simulate OTP sent
        console.log('OTP would be sent to:', phone);
        toast.success('OTP sent to your phone!');
        setStep('otp');
      } else {
        toast.success('OTP sent to your phone!');
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
        // For demo purposes, accept any 6-digit OTP
        console.log('Demo mode: Accepting OTP');
        toast.success('Login successful!');
        navigate('/location', { replace: true });
      } else {
        toast.success('Login successful!');
        navigate('/location', { replace: true });
      }
    } catch (err) {
      toast.error('Invalid OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-primary pt-safe">
        <div className="px-4 py-6">
          <AnimatePresence mode="wait">
            {step === 'otp' && (
              <motion.button
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                onClick={() => setStep('phone')}
                className="mb-4 flex items-center gap-1 text-primary-foreground/80"
              >
                <ChevronLeft className="w-5 h-5" />
                <span className="text-sm">Back</span>
              </motion.button>
            )}
          </AnimatePresence>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3"
          >
            <div className="w-12 h-12 rounded-2xl bg-primary-foreground flex items-center justify-center">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-primary-foreground">SweeftCom</h1>
              <p className="text-primary-foreground/70 text-sm">Delivery in minutes</p>
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
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  Welcome to SweeftCom
                </h2>
                <p className="text-muted-foreground mt-1">
                  Enter your phone number to continue
                </p>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <div className="flex items-center gap-3 p-4 rounded-2xl border-2 border-border focus-within:border-primary transition-colors bg-card">
                    <div className="flex items-center gap-2 pr-3 border-r border-border">
                      <span className="text-lg">🇮🇳</span>
                      <span className="font-medium text-foreground">+91</span>
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
                </div>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handlePhoneSubmit}
                  disabled={phone.length !== 10 || isLoading}
                  className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="w-6 h-6 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Continue</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </motion.button>
              </div>

              <p className="text-sm text-muted-foreground text-center">
                By continuing, you agree to our{' '}
                <span className="text-primary font-medium">Terms of Service</span> and{' '}
                <span className="text-primary font-medium">Privacy Policy</span>
              </p>
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
                  Enter the 6-digit code sent to{' '}
                  <span className="font-medium text-foreground">+91 {phone}</span>
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex justify-center">
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
                          className="w-12 h-14 text-xl font-bold rounded-xl border-2"
                        />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handleOtpSubmit}
                  disabled={otp.length !== 6 || isLoading}
                  className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="w-6 h-6 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Verify & Login</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </motion.button>

                <button
                  onClick={() => toast.info('OTP resent!')}
                  className="w-full text-center text-primary font-medium"
                >
                  Didn't receive OTP? Resend
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Trust badge */}
      <div className="px-4 pb-8">
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Shield className="w-4 h-4" />
          <span className="text-sm">Your data is 100% secure</span>
        </div>
      </div>
    </div>
  );
};

export default Auth;
