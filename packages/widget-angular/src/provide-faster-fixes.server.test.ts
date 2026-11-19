import { Component } from "@angular/core";
import { bootstrapApplication } from "@angular/platform-browser";
import type { BootstrapContext } from "@angular/platform-browser";
import {
  provideServerRendering,
  renderApplication,
} from "@angular/platform-server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { init } from "@fasterfixes/widget";
import { injectFeedback } from "./inject-feedback.js";
import { provideFasterFixes } from "./provide-faster-fixes.js";

vi.mock("@fasterfixes/widget", () => ({ init: vi.fn() }));

afterEach(() => {
  vi.clearAllMocks();
});

// The one decorator in the package: the probe is JIT-compiled for this test only.
@Component({
  selector: "ff-probe",
  template:
    "<p>{{ isVisible() }}-{{ feedbackItems().length }}-{{ showPins() }}</p>",
})
class Probe {
  private readonly feedback = injectFeedback();
  readonly isVisible = this.feedback.isVisible;
  readonly feedbackItems = this.feedback.feedbackItems;
  readonly showPins = this.feedback.showPins;
}

describe("provideFasterFixes on the server", () => {
  it("renders the application without initialising the Widget", async () => {
    const bootstrap = (context: BootstrapContext) =>
      bootstrapApplication(
        Probe,
        {
          providers: [
            provideServerRendering(),
            provideFasterFixes({ projectId: "proj_1" }),
          ],
        },
        context,
      );

    const html = await renderApplication(bootstrap, {
      document: "<html><head></head><body><ff-probe></ff-probe></body></html>",
      url: "/",
    });

    expect(html).toContain("<p>false-0-true</p>");
    expect(init).not.toHaveBeenCalled();
  });
});
