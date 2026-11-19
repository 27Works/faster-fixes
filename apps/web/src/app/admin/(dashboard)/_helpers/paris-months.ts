// Chart months follow the operator's calendar in Europe/Paris, whatever the
// process timezone (Vitest pins UTC, servers may run anywhere).
const TIME_ZONE = "Europe/Paris";

const partsFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  second: "numeric",
  hourCycle: "h23",
});

const monthFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  month: "short",
});

const fullMonthFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  month: "long",
  year: "numeric",
});

function getParisParts(instant: Date) {
  const parts = Object.fromEntries(
    partsFormatter
      .formatToParts(instant)
      .map((part) => [part.type, Number(part.value)]),
  );
  return {
    year: parts.year ?? 0,
    monthIndex: (parts.month ?? 1) - 1,
    day: parts.day ?? 1,
    hour: parts.hour ?? 0,
    minute: parts.minute ?? 0,
    second: parts.second ?? 0,
  };
}

// Milliseconds Paris wall-clock time is ahead of UTC at `instant`.
function getParisOffsetMs(instant: Date) {
  const parts = getParisParts(instant);
  const wallClockAsUtc = Date.UTC(
    parts.year,
    parts.monthIndex,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
  return wallClockAsUtc - Math.floor(instant.getTime() / 1000) * 1000;
}

// The instant of midnight on the first day of a Paris month. `monthIndex` may
// overflow, as with `Date.UTC`. The offset is resolved twice because it can
// differ between the UTC guess and the actual Paris midnight.
function getParisMonthStart(year: number, monthIndex: number) {
  const wallClockAsUtc = Date.UTC(year, monthIndex, 1);
  const guess = wallClockAsUtc - getParisOffsetMs(new Date(wallClockAsUtc));
  return new Date(wallClockAsUtc - getParisOffsetMs(new Date(guess)));
}

export function getParisMonthKey(instant: Date) {
  const { year, monthIndex } = getParisParts(instant);
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
}

// The last `count` Paris months up to and including the one holding `now`,
// oldest first. Each month includes its `start` and excludes its `end`.
export function listParisMonths(now: Date, count: number) {
  const { year, monthIndex } = getParisParts(now);
  return Array.from({ length: count }, (_, index) => {
    const offset = index - (count - 1);
    const start = getParisMonthStart(year, monthIndex + offset);
    return {
      key: getParisMonthKey(start),
      start,
      end: getParisMonthStart(year, monthIndex + offset + 1),
      label: monthFormatter.format(start),
      fullLabel: fullMonthFormatter.format(start),
      isPartial: offset === 0,
    };
  });
}
