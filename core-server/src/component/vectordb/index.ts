import type { Collection } from "./collections/abstract";
import type { EmbeddingFunction } from "chromadb";

import { OpenAIEmbeddingFunction } from "@chroma-core/openai";
import { ChromaClient } from "chromadb";

const RETRY_INTERVAL = 5000;
const OPENAI_EMBEDDING_MODEL = "text-embedding-3-small";

export class VectorDB {
  private client: ChromaClient | undefined;
  private embeddingFunction: EmbeddingFunction | undefined;
  private closeTriggered: boolean = false;

  private collections: Collection[] = [];

  private host: string;
  private port: number;
  private openaiApiKey: string;

  constructor(host: string, port: number, openaiApiKey: string) {
    this.host = host;
    this.port = port;
    this.openaiApiKey = openaiApiKey;
  }

  addCollection(collection: Collection) {
    this.collections.push(collection);
  }

  async initialize() {
    console.info(`Initializing VectorDB(ChromaDB)... at ${this.host}:${this.port}`);

    this.client = new ChromaClient({
      host: this.host,
      port: this.port,
    });
    this.embeddingFunction = new OpenAIEmbeddingFunction({
      modelName: OPENAI_EMBEDDING_MODEL,
      apiKey: this.openaiApiKey,
    });

    for (const collection of this.collections) {
      let success = false;

      while (!success) {
        if (this.closeTriggered) {
          return;
        }
        try {
          const chromaCollection = await this.client.getOrCreateCollection({
            name: collection.collectionName,
            embeddingFunction: this.embeddingFunction,
          });
          collection.initialize(chromaCollection);

          success = true;
        } catch (error) {
          console.error("Failed to initialize VectorDB(ChromaDB) collections:", error);
          console.error(`Retrying in ${RETRY_INTERVAL} ms...`);

          await new Promise((resolve) => setTimeout(resolve, RETRY_INTERVAL));
        }
      }
    }

    console.info("VectorDB initialized successfully.");
  }

  async close() {
    this.closeTriggered = true;
  }
}
