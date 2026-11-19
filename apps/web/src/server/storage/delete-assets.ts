import { deleteStorageObjects } from "./objects";
import { prisma } from "@workspace/db";

// S3 accepts at most 1000 keys in one DeleteObjects request.
const DELETE_BATCH_SIZE = 1000;

/**
 * Deletes many Assets: removes their objects from storage (best-effort) then deletes
 * the DB records. The batched form of `deleteAsset`, for a cascade that frees a
 * whole Project's screenshots in a handful of requests instead of one per Asset.
 */
export async function deleteAssets(assetIds: string[]) {
  for (let start = 0; start < assetIds.length; start += DELETE_BATCH_SIZE) {
    const batchIds = assetIds.slice(start, start + DELETE_BATCH_SIZE);
    const assets = await prisma.asset.findMany({
      where: { id: { in: batchIds } },
      select: { id: true, key: true },
    });

    if (assets.length > 0) {
      await deleteBatchObjects(assets.map((asset) => asset.key));
    }

    await prisma.asset.deleteMany({
      where: { id: { in: assets.map((asset) => asset.id) } },
    });
  }
}

// Best-effort: a failed storage delete is logged and never blocks the DB cleanup.
async function deleteBatchObjects(keys: string[]) {
  try {
    const { errors } = await deleteStorageObjects(keys);
    for (const error of errors) {
      console.error(
        `Failed to delete storage object (key=${error.key}): ${error.code} ${error.message}`,
      );
    }
  } catch (error) {
    console.error(`Failed to delete ${keys.length} storage objects:`, error);
  }
}
