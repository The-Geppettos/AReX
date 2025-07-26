import { OpenAIEmbeddingFunction } from "@chroma-core/openai";
import { ChromaClient, Collection, EmbeddingFunction } from "chromadb";

export default class ChromaDB {
  private static client: ChromaClient;
  private static embeddingFunction: EmbeddingFunction;

  static bookCollection: Collection;

  static async initialize() {
    this.client = new ChromaClient({
      host: process.env.CHROMA_DB_HOST || "localhost",
      port: process.env.CHROMA_DB_PORT
        ? parseInt(process.env.CHROMA_DB_PORT, 10)
        : 8000,
    });
    this.embeddingFunction = new OpenAIEmbeddingFunction({
      modelName: process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small",
      apiKey: process.env.OPENAI_API_KEY,
    });

    console.log("Connecting to ChromaDB...");

    this.bookCollection = await this.client.getOrCreateCollection({
      name: "book",
      embeddingFunction: this.embeddingFunction,
    });

    console.log("ChromaDB connection established successfully.");
  }
}
