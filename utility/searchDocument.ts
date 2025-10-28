import { documents } from "@/lib/db-schema";
import { db } from "@/lib/drizzle";
import { desc, gt, sql } from "drizzle-orm";
import { generateEmbedding } from "./embeddings";

export async function searchDocuments(
  query: string,
  limit: number = 5,
  threshold: number = 0.5
) {
  const embedding = await generateEmbedding(query);

  const similarity = sql<number>`1 - (${documents.embedding} <=> ${sql.raw(
    `'${JSON.stringify(embedding)}'::vector`
  )})`;

  const similarDocuments = await db
    .select({
      id: documents.id,
      content: documents.content,
      similarity,
    })
    .from(documents)
    .where(gt(similarity, threshold))
    .orderBy(desc(similarity))
    .limit(limit);

  return similarDocuments;
}
