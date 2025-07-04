import { db } from "./index";
import { v4 as uuidv4 } from "uuid";
import { Book, BookChunk, BookWithChunkList } from "@shared/types";
import Request from "../request";

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

  async getById(id: string): Promise<BookWithChunkList | null> {
    const book = await db.get<Book>("SELECT * FROM books WHERE id = ?", [id]);
    if (!book) return null;

    const bookChunks = await db.all<BookChunk>(
      "SELECT * FROM book_chunks WHERE book_id = ? ORDER BY word_count_cumulative",
      [id]
    );

    const bookWithChunkList: BookWithChunkList = {
      ...book,
      chunk_list: bookChunks.map((chunk) => chunk.id),
    };

    return bookWithChunkList;
  },

  async createBook(title: string, author: string): Promise<Book> {
    const bookId = generateId();
    const createdAt = new Date().toISOString();
    await db.run("INSERT INTO books (id, title, author, created_at) VALUES (?, ?, ?, ?)", [
      bookId,
      title,
      author,
      createdAt,
    ]);

    return {
      id: bookId,
      title: title,
      author: author,
      created_at: createdAt,
    };
  },
};

export const bookChunkOperations = {
  async getBookChunk(id: string): Promise<BookChunk | null> {
    const bookChunk = await db.get<BookChunk>("SELECT * FROM book_chunks WHERE id = ?", [id]);
    if (!bookChunk) return null;

    return bookChunk;
  },

  async createBookChunk(bookId: string, content: string): Promise<BookChunk> {
    const bookChunkId = generateId();
    const createdAt = new Date().toISOString();

    const wordCount = content.split(" ").length;

    let wordCountCumulative = 0;
    const lastChunk = await db.get<{ word_count_cumulative: number }>("SELECT word_count_cumulative FROM book_chunks WHERE book_id = ? ORDER BY word_count_cumulative DESC LIMIT 1", [bookId]);
    if (!lastChunk) {
      wordCountCumulative = 0;
    } else {
      wordCountCumulative = lastChunk.word_count_cumulative;
    } 

    const aiResponse = await Request.parseContent(content);
    console.log(aiResponse);

    await db.run("INSERT INTO book_chunks (id, book_id, content, word_count, word_count_cumulative, created_at) VALUES (?, ?, ?, ?, ?, ?)", [
      bookChunkId,
      bookId,
      content,
      wordCount,
      wordCountCumulative + wordCount,
      createdAt,
    ]);

    return {
      id: bookChunkId,
      book_id: bookId,
      content,
      word_count: wordCount,
      word_count_cumulative: wordCountCumulative + wordCount,
      created_at: createdAt,
    };
  },
}