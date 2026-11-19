import { inject } from "vue";
import type { Ref } from "vue";
import { FEEDBACK_SLOT_KEY } from "./feedback-slot.js";
import type { FeedbackItem } from "./feedback-slot.js";

export type UseFeedbackReturn = {
  show: () => void;
  hide: () => void;
  isVisible: Readonly<Ref<boolean>>;
  startAnnotation: () => void;
  feedbackItems: Readonly<Ref<readonly FeedbackItem[]>>;
  togglePins: () => void;
  showPins: Readonly<Ref<boolean>>;
};

/**
 * Composable for programmatic control of the feedback widget.
 * Must be used in an app that installed `createFasterFixes`.
 */
export function useFeedback(): UseFeedbackReturn {
  const slot = inject(FEEDBACK_SLOT_KEY, null);
  if (!slot) {
    throw new Error(
      "useFeedback must be used in an app that installed createFasterFixes: call app.use(createFasterFixes({ projectId }))",
    );
  }

  return {
    show: () => slot.instance?.show(),
    hide: () => slot.instance?.hide(),
    isVisible: slot.isVisible,
    startAnnotation: () => slot.instance?.startAnnotation(),
    feedbackItems: slot.feedbackItems,
    togglePins: () => slot.instance?.togglePins(),
    showPins: slot.showPins,
  };
}
