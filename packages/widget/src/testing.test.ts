import { describe, expect, it } from "vitest";
import type { FeedbackItem } from "@fasterfixes/core";

import { createFakeWidget } from "./testing.js";

const item = { id: "fb_1" } as FeedbackItem;

describe("createFakeWidget", () => {
  it("records every call per method", () => {
    const widget = createFakeWidget();
    const listener = () => undefined;

    widget.show();
    widget.show();
    widget.hide();
    widget.startAnnotation();
    widget.togglePins();
    widget.subscribe(listener);
    widget.destroy();

    expect(widget.calls.show).toEqual([[], []]);
    expect(widget.calls.hide).toEqual([[]]);
    expect(widget.calls.startAnnotation).toEqual([[]]);
    expect(widget.calls.togglePins).toEqual([[]]);
    expect(widget.calls.subscribe).toEqual([[listener]]);
    expect(widget.calls.destroy).toEqual([[]]);
  });

  it("starts visible, with no Feedback and pins shown", () => {
    const widget = createFakeWidget();

    expect(widget.isVisible).toBe(true);
    expect(widget.feedbackItems).toEqual([]);
    expect(widget.showPins).toBe(true);
  });

  it("applies an emitted patch and notifies every subscriber", () => {
    const widget = createFakeWidget();
    const seen: string[] = [];
    widget.subscribe(() => seen.push("a"));
    widget.subscribe(() => seen.push("b"));

    widget.emit({ isVisible: false, feedbackItems: [item] });

    expect(seen).toEqual(["a", "b"]);
    expect(widget.isVisible).toBe(false);
    expect(widget.feedbackItems).toEqual([item]);
    expect(widget.showPins).toBe(true);
  });

  it("stops notifying a listener once it unsubscribes", () => {
    const widget = createFakeWidget();
    let notified = 0;
    const unsubscribe = widget.subscribe(() => (notified += 1));

    unsubscribe();
    widget.emit({ showPins: false });

    expect(notified).toBe(0);
    expect(widget.listenerCount).toBe(0);
  });

  it("clears every listener on destroy", () => {
    const widget = createFakeWidget();
    let notified = 0;
    widget.subscribe(() => (notified += 1));
    widget.subscribe(() => (notified += 1));

    widget.destroy();
    widget.emit({ isVisible: false });

    expect(widget.listenerCount).toBe(0);
    expect(notified).toBe(0);
  });
});
