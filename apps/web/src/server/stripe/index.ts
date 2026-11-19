import "server-only";

import { ForbiddenError } from "@/server/errors/domain-errors";
import { isCloud } from "@/utils/environment/env";
import Stripe from "stripe";

let client: Stripe | undefined;

export function getStripeApi() {
  if (!isCloud()) {
    throw new ForbiddenError("Billing is only available in cloud mode.");
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY ?? "";
  return (client ??= new Stripe(
    stripeSecretKey === "" ? "sk_test_placeholder" : stripeSecretKey,
    { apiVersion: "2025-12-15.clover" },
  ));
}
