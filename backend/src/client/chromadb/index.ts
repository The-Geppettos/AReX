import type { VectorCollection } from "./vectorCollections/abstract";
import type { EmbeddingFunction } from "chromadb";

import { OpenAIEmbeddingFunction } from "@chroma-core/openai";
import { ChromaClient } from "chromadb";

const RETRY_INTERVAL = 5000;

export class ChromaDB {
  private client: ChromaClient | undefined;
  private embeddingFunction: EmbeddingFunction | undefined;
  private closeTriggered: boolean = false;

  private vectorCollections: VectorCollection[] = [];

  private host: string;
  private port: number;
  private openaiEmbeddingModel: string;
  private openaiApiKey: string;

  constructor(
    host: string,
    port: number,
    openaiEmbeddingModel: string,
    openaiApiKey: string,
  ) {
    this.host = host;
    this.port = port;
    this.openaiEmbeddingModel = openaiEmbeddingModel;
    this.openaiApiKey = openaiApiKey;
  }

  addVectorCollection(vectorCollection: VectorCollection) {
    this.vectorCollections.push(vectorCollection);
  }

  async initialize() {
    console.log(`Initializing ChromaDB... at ${this.host}:${this.port}`);

    this.client = new ChromaClient({
      host: this.host,
      port: this.port,
    });
    this.embeddingFunction = new OpenAIEmbeddingFunction({
      modelName: this.openaiEmbeddingModel,
      apiKey: this.openaiApiKey,
    });

    for (const vectorCollection of this.vectorCollections) {
      let success = false;

      while (!success) {
        if (this.closeTriggered) {
          return;
        }
        try {
          const collection = await this.client.getOrCreateCollection({
            name: vectorCollection.collectionName,
            embeddingFunction: this.embeddingFunction,
          });
          vectorCollection.initialize(collection);

          success = true;
        } catch (error) {
          console.error("Failed to initialize ChromaDB collections:", error);
          console.log(`Retrying in ${RETRY_INTERVAL} ms...`);

          await new Promise((resolve) => setTimeout(resolve, RETRY_INTERVAL));
        }
      }
    }

    console.log("ChromaDB initialized successfully.");
  }

  async close() {
    this.closeTriggered = true;
  }
}
