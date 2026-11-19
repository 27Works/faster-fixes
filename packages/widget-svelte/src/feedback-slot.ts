import { createSubscriber } from "svelte/reactivity";
import type { Widget } from "@fasterfixes/widget";

export type FeedbackItem = Widget["feedbackItems"][number];

/**
 * Holds the instance `initFasterFixes` mounted, if any, and exposes its state
 * as reactive getters. One slot per install, so one subscription however many
 * components read it.
 */
export type FeedbackSlot = {
  readonly instance: Widget | null;
  readonly isVisible: boolean;
  readonly feedbackItems: readonly FeedbackItem[];
  readonly showPins: boolean;
  attach: (widget: Widget) => void;
  release: () => void;
};

export function createFeedbackSlot(): FeedbackSlot {
  let current: Widget | null = null;
  let unsubscribe: (() => void) | null = null;
  // Set while at least one effect reads the state; createSubscriber counts them.
  let notify: (() => void) | null = null;
  const track = createSubscriber((update) => {
    notify = update;
    return () => {
      notify = null;
    };
  });

  return {
    get instance() {
      return current;
    },
    // Without an instance, what an unmounted Widget reports, as in the React
    // hook's server snapshot.
    get isVisible() {
      track();
      return current?.isVisible ?? false;
    },
    get feedbackItems() {
      track();
      return current?.feedbackItems ?? [];
    },
    get showPins() {
      track();
      return current?.showPins ?? true;
    },
    attach(widget) {
      current = widget;
      unsubscribe = widget.subscribe(() => notify?.());
    },
    release() {
      unsubscribe?.();
      unsubscribe = null;
      current = null;
    },
  };
}

export const FEEDBACK_SLOT_KEY = Symbol("fasterfixes");
