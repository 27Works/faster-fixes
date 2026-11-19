import { init } from "@fasterfixes/widget";
import type { WidgetOptions } from "@fasterfixes/widget";
import type { App, Plugin } from "vue";
import { isDevelopment } from "./environment.js";
import { FEEDBACK_SLOT_KEY, createFeedbackSlot } from "./feedback-slot.js";

const installedApps = new WeakSet<App>();

/**
 * Vue plugin that mounts the Widget. The options are the Widget's own,
 * forwarded unchanged to `init`, and read once for the lifetime of the app.
 */
export function createFasterFixes(options: WidgetOptions): Plugin {
  return {
    install(app) {
      // Each call returns a new plugin object, so Vue's own dedupe misses it.
      if (installedApps.has(app)) {
        if (isDevelopment()) {
          console.warn(
            "[faster-fixes] `createFasterFixes` is already installed on this app. The second install is ignored.",
          );
        }
        return;
      }
      installedApps.add(app);

      const slot = createFeedbackSlot();
      // Provided on the server too, so `useFeedback` renders the defaults.
      app.provide(FEEDBACK_SLOT_KEY, slot);
      if (typeof document === "undefined") return;

      const widget = init(options);
      slot.attach(widget);
      app.onUnmount(() => {
        // Release before destroy: destroy drops every listener, ours included.
        slot.release();
        widget.destroy();
      });
    },
  };
}
