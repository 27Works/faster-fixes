import { describe, expect, it } from "vitest";
import { getParisMonthKey, listParisMonths } from "./paris-months";

describe("listParisMonths", () => {
  it("starts each month at midnight Paris time, in winter and in summer", () => {
    const months = listParisMonths(new Date("2026-04-15T12:00:00Z"), 2);

    expect(months).toEqual([
      {
        key: "2026-03",
        start: new Date("2026-02-28T23:00:00Z"),
        end: new Date("2026-03-31T22:00:00Z"),
        label: "Mar",
        fullLabel: "March 2026",
        isPartial: false,
      },
      {
        key: "2026-04",
        start: new Date("2026-03-31T22:00:00Z"),
        end: new Date("2026-04-30T22:00:00Z"),
        label: "Apr",
        fullLabel: "April 2026",
        isPartial: true,
      },
    ]);
  });

  it("takes the current month from Paris time, not UTC", () => {
    // 00:30 on 1 May in Paris, still 30 April in UTC.
    const months = listParisMonths(new Date("2026-04-30T22:30:00Z"), 1);

    expect(months[0]?.key).toBe("2026-05");
  });

  it("crosses a year boundary", () => {
    const months = listParisMonths(new Date("2026-01-10T12:00:00Z"), 2);

    expect(months.map((month) => month.key)).toEqual(["2025-12", "2026-01"]);
  });
});

describe("getParisMonthKey", () => {
  it("keys the last evening of a month to that month", () => {
    expect(getParisMonthKey(new Date("2026-08-31T21:59:59Z"))).toBe("2026-08");
    expect(getParisMonthKey(new Date("2026-08-31T22:00:00Z"))).toBe("2026-09");
  });
});
