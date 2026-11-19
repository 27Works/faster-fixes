import {
  SubscriptionPlanName,
  SubscriptionStatus,
} from "@/app/_domains/subscription";
import { SUBSCRIPTION_PLANS } from "@/server/auth/config/subscription-plans";
import { getStripeApi } from "@/server/stripe";
import type Stripe from "stripe";
import { wasPayingAt } from "../_helpers/was-paying-at";

// A Paying organization is one whose Subscription is `active` or `past_due` in
// Stripe (CONTEXT.md). Trialing, unpaid, paused, incomplete and canceled
// Subscriptions contribute nothing.
const PAYING_STATUSES = new Set<Stripe.Subscription.Status>([
  SubscriptionStatus.Active,
  SubscriptionStatus.PastDue,
]);

// Plan prices are set in USD. Collected revenue settles in EUR instead (see
// `_collected-net.ts`), so the two figures use different currencies.
const PRICE_CURRENCY = "usd";

// Number of months in one billing period, used to normalise any cadence
// (annual, quarterly, weekly...) to a monthly figure.
function getMonthsPerPeriod(price: Stripe.Price): number {
  const count = price.recurring?.interval_count ?? 1;
  switch (price.recurring?.interval) {
    case "year":
      return 12 * count;
    case "week":
      return (12 / 52) * count;
    case "day":
      return (12 / 365) * count;
    case "month":
    default:
      return count;
  }
}

// The default tax rate is exclusive, so the unit amount already excludes VAT.
// `unit_amount` is null for sub-cent prices, which only carry the decimal
// field, and for tiered prices, which carry neither.
function getFlatUnitCents(price: Stripe.Price): number | null {
  if (price.billing_scheme !== "per_unit") return null;
  if (price.currency !== PRICE_CURRENCY) return null;
  if (price.unit_amount_decimal != null) {
    return Number(price.unit_amount_decimal);
  }
  return price.unit_amount;
}

type CouponResolver = (
  discount: Stripe.Discount,
) => Promise<Stripe.Coupon | null>;

// Item-level discounts sit one level too deep for Stripe's expansion limit, so
// their coupon arrives as an id and is retrieved once per id.
function createCouponResolver(stripe: Stripe): CouponResolver {
  const cache = new Map<string, Promise<Stripe.Coupon | null>>();
  return (discount) => {
    const coupon = discount.source.coupon;
    if (typeof coupon !== "string") return Promise.resolve(coupon);
    let pending = cache.get(coupon);
    if (!pending) {
      pending = stripe.coupons.retrieve(coupon);
      cache.set(coupon, pending);
    }
    return pending;
  };
}

// A `once` coupon covers a single invoice, so it is not recurring revenue
// lost; `repeating` coupons stop at the discount's `end`.
function isDiscountInEffect(
  discount: Stripe.Discount,
  coupon: Stripe.Coupon,
  nowSeconds: number,
) {
  if (coupon.duration === "once") return false;
  if (discount.start > nowSeconds) return false;
  return discount.end == null || discount.end > nowSeconds;
}

async function applyDiscounts(
  periodCents: number,
  discounts: Array<string | Stripe.Discount>,
  resolveCoupon: CouponResolver,
  nowSeconds: number,
) {
  let cents = periodCents;
  for (const discount of discounts) {
    // Both discount lists are expanded, so an id never reaches this loop.
    if (typeof discount === "string") continue;
    const coupon = await resolveCoupon(discount);
    if (!coupon || !isDiscountInEffect(discount, coupon, nowSeconds)) continue;
    if (coupon.percent_off) {
      cents *= 1 - coupon.percent_off / 100;
    } else if (coupon.amount_off) {
      cents -= coupon.amount_off;
    }
  }
  return Math.max(0, cents);
}

// Monthly recurring cents of one Subscription after the discounts in effect,
// plus the number of items whose price could not be counted.
async function getSubscriptionMonthlyCents(
  subscription: Stripe.Subscription,
  resolveCoupon: CouponResolver,
  nowSeconds: number,
) {
  let monthlyCents = 0;
  let unpricedItemCount = 0;

  for (const item of subscription.items.data) {
    const unitCents = getFlatUnitCents(item.price);
    if (unitCents == null) {
      unpricedItemCount += 1;
      continue;
    }
    const monthsPerPeriod = getMonthsPerPeriod(item.price);
    const periodCents = await applyDiscounts(
      unitCents * (item.quantity ?? 1),
      item.discounts,
      resolveCoupon,
      nowSeconds,
    );
    monthlyCents += periodCents / monthsPerPeriod;
  }

  // Subscription-level discounts apply to the whole invoice. An `amount_off`
  // is per invoice, so it is normalised by the first item's cadence.
  const firstPrice = subscription.items.data[0]?.price;
  const monthsPerPeriod = firstPrice ? getMonthsPerPeriod(firstPrice) : 1;
  const discountedCents = await applyDiscounts(
    monthlyCents * monthsPerPeriod,
    subscription.discounts,
    resolveCoupon,
    nowSeconds,
  );

  return {
    monthlyCents: discountedCents / monthsPerPeriod,
    unpricedItemCount,
  };
}

