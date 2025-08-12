import {
  LANGUAGES,
  NLPPreProcessRes,
  PAGE_TRANSITION_TYPES,
  type BookChapterUpload,
  type BookUpload,
  type BookPageUpload,
} from "@shared/types";

import container from "@src/container";

const main = async () => {
  // Basic health check endpoint
  container.mainServer.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  container.mainServer.get(
    "/api/books/published/:offset/:limit",
    async (req, res) => {
      const offset = parseInt(req.params.offset, 10);
      const limit = parseInt(req.params.limit, 10);

      try {
        const books = await container.bookService.getPublishedBooks(
          offset,
          limit,
        );
        res.json(books);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch books" });
      }
    },
  );

  container.mainServer.get(
    "/api/books/all/:offset/:limit",
    async (req, res) => {
      const offset = parseInt(req.params.offset, 10);
      const limit = parseInt(req.params.limit, 10);

      try {
        const books = await container.bookService.getAllBooks(offset, limit);
        res.json(books);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch all books" });
      }
    },
  );

  container.mainServer.get("/api/book/:id", async (req, res) => {
    try {
      const book = await container.bookService.getById(req.params.id);
      if (!book) {
        return res.status(404).json({ error: "Book not found" });
      }
      res.json(book);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch book" });
    }
  });

  container.mainServer.put("/api/book/:id/publish", async (req, res) => {
    const { id } = req.params;
    try {
      const book = await container.bookService.publishBook(id);
      res.json(book);
    } catch (error) {
      res.status(500).json({ error: "Failed to publish book" });
    }
  });

  container.mainServer.put("/api/book/:id/unpublish", async (req, res) => {
    const { id } = req.params;
    try {
      const book = await container.bookService.unPublishBook(id);
      res.json(book);
    } catch (error) {
      res.status(500).json({ error: "Failed to unpublish book" });
    }
  });

  container.mainServer.get("/api/book/:id/page/:page", async (req, res) => {
    const { id, page } = req.params;
    try {
      const bookPage = await container.bookPageService.getBookPage(
        id,
        parseInt(page),
      );
      if (!bookPage) {
        return res.status(404).json({ error: "Book page not found" });
      }
      res.json(bookPage);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch book page" });
    }
  });

  container.mainServer.post("/api/agent/assistant", async (req, res) => {
    try {
      const { book_id, offset, query } = req.body;
      if (!book_id || !offset || !query) {
        return res
          .status(400)
          .json({ error: "book_id, offset, and query are required" });
      }
      if (
        typeof book_id !== "string" ||
        typeof offset !== "number" ||
        typeof query !== "string"
      ) {
        return res.status(400).json({ error: "Query must be a string" });
      }

      const response = await container.assistantAgentService.conversate(
        query,
        book_id,
        offset,
      );

      res.status(200).json(response);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  container.mainServer.post("/api/book_upload/book", async (req, res) => {
    try {
      const { title, author, language } = req.body as BookUpload;

      if (!title || !author) {
        return res.status(400).json({ error: "Title and author are required" });
      }
      if (typeof title !== "string" || typeof author !== "string") {
        return res
          .status(400)
          .json({ error: "Title and author must be strings" });
      }
      if (!LANGUAGES.includes(language)) {
        return res
          .status(400)
          .json({ error: `Language must be one of ${LANGUAGES.join(", ")}` });
      }
      const book = await container.bookUploadService.uploadBook(
        title,
        author,
        language,
      );
      res.status(201).json(book);
    } catch (error) {
      res.status(500).json({ error: "Failed to create book" });
    }
  });

  container.mainServer.post("/api/book_upload/chapter", async (req, res) => {
    const { book_id, chapter_number, title } = req.body as BookChapterUpload;

    if (!book_id || !chapter_number || !title) {
      return res
        .status(400)
        .json({ error: "Chapter number and title are required" });
    }

    if (
      typeof book_id !== "string" ||
      typeof chapter_number !== "number" ||
      typeof title !== "string"
    ) {
      return res.status(400).json({ error: "Invalid chapter data" });
    }

    try {
      const chapter = await container.bookUploadService.uploadChapter(
        book_id,
        chapter_number,
        title,
      );
      res.status(201).json(chapter);
    } catch (error) {
      res.status(500).json({ error: "Failed to create chapter" });
    }
  });

  container.mainServer.post("/api/book_upload/page", async (req, res) => {
    const { book_id, chapter_id, content, page_number, page_transition_type } =
      req.body as BookPageUpload;

    if (
      !book_id ||
      !chapter_id ||
      !content ||
      !page_number ||
      !page_transition_type
    ) {
      return res.status(400).json({
        error:
          "chapter_id, content, page_number and paragraph_continues are required",
      });
    }

    if (
      typeof book_id !== "string" ||
      typeof chapter_id !== "string" ||
      typeof content !== "string" ||
      typeof page_number !== "number" ||
      !PAGE_TRANSITION_TYPES.includes(page_transition_type)
    ) {
      return res.status(400).json({ error: "Invalid page data" });
    }

    try {
      const bookPage = await container.bookUploadService.uploadPage(
        book_id,
        chapter_id,
        page_number,
        content,
        page_transition_type,
      );
      res.status(201).json(bookPage);
    } catch (error) {
      res.status(500).json({ error: "Failed to create book page" });
    }
  });

  container.mainServer.post("/api/book_upload/finish/:id", async (req, res) => {
    try {
      const { id } = req.params;

      const book = await container.bookUploadService.finishUpload(id);
      if (!book) {
        return res.status(404).json({ error: "Book not found" });
      }
      res.status(200).json(book);
    } catch (error) {
      res.status(500).json({ error: "Failed to update book" });
    }
  });

  container.nlpPreProcessConsumer.consume(async (message, acknowledge) => {
    try {
      const nlpPreProcessRes = JSON.parse(
        message.content.toString(),
      ) as NLPPreProcessRes;

      if (!nlpPreProcessRes.success) {
        throw new Error("NLP pre-processing failed");
      }

      if (!nlpPreProcessRes.book_page_id) {
        throw new Error("Invalid message format: book_page_id is required");
      }

      if (!Array.isArray(nlpPreProcessRes.result.sentence_boundaries)) {
        throw new Error(
          "Invalid message format: sentence_boundaries must be an array",
        );
      }

      for (const boundary of nlpPreProcessRes.result.sentence_boundaries) {
        if (
          !Array.isArray(boundary) ||
          boundary.length !== 2 ||
          typeof boundary[0] !== "number" ||
          typeof boundary[1] !== "number"
        ) {
          throw new Error(
            "Invalid sentence boundary format: must be an array of two numbers",
          );
        }
      }

      await container.bookUploadService.updatePreProcessedData(
        nlpPreProcessRes.book_page_id,
        nlpPreProcessRes.result.sentence_boundaries,
      );
      acknowledge();
    } catch (error) {
      console.error("Error processing message:", error);
    }
  });

  container.postProcessConsumer.consume(async (message, acknowledge) => {
    try {
      const { book_id } = JSON.parse(message.content.toString());

      if (!book_id) {
        throw new Error("Invalid message format: book_id is required");
      }

      await container.bookUploadService.postProcess(book_id);
      acknowledge();
    } catch (error) {
      console.error("Error processing post-process message:", error);
    }
  });

  const gracefulShutdown = async (signal?: NodeJS.Signals) => {
    if (signal) {
      console.info(`Received ${signal}, shutting down server...`);
    } else {
      console.info("Shutting down server...");
    }

    await container.mainServer.close();
    await container.rabbitMQ.close();
    await container.mainDb.close();
    await container.chromaDb.close();

    console.info("All components closed successfully");
    process.exit(0);
  };

  process.on("SIGINT", gracefulShutdown);
  process.on("SIGTERM", gracefulShutdown);
  process.on("uncaughtException", (error) => {
    console.error("Uncaught Exception:", error);
    gracefulShutdown();
  });

  console.info("Initializing components...");

  await container.mainDb.initialize();
  await container.chromaDb.initialize();
  await container.rabbitMQ.initialize();
  await container.mainServer.initialize();

  console.info("All components initialized successfully");
};

main();
