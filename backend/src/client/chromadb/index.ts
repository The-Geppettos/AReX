import type { VectorCollection } from "./vectorCollections/abstract";
import type { EmbeddingFunction } from "chromadb";

import { OpenAIEmbeddingFunction } from "@chroma-core/openai";
import { ChromaClient } from "chromadb";

export class ChromaDB {
  private client: ChromaClient | undefined;
  private embeddingFunction: EmbeddingFunction | undefined;

  private vectorCollections: VectorCollection[] = [];

  addVectorCollection(vectorCollection: VectorCollection) {
    this.vectorCollections.push(vectorCollection);
  }

  async initialize() {
    const host = process.env.CHROMA_DB_HOST || "localhost";
    const port = process.env.CHROMA_DB_PORT
      ? parseInt(process.env.CHROMA_DB_PORT, 10)
      : 8000;

    console.log(`Initializing ChromaDB... at ${host}:${port}`);

    this.client = new ChromaClient({
      host: host,
      port: port,
    });
    this.embeddingFunction = new OpenAIEmbeddingFunction({
      modelName: process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small",
      apiKey: process.env.OPENAI_API_KEY,
    });

    for (const vectorCollection of this.vectorCollections) {
      const collection = await this.client.getOrCreateCollection({
        name: vectorCollection.collectionName,
        embeddingFunction: this.embeddingFunction,
      });
      vectorCollection.initialize(collection);
    }

    console.log("ChromaDB initialized successfully.");
  }
}
