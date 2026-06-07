import { getDb } from "@portfolio-agent/db";
import { signals } from "@portfolio-agent/db/schema";
import { eq, desc } from "drizzle-orm";
import type { Signal } from "./SignalService.types";

export { type Signal };

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
