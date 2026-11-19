import "server-only";

import { getStorageProvider } from "./config";
import { LocalStorage } from "./local";
import { S3Storage } from "./s3";
import type { StorageBackend } from "./types";

export function createStorage(): StorageBackend {
  const provider = getStorageProvider();
  switch (provider) {
    case "local":
      return new LocalStorage();
    case "s3":
    case "r2":
      return new S3Storage(provider);
    default:
      throw new Error(`Unsupported storage provider: ${provider}`);
  }
}
