import type Stripe from "stripe";
import { describe, expect, it } from "vitest";
import { getMonthlyBillingSeries } from "./get-monthly-billing-series";

const now = new Date("2026-09-15T12:00:00Z");

const toSeconds = (iso: string) => new Date(iso).getTime() / 1000;

function transaction({
  created,
  amount = 2400,
  currency = "eur",
}: {
  created: string;
  amount?: number;
  currency?: string;
}) {
  return {
    type: "charge",
    amount,
    fee: 0,
    currency,
    created: toSeconds(created),
    source: null,
  };
}

function subscription({
  status = "active",
  start,
  end = null,
}: {
  status?: Stripe.Subscription.Status;
  start: string;
  end?: string | null;
}) {
  return {
    status,
    start_date: toSeconds(start),
    trial_end: null,
    ended_at: end ? toSeconds(end) : null,
  };
}

function stripeStub({
  transactions = [],
  subscriptions = [],
}: {
  transactions?: Array<ReturnType<typeof transaction>>;
  subscriptions?: Array<ReturnType<typeof subscription>>;
}) {
  return {
    balanceTransactions: {
      list: () =>
        (async function* () {
          yield* transactions;
        })(),
    },
    subscriptions: {
      list: () =>
        (async function* () {
          yield* subscriptions;
        })(),
    },
  } as unknown as Stripe;
}

async function getMonth(stripe: Stripe, key: string) {
  const { months } = await getMonthlyBillingSeries({ now }, stripe);
  return months.find((month) => month.key === key);
}

describe("getMonthlyBillingSeries", () => {
  it("returns the last 12 months, oldest first, ending with the current one", async () => {
    const { months } = await getMonthlyBillingSeries({ now }, stripeStub({}));

    expect(months.map((month) => month.key)).toEqual([
      "2025-10",
      "2025-11",
      "2025-12",
      "2026-01",
      "2026-02",
      "2026-03",
      "2026-04",
      "2026-05",
      "2026-06",
      "2026-07",
      "2026-08",
      "2026-09",
    ]);
  });

  it("buckets a payment on the last evening of a month, Paris time, into that month", async () => {
    const stripe = stripeStub({
      transactions: [
        // 23:30 in Paris (UTC+2) on 31 August.
        transaction({ created: "2026-08-31T21:30:00Z", amount: 1000 }),
        // 00:30 in Paris on 1 September.
        transaction({ created: "2026-08-31T22:30:00Z", amount: 2000 }),
        // 23:30 in Paris (UTC+1, winter time) on 31 January.
        transaction({ created: "2026-01-31T22:30:00Z", amount: 4000 }),
      ],
    });

    const { months } = await getMonthlyBillingSeries({ now }, stripe);
    const collectedByMonth = Object.fromEntries(
      months.map((month) => [month.key, month.collectedNet]),
    );

    expect(collectedByMonth).toMatchObject({
      "2026-01": 40,
      "2026-02": 0,
      "2026-08": 10,
      "2026-09": 20,
    });
  });

  it("counts Paying organizations at each month end across a Subscription start and end", async () => {
    const stripe = stripeStub({
      subscriptions: [
        subscription({
          status: "canceled",
          start: "2026-03-10T10:00:00Z",
          end: "2026-06-05T10:00:00Z",
        }),
        // Starts at 00:30 on 1 May in Paris, so not paying at April end.
        subscription({ start: "2026-04-30T22:30:00Z" }),
      ],
    });

    const { months } = await getMonthlyBillingSeries({ now }, stripe);
    const payingByMonth = Object.fromEntries(
      months.map((month) => [month.key, month.payingOrganizations]),
    );

    expect(payingByMonth).toMatchObject({
      "2026-02": 0,
      "2026-03": 1,
      "2026-04": 1,
      "2026-05": 2,
      "2026-06": 1,
      "2026-09": 1,
    });
  });

  it("counts the current month's Paying organizations as of now", async () => {
    const stripe = stripeStub({
      subscriptions: [subscription({ start: "2026-09-20T10:00:00Z" })],
    });

    await expect(getMonth(stripe, "2026-09")).resolves.toMatchObject({
      payingOrganizations: 0,
    });
  });

  it("excludes trialing and incomplete Subscriptions from Paying organizations", async () => {
    const stripe = stripeStub({
      subscriptions: [
        subscription({ status: "trialing", start: "2026-08-01T10:00:00Z" }),
        subscription({ status: "incomplete", start: "2026-08-01T10:00:00Z" }),
      ],
    });

    await expect(getMonth(stripe, "2026-08")).resolves.toMatchObject({
      payingOrganizations: 0,
    });
  });

  it("counts a non-EUR transaction as a warning instead of summing it", async () => {
    const stripe = stripeStub({
      transactions: [
        transaction({ created: "2026-09-01T10:00:00Z" }),
        transaction({
          created: "2026-09-01T10:00:00Z",
          currency: "usd",
          amount: 5000,
        }),
      ],
    });

    const series = await getMonthlyBillingSeries({ now }, stripe);

    expect(series.nonEurTransactionCount).toBe(1);
    expect(series.months.at(-1)).toMatchObject({ collectedNet: 24 });
  });

  it("rejects on a Stripe failure instead of returning zeros", async () => {
    const outage = new Error("Stripe is unreachable");
    const failingList = () => ({
      [Symbol.asyncIterator]: () => ({
        next: () => Promise.reject(outage),
      }),
    });
    const stripe = {
      balanceTransactions: { list: failingList },
      subscriptions: { list: failingList },
    } as unknown as Stripe;

    await expect(getMonthlyBillingSeries({ now }, stripe)).rejects.toBe(outage);
  });
});
