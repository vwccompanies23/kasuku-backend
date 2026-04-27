export interface PaymentProvider {
  payout(user: any, amount: number): Promise<any>;
}