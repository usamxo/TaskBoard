import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, "data");
const dbFile = path.join(dataDir, "db.json");

function ensureDbFile() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(dbFile)) {
    fs.writeFileSync(dbFile, JSON.stringify({ tasks: [] }, null, 2) + "\n", "utf-8");
  }
}

export async function getDb() {
  ensureDbFile();
  const adapter = new JSONFile(dbFile);
  const db = new Low(adapter, { tasks: [] });
  await db.read();
  db.data ||= { tasks: [] };
  return db;
}
