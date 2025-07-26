import { generateId } from "../util";
import MainDB from "../dbclient/maindb";
import { Book, BookDetail, BookList } from "@shared/types";

export default class BookController {
  static async getPublishedBooks(
    offset: number,
    limit: number,
  ): Promise<BookList> {
    const total = await MainDB.get<{ total: number }>(
      "SELECT COUNT(*) AS total FROM books WHERE status = 'published'",
    );
    if (!total) {
      throw new Error("Failed to fetch total count of published books");
    }
    const books = await MainDB.all<Book>(
      "SELECT * FROM books WHERE status = 'published' ORDER BY updated_at DESC LIMIT ? OFFSET ?",
      [limit, offset],
    );
    return {
      books,
      offset,
      limit,
      total: total.total,
    };
  }

  static async getAllBooks(offset: number, limit: number): Promise<BookList> {
    const total = await MainDB.get<{ total: number }>(
      "SELECT COUNT(*) AS total FROM books",
    );
    if (!total) {
      throw new Error("Failed to fetch total count of books");
    }
    const books = await MainDB.all<Book>(
      "SELECT * FROM books ORDER BY updated_at DESC LIMIT ? OFFSET ?",
      [limit, offset],
    );
    return {
      books,
      offset,
      limit,
      total: total.total,
    };
  }

  static async publishBook(id: string): Promise<Book> {
    const updatedAt = new Date().toISOString();
    await MainDB.run(
      "UPDATE books SET status = 'published', updated_at = ? WHERE id = ?",
      [updatedAt, id],
    );

    const book = await MainDB.get<Book>("SELECT * FROM books WHERE id = ?", [
      id,
    ]);

    if (!book) {
      throw new Error("Book not found");
    }
    if (book.status !== "published") {
      throw new Error("Publish failed");
    }

    return book;
  }

  static async unPublishBook(id: string): Promise<Book> {
    const updatedAt = new Date().toISOString();
    await MainDB.run(
      "UPDATE books SET status = 'draft', updated_at = ? WHERE id = ?",
      [updatedAt, id],
    );

    const book = await MainDB.get<Book>("SELECT * FROM books WHERE id = ?", [
      id,
    ]);

    if (!book) {
      throw new Error("Book not found");
    }
    if (book.status !== "draft") {
      throw new Error("Unpublish failed");
    }

    return book;
  }

  static async getById(id: string): Promise<BookDetail | null> {
    const book = await MainDB.get<Book>("SELECT * FROM books WHERE id = ?", [
      id,
    ]);

    const totalPages = await MainDB.get<{ total_pages: number }>(
      "SELECT MAX(page_number) AS total_pages FROM book_pages WHERE book_id = ?",
      [id],
    );

    if (!book) return null;

    return {
      ...book,
      total_pages: totalPages ? totalPages.total_pages : 0,
    };
  }

  static async createBook(title: string, author: string): Promise<Book> {
    const bookId = generateId();
    const createdAt = new Date().toISOString();
    const updatedAt = createdAt;
    await MainDB.run(
      "INSERT INTO books (id, title, author, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
      [bookId, title, author, "draft", createdAt, updatedAt],
    );

    return {
      id: bookId,
      title: title,
      author: author,
      status: "draft",
      created_at: createdAt,
      updated_at: updatedAt,
    };
  }
}
