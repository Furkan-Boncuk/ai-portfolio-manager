import { eq } from "drizzle-orm";
import { getDb } from "..";
import { portfolios } from "../schema";

export async function listPortfolios() {
  const db = getDb();
  return db.select().from(portfolios);
}

export async function getPortfolioById(id: string) {
  const db = getDb();
  const results = await db.select().from(portfolios).where(eq(portfolios.id, id)).limit(1);
  return results[0];
}

export async function createPortfolio(data: {
  userId: string;
  workspaceId: string;
  name: string;
  baseCurrency?: string;
  description?: string;
}) {
  const db = getDb();
  const [result] = await db.insert(portfolios).values(data).returning();
  return result;
}
