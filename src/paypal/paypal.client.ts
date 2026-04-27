import * as paypal from '@paypal/payouts-sdk';

const environment = new paypal.core.SandboxEnvironment(
  process.env.PAYPAL_CLIENT_ID!,
  process.env.PAYPAL_SECRET!
);

// ✅ EXACT NAME (case matters)
export const paypalClient = new paypal.core.PayPalHttpClient(environment);