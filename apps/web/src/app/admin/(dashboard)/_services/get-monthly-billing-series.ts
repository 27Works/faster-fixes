import { getStripeApi } from "@/server/stripe";
import type Stripe from "stripe";
import { listParisMonths, getParisMonthKey } from "../_helpers/paris-months";
import { wasPayingAt } from "../_helpers/was-paying-at";
import {
  BILLING_CURRENCY,
  createVatShareResolver,
  getCollectedNetCents,
  isCollectedTransaction,
} from "./_collected-net";

const MONTH_COUNT = 12;

async function listAllSubscriptions(stripe: Stripe) {
  const subscriptions: Stripe.Subscription[] = [];
  for await (const subscription of stripe.subscriptions.list({
    status: "all",
    limit: 100,
  })) {
    subscriptions.push(subscription);
  }
  return subscriptions;
}

// Collected net cents per Paris month key, from one listing over the whole
// chart range instead of one listing per month.
async function sumCollectedCentsByMonth(
  stripe: Stripe,
  fromSeconds: number,
  toSeconds: number,
) {
  const resolveVatShare = createVatShareResolver(stripe);
  const centsByMonth = new Map<string, number>();
  // Amounts in another currency are counted, never summed with EUR.
  let nonEurTransactionCount = 0;

  for await (const transaction of stripe.balanceTransactions.list({
    created: { gte: fromSeconds, lte: toSeconds },
    expand: ["data.source"],
    limit: 100,
  })) {
    if (transaction.created < fromSeconds) continue;
    if (transaction.created > toSeconds) continue;
    if (!isCollectedTransaction(transaction)) continue;
    if (transaction.currency !== BILLING_CURRENCY) {
      nonEurTransactionCount += 1;
      continue;
    }

    const key = getParisMonthKey(new Date(transaction.created * 1000));
    const cents = await getCollectedNetCents(transaction, resolveVatShare);
    centsByMonth.set(key, (centsByMonth.get(key) ?? 0) + cents);
  }

  return { centsByMonth, nonEurTransactionCount };
}

// Paying organizations at each month end and collected net revenue excluding
// VAT per month, over the last 12 Paris months including the current one.
export async function getMonthlyBillingSeries(
  { now }: { now: Date },
  stripe: Stripe = getStripeApi(),
) {
  const nowSeconds = Math.floor(now.getTime() / 1000);
  const months = listParisMonths(now, MONTH_COUNT);
  const firstMonthStartSeconds = Math.floor(
    (months[0]?.start.getTime() ?? now.getTime()) / 1000,
  );

  const [subscriptions, collected] = await Promise.all([
    listAllSubscriptions(stripe),
    sumCollectedCentsByMonth(stripe, firstMonthStartSeconds, nowSeconds),
  ]);

  return {
    months: months.map((month) => {
      // The last second of the month, or now for the current, partial one.
      const atSeconds = Math.min(
        Math.floor(month.end.getTime() / 1000) - 1,
        nowSeconds,
      );
      return {
        key: month.key,
        payingOrganizations: subscriptions.filter((subscription) =>
          wasPayingAt(subscription, atSeconds),
        ).length,
        collectedNet:
          Math.round(collected.centsByMonth.get(month.key) ?? 0) / 100,
      };
    }),
    nonEurTransactionCount: collected.nonEurTransactionCount,
  };
}

export type GetMonthlyBillingSeriesOutput = Awaited<
  ReturnType<typeof getMonthlyBillingSeries>
>;
