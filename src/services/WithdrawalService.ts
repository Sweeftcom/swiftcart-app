import { supabase } from '../lib/react-native/supabase-client';

/**
 * WithdrawalService
 * Manages rider earnings withdrawals and wallet health.
 */
export class WithdrawalService {
  /**
   * Fetch current wallet balance and recent transactions
   */
  static async getWalletDetails() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select(`
        balance,
        transactions:wallet_transactions(*)
      `)
      .eq('user_id', user.id)
      .single();

    if (walletError) throw walletError;

    // Calculate pending earnings (conceptual: orders delivered but not yet settled in wallet)
    const { data: pendingOrders } = await supabase
      .from('orders')
      .select('total')
      .eq('driver_id', (await this.getDriverId()))
      .eq('status', 'delivered')
      .eq('payment_status', 'completed');

    const pendingBalance = pendingOrders?.reduce((acc, curr) => acc + (Number(curr.total) * 0.15), 0) || 0;

    return {
      settledBalance: wallet.balance,
      pendingBalance,
      transactions: wallet.transactions
    };
  }

  /**
   * Initiate a payout request to UPI
   */
  static async requestPayout(amount: number, upiId: string) {
    const driverId = await this.getDriverId();

    const { data, error } = await supabase.rpc('request_withdrawal', {
      p_driver_id: driverId,
      p_amount: amount,
      p_upi_id: upiId
    });

    if (error) {
      console.error('Withdrawal failed:', error.message);
      throw error;
    }

    return data;
  }

  private static async getDriverId() {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: driver } = await supabase
      .from('drivers')
      .select('id')
      .eq('user_id', user?.id)
      .single();
    return driver?.id;
  }
}
