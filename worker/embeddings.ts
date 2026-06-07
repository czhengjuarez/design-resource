import type { Env } from "./index";
import type { Resource } from "../db/schema";

/** Workers AI embedding model — 768 dimensions, matches the Vectorize index. */
const EMBEDDING_MODEL = "@cf/baai/bge-base-en-v1.5";

/** Build the text representation embedded for a resource. */
export function resourceEmbeddingText(r: Pick<Resource, "title" | "description" | "tags" | "author" | "type">): string {
  const parts = [r.title, r.description, r.author, r.type, ...(r.tags ?? [])];
  return parts.filter(Boolean).join(" — ");
}

/** Embed a batch of text strings. Workers AI batches embedding requests natively. */
async function embedBatch(env: Env, texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const result = await env.AI.run(EMBEDDING_MODEL, { text: texts });
  return (result as { data: number[][] }).data;
}

export async function embedText(env: Env, text: string): Promise<number[]> {
  const [vector] = await embedBatch(env, [text]);
  return vector;
}

/** Upsert a single resource's embedding into Vectorize. Call after create/update. */
export async function upsertResourceEmbedding(env: Env, resource: Resource): Promise<void> {
  if (resource.status !== "published") {
    // Don't index pending/rejected items — they shouldn't surface in search.
    await deleteResourceEmbedding(env, resource.id).catch(() => {});
    return;
  }
  const vector = await embedText(env, resourceEmbeddingText(resource));
  await env.VECTORIZE.upsert([
    {
      id: String(resource.id),
      values: vector,
      metadata: { categoryId: resource.categoryId ?? 0, type: resource.type },
    },
  ]);
}

export async function deleteResourceEmbedding(env: Env, resourceId: number): Promise<void> {
  await env.VECTORIZE.deleteByIds([String(resourceId)]);
}

/** Batch-embed and upsert many resources — used by the backfill job. */
export async function upsertResourceEmbeddingsBatch(env: Env, resources: Resource[]): Promise<number> {
  const published = resources.filter((r) => r.status === "published");
  if (published.length === 0) return 0;

  const texts = published.map((r) => resourceEmbeddingText(r));
  const vectors = await embedBatch(env, texts);

  await env.VECTORIZE.upsert(
    published.map((r, i) => ({
      id: String(r.id),
      values: vectors[i],
      metadata: { categoryId: r.categoryId ?? 0, type: r.type },
    })),
  );
  return published.length;
}

export interface SemanticMatch {
  id: number;
  score: number;
}

/** Embed a query and return the nearest resource ids by cosine similarity. */
export async function semanticSearch(env: Env, query: string, topK = 24): Promise<SemanticMatch[]> {
  const vector = await embedText(env, query);
  const result = await env.VECTORIZE.query(vector, { topK });
  return result.matches.map((m) => ({ id: parseInt(m.id, 10), score: m.score }));
}

/** Find resources whose embeddings are nearest to a given resource's embedding. */
export async function relatedResources(env: Env, resourceId: number, topK = 6): Promise<SemanticMatch[]> {
  const [vec] = await env.VECTORIZE.getByIds([String(resourceId)]);
  if (!vec) return [];
  const result = await env.VECTORIZE.query(vec.values, { topK: topK + 1 });
  return result.matches
    .filter((m) => m.id !== String(resourceId))
    .slice(0, topK)
    .map((m) => ({ id: parseInt(m.id, 10), score: m.score }));
}
