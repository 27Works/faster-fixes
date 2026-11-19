"use client";

import { useTRPC } from "@/lib/trpc/trpc-client";
import { useQuery } from "@tanstack/react-query";
import { getErrorMessage } from "@/utils/error/get-error-message";
import { matchQueryStatus } from "@/utils/tanstack-query/match-query-status";
import { DashboardPanel } from "../_components/dashboard-panel";
import { FigureRow, FigureRowSkeleton } from "../_components/figure-row";
import { FigureUnavailable } from "../_components/figure-unavailable";

const BILLING_LABELS = [
  "Churn, last 30 days",
  "Scheduled cancellations",
  "Past due",
];
const FREE_NEAR_LIMIT_LABEL = "Free organizations near the limit";

const formatRate = (rate: number) =>
  new Intl.NumberFormat("en-US", {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(rate);

export function RetentionCard() {
  return (
    <DashboardPanel title="Retention">
      <BillingRetentionRows />
      <FreeNearLimitRow />
    </DashboardPanel>
  );
}

// Billing rows come from Stripe and the near-limit row from the database, so
// each reads its own query and fails on its own.
function BillingRetentionRows() {
  const trpc = useTRPC();
  const query = useQuery(trpc.admin.dashboard.getBillingMetrics.queryOptions());

  return matchQueryStatus(query, {
    Loading: (
      <>
        {BILLING_LABELS.map((label) => (
          <FigureRowSkeleton key={label} label={label} />
        ))}
      </>
    ),
    Errored: (error) => (
      <FigureUnavailable description={getErrorMessage(error)} />
    ),
    Empty: (
      <FigureUnavailable description="No billing figures were returned." />
    ),
    Success: ({ data }) => {
      const { churnedCount, base, rate } = data.churn;
      const scheduled = data.scheduledCancellationCount;
      const { pastDue } = data.payingOrganizations;

      return (
        <>
          <FigureRow
            label="Churn, last 30 days"
            value={rate == null ? "N/A" : formatRate(rate)}
            hint={`${churnedCount} of ${base} ended`}
          />
          <FigureRow
            label="Scheduled cancellations"
            value={String(scheduled)}
            tone={scheduled > 0 ? "destructive" : "default"}
          />
          <FigureRow
            label="Past due"
            value={String(pastDue)}
            tone={pastDue > 0 ? "destructive" : "default"}
          />
        </>
      );
    },
  });
}

function FreeNearLimitRow() {
  const trpc = useTRPC();
  const query = useQuery(
    trpc.admin.dashboard.getActivationOverview.queryOptions(),
  );

  return matchQueryStatus(query, {
    Loading: <FigureRowSkeleton label={FREE_NEAR_LIMIT_LABEL} />,
    Errored: (error) => (
      <FigureUnavailable description={getErrorMessage(error)} />
    ),
    Empty: <FigureUnavailable description="No usage figures were returned." />,
    Success: ({ data }) => {
      const { count, threshold, limit } = data.freeNearLimit;

      return (
        <FigureRow
          label={FREE_NEAR_LIMIT_LABEL}
          value={String(count)}
          hint={`${threshold}+ of ${limit} Feedback`}
        />
      );
    },
  });
}
