import type { HTTPServer } from "@src/component/httpserver";
import type { BookService } from "@src/services/book";
import { Controller, type Route } from "./abstract";

export class BookController extends Controller {
  private bookService: BookService;

  constructor(httpServer: HTTPServer, bookService: BookService) {
    super(httpServer);
    this.bookService = bookService;
  }

  override routes: Route[] = [
    {
      path: "/api/books/published/:offset/:limit",
      method: "get",
      handler: async (req, res) => {
        const offset = parseInt(req.params.offset, 10);
        const limit = parseInt(req.params.limit, 10);

        try {
          const books = await this.bookService.getPublishedBooks(offset, limit);
          res.json(books);
        } catch (error) {
          res.status(500).json({ error: "Failed to fetch books" });
        }
      },
    },
    {
      path: "/api/books/unpublished/:offset/:limit",
      method: "get",
      handler: async (req, res) => {
        const offset = parseInt(req.params.offset, 10);
        const limit = parseInt(req.params.limit, 10);

        try {
          const books = await this.bookService.getAllBooks(offset, limit);
          res.json(books);
        } catch (error) {
          res.status(500).json({ error: "Failed to fetch all books" });
        }
      },
    },
    {
      path: "/api/books/all/:offset/:limit",
      method: "get",
      handler: async (req, res) => {
        const offset = parseInt(req.params.offset, 10);
        const limit = parseInt(req.params.limit, 10);

        try {
          const books = await this.bookService.getAllBooks(offset, limit);
          res.json(books);
        } catch (error) {
          res.status(500).json({ error: "Failed to fetch all books" });
        }
      },
    },
    {
      path: "/api/book/:id",
      method: "get",
      handler: async (req, res) => {
        try {
          const book = await this.bookService.getById(req.params.id);
          if (!book) {
            return res.status(404).json({ error: "Book not found" });
          }
          res.json(book);
        } catch (error) {
          res.status(500).json({ error: "Failed to fetch book" });
        }
      },
    },
    {
      path: "/api/book/:id/publish",
      method: "put",
      handler: async (req, res) => {
        const { id } = req.params;
        try {
          const book = await this.bookService.publishBook(id);
          res.json(book);
        } catch (error) {
          res.status(500).json({ error: "Failed to publish book" });
        }
      },
    },
    {
      path: "/api/book/:id/unpublish",
      method: "put",
      handler: async (req, res) => {
        const { id } = req.params;
        try {
          const book = await this.bookService.unPublishBook(id);
          res.json(book);
        } catch (error) {
          res.status(500).json({ error: "Failed to unpublish book" });
        }
      },
    },
  ];
}
