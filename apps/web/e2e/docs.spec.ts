import { expect, test } from "@playwright/test";

test.describe("docs", () => {
  test("a moved page redirects permanently to its new location", async ({
    request,
  }) => {
    const response = await request.get("/docs/widget/react", {
      maxRedirects: 0,
    });

    expect(response.status()).toBe(308);
    expect(response.headers()["location"]).toBe("/docs/widget/install/react");
  });

  test("the useFeedback hook page redirects permanently to Control the Widget", async ({
    request,
  }) => {
    const response = await request.get("/docs/widget/use-feedback-hook", {
      maxRedirects: 0,
    });

    expect(response.status()).toBe(308);
    expect(response.headers()["location"]).toBe(
      "/docs/widget/control-the-widget",
    );
  });

  test("the Other frameworks page redirects permanently into the Install folder", async ({
    request,
  }) => {
    const response = await request.get("/docs/widget/other-frameworks", {
      maxRedirects: 0,
    });

    expect(response.status()).toBe(308);
    expect(response.headers()["location"]).toBe(
      "/docs/widget/install/other-frameworks",
    );
  });

  test("the widget overview links to every install page", async ({ page }) => {
    await page.goto("/docs/widget/overview");

    // The sidebar links to the same pages, so target the cards in the page body.
    // Hrefs rather than clicks: on the CI dev server, a click can land before
    // hydration and never navigate.
    const cards = page.getByRole("article");
    for (const [name, href] of [
      [/^React/, "/docs/widget/install/react"],
      [/^Vue/, "/docs/widget/install/vue"],
      [/^Angular/, "/docs/widget/install/angular"],
      [/^Svelte/, "/docs/widget/install/svelte"],
      [/^Script embed/, "/docs/widget/install/script-embed"],
      [/^Other frameworks/, "/docs/widget/install/other-frameworks"],
    ] as const) {
      // `first`: the footer's next-page link also starts with "React".
      await expect(cards.getByRole("link", { name }).first()).toHaveAttribute(
        "href",
        href,
      );
    }
  });

  test("the widget overview links to the Vue install page", async ({
    page,
  }) => {
    await page.goto("/docs/widget/overview");

    await expect(
      page.getByRole("article").getByRole("link", { name: /^Vue/ }),
    ).toHaveAttribute("href", "/docs/widget/install/vue");

    await page.goto("/docs/widget/install/vue");
    await expect(
      page.getByRole("heading", { level: 1, name: "Vue" }),
    ).toBeVisible();
  });

  test("the overview and the quickstart link to the Angular install page", async ({
    page,
  }) => {
    await page.goto("/docs/widget/overview");

    await expect(
      page.getByRole("article").getByRole("link", { name: /^Angular/ }),
    ).toHaveAttribute("href", "/docs/widget/install/angular");

    await page.goto("/docs/getting-started/quickstart");
    await expect(
      page.getByRole("article").getByRole("link", { name: /^Angular/ }),
    ).toHaveAttribute("href", "/docs/widget/install/angular");

    await page.goto("/docs/widget/install/angular");
    await expect(
      page.getByRole("heading", { level: 1, name: "Angular" }),
    ).toBeVisible();
  });

  test("the overview and the quickstart link to the Svelte install page", async ({
    page,
  }) => {
    await page.goto("/docs/widget/overview");

    await expect(
      page.getByRole("article").getByRole("link", { name: /^Svelte/ }),
    ).toHaveAttribute("href", "/docs/widget/install/svelte");

    await page.goto("/docs/getting-started/quickstart");
    await expect(
      page.getByRole("article").getByRole("link", { name: /^Svelte/ }),
    ).toHaveAttribute("href", "/docs/widget/install/svelte");

    await page.goto("/docs/widget/install/svelte");
    await expect(
      page.getByRole("heading", { level: 1, name: "Svelte" }),
    ).toBeVisible();
  });
});
