import { URL_PARAM_TOKEN } from "@fasterfixes/core";

// Same key as the React Embed, so a pending item survives a switch between Embeds.
export const PENDING_FEEDBACK_KEY = "ff_pending_feedback";

// Matches the React Embed: history API routers do not all emit popstate on push.
const LOCATION_POLL_MS = 500;

type PendingStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;
// A getter, because reading `window.sessionStorage` itself throws when storage is blocked.
type StorageGetter = () => PendingStorage;

/** Whether the Widget may navigate to a Feedback item's page URL. */
export function isNavigableUrl(pageUrl: string) {
  return pageUrl.startsWith("https://") || pageUrl.startsWith("http://");
}

/** Records the item to activate once its page has loaded. */
export function storePendingFeedback(storage: StorageGetter, id: string) {
  try {
    storage().setItem(PENDING_FEEDBACK_KEY, id);
  } catch {
    // Storage can be disabled; the navigation still happens
  }
}

/** Reads and clears the pending item id, so it is restored once only. */
export function takePendingFeedback(storage: StorageGetter) {
  try {
    const store = storage();
    const id = store.getItem(PENDING_FEEDBACK_KEY);
    if (id !== null) store.removeItem(PENDING_FEEDBACK_KEY);
    return id;
  } catch {
    return null;
  }
}

// `init` strips the Reviewer token from the URL, but a router that finishes its
// first navigation afterwards (Vue Router does) writes back the URL it read at
// load. Left there, it leaks into every created item's page URL and hides the
// page's pins. The router's history state is kept so it can still restore it.
function stripTokenParam() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has(URL_PARAM_TOKEN)) return;
  url.searchParams.delete(URL_PARAM_TOKEN);
  window.history.replaceState(window.history.state, "", url.toString());
}

/**
 * Calls `onChange` with the new URL whenever the location changes without a
 * reload, never with a URL that still carries the Reviewer token. Returns a
 * function that stops watching.
 */
export function watchLocation(onChange: (href: string) => void) {
  stripTokenParam();
  let current = window.location.href;
  function check() {
    stripTokenParam();
    const href = window.location.href;
    if (href === current) return;
    current = href;
    onChange(href);
  }
  window.addEventListener("popstate", check);
  const interval = setInterval(check, LOCATION_POLL_MS);
  return () => {
    window.removeEventListener("popstate", check);
    clearInterval(interval);
  };
}
