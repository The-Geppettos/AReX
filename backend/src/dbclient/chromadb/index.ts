import { ChromaClient } from "chromadb";

const client = new ChromaClient({
  host: process.env.CHROMA_DB_HOST || "localhost",
  port: process.env.CHROMA_DB_PORT
    ? parseInt(process.env.CHROMA_DB_PORT, 10)
    : 8000,
});
