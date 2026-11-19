import { flushSync, mount, unmount } from "svelte";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { init } from "@fasterfixes/widget";
import type { Widget } from "@fasterfixes/widget";
import { createFakeWidget } from "@fasterfixes/widget/testing";
import type { FakeWidget } from "@fasterfixes/widget/testing";
import type { GetFeedbackReturn } from "./get-feedback.js";
import Probe from "./test-components/Probe.svelte";
import Root from "./test-components/Root.svelte";

vi.mock("@fasterfixes/widget", () => ({ init: vi.fn() }));

const initMock = vi.mocked(init);
let widget: FakeWidget;
let component: ReturnType<typeof mount> | undefined;

const item = { id: "fb_1" } as Widget["feedbackItems"][number];

beforeEach(() => {
  widget = createFakeWidget();
  initMock.mockReturnValue(widget);
});

afterEach(async () => {
  if (component) await unmount(component);
  component = undefined;
  document.body.innerHTML = "";
  vi.clearAllMocks();
});

// Svelte's ambient `*.svelte` declaration leaves component props untyped.
type RootProps = {
  probes?: number;
  onFeedback?: (feedback: GetFeedbackReturn) => void;
};

function mountRoot(props: RootProps = {}) {
  component = mount(Root, {
    target: document.body,
    props: { options: { projectId: "proj_1" }, ...props },
  });
  flushSync();
}

function renderedTexts() {
  return Array.from(document.querySelectorAll("p"), (p) => p.textContent);
}

describe("getFeedback", () => {
  it("reads the instance state once mounted", () => {
    widget.emit({ isVisible: false, feedbackItems: [item], showPins: false });
    mountRoot();

    expect(renderedTexts()).toEqual(["false-1-false"]);
  });

  it("updates the rendering component when the instance notifies", () => {
    mountRoot();
    expect(renderedTexts()).toEqual(["true-0-true"]);

    widget.emit({ isVisible: false });
    flushSync();
    expect(renderedTexts()).toEqual(["false-0-true"]);

    widget.emit({ feedbackItems: [item] });
    flushSync();
    expect(renderedTexts()).toEqual(["false-1-true"]);

    widget.emit({ showPins: false });
    flushSync();
    expect(renderedTexts()).toEqual(["false-1-false"]);
  });

  it("delegates its methods to the instance", () => {
    let feedback: GetFeedbackReturn | undefined;
    mountRoot({ onFeedback: (value) => (feedback = value) });

    feedback?.show();
    feedback?.hide();
    feedback?.startAnnotation();
    feedback?.togglePins();

    expect(widget.calls.show).toHaveLength(1);
    expect(widget.calls.hide).toHaveLength(1);
    expect(widget.calls.startAnnotation).toHaveLength(1);
    expect(widget.calls.togglePins).toHaveLength(1);
  });

  it("throws outside an install, naming initFasterFixes", () => {
    expect(() => mount(Probe, { target: document.body })).toThrow(
      /getFeedback must be called under a component that called initFasterFixes: call initFasterFixes\(\{ projectId \}\)/,
    );
  });

  it("shares one subscription across components and updates them all", () => {
    mountRoot({ probes: 2 });
    expect(renderedTexts()).toEqual(["true-0-true", "true-0-true"]);

    expect(widget.listenerCount).toBe(1);

    widget.emit({ isVisible: false, feedbackItems: [item] });
    flushSync();
    expect(renderedTexts()).toEqual(["false-1-true", "false-1-true"]);
  });
});