function getSubscriptionPlanName(
  subscription: Stripe.Subscription,
): SubscriptionPlanName | null {
  for (const { price } of subscription.items.data) {
    const plan = SUBSCRIPTION_PLANS.find(
      (candidate) =>
        (price.lookup_key != null &&
          (price.lookup_key === candidate.lookupKey ||
            price.lookup_key === candidate.annualDiscountLookupKey)) ||
        price.id === candidate.priceId ||
        price.id === candidate.annualDiscountPriceId,
    );
    if (plan) return plan.name as SubscriptionPlanName;
  }
  return null;
}

// The Better Auth Stripe plugin stamps `referenceId` on Subscriptions it
// creates without checkout params, but our checkout params replace its
// `subscription_data` (and with it that metadata). The Organization's Stripe
// customer always carries `organizationId`, so it is the fallback.
function getSubscriptionOrganizationId(
  subscription: Stripe.Subscription,
): string | null {
  const referenceId = subscription.metadata.referenceId;
  if (referenceId) return referenceId;
  const customer = subscription.customer;
  if (typeof customer === "object" && !customer.deleted) {
    return customer.metadata.organizationId ?? null;
  }
  return null;
}

const WINDOW_SECONDS = 30 * 24 * 60 * 60;

// Stripe's expansion depth limit is four levels: the subscription-level
// coupon fits, the item-level one does not (see createCouponResolver).
async function listBillingSubscriptions(stripe: Stripe) {
  const subscriptions: Stripe.Subscription[] = [];
  for await (const subscription of stripe.subscriptions.list({
    status: "all",
    expand: [
      "data.customer",
      "data.discounts.source.coupon",
      "data.items.data.discounts",
    ],
    limit: 100,
  })) {
    subscriptions.push(subscription);
  }
  return subscriptions;
}

// MRR and Paying organizations over the given paying Subscriptions, with the
// discounts in effect at `atSeconds`.
async function getPayingSnapshot(
  subscriptions: Stripe.Subscription[],
  resolveCoupon: CouponResolver,
  atSeconds: number,
) {
  let mrrCents = 0;
  let unpricedItemCount = 0;
  const payingOrganizations = { total: 0, pro: 0, agency: 0 };
  const payingOrganizationIds = new Set<string>();

  for (const subscription of subscriptions) {
    const monthly = await getSubscriptionMonthlyCents(
      subscription,
      resolveCoupon,
      atSeconds,
    );
    mrrCents += monthly.monthlyCents;
    unpricedItemCount += monthly.unpricedItemCount;

    payingOrganizations.total += 1;
    const planName = getSubscriptionPlanName(subscription);
    if (planName === SubscriptionPlanName.Pro) payingOrganizations.pro += 1;
    if (planName === SubscriptionPlanName.Agency) {
      payingOrganizations.agency += 1;
    }

    const organizationId = getSubscriptionOrganizationId(subscription);
    if (organizationId) payingOrganizationIds.add(organizationId);
  }

  return {
    mrrCents,
    unpricedItemCount,
    payingOrganizations,
    payingOrganizationIds,
  };
}

const fromCents = (cents: number) => Math.round(cents) / 100;

export async function getBillingMetrics(
  { now }: { now: Date },
  stripe: Stripe = getStripeApi(),
) {
  const nowSeconds = Math.floor(now.getTime() / 1000);
  const windowStartSeconds = nowSeconds - WINDOW_SECONDS;
  const resolveCoupon = createCouponResolver(stripe);
  const subscriptions = await listBillingSubscriptions(stripe);

  // The current state reads the live status; only the past one is rebuilt.
  const paying = subscriptions.filter((subscription) =>
    PAYING_STATUSES.has(subscription.status),
  );
  const current = await getPayingSnapshot(paying, resolveCoupon, nowSeconds);
  const previous = await getPayingSnapshot(
    subscriptions.filter((subscription) =>
      wasPayingAt(subscription, windowStartSeconds),
    ),
    resolveCoupon,
    windowStartSeconds,
  );

  // Churned: paying right up to an effective end inside the window. A trial
  // that ended was never paying, so it is not churn.
  const churnedCount = subscriptions.filter((subscription) => {
    const endedAt = subscription.ended_at;
    return (
      endedAt != null &&
      endedAt > windowStartSeconds &&
      endedAt <= nowSeconds &&
      wasPayingAt(subscription, endedAt - 1)
    );
  }).length;
  const churnBase = previous.payingOrganizations.total;

  return {
    mrr: fromCents(current.mrrCents),
    arr: fromCents(current.mrrCents * 12),
    unpricedItemCount: current.unpricedItemCount,
    payingOrganizations: {
      ...current.payingOrganizations,
      pastDue: paying.filter(
        (subscription) => subscription.status === SubscriptionStatus.PastDue,
      ).length,
    },
    payingOrganizationIds: [...current.payingOrganizationIds],
    previous: {
      mrr: fromCents(previous.mrrCents),
      payingOrganizationCount: churnBase,
    },
    churn: {
      churnedCount,
      base: churnBase,
      // No base means no rate, not a division by zero.
      rate: churnBase > 0 ? churnedCount / churnBase : null,
    },
    // Newer API versions schedule the end through `cancel_at` as well as
    // `cancel_at_period_end`.
    scheduledCancellationCount: paying.filter(
      (subscription) =>
        subscription.cancel_at_period_end || subscription.cancel_at != null,
    ).length,
  };
}

export type GetBillingMetricsOutput = Awaited<
  ReturnType<typeof getBillingMetrics>
>;
