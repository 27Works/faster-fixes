import { ForbiddenError } from "@/server/errors/domain-errors";
import { deleteStorageObject } from "@/server/storage/objects";
import { prisma } from "@workspace/db";
import type { UpdateOrganizationLogoInput } from "./update-organization-logo.schema";

export async function updateOrganizationLogo(
  { organizationId, userId }: UpdateOrganizationLogoInput & { userId: string },
  db: typeof prisma = prisma,
) {
  // The denial needs the loaded membership and its role, so it belongs here.
  const membership = await db.member.findFirst({
    where: {
      organizationId,
      userId,
      role: { in: ["owner", "admin"] },
    },
  });

  if (!membership) {
    throw new ForbiddenError(
      "You do not have permission to edit this organization.",
    );
  }

  // Delete previous logo object from R2 if one exists
  const organization = await db.organization.findUniqueOrThrow({
    where: { id: organizationId },
    select: { logo: true },
  });

  if (organization.logo) {
    try {
      await deleteStorageObject({ key: organization.logo });
    } catch (error) {
      console.error(
        `Failed to delete old logo from R2 (key=${organization.logo}):`,
        error,
      );
    }
  }
}
