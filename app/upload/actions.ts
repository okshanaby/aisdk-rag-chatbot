"use server";

import { documents } from "@/lib/db-schema";
import { db } from "@/lib/drizzle";
import { chuckContent } from "@/utility/chunking";
import { generateEmbeddings } from "@/utility/embeddings";
import { PDFParse } from "pdf-parse";

export async function processPdfFile(formData: FormData) {
  try {
    const file = formData.get("pdf") as File;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    // const data = await pdf(buffer);
    const data = new PDFParse({ data: buffer });
    const { text } = await data.getText();

    if (!text || text.length === 0) {
      return {
        success: false,
        error: "No text found in PDF",
      };
    }

    // split the pdf into small chunks
    const chunks = await chuckContent(text);

    // generate embedding for each chunk
    const embeddings = await generateEmbeddings(chunks);

    const records = chunks.map((chuck, index) => ({
      content: chuck,
      embedding: embeddings[index],
    }));

    // save to db
    await db.insert(documents).values(records);

    return {
      success: true,
      message: `Created ${records.length} searchable chunks`,
    };
  } catch (error) {
    console.log("🚀 ~ processPdfFile ~ error:", error);

    return {
      success: false,
      error: "Failed to process PDF file",
    };
  }
}
