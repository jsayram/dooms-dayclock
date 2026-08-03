import { getD1 } from "../../../db";
import { DatabaseConfigurationError } from "../../../db";
import { ApiError, ServerConfigurationError } from "./errors";
import { planInputSchema } from "./plan-input";
import type { PlanInput } from "./plan-input";

const MAX_PLANS_PER_USER = 100;

export type SavedPlan = PlanInput & {
  id: string;
  version: 1;
  createdAt: string;
  updatedAt: string;
};

type PlanRow = {
  id: string;
  title: string;
  finish_at_ms: number;
  tasks_json: string;
  version: number;
  created_at: string;
  updated_at: string;
};

const initializedBindings = new WeakMap<object, Promise<void>>();

async function ensureSchema(db: D1Database): Promise<void> {
  const key = db as unknown as object;
  let pending = initializedBindings.get(key);
  if (!pending) {
    const initialization = db.batch([
      db.prepare(`CREATE TABLE IF NOT EXISTS saved_plans (
        id TEXT PRIMARY KEY NOT NULL,
        owner_id TEXT NOT NULL,
        title TEXT NOT NULL,
        finish_at_ms INTEGER NOT NULL,
        tasks_json TEXT NOT NULL,
        version INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`),
      db.prepare(
        "CREATE UNIQUE INDEX IF NOT EXISTS saved_plans_owner_id_id_idx ON saved_plans (owner_id, id)",
      ),
    ]).then(() => undefined);
    initializedBindings.set(key, initialization);
    initialization.catch(() => initializedBindings.delete(key));
    pending = initialization;
  }
  await pending;
}

function rowToPlan(row: PlanRow): SavedPlan {
  const parsed = planInputSchema.shape.tasks.safeParse(JSON.parse(row.tasks_json) as unknown);
  if (!parsed.success || row.version !== 1) throw new ServerConfigurationError();
  return {
    id: row.id,
    title: row.title,
    finishAtMs: row.finish_at_ms,
    tasks: parsed.data,
    version: 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function database(): Promise<D1Database> {
  try {
    const db = getD1();
    await ensureSchema(db);
    return db;
  } catch (error) {
    if (error instanceof DatabaseConfigurationError) throw new ServerConfigurationError();
    throw error;
  }
}

export async function listPlans(ownerId: string): Promise<SavedPlan[]> {
  const db = await database();
  const result = await db.prepare(
    `SELECT id, title, finish_at_ms, tasks_json, version, created_at, updated_at
     FROM saved_plans WHERE owner_id = ? ORDER BY updated_at DESC LIMIT ?`,
  ).bind(ownerId, MAX_PLANS_PER_USER).all<PlanRow>();
  return result.results.map(rowToPlan);
}

export async function findPlan(ownerId: string, id: string): Promise<SavedPlan | null> {
  const db = await database();
  const row = await db.prepare(
    `SELECT id, title, finish_at_ms, tasks_json, version, created_at, updated_at
     FROM saved_plans WHERE owner_id = ? AND id = ? LIMIT 1`,
  ).bind(ownerId, id).first<PlanRow>();
  return row ? rowToPlan(row) : null;
}

export async function createPlan(ownerId: string, input: PlanInput): Promise<SavedPlan> {
  const db = await database();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const result = await db.prepare(
    `INSERT INTO saved_plans
     (id, owner_id, title, finish_at_ms, tasks_json, version, created_at, updated_at)
     SELECT ?, ?, ?, ?, ?, 1, ?, ?
     WHERE (SELECT COUNT(*) FROM saved_plans WHERE owner_id = ?) < ?`,
  ).bind(
    id,
    ownerId,
    input.title,
    input.finishAtMs,
    JSON.stringify(input.tasks),
    now,
    now,
    ownerId,
    MAX_PLANS_PER_USER,
  ).run();
  if ((result.meta?.changes ?? 0) === 0) {
    throw new ApiError(409, "plan_limit_reached", "Remove a cloud plan before saving another one.");
  }
  const plan = await findPlan(ownerId, id);
  if (!plan) throw new ServerConfigurationError();
  return plan;
}

export async function updatePlan(ownerId: string, id: string, input: PlanInput): Promise<SavedPlan | null> {
  const db = await database();
  const now = new Date().toISOString();
  const result = await db.prepare(
    `UPDATE saved_plans SET title = ?, finish_at_ms = ?, tasks_json = ?, updated_at = ?
     WHERE owner_id = ? AND id = ?`,
  ).bind(input.title, input.finishAtMs, JSON.stringify(input.tasks), now, ownerId, id).run();
  if ((result.meta?.changes ?? 0) === 0) return null;
  return findPlan(ownerId, id);
}

export async function deletePlan(ownerId: string, id: string): Promise<boolean> {
  const db = await database();
  const result = await db.prepare(
    "DELETE FROM saved_plans WHERE owner_id = ? AND id = ?",
  ).bind(ownerId, id).run();
  return (result.meta?.changes ?? 0) > 0;
}
