import { google } from "@ai-sdk/google";
import { embed, embedMany } from "ai";

export const generateEmbedding = async (text: string) => {
  const { embedding } = await embed({
    model: google.textEmbeddingModel("gemini-embedding-001"),
    value: text,
  });

  return embedding;
};

export const generateEmbeddings = async (texts: string[]) => {
  const inputs = texts.map(text => text.replace("/n", " "));

  const { embeddings } = await embedMany({
    model: google.textEmbeddingModel("gemini-embedding-001"),
    values: inputs,
  });

  return embeddings;
};
