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

export const mainDb = new MainDB();

const booksTable = new BooksTable(mainDb);
const bookChaptersTable = new BookChaptersTable(mainDb, booksTable);
const bookPagesTable = new BookPagesTable(
  mainDb,
  booksTable,
  bookChaptersTable,
);

export const chromaDb = new ChromaDB();

const bookContentVectorCollection = new BookContentVectorCollection(chromaDb);

const rabbitMQ = new RabbitMQ();

const contentAnalysisQueue = new ContentAnalysisQueue(rabbitMQ);

export const bookController = new BookController(booksTable, bookPagesTable);
export const bookChapterController = new BookChapterController(
  bookChaptersTable,
);
export const bookPageController = new BookPageController(
  bookPagesTable,
  bookChaptersTable,
  contentAnalysisQueue,
);

export default {
  mainDb,
  chromaDb,
  rabbitMQ,
  bookController,
  bookChapterController,
  bookPageController,
};
