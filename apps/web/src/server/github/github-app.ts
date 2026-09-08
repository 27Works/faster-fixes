import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "@octokit/core";

function normalizePrivateKey(raw: string): string {
  return raw
    .trim()                       // stray surrounding whitespace
    .replace(/^["']|["']$/g, "")  // wrapping quotes, if the panel added them
    .replace(/\\+n/g, "\n");      // ANY run of backslashes before n → real newline
}

const appId = process.env.GITHUB_APP_ID!;
// const privateKey = process.env.GITHUB_PRIVATE_KEY!.replace(/\\n/g, "\n");
const privateKey = normalizePrivateKey(process.env.GITHUB_PRIVATE_KEY!);

export function getAppOctokit() {
  return new Octokit({
    authStrategy: createAppAuth,
    auth: { appId, privateKey },
  });
}

export function getInstallationOctokit(installationId: number) {
  return new Octokit({
    authStrategy: createAppAuth,
    auth: { appId, privateKey, installationId },
  });
}
