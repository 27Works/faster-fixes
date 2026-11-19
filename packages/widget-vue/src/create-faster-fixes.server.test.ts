// @vitest-environment node
import { createSSRApp, defineComponent, h } from "vue";
import { renderToString } from "vue/server-renderer";
import { afterEach, describe, expect, it, vi } from "vitest";
import { init } from "@fasterfixes/widget";
import { createFasterFixes } from "./create-faster-fixes.js";
import { useFeedback } from "./use-feedback.js";

vi.mock("@fasterfixes/widget", () => ({ init: vi.fn() }));

afterEach(() => {
  vi.clearAllMocks();
});

describe("createFasterFixes on the server", () => {
  it("renders the children without initialising the Widget", async () => {
    const Probe = defineComponent(() => {
      const { isVisible, feedbackItems, showPins } = useFeedback();
      return () =>
        h(
          "p",
          `${isVisible.value}-${feedbackItems.value.length}-${showPins.value}`,
        );
    });
    const app = createSSRApp(Probe);
    app.use(createFasterFixes({ projectId: "proj_1" }));

    const html = await renderToString(app);

    expect(html).toBe("<p>false-0-true</p>");
    expect(init).not.toHaveBeenCalled();
  });
});
