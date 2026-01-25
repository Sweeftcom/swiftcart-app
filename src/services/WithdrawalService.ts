import { blink } from '../lib/blink';

/**
 * WithdrawalService
 * Manages rider earnings withdrawals and wallet health.
 * Powered by Blink SDK.
 */
export class WithdrawalService {
  /**
   * Fetch current wallet balance and recent transactions
   */
  static async getWalletDetails() {
    const user = await blink.auth.me();
    if (!user) throw new Error('Not authenticated');

    let wallets = await blink.db.wallets.list({
      where: { userId: user.id },
      limit: 1
    });

    let wallet;
    if (wallets.length === 0) {
      wallet = await blink.db.wallets.create({
        userId: user.id,
        balance: 0
      });
    } else {
      wallet = wallets[0];
    }

    const transactions = await blink.db.walletTransactions.list({
      where: { walletId: wallet.id },
      orderBy: { createdAt: 'desc' }
    });

    const driverId = await this.getDriverId();
    let pendingBalance = 0;

    if (driverId) {
      const pendingOrders = await blink.db.orders.list({
        where: { 
          driverId, 
          status: 'delivered', 
          paymentStatus: 'completed' 
        }
      });
      pendingBalance = pendingOrders.reduce((acc, curr) => acc + (Number(curr.total) * 0.15), 0);
    }

    return {
      settledBalance: wallet.balance,
      pendingBalance,
      transactions
    };
  }

  /**
   * Initiate a payout request to UPI
   */
  static async requestPayout(amount: number, upiId: string) {
    const user = await blink.auth.me();
    if (!user) throw new Error('Not authenticated');

    const walletDetails = await this.getWalletDetails();
    if (walletDetails.settledBalance < amount) {
      throw new Error('Insufficient balance');
    }

    const wallets = await blink.db.wallets.list({ where: { userId: user.id }, limit: 1 });
    const wallet = wallets[0];

    // Create a debit transaction
    await blink.db.walletTransactions.create({
      walletId: wallet.id,
      amount: -amount,
      type: 'debit',
      description: `Payout to ${upiId}`,
      status: 'pending'
    });

    // Update wallet balance
    await blink.db.wallets.update(wallet.id, {
      balance: wallet.balance - amount
    });

    return { success: true };
  }

  private static async getDriverId() {
    const user = await blink.auth.me();
    if (!user) return null;

    const drivers = await blink.db.drivers.list({
      where: { userId: user.id },
      limit: 1
    });
    return drivers.length > 0 ? drivers[0].id : null;
  }
}
