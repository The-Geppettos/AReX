import type { HTTPServer } from "@src/component/httpserver";
import type { BookUploadService } from "@src/services/bookUpload";
import { Controller, type Route } from "./abstract";
import { LANGUAGES, PAGE_TRANSITION_TYPES } from "@shared/book";

export class BookUploadController extends Controller {
  private bookUploadService: BookUploadService;

  constructor(httpServer: HTTPServer, bookUploadService: BookUploadService) {
    super(httpServer);
    this.bookUploadService = bookUploadService;
  }

  override routes: Route[] = [
    {
      path: "/api/book_upload/book",
      method: "post",
      handler: async (req, res) => {
        try {
          const { title, author, language } = req.body;

          if (!title || !author) {
            return res
              .status(400)
              .json({ error: "Title and author are required" });
          }
          if (typeof title !== "string" || typeof author !== "string") {
            return res
              .status(400)
              .json({ error: "Title and author must be strings" });
          }
          if (!LANGUAGES.includes(language)) {
            return res.status(400).json({
              error: `Language must be one of ${LANGUAGES.join(", ")}`,
            });
          }
          const book = await this.bookUploadService.uploadBook(
            title,
            author,
            language,
          );
          res.status(201).json(book);
        } catch (error) {
          res.status(500).json({ error: "Failed to create book" });
        }
      },
    },
    {
      path: "/api/book_upload/chapter",
      method: "post",
      handler: async (req, res) => {
        const { book_id, chapter_number, title } = req.body;

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
          const chapter = await this.bookUploadService.uploadChapter(
            book_id,
            chapter_number,
            title,
          );
          res.status(201).json(chapter);
        } catch (error) {
          res.status(500).json({ error: "Failed to create chapter" });
        }
      },
    },
    {
      path: "/api/book_upload/page",
      method: "post",
      handler: async (req, res) => {
        const {
          book_id,
          chapter_id,
          content,
          page_number,
          page_transition_type,
        } = req.body;

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
          const bookPage = await this.bookUploadService.uploadPage(
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
      },
    },
    {
      path: "/api/book_upload/finish/:id",
      method: "post",
      handler: async (req, res) => {
        try {
          const { id } = req.params;

          const book = await this.bookUploadService.finishUpload(id);
          if (!book) {
            return res.status(404).json({ error: "Book not found" });
          }
          res.status(200).json(book);
        } catch (error) {
          res.status(500).json({ error: "Failed to update book" });
        }
      },
    },
  ];
}
