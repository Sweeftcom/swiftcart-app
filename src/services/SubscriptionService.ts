import { blink } from '../lib/blink';

/**
 * SubscriptionService (Sweeftcom Plus)
 * Core logic for recurring revenue and Churn reduction.
 * Powered by Blink SDK.
 */
export class SubscriptionService {
  /**
   * Check if current user has an active Sweeftcom Plus subscription
   */
  static async isSubscribed() {
    const user = await blink.auth.me();
    if (!user) return false;

    const subscriptions = await blink.db.subscriptions.list({
      where: { userId: user.id, status: 'active' },
      limit: 1
    });

    if (subscriptions.length === 0) return false;

    const sub = subscriptions[0];
    // Check if truly expired
    if (new Date(sub.expiryDate) < new Date()) return false;

    return true;
  }

  /**
   * Activate a new plan
   */
  static async purchasePlus(planType: 'monthly' | 'quarterly' | 'yearly') {
    const user = await blink.auth.me();
    if (!user) throw new Error('Auth required');

    const durationDays = planType === 'monthly' ? 30 : planType === 'quarterly' ? 90 : 365;
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + durationDays);

    const subscription = await blink.db.subscriptions.upsert({
      userId: user.id,
      planType,
      status: 'active',
      expiryDate: expiryDate.toISOString(),
      startDate: new Date().toISOString()
    });

    return subscription;
  }
}
