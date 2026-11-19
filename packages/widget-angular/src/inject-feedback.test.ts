import { TestBed } from "@angular/core/testing";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { init } from "@fasterfixes/widget";
import type { Widget } from "@fasterfixes/widget";
import { createFakeWidget } from "@fasterfixes/widget/testing";
import type { FakeWidget } from "@fasterfixes/widget/testing";
import { injectFeedback } from "./inject-feedback.js";
import { provideFasterFixes } from "./provide-faster-fixes.js";

vi.mock("@fasterfixes/widget", () => ({ init: vi.fn() }));

const initMock = vi.mocked(init);
let widget: FakeWidget;

const item = { id: "fb_1" } as Widget["feedbackItems"][number];

beforeEach(() => {
  widget = createFakeWidget();
  initMock.mockReturnValue(widget);
});

afterEach(() => {
  vi.clearAllMocks();
});

function injectWithProvider() {
  TestBed.configureTestingModule({
    providers: [provideFasterFixes({ projectId: "proj_1" })],
  });
  return TestBed.runInInjectionContext(() => injectFeedback());
}

function read(feedback: ReturnType<typeof injectFeedback>) {
  return `${feedback.isVisible()}-${feedback.feedbackItems().length}-${feedback.showPins()}`;
}

describe("injectFeedback", () => {
  it("reads the instance state once mounted", () => {
    widget.emit({ isVisible: false, feedbackItems: [item], showPins: false });

    expect(read(injectWithProvider())).toBe("false-1-false");
  });

  it("updates its signals when the instance notifies", () => {
    const feedback = injectWithProvider();
    expect(read(feedback)).toBe("true-0-true");

    widget.emit({ isVisible: false });
    expect(read(feedback)).toBe("false-0-true");

    widget.emit({ feedbackItems: [item] });
    expect(read(feedback)).toBe("false-1-true");

    widget.emit({ showPins: false });
    expect(read(feedback)).toBe("false-1-false");
  });

  it("returns read-only signals", () => {
    const feedback = injectWithProvider();

    expect(feedback.isVisible).not.toHaveProperty("set");
    expect(feedback.feedbackItems).not.toHaveProperty("set");
    expect(feedback.showPins).not.toHaveProperty("set");
  });

  it("delegates its methods to the instance", () => {
    const feedback = injectWithProvider();

    feedback.show();
    feedback.hide();
    feedback.startAnnotation();
    feedback.togglePins();

    expect(widget.calls.show).toHaveLength(1);
    expect(widget.calls.hide).toHaveLength(1);
    expect(widget.calls.startAnnotation).toHaveLength(1);
    expect(widget.calls.togglePins).toHaveLength(1);
  });

  it("throws without the provider, naming it", () => {
    expect(() => TestBed.runInInjectionContext(() => injectFeedback())).toThrow(
      /injectFeedback must be used in an application that provides provideFasterFixes/,
    );
    expect(initMock).not.toHaveBeenCalled();
  });

  it("shares one subscription across calls and updates them all", () => {
    TestBed.configureTestingModule({
      providers: [provideFasterFixes({ projectId: "proj_1" })],
    });
    const calls = TestBed.runInInjectionContext(() => [
      injectFeedback(),
      injectFeedback(),
      injectFeedback(),
    ]);
    expect(widget.listenerCount).toBe(1);

    widget.emit({ isVisible: false, feedbackItems: [item] });

    expect(calls.map(read)).toEqual([
      "false-1-true",
      "false-1-true",
      "false-1-true",
    ]);
  });
});
