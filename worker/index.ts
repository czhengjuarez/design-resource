import { Hono } from "hono";

export interface Env {
  DB: D1Database;
  // Added in later phases:
  // AI: Ai;
  // VECTORIZE: VectorizeIndex;
  // IMAGES: R2Bucket;
}

const app = new Hono<{ Bindings: Env }>();

app.get("/api/health", (c) =>
  c.json({ status: "ok", time: new Date().toISOString() }),
);

export default app;
