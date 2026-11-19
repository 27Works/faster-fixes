// @vitest-environment node
import { render } from "svelte/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { init } from "@fasterfixes/widget";
import Root from "./test-components/Root.svelte";

vi.mock("@fasterfixes/widget", () => ({ init: vi.fn() }));

afterEach(() => {
  vi.clearAllMocks();
});

describe("initFasterFixes on the server", () => {
  it("renders the children without initialising the Widget", () => {
    const { body } = render(Root, {
      props: { options: { projectId: "proj_1" } },
    });

    expect(body).toContain("<p>false-0-true</p>");
    expect(init).not.toHaveBeenCalled();
  });
});
