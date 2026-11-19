import type Stripe from "stripe";

// Collected net revenue, shared by the 30-day card and the monthly chart so
// both use one definition.

export const BILLING_CURRENCY = "eur";

// Money in and out of a customer payment. Their `fee` is the processing fee.
const PAYMENT_TYPES = new Set<Stripe.BalanceTransaction.Type>([
  "charge",
  "payment",
  "refund",
  "payment_refund",
  "payment_failure_refund",
]);

// Stripe fees billed as their own transactions (Billing, Tax, currency
// conversion), not deducted from a charge. Their `amount` is negative.
const STRIPE_FEE_TYPES = new Set<Stripe.BalanceTransaction.Type>([
  "stripe_fee",
  "tax_fee",
  "stripe_fx_fee",
]);

export type VatShareResolver = (paymentIntentId: string) => Promise<number>;

// Share of a payment that is VAT, read from the Invoice it paid. The default
// tax rate is exclusive, so the collected amount includes the tax on top of
// the price. A payment without an Invoice carries no VAT we know of.
export function createVatShareResolver(stripe: Stripe): VatShareResolver {
  const cache = new Map<string, Promise<number>>();
  return (paymentIntentId) => {
    let pending = cache.get(paymentIntentId);
    if (!pending) {
      pending = stripe.invoicePayments
        .list({
          payment: { type: "payment_intent", payment_intent: paymentIntentId },
          expand: ["data.invoice"],
          limit: 1,
        })
        .then(({ data }) => {
          const invoice = data[0]?.invoice;
          if (typeof invoice !== "object" || invoice.deleted) return 0;
          if (!invoice.total) return 0;
          const taxCents = (invoice.total_taxes ?? []).reduce(
            (sum, tax) => sum + tax.amount,
            0,
          );
          return taxCents / invoice.total;
        });
      cache.set(paymentIntentId, pending);
    }
    return pending;
  };
}

function getPaymentIntentId(transaction: Stripe.BalanceTransaction) {
  const source = transaction.source;
  if (typeof source !== "object" || source == null) return null;
  if (!("payment_intent" in source)) return null;
  const paymentIntent = source.payment_intent;
  if (paymentIntent == null) return null;
  return typeof paymentIntent === "string" ? paymentIntent : paymentIntent.id;
}

// Net cents one transaction adds to collected revenue: charges minus refunds,
// excluding VAT, minus processing and separately billed Stripe fees.
export async function getCollectedNetCents(
  transaction: Stripe.BalanceTransaction,
  resolveVatShare: VatShareResolver,
) {
  if (STRIPE_FEE_TYPES.has(transaction.type)) return transaction.amount;
  if (!PAYMENT_TYPES.has(transaction.type)) return 0;

  const paymentIntentId = getPaymentIntentId(transaction);
  const vatShare = paymentIntentId ? await resolveVatShare(paymentIntentId) : 0;
  return transaction.amount * (1 - vatShare) - transaction.fee;
}

// Whether a transaction counts towards collected revenue at all, before its
// currency is checked.
export function isCollectedTransaction(transaction: Stripe.BalanceTransaction) {
  return (
    PAYMENT_TYPES.has(transaction.type) ||
    STRIPE_FEE_TYPES.has(transaction.type)
  );
}
