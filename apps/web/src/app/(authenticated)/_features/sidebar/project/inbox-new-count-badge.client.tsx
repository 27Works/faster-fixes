"use client";

import { useTRPC } from "@/lib/trpc/trpc-client";
import { SidebarMenuBadge } from "@workspace/ui/components/sidebar";
import { useQuery } from "@tanstack/react-query";

type InboxNewCountBadgeProps = {
  projectId: string;
};

export function InboxNewCountBadge({ projectId }: InboxNewCountBadgeProps) {
  const trpc = useTRPC();
  const newCountQuery = useQuery(
    trpc.authenticated.projects.feedback.countNew.queryOptions({ projectId }),
  );

  // A failed or pending count shows no badge: the Inbox itself surfaces errors.
  const count = newCountQuery.data ?? 0;
  if (count === 0) {
    return null;
  }

  return (
    <SidebarMenuBadge
      aria-label={`${count} new feedback`}
      className="bg-primary/10 text-primary peer-hover/menu-button:text-primary peer-data-[active=true]/menu-button:text-primary"
    >
      {count > 99 ? "99+" : count}
    </SidebarMenuBadge>
  );
}
