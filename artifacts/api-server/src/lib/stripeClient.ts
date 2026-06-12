import Stripe from "stripe";

/**
 * Returns a fresh authenticated Stripe client.
 * Uses the standard STRIPE_SECRET_KEY environment variable.
 */
export async function getUncachableStripeClient(): Promise<Stripe> {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY environment variable is required");
  }
  return new Stripe(secretKey);
}

/**
 * Returns the publishable key for client-side use (Stripe Elements, etc.).
 * Uses the standard STRIPE_PUBLISHABLE_KEY environment variable.
 */
export async function getStripePublishableKey(): Promise<string> {
  const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;
  if (!publishableKey) {
    throw new Error("STRIPE_PUBLISHABLE_KEY environment variable is required");
  }
  return publishableKey;
}
