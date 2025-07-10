import { Book, BookChunk } from "@shared/types";
import axios from "axios";

const request = axios.create({
  baseURL: "http://localhost:3001",
});

class ExtAPI {
  static async getBookList(): Promise<Book[]> {
    const response = await request.get("/api/books");
    return response.data;
  }

  static async getBookInfo(id: string): Promise<Book> {
    const response = await request.get(`/api/books/${id}`);
    return response.data;
  }

  private static bookChunkCache: Map<
    string,
    { chunks: BookChunk[]; maxOffset: number | null }
  > = new Map();

  static async getBookChunk(
    bookId: string,
    offset: number,
  ): Promise<BookChunk | "REACHED_MAX"> {
    if (offset < 0) {
      throw new Error("Offset must be a non-negative integer.");
    }
    // Check if the chunk is already cached
    let cached = this.bookChunkCache.get(bookId);
    if (cached) {
      if (cached.maxOffset !== null && offset > cached.maxOffset) {
        return "REACHED_MAX";
      }

      // TODO: Binary search
      const chunk = cached.chunks.find(
        (c) => c.offset_start <= offset && c.offset_end >= offset,
      );

      if (chunk) {
        return chunk;
      }
    } else {
      cached = { maxOffset: null, chunks: [] };
      this.bookChunkCache.set(bookId, cached);
    }

    try {
      const response = await request.get(
        `/api/books/${bookId}/chunk/${offset}`,
      );

      // TODO: Sort chunks by offset_start
      cached.chunks.push(response.data);

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        cached.maxOffset = offset - 1;
        return "REACHED_MAX";
      }
      throw error;
    }
  }
}

export default ExtAPI;
