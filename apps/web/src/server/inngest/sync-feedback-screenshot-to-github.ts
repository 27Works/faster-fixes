import { formatIssueBody } from "@/server/github/format-issue-body";
import { getInstallationOctokit } from "@/server/github/github-app";
import type { DiagnosticTrail } from "@fasterfixes/core";
import { getSignedAssetUrl } from "@/server/storage/get-signed-asset-url";
import { prisma } from "@workspace/db";
import { inngest } from "./index";

// The widget uploads screenshots asynchronously after feedback creation, so
// `create-github-issue` almost always runs before the screenshot exists and
// creates the issue without one. This backfills the screenshot into the
// already-created issue's body once it arrives.
export const syncFeedbackScreenshotToGitHub = inngest.createFunction(
  {
    id: "sync-feedback-screenshot-to-github",
    retries: 3,
    concurrency: { key: "event.data.feedbackId", limit: 1 },
    triggers: [{ event: "feedback/screenshot-attached" }],
  },
  async ({ event }) => {
    const { feedbackId } = event.data as { feedbackId: string };

    const feedback = await prisma.feedback.findUnique({
      where: { id: feedbackId },
      include: {
        reviewer: { select: { name: true } },
        screenshot: { select: { key: true, bucket: true } },
        issueLink: {
          include: {
            projectGitHubLink: { include: { gitHubInstallation: true } },
          },
        },
      },
    });

    if (!feedback) return { skipped: "feedback_not_found" };
    if (!feedback.screenshot) return { skipped: "no_screenshot" };

    // No issue yet (still being created, auto-create disabled, no GitHub
    // link): nothing to backfill. If an issue is created later, it will read
    // the screenshot that's already attached by then.
    const issueLink = feedback.issueLink;
    if (!issueLink) return { skipped: "no_issue_link" };

    const gitHubLink = issueLink.projectGitHubLink;
    const installation = gitHubLink.gitHubInstallation;
    const octokit = getInstallationOctokit(installation.installationId);

    const screenshotUrl = await getSignedAssetUrl(feedback.screenshot, 3600);

    const baseUrl = process.env.BETTER_AUTH_URL ?? process.env.BASE_URL!;
    const dashboardUrl = `${baseUrl}/inbox?feedbackId=${feedback.id}`;

    const body = formatIssueBody({
      id: feedback.id,
      comment: feedback.comment,
      pageUrl: feedback.pageUrl,
      selector: feedback.selector,
      clickX: feedback.clickX,
      clickY: feedback.clickY,
      browserName: feedback.browserName,
      browserVersion: feedback.browserVersion,
      os: feedback.os,
      viewportWidth: feedback.viewportWidth,
      viewportHeight: feedback.viewportHeight,
      screenshotUrl,
      reviewerName: feedback.reviewer.name,
      metadata: feedback.metadata as Record<string, unknown> | null,
      diagnosticTrail: feedback.diagnosticTrail as DiagnosticTrail | null,
      projectId: feedback.projectId,
      dashboardUrl,
    });

    await octokit.request(
      "PATCH /repos/{owner}/{repo}/issues/{issue_number}",
      {
        owner: gitHubLink.repoOwner,
        repo: gitHubLink.repoName,
        issue_number: issueLink.issueNumber,
        body,
      },
    );

    await prisma.feedbackIssueLink.update({
      where: { id: issueLink.id },
      data: { lastSyncSource: "app", lastSyncAt: new Date() },
    });

    return { issueNumber: issueLink.issueNumber, backfilled: true };
  },
);
