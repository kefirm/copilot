import { promises as fs } from "node:fs";
import path from "node:path";
import type { DatabaseSchema } from "@/lib/types";

const DB_PATH = path.join(process.cwd(), "data", "db.json");

const EMPTY_DB: DatabaseSchema = {
  groups: [],
  plants: [],
  products: [],
  treatments: [],
  observations: [],
};

export async function ensureDb(): Promise<void> {
  const folder = path.dirname(DB_PATH);
  await fs.mkdir(folder, { recursive: true });

  try {
    await fs.access(DB_PATH);
  } catch {
    await fs.writeFile(DB_PATH, JSON.stringify(EMPTY_DB, null, 2), "utf8");
  }
}

export async function readDb(): Promise<DatabaseSchema> {
  await ensureDb();
  const raw = await fs.readFile(DB_PATH, "utf8");

  try {
    const parsed = JSON.parse(raw) as Partial<DatabaseSchema>;
    return {
      groups: parsed.groups ?? [],
      plants: parsed.plants ?? [],
      products: parsed.products ?? [],
      treatments: parsed.treatments ?? [],
      observations: parsed.observations ?? [],
    };
  } catch {
    return EMPTY_DB;
  }
}

export async function writeDb(db: DatabaseSchema): Promise<void> {
  await ensureDb();
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), "utf8");
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function id(): string {
  return crypto.randomUUID();
}
