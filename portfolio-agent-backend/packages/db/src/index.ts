import { drizzle } from "drizzle-orm/node-postgres";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { getEnv } from "@portfolio-agent/shared";

export type Db = NodePgDatabase;

let pool: Pool | null = null;
let dbInstance: Db | null = null;

export function getDb(): Db {
  if (dbInstance) return dbInstance;

  const env = getEnv();
  pool = new Pool({ connectionString: env.DATABASE_URL });
  dbInstance = drizzle(pool) as Db;

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
