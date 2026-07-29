import { type BookPagesTable } from "@src/component/coredb/tables/bookPage";
import { Tool } from "./abstract";

export class ReadPageTool extends Tool {
  private bookId;
  private bookPagesTable;
  private lastPageRead;

  name = "read_page";

  definition = {
    name: this.name,
    description:
      "Fetch the raw content of a specific page in the novel. Use this when you know " +
      "the page number you should look for, or when you want to read the surrounding context " +
      "(what comes before/after) around a result found via `vector_search.`",
    parameters: {
      type: "object",
      properties: {
        page: {
          type: "number",
          description:
            "The age number to fetch. Page numbers start at 1, and must be less than or equal to the last page number that has been read.",
        },
      },
      required: ["page"],
    },
  };

  async call(args: any): Promise<string> {
    if (!args || typeof args !== "object") {
      return "Invalid input: Input must be a JSON object.";
    }
    let { page } = args;

    if (page === undefined) {
      return "Invalid input: 'page' is required.";
    }
    if (typeof page !== "number") {
      return "Invalid input: 'page' must be a number.";
    }

    if (isNaN(page) || page < 1) {
      return "Invalid input: 'page' must be a positive integer.";
    }

    if (page > this.lastPageRead) {
      return `Invalid input: 'page' cannot be greater than the last page read (${this.lastPageRead}).`;
    }

    const pageContent = await this.bookPagesTable.getByBookIdAndPageNumber(
      this.bookId,
      page,
    );

    if (!pageContent) {
      return `Page ${page} does not exist in the book.`;
    }

    return `[Page ${page}]\n${pageContent.content}`;
  }

  constructor(
    bookId: string,
    bookPagesTable: BookPagesTable,
    lastPageRead: number,
  ) {
    super();
    this.bookId = bookId;
    this.bookPagesTable = bookPagesTable;
    this.lastPageRead = lastPageRead;
  }
}
