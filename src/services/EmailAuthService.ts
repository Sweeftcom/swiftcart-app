import { supabase } from '../lib/react-native/supabase-client';

/**
 * EmailAuthService
 * Handles the 6-digit Email OTP login flow for Vendors and Drivers.
 * Replaces unreliable Magic Links with high-deliverability OTPs.
 */
export class EmailAuthService {
  /**
   * Step 1: Send OTP to Email
   */
  static async sendOtp(email: string) {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false, // For existing Vendors/Drivers
      },
    });

    if (error) {
      console.error('Failed to send OTP:', error.message);
      throw error;
    }

    return data;
  }

  /**
   * Step 2: Verify OTP and Login
   */
  static async verifyOtp(email: string, token: string) {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });

    if (error) {
      console.error('OTP Verification Failed:', error.message);
      throw error;
    }

    return data.session;
  }
}
