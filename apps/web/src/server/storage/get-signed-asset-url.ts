import { getStorageObjectUrl } from "./objects";

type AssetForSignedUrl = {
  key: string;
};

export async function getSignedAssetUrl(
  asset: AssetForSignedUrl,
  expiresIn = 3600,
): Promise<string> {
  return getStorageObjectUrl(asset, expiresIn);
}
