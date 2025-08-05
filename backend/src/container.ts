import dotenv from "dotenv";

import { MainServer } from "@src/component/mainserver";

import { MainDB } from "@src/component/maindb";

import { BooksTable } from "@src/component/maindb/tables/books";
import { BookChaptersTable } from "@src/component/maindb/tables/bookChapter";
import { BookPagesTable } from "@src/component/maindb/tables/bookPage";

import { ChromaDB } from "@src/component/chromadb";

import { BookContentVectorCollection } from "@src/component/chromadb/vectorCollections/bookContent";

import { BookService } from "@src/services/book";
import { BookPageService } from "@src/services/bookPage";
import { BookUploadService } from "./services/bookUploadService";

import { RabbitMQ } from "@src/component/rabbitmq";
import {
  NLPPreProcessConsumer,
  NLPPreProcessProducer,
} from "@src/component/rabbitmq/queues/nlpPreProcess";

dotenv.config({
  path: "../.env",
});

// -- ENV Variables --

const main_server_port = process.env.BACKEND_PORT || "3001";

const postgres_host = process.env.POSTGRES_HOST || "localhost";
const postgres_port = process.env.POSTGRES_PORT
  ? parseInt(process.env.POSTGRES_PORT, 10)
  : 5432;
const postgres_main_db = process.env.POSTGRES_MAIN_DB || "main";
const postgres_user = process.env.POSTGRES_USER || "postgres";
const postgres_password = process.env.POSTGRES_PASSWORD || "";

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

const mainDb = new MainDB(
  postgres_host,
  postgres_port,
  postgres_user,
  postgres_password,
  postgres_main_db,
);

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

const nlpPreProcessProducer = new NLPPreProcessProducer(rabbitMQ);
const nlpPreProcessConsumer = new NLPPreProcessConsumer(rabbitMQ);

const bookService = new BookService(booksTable);
const bookPageService = new BookPageService(bookPagesTable, bookChaptersTable);
const bookUploadService = new BookUploadService(
  bookPagesTable,
  booksTable,
  bookChaptersTable,
  nlpPreProcessProducer,
);

export default {
  mainServer,
  mainDb,
  chromaDb,
  rabbitMQ,
  nlpPreProcessConsumer,
  bookService,
  bookPageService,
  bookUploadService,
};
