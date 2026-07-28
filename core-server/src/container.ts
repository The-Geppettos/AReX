import dotenv from "dotenv";

import { HTTPServer } from "@src/component/httpserver";

import { CoreDB } from "@src/component/coredb";

import { BooksTable } from "@src/component/coredb/tables/books";
import { BookChaptersTable } from "@src/component/coredb/tables/bookChapter";
import { BookPagesTable } from "@src/component/coredb/tables/bookPage";

import { VectorDB } from "@src/component/vectordb";

import { BookSearchCollection } from "@src/component/vectordb/collections/bookSearch";

import { BookService } from "@src/services/book";
import { BookPageService } from "@src/services/bookPage";
import { BookUploadService } from "@src/services/bookUpload";
import { AssistantAgentService } from "@src/services/agents/assistant";
import { CharacterAgentService } from "@src/services/agents/character";

import { BookController } from "@src//controllers/books";
import { BookPageController } from "@src/controllers/bookPages";
import { AgentController } from "@src/controllers/agents";
import { BookUploadController } from "@src/controllers/bookUpload";

import { MessageBroker } from "@src/component/messagebroker";
import {
  NLPPreProcessConsumer,
  NLPPreProcessProducer,
} from "@src/component/messagebroker/queues/nlpPreProcess";
import {
  PostProcessConsumer,
  PostProcessProducer,
} from "@src/component/messagebroker/queues/postProcess";
import { ChatHistoryTable } from "./component/coredb/tables/chatHistory";
import { BookManageController } from "./controllers/bookManage";

dotenv.config({
  path: "../.env",
});

// -- ENV Variables --

const noAdmin = process.env.NO_ADMIN === "true";
const core_server_port = noAdmin
  ? process.env.CORE_SERVER_NO_ADMIN_PORT || "3001"
  : process.env.CORE_SERVER_PORT || "13001";

const postgres_host = process.env.POSTGRES_HOST || "localhost";
const postgres_port = process.env.POSTGRES_PORT
  ? parseInt(process.env.POSTGRES_PORT, 10)
  : 5432;
const postgres_core_db = process.env.POSTGRES_CORE_DB || "core";
const postgres_user = process.env.POSTGRES_USER || "postgres";
const postgres_password = process.env.POSTGRES_PASSWORD || "";

const chromadb_host = process.env.CHROMA_DB_HOST || "localhost";
const chromadb_port = process.env.CHROMA_DB_PORT
  ? parseInt(process.env.CHROMA_DB_PORT, 10)
  : 8000;

const openaiApiKey = process.env.OPENAI_API_KEY || "";

const rbmq_host = process.env.RABBITMQ_HOST || "localhost";
const rbmq_port = process.env.RABBITMQ_PORT || "5672";

/*
 * --- Initialization ---
 * This section initializes the main components of the application.
 * Dependencies are injected into each component to ensure they can interact with each other.
 */

const httpServer = new HTTPServer(core_server_port);

const coreDb = new CoreDB(
  postgres_host,
  postgres_port,
  postgres_user,
  postgres_password,
  postgres_core_db,
);

const booksTable = new BooksTable(coreDb);
const bookChaptersTable = new BookChaptersTable(coreDb, booksTable);
const bookPagesTable = new BookPagesTable(
  coreDb,
  booksTable,
  bookChaptersTable,
);
const chatHistoryTable = new ChatHistoryTable(coreDb, booksTable);

export const vectorDb = new VectorDB(
  chromadb_host,
  chromadb_port,
  openaiApiKey,
);

const bookSearchCollection = new BookSearchCollection(vectorDb);

const bookService = new BookService(booksTable);
const bookPageService = new BookPageService(bookPagesTable, bookChaptersTable);

let messageBroker = null;

if (!noAdmin) {
  messageBroker = new MessageBroker(rbmq_host, rbmq_port);

  const nlpPreProcessProducer = new NLPPreProcessProducer(messageBroker);
  const postProcessProducer = new PostProcessProducer(messageBroker);

  const bookUploadService = new BookUploadService(
    bookPagesTable,
    booksTable,
    bookChaptersTable,
    nlpPreProcessProducer,
    postProcessProducer,
    bookSearchCollection,
  );
  const nlpPreProcessConsumer = new NLPPreProcessConsumer(
    messageBroker,
    bookUploadService,
  );
  const postProcessConsumer = new PostProcessConsumer(
    messageBroker,
    bookUploadService,
  );
  nlpPreProcessConsumer.registerConsumer();
  postProcessConsumer.registerConsumer();

  const bookUploadController = new BookUploadController(
    httpServer,
    bookUploadService,
  );

  bookUploadController.registerRoutes();

  const bookManageController = new BookManageController(
    httpServer,
    bookService,
  );
  bookManageController.registerRoutes();
}

const assistantAgentService = new AssistantAgentService(
  openaiApiKey,
  bookSearchCollection,
  booksTable,
  bookPagesTable,
  chatHistoryTable,
);
const characterAgentService = new CharacterAgentService(
  openaiApiKey,
  bookSearchCollection,
  booksTable,
  bookPagesTable,
  chatHistoryTable,
);

const bookController = new BookController(httpServer, bookService);
const bookPageController = new BookPageController(httpServer, bookPageService);
const agentController = new AgentController(
  httpServer,
  assistantAgentService,
  characterAgentService,
);

bookController.registerRoutes();
bookPageController.registerRoutes();
agentController.registerRoutes();

export default {
  httpServer,
  coreDb,
  vectorDb,
  messageBroker,
};
