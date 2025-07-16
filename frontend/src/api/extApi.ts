import type { Book, BookChunk, BookDetail } from "@shared/types";
import axios from "axios";

const request = axios.create({
  baseURL: "http://localhost:3001",
});

class ExtAPI {
  static async getBookList(): Promise<Book[]> {
    const response = await request.get("/api/books");
    return response.data;
  }

  static async getBookInfo(id: string): Promise<BookDetail> {
    const response = await request.get(`/api/books/${id}`);
    return response.data;
  }

  private static bookChunkCache: Map<string, BookChunk[]> = new Map();

  static async getBookChunk(
    bookId: string,
    offset: number,
  ): Promise<BookChunk> {
    if (offset < 0) {
      throw new Error("Offset must be a non-negative integer.");
    }
    // Check if the chunk is already cached
    let cached = this.bookChunkCache.get(bookId);
    if (cached) {
      // TODO: Binary search
      const chunk = cached.find(
        (c) => c.offset_start <= offset && c.offset_end >= offset,
      );

      if (chunk) {
        return chunk;
      }
    } else {
      cached = [];
      this.bookChunkCache.set(bookId, cached);
    }

    const response = await request.get(`/api/books/${bookId}/chunk/${offset}`);

    // TODO: Sort chunks by offset_start
    cached.push(response.data);

    return response.data;
  }
}

export default ExtAPI;
