import { afterEach, describe, expect, it, vi } from "vitest";

// The base URL is read once at module load, as Next inlines it at build time.
async function loadResolveS3Url(baseUrl: string | undefined) {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_STORAGE_BASE_URL", baseUrl);
  const { resolveS3Url } = await import("@/utils/url/resolve-s3-url");
  return resolveS3Url;
}

describe("resolveS3Url", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("prefixes a stored key with the public bucket URL", async () => {
    const resolveS3Url = await loadResolveS3Url("https://cdn.test/bucket");

    expect(resolveS3Url("user-avatars/user_1/1.png")).toBe(
      "https://cdn.test/bucket/user-avatars/user_1/1.png",
    );
  });

  it("prefixes a stored key with the app storage route", async () => {
    const resolveS3Url = await loadResolveS3Url("/api/storage/uploads");

    expect(resolveS3Url("organization-logos/org_1/1.webp")).toBe(
      "/api/storage/uploads/organization-logos/org_1/1.webp",
    );
  });

  it("returns an absolute URL untouched", async () => {
    const resolveS3Url = await loadResolveS3Url("https://cdn.test/bucket");

    expect(resolveS3Url("https://avatars.githubusercontent.com/u/1")).toBe(
      "https://avatars.githubusercontent.com/u/1",
    );
    expect(resolveS3Url("http://avatars.test/u/1")).toBe(
      "http://avatars.test/u/1",
    );
  });
});
