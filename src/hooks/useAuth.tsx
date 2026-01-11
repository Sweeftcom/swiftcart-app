import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { DbProfile } from '@/lib/supabase-types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: DbProfile | null;
  isLoading: boolean;
  sendEmailOtp: (email: string) => Promise<{ error: Error | null; isExistingUser?: boolean }>;
  verifyEmailOtp: (email: string, otp: string) => Promise<{ error: Error | null; isNewUser?: boolean }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<DbProfile>) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<DbProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer profile fetch with setTimeout to avoid deadlock
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!error && data) {
      setProfile(data as DbProfile);
    }
  };

  const checkExistingUser = async (email: string): Promise<boolean> => {
    // Check if user exists in profiles table
    const { data } = await supabase
      .from('profiles')
      .select('email')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();
    
    return !!data;
  };

  const sendEmailOtp = async (email: string): Promise<{ error: Error | null; isExistingUser?: boolean }> => {
    try {
      const isExistingUser = await checkExistingUser(email);
      
      const response = await supabase.functions.invoke('send-email-otp', {
        body: { email: email.toLowerCase().trim() },
      });

      if (response.error) {
        return { error: new Error(response.error.message || 'Failed to send OTP') };
      }

      if (response.data?.error) {
        return { error: new Error(response.data.error) };
      }

      return { error: null, isExistingUser };
    } catch (err: any) {
      return { error: new Error(err.message || 'Network error') };
    }
  };

  const verifyEmailOtp = async (email: string, otp: string): Promise<{ error: Error | null; isNewUser?: boolean }> => {
    try {
      const response = await supabase.functions.invoke('verify-email-otp', {
        body: { email: email.toLowerCase().trim(), otp },
      });

      if (response.error) {
        return { error: new Error(response.error.message || 'Verification failed') };
      }

      if (response.data?.error) {
        return { error: new Error(response.data.error) };
      }

      // If verification successful, use the token_hash to complete auth
      if (response.data?.success && response.data?.verification?.token_hash) {
        const { data: authData, error: authError } = await supabase.auth.verifyOtp({
          token_hash: response.data.verification.token_hash,
          type: 'magiclink',
        });

        if (authError) {
          return { error: new Error(authError.message) };
        }
      }

      return { error: null, isNewUser: response.data?.isNewUser };
    } catch (err: any) {
      return { error: new Error(err.message || 'Verification failed') };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setUser(null);
    setSession(null);
  };

  const updateProfile = async (updates: Partial<DbProfile>) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', user.id);

    if (!error) {
      setProfile(prev => prev ? { ...prev, ...updates } : null);
    }

    return { error: error as Error | null };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isLoading,
        sendEmailOtp,
        verifyEmailOtp,
        signOut,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
