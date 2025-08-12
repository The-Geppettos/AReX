import type { Book, BookList } from "@shared/types";
import axios from "axios";

const axiosInstance = axios.create();

export class BookManageAPI {
  static async getBookList(offset: number, limit: number): Promise<BookList> {
    const response = await axiosInstance.get(
      `/api/books/all/${offset}/${limit}`,
    );
    return response.data;
  }

  static async publishBook(id: string): Promise<Book> {
    const response = await axiosInstance.put(`/api/book/${id}/publish`);
    return response.data;
  }

  static async unPublishBook(id: string): Promise<Book> {
    const response = await axiosInstance.put(`/api/book/${id}/unpublish`);
    return response.data;
  }
}
