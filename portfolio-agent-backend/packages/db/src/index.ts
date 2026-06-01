import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { getEnv } from "@portfolio-agent/shared";

let pool: Pool | null = null;
let dbInstance: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (dbInstance) return dbInstance;

  const env = getEnv();
  pool = new Pool({ connectionString: env.DATABASE_URL });
  dbInstance = drizzle(pool);

  return dbInstance;
}

export async function checkHealth(): Promise<boolean> {
  try {
    const db = getDb();
    await db.execute("SELECT 1");
    return true;
  } catch {
    return false;
  }
}
