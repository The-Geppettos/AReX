import { createVectorSearchTool } from "./VectorSearch";
import { createReadPageTool } from "./ReadPage";
import { BookPagesTable } from "@src/component/coredb/tables/bookPage";
import { BookSearchCollection } from "@src/component/vectordb/collections/bookSearch";
import { StructuredTool } from "@langchain/core/tools";

export function createAgentTools(
  bookId: string,
  bookPagesTable: BookPagesTable,
  bookSearchCollection: BookSearchCollection,
  lastPageRead: number,
): StructuredTool[] {
  return [
    createReadPageTool(bookId, bookPagesTable, lastPageRead),
    createVectorSearchTool(bookId, bookSearchCollection, lastPageRead),
  ];
}
