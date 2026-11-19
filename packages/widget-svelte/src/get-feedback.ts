import { getContext } from "svelte";
import { FEEDBACK_SLOT_KEY } from "./feedback-slot.js";
import type { FeedbackItem, FeedbackSlot } from "./feedback-slot.js";

export type GetFeedbackReturn = {
  show: () => void;
  hide: () => void;
  readonly isVisible: boolean;
  startAnnotation: () => void;
  readonly feedbackItems: readonly FeedbackItem[];
  togglePins: () => void;
  readonly showPins: boolean;
};

/**
 * Programmatic control of the feedback widget. Must be called during the
 * initialisation of a component under the one that called `initFasterFixes`.
 * Read the state as properties: destructuring them loses reactivity.
 */
export function getFeedback(): GetFeedbackReturn {
  const slot = getContext<FeedbackSlot | undefined>(FEEDBACK_SLOT_KEY);
  if (!slot) {
    throw new Error(
      "getFeedback must be called under a component that called initFasterFixes: call initFasterFixes({ projectId }) in the root component",
    );
  }

  return {
    show: () => slot.instance?.show(),
    hide: () => slot.instance?.hide(),
    get isVisible() {
      return slot.isVisible;
    },
    startAnnotation: () => slot.instance?.startAnnotation(),
    get feedbackItems() {
      return slot.feedbackItems;
    },
    togglePins: () => slot.instance?.togglePins(),
    get showPins() {
      return slot.showPins;
    },
  };
}
