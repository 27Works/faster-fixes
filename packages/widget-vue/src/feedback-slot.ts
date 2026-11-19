import { shallowReadonly, shallowRef } from "vue";
import type { InjectionKey, Ref } from "vue";
import type { Widget } from "@fasterfixes/widget";

export type FeedbackItem = Widget["feedbackItems"][number];

/**
 * Holds the instance the plugin mounted, if any, and a copy of its state in
 * refs. One slot per app, so one subscription however many components read it.
 */
export type FeedbackSlot = {
  readonly instance: Widget | null;
  readonly isVisible: Readonly<Ref<boolean>>;
  readonly feedbackItems: Readonly<Ref<readonly FeedbackItem[]>>;
  readonly showPins: Readonly<Ref<boolean>>;
  attach: (widget: Widget) => void;
  release: () => void;
};

export function createFeedbackSlot(): FeedbackSlot {
  let current: Widget | null = null;
  let unsubscribe: (() => void) | null = null;
  // What an unmounted Widget reports, as in the React hook's server snapshot.
  const isVisible = shallowRef(false);
  const feedbackItems = shallowRef<readonly FeedbackItem[]>([]);
  const showPins = shallowRef(true);

  const sync = () => {
    if (!current) return;
    isVisible.value = current.isVisible;
    feedbackItems.value = current.feedbackItems;
    showPins.value = current.showPins;
  };

  return {
    get instance() {
      return current;
    },
    isVisible: shallowReadonly(isVisible),
    feedbackItems: shallowReadonly(feedbackItems),
    showPins: shallowReadonly(showPins),
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

export const FEEDBACK_SLOT_KEY: InjectionKey<FeedbackSlot> =
  Symbol("fasterfixes");
