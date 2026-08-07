import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { type BookPagesTable } from "@src/component/coredb/tables/bookPage";

export const createReadPageTool = (
  bookId: string,
  bookPagesTable: BookPagesTable,
  lastPageRead: number,
) => {
  const schema = z.object({
    page: z
      .number()
      .int()
      .min(1)
      .max(lastPageRead)
      .describe(
        `The page number to fetch. Page numbers start at 1, and must be less than or equal to the last page number that has been read (${lastPageRead}).`,
      ),
  });

  return tool(
    async ({ page }) => {
      const pageContent = await bookPagesTable.getByBookIdAndPageNumber(
        bookId,
        page,
      );

      if (!pageContent) {
        return `Page ${page} does not exist in the book.`;
      }

      return `[Page ${page}]\n${pageContent.content}`;
    },
    {
      name: "read_page",
      description:
        "Fetch the raw content of a specific page in the novel. Use this when you know " +
        "the page number you should look for, or when you want to read the surrounding context " +
        "(what comes before/after) around a result found via `vector_search.`",
      schema,
    },
  );
};
