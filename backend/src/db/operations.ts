import { db } from "./index";
import { v4 as uuidv4 } from "uuid";
import {
  Book,
  BookChapter,
  BookPage,
  BookDetail,
  BookPageDetail,
} from "@shared/types";

// Helper function to generate UUID
const generateId = () => uuidv4();

// Book operations
export const bookOperations = {
  async getAll(): Promise<Book[]> {
    const books = await db.all<Book>(
      "SELECT * FROM books where status = 'published'",
    );
    return books;
  },

  async getById(id: string): Promise<BookDetail | null> {
    const book = await db.get<Book>("SELECT * FROM books WHERE id = ?", [id]);

    const totalPages = await db.get<{ total_pages: number }>(
      "SELECT MAX(page_number) AS total_pages FROM book_pages WHERE book_id = ?",
      [id],
    );

    if (!book) return null;

    return {
      ...book,
      total_pages: totalPages ? totalPages.total_pages : 0,
    };
  },

  async createBook(title: string, author: string): Promise<Book> {
    const bookId = generateId();
    const createdAt = new Date().toISOString();
    await db.run(
      "INSERT INTO books (id, title, author, status, created_at) VALUES (?, ?, ?, ?, ?)",
      [bookId, title, author, "draft", createdAt],
    );

    return {
      id: bookId,
      title: title,
      author: author,
      status: "draft",
      created_at: createdAt,
    };
  },
};

export const bookChapterOperations = {
  async createChapter(
    bookId: string,
    chapterNumber: number,
    title: string,
  ): Promise<BookChapter> {
    const chapterId = generateId();
    const createdAt = new Date().toISOString();

    await db.run(
      "INSERT INTO book_chapters (id, book_id, chapter_number, title, created_at) VALUES (?, ?, ?, ?, ?)",
      [chapterId, bookId, chapterNumber, title, createdAt],
    );

    return {
      id: chapterId,
      book_id: bookId,
      chapter_number: chapterNumber,
      title: title,
      created_at: createdAt,
    };
  },
};

export const bookPageOperations = {
  async getBookPage(
    boodId: string,
    pageNumber: number,
  ): Promise<BookPageDetail | null> {
    const bookPage = await db.get<BookPage>(
      "SELECT * FROM book_pages WHERE book_id = ? AND page_number = ?",
      [boodId, pageNumber],
    );
    if (!bookPage) return null;

    const isFirstPageOfChapter = await db.get<{ is_first: number }>(
      "SELECT COUNT(*) AS is_first FROM book_pages WHERE book_id = ? AND chapter_id = ? AND page_number < ?",
      [boodId, bookPage.chapter_id, pageNumber],
    );

    let chapterTitle: string | null = null;

    if (isFirstPageOfChapter && isFirstPageOfChapter.is_first === 0) {
      const chapter = await db.get<BookChapter>(
        "SELECT title FROM book_chapters WHERE id = ?",
        [bookPage.chapter_id],
      );
      chapterTitle = chapter ? chapter.title : null;
    }

    return {
      ...bookPage,
      chapter_title: chapterTitle,
    };
  },

  async createBookPage(
    bookId: string,
    chapterId: string,
    pageNumber: number,
    content: string,
  ): Promise<BookPage> {
    const bookPageId = generateId();
    const createdAt = new Date().toISOString();

    const contentLength = content.length;

    if (contentLength === 0) {
      throw new Error("Content cannot be empty");
    }

    let offsetStart = 0;

    if (pageNumber > 1) {
      const lastPage = await db.get<BookPage>(
        "SELECT offset_end FROM book_pages WHERE book_id = ? AND page_number = ?",
        [bookId, pageNumber - 1],
      );
      if (!lastPage) {
        throw new Error("Previous page not found");
      }
      offsetStart = lastPage.offset_end + 1;
    }

    const offsetEnd = offsetStart + contentLength - 1;

    await db.run(
      "INSERT INTO book_pages (id, book_id, chapter_id, content, page_number, content_length, offset_start, offset_end, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        bookPageId,
        bookId,
        chapterId,
        content,
        pageNumber,
        contentLength,
        offsetStart,
        offsetEnd,
        createdAt,
      ],
    );

    return {
      id: bookPageId,
      book_id: bookId,
      chapter_id: chapterId,
      content,
      page_number: pageNumber,
      content_length: contentLength,
      offset_start: offsetStart,
      offset_end: offsetEnd,
      created_at: createdAt,
    };
  },
};
