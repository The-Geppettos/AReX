import { VectorSearchTool } from "./VectorSearch";
import { ReadPageTool } from "./ReadPage";
import { BookPagesTable } from "@src/component/coredb/tables/bookPage";
import { BookSearchCollection } from "@src/component/vectordb/collections/bookSearch";
import { Tool } from "./abstract";
import { ChatCompletionTool } from "openai/resources";

export class ToolManager {
  private tools: Map<string, Tool>;

  private constructor() {
    this.tools = new Map();
  }

  registerTool(tool: any) {
    this.tools.set(tool.name, tool);
  }

  get toolDefinitions(): ChatCompletionTool[] {
    return Array.from(this.tools.values()).map((tool) => ({
      type: "function",
      function: tool.definition,
    }));
  }

  async callTool(toolName: string, args: string): Promise<string> {
    const tool = this.tools.get(toolName);
    if (!tool) {
      return `Tool "${toolName}" not found.`;
    }
    try {
      args = JSON.parse(args);
      const result = await tool.call(args);
      return result;
    } catch (error) {
      return `Error calling tool "${toolName}": ${error}`;
    }
  }

  static create(
    bookId: string,
    bookPagesTable: BookPagesTable,
    bookSearchCollection: BookSearchCollection,
    lastPageRead: number,
  ): ToolManager {
    const toolManager = new ToolManager();
    toolManager.registerTool(
      new ReadPageTool(bookId, bookPagesTable, lastPageRead),
    );
    toolManager.registerTool(
      new VectorSearchTool(bookId, bookSearchCollection, lastPageRead),
    );
    return toolManager;
  }
}
