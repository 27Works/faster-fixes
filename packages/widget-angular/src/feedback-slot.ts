import { InjectionToken, signal } from "@angular/core";
import type { Signal } from "@angular/core";
import type { Widget } from "@fasterfixes/widget";

export type FeedbackItem = Widget["feedbackItems"][number];

/**
 * Holds the instance the provider mounted, if any, and a copy of its state in
 * signals. One slot per application, so one subscription however many
 * `injectFeedback` calls read it.
 */
export type FeedbackSlot = {
  readonly instance: Widget | null;
  readonly isVisible: Signal<boolean>;
  readonly feedbackItems: Signal<readonly FeedbackItem[]>;
  readonly showPins: Signal<boolean>;
  attach: (widget: Widget) => void;
  release: () => void;
};

function createFeedbackSlot(): FeedbackSlot {
  let current: Widget | null = null;
  let unsubscribe: (() => void) | null = null;
  // What an unmounted Widget reports, as in the React hook's server snapshot.
  const isVisible = signal(false);
  const feedbackItems = signal<readonly FeedbackItem[]>([]);
  const showPins = signal(true);

  const sync = () => {
    if (!current) return;
    isVisible.set(current.isVisible);
    feedbackItems.set(current.feedbackItems);
    showPins.set(current.showPins);
  };

  return {
    get instance() {
      return current;
    },
    isVisible: isVisible.asReadonly(),
    feedbackItems: feedbackItems.asReadonly(),
    showPins: showPins.asReadonly(),
    attach(widget) {
      current = widget;
      unsubscribe = widget.subscribe(sync);
      sync();
    },
    release() {
      unsubscribe?.();
      unsubscribe = null;
      current = null;
    },
  };
}

// Provided in root, so lazy route injectors inherit it rather than getting a second slot.
export const FEEDBACK_SLOT = new InjectionToken<FeedbackSlot>(
  "fasterfixes.slot",
  { providedIn: "root", factory: createFeedbackSlot },
);
