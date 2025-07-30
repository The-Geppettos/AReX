import dotenv from "dotenv";

import { MainServer } from "@src/mainServer";

import { MainDB } from "@src/client/maindb";

import { BooksTable } from "@src/client/maindb/tables/books";
import { BookChaptersTable } from "@src/client/maindb/tables/bookChapter";
import { BookPagesTable } from "@src/client/maindb/tables/bookPage";

import { ChromaDB } from "@src/client/chromadb";

import { BookContentVectorCollection } from "@src/client/chromadb/vectorCollections/bookContent";

import { BookController } from "@src/controllers/book";
import { BookChapterController } from "@src/controllers/bookChapter";
import { BookPageController } from "@src/controllers/bookPage";
import { RabbitMQ } from "@src/client/rabbitmq";
import { ContentAnalysisQueue } from "./client/rabbitmq/queues/contentAnalysis";

dotenv.config({
  path: "../.env",
});

// -- ENV Variables --

const main_server_port = process.env.BACKEND_PORT || "3001";

const chromadb_host = process.env.CHROMA_DB_HOST || "localhost";
const chromadb_port = process.env.CHROMA_DB_PORT
  ? parseInt(process.env.CHROMA_DB_PORT, 10)
  : 8000;
const openaiEmbeddingModel =
  process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small";
const openaiApiKey = process.env.OPENAI_API_KEY || "";

const rbmq_host = process.env.RABBITMQ_HOST || "localhost";
const rbmq_port = process.env.RABBITMQ_PORT || "5672";

// -- Initialize Instances --

const mainServer = new MainServer(main_server_port);

const mainDb = new MainDB();

const booksTable = new BooksTable(mainDb);
const bookChaptersTable = new BookChaptersTable(mainDb, booksTable);
const bookPagesTable = new BookPagesTable(
  mainDb,
  booksTable,
  bookChaptersTable,
);

export const chromaDb = new ChromaDB(
  chromadb_host,
  chromadb_port,
  openaiEmbeddingModel,
  openaiApiKey,
);

const bookContentVectorCollection = new BookContentVectorCollection(chromaDb);

const rabbitMQ = new RabbitMQ(rbmq_host, rbmq_port);

const contentAnalysisQueue = new ContentAnalysisQueue(rabbitMQ);

const bookController = new BookController(booksTable, bookPagesTable);
const bookChapterController = new BookChapterController(bookChaptersTable);
const bookPageController = new BookPageController(
  bookPagesTable,
  bookChaptersTable,
  contentAnalysisQueue,
);

export default {
  mainServer,
  mainDb,
  chromaDb,
  rabbitMQ,
  bookController,
  bookChapterController,
  bookPageController,
};
