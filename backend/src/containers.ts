import MainDB from "./dbclient/maindb";

import BooksTable from "./dbclient/maindb/tables/books";
import BookChaptersTable from "./dbclient/maindb/tables/bookChapter";
import BookPagesTable from "./dbclient/maindb/tables/bookPage";

import ChromaDB from "./dbclient/chromadb";

import BookContentVectorCollection from "./dbclient/chromadb/vectorCollections/bookContent";

import BookController from "./controllers/book";
import BookChapterController from "./controllers/bookChapter";
import BookPageController from "./controllers/bookPage";

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
