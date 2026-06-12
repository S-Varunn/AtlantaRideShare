import { Router, type IRouter } from "express";
import { z } from "zod";
import { getUncachableStripeClient } from "../lib/stripeClient";
import { getSupabaseAdmin } from "../lib/supabaseAdmin";
import { requireAuth } from "../middlewares/requireAuth";
import {
  calculateFare,
  haversineMiles,
  PricingConfigError,
} from "../lib/pricing";

const router: IRouter = Router();

const CreatePaymentIntentBody = z.object({
  ride_id: z.string().min(1),
});

router.post(
  "/payments/create-payment-intent",
  requireAuth,
  async (req, res) => {
    const parsed = CreatePaymentIntentBody.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Invalid request body",
        details: parsed.error.issues,
      });
    }

    const { ride_id } = parsed.data;
    const userId = req.userId!;
    const supabase = getSupabaseAdmin();

    // Scope the lookup to the caller's own rides. A ride that doesn't exist —
    // or that belongs to another user — returns the same 404 so callers can't
    // probe ride IDs for existence (enumeration).
    const { data: ride, error } = await supabase
      .from("rides")
      .select(
        "id, status, luggage, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng",
      )
      .eq("id", ride_id)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      req.log.error({ err: error.message, ride_id }, "Failed to load ride");
      return res.status(500).json({ error: "Failed to load ride" });
    }
    if (!ride) {
      return res.status(404).json({ error: "Ride not found" });
    }
    if (ride.status === "paid") {
      return res.status(409).json({ error: "Ride is already paid" });
    }
    if (
      ride.pickup_lat == null ||
      ride.pickup_lng == null ||
      ride.dropoff_lat == null ||
      ride.dropoff_lng == null
    ) {
      return res.status(400).json({
        error:
          "Ride is missing pickup/dropoff coordinates required to compute the fare",
      });
    }

    const distanceInMiles = haversineMiles(
      Number(ride.pickup_lat),
      Number(ride.pickup_lng),
      Number(ride.dropoff_lat),
      Number(ride.dropoff_lng),
    );
    const luggageCount = Number(ride.luggage ?? 0);

    let fare;
    try {
      fare = await calculateFare(distanceInMiles, luggageCount);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error";
      if (e instanceof PricingConfigError) {
        req.log.error({ err: message, ride_id }, "Pricing config error");
        return res.status(422).json({ error: message });
      }
      req.log.error({ err: message, ride_id }, "Fare calculation failed");
      return res.status(500).json({ error: "Fare calculation failed" });
    }

    const amountInCents = Math.round(fare.totalFare * 100);

    try {
      const stripe = await getUncachableStripeClient();
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: "usd",
        metadata: { ride_id, user_id: userId },
        automatic_payment_methods: { enabled: true },
      });

      return res.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: amountInCents,
        currency: "usd",
        fare,
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error";
      req.log.error(
        { err: message, ride_id },
        "Failed to create Stripe PaymentIntent",
      );
      return res
        .status(502)
        .json({ error: "Failed to create payment intent" });
    }
  },
);

export default router;
