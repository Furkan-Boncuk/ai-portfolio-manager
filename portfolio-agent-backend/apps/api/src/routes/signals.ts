import { Elysia } from "elysia";
import { getDb } from "@portfolio-agent/db";
import { signals } from "@portfolio-agent/db/schema";
import { eq, desc } from "drizzle-orm";

export const signalRoutes = new Elysia({ prefix: "/signals" })
  .get("/", async () => {
    const db = getDb();
    const result = await db
      .select()
      .from(signals)
      .orderBy(desc(signals.createdAt))
      .limit(50);
    return { data: result };
  })
  .get("/:id", async ({ params }) => {
    const db = getDb();
    const result = await db
      .select()
      .from(signals)
      .where(eq(signals.id, params.id))
      .limit(1);
    if (result.length === 0) return { error: "Not found" };
    return { data: result[0] };
  });
