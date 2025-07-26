import type {
  BookChapterCreate,
  BookCreate,
  BookPageCreate,
} from "@shared/types";

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import containers from "./containers";

dotenv.config({
  path: "../.env",
});

const port = process.env.BACKEND_PORT || 3001;
const app = express();

const main = async () => {
  // Initialize database
  await containers.mainDb.initialize();
  await containers.chromaDb.initialize();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Basic health check endpoint
  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // Book endpoints
  app.get("/api/books/published/:offset/:limit", async (req, res) => {
    const offset = parseInt(req.params.offset, 10);
    const limit = parseInt(req.params.limit, 10);

    try {
      const books = await containers.bookController.getPublishedBooks(
        offset,
        limit,
      );
      res.json(books);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch books" });
    }
  });

  app.get("/api/books/all/:offset/:limit", async (req, res) => {
    const offset = parseInt(req.params.offset, 10);
    const limit = parseInt(req.params.limit, 10);

    try {
      const books = await containers.bookController.getAllBooks(offset, limit);
      res.json(books);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch all books" });
    }
  });

  app.post("/api/book", async (req, res) => {
    try {
      const { title, author } = req.body as BookCreate;

      if (!title || !author) {
        return res.status(400).json({ error: "Title and author are required" });
      }
      if (typeof title !== "string" || typeof author !== "string") {
        return res
          .status(400)
          .json({ error: "Title and author must be strings" });
      }
      const book = await containers.bookController.createBook(title, author);
      res.status(201).json(book);
    } catch (error) {
      res.status(500).json({ error: "Failed to create book" });
    }
  });

  app.get("/api/book/:id", async (req, res) => {
    try {
      const book = await containers.bookController.getById(req.params.id);
      if (!book) {
        return res.status(404).json({ error: "Book not found" });
      }
      res.json(book);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch book" });
    }
  });

  app.put("/api/book/:id/publish", async (req, res) => {
    const { id } = req.params;
    try {
      const book = await containers.bookController.publishBook(id);
      res.json(book);
    } catch (error) {
      res.status(500).json({ error: "Failed to publish book" });
    }
  });

  app.put("/api/book/:id/unpublish", async (req, res) => {
    const { id } = req.params;
    try {
      const book = await containers.bookController.unPublishBook(id);
      res.json(book);
    } catch (error) {
      res.status(500).json({ error: "Failed to unpublish book" });
    }
  });

  app.post("/api/book/:id/chapter", async (req, res) => {
    const { id } = req.params;
    const { chapter_number, title } = req.body as BookChapterCreate;

    if (!chapter_number || !title) {
      return res
        .status(400)
        .json({ error: "Chapter number and title are required" });
    }

    if (typeof chapter_number !== "number" || typeof title !== "string") {
      return res.status(400).json({ error: "Invalid chapter data" });
    }

    try {
      const chapter = await containers.bookChapterController.createChapter(
        id,
        chapter_number,
        title,
      );
      res.status(201).json(chapter);
    } catch (error) {
      res.status(500).json({ error: "Failed to create chapter" });
    }
  });

  app.post("/api/book/:id/page", async (req, res) => {
    const { id } = req.params;
    const { chapter_id, content, page_number, paragraph_continues } =
      req.body as BookPageCreate;

    if (
      !chapter_id ||
      !content ||
      !page_number ||
      paragraph_continues === undefined
    ) {
      return res
        .status(400)
        .json({
          error:
            "chapter_id, content, page_number and paragraph_continues are required",
        });
    }

    if (
      typeof chapter_id !== "string" ||
      typeof content !== "string" ||
      typeof page_number !== "number" ||
      typeof paragraph_continues !== "boolean"
    ) {
      return res.status(400).json({ error: "Invalid page data" });
    }

    try {
      const bookPage = await containers.bookPageController.createBookPage(
        id,
        chapter_id,
        page_number,
        content,
        paragraph_continues,
      );
      res.status(201).json(bookPage);
    } catch (error) {
      res.status(500).json({ error: "Failed to create book page" });
    }
  });

  app.get("/api/book/:id/page/:page", async (req, res) => {
    const { id, page } = req.params;
    try {
      const bookPage = await containers.bookPageController.getBookPage(
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

  // Start server
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
};

main();
