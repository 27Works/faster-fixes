import type Stripe from "stripe";
import { describe, expect, it, vi } from "vitest";
import { getBillingMetrics } from "./get-billing-metrics";

const now = new Date("2026-09-15T12:00:00Z");
const nowSeconds = now.getTime() / 1000;
const DAY = 24 * 60 * 60;

type PriceOptions = {
  unitAmount?: number | null;
  interval?: "month" | "year";
  lookupKey?: string;
  currency?: string;
  billingScheme?: "per_unit" | "tiered";
};

function price({
  unitAmount = 2000,
  interval = "month",
  lookupKey = "pro_monthly",
  currency = "usd",
  billingScheme = "per_unit",
}: PriceOptions = {}) {
  return {
    id: `price_${lookupKey}`,
    lookup_key: lookupKey,
    currency,
    billing_scheme: billingScheme,
    unit_amount: unitAmount,
    unit_amount_decimal: unitAmount == null ? null : String(unitAmount),
    recurring: { interval, interval_count: 1 },
  };
}

function coupon(fields: Partial<Stripe.Coupon>) {
  return {
    id: "coupon_1",
    duration: "forever",
    percent_off: null,
    amount_off: null,
    ...fields,
  } as Stripe.Coupon;
}

function discount(
  couponOrId: Stripe.Coupon | string,
  { start = nowSeconds - 10 * DAY, end = null as number | null } = {},
) {
  return { id: "di_1", start, end, source: { coupon: couponOrId } };
}

type SubscriptionOptions = {
  status?: Stripe.Subscription.Status;
  items?: Array<{
    price?: ReturnType<typeof price>;
    quantity?: number;
    discounts?: Array<ReturnType<typeof discount>>;
  }>;
  discounts?: Array<ReturnType<typeof discount>>;
  referenceId?: string;
  customerOrganizationId?: string;
  startDate?: number;
  trialEnd?: number | null;
  endedAt?: number | null;
  canceledAt?: number | null;
  cancelAtPeriodEnd?: boolean;
};

function subscription({
  status = "active",
  items = [{}],
  discounts = [],
  referenceId,
  customerOrganizationId,
  startDate = nowSeconds - 365 * DAY,
  trialEnd = null,
  endedAt = null,
  canceledAt = null,
  cancelAtPeriodEnd = false,
}: SubscriptionOptions = {}) {
  return {
    status,
    start_date: startDate,
    trial_end: trialEnd,
    ended_at: endedAt,
    canceled_at: canceledAt,
    cancel_at_period_end: cancelAtPeriodEnd,
    cancel_at: null,
    metadata: referenceId ? { referenceId } : {},
    customer: {
      deleted: undefined,
      metadata: customerOrganizationId
        ? { organizationId: customerOrganizationId }
        : {},
    },
    discounts,
    items: {
      data: items.map((item) => ({
        price: item.price ?? price(),
        quantity: item.quantity ?? 1,
        discounts: item.discounts ?? [],
      })),
    },
  };
}

function stripeStub(
  subscriptions: Array<ReturnType<typeof subscription>>,
  coupons: Stripe.Coupon[] = [],
) {
  return {
    subscriptions: {
      list: () =>
        (async function* () {
          yield* subscriptions;
        })(),
    },
    coupons: {
      retrieve: vi.fn((id: string) =>
        Promise.resolve(coupons.find((candidate) => candidate.id === id)),
      ),
    },
  } as unknown as Stripe;
}

