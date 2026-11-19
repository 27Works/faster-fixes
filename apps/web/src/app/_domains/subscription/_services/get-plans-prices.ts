import { SUBSCRIPTION_PLANS } from "@/server/auth/config/subscription-plans";
import { getStripeApi } from "@/server/stripe";
import { isCloud } from "@/utils/environment/env";
import type Stripe from "stripe";

export async function getPlansPrices({ planNames }: { planNames: string[] }) {
  const pricesMap: Record<
    string,
    { monthly: Stripe.Price | null; annual: Stripe.Price | null }
  > = {};

  if (!isCloud()) return pricesMap;

  for (const planName of planNames) {
    const plan = SUBSCRIPTION_PLANS.find((p) => p.name === planName);

    if (!plan || !plan.priceId) {
      pricesMap[planName] = { monthly: null, annual: null };
      continue;
    }

    try {
      const stripe = getStripeApi();
      const monthlyPrice = await stripe.prices.retrieve(plan.priceId);
      const annualPrice = plan.annualDiscountPriceId
        ? await stripe.prices.retrieve(plan.annualDiscountPriceId)
        : null;

      pricesMap[planName] = {
        monthly: monthlyPrice,
        annual: annualPrice,
      };
    } catch (error) {
      // One unreachable price must not blank the whole pricing table, so the
      // plan is reported as priceless and the others keep loading.
      console.error(`Failed to fetch Stripe price for ${planName}:`, error);
      pricesMap[planName] = { monthly: null, annual: null };
    }
  }

  return pricesMap;
}

export type GetPlansPricesOutput = Awaited<ReturnType<typeof getPlansPrices>>;
