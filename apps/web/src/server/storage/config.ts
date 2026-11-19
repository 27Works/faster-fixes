import { requireEnv } from "@/utils/environment/require-env";

export function getStorageProvider() {
  if (process.env.STORAGE_PROVIDER) return process.env.STORAGE_PROVIDER;
  if (process.env.R2_ACCOUNT_ID) return "r2";
  return process.env.AWS_ACCESS_KEY_ID ? "s3" : "r2";
}

export function getStorageBucket() {
  if (process.env.STORAGE_BUCKET_NAME) return process.env.STORAGE_BUCKET_NAME;
  if (getStorageProvider() === "local") return "uploads";
  return requireEnv("STORAGE_BUCKET_NAME", process.env.AWS_BUCKET_NAME);
}

export function getStorageRegion() {
  const storageRegion = process.env.STORAGE_REGION;
  const awsRegion = process.env.AWS_REGION;
  if (storageRegion !== undefined && storageRegion !== "") return storageRegion;
  if (awsRegion !== undefined && awsRegion !== "") return awsRegion;
  return "us-east-1";
}
