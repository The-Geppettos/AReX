import { tool } from "@langchain/core/tools";
import { z } from "zod";
import type { BookSearchCollection } from "@src/component/vectordb/collections/bookSearch";

const MAX_TOP_K = 20;

export const createVectorSearchTool = (
  bookId: string,
  bookSearchCollection: BookSearchCollection,
  lastPageRead: number,
) => {
  const schema = z
    .object({
      query: z.string().describe("The natural-language search query"),
      top_k: z
        .number()
        .int()
        .min(1)
        .max(MAX_TOP_K)
        .default(5)
        .describe(
          `Number of results to return (default 5, maximum ${MAX_TOP_K}`,
        ),
      page_from: z
        .number()
        .int()
        .min(1)
        .max(lastPageRead)
        .default(1)
        .describe(
          "The starting page number to search from (inclusive). Default is 1.",
        ),
      page_to: z
        .number()
        .int()
        .min(1)
        .max(lastPageRead)
        .default(lastPageRead)
        .describe(
          `The ending page number to search to (inclusive). Default is the last page number that has been read (${lastPageRead}).`,
        ),
    })
    .refine((data) => data.page_to >= data.page_from, {
      message: "'page_to' cannot be less than 'page_from'",
      path: ["page_to"],
    });

  return tool(
    async ({ query, top_k, page_from, page_to }) => {
      const searchResult = await bookSearchCollection.search(
        [query],
        bookId,
        top_k,
        page_from,
        page_to,
      );

      const result = searchResult
        .rows()
        .map((rows) =>
          rows
            .map(
              (row) =>
                `Part of page ${row.metadata?.page_number}: ${row.document}`,
            )
            .join("\n"),
        )
        .join("\n");

      return `[Search results for query "${query}"]\n${result}`;
    },
    {
      name: "vector_search",
      description:
        "Search the book for content that is semantically related to a query. " +
        "While you can limit the search to a specific range of pages, " +
        "you cannot query with metadata such as page number or chapter. " +
        "The search query must be based on the content of the book. " +
        "Use this when the exact page location is unknown, or when you need information " +
        "about a particular event, line of dialogue, or relationship. Each result includes " +
        "the matching text chunk and the page number where it appears. " +
        "You can use `page_from` and `page_to` to limit the search to a specific range of pages. " +
        "This only returns segment matches, not the full page content. If you need to read the full page, " +
        "use `read_page` tool to read the page content with the page number returned by this tool.",
      schema,
    },
  );
};
