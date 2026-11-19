import { describe, expect, it } from "vitest";
import {
  getBoardSummary,
  getWaitingDays,
  isWaitingTooLong,
} from "./board-summary";

const now = new Date("2026-09-27T12:00:00Z");

function daysAgo(days: number) {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

describe("getWaitingDays", () => {
  it("counts calendar days since creation", () => {
    expect(getWaitingDays(daysAgo(5), now)).toBe(5);
  });

  it("never returns a negative count for a future date", () => {
    expect(getWaitingDays(daysAgo(-2), now)).toBe(0);
  });
});

describe("isWaitingTooLong", () => {
  it("flags a New Feedback older than the threshold", () => {
    expect(
      isWaitingTooLong(
        { status: "new", createdAt: daysAgo(3), assignee: null },
        now,
      ),
    ).toBe(true);
  });

  it("does not flag a recent New Feedback", () => {
    expect(
      isWaitingTooLong(
        { status: "new", createdAt: daysAgo(2), assignee: null },
        now,
      ),
    ).toBe(false);
  });

  it("does not flag an old Feedback that has left New", () => {
    expect(
      isWaitingTooLong(
        { status: "in_progress", createdAt: daysAgo(30), assignee: null },
        now,
      ),
    ).toBe(false);
  });
});

describe("getBoardSummary", () => {
  it("counts each board status and the New items without an assignee", () => {
    const summary = getBoardSummary(
      [
        { status: "new", createdAt: daysAgo(1), assignee: null },
        { status: "new", createdAt: daysAgo(6), assignee: { id: "m1" } },
        { status: "in_progress", createdAt: daysAgo(2), assignee: null },
        { status: "resolved", createdAt: daysAgo(10), assignee: null },
      ],
      now,
    );

    expect(summary).toEqual({
      total: 4,
      newCount: 2,
      inProgressCount: 1,
      resolvedCount: 1,
      resolvedPercent: 25,
      unassignedNewCount: 1,
      oldestNewWaitingDays: 6,
    });
  });

  it("ignores Archived Feedback", () => {
    const summary = getBoardSummary(
      [
        { status: "closed", createdAt: daysAgo(40), assignee: null },
        { status: "resolved", createdAt: daysAgo(1), assignee: null },
      ],
      now,
    );

    expect(summary.total).toBe(1);
    expect(summary.resolvedPercent).toBe(100);
  });

  it("returns zeros for an empty board", () => {
    expect(getBoardSummary([], now)).toEqual({
      total: 0,
      newCount: 0,
      inProgressCount: 0,
      resolvedCount: 0,
      resolvedPercent: 0,
      unassignedNewCount: 0,
      oldestNewWaitingDays: 0,
    });
  });
});
