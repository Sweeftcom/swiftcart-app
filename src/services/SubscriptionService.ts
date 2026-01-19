import { supabase } from '../lib/react-native/supabase-client';

/**
 * SubscriptionService (Sweeftcom Plus)
 * Core logic for recurring revenue and Churn reduction.
 */
export class SubscriptionService {
  /**
   * Check if current user has an active Sweeftcom Plus subscription
   */
  static async isSubscribed() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('subscriptions')
      .select('status, expiry_date')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (error || !data) return false;

    // Check if truly expired
    if (new Date(data.expiry_date) < new Date()) return false;

    return true;
  }

  /**
   * Activate a new plan (Conceptual payment integration)
   */
  static async purchasePlus(planType: 'monthly' | 'quarterly' | 'yearly') {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Auth required');

    const durationDays = planType === 'monthly' ? 30 : planType === 'quarterly' ? 90 : 365;
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + durationDays);

    const { error } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: user.id,
        plan_type: planType,
        status: 'active',
        expiry_date: expiryDate.toISOString(),
        start_date: new Date().toISOString()
      });

    if (error) throw error;
  }
}
