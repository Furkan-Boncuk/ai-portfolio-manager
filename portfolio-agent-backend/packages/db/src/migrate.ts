import { migrate } from "drizzle-orm/node-postgres/migrator";
import { getDb } from "./index";

async function run() {
  const db = getDb();
  await migrate(db, { migrationsFolder: "./packages/db/migrations" });
  console.log("Migrations completed");
  process.exit(0);
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
