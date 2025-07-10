import { db } from "./index";
import { v4 as uuidv4 } from "uuid";
import { Book, BookChunk } from "@shared/types";

// Helper function to generate UUID
const generateId = () => uuidv4();

// Book operations
export const bookOperations = {
  async getAll(): Promise<Book[]> {
    const books = await db.all<Book>("SELECT * FROM books");
    return books.map((book) => ({
      id: book.id,
      title: book.title,
      author: book.author,
      created_at: book.created_at,
    }));
  },

  async getById(id: string): Promise<Book | null> {
    const book = await db.get<Book>("SELECT * FROM books WHERE id = ?", [id]);
    if (!book) return null;

    return book;
  },

  async createBook(title: string, author: string): Promise<Book> {
    const bookId = generateId();
    const createdAt = new Date().toISOString();
    await db.run(
      "INSERT INTO books (id, title, author, created_at) VALUES (?, ?, ?, ?)",
      [bookId, title, author, createdAt],
    );

    return {
      id: bookId,
      title: title,
      author: author,
      created_at: createdAt,
    };
  },
};

export const bookChunkOperations = {
  async getBookChunkByOffset(
    boodId: string,
    offset: number,
  ): Promise<BookChunk | null> {
    const bookChunk = await db.get<BookChunk>(
      "SELECT * FROM book_chunks WHERE book_id = ? AND offset_start <= ? AND offset_end >= ?",
      [boodId, offset, offset],
    );
    if (!bookChunk) return null;

    return bookChunk;
  },

  async createBookChunk(bookId: string, chunk: string): Promise<BookChunk> {
    const bookChunkId = generateId();
    const createdAt = new Date().toISOString();

    const chunkLength = chunk.length;

    if (chunkLength === 0) {
      throw new Error("Chunk cannot be empty");
    }

    const lastChunk = await db.get<BookChunk>(
      "SELECT offset_end FROM book_chunks WHERE book_id = ? ORDER BY offset_end DESC LIMIT 1",
      [bookId],
    );

    let offsetStart = 0;
    if (lastChunk) {
      offsetStart = lastChunk.offset_end + 1;
    }

    const offsetEnd = offsetStart + chunkLength - 1;

    await db.run(
      "INSERT INTO book_chunks (id, book_id, chunk, chunk_length, offset_start, offset_end, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        bookChunkId,
        bookId,
        chunk,
        chunkLength,
        offsetStart,
        offsetEnd,
        createdAt,
      ],
    );

    return {
      id: bookChunkId,
      book_id: bookId,
      chunk,
      chunk_length: chunkLength,
      offset_start: offsetStart,
      offset_end: offsetEnd,
      created_at: createdAt,
    };
  },
};
