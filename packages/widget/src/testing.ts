/**
 * @unstable Testing API. No semver guarantees. May change or be removed in
 * any release. A Widget double for the tests of framework Embeds.
 */
import type { FeedbackItem } from "@fasterfixes/core";

import type { Widget } from "./instance.js";

type FakeWidgetState = {
  isVisible?: boolean;
  feedbackItems?: readonly FeedbackItem[];
  showPins?: boolean;
};

type RecordedMethod =
  | "show"
  | "hide"
  | "startAnnotation"
  | "togglePins"
  | "subscribe"
  | "destroy";

export type FakeWidget = Widget & {
  /** The arguments of every call, per method, in call order. */
  readonly calls: { readonly [M in RecordedMethod]: readonly unknown[][] };
  /** Updates the state and notifies every subscriber. */
  emit: (patch: FakeWidgetState) => void;
  readonly listenerCount: number;
};

/**
 * Records calls itself rather than through a test runner's spies, so it works
 * under any runner.
 */
export function createFakeWidget(): FakeWidget {
  const listeners = new Set<() => void>();
  let isVisible = true;
  let feedbackItems: readonly FeedbackItem[] = [];
  let showPins = true;

  const calls: Record<RecordedMethod, unknown[][]> = {
    show: [],
    hide: [],
    startAnnotation: [],
    togglePins: [],
    subscribe: [],
    destroy: [],
  };

  return {
    show() {
      calls.show.push([]);
    },
    hide() {
      calls.hide.push([]);
    },
    get isVisible() {
      return isVisible;
    },
    startAnnotation() {
      calls.startAnnotation.push([]);
    },
    get feedbackItems() {
      return feedbackItems;
    },
    togglePins() {
      calls.togglePins.push([]);
    },
    get showPins() {
      return showPins;
    },
    subscribe(listener) {
      calls.subscribe.push([listener]);
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    destroy() {
      calls.destroy.push([]);
      listeners.clear();
    },
    calls,
    emit(patch) {
      isVisible = patch.isVisible ?? isVisible;
      feedbackItems = patch.feedbackItems ?? feedbackItems;
      showPins = patch.showPins ?? showPins;
      [...listeners].forEach((listener) => listener());
    },
    get listenerCount() {
      return listeners.size;
    },
  };
}
