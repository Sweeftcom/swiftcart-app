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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
        }
      }
    );

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
      
      // Using standard signInWithOtp for 6-digit Email OTP
      const { error } = await supabase.auth.signInWithOtp({
        email: email.toLowerCase().trim(),
        options: {
          shouldCreateUser: true,
        }
      });

      if (error) {
        return { error: new Error(error.message || 'Failed to send OTP') };
      }

      return { error: null, isExistingUser };
    } catch (err: any) {
      return { error: new Error(err.message || 'Network error') };
    }
  };

  const verifyEmailOtp = async (email: string, otp: string): Promise<{ error: Error | null; isNewUser?: boolean }> => {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.toLowerCase().trim(),
        token: otp,
        type: 'email',
      });

      if (error) {
        return { error: new Error(error.message || 'Verification failed') };
      }

      return { error: null, isNewUser: !profile?.name };
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
