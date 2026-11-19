import { ForbiddenError, NotFoundError } from "@/server/errors/domain-errors";
import { prisma } from "@workspace/db";
import type { CountNewFeedbackInput } from "./count-new-feedback.schema";

export async function countNewFeedback(
  { projectId, userId }: CountNewFeedbackInput & { userId: string },
  db: typeof prisma = prisma,
) {
  const project = await db.project.findUnique({ where: { id: projectId } });

  if (!project) {
    throw new NotFoundError("Project not found.");
  }

  // Membership in the Project's Organization needs the loaded Project, so the
  // denial lives here rather than at the transport edge.
  const membership = await db.member.findFirst({
    where: { organizationId: project.organizationId, userId },
  });

  if (!membership) {
    throw new ForbiddenError("Access denied.");
  }

  return db.feedback.count({ where: { projectId, status: "new" } });
}

export type CountNewFeedbackOutput = Awaited<
  ReturnType<typeof countNewFeedback>
>;
