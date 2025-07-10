import { ContentAnalysis } from "@shared/types";
import axios from "axios";

const request = axios.create({
  baseURL: "http://localhost:3002",
});

class ExtAPI {
  static async parseContent(content: string): Promise<ContentAnalysis> {
    const response = await request.post("/api/parse-content", { content });
    return response.data;
  }
}

export default ExtAPI;
