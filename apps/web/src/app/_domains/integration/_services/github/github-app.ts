import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "@octokit/core";

import { isCloud } from "@/utils/environment/env";
import { requireEnv } from "@/utils/environment/require-env";

// Hosting panels (e.g. Coolify) can store a multi-line PEM with wrapping
// quotes or doubled backslashes before each "n", which the plain "\\n"
// replacement doesn't undo.
function normalizePrivateKey(raw: string): string {
  return raw
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/\\+n/g, "\n");
}

let privateKey: string | undefined;
function getPrivateKey() {
  return (privateKey ??= normalizePrivateKey(
    requireEnv("GITHUB_PRIVATE_KEY", process.env.GITHUB_PRIVATE_KEY),
  ));
}

if (isCloud()) getPrivateKey();

function getAppAuth() {
  return {
    appId: requireEnv("GITHUB_APP_ID", process.env.GITHUB_APP_ID),
    privateKey: getPrivateKey(),
  };
}

export function getAppOctokit() {
  return new Octokit({
    authStrategy: createAppAuth,
    auth: getAppAuth(),
  });
}

export function getInstallationOctokit(installationId: number) {
  return new Octokit({
    authStrategy: createAppAuth,
    auth: { ...getAppAuth(), installationId },
  });
}
