#!/usr/bin/env bun
import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";

const dbPath = process.env.DATABASE_URL ?? "akademija.db";
const sqlite = new Database(dbPath);
const db = drizzle(sqlite);

console.log("Running migrations...");
await migrate(db, { migrationsFolder: "./db/migrations" });
console.log("✅ Migrations complete!");

sqlite.close();
