import { MainDB } from "src/dbclient/maindb";

import { BooksTable } from "src/dbclient/maindb/tables/books";
import { BookChaptersTable } from "src/dbclient/maindb/tables/bookChapter";
import { BookPagesTable } from "src/dbclient/maindb/tables/bookPage";

import { ChromaDB } from "src/dbclient/chromadb";

import { BookContentVectorCollection } from "src/dbclient/chromadb/vectorCollections/bookContent";

import { BookController } from "src/controllers/book";
import { BookChapterController } from "src/controllers/bookChapter";
import { BookPageController } from "src/controllers/bookPage";

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

export const bookController = new BookController(booksTable, bookPagesTable);
export const bookChapterController = new BookChapterController(
  bookChaptersTable,
);
export const bookPageController = new BookPageController(
  bookPagesTable,
  bookChaptersTable,
  bookContentVectorCollection,
);

export default {
  mainDb,
  chromaDb,
  bookController,
  bookChapterController,
  bookPageController,
};
