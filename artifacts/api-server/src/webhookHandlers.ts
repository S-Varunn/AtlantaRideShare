import { getUncachableStripeClient } from "./lib/stripeClient";
import { getSupabaseAdmin } from "./lib/supabaseAdmin";
import { logger } from "./lib/logger";

export class WebhookHandlers {
  static async processWebhook(
    payload: Buffer,
    signature: string,
  ): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        "STRIPE WEBHOOK ERROR: Payload must be a Buffer. " +
          "Ensure the webhook route is registered BEFORE app.use(express.json()).",
      );
    }

    const stripe = await getUncachableStripeClient();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error("STRIPE_WEBHOOK_SECRET environment variable is required");
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`Stripe webhook signature verification failed: ${message}`);
    }

    if (event.type === "payment_intent.succeeded") {
      await handleRidePaymentSucceeded(event.data.object);
    }
  }
}

interface PaymentIntentLike {
  id?: string;
  amount?: number;
  amount_received?: number;
  latest_charge?: string | { id?: string } | null;
  metadata?: { ride_id?: string } | null;
}

async function handleRidePaymentSucceeded(
  paymentIntent: unknown,
): Promise<void> {
  const pi = (paymentIntent ?? {}) as PaymentIntentLike;

  const rideId = pi.metadata?.ride_id;
  if (!rideId) {
    logger.warn(
      { paymentIntentId: pi.id },
      "payment_intent.succeeded without ride_id metadata; skipping ride update",
    );
    return;
  }

  const chargeId =
    typeof pi.latest_charge === "string"
      ? pi.latest_charge
      : (pi.latest_charge?.id ?? null);

  const amountInCents =
    typeof pi.amount_received === "number" ? pi.amount_received : pi.amount;
  const actualFare =
    typeof amountInCents === "number" ? Math.round(amountInCents) / 100 : null;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("rides")
    .update({
      status: "paid",
      actual_fare: actualFare,
      stripe_charge_id: chargeId,
    })
    .eq("id", rideId)
    .select("id");

  if (error) {
    logger.error(
      { rideId, err: error.message },
      "Failed to mark ride as paid after payment_intent.succeeded",
    );
    // Rethrow so the webhook responds non-2xx and Stripe retries delivery.
    throw new Error(`Failed to update ride ${rideId}: ${error.message}`);
  }

  if (!data || data.length === 0) {
    // No row matched the ride_id — the ride is missing/deleted. Throw so Stripe
    // retries and the inconsistency surfaces instead of silently succeeding.
    logger.error(
      { rideId },
      "payment_intent.succeeded matched no ride row; nothing updated",
    );
    throw new Error(`No ride found to mark as paid for ride ${rideId}`);
  }

  logger.info({ rideId, actualFare, chargeId }, "Ride marked as paid");
}
