import { isPlatformBrowser } from "@angular/common";
import {
  DestroyRef,
  InjectionToken,
  PLATFORM_ID,
  inject,
  makeEnvironmentProviders,
  provideEnvironmentInitializer,
} from "@angular/core";
import type { EnvironmentProviders } from "@angular/core";
import { init } from "@fasterfixes/widget";
import type { WidgetOptions } from "@fasterfixes/widget";
import { isDevelopment } from "./environment.js";
import { FEEDBACK_SLOT } from "./feedback-slot.js";

export const FASTER_FIXES_OPTIONS = new InjectionToken<WidgetOptions>(
  "fasterfixes.options",
);

/**
 * Environment providers that mount the Widget. The options are the Widget's
 * own, forwarded unchanged to `init`, and read once for the lifetime of the
 * application.
 */
export function provideFasterFixes(
  options: WidgetOptions,
): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: FASTER_FIXES_OPTIONS, useValue: options },
    provideEnvironmentInitializer(() => {
      // On the server the slot keeps its unmounted values.
      if (!isPlatformBrowser(inject(PLATFORM_ID))) return;

      const slot = inject(FEEDBACK_SLOT);
      // The slot is provided in root, so a second provider, in the same
      // providers or a lazy route's, finds the first one's instance.
      if (slot.instance) {
        if (isDevelopment()) {
          console.warn(
            "[faster-fixes] `provideFasterFixes` is already provided in this application. The second provider is ignored.",
          );
        }
        return;
      }

      const widget = init(options);
      slot.attach(widget);
      inject(DestroyRef).onDestroy(() => {
        // Release before destroy: destroy drops every listener, ours included.
        slot.release();
        widget.destroy();
      });
    }),
  ]);
}
