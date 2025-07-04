import { Book, BookWithChunkList } from "@shared/types";
import axios from "axios";

const request = axios.create({
  baseURL: "http://localhost:3001",
});

class Request {
  static async getBooks(): Promise<Book[]> {
    const response = await request.get("/api/books");
    return response.data;
  }

  static async getBookById(id: string): Promise<BookWithChunkList> {
    const response = await request.get(`/api/books/${id}`);
    return response.data;
  }
}

export default Request;