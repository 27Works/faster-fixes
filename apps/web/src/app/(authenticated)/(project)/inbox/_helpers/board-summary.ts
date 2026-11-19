import { differenceInCalendarDays } from "date-fns";

// A New Feedback nobody has moved for this long is flagged as waiting.
export const WAITING_THRESHOLD_DAYS = 3;

type BoardFeedback = {
  status: string;
  createdAt: Date;
  assignee: unknown;
};

type BoardSummary = {
  total: number;
  newCount: number;
  inProgressCount: number;
  resolvedCount: number;
  resolvedPercent: number;
  unassignedNewCount: number;
  oldestNewWaitingDays: number;
};

export function getWaitingDays(createdAt: Date, now: Date) {
  return Math.max(0, differenceInCalendarDays(now, createdAt));
}

export function isWaitingTooLong(feedback: BoardFeedback, now: Date) {
  return (
    feedback.status === "new" &&
    getWaitingDays(feedback.createdAt, now) >= WAITING_THRESHOLD_DAYS
  );
}

export function getBoardSummary(
  feedback: BoardFeedback[],
  now: Date,
): BoardSummary {
  const newItems = feedback.filter((f) => f.status === "new");
  const inProgressCount = feedback.filter(
    (f) => f.status === "in_progress",
  ).length;
  const resolvedCount = feedback.filter((f) => f.status === "resolved").length;
  const total = newItems.length + inProgressCount + resolvedCount;

  return {
    total,
    newCount: newItems.length,
    inProgressCount,
    resolvedCount,
    resolvedPercent: total ? Math.round((resolvedCount / total) * 100) : 0,
    unassignedNewCount: newItems.filter((f) => !f.assignee).length,
    oldestNewWaitingDays: Math.max(
      0,
      ...newItems.map((f) => getWaitingDays(f.createdAt, now)),
    ),
  };
}
