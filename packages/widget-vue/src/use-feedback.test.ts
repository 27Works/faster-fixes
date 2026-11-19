import { defineComponent, h, nextTick } from "vue";
import { mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { init } from "@fasterfixes/widget";
import type { Widget } from "@fasterfixes/widget";
import { createFakeWidget } from "@fasterfixes/widget/testing";
import type { FakeWidget } from "@fasterfixes/widget/testing";
import { createFasterFixes } from "./create-faster-fixes.js";
import { useFeedback } from "./use-feedback.js";
import type { UseFeedbackReturn } from "./use-feedback.js";

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
  vi.restoreAllMocks();
});

const Probe = defineComponent(() => {
  const { isVisible, feedbackItems, showPins } = useFeedback();
  return () =>
    h(
      "p",
      `${isVisible.value}-${feedbackItems.value.length}-${showPins.value}`,
    );
});

function mountWithPlugin() {
  return mount(Probe, {
    global: { plugins: [createFasterFixes({ projectId: "proj_1" })] },
  });
}

describe("useFeedback", () => {
  it("reads the instance state once mounted", () => {
    widget.emit({ isVisible: false, feedbackItems: [item], showPins: false });

    expect(mountWithPlugin().text()).toBe("false-1-false");
  });

  it("re-renders the calling component when the instance notifies", async () => {
    const wrapper = mountWithPlugin();
    expect(wrapper.text()).toBe("true-0-true");

    widget.emit({ isVisible: false });
    await nextTick();
    expect(wrapper.text()).toBe("false-0-true");

    widget.emit({ feedbackItems: [item] });
    await nextTick();
    expect(wrapper.text()).toBe("false-1-true");

    widget.emit({ showPins: false });
    await nextTick();
    expect(wrapper.text()).toBe("false-1-false");
  });

  it("delegates its methods to the instance", () => {
    let feedback: UseFeedbackReturn | undefined;
    mount(
      defineComponent(() => {
        feedback = useFeedback();
        return () => null;
      }),
      { global: { plugins: [createFasterFixes({ projectId: "proj_1" })] } },
    );

    feedback?.show();
    feedback?.hide();
    feedback?.startAnnotation();
    feedback?.togglePins();

    expect(widget.calls.show).toHaveLength(1);
    expect(widget.calls.hide).toHaveLength(1);
    expect(widget.calls.startAnnotation).toHaveLength(1);
    expect(widget.calls.togglePins).toHaveLength(1);
  });

  it("throws outside the plugin, naming it", () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);

    expect(() => mount(Probe)).toThrow(
      /useFeedback must be used in an app that installed createFasterFixes/,
    );
  });

  it("shares one subscription across components and updates them all", async () => {
    const wrapper = mount(
      defineComponent(() => () => [h(Probe), h(Probe), h(Probe)]),
      { global: { plugins: [createFasterFixes({ projectId: "proj_1" })] } },
    );
    expect(widget.listenerCount).toBe(1);

    widget.emit({ isVisible: false, feedbackItems: [item] });
    await nextTick();

    const texts = wrapper.findAll("p").map((p) => p.text());
    expect(texts).toEqual(["false-1-true", "false-1-true", "false-1-true"]);
  });
});
