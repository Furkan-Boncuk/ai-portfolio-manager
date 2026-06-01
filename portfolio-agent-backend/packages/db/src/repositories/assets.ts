import { eq } from "drizzle-orm";
import { getDb } from "..";
import { assets } from "../schema";

export async function listAssets() {
  const db = getDb();
  return db.select().from(assets);
}

export async function getAssetById(id: string) {
  const db = getDb();
  const results = await db.select().from(assets).where(eq(assets.id, id)).limit(1);
  return results[0];
}

export async function createAsset(data: {
  symbol: string;
  name: string;
  assetType: "CRYPTO" | "STOCK" | "ETF" | "FOREX" | "COMMODITY";
  exchange?: string;
  quoteCurrency?: string;
  provider?: string;
  providerSymbol?: string;
}) {
  const db = getDb();
  const [result] = await db.insert(assets).values(data).returning();
  return result;
}
