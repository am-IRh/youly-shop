import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { migrationClient } from "./client";

async function runMigrations() {
   console.log("⏳ Running migrations...");

   const db = drizzle(migrationClient);

   try {
      await migrate(db, { migrationsFolder: "./drizzle" });
      console.log("✅ Migrations completed!");
   } catch (error) {
      console.error("❌ Migration failed:", error);
      process.exit(1);
   } finally {
      await migrationClient.end();
   }
}

runMigrations();
