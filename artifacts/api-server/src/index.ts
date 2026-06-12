import app from "./app";
import { logger } from "./lib/logger";

/**
 * Basic initialization check for Stripe keys.
 */
async function initStripe(): Promise<void> {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    logger.warn("STRIPE_SECRET_KEY is not set; Stripe payments will not be functional");
    return;
  }
  logger.info("Stripe secret key detected and initialized");
}

const port = process.env.PORT ? Number(process.env.PORT) : 3000;

await initStripe();

app.listen(port, () => {
  logger.info({ port }, "Server listening");
});
