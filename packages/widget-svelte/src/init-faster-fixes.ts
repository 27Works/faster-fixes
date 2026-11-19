import { hasContext, onDestroy, setContext } from "svelte";
import { init } from "@fasterfixes/widget";
import type { WidgetOptions } from "@fasterfixes/widget";
import { isDevelopment } from "./environment.js";
import { FEEDBACK_SLOT_KEY, createFeedbackSlot } from "./feedback-slot.js";

/**
 * Mounts the Widget for the component tree under the calling component. Call
 * it in the script of the root component. The options are the Widget's own,
 * forwarded unchanged to `init`, and read once.
 */
export function initFasterFixes(options: WidgetOptions): void {
  if (hasContext(FEEDBACK_SLOT_KEY)) {
    if (isDevelopment()) {
      console.warn(
        "[faster-fixes] `initFasterFixes` is already called under this root. The second call is ignored.",
      );
    }
    return;
  }

  const slot = createFeedbackSlot();
  // Set on the server too, so `getFeedback` renders the defaults.
  setContext(FEEDBACK_SLOT_KEY, slot);
  if (typeof document === "undefined") return;

  // At the call, not in onMount: children mount before their parent, so a
  // child's onMount would otherwise find no instance.
  const widget = init(options);
  slot.attach(widget);
  onDestroy(() => {
    // Release before destroy: destroy drops every listener, ours included.
    slot.release();
    widget.destroy();
  });
}