describe("getBillingMetrics", () => {
  describe("MRR", () => {
    it("sums monthly Subscriptions per item as unit amount times quantity", async () => {
      const stripe = stripeStub([
        subscription({ items: [{ quantity: 1 }] }),
        subscription({
          items: [
            {
              price: price({ unitAmount: 9900, lookupKey: "agency_monthly" }),
              quantity: 2,
            },
          ],
        }),
      ]);

      const metrics = await getBillingMetrics({ now }, stripe);

      expect(metrics.mrr).toBe(20 + 198);
      expect(metrics.arr).toBe((20 + 198) * 12);
    });

    it("normalises an annual Subscription to one month", async () => {
      const stripe = stripeStub([
        subscription({
          items: [
            {
              price: price({
                unitAmount: 24000,
                interval: "year",
                lookupKey: "pro_yearly",
              }),
            },
          ],
        }),
      ]);

      await expect(getBillingMetrics({ now }, stripe)).resolves.toMatchObject({
        mrr: 20,
        arr: 240,
      });
    });

    it("counts past due Subscriptions and excludes every other non-active status", async () => {
      const stripe = stripeStub(
        (
          [
            "active",
            "past_due",
            "trialing",
            "unpaid",
            "paused",
            "incomplete",
            "incomplete_expired",
            "canceled",
          ] as const
        ).map((status) => subscription({ status })),
      );

      const metrics = await getBillingMetrics({ now }, stripe);

      expect(metrics.mrr).toBe(40);
      expect(metrics.payingOrganizations).toEqual({
        total: 2,
        pro: 2,
        agency: 0,
        pastDue: 1,
      });
    });

    it("applies a subscription-level percent-off coupon in effect", async () => {
      const stripe = stripeStub([
        subscription({ discounts: [discount(coupon({ percent_off: 25 }))] }),
      ]);

      await expect(getBillingMetrics({ now }, stripe)).resolves.toMatchObject({
        mrr: 15,
      });
    });

    it("applies a subscription-level amount-off coupon per invoice, normalised to one month", async () => {
      const stripe = stripeStub([
        subscription({
          items: [
            {
              price: price({
                unitAmount: 24000,
                interval: "year",
                lookupKey: "pro_yearly",
              }),
            },
          ],
          discounts: [discount(coupon({ amount_off: 2400 }))],
        }),
      ]);

      await expect(getBillingMetrics({ now }, stripe)).resolves.toMatchObject({
        mrr: 18,
      });
    });

    it("ignores a repeating coupon whose discount has ended", async () => {
      const stripe = stripeStub([
        subscription({
          discounts: [
            discount(coupon({ duration: "repeating", percent_off: 50 }), {
              end: nowSeconds - DAY,
            }),
          ],
        }),
      ]);

      await expect(getBillingMetrics({ now }, stripe)).resolves.toMatchObject({
        mrr: 20,
      });
    });

    it("applies a repeating coupon whose discount has not ended yet", async () => {
      const stripe = stripeStub([
        subscription({
          discounts: [
            discount(coupon({ duration: "repeating", percent_off: 50 }), {
              end: nowSeconds + DAY,
            }),
          ],
        }),
      ]);

      await expect(getBillingMetrics({ now }, stripe)).resolves.toMatchObject({
        mrr: 10,
      });
    });

    it("ignores a once coupon, which covers a single invoice", async () => {
      const stripe = stripeStub([
        subscription({
          discounts: [discount(coupon({ duration: "once", percent_off: 100 }))],
        }),
      ]);

      await expect(getBillingMetrics({ now }, stripe)).resolves.toMatchObject({
        mrr: 20,
      });
    });

    it("applies item-level coupons, retrieving a coupon Stripe returns as an id", async () => {
      const stripe = stripeStub(
        [
          subscription({
            items: [
              { discounts: [discount("coupon_half")] },
              {
                price: price({ unitAmount: 9900, lookupKey: "agency_monthly" }),
                discounts: [discount(coupon({ amount_off: 900 }))],
              },
            ],
          }),
        ],
        [coupon({ id: "coupon_half", percent_off: 50 })],
      );

      await expect(getBillingMetrics({ now }, stripe)).resolves.toMatchObject({
        mrr: 10 + 90,
      });
    });

    it("counts items without a flat USD unit amount instead of dropping them silently", async () => {
      const stripe = stripeStub([
        subscription({
          items: [
            {},
            { price: price({ billingScheme: "tiered", unitAmount: null }) },
            { price: price({ currency: "eur" }) },
          ],
        }),
      ]);

      await expect(getBillingMetrics({ now }, stripe)).resolves.toMatchObject({
        mrr: 20,
        unpricedItemCount: 2,
      });
    });
  });

  describe("Paying organizations", () => {
    it("splits paying Subscriptions by Plan", async () => {
      const stripe = stripeStub([
        subscription(),
        subscription({
          items: [{ price: price({ lookupKey: "pro_yearly" }) }],
        }),
        subscription({
          items: [{ price: price({ lookupKey: "agency_monthly" }) }],
        }),
      ]);

      await expect(getBillingMetrics({ now }, stripe)).resolves.toMatchObject({
        payingOrganizations: { total: 3, pro: 2, agency: 1, pastDue: 0 },
      });
    });

    it("exposes the paying Organization ids from the Subscription reference, falling back to the customer", async () => {
      const stripe = stripeStub([
        subscription({ referenceId: "org_reference" }),
        subscription({ customerOrganizationId: "org_customer" }),
        subscription({
          status: "trialing",
          referenceId: "org_trialing",
        }),
      ]);

      const metrics = await getBillingMetrics({ now }, stripe);

      expect(metrics.payingOrganizationIds.sort()).toEqual([
        "org_customer",
        "org_reference",
      ]);
    });
  });

  describe("30 days ago", () => {
    it("rebuilds MRR and Paying organizations from start and end dates", async () => {
      const stripe = stripeStub([
        subscription(),
        subscription({ startDate: nowSeconds - 10 * DAY }),
        subscription({
          status: "canceled",
          endedAt: nowSeconds - 5 * DAY,
          items: [{ price: price({ unitAmount: 9900 }) }],
        }),
        subscription({ status: "canceled", endedAt: nowSeconds - 40 * DAY }),
        subscription({ trialEnd: nowSeconds - 20 * DAY }),
      ]);

      await expect(getBillingMetrics({ now }, stripe)).resolves.toMatchObject({
        mrr: 60,
        payingOrganizations: { total: 3 },
        previous: { mrr: 20 + 99, payingOrganizationCount: 2 },
      });
    });

    it("applies the discounts that were in effect 30 days ago", async () => {
      const stripe = stripeStub([
        subscription({
          discounts: [
            discount(coupon({ duration: "repeating", percent_off: 50 }), {
              start: nowSeconds - 60 * DAY,
              end: nowSeconds - DAY,
            }),
          ],
        }),
      ]);

      await expect(getBillingMetrics({ now }, stripe)).resolves.toMatchObject({
        mrr: 20,
        previous: { mrr: 10 },
      });
    });
  });

  describe("Churn", () => {
    it("counts a paying Subscription that ended inside the window, not one that ended before", async () => {
      const stripe = stripeStub([
        subscription(),
        subscription(),
        subscription({ status: "canceled", endedAt: nowSeconds - 5 * DAY }),
        subscription({ status: "canceled", endedAt: nowSeconds - 31 * DAY }),
      ]);

      await expect(getBillingMetrics({ now }, stripe)).resolves.toMatchObject({
        churn: { churnedCount: 1, base: 3, rate: 1 / 3 },
      });
    });

    it("dates churn by the effective end, not by the cancellation request", async () => {
      const stripe = stripeStub([
        subscription(),
        subscription({
          status: "canceled",
          canceledAt: nowSeconds - 200 * DAY,
          endedAt: nowSeconds - 2 * DAY,
        }),
      ]);

      await expect(getBillingMetrics({ now }, stripe)).resolves.toMatchObject({
        churn: { churnedCount: 1, base: 2, rate: 0.5 },
      });
    });

    it("counts a scheduled cancellation that has not ended yet as scheduled, not churned", async () => {
      const stripe = stripeStub([
        subscription({
          cancelAtPeriodEnd: true,
          canceledAt: nowSeconds - 3 * DAY,
        }),
      ]);

      await expect(getBillingMetrics({ now }, stripe)).resolves.toMatchObject({
        churn: { churnedCount: 0, base: 1, rate: 0 },
        scheduledCancellationCount: 1,
        payingOrganizations: { total: 1 },
      });
    });

    it("does not count a trial that ended as churn", async () => {
      const stripe = stripeStub([
        subscription(),
        subscription({
          status: "canceled",
          startDate: nowSeconds - 20 * DAY,
          trialEnd: nowSeconds - 6 * DAY,
          endedAt: nowSeconds - 6 * DAY,
        }),
      ]);

      await expect(getBillingMetrics({ now }, stripe)).resolves.toMatchObject({
        churn: { churnedCount: 0, base: 1, rate: 0 },
      });
    });

    it("returns no rate when nothing was paying 30 days ago", async () => {
      const stripe = stripeStub([
        subscription({ startDate: nowSeconds - 10 * DAY }),
        subscription({
          status: "canceled",
          startDate: nowSeconds - 20 * DAY,
          endedAt: nowSeconds - 2 * DAY,
        }),
      ]);

      await expect(getBillingMetrics({ now }, stripe)).resolves.toMatchObject({
        churn: { churnedCount: 1, base: 0, rate: null },
      });
    });
  });

  it("rejects on a Stripe failure instead of returning zeros", async () => {
    const outage = new Error("Stripe is unreachable");
    const stripe = {
      subscriptions: {
        list: () => ({
          [Symbol.asyncIterator]: () => ({
            next: () => Promise.reject(outage),
          }),
        }),
      },
    } as unknown as Stripe;

    await expect(getBillingMetrics({ now }, stripe)).rejects.toBe(outage);
  });
});
