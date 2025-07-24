import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { bookChapterOperations, bookOperations } from "./db/operations";
import { bookPageOperations } from "./db/operations";
import { initializeDatabase } from "./db";
import { BookChapterCreate, BookCreate, BookPageCreate } from "@shared/types";

dotenv.config();

const port = process.env.PORT || 3001;
const app = express();

const main = async () => {
  // Initialize database
  await initializeDatabase();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Basic health check endpoint
  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // Book endpoints
  app.get("/api/books", async (_req, res) => {
    try {
      const books = await bookOperations.getAll();
      res.json(books);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch books" });
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
      const book = await bookOperations.createBook(title, author);
      res.status(201).json(book);
    } catch (error) {
      res.status(500).json({ error: "Failed to create book" });
    }
  });

  app.get("/api/book/:id", async (req, res) => {
    try {
      const book = await bookOperations.getById(req.params.id);
      if (!book) {
        return res.status(404).json({ error: "Book not found" });
      }
      res.json(book);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch book" });
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
      const chapter = await bookChapterOperations.createChapter(
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
    const { chapter_id, content, page_number } = req.body as BookPageCreate;

    if (!chapter_id || !content || !page_number) {
      return res
        .status(400)
        .json({ error: "Chapter ID, content, and page number are required" });
    }

    if (
      typeof chapter_id !== "string" ||
      typeof content !== "string" ||
      typeof page_number !== "number"
    ) {
      return res.status(400).json({ error: "Invalid page data" });
    }

    try {
      const bookPage = await bookPageOperations.createBookPage(
        id,
        chapter_id,
        page_number,
        content,
      );
      res.status(201).json(bookPage);
    } catch (error) {
      res.status(500).json({ error: "Failed to create book page" });
    }
  });

  app.get("/api/book/:id/page/:page", async (req, res) => {
    const { id, page } = req.params;
    try {
      const bookPage = await bookPageOperations.getBookPage(id, parseInt(page));
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
