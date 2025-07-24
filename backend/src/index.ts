import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { bookOperations } from "./db/operations";
import { bookPageOperations } from "./db/operations";
import { initializeDatabase } from "./db";

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

  app.get("/api/book/:id/page/:page", async (req, res) => {
    const { id, page } = req.params;
    try {
      const bookPage = await bookPageOperations.getBookPage(
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
