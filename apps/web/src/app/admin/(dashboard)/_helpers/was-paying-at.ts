import { SubscriptionStatus } from "@/app/_domains/subscription";
import type Stripe from "stripe";

// Stripe keeps no status history, so a past state is rebuilt from dates. Only
// Subscriptions that are or were paying qualify: an unpaid or paused one
// cannot be dated, and an incomplete one never paid.
const RECONSTRUCTABLE_STATUSES = new Set<Stripe.Subscription.Status>([
  SubscriptionStatus.Active,
  SubscriptionStatus.PastDue,
  SubscriptionStatus.Canceled,
]);

// A Subscription pays from the end of its trial, if it had one, until its
// effective end (`ended_at`), not the date the cancellation was requested.
// A Subscription canceled during its trial therefore never paid.
export function wasPayingAt(
  subscription: Stripe.Subscription,
  atSeconds: number,
) {
  if (!RECONSTRUCTABLE_STATUSES.has(subscription.status)) return false;
  const payingStart = Math.max(
    subscription.start_date,
    subscription.trial_end ?? 0,
  );
  if (payingStart > atSeconds) return false;
  return subscription.ended_at == null || subscription.ended_at > atSeconds;
}
