import { ForbiddenError, NotFoundError } from "@/server/errors/domain-errors";
import { describe, expect, it, vi } from "vitest";
import { countNewFeedback } from "./count-new-feedback";

type FakeDb = NonNullable<Parameters<typeof countNewFeedback>[1]>;

function fakeDb(
  project: { organizationId: string } | null,
  membership: { id: string } | null,
) {
  return {
    project: { findUnique: vi.fn().mockResolvedValue(project) },
    member: { findFirst: vi.fn().mockResolvedValue(membership) },
    feedback: { count: vi.fn().mockResolvedValue(4) },
  } as unknown as FakeDb;
}

const input = { projectId: "project_1", userId: "user_1" };

describe("countNewFeedback", () => {
  it("reports an unknown project as not found", async () => {
    await expect(
      countNewFeedback(input, fakeDb(null, { id: "member_1" })),
    ).rejects.toThrow(new NotFoundError("Project not found."));
  });

  it("refuses a caller who is not a member of the project's organization", async () => {
    await expect(
      countNewFeedback(input, fakeDb({ organizationId: "org_1" }, null)),
    ).rejects.toThrow(new ForbiddenError("Access denied."));
  });

  it("counts only the new feedback of the project for a member caller", async () => {
    const db = fakeDb({ organizationId: "org_1" }, { id: "member_1" });

    await expect(countNewFeedback(input, db)).resolves.toBe(4);
    expect(db.feedback.count).toHaveBeenCalledWith({
      where: { projectId: "project_1", status: "new" },
    });
  });
});
