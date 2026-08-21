import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { existsSync } from "fs";

const dbPath = process.env.DATABASE_URL;
if (!dbPath) {
  throw new Error("DATABASE_URL environment variable is required");
}

const migrationsFolder = "./db/migrations";
const sqlite = new Database(dbPath);
const db = drizzle(sqlite);

if (existsSync(`${migrationsFolder}/meta/_journal.json`)) {
  migrate(db, { migrationsFolder });
}

sqlite.close();
