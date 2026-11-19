"use client";

import { useTRPC } from "@/lib/trpc/trpc-client";
import { useQuery } from "@tanstack/react-query";
import { matchQueryStatus } from "@/utils/tanstack-query/match-query-status";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { ChartContainer, ChartTooltip } from "@workspace/ui/components/chart";
import { Skeleton } from "@workspace/ui/components/skeleton";
import {
  Area,
  Bar,
  Cell,
  ComposedChart,
  Line,
  ReferenceArea,
  XAxis,
  YAxis,
} from "recharts";
import type { GetMonthlyStatsOutput } from "../../_services/get-monthly-stats";

type MonthData = GetMonthlyStatsOutput["months"][number];

const CHART_TITLE = "Last 12 months";

const formatEur = (value: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(
    value,
  );

function getSeriesLabel(name: string | number | undefined): string {
  if (name === "signups") return "Signups:";
  if (name === "payingOrganizations") return "Paying organizations:";
  return "Collected, net excl. VAT:";
}

export function MonthlyGrowthChart() {
  const trpc = useTRPC();
  const query = useQuery(trpc.admin.dashboard.getMonthlyStats.queryOptions());

  return matchQueryStatus(query, {
    Loading: <MonthlyGrowthChartLoading />,
    Errored: <MonthlyGrowthChartError />,
    Empty: <MonthlyGrowthChartLoading />,
    Success: ({ data }) => {
      const partialMonth = data.months.find((month) => month.isPartial);

      return (
        <Card>
          <CardHeader>
            <CardTitle>{CHART_TITLE}</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              className="h-[300px] w-full"
              config={{
                signups: {
                  label: "Signups",
                  color: "var(--chart-5)",
                },
                payingOrganizations: {
                  label: "Paying organizations at month end",
                  color: "var(--chart-1)",
                },
                collectedNet: {
                  label: "Collected, net excl. VAT",
                  color: "var(--chart-2)",
                },
              }}
            >
              <ComposedChart
                data={data.months}
                margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
              >
                <XAxis
                  dataKey="key"
                  tickFormatter={(key: string) =>
                    data.months.find((month) => month.key === key)?.label ?? key
                  }
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="left"
                  width={30}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                  allowDecimals={false}
                  label={{
                    value: "Signups",
                    angle: -90,
                    position: "insideLeft",
                  }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  width={30}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                  allowDecimals={false}
                  label={{
                    value: "Paying organizations",
                    angle: 90,
                    position: "insideRight",
                  }}
                />
                <YAxis
                  yAxisId="far-right"
                  orientation="right"
                  width={50}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                  allowDecimals={false}
                  label={{
                    value: "Collected (€)",
                    angle: 90,
                    position: "right",
                  }}
                />
                {partialMonth && (
                  <ReferenceArea
                    yAxisId="left"
                    x1={partialMonth.key}
                    x2={partialMonth.key}
                    fill="var(--muted-foreground)"
                    fillOpacity={0.08}
                    label={{
                      value: "Partial",
                      position: "insideTop",
                      fontSize: 11,
                    }}
                  />
                )}
                <Bar
                  yAxisId="left"
                  dataKey="signups"
                  name="signups"
                  fill="var(--color-signups)"
                  radius={[4, 4, 0, 0]}
                >
                  {data.months.map((month) => (
                    <Cell
                      key={month.key}
                      fillOpacity={month.isPartial ? 0.4 : 1}
                    />
                  ))}
                </Bar>
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="payingOrganizations"
                  name="payingOrganizations"
                  fill="var(--color-payingOrganizations)"
                  stroke="var(--color-payingOrganizations)"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
                <Line
                  yAxisId="far-right"
                  type="monotone"
                  dataKey="collectedNet"
                  name="collectedNet"
                  stroke="var(--color-collectedNet)"
                  strokeWidth={2}
                  dot={false}
                />

                <ChartTooltip
                  content={({ active, payload }) => {
                    const firstEntry = payload?.[0];
                    if (!active || !firstEntry) return null;

                    const month = firstEntry.payload as MonthData;
                    return (
                      <div className="rounded-lg border bg-background p-3 shadow-md">
                        <div className="font-medium">
                          {month.fullLabel}
                          {month.isPartial && (
                            <span className="text-muted-foreground">
                              {" "}
                              (to date)
                            </span>
                          )}
                        </div>
                        <div className="space-y-1 text-sm">
                          {payload.map((entry) => (
                            <div key={entry.name} className="flex gap-2">
                              <span
                                className="mt-1 h-3 w-3 rounded-full"
                                style={{ backgroundColor: entry.color }}
                              />
                              <span className="text-muted-foreground">
                                {getSeriesLabel(entry.name)}
                              </span>
                              <span className="font-medium">
                                {entry.name === "collectedNet"
                                  ? formatEur(entry.value as number)
                                  : entry.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }}
                />
              </ComposedChart>
            </ChartContainer>
            {data.nonEurTransactionCount > 0 && (
              <p className="mt-2 text-xs text-destructive">
                {data.nonEurTransactionCount}{" "}
                {data.nonEurTransactionCount === 1
                  ? "transaction"
                  : "transactions"}{" "}
                in a currency other than EUR, not counted
              </p>
            )}
          </CardContent>
        </Card>
      );
    },
  });
}

function MonthlyGrowthChartLoading() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[300px] w-full" />
      </CardContent>
    </Card>
  );
}

function MonthlyGrowthChartError() {
  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <CardTitle>{CHART_TITLE}</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <p className="text-sm text-destructive">Failed to load statistics</p>
      </CardContent>
    </Card>
  );
}
