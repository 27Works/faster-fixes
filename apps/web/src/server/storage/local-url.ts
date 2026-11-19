import "server-only";

import { requireEnv } from "@/utils/environment/require-env";
import { getAuthBaseUrl } from "@/utils/url/get-auth-base-url";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { StorageObject } from "./types";

type LocalAccess = StorageObject &
  ({ method: "GET" } | { method: "PUT"; contentType: string; size: number });

function sign(payload: string) {
  return createHmac(
    "sha256",
    requireEnv("BETTER_AUTH_SECRET", process.env.BETTER_AUTH_SECRET),
  )
    .update(payload)
    .digest();
}

export function createLocalStorageUrl(access: LocalAccess, expiresIn: number) {
  const payload = Buffer.from(
    JSON.stringify({
      ...access,
      expires: Math.floor(Date.now() / 1000) + expiresIn,
    }),
  ).toString("base64url");
  const path = [access.bucket, ...access.key.split("/")]
    .map(encodeURIComponent)
    .join("/");
  const url = new URL(`/api/storage/${path}`, getAuthBaseUrl());
  url.searchParams.set(
    "token",
    `${payload}.${sign(payload).toString("base64url")}`,
  );
  return url.href;
}

export function verifyLocalStorageAccess(
  token: string | null,
  expected: StorageObject & { method: string },
) {
  const [payload, signature] = token?.split(".") ?? [];
  if (!payload || !signature) return null;
  const actual = Buffer.from(signature, "base64url");
  const required = sign(payload);
  if (actual.length !== required.length || !timingSafeEqual(actual, required)) {
    return null;
  }
  // The payload was created by this server and authenticated above.
  const access = JSON.parse(
    Buffer.from(payload, "base64url").toString(),
  ) as LocalAccess & { expires: number };
  if (
    access.method !== expected.method ||
    access.bucket !== expected.bucket ||
    access.key !== expected.key ||
    access.expires <= Math.floor(Date.now() / 1000)
  ) {
    return null;
  }
  return access;
}
