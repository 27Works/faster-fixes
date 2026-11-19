import { afterEach, describe, expect, it, vi } from "vitest";

import {
  isNavigableUrl,
  PENDING_FEEDBACK_KEY,
  storePendingFeedback,
  takePendingFeedback,
  watchLocation,
} from "./navigation.js";

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    values,
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => void values.set(key, value),
    removeItem: (key: string) => void values.delete(key),
  };
}

function blockedStorage(): Storage {
  throw new Error("SecurityError");
}

describe("pending Feedback", () => {
  it("uses the key the React Embed reads", () => {
    expect(PENDING_FEEDBACK_KEY).toBe("ff_pending_feedback");
  });

  it("returns the stored id once, then nothing", () => {
    const storage = memoryStorage();
    storePendingFeedback(() => storage, "fb_1");
    expect(takePendingFeedback(() => storage)).toBe("fb_1");
    expect(storage.values.size).toBe(0);
    expect(takePendingFeedback(() => storage)).toBeNull();
  });

  it("returns nothing when no item is pending", () => {
    expect(takePendingFeedback(memoryStorage)).toBeNull();
  });

  it("tolerates blocked storage", () => {
    expect(() => storePendingFeedback(blockedStorage, "fb_1")).not.toThrow();
    expect(takePendingFeedback(blockedStorage)).toBeNull();
  });
});

describe("isNavigableUrl", () => {
  it("accepts http and https page URLs", () => {
    expect(isNavigableUrl("https://example.com/pricing")).toBe(true);
    expect(isNavigableUrl("http://localhost:3000/")).toBe(true);
  });

  it("rejects other schemes and relative values", () => {
    expect(isNavigableUrl("javascript:alert(1)")).toBe(false);
    expect(isNavigableUrl("/pricing")).toBe(false);
    expect(isNavigableUrl("")).toBe(false);
  });
});

// A window whose history API moves `location.href`, as a router drives it.
function fakeWindow(href: string) {
  const location = { href };
  const history = {
    state: { router: "home" } as unknown,
    replaceState(state: unknown, _unused: string, url: string) {
      history.state = state;
      location.href = url;
    },
  };
  vi.stubGlobal("window", {
    location,
    history,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  });
  return { location, history };
}

describe("watchLocation", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("strips a Reviewer token a router writes back after init", () => {
    vi.useFakeTimers();
    const { location, history } = fakeWindow("https://example.com/");
    const changes: string[] = [];
    const stop = watchLocation((href) => changes.push(href));

    // Vue Router ends its first navigation with the URL it read at load.
    history.replaceState(
      { router: "home" },
      "",
      "https://example.com/?ff_token=rt_1&tab=2",
    );
    vi.advanceTimersByTime(500);

    expect(location.href).toBe("https://example.com/?tab=2");
    expect(history.state).toEqual({ router: "home" });
    expect(changes).toEqual(["https://example.com/?tab=2"]);
    stop();
  });

  it("strips a token already in the URL when watching starts", () => {
    const { location } = fakeWindow(
      "https://example.com/pricing?ff_token=rt_1",
    );
    const stop = watchLocation(() => undefined);

    expect(location.href).toBe("https://example.com/pricing");
    stop();
  });
});
