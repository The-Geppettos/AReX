import type { Book, BookDetail, BookPageDetail } from "@shared/types";
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
    const response = await request.get(`/api/book/${id}`);
    return response.data;
  }

  private static bookPageCache: Map<string, Map<number, BookPageDetail>> =
    new Map();

  static async getBookPage(
    bookId: string,
    page_number: number,
  ): Promise<BookPageDetail> {
    let cached = this.bookPageCache.get(bookId);
    if (cached) {
      const bookPage = cached.get(page_number);

      if (bookPage) {
        return bookPage;
      }
    } else {
      cached = new Map<number, BookPageDetail>();
      this.bookPageCache.set(bookId, cached);
    }

    const response = await request.get(
      `/api/book/${bookId}/page/${page_number}`,
    );

    cached.set(page_number, response.data);

    return response.data;
  }
}

export default ExtAPI;
