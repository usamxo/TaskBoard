import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { nanoid } from "nanoid";
import { getDb } from "./db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const ORIGIN = process.env.ORIGIN || `http://localhost:${PORT}`;

app.use(helmet({
  contentSecurityPolicy: false // keep it simple for a small demo app
}));
app.use(morgan("dev"));
app.use(express.json({ limit: "100kb" }));
app.use(cors({ origin: ORIGIN }));

// Serve frontend
app.use(express.static(path.join(__dirname, "public")));

// Health check
app.get("/healthz", (req, res) => {
  res.json({ ok: true });
});

// ---- API ----

function normalizeStatus(status) {
  const allowed = new Set(["todo", "in_progress", "done"]);
  return allowed.has(status) ? status : "todo";
}

app.get("/api/tasks", async (req, res) => {
  const db = await getDb();
  const tasks = db.data.tasks ?? [];
  tasks.sort((a, b) => (b.updatedAt || b.createdAt).localeCompare(a.updatedAt || a.createdAt));
  res.json({ tasks });
});

app.post("/api/tasks", async (req, res) => {
  const { title, description } = req.body || {};
  if (!title || typeof title !== "string" || !title.trim()) {
    return res.status(400).json({ error: "title is required" });
  }

  const now = new Date().toISOString();
  const task = {
    id: nanoid(10),
    title: title.trim(),
    description: typeof description === "string" ? description.trim() : "",
    status: "todo",
    createdAt: now,
    updatedAt: now
  };

  const db = await getDb();
  db.data.tasks.push(task);
  await db.write();

  res.status(201).json({ task });
});

app.patch("/api/tasks/:id", async (req, res) => {
  const { id } = req.params;
  const { title, description, status } = req.body || {};

  const db = await getDb();
  const tasks = db.data.tasks ?? [];
  const idx = tasks.findIndex(t => t.id === id);
  if (idx === -1) return res.status(404).json({ error: "task not found" });

  if (title !== undefined) {
    if (typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ error: "title must be a non-empty string" });
    }
    tasks[idx].title = title.trim();
  }

  if (description !== undefined) {
    if (typeof description !== "string") {
      return res.status(400).json({ error: "description must be a string" });
    }
    tasks[idx].description = description.trim();
  }

  if (status !== undefined) {
    if (typeof status !== "string") {
      return res.status(400).json({ error: "status must be a string" });
    }
    tasks[idx].status = normalizeStatus(status);
  }

  tasks[idx].updatedAt = new Date().toISOString();
  await db.write();

  res.json({ task: tasks[idx] });
});

app.delete("/api/tasks/:id", async (req, res) => {
  const { id } = req.params;

  const db = await getDb();
  const tasks = db.data.tasks ?? [];
  const before = tasks.length;
  db.data.tasks = tasks.filter(t => t.id !== id);
  if (db.data.tasks.length === before) return res.status(404).json({ error: "task not found" });

  await db.write();
  res.status(204).send();
});

// Fallback to index.html for unknown routes (simple SPA behavior)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`TaskBoard running at http://localhost:${PORT}`);
  console.log(`CORS origin allowed: ${ORIGIN}`);
});
