import { getDb } from "@portfolio-agent/db";
import { signals } from "@portfolio-agent/db/schema";
import { eq, desc } from "drizzle-orm";

export type Signal = typeof signals.$inferSelect;

export class SignalService {
  async list(): Promise<{ data: Signal[] }> {
    const db = getDb();
    const result = await db
      .select()
      .from(signals)
      .orderBy(desc(signals.createdAt))
      .limit(50);
    return { data: result };
  }

  async getById(id: string): Promise<{ data: Signal } | { error: string }> {
    const db = getDb();
    const [result] = await db
      .select()
      .from(signals)
      .where(eq(signals.id, id))
      .limit(1);
    if (!result) return { error: "Not found" };
    return { data: result };
  }
}
