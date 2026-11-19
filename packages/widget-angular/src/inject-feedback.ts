import { inject } from "@angular/core";
import type { Signal } from "@angular/core";
import { FEEDBACK_SLOT } from "./feedback-slot.js";
import type { FeedbackItem } from "./feedback-slot.js";
import { FASTER_FIXES_OPTIONS } from "./provide-faster-fixes.js";

export type InjectFeedbackReturn = {
  show: () => void;
  hide: () => void;
  isVisible: Signal<boolean>;
  startAnnotation: () => void;
  feedbackItems: Signal<readonly FeedbackItem[]>;
  togglePins: () => void;
  showPins: Signal<boolean>;
};

/**
 * Programmatic control of the feedback widget. Must be called in an injection
 * context below `provideFasterFixes`.
 */
export function injectFeedback(): InjectFeedbackReturn {
  if (!inject(FASTER_FIXES_OPTIONS, { optional: true })) {
    throw new Error(
      "injectFeedback must be used in an application that provides provideFasterFixes: add provideFasterFixes({ projectId }) to the providers of your application config",
    );
  }
  const slot = inject(FEEDBACK_SLOT);

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
