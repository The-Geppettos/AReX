import type { BookSearchCollection } from "@src/component/vectordb/collections/bookSearch";
import { Tool } from "./abstract";

const MAX_TOP_K = 20;

export class VectorSearchTool extends Tool {
  private bookId: string;
  private bookSearchCollection: BookSearchCollection;
  private lastPageRead: number;

  name = "vector_search";

  definition = {
    name: this.name,
    description:
      "Search the book for content that is semantically related to a query. " +
      "Use this when the exact page location is unknown, or when you need information " +
      "about a particular event, line of dialogue, or relationship. Each result includes " +
      "the matching text chunk and the page number where it appears. " +
      "You can use `page_from` and `page_to` to limit the search to a specific range of pages. " +
      "This only returns segment matches, not the full page content. If you need to read the full page, " +
      "use `read_page` tool to read the page content with the page number returned by this tool.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The natural-language search query",
        },
        top_k: {
          type: "number",
          description: "Number of results to return (default 5)",
        },
        page_from: {
          type: "number",
          description:
            "The starting page number to search from (inclusive). Default is 1.",
        },
        page_to: {
          type: "number",
          description:
            "The ending page number to search to (inclusive). Default is the last page number that has been read.",
        },
      },
      required: ["query"],
    },
  };

  async call(args: any): Promise<string> {
    if (!args || typeof args !== "object") {
      return "Invalid input: Input must be a JSON object.";
    }
    let { query, topK = 5, pageFrom = 1, pageTo = this.lastPageRead } = args;

    const logs = [];

    if (!query) {
      return "Invalid input: 'query' is required.";
    }
    if (typeof query !== "string") {
      return "Invalid input: 'query' must be a string.";
    }

    topK = typeof topK === "number" ? topK : parseInt(topK);

    if (isNaN(topK)) {
      return "Invalid input: 'topK' must be a number.";
    }

    if (topK < 1) {
      return "Invalid input: 'topK' must be at least 1.";
    }

    if (topK > MAX_TOP_K) {
      logs.push(
        `Note: 'topK' has been capped at ${MAX_TOP_K} to prevent excessive resource usage.`,
      );
      topK = MAX_TOP_K;
    }

    pageFrom = typeof pageFrom === "number" ? pageFrom : parseInt(pageFrom);
    if (typeof pageFrom !== "number" || isNaN(pageFrom) || pageFrom < 1) {
      return "Invalid input: 'pageFrom' must be a non-negative number.";
    }
    if (pageFrom > this.lastPageRead) {
      return `Invalid input: 'pageFrom' cannot be greater than ${this.lastPageRead}.`;
    }

    pageTo = typeof pageTo === "number" ? pageTo : parseInt(pageTo);
    if (typeof pageTo !== "number" || isNaN(pageTo) || pageTo < 1) {
      return "Invalid input: 'pageTo' must be a non-negative number.";
    }
    if (pageTo > this.lastPageRead) {
      return `Invalid input: 'pageTo' cannot be greater than ${this.lastPageRead}.`;
    }

    if (pageTo < pageFrom) {
      return "Invalid input: 'pageTo' cannot be less than 'pageFrom'.";
    }

    const searchResult = await this.bookSearchCollection.search(
      [query],
      this.bookId,
      topK,
      pageFrom,
      pageTo,
    );

    let result = searchResult
      .rows()
      .map((rows) =>
        rows
          .map(
            (row) =>
              `[Part of page ${row.metadata?.page_number}]\n${row.document}`,
          )
          .join("\n"),
      )
      .join("\n");

    if (logs) {
      result = `${logs.join("\n")}\n\n${result}`;
    }

    return result;
  }

  constructor(
    bookId: string,
    bookSearchCollection: BookSearchCollection,
    lastPageRead: number,
  ) {
    super();
    this.bookId = bookId;
    this.bookSearchCollection = bookSearchCollection;
    this.lastPageRead = lastPageRead;
  }
}
