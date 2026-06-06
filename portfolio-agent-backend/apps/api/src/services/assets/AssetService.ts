import {
  listAssets,
  getAssetById,
  createAsset,
} from "@portfolio-agent/db/repositories/assets";

export type CreateAssetInput = Parameters<typeof createAsset>[0];

export class AssetService {
  async list() {
    const data = await listAssets();
    return { data };
  }

  async getById(id: string) {
    const result = await getAssetById(id);
    if (!result) return { error: "Not found" };
    return { data: result };
  }

  async create(input: CreateAssetInput) {
    const data = await createAsset(input);
    return { data };
  }
}
